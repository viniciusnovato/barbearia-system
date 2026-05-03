"use client";

import { useState } from "react";
import type { FieldDef } from "@/lib/dossier/schema";
import { approveFieldAction, discardFieldAction, updateFieldAction } from "../../actions";

type FieldStatus = "vazio" | "sugerido" | "editado" | "aprovado" | "conflito";

interface Block {
  id: string;
  speaker: string;
  text: string;
  ord: number;
}

interface Props {
  fieldDef: FieldDef;
  field: {
    field_key: string;
    value: string | null;
    status: string;
    source_block_ids: string[] | null;
  };
  dossierId: string;
  blocks: Block[];
  isFinalized: boolean;
  highlight?: boolean;
  onHover?: (key: string | null) => void;
}

export function FieldRow({ fieldDef, field, dossierId, blocks, isFinalized, highlight, onHover }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(field.value ?? "");
  const [showOrigin, setShowOrigin] = useState(false);
  const status = field.status as FieldStatus;
  const sources = (field.source_block_ids ?? []).map((id) => blocks.find((b) => b.id === id)).filter(Boolean) as Block[];

  const borderClass = {
    vazio: "border-border-subtle",
    sugerido: "border-status-suggested-ring",
    editado: "border-status-edited-ring",
    aprovado: "border-status-approved-ring",
    conflito: "border-status-conflict-ring",
  }[status] ?? "border-border-subtle";

  return (
    <article
      onMouseEnter={() => onHover?.(field.field_key)}
      onMouseLeave={() => onHover?.(null)}
      className={`group relative rounded-lg border bg-surface-card shadow-1 transition-all ${borderClass} ${highlight ? "ring-2 ring-ai-500 ring-offset-2 ring-offset-surface-page" : ""}`}
    >
      <header className="flex items-start justify-between gap-3 px-5 pt-4">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h4 className="font-mono text-mono uppercase text-text-secondary" style={{ letterSpacing: "0.08em" }}>
            {fieldDef.label} {fieldDef.required && <span className="text-danger">*</span>}
          </h4>
          {fieldDef.helper && <p className="text-caption text-text-muted">{fieldDef.helper}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {status === "sugerido" && <AIBadge />}
          <StatusPill status={status} />
        </div>
      </header>

      <div className="px-5 py-3">
        {editing ? (
          <form
            action={async (fd) => {
              fd.set("dossier_id", dossierId);
              fd.set("field_key", field.field_key);
              fd.set("value", value);
              await updateFieldAction(fd);
              setEditing(false);
            }}
            className="flex flex-col gap-2"
          >
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
              rows={3}
              className="w-full px-3 py-2 rounded-md border border-border-strong bg-surface-page font-display text-body-lg leading-snug focus:border-primary-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <button type="submit" className="h-9 px-4 rounded-md bg-primary-500 text-neutral-50 text-body-sm font-medium hover:bg-primary-600">
                Salvar
              </button>
              <button type="button" onClick={() => { setValue(field.value ?? ""); setEditing(false); }} className="h-9 px-3 rounded-md text-body-sm text-text-secondary hover:bg-surface-sunken">
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div onClick={() => !isFinalized && setEditing(true)} className={`font-display text-h4 leading-snug ${!isFinalized ? "cursor-text" : ""}`}>
            {field.value ? (
              <p className="text-text-primary whitespace-pre-wrap">{field.value}</p>
            ) : (
              <p className="italic text-text-muted">Aguardando preenchimento…</p>
            )}
          </div>
        )}
      </div>

      <footer className="flex items-center justify-between gap-3 px-5 pb-4 pt-2 border-t border-border-subtle">
        <div className="flex items-center gap-3 text-body-sm text-text-muted">
          {sources.length > 0 && (
            <button
              type="button"
              onClick={() => setShowOrigin((s) => !s)}
              className="inline-flex items-center gap-1 text-text-secondary hover:text-primary-600 transition-colors"
            >
              <QuoteIcon /> Ver origem ({sources.length})
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!isFinalized && status !== "vazio" && (
            <form action={discardFieldAction}>
              <input type="hidden" name="dossier_id" value={dossierId} />
              <input type="hidden" name="field_key" value={field.field_key} />
              <button title="Descartar" className="size-8 rounded-md inline-flex items-center justify-center text-text-muted hover:bg-surface-sunken hover:text-danger transition-colors">
                <TrashIcon />
              </button>
            </form>
          )}
          {!isFinalized && (
            <button onClick={() => setEditing(true)} title="Editar" className="size-8 rounded-md inline-flex items-center justify-center text-text-muted hover:bg-surface-sunken hover:text-text-primary transition-colors">
              <PencilIcon />
            </button>
          )}
          {!isFinalized && status !== "aprovado" && status !== "vazio" && (
            <form action={approveFieldAction}>
              <input type="hidden" name="dossier_id" value={dossierId} />
              <input type="hidden" name="field_key" value={field.field_key} />
              <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-status-approved-bg text-status-approved-fg text-body-sm font-medium ring-1 ring-inset ring-status-approved-ring hover:brightness-105 transition-all">
                <CheckIcon /> Aprovar
              </button>
            </form>
          )}
        </div>
      </footer>

      {showOrigin && sources.length > 0 && (
        <div className="px-5 pb-4 -mt-1">
          <div className="rounded-md bg-surface-sunken p-3 flex flex-col gap-2">
            {sources.map((b) => (
              <p key={b.id} className="text-body-sm">
                <span className="font-mono text-caption uppercase text-text-muted mr-2" style={{ letterSpacing: "0.06em" }}>
                  {b.speaker}
                </span>
                "{b.text}"
              </p>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

function StatusPill({ status }: { status: FieldStatus }) {
  const styles = {
    vazio: "bg-status-empty-bg text-status-empty-fg ring-status-empty-ring",
    sugerido: "bg-status-suggested-bg text-status-suggested-fg ring-status-suggested-ring",
    editado: "bg-status-edited-bg text-status-edited-fg ring-status-edited-ring",
    aprovado: "bg-status-approved-bg text-status-approved-fg ring-status-approved-ring",
    conflito: "bg-status-conflict-bg text-status-conflict-fg ring-status-conflict-ring",
  } as const;
  const labels = { vazio: "Vazio", sugerido: "Sugerido", editado: "Editado", aprovado: "Aprovado", conflito: "Contradição" };
  return (
    <span className={`text-caption uppercase font-medium px-2.5 h-6 inline-flex items-center rounded-full ring-1 ring-inset ${styles[status]}`} style={{ letterSpacing: "0.06em" }}>
      {labels[status]}
    </span>
  );
}

function AIBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 h-6 rounded-full bg-ai-50 text-ai-700 text-caption font-medium ring-1 ring-inset ring-ai-200">
      <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><path d="M12 2.5l1.8 5.7 5.7 1.8-5.7 1.8L12 17.5l-1.8-5.7-5.7-1.8 5.7-1.8L12 2.5z" /></svg>
      IA
    </span>
  );
}
function PencilIcon() { return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 3.5l4 4L7 21H3v-4L16.5 3.5z" /></svg>; }
function TrashIcon() { return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>; }
function CheckIcon() { return <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>; }
function QuoteIcon() { return <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M7 7h4v4H8v3H5V9a2 2 0 012-2zm9 0h4v4h-3v3h-3V9a2 2 0 012-2z" /></svg>; }
