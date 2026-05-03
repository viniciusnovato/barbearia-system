// Helpers de auth para Edge Functions: garante que quem chama é um barbeiro logado.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AuthContext {
  userId: string;
  email: string;
  supabase: ReturnType<typeof createClient>;
}

/**
 * Valida o JWT do header Authorization e retorna um cliente Supabase
 * com a identidade do usuário (respeita RLS).
 */
export async function requireUser(req: Request): Promise<AuthContext> {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    throw new Response(
      JSON.stringify({ error: "Authorization header ausente" }),
      { status: 401, headers: { "content-type": "application/json" } },
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Response(
      JSON.stringify({ error: "Sessão inválida" }),
      { status: 401, headers: { "content-type": "application/json" } },
    );
  }

  return { userId: user.id, email: user.email ?? "", supabase };
}
