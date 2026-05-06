"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";

export async function createTagAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "#535B89").trim();
  if (!name) return;
  await supabase.from("tags").insert({ barber_id: user.id, name, color });
  revalidatePath("/configuracoes/tags");
}

export async function deleteTagAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await supabase.from("tags").delete().eq("id", id).eq("barber_id", user.id);
  revalidatePath("/configuracoes/tags");
}

export async function toggleClientTagAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const client_id = String(formData.get("client_id") ?? "");
  const tag_id = String(formData.get("tag_id") ?? "");
  if (!client_id || !tag_id) return;

  const { data: existing } = await supabase
    .from("client_tags")
    .select("client_id")
    .eq("client_id", client_id)
    .eq("tag_id", tag_id)
    .maybeSingle();

  if (existing) {
    await supabase.from("client_tags").delete().eq("client_id", client_id).eq("tag_id", tag_id);
  } else {
    await supabase.from("client_tags").insert({ client_id, tag_id });
  }
  revalidatePath(`/clientes/${client_id}`);
  revalidatePath("/clientes");
}
