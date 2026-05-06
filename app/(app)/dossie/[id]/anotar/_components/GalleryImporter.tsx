"use client";

import { useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { importClientPhotoToDossierAction } from "@/app/(app)/clientes/[id]/fotos/actions";

interface Photo {
  id: string;
  url: string | null;
  angle: string;
  caption: string | null;
}

const ANGLE_LABELS: Record<string, string> = {
  frontal: "Frontal",
  perfil_esquerdo: "Perfil E.",
  perfil_direito: "Perfil D.",
  tres_quartos: "3/4",
  topo: "Topo",
  outro: "Outro",
};

export function GalleryImporter({ dossierId, photos }: { dossierId: string; photos: Photo[] }) {
  const [pending, startTransition] = useTransition();

  function importPhoto(photoId: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("photo_id", photoId);
      fd.set("dossier_id", dossierId);
      try {
        await importClientPhotoToDossierAction(fd);
        toast.success("Foto importada para o dossiê");
      } catch {
        // redirect throws — ignora
      }
    });
  }

  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {photos.map((p) => (
        <li key={p.id}>
          <button
            type="button"
            onClick={() => importPhoto(p.id)}
            disabled={pending}
            className="group relative w-full rounded-lg overflow-hidden bg-neutral-200 aspect-square hover:ring-2 hover:ring-primary-500 hover:ring-offset-2 hover:ring-offset-surface-page transition-all disabled:opacity-50"
          >
            {p.url ? (
              <Image src={p.url} alt={p.caption ?? p.angle} fill unoptimized className="object-cover" />
            ) : null}
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white font-mono text-[10px] uppercase backdrop-blur" style={{ letterSpacing: "0.06em" }}>
              {ANGLE_LABELS[p.angle] ?? p.angle}
            </span>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary-500 text-neutral-50 px-3 py-1.5 rounded-md text-body-sm font-medium">
                Usar esta foto
              </span>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
