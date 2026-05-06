"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createTagAction, deleteTagAction } from "../actions";

interface Tag { id: string; name: string; color: string }

const PRESET_COLORS = [
  "#535B89", // ai
  "#A03A1B", // danger
  "#8E6A30", // primary
  "#4F8C3F", // success
  "#B8862A", // warning
  "#7A2E14", // conflict deep
  "#6E76A6", // ai light
];

export function TagManager({ initialTags }: { initialTags: Tag[] }) {
  const [tags, setTags] = useState(initialTags);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [pending, startTransition] = useTransition();

  function add() {
    if (!name.trim()) { toast.error("Dê um nome"); return; }
    startTransition(async () => {
      const fd = new FormData();
      fd.set("name", name);
      fd.set("color", color);
      await createTagAction(fd);
      // reload otimista — vamos só colocar com id temp pra refletir + esperar o revalidate
      setTags((prev) => [...prev, { id: `temp-${Date.now()}`, name, color }]);
      setName("");
      toast.success("Tag criada");
    });
  }

  function remove(t: Tag) {
    if (!confirm(`Apagar tag "${t.name}"?`)) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", t.id);
      await deleteTagAction(fd);
      setTags((prev) => prev.filter((x) => x.id !== t.id));
      toast.success("Tag removida");
    });
  }

  return (
    <div className="rounded-2xl bg-surface-card border border-border-subtle p-6">
      <p className="font-mono text-mono uppercase text-text-muted mb-3" style={{ letterSpacing: "0.1em" }}>
        Suas tags ({tags.length})
      </p>

      {tags.length === 0 ? (
        <p className="text-body-sm text-text-muted mb-5">Nenhuma tag criada ainda.</p>
      ) : (
        <ul className="flex flex-wrap gap-2 mb-5">
          {tags.map((t) => (
            <li key={t.id} className="group inline-flex items-center gap-2 h-8 pl-3 pr-1 rounded-full" style={{ background: `${t.color}22`, color: t.color, border: `1px solid ${t.color}55` }}>
              <span className="text-body-sm font-medium">{t.name}</span>
              <button
                type="button"
                onClick={() => remove(t)}
                className="size-6 rounded-full hover:bg-black/10 inline-flex items-center justify-center transition-colors"
                title="Apagar tag"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="font-mono text-mono uppercase text-text-muted mb-2" style={{ letterSpacing: "0.1em" }}>
        Nova tag
      </p>
      <div className="grid sm:grid-cols-[1fr_auto_auto] gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: VIP, Cabelo difícil…"
          className="h-touch px-4 rounded-md bg-surface-card border border-border-strong focus:border-primary-500 focus:shadow-focus focus:outline-none transition-all"
        />
        <div className="flex items-center gap-1.5">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`size-7 rounded-full transition-transform ${color === c ? "ring-2 ring-offset-2 ring-offset-surface-card ring-primary-500 scale-110" : ""}`}
              style={{ background: c }}
              aria-label={c}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={add}
          disabled={pending}
          className="h-touch px-5 rounded-md bg-primary-500 text-neutral-50 font-medium hover:bg-primary-600 disabled:opacity-50 transition-all"
        >
          Criar tag
        </button>
      </div>
    </div>
  );
}
