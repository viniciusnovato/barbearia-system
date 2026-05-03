// Edge Function: health
// Stub mínimo para validar que o setup das functions funciona.
// Deploy: supabase functions deploy health
// Teste:  curl -H "Authorization: Bearer <anon_key>" \
//             https://<ref>.functions.supabase.co/health

import { corsHeaders, handlePreflight } from "../_shared/cors.ts";

Deno.serve((req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  return new Response(
    JSON.stringify({
      ok: true,
      service: "visagismo",
      time: new Date().toISOString(),
      gemini_configured: Boolean(Deno.env.get("GEMINI_API_KEY")),
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "content-type": "application/json" },
    },
  );
});
