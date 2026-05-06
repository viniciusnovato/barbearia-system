"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setNextReturnAction } from "../../actions";
import { buildGoogleCalendarUrl } from "@/lib/calendar/google";

interface Props {
  clientId: string;
  clientName: string;
  initialDate: string | null;
  initialNote: string | null;
}

export function NextReturnCard({ clientId, clientName, initialDate, initialNote }: Props) {
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(initialDate ? initialDate.slice(0, 10) : "");
  const [note, setNote] = useState(initialNote ?? "");
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", clientId);
      fd.set("next_return_at", date);
      fd.set("next_return_note", note);
      await setNextReturnAction(fd);
      toast.success(date ? "Retorno agendado" : "Retorno removido");
      setEditing(false);
    });
  }

  function clear() {
    setDate("");
    setNote("");
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", clientId);
      fd.set("next_return_at", "");
      fd.set("next_return_note", "");
      await setNextReturnAction(fd);
      toast.success("Retorno removido");
      setEditing(false);
    });
  }

  const display = (() => {
    if (!initialDate) return null;
    const d = new Date(initialDate);
    const now = new Date();
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / 86400000);
    return {
      date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }),
      diffDays,
    };
  })();

  if (!editing) {
    const gcalUrl = initialDate
      ? buildGoogleCalendarUrl({
          title: `Visagismo · ${clientName}`,
          description: initialNote ?? "Atendimento de retorno",
          start: initialDate,
          durationMinutes: 60,
        })
      : null;

    return (
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-md bg-status-suggested-bg text-status-suggested-fg ring-1 ring-inset ring-status-suggested-ring transition-all">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-body-sm flex-1 text-left hover:brightness-95 transition-all cursor-pointer"
        >
          {display ? (
            <>
              📅 Próximo retorno: <strong>{display.date}</strong>
              {display.diffDays > 0 && ` · em ${display.diffDays} dia${display.diffDays === 1 ? "" : "s"}`}
              {display.diffDays === 0 && " · hoje"}
              {display.diffDays < 0 && ` · atrasado ${Math.abs(display.diffDays)} dia${Math.abs(display.diffDays) === 1 ? "" : "s"}`}
              {initialNote && ` — ${initialNote}`}
            </>
          ) : (
            "📅 Agendar próximo retorno"
          )}
        </button>
        {gcalUrl && (
          <a
            href={gcalUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-surface-card text-text-secondary text-caption font-medium hover:text-text-primary transition-colors"
            title="Adicionar ao Google Calendar"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden>
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
            </svg>
            Google Calendar
          </a>
        )}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-caption text-status-suggested-fg/70 font-mono uppercase hover:text-status-suggested-fg transition-colors"
          style={{ letterSpacing: "0.06em" }}
        >
          editar
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-md bg-status-suggested-bg ring-1 ring-inset ring-status-suggested-ring p-4">
      <p className="font-mono text-mono uppercase text-status-suggested-fg mb-3" style={{ letterSpacing: "0.08em" }}>
        Próximo retorno
      </p>
      <div className="grid sm:grid-cols-[200px_1fr_auto] gap-3 items-end">
        <label className="flex flex-col gap-1.5">
          <span className="text-caption text-text-muted">Data</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-10 px-3 rounded-md bg-surface-card border border-border-strong focus:border-primary-500 focus:shadow-focus focus:outline-none transition-all"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-caption text-text-muted">Observação (opcional)</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex: ajustar barba, manutenção do degradê"
            className="h-10 px-3 rounded-md bg-surface-card border border-border-strong focus:border-primary-500 focus:shadow-focus focus:outline-none transition-all"
          />
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="h-10 px-4 rounded-md bg-primary-500 text-neutral-50 font-medium hover:bg-primary-600 disabled:opacity-50 transition-all"
          >
            Salvar
          </button>
          {initialDate && (
            <button
              type="button"
              onClick={clear}
              disabled={pending}
              className="h-10 px-3 rounded-md text-body-sm text-text-muted hover:bg-surface-card transition-colors"
            >
              Remover
            </button>
          )}
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="h-10 px-3 rounded-md text-body-sm text-text-muted hover:bg-surface-card transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
