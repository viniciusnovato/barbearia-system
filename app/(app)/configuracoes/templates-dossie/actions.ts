"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";

export async function deleteDossierTemplateAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await supabase.from("dossier_templates").delete().eq("id", id).eq("barber_id", user.id);
  revalidatePath("/configuracoes/templates-dossie");
}
