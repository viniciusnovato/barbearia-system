"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { deleteDossierTemplateAction } from "../actions";

interface Template {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  fieldCount: number;
  fieldLabels: string[];
}

export function DossierTemplateList({ templates }: { templates: Template[] }) {
  const [pending, startTransition] = useTransition();

  function remove(t: Template) {
    if (!confirm(`Apagar template "${t.name}"?`)) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", t.id);
      await deleteDossierTemplateAction(fd);
      toast.success("Template removido");
    });
  }

  return (
    <ul className="flex flex-col gap-3">
      {templates.map((t) => (
        <li key={t.id} className="flex items-center gap-3 p-4 rounded-lg border border-border-subtle">
          <div className="flex-1 min-w-0">
            <p className="font-display text-h4">{t.name}</p>
            {t.description && <p className="text-body-sm text-text-secondary mt-0.5">{t.description}</p>}
            <p className="text-caption text-text-muted mt-2">
              {t.fieldCount} campo{t.fieldCount === 1 ? "" : "s"}: {t.fieldLabels.join(", ")}
              {t.fieldCount > 4 ? "…" : ""}
            </p>
          </div>
          <span className="font-mono text-caption text-text-muted">
            {new Date(t.createdAt).toLocaleDateString("pt-BR")}
          </span>
          <button
            type="button"
            onClick={() => remove(t)}
            disabled={pending}
            title="Apagar"
            className="size-9 rounded-md inline-flex items-center justify-center text-text-muted hover:bg-status-conflict-bg hover:text-status-conflict-fg transition-colors"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>
          </button>
        </li>
      ))}
    </ul>
  );
}
