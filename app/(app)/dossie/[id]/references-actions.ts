"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";

export async function uploadReferenceAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const dossier_id = String(formData.get("dossier_id") ?? "");
  const kind = String(formData.get("kind") ?? "");
  const caption = (String(formData.get("caption") ?? "").trim()) || null;
  if (!dossier_id || !["referencia_corte", "referencia_barba"].includes(kind)) return;

  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) return;

  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const id = crypto.randomUUID();
  const path = `${user.id}/${dossier_id}/${kind}-${id}.${ext}`;
  const buffer = await file.arrayBuffer();

  const { error: upErr } = await supabase.storage
    .from("references")
    .upload(path, buffer, { upsert: false, contentType: file.type });
  if (upErr) return;

  await supabase.from("media_assets").insert({
    id,
    dossier_id,
    kind,
    storage_path: path,
    bucket: "references",
    caption,
    included_in_pdf: true,
  });

  revalidatePath(`/dossie/${dossier_id}`);
}

export async function deleteReferenceAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const id = String(formData.get("id") ?? "");
  const dossier_id = String(formData.get("dossier_id") ?? "");
  if (!id) return;

  const { data: asset } = await supabase
    .from("media_assets")
    .select("storage_path, bucket")
    .eq("id", id)
    .maybeSingle();

  await supabase.from("media_assets").delete().eq("id", id);
  if (asset?.storage_path && asset.bucket) {
    await supabase.storage.from(asset.bucket).remove([asset.storage_path]);
  }

  revalidatePath(`/dossie/${dossier_id}`);
}
