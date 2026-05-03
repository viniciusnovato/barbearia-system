"use client";

import Link from "next/link";
import { ReprocessButton } from "./ReprocessButton";

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
  audios: Audio[];
  blocks: Block[];
  dossierId: string;
  highlightedFieldKey: string | null;
  onHoverBlock?: (id: string | null) => void;
}

export function TranscriptPanel({ audios, blocks, dossierId, highlightedFieldKey, onHoverBlock }: Props) {
  const totalSec = audios.reduce((s, a) => s + (a.duration_seconds ?? 0), 0);
  const processedCount = audios.filter((a) => a.processed_at).length;

  return (
    <aside className="hidden lg:flex flex-col bg-surface-card border-l border-border-subtle sticky top-16 self-start max-h-[calc(100vh-64px)] overflow-hidden">
      <header className="px-5 py-4 border-b border-border-subtle">
        <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.1em" }}>
          Transcrição
        </p>
        <p className="text-body-sm text-text-secondary mt-1">
          {audios.length === 0 ? (
            "Nenhum áudio processado"
          ) : (
            <>
              {processedCount}/{audios.length} processado(s) · {formatDur(totalSec)}
            </>
          )}
        </p>
        <Link href={`/dossie/${dossierId}/gravar`} className="mt-3 inline-flex items-center gap-2 h-9 px-3 rounded-md bg-neutral-900 text-neutral-50 text-body-sm hover:bg-neutral-800 transition-colors w-full justify-center">
          <span className="size-2 rounded-full bg-danger animate-pulse" />
          Adicionar áudio
        </Link>
      </header>

      {/* Áudios pendentes ou com erro */}
      {audios.some((a) => !a.processed_at) && (
        <div className="px-5 py-3 border-b border-border-subtle bg-status-edited-bg/30 flex flex-col gap-3">
          {audios.filter((a) => !a.processed_at).map((a) => (
            <div key={a.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-caption text-text-muted font-mono uppercase" style={{ letterSpacing: "0.06em" }}>
                  {a.source} · {new Date(a.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              {a.error && <p className="text-caption text-status-conflict-fg">{a.error.slice(0, 160)}</p>}
              <ReprocessButton audioId={a.id} failed={!!a.error} />
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {blocks.length === 0 ? (
          <div className="text-center py-10 px-3">
            <p className="font-display text-h4 text-text-muted">Sem blocos ainda</p>
            <p className="text-body-sm text-text-secondary mt-2">Grave ou importe um áudio. A IA quebra a conversa em blocos e mapeia para os campos.</p>
          </div>
        ) : (
          <ol className="flex flex-col gap-2">
            {blocks.map((b) => {
              const linked = highlightedFieldKey !== null && b.target_field_key === highlightedFieldKey;
              const noise = b.is_noise;
              return (
                <li key={b.id}
                    onMouseEnter={() => onHoverBlock?.(b.id)}
                    onMouseLeave={() => onHoverBlock?.(null)}
                    className={`p-3 rounded-md border-l-2 transition-all cursor-pointer ${
                      noise ? "opacity-50 border-l-transparent bg-transparent" :
                      linked ? "bg-status-suggested-bg border-l-ai-500 shadow-1" :
                      "bg-surface-sunken border-l-transparent hover:border-l-primary-400"
                    }`}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono text-caption uppercase text-text-muted" style={{ letterSpacing: "0.08em" }}>
                      {b.speaker} {b.start_seconds !== null && `· ${formatTimecode(b.start_seconds)}`}
                    </span>
                  </div>
                  <p className="text-body-sm leading-snug">{b.text}</p>
                  {b.intent && !noise && (
                    <span className="inline-block mt-2 px-2 h-5 rounded-full text-caption font-medium bg-ai-50 text-ai-700 ring-1 ring-inset ring-ai-200" style={{ letterSpacing: "0.04em" }}>
                      {b.intent.replace(/_/g, " ")}
                    </span>
                  )}
                  {noise && (
                    <span className="inline-block mt-2 px-2 h-5 rounded-full text-caption text-text-muted bg-neutral-100" style={{ letterSpacing: "0.04em" }}>
                      ruído (ignorado)
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </aside>
  );
}

function formatDur(sec: number) {
  if (!sec || sec < 1) return "0s";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
function formatTimecode(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
