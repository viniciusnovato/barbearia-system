"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ProductsSection } from "./ProductsSection";
import { EvolutionPhotos, type DossierPhoto } from "./EvolutionPhotos";
import {
  finalizeDossierAction,
  updateDossierTitleAction,
  updateDossierSummaryAction,
  updateFieldAction,
} from "../../actions";

interface DossierField {
  id: string;
  field_key: string;
  value: string | null;
  status: string;
}

interface Props {
  dossier: {
    id: string;
    title: string;
    status: string;
    scheduled_date: string;
    summary_done: string | null;
  };
  client: { id: string; full_name: string; phone: string | null };
  fields: DossierField[];
  catalog: { id: string; name: string; description: string | null; photoUrl: string | null; price_brl: number | null }[];
  dossierProducts: { id: string; product_id: string | null; purchased: boolean; catalog: { id: string; name: string; description: string | null; price_brl: number | null; photoUrl: string | null } | null }[];
  photos: DossierPhoto[];
}

export function AcompanhamentoEditor({ dossier, client, fields, catalog, dossierProducts, photos }: Props) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(dossier.title);
  const [summary, setSummary] = useState(dossier.summary_done ?? "");
  const [ajustes, setAjustes] = useState(
    fields.find((f) => f.field_key === "ajustes_personalizados")?.value ?? "",
  );
  const [pending, startTransition] = useTransition();
  const isFinalized = dossier.status === "finalizado";

  function saveSummary() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("dossier_id", dossier.id);
      fd.set("summary_done", summary);
      await updateDossierSummaryAction(fd);
      toast.success("Resumo salvo");
    });
  }

  function saveAjustes() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("dossier_id", dossier.id);
      fd.set("field_key", "ajustes_personalizados");
      fd.set("value", ajustes);
      await updateFieldAction(fd);
      toast.success("Ajustes salvos");
    });
  }

  return (
    <main className="max-w-3xl mx-auto px-6 lg:px-10 py-10">
      <Link
        href={`/clientes/${client.id}`}
        className="text-body-sm text-text-secondary hover:text-text-primary inline-flex items-center gap-1 mb-6"
      >
        ← {client.full_name}
      </Link>

      {/* Header */}
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.1em" }}>
            Acompanhamento · {new Date(dossier.scheduled_date).toLocaleDateString("pt-BR")}
          </p>
          {editingTitle ? (
            <form
              action={async (fd) => {
                fd.set("dossier_id", dossier.id);
                fd.set("title", title);
                await updateDossierTitleAction(fd);
                setEditingTitle(false);
              }}
              className="flex items-center gap-2 mt-2"
            >
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="font-display text-h2 px-2 py-1 -ml-2 rounded-md border border-border-strong bg-surface-card focus:border-primary-500 focus:outline-none w-full"
                autoFocus
              />
              <button className="h-9 px-4 rounded-md bg-primary-500 text-neutral-50 text-body-sm">Salvar</button>
              <button
                type="button"
                onClick={() => { setTitle(dossier.title); setEditingTitle(false); }}
                className="h-9 px-3 rounded-md text-body-sm text-text-secondary"
              >
                Cancelar
              </button>
            </form>
          ) : (
            <h1
              onClick={() => !isFinalized && setEditingTitle(true)}
              className={`font-display text-h1 mt-1 ${!isFinalized ? "cursor-pointer hover:text-primary-600" : ""} transition-colors`}
              title={!isFinalized ? "Clique para renomear" : undefined}
            >
              {dossier.title}
            </h1>
          )}
        </div>
        <StatusBadge status={dossier.status} />
      </header>

      <p className="text-body text-text-secondary mb-8">
        Modo simplificado pra retornos. Anote o que foi feito, ajuste o que mudou, marque produtos. Sem campos
        obrigatórios.
      </p>

      {/* Atalhos */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link
          href={`/dossie/${dossier.id}/gravar`}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-neutral-900 text-neutral-50 text-body-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          <span className="size-2 rounded-full bg-danger animate-pulse" />
          Gravar áudio
        </Link>
        <Link
          href={`/dossie/${dossier.id}/anotar`}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-md border border-border-strong text-body-sm font-medium hover:bg-surface-sunken transition-colors"
        >
          📷 Foto / desenho
        </Link>
      </div>

      {/* Resumo do que foi feito */}
      <section className="mb-8 rounded-lg bg-surface-card border border-border-subtle p-5">
        <p className="font-mono text-mono uppercase text-text-secondary mb-2" style={{ letterSpacing: "0.08em" }}>
          O que foi feito hoje
        </p>
        <p className="text-caption text-text-muted mb-3">
          Resumo do atendimento. Aparece na timeline do cliente e no PDF de acompanhamento.
        </p>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          onBlur={saveSummary}
          disabled={isFinalized}
          rows={4}
          placeholder="Ex: Manutenção do degradê, redução de volume nas laterais, alinhamento da barba."
          className="w-full px-3 py-2 rounded-md bg-surface-card border border-border-strong focus:border-primary-500 focus:shadow-focus focus:outline-none transition-all text-body resize-y disabled:opacity-60"
        />
      </section>

      {/* Ajustes / observações */}
      <section className="mb-8 rounded-lg bg-surface-card border border-border-subtle p-5">
        <p className="font-mono text-mono uppercase text-text-secondary mb-2" style={{ letterSpacing: "0.08em" }}>
          Ajustes e observações
        </p>
        <p className="text-caption text-text-muted mb-3">
          Mudanças no padrão do cliente, pedidos novos, observações pra próxima vez.
        </p>
        <textarea
          value={ajustes}
          onChange={(e) => setAjustes(e.target.value)}
          onBlur={saveAjustes}
          disabled={isFinalized}
          rows={3}
          placeholder="Ex: Pediu pra deixar um pouco mais comprido no topo, voltar em 3 semanas."
          className="w-full px-3 py-2 rounded-md bg-surface-card border border-border-strong focus:border-primary-500 focus:shadow-focus focus:outline-none transition-all text-body resize-y disabled:opacity-60"
        />
      </section>

      {/* Fotos da evolução */}
      <div className="mb-8">
        <EvolutionPhotos dossierId={dossier.id} photos={photos} isFinalized={isFinalized} />
      </div>

      {/* Produtos */}
      <section className="mb-8 rounded-lg bg-surface-card border border-border-subtle p-5">
        <p className="font-mono text-mono uppercase text-text-secondary mb-3" style={{ letterSpacing: "0.08em" }}>
          Produtos
        </p>
        <ProductsSection
          dossierId={dossier.id}
          catalog={catalog}
          dossierProducts={dossierProducts}
          isFinalized={isFinalized}
        />
      </section>

      {/* Finalização */}
      <div className="mt-10 pt-6 border-t border-border-subtle flex items-center justify-between gap-4 flex-wrap">
        <p className="text-body-sm text-text-secondary">
          {isFinalized
            ? "Acompanhamento finalizado."
            : "Pronto pra fechar quando quiser. Atualiza a última visita e libera o PDF."}
        </p>
        <div className="flex gap-3 flex-wrap">
          {isFinalized ? (
            <a
              href={`/api/dossier/${dossier.id}/pdf`}
              target="_blank"
              className="h-touch px-5 inline-flex items-center gap-2 rounded-md bg-primary-500 text-neutral-50 font-medium hover:bg-primary-600 transition-colors"
            >
              Baixar PDF
            </a>
          ) : (
            <>
              <a
                href={`/api/dossier/${dossier.id}/pdf?preview=1`}
                target="_blank"
                className="h-touch px-5 inline-flex items-center gap-2 rounded-md border border-border-strong text-text-primary font-medium hover:bg-surface-sunken transition-colors"
              >
                Pré-visualizar PDF
              </a>
              <form action={finalizeDossierAction}>
                <input type="hidden" name="dossier_id" value={dossier.id} />
                <button
                  disabled={pending}
                  className="h-touch px-5 inline-flex items-center gap-2 rounded-md bg-primary-500 text-neutral-50 font-medium shadow-1 hover:bg-primary-600 disabled:opacity-50 transition-all"
                >
                  Finalizar acompanhamento
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    rascunho: "bg-status-empty-bg text-status-empty-fg ring-status-empty-ring",
    em_revisao: "bg-status-suggested-bg text-status-suggested-fg ring-status-suggested-ring",
    finalizado: "bg-status-approved-bg text-status-approved-fg ring-status-approved-ring",
  };
  const labels: Record<string, string> = { rascunho: "Rascunho", em_revisao: "Em revisão", finalizado: "Finalizado" };
  return (
    <span
      className={`text-caption uppercase font-medium px-2.5 h-6 inline-flex items-center rounded-full ring-1 ring-inset ${styles[status] ?? styles.rascunho}`}
      style={{ letterSpacing: "0.06em" }}
    >
      {labels[status] ?? status}
    </span>
  );
}
