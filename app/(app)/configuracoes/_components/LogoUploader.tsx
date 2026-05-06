"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

interface Props {
  currentLogoUrl: string | null;
  action: (fd: FormData) => Promise<void>;
  removeAction: () => Promise<void>;
}

export function LogoUploader({ currentLogoUrl, action, removeAction }: Props) {
  const [preview, setPreview] = useState<string | null>(currentLogoUrl);
  const [pending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPreview(URL.createObjectURL(f));
    const fd = new FormData();
    fd.set("logo", f);
    startTransition(async () => {
      await action(fd);
      toast.success("Logo atualizada");
    });
  }

  return (
    <div className="flex items-center gap-5">
      <div className="size-28 rounded-md bg-neutral-900 flex items-center justify-center overflow-hidden p-3">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Logo" className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="font-display text-h1 text-neutral-50">V</span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <label className="cursor-pointer inline-flex h-touch px-5 items-center rounded-md bg-primary-500 text-neutral-50 font-medium hover:bg-primary-600 transition-colors w-fit">
          <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={onChange} disabled={pending} className="hidden" />
          {pending ? "Enviando…" : preview ? "Trocar logo" : "Subir logo"}
        </label>
        {preview && (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setPreview(null);
              startTransition(async () => {
                await removeAction();
                toast.success("Logo removida");
              });
            }}
            className="text-body-sm text-text-muted hover:text-danger transition-colors w-fit"
          >
            Remover
          </button>
        )}
      </div>
    </div>
  );
}
