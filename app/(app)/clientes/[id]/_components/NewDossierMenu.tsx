"use client";

import { useTransition } from "react";
import { createDossierAction } from "../../../dossie/actions";

export function NewDossierMenu({ clientId }: { clientId: string }) {
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
    <div className="flex flex-col sm:flex-row gap-2">
      <button
        type="button"
        onClick={() => start("entrevista")}
        disabled={pending}
        title="7 seções, 22 campos, gera PDF de visagismo. Use no primeiro encontro."
        className="h-touch px-5 inline-flex items-center justify-center gap-2 rounded-md bg-primary-500 text-neutral-50 font-medium shadow-1 hover:bg-primary-600 disabled:opacity-50 transition-all"
      >
        {pending ? "Criando…" : "+ Atendimento completo"}
      </button>
      <button
        type="button"
        onClick={() => start("acompanhamento")}
        disabled={pending}
        title="Resumo simples + foto + ajustes. Ideal pra retornos mensais."
        className="h-touch px-5 inline-flex items-center justify-center gap-2 rounded-md border border-border-strong text-text-primary font-medium hover:bg-surface-sunken disabled:opacity-50 transition-all"
      >
        {pending ? "Criando…" : "+ Acompanhamento"}
      </button>
    </div>
  );
}
