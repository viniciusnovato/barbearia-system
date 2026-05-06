"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import {
  uploadReferenceAction,
  deleteReferenceAction,
  reorderReferencesAction,
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
  const [items, setItems] = useState(references);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const meta = LABELS[kind];

  // Sincroniza com props quando o servidor revalida
  useEffect(() => { setItems(references); }, [references]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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

  function remove(r: ReferenceAsset) {
    if (!confirm("Remover esta referência?")) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", r.id);
      fd.set("dossier_id", dossierId);
      await deleteReferenceAction(fd);
      setItems((prev) => prev.filter((x) => x.id !== r.id));
      toast.success("Referência removida");
    });
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((r) => r.id === active.id);
    const newIdx = items.findIndex((r) => r.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const next = [...items];
    const [moved] = next.splice(oldIdx, 1);
    next.splice(newIdx, 0, moved);
    setItems(next);
  }

  function persistOrder() {
    startTransition(async () => {
      await reorderReferencesAction(dossierId, kind, items.map((r) => r.id));
      toast.success("Ordem salva");
      setEditing(false);
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
        <div className="flex items-center gap-2 shrink-0">
          {!isFinalized && items.length > 1 && !editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="h-8 px-3 rounded-md border border-border-strong text-caption hover:bg-surface-sunken transition-colors"
            >
              ↕ Reordenar
            </button>
          )}
          <span className="font-mono text-caption text-text-muted">
            {items.length}/{suggested}
          </span>
        </div>
      </header>

      {editing && (
        <div className="flex justify-between items-center mb-3 gap-2">
          <p className="text-body-sm text-text-muted">Arraste para reordenar</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setItems(references); setEditing(false); }}
              className="h-9 px-3 rounded-md text-body-sm text-text-muted hover:bg-surface-sunken transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={persistOrder}
              disabled={pending}
              className="h-9 px-4 rounded-md bg-primary-500 text-neutral-50 text-body-sm font-medium hover:bg-primary-600 disabled:opacity-50 transition-all"
            >
              {pending ? "Salvando…" : "Salvar ordem"}
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed border-border-strong p-6 text-center mb-3">
          <p className="text-body-sm text-text-muted">Nenhuma referência ainda.</p>
        </div>
      ) : editing ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((r) => r.id)} strategy={rectSortingStrategy}>
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              {items.map((r) => <SortableTile key={r.id} ref_={r} />)}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          {items.map((r) => (
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
                  onClick={() => remove(r)}
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

      {!isFinalized && !editing && (
        <label className="cursor-pointer inline-flex h-10 px-4 items-center rounded-md border border-border-strong text-body-sm hover:bg-surface-sunken transition-colors disabled:opacity-50">
          <input type="file" accept="image/*" onChange={onPick} disabled={pending} className="hidden" />
          {pending ? "Enviando…" : `+ Adicionar referência`}
        </label>
      )}
    </section>
  );
}

function SortableTile({ ref_ }: { ref_: ReferenceAsset }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ref_.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative aspect-[4/3] rounded-md overflow-hidden bg-neutral-200 cursor-grab active:cursor-grabbing touch-none"
    >
      {ref_.url ? (
        <Image src={ref_.url} alt={ref_.caption ?? "Referência"} fill unoptimized className="object-cover pointer-events-none" />
      ) : null}
      {ref_.caption && (
        <p className="absolute bottom-0 inset-x-0 px-2 py-1 text-caption text-white bg-gradient-to-t from-black/70 to-transparent">
          {ref_.caption}
        </p>
      )}
    </li>
  );
}
