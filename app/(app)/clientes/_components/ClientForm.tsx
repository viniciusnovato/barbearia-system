"use client";

import { useState, useTransition } from "react";

interface ClientFormProps {
  action: (formData: FormData) => Promise<{ error?: string } | void>;
  initial?: {
    id?: string;
    full_name?: string;
    phone?: string | null;
    instagram?: string | null;
    notes?: string | null;
    photoUrl?: string | null;
  };
  submitLabel: string;
}

export function ClientForm({ action, initial, submitLabel }: ClientFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initial?.photoUrl ?? null);
  const [pending, startTransition] = useTransition();

  function onSubmit(fd: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await action(fd);
      if (res?.error) setError(res.error);
    });
  }

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setPhotoPreview(url);
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-5">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}

      {/* Foto */}
      <div className="flex items-center gap-5">
        {photoPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoPreview} alt="" className="size-20 rounded-full object-cover bg-neutral-200" />
        ) : (
          <span className="size-20 rounded-full bg-gradient-to-br from-primary-300 to-primary-700 text-neutral-50 flex items-center justify-center font-display text-h3">
            {initial?.full_name?.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "?"}
          </span>
        )}
        <label className="cursor-pointer">
          <span className="inline-flex h-9 px-4 items-center rounded-md border border-border-strong text-body-sm hover:bg-surface-sunken transition-colors">
            {photoPreview ? "Trocar foto" : "Adicionar foto"}
          </span>
          <input type="file" name="photo" accept="image/*" className="hidden" onChange={onPhotoChange} />
        </label>
      </div>

      <Field label="Nome completo" required>
        <input
          name="full_name"
          required
          defaultValue={initial?.full_name ?? ""}
          className="h-touch px-4 rounded-md bg-surface-card border border-border-strong w-full focus:border-primary-500 focus:shadow-focus focus:outline-none transition-all"
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Telefone">
          <input
            name="phone"
            defaultValue={initial?.phone ?? ""}
            placeholder="(11) 9 0000-0000"
            className="h-touch px-4 rounded-md bg-surface-card border border-border-strong w-full focus:border-primary-500 focus:shadow-focus focus:outline-none transition-all"
          />
        </Field>
        <Field label="Instagram">
          <input
            name="instagram"
            defaultValue={initial?.instagram ?? ""}
            placeholder="@cliente"
            className="h-touch px-4 rounded-md bg-surface-card border border-border-strong w-full focus:border-primary-500 focus:shadow-focus focus:outline-none transition-all"
          />
        </Field>
      </div>

      <Field label="Observações internas">
        <textarea
          name="notes"
          rows={4}
          defaultValue={initial?.notes ?? ""}
          placeholder="Notas que ficam só pra você (não aparecem no PDF)"
          className="px-4 py-3 rounded-md bg-surface-card border border-border-strong w-full focus:border-primary-500 focus:shadow-focus focus:outline-none transition-all"
        />
      </Field>

      {error && (
        <div className="px-4 py-3 rounded-md bg-status-conflict-bg text-status-conflict-fg text-body-sm ring-1 ring-inset ring-status-conflict-ring">
          {error}
        </div>
      )}

      <div className="flex gap-3 mt-2">
        <button
          type="submit"
          disabled={pending}
          className="h-touch px-6 rounded-md bg-primary-500 text-neutral-50 font-medium shadow-1 hover:bg-primary-600 disabled:opacity-50 transition-all"
        >
          {pending ? "Salvando…" : submitLabel}
        </button>
      </div>
    </form>
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
