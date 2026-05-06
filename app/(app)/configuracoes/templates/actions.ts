"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";

export async function createTemplateAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const name = String(formData.get("name") ?? "").trim();
  const vectorRaw = String(formData.get("vector_data") ?? "");
  if (!name || !vectorRaw) return;

  let vector_data: unknown;
  try { vector_data = JSON.parse(vectorRaw); } catch { return; }

  await supabase.from("drawing_templates").insert({
    barber_id: user.id,
    name,
    vector_data,
    is_default: false,
  });

  revalidatePath("/configuracoes/templates");
  revalidatePath("/configuracoes");
}

export async function updateTemplateAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;

  await supabase
    .from("drawing_templates")
    .update({ name })
    .eq("id", id)
    .eq("barber_id", user.id);

  revalidatePath("/configuracoes/templates");
}

export async function deleteTemplateAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Não pode apagar templates default (barber_id null) — RLS já bloqueia, mas filtra por segurança
  await supabase
    .from("drawing_templates")
    .delete()
    .eq("id", id)
    .eq("barber_id", user.id);

  revalidatePath("/configuracoes/templates");
}
