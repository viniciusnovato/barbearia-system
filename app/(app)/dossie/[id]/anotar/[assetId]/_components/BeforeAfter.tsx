"use client";

import { useState, useRef } from "react";

interface Props {
  beforeUrl: string;
  afterUrl: string;
  onClose: () => void;
}

export function BeforeAfter({ beforeUrl, afterUrl, onClose }: Props) {
  const [pos, setPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  function updatePos(clientX: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 size-10 rounded-full bg-surface-card text-text-primary flex items-center justify-center hover:bg-surface-sunken transition-colors"
        aria-label="Fechar"
      >
        ✕
      </button>

      <div className="w-full max-w-4xl">
        <header className="mb-4 text-neutral-50">
          <p className="font-mono text-mono uppercase text-neutral-400" style={{ letterSpacing: "0.1em" }}>
            Comparação · arraste a divisória
          </p>
          <h2 className="font-display text-h2 mt-1">Antes × Depois (IA)</h2>
        </header>

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
          {/* Antes (debaixo) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={beforeUrl} alt="Antes" className="absolute inset-0 w-full h-full object-cover" />

          {/* Depois (em cima, recortado pela posição) */}
          <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={afterUrl} alt="Depois" className="absolute inset-0 w-full h-full object-cover" />
          </div>

          {/* Linha divisória + handle */}
          <div className="absolute top-0 bottom-0 w-0.5 bg-white/90 pointer-events-none" style={{ left: `${pos}%` }} />
          <div
            className="absolute top-1/2 -translate-y-1/2 size-12 rounded-full bg-white shadow-3 flex items-center justify-center pointer-events-none"
            style={{ left: `calc(${pos}% - 24px)` }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l-6-6 6-6M15 6l6 6-6 6" />
            </svg>
          </div>

          {/* Labels */}
          <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 text-white font-mono text-caption uppercase backdrop-blur" style={{ letterSpacing: "0.1em" }}>
            Antes
          </span>
          <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-ai-500/90 text-white font-mono text-caption uppercase backdrop-blur" style={{ letterSpacing: "0.1em" }}>
            ✨ Depois (IA)
          </span>
        </div>

        <p className="mt-4 text-center text-neutral-400 text-body-sm">
          A imagem do depois já foi salva no dossiê e entrará no PDF final.
        </p>
      </div>
    </div>
  );
}
