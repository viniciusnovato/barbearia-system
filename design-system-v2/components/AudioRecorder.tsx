"use client";

import { useState } from "react";
import { cn } from "../lib/cn";
import { Button } from "./Button";
import { ProgressBar } from "./ProgressBar";

type Phase =
  | "idle"
  | "recording"
  | "uploading"
  | "transcribing"
  | "classifying"
  | "done"
  | "error";

interface Props {
  /** Duração da gravação em segundos (atualiza em tempo real). */
  durationSeconds?: number;
  /** Fase do pipeline. */
  phase: Phase;
  /** Progresso 0-100 (usado em uploading/transcribing/classifying). */
  progress?: number;
  /** Mensagem de erro quando phase=error */
  error?: string;
  onStart?: () => void;
  onStop?: () => void;
  onCancel?: () => void;
  className?: string;
}

const PHASE_LABEL: Record<Phase, string> = {
  idle: "Pronto pra gravar",
  recording: "Gravando",
  uploading: "Subindo arquivo",
  transcribing: "Transcrevendo áudio",
  classifying: "Organizando em campos",
  done: "Concluído",
  error: "Falhou",
};

function fmt(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export function AudioRecorder({
  durationSeconds = 0,
  phase,
  progress,
  error,
  onStart,
  onStop,
  onCancel,
  className,
}: Props) {
  const [confirmCancel, setConfirmCancel] = useState(false);

  const isRecording = phase === "recording";
  const isProcessing =
    phase === "uploading" || phase === "transcribing" || phase === "classifying";

  return (
    <div
      className={cn(
        "rounded-lg border border-border-subtle bg-surface-card p-5 flex flex-col gap-4",
        className,
      )}
    >
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "size-2.5 rounded-full",
              isRecording && "bg-danger ds-pulse",
              isProcessing && "bg-accent-500 ds-pulse",
              phase === "idle" && "bg-neutral-400",
              phase === "done" && "bg-success",
              phase === "error" && "bg-danger",
            )}
          />
          <p className="font-mono text-mono uppercase tracking-wide text-text-secondary">
            {PHASE_LABEL[phase]}
          </p>
        </div>
        <span className="font-mono text-h3 tabular-nums text-text-primary">
          {fmt(durationSeconds)}
        </span>
      </header>

      {/* Barra de processamento */}
      {isProcessing && (
        <ProgressBar
          value={progress}
          label={PHASE_LABEL[phase]}
          hint={progress != null ? `${Math.round(progress)}%` : "estimando…"}
          tone="accent"
        />
      )}

      {/* Erro */}
      {phase === "error" && error && (
        <div className="rounded-md bg-status-conflict-bg text-status-conflict-fg ring-1 ring-inset ring-status-conflict-ring px-3 py-2 text-body-sm">
          {error}
        </div>
      )}

      {/* Ações */}
      <div className="flex items-center gap-2">
        {phase === "idle" && (
          <Button variant="primary" size="lg" onClick={onStart}>
            ● Iniciar gravação
          </Button>
        )}
        {phase === "recording" && (
          <>
            <Button variant="primary" size="lg" onClick={onStop}>
              ■ Parar e enviar
            </Button>
            {!confirmCancel ? (
              <Button variant="ghost" size="lg" onClick={() => setConfirmCancel(true)}>
                Descartar
              </Button>
            ) : (
              <>
                <Button variant="destructive" size="lg" onClick={() => { setConfirmCancel(false); onCancel?.(); }}>
                  Confirmar descarte
                </Button>
                <Button variant="ghost" size="lg" onClick={() => setConfirmCancel(false)}>
                  Voltar
                </Button>
              </>
            )}
          </>
        )}
        {isProcessing && (
          <Button variant="secondary" size="lg" loading loadingKeepLabel disabled>
            {PHASE_LABEL[phase]}
          </Button>
        )}
        {phase === "done" && (
          <Button variant="secondary" size="lg" onClick={onStart}>
            Gravar de novo
          </Button>
        )}
        {phase === "error" && (
          <Button variant="primary" size="lg" onClick={onStart}>
            Tentar novamente
          </Button>
        )}
      </div>
    </div>
  );
}
