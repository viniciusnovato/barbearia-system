"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { toggleClientTagAction } from "@/app/(app)/configuracoes/tags/actions";

interface Tag { id: string; name: string; color: string }

interface Props {
  clientId: string;
  allTags: Tag[];
  selectedIds: string[];
}

export function ClientTagPicker({ clientId, allTags, selectedIds: initialSelected }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggle(tagId: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("client_id", clientId);
      fd.set("tag_id", tagId);
      await toggleClientTagAction(fd);
      const next = new Set(selected);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      setSelected(next);
    });
  }

  const selectedTags = allTags.filter((t) => selected.has(t.id));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {selectedTags.map((t) => (
        <span
          key={t.id}
          className="inline-flex items-center h-7 px-3 rounded-full text-caption font-medium"
          style={{ background: `${t.color}22`, color: t.color, border: `1px solid ${t.color}55` }}
        >
          {t.name}
        </span>
      ))}

      {allTags.length > 0 && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            disabled={pending}
            className="h-7 px-3 rounded-full text-caption text-text-muted border border-dashed border-border-strong hover:bg-surface-sunken transition-colors"
          >
            {selectedTags.length === 0 ? "+ Adicionar tag" : "+ Tag"}
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute left-0 top-9 z-20 w-56 rounded-lg bg-surface-card border border-border-strong shadow-3 overflow-hidden">
                <p className="font-mono text-mono uppercase text-text-muted px-3 pt-3 pb-1.5" style={{ letterSpacing: "0.1em" }}>
                  Marcar como
                </p>
                {allTags.map((t) => {
                  const isOn = selected.has(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggle(t.id)}
                      className="w-full text-left px-3 py-2 text-body-sm hover:bg-surface-sunken transition-colors flex items-center gap-2"
                    >
                      <span className="size-3 rounded-full" style={{ background: t.color }} />
                      <span className="flex-1">{t.name}</span>
                      {isOn && <span className="text-success">✓</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {allTags.length === 0 && (
        <a href="/configuracoes/tags" className="text-caption text-text-muted hover:text-primary-600 transition-colors">
          Criar tags em /configuracoes →
        </a>
      )}
    </div>
  );
}
