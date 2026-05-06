"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createBrowserSupabase } from "@/lib/supabase/client";

interface Version {
  id: string;
  storage_path: string;
  generated_at: string;
}

interface Props {
  dossierId: string;
  clientName: string;
  clientPhone: string | null;
  versions: Version[];
}

export function PdfHistory({ dossierId, clientName, clientPhone, versions }: Props) {
  const [pending, startTransition] = useTransition();

  async function getSignedUrl(path: string): Promise<string | null> {
    const supabase = createBrowserSupabase();
    const { data } = await supabase.storage.from("pdfs").createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  }

  function downloadVersion(v: Version) {
    startTransition(async () => {
      const url = await getSignedUrl(v.storage_path);
      if (!url) { toast.error("Não consegui gerar link"); return; }
      window.open(url, "_blank");
    });
  }

  function shareWhatsApp(v: Version) {
    startTransition(async () => {
      const url = await getSignedUrl(v.storage_path);
      if (!url) { toast.error("Não consegui gerar link"); return; }
      const phone = (clientPhone ?? "").replace(/\D/g, "");
      const message =
        `Olá ${clientName.split(" ")[0]}! Aqui está o seu dossiê de visagismo personalizado:\n\n${url}\n\nO link é válido por 1 hora.`;
      const wa = phone
        ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
        : `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(wa, "_blank");
    });
  }

  if (versions.length === 0) {
    return (
      <p className="text-body-sm text-text-muted">
        Nenhum PDF gerado ainda. Quando finalizar e baixar, fica registrado aqui.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {versions.map((v, i) => (
        <li
          key={v.id}
          className="flex items-center gap-3 p-3 rounded-md bg-surface-card border border-border-subtle"
        >
          <span className="size-9 rounded-md bg-primary-50 text-primary-700 flex items-center justify-center font-mono text-body-sm">
            v{versions.length - i}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-body-sm font-medium">
              PDF gerado em {new Date(v.generated_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="font-mono text-caption text-text-muted truncate" style={{ letterSpacing: "0.06em" }}>
              {v.storage_path.split("/").pop()}
            </p>
          </div>
          <button
            type="button"
            onClick={() => downloadVersion(v)}
            disabled={pending}
            className="h-9 px-3 rounded-md text-body-sm border border-border-strong hover:bg-surface-sunken transition-colors disabled:opacity-50"
          >
            Baixar
          </button>
          <button
            type="button"
            onClick={() => shareWhatsApp(v)}
            disabled={pending}
            className="h-9 px-3 rounded-md text-body-sm bg-success/10 text-success ring-1 ring-inset ring-success/30 hover:bg-success/20 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
            title="Enviar pelo WhatsApp"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
              <path d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.4-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4-.1-.5-.1-.2-.6-1.5-.9-2-.2-.5-.5-.5-.6-.5h-.6c-.2 0-.5.1-.7.4-.2.3-.9.9-.9 2.2 0 1.3.9 2.5 1 2.7.1.2 1.8 2.7 4.4 3.8 2.6 1 2.6.7 3.1.6.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3z M12 2C6.5 2 2 6.5 2 12c0 1.7.5 3.4 1.3 4.8L2 22l5.3-1.4c1.4.8 2.9 1.2 4.7 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z" />
            </svg>
            WhatsApp
          </button>
        </li>
      ))}
    </ul>
  );
}
