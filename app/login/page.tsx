"use client";

import { Suspense, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction } from "./actions";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await loginAction(formData);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-surface-page">
      {/* Brand panel — esquerda */}
      <aside className="hidden lg:flex flex-col justify-between p-10 bg-neutral-900 text-neutral-50 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(60% 60% at 30% 30%, rgba(201,160,90,0.35) 0%, rgba(0,0,0,0) 60%), radial-gradient(50% 50% at 80% 80%, rgba(83,91,137,0.3) 0%, rgba(0,0,0,0) 60%)",
          }}
        />
        <div className="relative">
          <p
            className="font-mono text-mono uppercase text-neutral-400"
            style={{ letterSpacing: "0.12em" }}
          >
            v0.1 · Sistema interno
          </p>
          <h1 className="font-display text-display mt-3 leading-[1.05]">Visagismo</h1>
        </div>
        <div className="relative">
          <p className="font-display text-h3 max-w-md leading-snug">
            "Imagem é estratégia. Cada atendimento, um dossiê. Cada cliente, uma história."
          </p>
          <p
            className="mt-6 font-mono text-mono uppercase text-neutral-400"
            style={{ letterSpacing: "0.1em" }}
          >
            Consultoria de imagem masculina · Premium
          </p>
        </div>
      </aside>

      {/* Form panel — direita */}
      <section className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-md">
          <header className="mb-8">
            <p
              className="font-mono text-mono uppercase text-text-muted mb-2"
              style={{ letterSpacing: "0.1em" }}
            >
              Acesso do barbeiro
            </p>
            <h2 className="font-display text-h1 leading-tight">Bem-vindo</h2>
            <p className="mt-2 text-text-secondary">
              Entre com seu e-mail para acessar os dossiês.
            </p>
          </header>

          <form action={onSubmit} className="flex flex-col gap-4">
            <input type="hidden" name="redirectTo" value={redirectTo} />

            <label className="flex flex-col gap-2">
              <span
                className="font-mono text-mono uppercase text-text-secondary"
                style={{ letterSpacing: "0.08em" }}
              >
                E-mail
              </span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="seu@email.com"
                className="h-touch px-4 rounded-md border border-border-strong bg-surface-card text-body focus:border-primary-500 focus:shadow-focus focus:outline-none transition-all"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span
                className="font-mono text-mono uppercase text-text-secondary"
                style={{ letterSpacing: "0.08em" }}
              >
                Senha
              </span>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="h-touch px-4 rounded-md border border-border-strong bg-surface-card text-body focus:border-primary-500 focus:shadow-focus focus:outline-none transition-all"
              />
            </label>

            {error && (
              <div className="px-4 py-3 rounded-md bg-status-conflict-bg text-status-conflict-fg text-body-sm ring-1 ring-inset ring-status-conflict-ring">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="mt-2 inline-flex items-center justify-center h-touch px-6 rounded-md bg-primary-500 text-neutral-50 font-medium shadow-1 hover:bg-primary-600 active:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <footer className="mt-10 pt-6 border-t border-border-subtle">
            <p
              className="font-mono text-caption uppercase text-text-muted mb-1"
              style={{ letterSpacing: "0.08em" }}
            >
              Conta de teste
            </p>
            <p className="text-body-sm text-text-secondary">
              <span className="font-mono">teste@mail.com</span> · senha{" "}
              <span className="font-mono">123456</span>
            </p>
          </footer>
        </div>
      </section>
    </main>
  );
}
