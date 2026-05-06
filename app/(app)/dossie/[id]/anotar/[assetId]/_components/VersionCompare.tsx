"use client";

import { useRef, useState } from "react";

interface Version {
  id: string;
  name: string;
  url: string | null;
  createdAt: string;
}

interface Props {
  /** Foto base original (sem marcação) */
  baseUrl: string;
  baseLabel?: string;
  /** Lista de versões salvas (com marcação) */
  versions: Version[];
  onClose: () => void;
}

export function VersionCompare({ baseUrl, baseLabel = "Original", versions, onClose }: Props) {
  // Lado A e B selecionáveis. A começa em base, B na primeira versão.
  const [leftId, setLeftId] = useState<string>("__base__");
  const [rightId, setRightId] = useState<string>(versions[0]?.id ?? "__base__");
  const [pos, setPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  function urlOf(id: string): { url: string | null; label: string } {
    if (id === "__base__") return { url: baseUrl, label: baseLabel };
    const v = versions.find((x) => x.id === id);
    return { url: v?.url ?? null, label: v?.name ?? "Versão" };
  }

  const left = urlOf(leftId);
  const right = urlOf(rightId);

  function updatePos(clientX: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur flex items-center justify-center p-4 overflow-y-auto">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 size-10 rounded-full bg-surface-card text-text-primary flex items-center justify-center hover:bg-surface-sunken transition-colors z-10"
        aria-label="Fechar"
      >
        ✕
      </button>

      <div className="w-full max-w-5xl">
        <header className="mb-4 text-neutral-50">
          <p className="font-mono text-mono uppercase text-neutral-400" style={{ letterSpacing: "0.1em" }}>
            Comparar versões · arraste a divisória
          </p>
          <h2 className="font-display text-h2 mt-1">
            {left.label} <span className="text-neutral-500">×</span> {right.label}
          </h2>
        </header>

        {/* Picker de versão por lado */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <SidePicker label="Lado esquerdo" selected={leftId} onChange={setLeftId} versions={versions} baseLabel={baseLabel} />
          <SidePicker label="Lado direito" selected={rightId} onChange={setRightId} versions={versions} baseLabel={baseLabel} />
        </div>

        {/* Slider de comparação */}
        <div
          ref={containerRef}
          className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-900 select-none touch-none cursor-ew-resize"
          onPointerDown={(e) => {
            draggingRef.current = true;
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            updatePos(e.clientX);
          }}
          onPointerMove={(e) => {
            if (draggingRef.current) updatePos(e.clientX);
          }}
          onPointerUp={() => { draggingRef.current = false; }}
          onPointerCancel={() => { draggingRef.current = false; }}
        >
          {left.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={left.url} alt={left.label} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-neutral-500">{left.label}</div>
          )}

          <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
            {right.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={right.url} alt={right.label} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-neutral-500">{right.label}</div>
            )}
          </div>

          {/* Linha + handle */}
          <div className="absolute top-0 bottom-0 w-0.5 bg-white/90 pointer-events-none" style={{ left: `${pos}%` }} />
          <div
            className="absolute top-1/2 -translate-y-1/2 size-12 rounded-full bg-white shadow-3 flex items-center justify-center pointer-events-none"
            style={{ left: `calc(${pos}% - 24px)` }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l-6-6 6-6M15 6l6 6-6 6" />
            </svg>
          </div>

          <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 text-white font-mono text-caption uppercase backdrop-blur" style={{ letterSpacing: "0.1em" }}>
            {left.label}
          </span>
          <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/60 text-white font-mono text-caption uppercase backdrop-blur" style={{ letterSpacing: "0.1em" }}>
            {right.label}
          </span>
        </div>
      </div>
    </div>
  );
}

function SidePicker({
  label,
  selected,
  onChange,
  versions,
  baseLabel,
}: {
  label: string;
  selected: string;
  onChange: (id: string) => void;
  versions: Version[];
  baseLabel: string;
}) {
  return (
    <div className="rounded-md bg-surface-card/10 backdrop-blur border border-white/10 p-2">
      <p className="text-caption font-mono uppercase text-neutral-400 mb-1.5 px-1" style={{ letterSpacing: "0.08em" }}>
        {label}
      </p>
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 px-2 rounded-md bg-surface-card text-text-primary text-body-sm focus:outline-none border border-border-subtle"
      >
        <option value="__base__">{baseLabel}</option>
        {versions.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name} · {new Date(v.createdAt).toLocaleDateString("pt-BR")}
          </option>
        ))}
      </select>
    </div>
  );
}
