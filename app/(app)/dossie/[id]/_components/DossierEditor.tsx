"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DOSSIER_SECTIONS, type SectionId } from "@/lib/dossier/schema";
import { FieldRow } from "./FieldRow";
import { TranscriptPanel } from "./TranscriptPanel";
import { ProductsSection } from "./ProductsSection";
import { ReferencesSection, type ReferenceAsset } from "./ReferencesSection";
import { finalizeDossierAction, updateDossierTitleAction } from "../../actions";

interface DossierField {
  id: string;
  section: string;
  field_key: string;
  value: string | null;
  status: string;
  source_block_ids: string[] | null;
}

interface Block {
  id: string;
  ord: number;
  speaker: string;
  text: string;
  intent: string | null;
  target_field_key: string | null;
  is_noise: boolean | null;
  start_seconds: number | null;
}

interface Audio {
  id: string;
  source: string;
  duration_seconds: number | null;
  processed_at: string | null;
  created_at: string;
  transcript_full: string | null;
  error: string | null;
}

interface Props {
  dossier: { id: string; title: string; status: string; scheduled_date: string; pdf_url: string | null };
  client: { id: string; full_name: string };
  activeSection: string;
  fields: DossierField[];
  blocks: Block[];
  audios: Audio[];
  progress: { id: string; total: number; filled: number; ready: number }[];
  missingRequiredCount: number;
  catalog: { id: string; name: string; description: string | null; photoUrl: string | null; price_brl: number | null }[];
  dossierProducts: { id: string; product_id: string | null; purchased: boolean; catalog: { id: string; name: string; description: string | null; price_brl: number | null; photoUrl: string | null } | null }[];
  references: { referencia_corte: ReferenceAsset[]; referencia_barba: ReferenceAsset[] };
}

