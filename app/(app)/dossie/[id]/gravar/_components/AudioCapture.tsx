"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";

type Mode = "idle" | "recording" | "paused" | "processing";

export function AudioCapture({ dossierId }: { dossierId: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState<string | null>(null);
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

      setMode("recording");
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
    if (mode === "recording") { r.pause(); setMode("paused"); if (tickRef.current) clearInterval(tickRef.current); }
    else if (mode === "paused") { r.resume(); setMode("recording"); tickRef.current = setInterval(() => setSeconds((s) => s + 1), 1000); }
  }

  function stopRecording() {
    const r = recorderRef.current;
    if (!r) return;
    if (tickRef.current) clearInterval(tickRef.current);
    if (r.state !== "inactive") r.stop();
  }

  async function handleRecorderStop() {
    setMode("processing");
    setProgressMsg("Preparando áudio…");
    cleanup();
    const mime = recorderRef.current?.mimeType ?? "audio/webm";
    const ext = mime.includes("mp4") ? "mp4" : mime.includes("ogg") ? "ogg" : "webm";
    const blob = new Blob(chunksRef.current, { type: mime });
    await uploadAndProcess(blob, ext, "live");
  }

  async function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setMode("processing");
    setProgressMsg("Enviando arquivo…");
    const ext = (file.name.split(".").pop() ?? "audio").toLowerCase();
    await uploadAndProcess(file, ext, "upload");
  }

  async function uploadAndProcess(blob: Blob, ext: string, source: "live" | "upload") {
    try {
      const supabase = createBrowserSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const audioId = crypto.randomUUID();
      const path = `${user.id}/${dossierId}/${audioId}.${ext}`;

      setProgressMsg("Subindo para o storage…");
      const { error: upErr } = await supabase.storage.from("audio").upload(path, blob, {
        upsert: false,
        contentType: blob.type || `audio/${ext}`,
      });
      if (upErr) throw upErr;

      // Estima duração via <audio>
      const url = URL.createObjectURL(blob);
      const duration = await estimateDuration(url).catch(() => null);
      URL.revokeObjectURL(url);

      setProgressMsg("Registrando no dossiê…");
      const { data: row, error: insertErr } = await supabase
        .from("audio_recordings")
        .insert({
          id: audioId,
          dossier_id: dossierId,
          source,
          storage_path: path,
          mime_type: blob.type || `audio/${ext}`,
          duration_seconds: duration,
        })
        .select("id")
        .single();
      if (insertErr || !row) throw insertErr ?? new Error("Falha ao registrar áudio");

      // Dispara processamento Gemini
      setProgressMsg("Transcrevendo com a IA Gemini…");
      const { data: { session } } = await supabase.auth.getSession();
      const fnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/transcribe-audio`;
      const res = await fetch(fnUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({ audio_id: row.id }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        console.warn("transcribe-audio falhou", j);
        // Tudo bem — o áudio ficou salvo, só não foi processado.
        setProgressMsg("Áudio salvo. Processamento pode ser refeito depois.");
      } else {
        const j = await res.json();
        if (j.stub) setProgressMsg("Áudio salvo (transcrição real chega na próxima atualização).");
        else setProgressMsg(`Pronto. ${j.blocks_count ?? 0} blocos extraídos.`);
      }

      // Volta para o dossiê
      setTimeout(() => router.push(`/dossie/${dossierId}`), 1200);
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setMode("idle");
      setProgressMsg(null);
    }
  }

  function estimateDuration(url: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const a = new Audio();
      a.preload = "metadata";
      a.onloadedmetadata = () => resolve(a.duration);
      a.onerror = () => reject(new Error("metadata fail"));
      a.src = url;
    });
  }

  const isLive = mode === "recording";
  const isProcessing = mode === "processing";

  return (
    <div className="flex flex-col gap-6">
      {/* Recorder card */}
      <section className="rounded-2xl bg-surface-card border border-border-subtle shadow-3 p-7">
        <header className="flex items-center justify-between mb-6">
          <span className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.1em" }}>
            {mode === "idle" ? "Toque para gravar" :
             mode === "recording" ? "Gravando conversa" :
             mode === "paused" ? "Pausado" :
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
          {mode === "idle" || isProcessing ? (
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
          Ou importe um áudio
        </p>
        <p className="text-body-sm text-text-secondary mb-4">
          WhatsApp, gravação do celular, áudio enviado pelo cliente. Formatos: m4a, mp3, ogg, webm, wav.
        </p>
        <label className="cursor-pointer inline-flex h-touch px-5 items-center rounded-md border border-border-strong text-body-sm hover:bg-surface-sunken transition-colors">
          <input type="file" accept="audio/*" onChange={handleFileImport} disabled={isProcessing} className="hidden" />
          📁 Escolher arquivo
        </label>
      </section>

      {progressMsg && (
        <div className="px-4 py-3 rounded-md bg-status-suggested-bg text-status-suggested-fg text-body-sm ring-1 ring-inset ring-status-suggested-ring flex items-center gap-3">
          <span className="size-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
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
