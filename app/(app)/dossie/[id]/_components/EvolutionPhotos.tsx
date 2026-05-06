"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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
  uploadDossierPhotoAction,
  deleteDossierPhotoAction,
  updateDossierPhotoCaptionAction,
  reorderDossierPhotosAction,
} from "../photos-actions";

export interface DossierPhoto {
  id: string;
  url: string | null;
  caption: string | null;
}

interface Props {
  dossierId: string;
  photos: DossierPhoto[];
  isFinalized: boolean;
}

export function EvolutionPhotos({ dossierId, photos, isFinalized }: Props) {
  const [items, setItems] = useState(photos);
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState("");
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setItems(photos); }, [photos]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const cap = caption;
    setCaption("");
    if (fileRef.current) fileRef.current.value = "";
    startTransition(async () => {
      const fd = new FormData();
      fd.set("dossier_id", dossierId);
      fd.set("caption", cap);
      fd.set("photo", file);
      try {
        await uploadDossierPhotoAction(fd);
        toast.success("Foto adicionada");
      } catch (err) {
        toast.error("Falha ao subir", { description: err instanceof Error ? err.message : String(err) });
      }
    });
  }

  function remove(p: DossierPhoto) {
    if (!confirm("Remover esta foto?")) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", p.id);
      fd.set("dossier_id", dossierId);
      await deleteDossierPhotoAction(fd);
      setItems((prev) => prev.filter((x) => x.id !== p.id));
      toast.success("Foto removida");
    });
  }

  function updateCaption(p: DossierPhoto, value: string) {
    if (value === (p.caption ?? "")) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", p.id);
      fd.set("dossier_id", dossierId);
      fd.set("caption", value);
      await updateDossierPhotoCaptionAction(fd);
    });
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((p) => p.id === active.id);
    const newIdx = items.findIndex((p) => p.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const next = [...items];
    const [moved] = next.splice(oldIdx, 1);
    next.splice(newIdx, 0, moved);
    setItems(next);
  }

  function persistOrder() {
    startTransition(async () => {
      await reorderDossierPhotosAction(dossierId, items.map((p) => p.id));
      toast.success("Ordem salva");
      setEditing(false);
    });
  }

  return (
    <section className="rounded-lg bg-surface-card border border-border-subtle p-5">
      <header className="flex items-end justify-between gap-3 mb-4">
        <div>
          <p className="font-mono text-mono uppercase text-text-secondary" style={{ letterSpacing: "0.08em" }}>
            Fotos do atendimento
          </p>
          <p className="text-caption text-text-muted mt-1">
            Suba como o cliente chegou, foto durante e o resultado. Adicione uma legenda pra organizar.
          </p>
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
          <span className="font-mono text-caption text-text-muted">{items.length} foto{items.length === 1 ? "" : "s"}</span>
        </div>
      </header>

      {editing && (
        <div className="flex justify-between items-center mb-3 gap-2">
          <p className="text-body-sm text-text-muted">Arraste para reordenar</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setItems(photos); setEditing(false); }}
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
          <p className="text-body-sm text-text-muted">Nenhuma foto ainda.</p>
        </div>
      ) : editing ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((p) => p.id)} strategy={rectSortingStrategy}>
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              {items.map((p) => <SortableTile key={p.id} photo={p} />)}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          {items.map((p) => (
            <li key={p.id} className="group relative rounded-md overflow-hidden bg-neutral-200">
              <div className="aspect-[4/3] relative">
                {p.url ? (
                  <Image src={p.url} alt={p.caption ?? "Foto"} fill unoptimized className="object-cover" />
                ) : null}
                {!isFinalized && (
                  <button
                    type="button"
                    onClick={() => remove(p)}
                    disabled={pending}
                    title="Remover"
                    className="absolute top-2 right-2 size-8 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-danger transition-all backdrop-blur"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>
                  </button>
                )}
              </div>
              {isFinalized ? (
                p.caption && (
                  <p className="px-2.5 py-1.5 text-caption text-text-secondary bg-surface-sunken">{p.caption}</p>
                )
              ) : (
                <input
                  defaultValue={p.caption ?? ""}
                  onBlur={(e) => updateCaption(p, e.currentTarget.value.trim())}
                  placeholder="Legenda (ex: chegada, durante, depois)"
                  className="w-full px-2.5 py-1.5 text-caption bg-surface-sunken border-t border-border-subtle focus:outline-none focus:bg-surface-card transition-colors"
                />
              )}
            </li>
          ))}
        </ul>
      )}

      {!isFinalized && !editing && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Legenda da próxima foto (ex: chegada)"
            className="flex-1 min-w-[180px] h-10 px-3 rounded-md bg-surface-card border border-border-strong focus:border-primary-500 focus:outline-none text-body-sm"
          />
          <label className="cursor-pointer inline-flex h-10 px-4 items-center rounded-md border border-border-strong text-body-sm hover:bg-surface-sunken transition-colors disabled:opacity-50">
            <input ref={fileRef} type="file" accept="image/*" onChange={onPick} disabled={pending} className="hidden" />
            {pending ? "Enviando…" : "+ Foto"}
          </label>
        </div>
      )}
    </section>
  );
}

function SortableTile({ photo: p }: { photo: DossierPhoto }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: p.id });
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
      className="rounded-md overflow-hidden bg-neutral-200 cursor-grab active:cursor-grabbing touch-none"
    >
      <div className="aspect-[4/3] relative">
        {p.url ? (
          <Image src={p.url} alt={p.caption ?? "Foto"} fill unoptimized className="object-cover pointer-events-none" />
        ) : null}
      </div>
      {p.caption && (
        <p className="px-2.5 py-1.5 text-caption text-text-secondary bg-surface-sunken">{p.caption}</p>
      )}
    </li>
  );
}
