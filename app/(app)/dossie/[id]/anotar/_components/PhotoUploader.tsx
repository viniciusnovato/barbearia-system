"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";

export function PhotoUploader({ dossierId, compact }: { dossierId: string; compact?: boolean }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const supabase = createBrowserSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const id = crypto.randomUUID();
      const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
      const path = `${user.id}/${dossierId}/${id}.${ext}`;
      const { error: upErr } = await supabase.storage.from("references").upload(path, file, {
        upsert: false,
        contentType: file.type,
      });
      if (upErr) throw upErr;

      const { data: row, error: insertErr } = await supabase
        .from("media_assets")
        .insert({
          dossier_id: dossierId,
          kind: "foto_cliente",
          storage_path: path,
          bucket: "references",
          included_in_pdf: true,
        })
        .select("id")
        .single();
      if (insertErr || !row) throw insertErr ?? new Error("Falha ao registrar");

      router.push(`/dossie/${dossierId}/anotar/${row.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setUploading(false);
    }
  }

  return (
    <section className={compact ? "" : "rounded-2xl border border-dashed border-border-strong p-10 text-center"}>
      {!compact && (
        <>
          <p className="font-display text-h3 text-text-muted">Sem foto ainda</p>
          <p className="text-body-sm text-text-secondary mt-2">Suba a foto frontal do cliente para iniciar a análise visual.</p>
        </>
      )}
      <label className={`cursor-pointer inline-flex h-touch px-5 items-center rounded-md ${compact ? "border border-border-strong text-body-sm" : "bg-primary-500 text-neutral-50 mt-6 font-medium hover:bg-primary-600"} transition-colors`}>
        <input type="file" accept="image/*" onChange={onPick} disabled={uploading} className="hidden" />
        {uploading ? "Enviando…" : compact ? "+ Outra foto" : "Subir foto do cliente"}
      </label>
      {error && (
        <p className="mt-4 text-body-sm text-status-conflict-fg">{error}</p>
      )}
    </section>
  );
}
