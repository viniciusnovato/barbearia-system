import { createClient } from "@supabase/supabase-js";

/**
 * Cliente admin com service_role.
 * NUNCA importar em código que roda no browser.
 * Usar apenas em route handlers, server actions, edge functions e scripts.
 */
export function createAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
