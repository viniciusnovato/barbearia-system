"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { cn } from "../lib/cn";

type Tool = "pen" | "eraser" | "arrow" | "circle" | "line" | "marker";

interface Stroke {
  tool: Tool;
  color: string;
  size: number;
  points: { x: number; y: number; p: number }[];
}

interface PhotoAnnotatorProps {
  imageUrl: string;
  versionName?: string;
  onSave?: (dataUrl: string, strokes: Stroke[]) => void;
  className?: string;
}

const colors = ["#A03A1B", "#8E6A30", "#535B89", "#4F8C3F", "#17150F"];

export function PhotoAnnotator({
  imageUrl,
  versionName = "Análise inicial",
  onSave,
  className,
}: PhotoAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(colors[0]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);

  const drawingRef = useRef(false);
  const currentRef = useRef<Stroke | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  // Carrega imagem de fundo
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      imgRef.current = img;
      redrawAll(strokes);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  // Resize canvas para o container preservando proporção
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext("2d");
      ctx?.scale(dpr, dpr);
      redrawAll(strokes);
    });
    ro.observe(canvas.parentElement!);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes]);

  const redrawAll = useCallback((all: Stroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    ctx.clearRect(0, 0, w, h);

    // Background image — fit cover
    const img = imgRef.current;
    if (img && img.complete) {
      const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    }

    all.forEach((s) => drawStroke(ctx, s));
  }, []);

  const drawStroke = (ctx: CanvasRenderingContext2D, s: Stroke) => {
    if (s.points.length < 2) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (s.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = s.color;
      if (s.tool === "marker") ctx.globalAlpha = 0.35;
      else ctx.globalAlpha = 1;
    }

    if (s.tool === "circle") {
      const a = s.points[0];
      const b = s.points[s.points.length - 1];
      const cx = (a.x + b.x) / 2;
      const cy = (a.y + b.y) / 2;
      const rx = Math.abs(b.x - a.x) / 2;
      const ry = Math.abs(b.y - a.y) / 2;
      ctx.lineWidth = s.size;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      return;
    }

    if (s.tool === "line" || s.tool === "arrow") {
      const a = s.points[0];
      const b = s.points[s.points.length - 1];
      ctx.lineWidth = s.size;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      if (s.tool === "arrow") {
        const angle = Math.atan2(b.y - a.y, b.x - a.x);
        const head = 12 + s.size;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x - head * Math.cos(angle - Math.PI / 6), b.y - head * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x - head * Math.cos(angle + Math.PI / 6), b.y - head * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      return;
    }

    // pen / marker / eraser — caneta livre com pressão
    for (let i = 1; i < s.points.length; i++) {
      const p0 = s.points[i - 1];
      const p1 = s.points[i];
      const pressure = s.tool === "eraser" ? 1 : (p0.p + p1.p) / 2 || 0.5;
      ctx.lineWidth = s.size * (pressure * 1.4 + 0.3);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  const localPoint = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      p: e.pressure || (e.pointerType === "pen" ? 0.5 : 0.7),
    };
  };

  const handleDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    // Palm rejection: aceita pen e mouse; touch só se não houver pen
    if (e.pointerType === "touch" && (e.target as HTMLElement).closest("[data-pen-only]")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const pt = localPoint(e);
    startRef.current = pt;
    const size = tool === "eraser" ? 22 : tool === "marker" ? 14 : 4;
    currentRef.current = { tool, color, size, points: [pt] };
    setRedoStack([]);
  };

  const handleMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !currentRef.current) return;
    const pt = localPoint(e);
    currentRef.current.points.push(pt);
    // Para shapes, redesenha completo a cada movimento
    if (tool === "circle" || tool === "line" || tool === "arrow") {
      redrawAll([...strokes, currentRef.current]);
    } else {
      const ctx = canvasRef.current!.getContext("2d")!;
      drawStroke(ctx, {
        ...currentRef.current,
        points: currentRef.current.points.slice(-2),
      });
    }
  };

  const handleUp = () => {
    if (!drawingRef.current || !currentRef.current) return;
    drawingRef.current = false;
    if (currentRef.current.points.length > 1) {
      const next = [...strokes, currentRef.current];
      setStrokes(next);
      redrawAll(next);
    }
    currentRef.current = null;
    startRef.current = null;
  };

  const undo = () => {
    if (strokes.length === 0) return;
    const last = strokes[strokes.length - 1];
    const next = strokes.slice(0, -1);
    setStrokes(next);
    setRedoStack((r) => [...r, last]);
    redrawAll(next);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const last = redoStack[redoStack.length - 1];
    const next = [...strokes, last];
    setStrokes(next);
    setRedoStack((r) => r.slice(0, -1));
    redrawAll(next);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave?.(canvas.toDataURL("image/png"), strokes);
  };

  return (
    <section
      className={cn(
        "flex flex-col gap-3 rounded-2xl bg-surface-card border border-border-subtle shadow-3 overflow-hidden",
        className,
      )}
    >
      <header className="flex items-center justify-between px-5 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <span
            className="font-mono text-mono uppercase text-text-muted"
            style={{ letterSpacing: "0.1em" }}
          >
            Análise visual
          </span>
          <span className="text-text-secondary">·</span>
          <span className="font-display text-h4 text-text-primary">{versionName}</span>
        </div>
        <button
          onClick={save}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary-500 text-neutral-50 font-medium text-body-sm hover:bg-primary-600 transition-colors"
        >
          Salvar versão
        </button>
      </header>

      <div className="flex gap-3 px-5">
        <Toolbar
          tool={tool}
          setTool={setTool}
          color={color}
          setColor={setColor}
          onUndo={undo}
          onRedo={redo}
          canUndo={strokes.length > 0}
          canRedo={redoStack.length > 0}
        />
        <div className="relative flex-1 aspect-[4/3] rounded-lg overflow-hidden bg-neutral-100">
          <canvas
            ref={canvasRef}
            onPointerDown={handleDown}
            onPointerMove={handleMove}
            onPointerUp={handleUp}
            onPointerCancel={handleUp}
            className="absolute inset-0 touch-none cursor-crosshair"
            style={{ touchAction: "none" }}
          />
        </div>
      </div>

      <footer className="flex items-center justify-between px-5 py-3 text-caption text-text-muted">
        <span>{strokes.length} marcação{strokes.length === 1 ? "" : "ões"}</span>
        <span className="font-mono uppercase" style={{ letterSpacing: "0.08em" }}>
          Apple Pencil · pressão dinâmica
        </span>
      </footer>
    </section>
  );
}

