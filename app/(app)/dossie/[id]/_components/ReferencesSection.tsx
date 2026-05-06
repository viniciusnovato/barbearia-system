"use client";

import { useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  uploadReferenceAction,
  deleteReferenceAction,
} from "../references-actions";

export type RefKind = "referencia_corte" | "referencia_barba";

export interface ReferenceAsset {
  id: string;
  url: string | null;
  caption: string | null;
}

interface Props {
  dossierId: string;
  kind: RefKind;
  references: ReferenceAsset[];
  isFinalized: boolean;
  /** Quantas referências o spec sugere (corte=3, barba=2) */
  suggested?: number;
}

const LABELS: Record<RefKind, { title: string; helper: string }> = {
  referencia_corte: {
    title: "Referências visuais de corte",
    helper: "Imagens que ilustram o corte recomendado. Recomendado: até 3 fotos.",
  },
  referencia_barba: {
    title: "Referências visuais de barba",
    helper: "Imagens que ilustram a barba recomendada. Recomendado: até 2 fotos.",
  },
};

export function ReferencesSection({ dossierId, kind, references, isFinalized, suggested = 3 }: Props) {
  const [pending, startTransition] = useTransition();
  const meta = LABELS[kind];

  function uploadFile(file: File, caption: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("dossier_id", dossierId);
      fd.set("kind", kind);
      fd.set("caption", caption);
      fd.set("photo", file);
      try {
        await uploadReferenceAction(fd);
        toast.success("Referência adicionada");
      } catch (e) {
        toast.error("Falha ao subir", { description: e instanceof Error ? e.message : String(e) });
      }
    });
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadFile(file, "");
    e.target.value = "";
  }

  function remove(id: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      fd.set("dossier_id", dossierId);
      await deleteReferenceAction(fd);
      toast.success("Referência removida");
    });
  }

  return (
    <section className="rounded-lg bg-surface-card border border-border-subtle p-5">
      <header className="flex items-end justify-between gap-3 mb-4">
        <div>
          <p className="font-mono text-mono uppercase text-text-secondary" style={{ letterSpacing: "0.08em" }}>
            {meta.title}
          </p>
          <p className="text-caption text-text-muted mt-1">{meta.helper}</p>
        </div>
        <span className="font-mono text-caption text-text-muted">
          {references.length}/{suggested}
        </span>
      </header>

      {references.length === 0 ? (
        <div className="rounded-md border border-dashed border-border-strong p-6 text-center mb-3">
          <p className="text-body-sm text-text-muted">Nenhuma referência ainda.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          {references.map((r) => (
            <li key={r.id} className="group relative aspect-[4/3] rounded-md overflow-hidden bg-neutral-200">
              {r.url ? (
                <Image src={r.url} alt={r.caption ?? "Referência"} fill unoptimized className="object-cover" />
              ) : null}
              {r.caption && (
                <p className="absolute bottom-0 inset-x-0 px-2 py-1 text-caption text-white bg-gradient-to-t from-black/70 to-transparent">
                  {r.caption}
                </p>
              )}
              {!isFinalized && (
                <button
                  type="button"
                  onClick={() => remove(r.id)}
                  disabled={pending}
                  title="Remover"
                  className="absolute top-2 right-2 size-8 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-danger transition-all backdrop-blur"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!isFinalized && (
        <label className="cursor-pointer inline-flex h-10 px-4 items-center rounded-md border border-border-strong text-body-sm hover:bg-surface-sunken transition-colors disabled:opacity-50">
          <input type="file" accept="image/*" onChange={onPick} disabled={pending} className="hidden" />
          {pending ? "Enviando…" : `+ Adicionar referência`}
        </label>
      )}
    </section>
  );
}
