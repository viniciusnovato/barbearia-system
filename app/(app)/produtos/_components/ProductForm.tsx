"use client";

import { useState, useTransition } from "react";

interface ProductFormProps {
  action: (fd: FormData) => Promise<void>;
  initial?: {
    id?: string;
    name?: string;
    description?: string | null;
    how_to_use?: string | null;
    why_use?: string | null;
    price_brl?: number | null;
    photoUrl?: string | null;
  };
  submitLabel: string;
}

export function ProductForm({ action, initial, submitLabel }: ProductFormProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(initial?.photoUrl ?? null);
  const [pending, startTransition] = useTransition();

  function onSubmit(fd: FormData) {
    startTransition(async () => { await action(fd); });
  }

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoPreview(URL.createObjectURL(f));
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-5">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}

      <div className="flex items-center gap-5">
        {photoPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoPreview} alt="" className="size-24 rounded-md object-cover bg-neutral-200" />
        ) : (
          <div className="size-24 rounded-md bg-surface-sunken flex items-center justify-center text-text-muted">
            sem foto
          </div>
        )}
        <label className="cursor-pointer inline-flex h-9 px-4 items-center rounded-md border border-border-strong text-body-sm hover:bg-surface-sunken transition-colors">
          <input type="file" name="photo" accept="image/*" className="hidden" onChange={onPhotoChange} />
          {photoPreview ? "Trocar foto" : "Adicionar foto"}
        </label>
      </div>

      <Field label="Nome do produto" required>
        <input
          name="name"
          required
          defaultValue={initial?.name ?? ""}
          placeholder="Pomada matte premium"
          className="h-touch px-4 rounded-md bg-surface-card border border-border-strong w-full focus:border-primary-500 focus:shadow-focus focus:outline-none transition-all"
        />
      </Field>

      <div className="grid sm:grid-cols-[1fr_180px] gap-4">
        <Field label="Descrição curta">
          <input
            name="description"
            defaultValue={initial?.description ?? ""}
            placeholder="Pomada efeito matte com fixação média"
            className="h-touch px-4 rounded-md bg-surface-card border border-border-strong w-full focus:border-primary-500 focus:shadow-focus focus:outline-none transition-all"
          />
        </Field>
        <Field label="Preço (R$)">
          <input
            name="price_brl"
            type="text"
            inputMode="decimal"
            defaultValue={initial?.price_brl != null ? String(initial.price_brl).replace(".", ",") : ""}
            placeholder="59,90"
            className="h-touch px-4 rounded-md bg-surface-card border border-border-strong w-full focus:border-primary-500 focus:shadow-focus focus:outline-none transition-all"
          />
        </Field>
      </div>

      <Field label="Como usar">
        <textarea
          name="how_to_use"
          rows={3}
          defaultValue={initial?.how_to_use ?? ""}
          placeholder="Aplicar pequena quantidade no cabelo seco ou semi-úmido, modelando como desejado."
          className="px-4 py-3 rounded-md bg-surface-card border border-border-strong w-full focus:border-primary-500 focus:shadow-focus focus:outline-none transition-all"
        />
      </Field>

      <Field label="Por que usar">
        <textarea
          name="why_use"
          rows={3}
          defaultValue={initial?.why_use ?? ""}
          placeholder="Controla o volume sem brilho excessivo, mantém textura natural ao longo do dia."
          className="px-4 py-3 rounded-md bg-surface-card border border-border-strong w-full focus:border-primary-500 focus:shadow-focus focus:outline-none transition-all"
        />
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="h-touch px-6 self-start rounded-md bg-primary-500 text-neutral-50 font-medium shadow-1 hover:bg-primary-600 disabled:opacity-50 transition-all"
      >
        {pending ? "Salvando…" : submitLabel}
      </button>
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
