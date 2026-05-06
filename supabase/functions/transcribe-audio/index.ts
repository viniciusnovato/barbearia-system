// Edge Function: transcribe-audio
// 1. Recebe { audio_id }
// 2. Valida JWT do barbeiro e que ele é dono do dossiê
// 3. Baixa o áudio do bucket via service_role
// 4. Envia ao Gemini 2.5 (multimodal) pedindo transcrição + blocos + intenção
// 5. Persiste em transcript_blocks; atualiza audio_recordings.processed_at
// 6. Chama classify-fields em sequência para preencher os campos sugeridos

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { gemini } from "../_shared/gemini.ts";
import { FIELD_KEYS, INTENTS } from "../_shared/dossier-schema.ts";

const TRANSCRIBE_SCHEMA = {
  type: "object",
  properties: {
    transcript_full: { type: "string" },
    blocks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          ord: { type: "integer" },
          speaker: { type: "string", enum: ["barbeiro", "cliente", "indef"] },
          text: { type: "string" },
          start_seconds: { type: "number" },
          end_seconds: { type: "number" },
          intent: { type: "string", enum: [...INTENTS] },
          target_field_key: { type: "string", enum: FIELD_KEYS.map((f) => f.key) },
          is_noise: { type: "boolean" },
        },
        required: ["ord", "speaker", "text", "intent", "is_noise"],
      },
    },
  },
  required: ["transcript_full", "blocks"],
};

const SYSTEM = `Você é um analista de visagismo masculino que transforma diálogos entre barbeiro e cliente em blocos estruturados.

Regras:
- Identifique falantes (barbeiro/cliente). Se não conseguir distinguir, use "indef".
- Quebre a conversa em blocos curtos de 1-3 frases que contenham UMA ideia.
- Para cada bloco, classifique a intenção entre: ${INTENTS.join(", ")}.
- Marque is_noise=true e intent="ruido" para cumprimentos, confirmações vazias, piadas, gaguejos.
- Se o bloco responde a um campo do dossiê, indique target_field_key. Se não responder a nenhum, OMITA a propriedade target_field_key inteiramente (não inclua a chave).
- Campos disponíveis: ${FIELD_KEYS.map((f) => `${f.key} (${f.label})`).join("; ")}.
- Responda em PT-BR. NUNCA invente conteúdo que não está no áudio.`;

