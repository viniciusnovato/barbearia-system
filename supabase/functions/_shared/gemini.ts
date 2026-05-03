// Wrapper minimalista da REST API do Gemini.
// https://ai.google.dev/api/rest/v1beta/models/generateContent

const BASE = "https://generativelanguage.googleapis.com/v1beta";

interface GenerateOptions {
  model?: string;
  systemInstruction?: string;
  responseSchema?: unknown;
  temperature?: number;
  maxOutputTokens?: number;
  /** Para input de áudio: array de inline parts */
  inlineParts?: { mimeType: string; data: string }[];
}

interface GenerateResult {
  text: string;
  json?: unknown;
}

export async function gemini(prompt: string, opts: GenerateOptions = {}): Promise<GenerateResult> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY ausente");

  const model = opts.model ?? "gemini-2.5-flash";

  const parts: Array<Record<string, unknown>> = [{ text: prompt }];
  if (opts.inlineParts?.length) {
    for (const p of opts.inlineParts) {
      parts.push({ inline_data: { mime_type: p.mimeType, data: p.data } });
    }
  }

  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: opts.temperature ?? 0.4,
      maxOutputTokens: opts.maxOutputTokens ?? 8192,
      ...(opts.responseSchema
        ? { responseMimeType: "application/json", responseSchema: opts.responseSchema }
        : {}),
    },
  };
  if (opts.systemInstruction) {
    body.systemInstruction = { role: "system", parts: [{ text: opts.systemInstruction }] };
  }

  const url = `${BASE}/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini ${res.status}: ${errBody.slice(0, 500)}`);
  }

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";

  let parsed: unknown = undefined;
  if (opts.responseSchema && text.trim().length > 0) {
    try { parsed = JSON.parse(text); } catch { /* ignore */ }
  }

  return { text, json: parsed };
}
