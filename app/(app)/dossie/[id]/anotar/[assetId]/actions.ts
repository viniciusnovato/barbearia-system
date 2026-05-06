"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

export async function duplicateVersionAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const versionId = String(formData.get("version_id") ?? "");
  const dossierId = String(formData.get("dossier_id") ?? "");
  const assetId = String(formData.get("asset_id") ?? "");
  if (!versionId || !dossierId || !assetId) return;

  const { data: original } = await supabase
    .from("ipad_annotations")
    .select("version_name, vector_data, preview_path")
    .eq("id", versionId)
    .maybeSingle();
  if (!original) return;

  // Duplica preview no storage (mesmo barbeiro, novo path)
  let newPreviewPath: string | null = null;
  if (original.preview_path) {
    const admin = createAdminSupabase();
    const { data: blob } = await admin.storage.from("annotations").download(original.preview_path);
    if (blob) {
      const newId = crypto.randomUUID();
      newPreviewPath = `${user.id}/${dossierId}/${newId}.png`;
      const ab = await blob.arrayBuffer();
      const { error } = await admin.storage.from("annotations").upload(newPreviewPath, ab, { contentType: "image/png" });
      if (error) newPreviewPath = null;
    }
  }

  await supabase.from("ipad_annotations").insert({
    asset_id: assetId,
    version_name: `${original.version_name} (cópia)`,
    vector_data: original.vector_data,
    preview_path: newPreviewPath,
  });

  // Cria também o media_asset duplicado pra entrar no PDF
  if (newPreviewPath) {
    await supabase.from("media_assets").insert({
      dossier_id: dossierId,
      kind: "marcacao_ipad",
      storage_path: newPreviewPath,
      bucket: "annotations",
      caption: `${original.version_name} (cópia)`,
      parent_asset_id: assetId,
      included_in_pdf: false,
    });
  }

  revalidatePath(`/dossie/${dossierId}/anotar/${assetId}`);
}
