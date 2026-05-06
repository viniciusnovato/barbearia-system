"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import type { AngleId } from "./_const";

export async function addClientPhotoAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const client_id = String(formData.get("client_id") ?? "");
  const angle = String(formData.get("angle") ?? "frontal") as AngleId;
  const caption = (String(formData.get("caption") ?? "").trim()) || null;
  if (!client_id) return;

  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) return;

  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const photoId = crypto.randomUUID();
  const path = `${user.id}/${client_id}/${angle}-${photoId}.${ext}`;
  const buffer = await file.arrayBuffer();
  const { error: upErr } = await supabase.storage
    .from("client-photos")
    .upload(path, buffer, { upsert: false, contentType: file.type });
  if (upErr) return;

  await supabase.from("client_photos").insert({
    id: photoId,
    client_id,
    angle,
    storage_path: path,
    caption,
  });

  revalidatePath(`/clientes/${client_id}`);
  revalidatePath(`/clientes/${client_id}/fotos`);
}

export async function reorderClientPhotosAction(
  client_id: string,
  orderedIds: string[],
): Promise<void> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !client_id) return;

  await Promise.all(
    orderedIds.map((id, idx) =>
      supabase
        .from("client_photos")
        .update({ sort_order: idx })
        .eq("id", id)
        .eq("client_id", client_id),
    ),
  );
  revalidatePath(`/clientes/${client_id}/fotos`);
  revalidatePath(`/clientes/${client_id}`);
}

export async function deleteClientPhotoAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const id = String(formData.get("id") ?? "");
  const client_id = String(formData.get("client_id") ?? "");
  if (!id) return;

  const { data: photo } = await supabase
    .from("client_photos")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();

  await supabase.from("client_photos").delete().eq("id", id);
  if (photo?.storage_path) {
    await supabase.storage.from("client-photos").remove([photo.storage_path]);
  }

  revalidatePath(`/clientes/${client_id}`);
  revalidatePath(`/clientes/${client_id}/fotos`);
}

export async function importClientPhotoToDossierAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const photo_id = String(formData.get("photo_id") ?? "");
  const dossier_id = String(formData.get("dossier_id") ?? "");
  if (!photo_id || !dossier_id) return;

  // Lê o caminho da foto na galeria
  const { data: photo } = await supabase
    .from("client_photos")
    .select("storage_path, caption, angle")
    .eq("id", photo_id)
    .maybeSingle();
  if (!photo) return;

  // Cria um media_asset apontando para o MESMO storage_path (não duplica bytes)
  // O bucket é o mesmo (client-photos) e RLS já garante acesso ao barbeiro.
  await supabase.from("media_assets").insert({
    dossier_id,
    kind: "foto_cliente",
    storage_path: photo.storage_path,
    bucket: "client-photos",
    caption: photo.caption ?? `Foto ${photo.angle}`,
    included_in_pdf: true,
  });

  revalidatePath(`/dossie/${dossier_id}/anotar`);
  redirect(`/dossie/${dossier_id}/anotar`);
}
