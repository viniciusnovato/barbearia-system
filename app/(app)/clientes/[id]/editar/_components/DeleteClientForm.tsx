"use client";

import { useState } from "react";
import { deleteClientAction } from "../../../actions";

export function DeleteClientForm({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const matchesName = typed.trim().toLowerCase() === clientName.trim().toLowerCase();

  if (!confirming) {
    return (
      <div className="rounded-lg border border-status-conflict-ring p-5 bg-status-conflict-bg/40">
        <p className="font-display text-h4 text-status-conflict-fg">Apagar cliente</p>
        <p className="text-body-sm mt-1 text-text-secondary">
          Apaga o cliente, <strong>todos os dossiês, fotos e marcações</strong>. Esta ação não pode ser desfeita.
        </p>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-4 h-9 px-4 rounded-md border border-status-conflict-ring text-status-conflict-fg text-body-sm font-medium hover:bg-status-conflict-bg transition-all"
        >
          Apagar cliente…
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border-2 border-status-conflict-ring p-5 bg-status-conflict-bg">
      <p className="font-display text-h3 text-status-conflict-fg">Confirmar exclusão</p>
      <p className="text-body-sm mt-2 text-text-primary">
        Pra confirmar, digite <strong className="font-mono">{clientName}</strong> abaixo:
      </p>
      <input
        autoFocus
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        className="mt-3 h-touch w-full px-4 rounded-md bg-surface-card border border-status-conflict-ring focus:outline-none focus:ring-2 focus:ring-status-conflict-ring transition-all"
        placeholder={clientName}
      />

      <form action={deleteClientAction} className="flex gap-3 mt-4">
        <input type="hidden" name="id" value={clientId} />
        <button
          type="submit"
          disabled={!matchesName}
          className="h-touch px-5 rounded-md bg-danger text-neutral-50 font-medium hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          Apagar permanentemente
        </button>
        <button
          type="button"
          onClick={() => { setConfirming(false); setTyped(""); }}
          className="h-touch px-4 rounded-md text-body-sm text-text-secondary hover:bg-surface-card transition-colors"
        >
          Cancelar
        </button>
      </form>
    </div>
  );
}
