"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signupAction } from "../login/actions";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    setConfirmMsg(null);
    startTransition(async () => {
      const res = await signupAction(formData);
      if (res?.error) setError(res.error);
      else if (res?.needsConfirm) {
        setConfirmMsg("Conta criada. Verifique seu e-mail para confirmar antes de entrar.");
      }
    });
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-surface-page">
      <aside className="hidden lg:flex flex-col justify-between p-10 bg-neutral-900 text-neutral-50 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(60% 60% at 30% 30%, rgba(201,160,90,0.35) 0%, rgba(0,0,0,0) 60%), radial-gradient(50% 50% at 80% 80%, rgba(83,91,137,0.3) 0%, rgba(0,0,0,0) 60%)",
          }}
        />
        <div className="relative">
          <p className="font-mono text-mono uppercase text-neutral-400" style={{ letterSpacing: "0.12em" }}>
            v0.1 · Sistema interno
          </p>
          <h1 className="font-display text-display mt-3 leading-[1.05]">Visagismo</h1>
        </div>
        <div className="relative">
          <p className="font-display text-h3 max-w-md leading-snug">
            "Cada atendimento, um dossiê. Cada cliente, uma história. Comece agora."
          </p>
          <p className="mt-6 font-mono text-mono uppercase text-neutral-400" style={{ letterSpacing: "0.1em" }}>
            Consultoria de imagem masculina · Premium
          </p>
        </div>
      </aside>

      <section className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-md">
          <header className="mb-8">
            <p className="font-mono text-mono uppercase text-text-muted mb-2" style={{ letterSpacing: "0.1em" }}>
              Criar conta de barbeiro
            </p>
            <h2 className="font-display text-h1 leading-tight">Cadastrar</h2>
            <p className="mt-2 text-text-secondary">Sua barbearia, seus clientes, seus dossiês.</p>
          </header>

          <form action={onSubmit} className="flex flex-col gap-4">
            <Field label="Nome completo" required>
              <input
                name="full_name"
                required
                placeholder="Seu nome"
                className="h-touch px-4 rounded-md border border-border-strong bg-surface-card text-body focus:border-primary-500 focus:shadow-focus focus:outline-none transition-all"
              />
            </Field>

            <Field label="Instagram (opcional)">
              <input
                name="instagram"
                placeholder="@suabarbearia"
                className="h-touch px-4 rounded-md border border-border-strong bg-surface-card text-body focus:border-primary-500 focus:shadow-focus focus:outline-none transition-all"
              />
            </Field>

            <Field label="E-mail" required>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="seu@email.com"
                className="h-touch px-4 rounded-md border border-border-strong bg-surface-card text-body focus:border-primary-500 focus:shadow-focus focus:outline-none transition-all"
              />
            </Field>

            <Field label="Senha" required>
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="h-touch px-4 rounded-md border border-border-strong bg-surface-card text-body focus:border-primary-500 focus:shadow-focus focus:outline-none transition-all"
              />
            </Field>

            {error && (
              <div className="px-4 py-3 rounded-md bg-status-conflict-bg text-status-conflict-fg text-body-sm ring-1 ring-inset ring-status-conflict-ring">
                {error}
              </div>
            )}
            {confirmMsg && (
              <div className="px-4 py-3 rounded-md bg-status-suggested-bg text-status-suggested-fg text-body-sm ring-1 ring-inset ring-status-suggested-ring">
                {confirmMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="mt-2 inline-flex items-center justify-center h-touch px-6 rounded-md bg-primary-500 text-neutral-50 font-medium shadow-1 hover:bg-primary-600 active:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Cadastrando…" : "Criar conta"}
            </button>
          </form>

          <p className="mt-8 text-body-sm text-text-secondary text-center">
            Já tem conta?{" "}
            <Link href="/login" className="text-primary-600 hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono text-mono uppercase text-text-secondary" style={{ letterSpacing: "0.08em" }}>
        {label} {required && <span className="text-danger">*</span>}
      </span>
      {children}
    </label>
  );
}
