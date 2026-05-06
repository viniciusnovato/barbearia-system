// Edge Function: generate-after-image
// 1. Recebe { dossier_id, asset_id }
// 2. Lê campos aprovados do dossiê + foto do asset
// 3. Chama Gemini 2.5 Flash Image Preview com a foto + prompt de transformação
// 4. Salva PNG resultante no bucket annotations
// 5. Cria media_assets kind=expectativa_ia vinculado ao dossier
// 6. Retorna { ok, asset_id, signed_url }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handlePreflight } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";

const GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image-preview";

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonRes({ error: "Método não suportado" }, 405);
  }

  try {
    const ctx = await requireUser(req);
    const { dossier_id, asset_id } = await req.json();
    if (!dossier_id || !asset_id) return jsonRes({ error: "dossier_id e asset_id obrigatórios" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Verifica posse do asset+dossier via cliente do user
    const { data: asset, error: aErr } = await ctx.supabase
      .from("media_assets")
      .select("id, dossier_id, storage_path, bucket")
      .eq("id", asset_id)
      .maybeSingle();
    if (aErr || !asset || asset.dossier_id !== dossier_id) {
      return jsonRes({ error: "Asset não encontrado" }, 404);
    }

    // Limita 3 gerações por dossier
    const { count } = await ctx.supabase
      .from("media_assets")
      .select("*", { count: "exact", head: true })
      .eq("dossier_id", dossier_id)
      .eq("kind", "expectativa_ia");
    if ((count ?? 0) >= 3) {
      return jsonRes({ error: "Limite de 3 imagens geradas por dossiê atingido" }, 429);
    }

    // Lê campos do dossiê
    const { data: fields } = await ctx.supabase
      .from("dossier_fields")
      .select("field_key, value, status")
      .eq("dossier_id", dossier_id)
      .neq("status", "vazio")
      .not("value", "is", null);

    const fieldMap = new Map<string, string>();
    (fields ?? []).forEach((f) => { if (f.value) fieldMap.set(f.field_key, f.value); });

    const prompt = buildPrompt(fieldMap);

    // Baixa foto base
    const { data: photoBlob, error: dErr } = await admin.storage.from(asset.bucket).download(asset.storage_path);
    if (dErr || !photoBlob) return jsonRes({ error: "Falha ao baixar foto base" }, 500);
    const photoBuffer = new Uint8Array(await photoBlob.arrayBuffer());
    const photoB64 = bytesToBase64(photoBuffer);
    const photoMime = photoBlob.type || guessMime(asset.storage_path);

    // Chama Gemini Image
    const apiKey = Deno.env.get("GEMINI_API_KEY")!;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${apiKey}`;

    const body = {
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          { inline_data: { mime_type: photoMime, data: photoB64 } },
        ],
      }],
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini Image error:", errText.slice(0, 500));
      return jsonRes({ error: `Gemini ${res.status}: ${errText.slice(0, 300)}` }, 500);
    }

    const json = await res.json();
    const parts = json?.candidates?.[0]?.content?.parts ?? [];
    let imageBase64: string | null = null;
    let imageMime = "image/png";
    for (const p of parts) {
      if (p.inline_data?.data || p.inlineData?.data) {
        imageBase64 = p.inline_data?.data ?? p.inlineData?.data;
        imageMime = p.inline_data?.mime_type ?? p.inlineData?.mimeType ?? "image/png";
        break;
      }
    }
    if (!imageBase64) {
      return jsonRes({ error: "Gemini não retornou imagem" }, 500);
    }

    // Salva no bucket
    const newId = crypto.randomUUID();
    const ext = imageMime.includes("png") ? "png" : "jpg";
    const path = `${ctx.userId}/${dossier_id}/${newId}.${ext}`;
    const imageBytes = base64ToBytes(imageBase64);
    const { error: upErr } = await admin.storage.from("annotations").upload(path, imageBytes, {
      contentType: imageMime,
      upsert: false,
    });
    if (upErr) {
      console.error("upload error:", upErr);
      return jsonRes({ error: `Falha no upload: ${upErr.message}` }, 500);
    }

    // Registra media_asset
    const { data: newAsset, error: insErr } = await admin
      .from("media_assets")
      .insert({
        id: newId,
        dossier_id,
        kind: "expectativa_ia",
        storage_path: path,
        bucket: "annotations",
        caption: "Imagem do depois (IA)",
        included_in_pdf: true,
      })
      .select("id")
      .single();
    if (insErr || !newAsset) return jsonRes({ error: "Falha ao registrar asset" }, 500);

    // Signed URL pra UI exibir já
    const { data: urlData } = await admin.storage.from("annotations").createSignedUrl(path, 3600);

    return jsonRes({
      ok: true,
      asset_id: newAsset.id,
      signed_url: urlData?.signedUrl ?? null,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return jsonRes({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function buildPrompt(fields: Map<string, string>): string {
  const parts: string[] = [
    "Edite a foto anexa preservando exatamente o mesmo rosto, identidade, iluminação, pose e fundo do cliente.",
    "Aplique APENAS as transformações de visagismo descritas abaixo:",
  ];

  const corteEstilo = fields.get("corte_estilo_ideal");
  const corteEstrutura = fields.get("corte_estrutura");
  if (corteEstilo) parts.push(`- Corte: ${corteEstilo}`);
  if (corteEstrutura) parts.push(`  Estrutura: ${corteEstrutura}`);

  const barbaEstilo = fields.get("barba_estilo_ideal");
  const barbaContorno = fields.get("barba_linha_contorno");
  if (barbaEstilo) parts.push(`- Barba: ${barbaEstilo}`);
  if (barbaContorno) parts.push(`  Contorno: ${barbaContorno}`);

  const direcao = fields.get("direcao_visual");
  if (direcao) parts.push(`- Direção visual: ${direcao}`);

  const estilo = fields.get("estilo_visual_estrategico");
  if (estilo) parts.push(`- Posicionamento: ${estilo}`);

  const resultado = fields.get("resultado_esperado");
  if (resultado) parts.push(`- Resultado esperado: ${resultado}`);

  parts.push("");
  parts.push("Saída: foto realista profissional editorial, mesma proporção e enquadramento da original, alta qualidade. NÃO invente acessórios, óculos, tatuagens ou roupas que não existam na original.");
  parts.push("Retorne APENAS a imagem editada.");

  return parts.join("\n");
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function guessMime(path: string): string {
  const ext = path.toLowerCase().split(".").pop() ?? "";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

function jsonRes(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}
