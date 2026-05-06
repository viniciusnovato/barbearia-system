"use client";

import { useState, useTransition } from "react";
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
import { deleteClientPhotoAction, reorderClientPhotosAction } from "../actions";

interface Photo {
  id: string;
  url: string | null;
  caption: string | null;
}

interface Props {
  clientId: string;
  angleLabel: string;
  initial: Photo[];
}

export function SortablePhotoGrid({ clientId, angleLabel, initial }: Props) {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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

  function persist() {
    startTransition(async () => {
      await reorderClientPhotosAction(clientId, items.map((p) => p.id));
      toast.success("Ordem salva");
      setEditing(false);
    });
  }

  function remove(p: Photo) {
    if (!confirm("Apagar esta foto? A imagem será removida do storage.")) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", p.id);
      fd.set("client_id", clientId);
      await deleteClientPhotoAction(fd);
      setItems((prev) => prev.filter((x) => x.id !== p.id));
      toast.success("Foto removida");
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border-subtle p-6 text-center text-body-sm text-text-muted">
        Nenhuma foto deste ângulo ainda.
      </div>
    );
  }

  if (editing) {
    return (
      <>
        <div className="flex justify-between items-center mb-3 gap-2">
          <p className="text-body-sm text-text-muted">Arraste para reordenar</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setItems(initial); setEditing(false); }}
              className="h-9 px-3 rounded-md text-body-sm text-text-muted hover:bg-surface-sunken transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={persist}
              disabled={pending}
              className="h-9 px-4 rounded-md bg-primary-500 text-neutral-50 text-body-sm font-medium hover:bg-primary-600 disabled:opacity-50 transition-all"
            >
              {pending ? "Salvando…" : "Salvar ordem"}
            </button>
          </div>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((p) => p.id)} strategy={rectSortingStrategy}>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((p) => <SortableTile key={p.id} photo={p} angleLabel={angleLabel} />)}
            </ul>
          </SortableContext>
        </DndContext>
      </>
    );
  }

  return (
    <>
      {items.length > 1 && (
        <div className="flex justify-end mb-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="h-8 px-3 rounded-md border border-border-strong text-caption hover:bg-surface-sunken transition-colors"
          >
            ↕ Reordenar
          </button>
        </div>
      )}
      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((p) => (
          <li key={p.id} className="group relative rounded-lg overflow-hidden bg-neutral-200 aspect-[4/3]">
            {p.url ? (
              <Image src={p.url} alt={p.caption ?? angleLabel} fill unoptimized className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-muted text-caption">indisponível</div>
            )}
            <button
              type="button"
              onClick={() => remove(p)}
              disabled={pending}
              title="Remover"
              className="absolute top-2 right-2 size-9 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-danger transition-all backdrop-blur"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>
            </button>
            {p.caption && (
              <p className="absolute bottom-0 inset-x-0 px-3 py-2 text-caption text-white bg-gradient-to-t from-black/70 to-transparent">
                {p.caption}
              </p>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

function SortableTile({ photo: p, angleLabel }: { photo: Photo; angleLabel: string }) {
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
      className="relative rounded-lg overflow-hidden bg-neutral-200 aspect-[4/3] cursor-grab active:cursor-grabbing touch-none"
    >
      {p.url ? (
        <Image src={p.url} alt={p.caption ?? angleLabel} fill unoptimized className="object-cover pointer-events-none" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-text-muted text-caption">indisponível</div>
      )}
      {p.caption && (
        <p className="absolute bottom-0 inset-x-0 px-3 py-2 text-caption text-white bg-gradient-to-t from-black/70 to-transparent">
          {p.caption}
        </p>
      )}
    </li>
  );
}
