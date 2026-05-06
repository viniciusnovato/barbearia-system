"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { applyTemplateAction, saveAsTemplateAction } from "../../actions";

interface Template {
  id: string;
  name: string;
  description: string | null;
  fieldCount: number;
}

interface Props {
  dossierId: string;
  templates: Template[];
}

export function DossierTemplatesMenu({ dossierId, templates }: Props) {
  const [open, setOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();

  function apply(tplId: string, tplName: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("dossier_id", dossierId);
      fd.set("template_id", tplId);
      await applyTemplateAction(fd);
      toast.success(`"${tplName}" aplicado`, { description: "Campos não-aprovados foram preenchidos." });
      setOpen(false);
    });
  }

  function save() {
    if (!name.trim()) { toast.error("Dê um nome ao template"); return; }
    startTransition(async () => {
      const fd = new FormData();
      fd.set("dossier_id", dossierId);
      fd.set("name", name);
      fd.set("description", description);
      await saveAsTemplateAction(fd);
      toast.success(`Template "${name}" salvo`);
      setSaveOpen(false);
      setName("");
      setDescription("");
    });
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setSaveOpen(false); }}
        className="h-9 px-3 rounded-md border border-border-strong text-body-sm hover:bg-surface-sunken transition-colors"
      >
        Templates
      </button>
      {open && !saveOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-20 w-72 rounded-lg bg-surface-card border border-border-strong shadow-3 overflow-hidden">
            <p className="font-mono text-mono uppercase text-text-muted px-3 pt-3 pb-1.5" style={{ letterSpacing: "0.1em" }}>
              Aplicar
            </p>
            {templates.length === 0 ? (
              <p className="px-3 pb-3 text-caption text-text-muted">Nenhum template salvo.</p>
            ) : (
              templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => apply(t.id, t.name)}
                  disabled={pending}
                  className="w-full text-left px-3 py-2 text-body-sm hover:bg-surface-sunken transition-colors disabled:opacity-50"
                >
                  <p>{t.name}</p>
                  <p className="text-caption text-text-muted">{t.fieldCount} campo(s)</p>
                </button>
              ))
            )}
            <div className="border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setSaveOpen(true)}
                className="w-full text-left px-3 py-2.5 text-body-sm text-primary-600 hover:bg-surface-sunken transition-colors font-medium"
              >
                + Salvar este dossiê como template
              </button>
              <Link
                href="/configuracoes/templates-dossie"
                className="block px-3 py-2 text-caption text-text-muted hover:bg-surface-sunken transition-colors"
              >
                Gerenciar templates →
              </Link>
            </div>
          </div>
        </>
      )}

      {saveOpen && (
        <>
          <div className="fixed inset-0 z-10 bg-black/30" onClick={() => setSaveOpen(false)} />
          <div className="absolute right-0 top-11 z-20 w-80 rounded-lg bg-surface-card border border-border-strong shadow-4 p-4">
            <p className="font-display text-h4 mb-3">Salvar como template</p>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome (ex: Executivo, Criativo…)"
              className="h-10 w-full px-3 mb-2 rounded-md border border-border-strong bg-surface-card focus:border-primary-500 focus:outline-none"
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição (opcional)"
              className="h-10 w-full px-3 mb-3 rounded-md border border-border-strong bg-surface-card focus:border-primary-500 focus:outline-none"
            />
            <p className="text-caption text-text-muted mb-3">
              Apenas campos com conteúdo (não-vazios) serão salvos.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={save}
                disabled={pending}
                className="flex-1 h-10 rounded-md bg-primary-500 text-neutral-50 font-medium hover:bg-primary-600 disabled:opacity-50 transition-all"
              >
                {pending ? "Salvando…" : "Salvar"}
              </button>
              <button
                type="button"
                onClick={() => setSaveOpen(false)}
                className="h-10 px-3 rounded-md text-body-sm text-text-muted hover:bg-surface-sunken transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
