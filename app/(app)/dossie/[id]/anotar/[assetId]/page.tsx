import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSignedUrl } from "@/lib/storage";
import { Annotator } from "./_components/Annotator";

interface PageProps { params: Promise<{ id: string; assetId: string }> }

export default async function AnnotatePage({ params }: PageProps) {
  const { id, assetId } = await params;
  const supabase = await createServerSupabase();

  const { data: asset } = await supabase
    .from("media_assets")
    .select("id, dossier_id, storage_path, bucket")
    .eq("id", assetId)
    .maybeSingle();
  if (!asset || asset.dossier_id !== id) notFound();

  const imageUrl = await getSignedUrl(asset.bucket, asset.storage_path, 3600);

  const { data: versions } = await supabase
    .from("ipad_annotations")
    .select("id, version_name, preview_path, created_at")
    .eq("asset_id", assetId)
    .order("created_at", { ascending: false });

  const versionsWithUrls = await Promise.all(
    (versions ?? []).map(async (v) => ({ ...v, previewUrl: v.preview_path ? await getSignedUrl("annotations", v.preview_path, 3600) : null })),
  );

  return (
    <main className="px-4 lg:px-8 py-6">
      <Link href={`/dossie/${id}/anotar`} className="text-body-sm text-text-secondary hover:text-text-primary inline-flex items-center gap-1 mb-4">
        ← Fotos do dossiê
      </Link>
      <Annotator
        assetId={assetId}
        dossierId={id}
        imageUrl={imageUrl ?? ""}
        versions={versionsWithUrls.map((v) => ({ id: v.id, name: v.version_name, previewUrl: v.previewUrl, createdAt: v.created_at }))}
      />
    </main>
  );
}
