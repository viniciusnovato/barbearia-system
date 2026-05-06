"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { deleteProductAction } from "../actions";

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirm(`Apagar "${name}" do catálogo? Histórico nos dossiês fica preservado.`)) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      try {
        await deleteProductAction(fd);
        toast.success("Produto apagado");
      } catch {
        // redirect throws — sucesso silencioso
      }
    });
  }

  return (
    <div className="rounded-lg border border-status-conflict-ring p-5 bg-status-conflict-bg/40">
      <p className="font-display text-h4 text-status-conflict-fg">Apagar produto</p>
      <p className="text-body-sm mt-1 text-text-secondary">
        Remove o produto do catálogo. Histórico nos dossiês fica preservado.
      </p>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="mt-4 h-9 px-4 rounded-md bg-danger text-neutral-50 text-body-sm font-medium hover:brightness-110 disabled:opacity-50 transition-all"
      >
        {pending ? "Apagando…" : "Apagar"}
      </button>
    </div>
  );
}
