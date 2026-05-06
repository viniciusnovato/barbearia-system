"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
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
import { reorderProductsAction } from "../actions";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price_brl: number | null;
  category: string | null;
  photoUrl: string | null;
}

export function SortableProductGrid({ initial }: { initial: Product[] }) {
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
      await reorderProductsAction(items.map((p) => p.id));
      toast.success("Ordem salva");
      setEditing(false);
    });
  }

  if (!editing) {
    return (
      <div>
        <div className="flex justify-end mb-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="h-9 px-3 rounded-md border border-border-strong text-body-sm hover:bg-surface-sunken transition-colors"
          >
            ↕ Reordenar
          </button>
        </div>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p) => (
            <li key={p.id}>
              <ProductCardLink product={p} />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div>
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
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((p) => (
              <SortableCard key={p.id} product={p} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function ProductCardLink({ product: p }: { product: Product }) {
  return (
    <Link
      href={`/produtos/${p.id}`}
      className="group block rounded-lg bg-surface-card border border-border-subtle hover:border-primary-300 hover:shadow-2 transition-all overflow-hidden"
    >
      <ProductCardContent product={p} />
    </Link>
  );
}

function SortableCard({ product: p }: { product: Product }) {
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
      className="rounded-lg bg-surface-card border border-border-strong cursor-grab active:cursor-grabbing overflow-hidden touch-none"
    >
      <ProductCardContent product={p} />
    </li>
  );
}

function ProductCardContent({ product: p }: { product: Product }) {
  return (
    <>
      {p.photoUrl ? (
        <Image
          src={p.photoUrl}
          alt={p.name}
          width={400}
          height={300}
          unoptimized
          className="w-full aspect-[4/3] object-cover pointer-events-none"
        />
      ) : (
        <div className="w-full aspect-[4/3] bg-surface-sunken flex items-center justify-center">
          <span className="font-display text-h2 text-text-muted">
            {p.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
          </span>
        </div>
      )}
      <div className="p-4">
        <p className="font-display text-h4">{p.name}</p>
        {p.description && <p className="text-body-sm text-text-muted mt-1 line-clamp-2">{p.description}</p>}
        <div className="flex items-center justify-between mt-2">
          {p.category && (
            <span className="text-caption text-text-muted font-mono uppercase" style={{ letterSpacing: "0.06em" }}>
              {p.category}
            </span>
          )}
          {p.price_brl != null && (
            <p className="font-mono text-body-sm text-primary-700">R$ {Number(p.price_brl).toFixed(2).replace(".", ",")}</p>
          )}
        </div>
      </div>
    </>
  );
}
