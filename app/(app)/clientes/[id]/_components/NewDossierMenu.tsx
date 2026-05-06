"use client";

import { useState, useTransition } from "react";
import { createDossierAction } from "../../../dossie/actions";

export function NewDossierMenu({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function start(mode: "entrevista" | "acompanhamento") {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("client_id", clientId);
      fd.set("mode", mode);
      try {
        await createDossierAction(fd);
      } catch {
        // redirect throws — sucesso silencioso
      }
    });
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        className="h-touch px-5 inline-flex items-center gap-2 rounded-md bg-primary-500 text-neutral-50 font-medium shadow-1 hover:bg-primary-600 disabled:opacity-50 transition-all"
      >
        {pending ? "Criando…" : "+ Novo dossiê"}
      </button>
      {open && !pending && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-20 w-72 rounded-lg bg-surface-card border border-border-strong shadow-3 overflow-hidden">
            <button
              type="button"
              onClick={() => { setOpen(false); start("entrevista"); }}
              className="w-full text-left px-4 py-3 hover:bg-surface-sunken transition-colors border-b border-border-subtle"
            >
              <p className="font-display text-h4">Atendimento completo</p>
              <p className="text-caption text-text-muted mt-0.5">
                7 seções, 22 campos, gera PDF de visagismo. Use no primeiro encontro.
              </p>
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); start("acompanhamento"); }}
              className="w-full text-left px-4 py-3 hover:bg-surface-sunken transition-colors"
            >
              <p className="font-display text-h4">Acompanhamento rápido</p>
              <p className="text-caption text-text-muted mt-0.5">
                Resumo simples + foto + ajustes. Ideal pra retornos mensais.
              </p>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
