"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";

export async function uploadDossierPhotoAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const dossier_id = String(formData.get("dossier_id") ?? "");
  const caption = (String(formData.get("caption") ?? "").trim()) || null;
  if (!dossier_id) return;

  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) return;

  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const id = crypto.randomUUID();
  const path = `${user.id}/${dossier_id}/${id}.${ext}`;
  const buffer = await file.arrayBuffer();

  const { error: upErr } = await supabase.storage
    .from("references")
    .upload(path, buffer, { upsert: false, contentType: file.type });
  if (upErr) return;

  await supabase.from("media_assets").insert({
    id,
    dossier_id,
    kind: "foto_cliente",
    storage_path: path,
    bucket: "references",
    caption,
    included_in_pdf: true,
  });

  revalidatePath(`/dossie/${dossier_id}`);
}

export async function deleteDossierPhotoAction(formData: FormData): Promise<void> {
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

export async function updateDossierPhotoCaptionAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const id = String(formData.get("id") ?? "");
  const dossier_id = String(formData.get("dossier_id") ?? "");
  const caption = (String(formData.get("caption") ?? "").trim()) || null;
  if (!id) return;
  await supabase.from("media_assets").update({ caption }).eq("id", id);
  revalidatePath(`/dossie/${dossier_id}`);
}

export async function reorderDossierPhotosAction(
  dossier_id: string,
  orderedIds: string[],
): Promise<void> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !dossier_id) return;
  await Promise.all(
    orderedIds.map((id, idx) =>
      supabase.from("media_assets").update({ sort_order: idx }).eq("id", id).eq("dossier_id", dossier_id),
    ),
  );
  revalidatePath(`/dossie/${dossier_id}`);
}