export function DossierEditor({ dossier, client, activeSection, fields, blocks, audios, progress, missingRequiredCount, catalog, dossierProducts, references }: Props) {
  const [section, setSection] = useState<SectionId>(activeSection as SectionId);
  const [hoveredFieldKey, setHoveredFieldKey] = useState<string | null>(null);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(dossier.title);

  const sectionDef = DOSSIER_SECTIONS.find((s) => s.id === section)!;
  const sectionFields = useMemo(() => fields.filter((f) => f.section === section), [fields, section]);
  const isFinalized = dossier.status === "finalizado";

  return (
    <div className="grid lg:grid-cols-[260px_1fr_360px] min-h-[calc(100vh-64px)]">
      {/* Sidebar de seções */}
      <aside className="hidden lg:block bg-surface-card border-r border-border-subtle px-3 py-6 sticky top-16 self-start max-h-[calc(100vh-64px)] overflow-y-auto">
        <Link href={`/clientes/${client.id}`} className="text-body-sm text-text-secondary hover:text-text-primary inline-flex items-center gap-1 px-3 py-2 mb-2">
          ← {client.full_name}
        </Link>
        <p className="font-mono text-mono uppercase text-text-muted px-3 mb-2" style={{ letterSpacing: "0.1em" }}>
          Seções
        </p>
        <nav className="flex flex-col gap-1">
          {DOSSIER_SECTIONS.map((s) => {
            const p = progress.find((x) => x.id === s.id)!;
            const active = section === s.id;
            const allFilled = p.total > 0 && p.filled === p.total;
            const allReady = p.total > 0 && p.ready === p.total;
            // Cor:
            //   verde     → todos preenchidos E todos prontos (editado/aprovado)
            //   índigo IA → todos preenchidos mas há sugestões pendentes da IA pra revisar
            //   neutro    → parcial
            //   muted     → vazio
            const countColor = active
              ? "text-neutral-100"
              : allReady
              ? "text-success"
              : allFilled
              ? "text-ai-600"
              : p.filled > 0
              ? "text-text-secondary"
              : "text-text-muted";
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-md text-body-sm text-left transition-colors ${
                  active ? "bg-primary-500 text-neutral-50" : "text-text-secondary hover:bg-surface-sunken hover:text-text-primary"
                }`}
              >
                <span className="truncate">{s.title}</span>
                {p.total > 0 ? (
                  <span
                    className={`font-mono text-caption ${countColor}`}
                    title={`${p.filled} preenchidos · ${p.ready} prontos · ${p.total} total`}
                  >
                    {p.filled}/{p.total}
                    {allReady && " ✓"}
                  </span>
                ) : (
                  <span className={`font-mono text-caption ${active ? "text-neutral-100" : "text-text-muted"}`}>—</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-6 px-3 flex flex-col gap-2">
          <Link href={`/dossie/${dossier.id}/gravar`} className="flex items-center justify-center gap-2 h-10 rounded-md bg-neutral-900 text-neutral-50 text-body-sm font-medium hover:bg-neutral-800 transition-colors">
            <span className="size-2 rounded-full bg-danger animate-pulse" />
            Gravar / Importar áudio
          </Link>
          <Link href={`/dossie/${dossier.id}/anotar`} className="flex items-center justify-center gap-2 h-10 rounded-md border border-border-strong text-body-sm font-medium hover:bg-surface-sunken transition-colors">
            ✏️ Desenhar com iPad
          </Link>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="px-6 lg:px-10 py-8 max-w-3xl">
        {/* Topo */}
        <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.1em" }}>
              Dossiê · {new Date(dossier.scheduled_date).toLocaleDateString("pt-BR")}
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
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="font-display text-h2 px-2 py-1 -ml-2 rounded-md border border-border-strong bg-surface-card focus:border-primary-500 focus:outline-none w-full" autoFocus />
                <button className="h-9 px-4 rounded-md bg-primary-500 text-neutral-50 text-body-sm">Salvar</button>
                <button type="button" onClick={() => { setTitle(dossier.title); setEditingTitle(false); }} className="h-9 px-3 rounded-md text-body-sm text-text-secondary">Cancelar</button>
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

        {/* Cabeçalho da seção */}
        <div className="flex items-end justify-between gap-3 mb-5 pb-3 border-b border-border-strong">
          <div>
            <h2 className="font-display text-h2">{sectionDef.title}</h2>
            <p className="text-body-sm text-text-secondary mt-1">{sectionDef.subtitle}</p>
          </div>
          {sectionDef.fields.length > 0 && (() => {
            const p = progress.find((pp) => pp.id === section);
            if (!p) return null;
            return (
              <span className="font-mono text-mono uppercase text-text-muted shrink-0 flex items-center gap-3" style={{ letterSpacing: "0.08em" }}>
                <span className={p.ready === p.total ? "text-success" : ""} title="Prontos (editados ou aprovados)">{p.ready}/{p.total} prontos</span>
                {p.filled > p.ready && (
                  <span className="text-ai-600" title="Sugeridos pela IA aguardando revisão">{p.filled - p.ready} a revisar</span>
                )}
              </span>
            );
          })()}
        </div>

        {/* Produtos: render especial */}
        {section === "produtos" ? (
          <ProductsSection
            dossierId={dossier.id}
            catalog={catalog}
            dossierProducts={dossierProducts}
            isFinalized={isFinalized}
          />
        ) : sectionDef.fields.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-strong p-8 text-center">
            <p className="font-display text-h4 text-text-muted">Seção sem campos pré-definidos</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sectionDef.fields.map((fdef) => {
              const f = sectionFields.find((x) => x.field_key === fdef.key);
              if (!f) return null;
              return (
                <FieldRow
                  key={fdef.key}
                  fieldDef={fdef}
                  field={f}
                  dossierId={dossier.id}
                  blocks={blocks}
                  isFinalized={isFinalized}
                  highlight={hoveredBlockId !== null && (f.source_block_ids ?? []).includes(hoveredBlockId)}
                  onHover={setHoveredFieldKey}
                />
              );
            })}

            {/* Referências visuais nas seções corte e barba */}
            {section === "corte" && (
              <ReferencesSection
                dossierId={dossier.id}
                kind="referencia_corte"
                references={references.referencia_corte}
                isFinalized={isFinalized}
                suggested={3}
              />
            )}
            {section === "barba" && (
              <ReferencesSection
                dossierId={dossier.id}
                kind="referencia_barba"
                references={references.referencia_barba}
                isFinalized={isFinalized}
                suggested={2}
              />
            )}
          </div>
        )}

        {/* Finalização */}
        <div className="mt-10 pt-6 border-t border-border-subtle flex items-center justify-between gap-4 flex-wrap">
          <div>
            {missingRequiredCount > 0 ? (
              <p className="text-body-sm text-warning">
                Faltam <strong>{missingRequiredCount}</strong> campo(s) obrigatório(s) prontos antes de finalizar.
                <br />
                <span className="text-text-muted text-caption">
                  Campos sugeridos pela IA precisam ser <strong>editados ou aprovados</strong>.
                </span>
              </p>
            ) : (
              <p className="text-body-sm text-success">Tudo pronto. Você pode finalizar e gerar o PDF.</p>
            )}
          </div>
          <div className="flex gap-3 flex-wrap">
            {dossier.status === "finalizado" ? (
              <a href={`/api/dossier/${dossier.id}/pdf`} target="_blank" className="h-touch px-5 inline-flex items-center gap-2 rounded-md bg-primary-500 text-neutral-50 font-medium hover:bg-primary-600 transition-colors">
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
                    disabled={missingRequiredCount > 0}
                    className="h-touch px-5 inline-flex items-center gap-2 rounded-md bg-primary-500 text-neutral-50 font-medium shadow-1 hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Finalizar dossiê
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Painel direito — transcrição */}
      <TranscriptPanel
        audios={audios}
        blocks={blocks}
        dossierId={dossier.id}
        highlightedFieldKey={hoveredFieldKey}
        onHoverBlock={setHoveredBlockId}
      />
    </div>
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
    <span className={`text-caption uppercase font-medium px-2.5 h-6 inline-flex items-center rounded-full ring-1 ring-inset ${styles[status] ?? styles.rascunho}`} style={{ letterSpacing: "0.06em" }}>
      {labels[status] ?? status}
    </span>
  );
}