const PROMPT = `Transcreva o áudio anexo e devolva o JSON estruturado conforme o schema.
A ordem (ord) começa em 1 e segue a sequência cronológica.`;

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonRes({ error: "Método não suportado" }, 405);
  }

  try {
    const ctx = await requireUser(req);
    const body = await req.json();
    const audio_id: string | undefined = body.audio_id;
    const mode: "entrevista" | "acompanhamento" | "antes_depois" = body.mode ?? "entrevista";
    if (!audio_id) return jsonRes({ error: "audio_id obrigatório" }, 400);

    // Cliente service_role para ler/escrever ignorando RLS de leitura do storage
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const setProgress = async (progress: number, stage: string) => {
      await admin.from("audio_recordings")
        .update({ processing_progress: progress, processing_stage: stage })
        .eq("id", audio_id);
    };

    await setProgress(5, "Validando");

    // Verifica posse via cliente do user (respeita RLS)
    const { data: audio, error: aErr } = await ctx.supabase
      .from("audio_recordings")
      .select("id, dossier_id, storage_path, mime_type, media_kind")
      .eq("id", audio_id)
      .maybeSingle();
    if (aErr || !audio) return jsonRes({ error: "Áudio não encontrado ou sem permissão" }, 404);

    await setProgress(10, "Baixando arquivo");

    // Baixa o áudio/vídeo
    const { data: file, error: dErr } = await admin.storage.from("audio").download(audio.storage_path);
    if (dErr || !file) {
      await admin.from("audio_recordings").update({ error: dErr?.message ?? "download fail", processing_progress: 0 }).eq("id", audio_id);
      return jsonRes({ error: "Falha ao baixar arquivo" }, 500);
    }
    const arrayBuffer = await file.arrayBuffer();
    await setProgress(25, "Preparando para IA");
    const base64 = bytesToBase64(new Uint8Array(arrayBuffer));

    await setProgress(35, audio.media_kind === "video" ? "Transcrevendo vídeo" : "Transcrevendo áudio");

    // Chama Gemini 2.5 Flash
    let result: { transcript_full: string; blocks: BlockJson[] } | null = null;
    let rawText = "";
    try {
      const res = await gemini(PROMPT, {
        model: "gemini-2.5-flash",
        systemInstruction: SYSTEM,
        responseSchema: TRANSCRIBE_SCHEMA,
        inlineParts: [{ mimeType: audio.mime_type ?? "audio/webm", data: base64 }],
        temperature: 0.3,
        maxOutputTokens: 8192,
      });
      rawText = res.text;
      // Tenta parsing manual se o wrapper não conseguiu
      let parsed: unknown = res.json;
      if (!parsed && rawText) {
        try { parsed = JSON.parse(rawText); } catch { /* segue */ }
      }
      // Às vezes vem com cercado em ```json ... ```
      if (!parsed && rawText) {
        const m = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (m) {
          try { parsed = JSON.parse(m[1]); } catch { /* segue */ }
        }
      }
      result = parsed as { transcript_full: string; blocks: BlockJson[] } | null;
      if (!result || !Array.isArray(result.blocks)) {
        throw new Error(`Resposta da IA inválida. Texto bruto (primeiros 300): ${rawText.slice(0, 300)}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("Falha Gemini:", msg, "Raw:", rawText.slice(0, 500));
      await admin.from("audio_recordings").update({ error: msg.slice(0, 1000), processing_progress: 0 }).eq("id", audio_id);
      return jsonRes({ error: msg, raw_preview: rawText.slice(0, 300) }, 500);
    }

    await setProgress(70, "Estruturando blocos");

    // Limpa blocos antigos só agora que sabemos que a nova chamada deu certo
    await admin.from("transcript_blocks").delete().eq("audio_id", audio_id);

    // Persiste blocos
    const blocksRows = result.blocks.map((b, i) => ({
      audio_id: audio.id,
      dossier_id: audio.dossier_id,
      ord: b.ord ?? i + 1,
      speaker: b.speaker || "indef",
      text: b.text || "",
      start_seconds: b.start_seconds ?? null,
      end_seconds: b.end_seconds ?? null,
      intent: b.intent || null,
      target_field_key: b.target_field_key || null,
      is_noise: !!b.is_noise,
    }));
    if (blocksRows.length > 0) {
      const { error: insErr } = await admin.from("transcript_blocks").insert(blocksRows);
      if (insErr) console.error("insert blocks", insErr);
    }

    await admin
      .from("audio_recordings")
      .update({ processed_at: new Date().toISOString(), transcript_full: result.transcript_full, error: null })
      .eq("id", audio_id);

    await setProgress(85, "Classificando campos");

    // Classificação SÍNCRONA: aguarda terminar antes de devolver, pra que
    // a UI já encontre os campos preenchidos quando renderizar o dossiê.
    let classifiedCount = 0;
    try {
      classifiedCount = await classifyDossierFields(admin, audio.dossier_id, ctx.userId, mode);
    } catch (e) {
      console.error("classify error:", e);
      // Não falha a request — blocos já estão salvos.
    }

    await setProgress(100, "Concluído");

    return jsonRes({
      ok: true,
      blocks_count: blocksRows.length,
      fields_classified: classifiedCount,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return jsonRes({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

// ============================================================
// Classificação dos campos a partir dos blocos
// ============================================================
const CLASSIFY_SCHEMA = {
  type: "object",
  properties: {
    fields: {
      type: "array",
      items: {
        type: "object",
        properties: {
          field_key: { type: "string", enum: FIELD_KEYS.map((f) => f.key) },
          value: { type: "string" },
          source_block_ords: { type: "array", items: { type: "integer" } },
        },
        required: ["field_key", "value", "source_block_ords"],
      },
    },
  },
  required: ["fields"],
};

const CLASSIFY_SYSTEM = `Você consolida blocos de uma transcrição de visagismo em campos estruturados.

Regras:
- Para cada campo onde os blocos trouxerem evidência clara, escreva uma resposta profissional, objetiva, em PT-BR (1-2 frases).
- Não copie a fala literal — reformule em linguagem consultiva. Sem gírias, sem repetição.
- Use source_block_ords para apontar os blocos (ord) que sustentam a resposta.
- Se nenhum bloco responde um campo, NÃO inclua esse campo na saída.
- Se o cliente disser coisas contraditórias, sinalize escrevendo "Contradição: ..." no início do valor e relatando o conflito.
- Em modos "acompanhamento" e "antes_depois", também preencha summary_done: 1-2 frases descrevendo objetivamente O QUE FOI FEITO neste atendimento.`;

interface BlockJson { ord: number; speaker: string; text: string; start_seconds?: number; end_seconds?: number; intent: string; target_field_key?: string; is_noise: boolean }

const MODE_FIELDS: Record<string, string[]> = {
  entrevista: FIELD_KEYS.map((f) => f.key), // todos
  acompanhamento: ["direcionamento_tecnico", "ajustes_personalizados"],
  antes_depois: ["direcao_visual", "comunicacao_nova_imagem", "resultado_esperado", "ajustes_personalizados"],
};

async function classifyDossierFields(
  admin: ReturnType<typeof createClient>,
  dossier_id: string,
  _userId: string,
  mode: "entrevista" | "acompanhamento" | "antes_depois" = "entrevista",
): Promise<number> {
  const { data: blocks } = await admin
    .from("transcript_blocks")
    .select("id, ord, speaker, text, intent, target_field_key, is_noise")
    .eq("dossier_id", dossier_id)
    .eq("is_noise", false)
    .order("ord");
  if (!blocks || blocks.length === 0) return 0;

  const ordToId = new Map<number, string>();
  for (const b of blocks) ordToId.set(b.ord, b.id);

  const allowedFields = MODE_FIELDS[mode] ?? MODE_FIELDS.entrevista;
  const fieldList = FIELD_KEYS.filter((f) => allowedFields.includes(f.key));

  const modeContext = mode === "acompanhamento"
    ? "Este áudio é um acompanhamento curto de cliente recorrente. Foque APENAS no que foi feito/ajustado neste atendimento."
    : mode === "antes_depois"
    ? "Este áudio descreve antes/depois. Resuma a transformação e o resultado obtido, sem fazer entrevista nova."
    : "Este áudio é uma entrevista completa de visagismo. Preencha os campos do dossiê com base na conversa.";

  const prompt = `${modeContext}

Blocos da transcrição (ignore ruídos já filtrados):
${blocks.map((b) => `[${b.ord}] (${b.speaker}, intent=${b.intent}): ${b.text}`).join("\n")}

Campos disponíveis neste modo: ${fieldList.map((f) => `${f.key} (${f.label})`).join("; ")}.
Devolva o JSON conforme o schema. Inclua apenas campos com evidência.`;

  // Schema dinâmico por mode (filtra enum de field_key)
  const dynamicSchema = {
    type: "object",
    properties: {
      fields: {
        type: "array",
        items: {
          type: "object",
          properties: {
            field_key: { type: "string", enum: allowedFields },
            value: { type: "string" },
            source_block_ords: { type: "array", items: { type: "integer" } },
          },
          required: ["field_key", "value", "source_block_ords"],
        },
      },
      summary_done: { type: "string" },
    },
    required: ["fields"],
  };

  let result: { fields: { field_key: string; value: string; source_block_ords: number[] }[]; summary_done?: string };
  try {
    const r = await gemini(prompt, {
      model: "gemini-2.5-flash",
      systemInstruction: CLASSIFY_SYSTEM,
      responseSchema: dynamicSchema,
      temperature: 0.4,
      maxOutputTokens: 4096,
    });
    result = r.json as typeof result;
    if (!result || !Array.isArray(result.fields)) return 0;
  } catch (e) {
    console.error("classify gemini", e);
    return 0;
  }

  let updated = 0;
  for (const f of result.fields) {
    const blockIds = (f.source_block_ords ?? []).map((o) => ordToId.get(o)).filter(Boolean) as string[];
    // Só sobrescreve se o campo está em "vazio" — não sobrepõe edições do barbeiro
    const { data: existing } = await admin
      .from("dossier_fields")
      .select("status")
      .eq("dossier_id", dossier_id)
      .eq("field_key", f.field_key)
      .maybeSingle();
    if (existing && existing.status !== "vazio" && existing.status !== "sugerido") continue;

    const isConflict = f.value.toLowerCase().startsWith("contradição");
    const { error: upErr } = await admin
      .from("dossier_fields")
      .update({
        value: f.value,
        status: isConflict ? "conflito" : "sugerido",
        source_block_ids: blockIds,
      })
      .eq("dossier_id", dossier_id)
      .eq("field_key", f.field_key);
    if (!upErr) updated += 1;
  }

  await admin
    .from("dossiers")
    .update({ status: "em_revisao" })
    .eq("id", dossier_id)
    .eq("status", "rascunho");

  // Salva summary_done se a IA gerou um (em modos acompanhamento/antes_depois)
  if (result.summary_done && result.summary_done.trim().length > 0) {
    await admin
      .from("dossiers")
      .update({ summary_done: result.summary_done.trim() })
      .eq("id", dossier_id);
  }

  return updated;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function jsonRes(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}
