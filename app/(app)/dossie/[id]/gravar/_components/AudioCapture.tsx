"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createBrowserSupabase } from "@/lib/supabase/client";

type State = "idle" | "recording" | "paused" | "processing";
type DossierMode = "entrevista" | "acompanhamento" | "antes_depois";

const MODE_INFO: Record<DossierMode, { label: string; hint: string }> = {
  entrevista: { label: "Entrevista completa", hint: "IA preenche todo o dossiê (22 campos)" },
  acompanhamento: { label: "Acompanhamento curto", hint: "Só direcionamento técnico + ajustes" },
  antes_depois: { label: "Antes/depois", hint: "Resumo do resultado obtido" },
};

interface Props {
  dossierId: string;
  initialMode?: DossierMode;
}

export function AudioCapture({ dossierId, initialMode = "entrevista" }: Props) {
  const router = useRouter();
  const [dossierMode, setDossierMode] = useState<DossierMode>(initialMode);
  const [state, setState] = useState<State>("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState<string>("");
  const [levels, setLevels] = useState<number[]>(Array.from({ length: 32 }, () => 0.2));
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const tickRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cleanup() {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => {});
  }

  function pickMime() {
    const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
    for (const c of candidates) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) return c;
    }
    return "";
  }

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream;

      // Analyser para waveform
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Waveform loop
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const next = Array.from({ length: 32 }, (_, i) => data[i % data.length] / 255);
        setLevels(next);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);

      // Recorder
      const mimeType = pickMime();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => handleRecorderStop();
      recorder.start(1000);
      recorderRef.current = recorder;

      setState("recording");
      setSeconds(0);
      tickRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (e) {
      console.error(e);
      setError("Não consegui acessar o microfone. Verifique a permissão do navegador.");
    }
  }

  function pauseResume() {
    const r = recorderRef.current;
    if (!r) return;
    if (state === "recording") { r.pause(); setState("paused"); if (tickRef.current) clearInterval(tickRef.current); }
    else if (state === "paused") { r.resume(); setState("recording"); tickRef.current = setInterval(() => setSeconds((s) => s + 1), 1000); }
  }

  function stopRecording() {
    const r = recorderRef.current;
    if (!r) return;
    if (tickRef.current) clearInterval(tickRef.current);
    if (r.state !== "inactive") r.stop();
  }

  async function handleRecorderStop() {
    setState("processing");
    setProgressMsg("Preparando áudio…");
    setProgress(2);
    cleanup();
    const mime = recorderRef.current?.mimeType ?? "audio/webm";
    const ext = mime.includes("mp4") ? "mp4" : mime.includes("ogg") ? "ogg" : "webm";
    const blob = new Blob(chunksRef.current, { type: mime });
    await uploadAndProcess(blob, ext, "live", "audio");
  }

  async function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setState("processing");
    setProgressMsg("Enviando arquivo…");
    setProgress(2);
    const ext = (file.name.split(".").pop() ?? "audio").toLowerCase();
    const isVideo = file.type.startsWith("video/") || ["mp4", "mov", "webm", "avi", "mkv"].includes(ext);
    await uploadAndProcess(file, ext, "upload", isVideo ? "video" : "audio");
  }

  async function uploadAndProcess(
    blob: Blob,
    ext: string,
    source: "live" | "upload",
    mediaKind: "audio" | "video",
  ) {
    let stopPolling: (() => void) | null = null;
    try {
      const supabase = createBrowserSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const audioId = crypto.randomUUID();
      const path = `${user.id}/${dossierId}/${audioId}.${ext}`;

      setProgressMsg(mediaKind === "video" ? "Subindo vídeo…" : "Subindo áudio…");
      setProgress(8);
      const { error: upErr } = await supabase.storage.from("audio").upload(path, blob, {
        upsert: false,
        contentType: blob.type || `${mediaKind}/${ext}`,
      });
      if (upErr) throw upErr;

      const url = URL.createObjectURL(blob);
      const duration = await estimateDuration(url, mediaKind).catch(() => null);
      URL.revokeObjectURL(url);

      setProgressMsg("Registrando no dossiê…");
      setProgress(15);
      const { data: row, error: insertErr } = await supabase
        .from("audio_recordings")
        .insert({
          id: audioId,
          dossier_id: dossierId,
          source,
          storage_path: path,
          mime_type: blob.type || `${mediaKind}/${ext}`,
          duration_seconds: duration,
          media_kind: mediaKind,
          processing_progress: 0,
        })
        .select("id")
        .single();
      if (insertErr || !row) throw insertErr ?? new Error("Falha ao registrar arquivo");

      // Atualiza o modo do dossiê
      await supabase.from("dossiers").update({ mode: dossierMode }).eq("id", dossierId);

      // Polling do progresso real (atualizado pela Edge Function)
      let polling = true;
      const interval = setInterval(async () => {
        if (!polling) return;
        const { data } = await supabase
          .from("audio_recordings")
          .select("processing_progress, processing_stage")
          .eq("id", row.id)
          .maybeSingle();
        if (data) {
          if (typeof data.processing_progress === "number") setProgress(Math.max(15, data.processing_progress));
          if (data.processing_stage) setProgressStage(data.processing_stage);
        }
      }, 1500);
      stopPolling = () => { polling = false; clearInterval(interval); };

      setProgressMsg(mediaKind === "video" ? "Enviando vídeo para Gemini…" : "Enviando para Gemini…");

      const { data: { session } } = await supabase.auth.getSession();
      const fnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/transcribe-audio`;
      const res = await fetch(fnUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({ audio_id: row.id, mode: dossierMode }),
      });

      stopPolling();

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error("Falha ao processar", { description: j.error ?? res.statusText });
        setProgressMsg("Arquivo salvo. Tente reprocessar pelo dossiê.");
      } else {
        const j = await res.json();
        setProgress(100);
        toast.success(`Pronto! ${j.blocks_count ?? 0} blocos extraídos`, {
          description: j.fields_classified ? `${j.fields_classified} campo(s) preenchidos pela IA.` : undefined,
        });
        setProgressMsg("Concluído.");
      }

      setTimeout(() => router.push(`/dossie/${dossierId}`), 800);
    } catch (e) {
      stopPolling?.();
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setState("idle");
      setProgressMsg(null);
      setProgress(0);
      toast.error("Erro", { description: msg });
    }
  }

  function estimateDuration(url: string, kind: "audio" | "video"): Promise<number> {
    return new Promise((resolve, reject) => {
      const el: HTMLMediaElement = kind === "video" ? document.createElement("video") : new Audio();
      el.preload = "metadata";
      el.onloadedmetadata = () => resolve(el.duration);
      el.onerror = () => reject(new Error("metadata fail"));
      el.src = url;
    });
  }

  const isLive = state === "recording";
  const isProcessing = state === "processing";

  return (
    <div className="flex flex-col gap-6">
      {/* Modo do dossiê */}
      <section className="rounded-2xl bg-surface-card border border-border-subtle p-5">
        <p className="font-mono text-mono uppercase text-text-muted mb-3" style={{ letterSpacing: "0.1em" }}>
          Modo da gravação
        </p>
        <div className="grid sm:grid-cols-3 gap-2">
          {(Object.keys(MODE_INFO) as DossierMode[]).map((m) => {
            const info = MODE_INFO[m];
            const active = dossierMode === m;
            return (
              <button
                key={m}
                type="button"
                disabled={isProcessing}
                onClick={() => setDossierMode(m)}
                className={`text-left p-3 rounded-md border transition-all ${
                  active
                    ? "border-primary-500 bg-primary-50/40 ring-1 ring-primary-500"
                    : "border-border-subtle hover:border-border-strong"
                } disabled:opacity-50`}
              >
                <p className={`font-display text-body-lg ${active ? "text-primary-700" : ""}`}>{info.label}</p>
                <p className="text-caption text-text-muted mt-1">{info.hint}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Recorder card */}
      <section className="rounded-2xl bg-surface-card border border-border-subtle shadow-3 p-7">
        <header className="flex items-center justify-between mb-6">
          <span className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.1em" }}>
            {state === "idle" ? "Toque para gravar" :
             state === "recording" ? "Gravando conversa" :
             state === "paused" ? "Pausado" :
             "Processando"}
          </span>
          <span className="font-mono text-h3 text-text-primary tabular-nums">{formatTime(seconds)}</span>
        </header>

        <div className="flex items-end justify-center gap-1 h-24 mb-7">
          {levels.map((lvl, i) => (
            <span key={i}
              className={`w-1 rounded-full origin-bottom transition-all ${isLive ? "bg-primary-500" : "bg-neutral-300"}`}
              style={{ height: `${Math.max(8, lvl * 100)}%` }}
            />
          ))}
        </div>

        <div className="flex items-center justify-center gap-4">
          {state === "idle" || isProcessing ? (
            <button
              onClick={startRecording}
              disabled={isProcessing}
              className="size-touch w-[72px] h-[72px] rounded-full bg-primary-500 text-neutral-50 shadow-2 hover:bg-primary-600 disabled:opacity-50 transition-all flex items-center justify-center"
              aria-label="Iniciar gravação"
            >
              <span className="size-6 rounded-full bg-current" />
            </button>
          ) : (
            <>
              <button
                onClick={pauseResume}
                className="relative size-touch w-[72px] h-[72px] rounded-full bg-danger text-neutral-50 shadow-2 transition-all flex items-center justify-center"
                aria-label={isLive ? "Pausar" : "Continuar"}
              >
                {isLive && <span className="absolute inset-0 rounded-full bg-danger/40 animate-pulseRing" />}
                {isLive ? <span className="size-6 rounded-sm bg-current" /> : <span className="size-6 rounded-full bg-current" />}
              </button>
              <button
                onClick={stopRecording}
                className="size-14 rounded-full border border-border-strong text-text-primary hover:bg-surface-sunken transition-colors flex items-center justify-center"
                aria-label="Finalizar"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
              </button>
            </>
          )}
        </div>
      </section>

      {/* Import */}
      <section className="rounded-2xl border border-dashed border-border-strong p-6">
        <p className="font-mono text-mono uppercase text-text-muted mb-2" style={{ letterSpacing: "0.1em" }}>
          Ou importe um arquivo
        </p>
        <p className="text-body-sm text-text-secondary mb-4">
          Áudio (m4a, mp3, ogg, webm, wav) ou <strong>vídeo</strong> (mp4, mov, webm). A IA separa o áudio do vídeo automaticamente.
        </p>
        <label className="cursor-pointer inline-flex h-touch px-5 items-center rounded-md border border-border-strong text-body-sm hover:bg-surface-sunken transition-colors">
          <input
            type="file"
            accept="audio/*,video/*"
            onChange={handleFileImport}
            disabled={isProcessing}
            className="hidden"
          />
          📁 Escolher arquivo
        </label>
      </section>

      {/* Barra de progresso */}
      {isProcessing && (
        <div className="rounded-md bg-status-suggested-bg ring-1 ring-inset ring-status-suggested-ring p-4">
          <div className="flex items-center justify-between mb-2 gap-3">
            <span className="text-body-sm text-status-suggested-fg flex items-center gap-2">
              <span className="size-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
              {progressStage || progressMsg || "Processando…"}
            </span>
            <span className="font-mono text-mono text-status-suggested-fg tabular-nums" style={{ letterSpacing: "0.06em" }}>
              {progress}%
            </span>
          </div>
          <div className="h-1.5 bg-status-suggested-ring/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-ai-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      {!isProcessing && progressMsg && (
        <div className="px-4 py-3 rounded-md bg-status-suggested-bg text-status-suggested-fg text-body-sm ring-1 ring-inset ring-status-suggested-ring">
          {progressMsg}
        </div>
      )}
      {error && (
        <div className="px-4 py-3 rounded-md bg-status-conflict-bg text-status-conflict-fg text-body-sm ring-1 ring-inset ring-status-conflict-ring">
          {error}
        </div>
      )}
    </div>
  );
}

function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const ss = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${ss}`;
}
