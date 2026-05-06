"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { ANGLES } from "../_const";

interface Props {
  clientId: string;
  action: (fd: FormData) => Promise<void>;
}

export function PhotoUploader({ clientId, action }: Props) {
  const [angle, setAngle] = useState<string>("frontal");
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPreview(URL.createObjectURL(f));
  }

  function submit() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Escolha uma foto");
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.set("client_id", clientId);
      fd.set("angle", angle);
      fd.set("caption", caption);
      fd.set("photo", file);
      await action(fd);
      toast.success("Foto adicionada");
      setPreview(null);
      setCaption("");
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  return (
    <div className="grid sm:grid-cols-[160px_1fr] gap-4 items-start">
      <label className="cursor-pointer">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="w-40 h-32 rounded-md object-cover bg-neutral-200" />
        ) : (
          <div className="w-40 h-32 rounded-md bg-surface-sunken border border-dashed border-border-strong flex items-center justify-center text-text-muted text-caption">
            Escolher foto
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      </label>

      <div className="flex flex-col gap-3">
        <div>
          <label className="block font-mono text-mono uppercase text-text-secondary mb-1.5" style={{ letterSpacing: "0.08em" }}>
            Ângulo
          </label>
          <div className="flex flex-wrap gap-1.5">
            {ANGLES.map((a) => {
              const active = angle === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAngle(a.id)}
                  className={`h-8 px-3 rounded-full text-caption transition-colors ${
                    active
                      ? "bg-neutral-900 text-neutral-50"
                      : "bg-surface-card border border-border-strong text-text-secondary hover:border-primary-300"
                  }`}
                >
                  {a.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block font-mono text-mono uppercase text-text-secondary mb-1.5" style={{ letterSpacing: "0.08em" }}>
            Legenda (opcional)
          </label>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Ex: pré-corte, sem barba, luz natural"
            className="h-10 w-full px-3 rounded-md bg-surface-card border border-border-strong focus:border-primary-500 focus:shadow-focus focus:outline-none transition-all"
          />
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={pending || !preview}
          className="self-start h-10 px-5 rounded-md bg-primary-500 text-neutral-50 font-medium hover:bg-primary-600 disabled:opacity-50 transition-all"
        >
          {pending ? "Enviando…" : "Adicionar à galeria"}
        </button>
      </div>
    </div>
  );
}
