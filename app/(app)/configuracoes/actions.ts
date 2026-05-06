"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";

export async function uploadLogoAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const file = formData.get("logo") as File | null;
  if (!file || file.size === 0) return;

  const ext = (file.name.split(".").pop() ?? "png").toLowerCase();
  const path = `${user.id}/logo/main.${ext}`;
  const buffer = await file.arrayBuffer();
  const { error: upErr } = await supabase.storage
    .from("barber-assets")
    .upload(path, buffer, { upsert: true, contentType: file.type });
  if (upErr) return;

  await supabase.from("barbers").update({ logo_path: path }).eq("id", user.id);
  revalidatePath("/configuracoes");
}

export async function removeLogoAction(): Promise<void> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("barbers").update({ logo_path: null }).eq("id", user.id);
  revalidatePath("/configuracoes");
}

export async function updateProfileAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const full_name = String(formData.get("full_name") ?? "").trim();
  const instagram = String(formData.get("instagram") ?? "").trim() || null;
  const inactivity = parseInt(String(formData.get("inactivity_threshold_days") ?? "45"), 10) || 45;

  await supabase.from("barbers").update({
    full_name,
    instagram,
    inactivity_threshold_days: inactivity,
  }).eq("id", user.id);

  // Atualiza também user_metadata (full_name aparece no header)
  await supabase.auth.updateUser({ data: { full_name, instagram } });

  revalidatePath("/configuracoes");
  revalidatePath("/dashboard");
}

export async function resetTourAction(): Promise<void> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("barbers").update({ tour_completed_at: null }).eq("id", user.id);
  revalidatePath("/configuracoes");
}

export async function completeTourAction(): Promise<void> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("barbers").update({ tour_completed_at: new Date().toISOString() }).eq("id", user.id);
}
