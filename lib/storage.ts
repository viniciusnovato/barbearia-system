import { createServerSupabase } from "./supabase/server";

/**
 * Gera signed URL pra um path no bucket. Retorna null se path inválido.
 * Padrão: 1h.
 */
export async function getSignedUrl(
  bucket: string,
  path: string | null | undefined,
  ttlSeconds = 3600,
) {
  if (!path) return null;
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, ttlSeconds);
  if (error) return null;
  return data.signedUrl;
}