interface ToolbarProps {
  tool: Tool;
  setTool: (t: Tool) => void;
  color: string;
  setColor: (c: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

function Toolbar({ tool, setTool, color, setColor, onUndo, onRedo, canUndo, canRedo }: ToolbarProps) {
  const tools: { id: Tool; icon: JSX.Element; label: string }[] = [
    { id: "pen",     icon: <PenIcon />,     label: "Caneta" },
    { id: "marker",  icon: <MarkerIcon />,  label: "Marcador" },
    { id: "eraser",  icon: <EraserIcon />,  label: "Borracha" },
    { id: "arrow",   icon: <ArrowIcon />,   label: "Seta" },
    { id: "circle",  icon: <CircleIcon />,  label: "Círculo" },
    { id: "line",    icon: <LineIcon />,    label: "Linha" },
  ];

  return (
    <div className="flex flex-col gap-2 p-2 rounded-lg bg-surface-sunken border border-border-subtle">
      {tools.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setTool(t.id)}
          title={t.label}
          aria-label={t.label}
          className={cn(
            "size-touch rounded-md inline-flex items-center justify-center transition-all",
            "text-text-secondary hover:bg-surface-card hover:text-text-primary",
            tool === t.id && "bg-primary-500 text-neutral-50 hover:bg-primary-600 hover:text-neutral-50 shadow-1",
          )}
        >
          {t.icon}
        </button>
      ))}
      <div className="my-1 border-t border-border-subtle" />
      <div className="flex flex-col gap-1.5 p-1">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            aria-label={`Cor ${c}`}
            className={cn(
              "size-7 rounded-full transition-transform",
              color === c && "ring-2 ring-offset-2 ring-offset-surface-sunken ring-primary-500 scale-110",
            )}
            style={{ background: c }}
          />
        ))}
      </div>
      <div className="my-1 border-t border-border-subtle" />
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        title="Desfazer"
        className="size-touch rounded-md inline-flex items-center justify-center text-text-secondary hover:bg-surface-card disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <UndoIcon />
      </button>
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        title="Refazer"
        className="size-touch rounded-md inline-flex items-center justify-center text-text-secondary hover:bg-surface-card disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <RedoIcon />
      </button>
    </div>
  );
}

const ico = "size-5";
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
function PenIcon()    { return <svg viewBox="0 0 24 24" className={ico} {...stroke}><path d="M16.5 3.5l4 4L7 21H3v-4L16.5 3.5z" /></svg>; }
function MarkerIcon() { return <svg viewBox="0 0 24 24" className={ico} {...stroke}><path d="M5 19h14M14 4l6 6-9 9H5v-6l9-9z" /></svg>; }
function EraserIcon() { return <svg viewBox="0 0 24 24" className={ico} {...stroke}><path d="M3 19l8-8 6 6-2 2H3zM10 12l9-9 4 4-9 9" /></svg>; }
function ArrowIcon()  { return <svg viewBox="0 0 24 24" className={ico} {...stroke}><path d="M5 19L19 5M19 5h-7M19 5v7" /></svg>; }
function CircleIcon() { return <svg viewBox="0 0 24 24" className={ico} {...stroke}><circle cx="12" cy="12" r="8" /></svg>; }
function LineIcon()   { return <svg viewBox="0 0 24 24" className={ico} {...stroke}><path d="M5 19L19 5" /></svg>; }
function UndoIcon()   { return <svg viewBox="0 0 24 24" className={ico} {...stroke}><path d="M9 14L4 9l5-5M4 9h11a5 5 0 010 10h-2" /></svg>; }
function RedoIcon()   { return <svg viewBox="0 0 24 24" className={ico} {...stroke}><path d="M15 14l5-5-5-5M20 9H9a5 5 0 000 10h2" /></svg>; }
