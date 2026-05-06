"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-surface-page">
      <div className="max-w-md w-full text-center">
        <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.12em" }}>
          Erro inesperado
        </p>
        <h1 className="font-display text-h1 mt-3 mb-4">Algo deu errado</h1>
        <p className="text-body text-text-secondary mb-2">
          A gente registrou aqui e vai investigar. Tente recarregar.
        </p>
        {error.digest && (
          <p className="font-mono text-caption text-text-muted mb-6" style={{ letterSpacing: "0.06em" }}>
            ref: {error.digest}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="h-touch px-5 rounded-md bg-primary-500 text-neutral-50 font-medium hover:bg-primary-600 transition-colors"
          >
            Tentar de novo
          </button>
          <Link
            href="/dashboard"
            className="h-touch px-5 inline-flex items-center rounded-md border border-border-strong text-body-sm hover:bg-surface-sunken transition-colors"
          >
            Voltar ao painel
          </Link>
        </div>
      </div>
    </main>
  );
}
