"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { createTemplateAction } from "../actions";

type Tool = "pen" | "line" | "circle";

interface Stroke { tool: Tool; color: string; points: { x: number; y: number }[] }

const COLORS = ["#A03A1B", "#8E6A30", "#535B89", "#4F8C3F"];

export function TemplateCreator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const currentRef = useRef<Stroke | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const [, setVersion] = useState(0);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[2]);
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  function bump() { setVersion((v) => v + 1); }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement!.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    canvas.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
  }, []);

  function redraw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    // Silhueta da face em cinza pra ajudar a posicionar
    ctx.strokeStyle = "rgba(120,120,120,0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.5, w * 0.30, h * 0.40, 0, 0, Math.PI * 2);
    ctx.stroke();

    [...strokesRef.current, ...(currentRef.current ? [currentRef.current] : [])].forEach((s) => {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (s.tool === "circle" && s.points.length >= 2) {
        const a = s.points[0], b = s.points[s.points.length - 1];
        ctx.beginPath();
        ctx.ellipse(((a.x + b.x) / 2) * w, ((a.y + b.y) / 2) * h, (Math.abs(b.x - a.x) / 2) * w, (Math.abs(b.y - a.y) / 2) * h, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (s.tool === "line" && s.points.length >= 2) {
        const a = s.points[0], b = s.points[s.points.length - 1];
        ctx.beginPath();
        ctx.moveTo(a.x * w, a.y * h);
        ctx.lineTo(b.x * w, b.y * h);
        ctx.stroke();
      } else {
        for (let i = 1; i < s.points.length; i++) {
          ctx.beginPath();
          ctx.moveTo(s.points[i - 1].x * w, s.points[i - 1].y * h);
          ctx.lineTo(s.points[i].x * w, s.points[i].y * h);
          ctx.stroke();
        }
      }
    });
  }

  function pointFrom(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  }

  function down(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    currentRef.current = { tool, color, points: [pointFrom(e)] };
  }
  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || !currentRef.current) return;
    currentRef.current.points.push(pointFrom(e));
    redraw();
  }
  function up() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (currentRef.current && currentRef.current.points.length > 1) {
      strokesRef.current = [...strokesRef.current, currentRef.current];
    }
    currentRef.current = null;
    bump();
    redraw();
  }

  function clear() {
    strokesRef.current = [];
    currentRef.current = null;
    bump();
    redraw();
  }

  function save() {
    if (!name.trim()) {
      toast.error("Dê um nome ao template");
      return;
    }
    if (strokesRef.current.length === 0) {
      toast.error("Desenhe pelo menos um traço");
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.set("name", name.trim());
      const data = {
        strokes: strokesRef.current.map((s) => ({
          tool: s.tool,
          color: s.color,
          size: 3,
          points: s.points.map((p) => ({ x: Number(p.x.toFixed(4)), y: Number(p.y.toFixed(4)), p: 1 })),
        })),
      };
      fd.set("vector_data", JSON.stringify(data));
      await createTemplateAction(fd);
      toast.success(`Template "${name}" criado`);
      clear();
      setName("");
    });
  }

  return (
    <div className="rounded-lg bg-surface-card border border-border-subtle p-4">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="font-mono text-mono uppercase text-text-muted mr-2" style={{ letterSpacing: "0.08em" }}>
          Ferramenta
        </span>
        {(["pen", "line", "circle"] as Tool[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTool(t)}
            className={`h-8 px-3 rounded-full text-caption ${
              tool === t ? "bg-neutral-900 text-neutral-50" : "bg-surface-sunken text-text-secondary hover:text-text-primary"
            }`}
          >
            {t === "pen" ? "Caneta" : t === "line" ? "Linha" : "Círculo"}
          </button>
        ))}
        <span className="mx-2 h-6 w-px bg-border-subtle" />
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            aria-label={c}
            className={`size-7 rounded-full transition-transform ${color === c ? "ring-2 ring-offset-2 ring-offset-surface-card ring-primary-500 scale-110" : ""}`}
            style={{ background: c }}
          />
        ))}
        <span className="mx-2 h-6 w-px bg-border-subtle" />
        <button
          type="button"
          onClick={clear}
          className="h-8 px-3 rounded-full text-caption text-text-muted hover:text-danger transition-colors"
        >
          Limpar
        </button>
      </div>

      <div className="aspect-[4/3] bg-surface-page rounded-md overflow-hidden border border-border-subtle mb-3">
        <canvas
          ref={canvasRef}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          className="w-full h-full cursor-crosshair"
          style={{ touchAction: "none" }}
        />
      </div>

      <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-mono uppercase text-text-secondary" style={{ letterSpacing: "0.08em" }}>
            Nome do template
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Linha de degradê alta"
            className="h-touch px-4 rounded-md bg-surface-card border border-border-strong focus:border-primary-500 focus:shadow-focus focus:outline-none transition-all"
          />
        </label>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="h-touch px-5 rounded-md bg-primary-500 text-neutral-50 font-medium hover:bg-primary-600 disabled:opacity-50 transition-all"
        >
          {pending ? "Salvando…" : "Salvar template"}
        </button>
      </div>
    </div>
  );
}
