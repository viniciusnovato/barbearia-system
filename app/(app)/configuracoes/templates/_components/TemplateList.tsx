"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { deleteTemplateAction } from "../actions";

interface Template {
  id: string;
  name: string;
  vector_data: unknown;
  is_default: boolean | null;
  barber_id: string | null;
  created_at: string;
}

interface Props { templates: Template[]; editable: boolean }

export function TemplateList({ templates, editable }: Props) {
  const [pending, startTransition] = useTransition();

  function remove(id: string, name: string) {
    if (!confirm(`Apagar "${name}"?`)) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      await deleteTemplateAction(fd);
      toast.success("Template removido");
    });
  }

  return (
    <ul className="grid sm:grid-cols-2 gap-3">
      {templates.map((t) => {
        const v = t.vector_data as { strokes?: Array<unknown> } | null;
        const count = v?.strokes?.length ?? 0;
        return (
          <li
            key={t.id}
            className="flex items-center gap-3 p-4 rounded-lg bg-surface-card border border-border-subtle"
          >
            <TemplatePreview vectorData={t.vector_data} />
            <div className="flex-1 min-w-0">
              <p className="font-display text-h4 truncate">{t.name}</p>
              <p className="text-caption text-text-muted">
                {count} traço{count === 1 ? "" : "s"}
                {t.is_default ? " · default" : ""}
              </p>
            </div>
            {editable && (
              <button
                type="button"
                onClick={() => remove(t.id, t.name)}
                disabled={pending}
                title="Apagar"
                className="size-9 rounded-md inline-flex items-center justify-center text-text-muted hover:bg-status-conflict-bg hover:text-status-conflict-fg transition-colors"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function TemplatePreview({ vectorData }: { vectorData: unknown }) {
  const v = vectorData as { strokes?: Array<{ tool: string; color: string; size?: number; points: Array<{ x: number; y: number }> }> } | null;
  const strokes = v?.strokes ?? [];

  return (
    <div className="size-16 rounded-md bg-surface-sunken border border-border-subtle flex-shrink-0 overflow-hidden">
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
        {strokes.map((s, i) => {
          if (s.points.length < 2) return null;
          if (s.tool === "circle") {
            const a = s.points[0], b = s.points[s.points.length - 1];
            return (
              <ellipse
                key={i}
                cx={((a.x + b.x) / 2) * 100}
                cy={((a.y + b.y) / 2) * 100}
                rx={(Math.abs(b.x - a.x) / 2) * 100}
                ry={(Math.abs(b.y - a.y) / 2) * 100}
                fill="none"
                stroke={s.color}
                strokeWidth={1.5}
              />
            );
          }
          if (s.tool === "line" || s.tool === "arrow") {
            const a = s.points[0], b = s.points[s.points.length - 1];
            return <line key={i} x1={a.x * 100} y1={a.y * 100} x2={b.x * 100} y2={b.y * 100} stroke={s.color} strokeWidth={1.5} strokeLinecap="round" />;
          }
          const d = s.points.map((p, j) => `${j === 0 ? "M" : "L"} ${p.x * 100} ${p.y * 100}`).join(" ");
          return <path key={i} d={d} fill="none" stroke={s.color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />;
        })}
      </svg>
    </div>
  );
}
