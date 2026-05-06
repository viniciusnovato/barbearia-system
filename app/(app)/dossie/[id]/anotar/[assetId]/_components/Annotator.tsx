"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { VersionCompare } from "./VersionCompare";
import { duplicateVersionAction } from "../actions";

type Tool = "pen" | "marker" | "eraser" | "arrow" | "circle" | "line" | "text";
interface Stroke {
  tool: Tool;
  color: string;
  size: number;
  points: { x: number; y: number; p: number }[];
  /** Apenas para tool="text" */
  text?: string;
}

interface DrawingTemplate {
  id: string;
  name: string;
  vectorData: { strokes: Array<{ tool: string; color: string; size: number; points: Array<{ x: number; y: number; p?: number }> }> } | null;
  isDefault: boolean;
}

const COLORS = ["#A03A1B", "#8E6A30", "#535B89", "#4F8C3F", "#FAFAF7"];
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 8;

interface Props {
  assetId: string;
  dossierId: string;
  imageUrl: string;
  versions: { id: string; name: string; previewUrl: string | null; createdAt: string }[];
  templates: DrawingTemplate[];
}

export function Annotator({ assetId, dossierId, imageUrl, versions, templates }: Props) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Estado de desenho — strokes vivem em REF para evitar latência de setState ao soltar a caneta.
  // O state `strokesVersion` só é incrementado pra forçar re-render dos botões undo/redo.
  const drawingRef = useRef(false);
  const currentRef = useRef<Stroke | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const redoStackRef = useRef<Stroke[]>([]);
  const [, setStrokesVersion] = useState(0);
  const bumpVersion = () => setStrokesVersion((v) => v + 1);

  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[0]);

  // Estado de zoom/pan (em refs para evitar re-render em cada movimento)
  const zoomRef = useRef(1);
  const panXRef = useRef(0);
  const panYRef = useRef(0);
  const [zoomDisplay, setZoomDisplay] = useState(100); // só pra exibir o %

  // Pinch / pan tracking (multi-pointer)
  const pointersRef = useRef<Map<number, { x: number; y: number; type: string }>>(new Map());
  const pinchRef = useRef<{ startDist: number; startZoom: number; centerX: number; centerY: number } | null>(null);

  const [versionName, setVersionName] = useState("Análise inicial");
  const [saving, setSaving] = useState(false);
  const [hand, setHand] = useState<"r" | "l">("r");
  const [showTemplates, setShowTemplates] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => { imgRef.current = img; fitToCanvas(); };
  }, [imageUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => sizeCanvas(true));
    ro.observe(canvas.parentElement!);
    sizeCanvas(false);
    return () => ro.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function sizeCanvas(refit: boolean) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = canvas.parentElement!.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = r.width * dpr;
    canvas.height = r.height * dpr;
    canvas.style.width = `${r.width}px`;
    canvas.style.height = `${r.height}px`;
    canvas.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (refit) fitToCanvas();
    else redraw();
  }

  function fitToCanvas() {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
    zoomRef.current = scale;
    panXRef.current = (w - img.naturalWidth * scale) / 2;
    panYRef.current = (h - img.naturalHeight * scale) / 2;
    setZoomDisplay(Math.round(scale * 100));
    redraw();
  }

  /** Aplica zoom mantendo o ponto (anchorX, anchorY) em coords de tela como pivô. */
  function setZoom(newZoom: number, anchorScreenX?: number, anchorScreenY?: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const z = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, newZoom));
    const ax = anchorScreenX ?? canvas.clientWidth / 2;
    const ay = anchorScreenY ?? canvas.clientHeight / 2;
    // ponto na imagem que está sob o anchor
    const imgX = (ax - panXRef.current) / zoomRef.current;
    const imgY = (ay - panYRef.current) / zoomRef.current;
    zoomRef.current = z;
    panXRef.current = ax - imgX * z;
    panYRef.current = ay - imgY * z;
    setZoomDisplay(Math.round(z * 100));
    redraw();
  }

  function zoomBy(factor: number, anchorX?: number, anchorY?: number) {
    setZoom(zoomRef.current * factor, anchorX, anchorY);
  }

  function applyTransform(ctx: CanvasRenderingContext2D) {
    ctx.translate(panXRef.current, panYRef.current);
    ctx.scale(zoomRef.current, zoomRef.current);
  }

  function redraw() {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    applyTransform(ctx);
    const img = imgRef.current;
    if (img) ctx.drawImage(img, 0, 0);
    strokesRef.current.forEach((s) => drawStroke(ctx, s));
    if (currentRef.current) drawStroke(ctx, currentRef.current);
  }

  function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke) {
    if (s.points.length < 1) return;

    // Texto: posição = primeiro ponto, conteúdo em s.text
    if (s.tool === "text" && s.text) {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = s.color;
      ctx.globalAlpha = 1;
      const fontPx = Math.max(20, s.size * 6);
      ctx.font = `500 ${fontPx}px "Helvetica Neue", Arial, sans-serif`;
      ctx.textBaseline = "top";
      const p = s.points[0];
      // Background para legibilidade
      const m = ctx.measureText(s.text);
      const padX = 6, padY = 4;
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(p.x - padX, p.y - padY, m.width + padX * 2, fontPx + padY * 2);
      ctx.restore();
      ctx.fillStyle = s.color;
      ctx.fillText(s.text, p.x, p.y);
      return;
    }

    ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (s.tool === "eraser") { ctx.globalCompositeOperation = "destination-out"; ctx.strokeStyle = "#000"; ctx.globalAlpha = 1; }
    else { ctx.globalCompositeOperation = "source-over"; ctx.strokeStyle = s.color; ctx.globalAlpha = s.tool === "marker" ? 0.32 : 1; }

    if (s.tool === "circle" && s.points.length >= 2) {
      const a = s.points[0], b = s.points[s.points.length - 1];
      ctx.lineWidth = s.size; ctx.beginPath();
      ctx.ellipse((a.x + b.x) / 2, (a.y + b.y) / 2, Math.abs(b.x - a.x) / 2, Math.abs(b.y - a.y) / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if ((s.tool === "line" || s.tool === "arrow") && s.points.length >= 2) {
      const a = s.points[0], b = s.points[s.points.length - 1];
      ctx.lineWidth = s.size; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      if (s.tool === "arrow") {
        const ang = Math.atan2(b.y - a.y, b.x - a.x), head = 14 + s.size;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - head * Math.cos(ang - Math.PI / 6), b.y - head * Math.sin(ang - Math.PI / 6));
        ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - head * Math.cos(ang + Math.PI / 6), b.y - head * Math.sin(ang + Math.PI / 6));
        ctx.stroke();
      }
    } else {
      for (let i = 1; i < s.points.length; i++) {
        const p0 = s.points[i - 1], p1 = s.points[i];
        const pr = s.tool === "eraser" ? 1 : ((p0.p + p1.p) / 2 || 0.5);
        ctx.lineWidth = s.size * (pr * 1.6 + 0.25);
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  /** Converte coord da tela → coord da imagem (espaço onde os strokes vivem). */
  function screenToImage(clientX: number, clientY: number) {
    const r = canvasRef.current!.getBoundingClientRect();
    const sx = clientX - r.left;
    const sy = clientY - r.top;
    return {
      x: (sx - panXRef.current) / zoomRef.current,
      y: (sy - panYRef.current) / zoomRef.current,
    };
  }

  function localPoint(e: React.PointerEvent<HTMLCanvasElement>) {
    const { x, y } = screenToImage(e.clientX, e.clientY);
    return { x, y, p: e.pressure || (e.pointerType === "pen" ? 0.5 : 0.7) };
  }

  function handleDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = canvasRef.current!.getBoundingClientRect();
    pointersRef.current.set(e.pointerId, { x: e.clientX - r.left, y: e.clientY - r.top, type: e.pointerType });

    // Tool=text: abre prompt e cria stroke
    if (tool === "text") {
      const txt = window.prompt("Texto:", "")?.trim();
      if (txt) {
        const pt = localPoint(e);
        strokesRef.current = [
          ...strokesRef.current,
          { tool: "text", color, size: 4, points: [pt], text: txt },
        ];
        redoStackRef.current = [];
        bumpVersion();
        redraw();
      }
      pointersRef.current.delete(e.pointerId);
      return;
    }

    // 2 dedos = pinch (NÃO desenha)
    if (pointersRef.current.size === 2) {
      // Cancela traço em andamento
      if (drawingRef.current) {
        drawingRef.current = false;
        currentRef.current = null;
        redraw();
      }
      const pts = Array.from(pointersRef.current.values());
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      pinchRef.current = {
        startDist: Math.hypot(dx, dy),
        startZoom: zoomRef.current,
        centerX: (pts[0].x + pts[1].x) / 2,
        centerY: (pts[0].y + pts[1].y) / 2,
      };
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);

    // Se for touch sozinho enquanto Pencil está desenhando, ignora (palm rejection é automática pelo único pointer)
    drawingRef.current = true;
    const size = tool === "eraser" ? 22 : tool === "marker" ? 14 : 4;
    currentRef.current = { tool, color, size, points: [localPoint(e)] };
    redoStackRef.current = [];
    bumpVersion();
  }

  function handleMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = canvasRef.current!.getBoundingClientRect();
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: e.clientX - r.left, y: e.clientY - r.top, type: e.pointerType });
    }

    // Pinch ativo
    if (pointersRef.current.size === 2 && pinchRef.current) {
      const pts = Array.from(pointersRef.current.values());
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      const dist = Math.hypot(dx, dy);
      const newCenterX = (pts[0].x + pts[1].x) / 2;
      const newCenterY = (pts[0].y + pts[1].y) / 2;
      const factor = dist / pinchRef.current.startDist;
      const newZoom = pinchRef.current.startZoom * factor;
      // Pan junto com o pinch
      const dCenterX = newCenterX - pinchRef.current.centerX;
      const dCenterY = newCenterY - pinchRef.current.centerY;
      panXRef.current += dCenterX;
      panYRef.current += dCenterY;
      pinchRef.current.centerX = newCenterX;
      pinchRef.current.centerY = newCenterY;
      pinchRef.current.startDist = dist;
      pinchRef.current.startZoom = zoomRef.current;
      setZoom(newZoom, newCenterX, newCenterY);
      return;
    }

    if (!drawingRef.current || !currentRef.current) return;
    currentRef.current.points.push(localPoint(e));
    if (tool === "circle" || tool === "line" || tool === "arrow") redraw();
    else {
      // Desenha apenas o último segmento incrementalmente
      const ctx = canvasRef.current!.getContext("2d")!;
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      applyTransform(ctx);
      drawStroke(ctx, { ...currentRef.current, points: currentRef.current.points.slice(-2) });
    }
  }

  function handleUp(e: React.PointerEvent<HTMLCanvasElement>) {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;

    if (!drawingRef.current || !currentRef.current) return;
    drawingRef.current = false;
    const finished = currentRef.current;
    currentRef.current = null;
    if (finished.points.length > 0) {
      // Push direto na ref → instantâneo, sem esperar React.
      strokesRef.current = [...strokesRef.current, finished];
      bumpVersion();
      redraw();
    } else {
      redraw();
    }
  }

  function handleWheel(e: React.WheelEvent<HTMLCanvasElement>) {
    // Trackpad pinch chega como wheel + ctrlKey; mouse wheel + ctrl/cmd também faz zoom
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const r = canvasRef.current!.getBoundingClientRect();
      const factor = Math.exp(-e.deltaY * 0.01);
      zoomBy(factor, e.clientX - r.left, e.clientY - r.top);
    } else if (e.shiftKey) {
      // Shift + wheel = pan horizontal (atalho útil)
      panXRef.current -= e.deltaY;
      redraw();
    } else {
      // Pan vertical (default scroll)
      panXRef.current -= e.deltaX;
      panYRef.current -= e.deltaY;
      redraw();
    }
  }

  function applyTemplate(t: DrawingTemplate) {
    const img = imgRef.current;
    if (!img || !t.vectorData?.strokes) return;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const newStrokes: Stroke[] = t.vectorData.strokes
      .filter((s) => ["pen", "marker", "eraser", "arrow", "circle", "line"].includes(s.tool))
      .map((s) => ({
        tool: s.tool as Tool,
        color: s.color || COLORS[2],
        size: s.size || 3,
        points: s.points.map((p) => ({ x: p.x * w, y: p.y * h, p: p.p ?? 1 })),
      }));
    strokesRef.current = [...strokesRef.current, ...newStrokes];
    redoStackRef.current = [];
    bumpVersion();
    redraw();
    setShowTemplates(false);
    toast.success(`Template "${t.name}" aplicado`, {
      description: "Edite ou apague qualquer linha como se você tivesse desenhado.",
    });
  }

  function undo() {
    if (strokesRef.current.length === 0) return;
    const last = strokesRef.current[strokesRef.current.length - 1];
    strokesRef.current = strokesRef.current.slice(0, -1);
    redoStackRef.current = [...redoStackRef.current, last];
    bumpVersion();
    redraw();
  }
  function redo() {
    if (redoStackRef.current.length === 0) return;
    const last = redoStackRef.current[redoStackRef.current.length - 1];
    strokesRef.current = [...strokesRef.current, last];
    redoStackRef.current = redoStackRef.current.slice(0, -1);
    bumpVersion();
    redraw();
  }

  async function save() {
    setSaving(true);
    try {
      // Para salvar a versão final, precisa exportar a imagem ORIGINAL com strokes — não a vista atual com zoom.
      // Crio um canvas offscreen no tamanho da imagem original.
      const img = imgRef.current;
      if (!img) throw new Error("Imagem não carregada");
      const off = document.createElement("canvas");
      off.width = img.naturalWidth;
      off.height = img.naturalHeight;
      const offCtx = off.getContext("2d")!;
      offCtx.drawImage(img, 0, 0);
      strokesRef.current.forEach((s) => drawStroke(offCtx, s));

      const blob: Blob = await new Promise((resolve) => off.toBlob((b) => resolve(b!), "image/png"));
      const supabase = createBrowserSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const id = crypto.randomUUID();
      const path = `${user.id}/${dossierId}/${id}.png`;
      const { error: upErr } = await supabase.storage.from("annotations").upload(path, blob, { contentType: "image/png" });
      if (upErr) throw upErr;

      const { error: insertErr } = await supabase.from("ipad_annotations").insert({
        asset_id: assetId, version_name: versionName, vector_data: { strokes: strokesRef.current }, preview_path: path,
      });
      if (insertErr) throw insertErr;

      await supabase.from("media_assets").insert({
        dossier_id: dossierId, kind: "marcacao_ipad", storage_path: path, bucket: "annotations",
        caption: versionName, parent_asset_id: assetId, included_in_pdf: true,
      });

      router.refresh();
    } catch (e) {
      alert("Falha ao salvar: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl bg-surface-card border border-border-subtle shadow-3 overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border-subtle flex-wrap">
        <div className="flex items-center gap-3">
          <span className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.1em" }}>
            Desenhe com iPad
          </span>
          <input
            value={versionName}
            onChange={(e) => setVersionName(e.target.value)}
            className="font-display text-h4 px-2 py-1 -ml-1 rounded-md border border-transparent hover:border-border-subtle focus:border-primary-500 focus:outline-none transition-colors"
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {templates.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowTemplates((s) => !s)}
                className="h-9 px-3 rounded-md border border-border-strong text-body-sm hover:bg-surface-sunken transition-colors inline-flex items-center gap-1.5"
                title="Aplicar template anatômico"
              >
                ✦ Templates
              </button>
              {showTemplates && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowTemplates(false)} />
                  <div className="absolute right-0 top-11 z-20 w-64 rounded-lg bg-surface-card border border-border-strong shadow-3 overflow-hidden">
                    <p className="font-mono text-mono uppercase text-text-muted px-3 pt-3 pb-1.5" style={{ letterSpacing: "0.1em" }}>
                      Anatômicos
                    </p>
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => applyTemplate(t)}
                        className="w-full text-left px-3 py-2.5 text-body-sm hover:bg-surface-sunken transition-colors flex items-center justify-between gap-2"
                      >
                        <span>{t.name}</span>
                        {t.isDefault && (
                          <span className="font-mono text-caption text-text-muted" style={{ letterSpacing: "0.06em" }}>default</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          {versions.length > 0 && (
            <button
              onClick={() => setShowCompare(true)}
              className="h-9 px-3 rounded-md border border-border-strong text-body-sm hover:bg-surface-sunken transition-colors inline-flex items-center gap-1.5"
              title="Comparar versões"
            >
              ⇄ Comparar
            </button>
          )}
          <span className="inline-flex items-center gap-1 p-1 bg-surface-sunken rounded-full text-caption">
            <button onClick={() => setHand("r")} className={`px-3 h-7 rounded-full ${hand === "r" ? "bg-surface-card shadow-1" : "text-text-muted"}`}>Destra</button>
            <button onClick={() => setHand("l")} className={`px-3 h-7 rounded-full ${hand === "l" ? "bg-surface-card shadow-1" : "text-text-muted"}`}>Canhota</button>
          </span>
          <button onClick={save} disabled={saving} className="h-9 px-4 rounded-md bg-primary-500 text-neutral-50 font-medium text-body-sm hover:bg-primary-600 disabled:opacity-50 transition-all">
            {saving ? "Salvando…" : "Salvar versão"}
          </button>
        </div>
      </header>

      <div className={`grid gap-3 p-3 ${hand === "r" ? "grid-cols-[64px_1fr_220px]" : "grid-cols-[220px_1fr_64px]"}`}>
        {hand === "r" && <Toolbar tool={tool} setTool={setTool} color={color} setColor={setColor} onUndo={undo} onRedo={redo} canUndo={strokesRef.current.length > 0} canRedo={redoStackRef.current.length > 0} />}

        <div className="relative aspect-[4/3] bg-neutral-200 rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            onPointerDown={handleDown}
            onPointerMove={handleMove}
            onPointerUp={handleUp}
            onPointerCancel={handleUp}
            onPointerLeave={handleUp}
            onWheel={handleWheel}
            className="absolute inset-0 cursor-crosshair"
            style={{ touchAction: "none" }}
          />

          {/* Controles de zoom flutuantes */}
          <div className="absolute right-3 bottom-3 flex flex-col gap-1 bg-surface-card/95 backdrop-blur rounded-lg shadow-2 border border-border-subtle p-1">
            <button onClick={() => zoomBy(1.25)} title="Aproximar" className="size-9 rounded-md inline-flex items-center justify-center text-text-secondary hover:bg-surface-sunken hover:text-text-primary transition-colors">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="6" /><path d="M11 8v6M8 11h6M20 20l-4.5-4.5" /></svg>
            </button>
            <button onClick={() => zoomBy(0.8)} title="Afastar" className="size-9 rounded-md inline-flex items-center justify-center text-text-secondary hover:bg-surface-sunken hover:text-text-primary transition-colors">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="6" /><path d="M8 11h6M20 20l-4.5-4.5" /></svg>
            </button>
            <button onClick={() => fitToCanvas()} title="Ajustar à tela" className="size-9 rounded-md inline-flex items-center justify-center text-text-secondary hover:bg-surface-sunken hover:text-text-primary transition-colors">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>
            </button>
            <button onClick={() => setZoom(1)} title="Tamanho real (100%)" className="h-9 px-2 rounded-md inline-flex items-center justify-center text-text-secondary hover:bg-surface-sunken hover:text-text-primary transition-colors font-mono text-caption" style={{ letterSpacing: "0.06em" }}>
              1:1
            </button>
            <div className="border-t border-border-subtle my-0.5" />
            <span className="h-7 inline-flex items-center justify-center font-mono text-caption text-text-muted tabular-nums" title="Zoom atual">
              {zoomDisplay}%
            </span>
          </div>

          <span className="absolute bottom-3 left-3 px-2 py-1 rounded-full bg-black/60 text-white font-mono text-caption uppercase pointer-events-none" style={{ letterSpacing: "0.1em" }}>
            Apple Pencil · 2 dedos = zoom · ⌘+scroll
          </span>
        </div>

        <div className="bg-surface-sunken border border-border-subtle rounded-lg p-2 flex flex-col gap-2 max-h-[600px] overflow-y-auto">
          <p className="font-mono text-mono uppercase text-text-muted px-2 py-1" style={{ letterSpacing: "0.1em" }}>Versões</p>
          {versions.length === 0 ? (
            <p className="text-caption text-text-muted px-2">Nenhuma versão salva ainda.</p>
          ) : (
            versions.map((v) => (
              <div key={v.id} className="group flex items-center gap-2 p-2 rounded-md bg-surface-card">
                {v.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.previewUrl} alt="" className="size-12 rounded-md object-cover" />
                ) : (
                  <div className="size-12 rounded-md bg-neutral-200" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-medium truncate">{v.name}</p>
                  <p className="font-mono text-caption text-text-muted" style={{ letterSpacing: "0.06em" }}>
                    {new Date(v.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <form action={duplicateVersionAction}>
                  <input type="hidden" name="version_id" value={v.id} />
                  <input type="hidden" name="dossier_id" value={dossierId} />
                  <input type="hidden" name="asset_id" value={assetId} />
                  <button
                    type="submit"
                    title="Duplicar versão"
                    className="size-7 rounded-md inline-flex items-center justify-center text-text-muted hover:bg-surface-sunken hover:text-text-primary transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  </button>
                </form>
              </div>
            ))
          )}
        </div>

        {hand === "l" && <Toolbar tool={tool} setTool={setTool} color={color} setColor={setColor} onUndo={undo} onRedo={redo} canUndo={strokesRef.current.length > 0} canRedo={redoStackRef.current.length > 0} />}
      </div>

      {showCompare && (
        <VersionCompare
          baseUrl={imageUrl}
          baseLabel="Original"
          versions={versions.map((v) => ({ id: v.id, name: v.name, url: v.previewUrl, createdAt: v.createdAt }))}
          onClose={() => setShowCompare(false)}
        />
      )}
    </section>
  );
}

interface ToolbarProps { tool: Tool; setTool: (t: Tool) => void; color: string; setColor: (c: string) => void; onUndo: () => void; onRedo: () => void; canUndo: boolean; canRedo: boolean }
function Toolbar({ tool, setTool, color, setColor, onUndo, onRedo, canUndo, canRedo }: ToolbarProps) {
  const tools: { id: Tool; label: string; svg: React.ReactNode }[] = [
    { id: "pen", label: "Caneta", svg: <path d="M16.5 3.5l4 4L7 21H3v-4L16.5 3.5z" /> },
    { id: "marker", label: "Marcador", svg: <path d="M5 19h14M14 4l6 6-9 9H5v-6l9-9z" /> },
    { id: "eraser", label: "Borracha", svg: <path d="M3 19l8-8 6 6-2 2H3zM10 12l9-9 4 4-9 9" /> },
    { id: "arrow", label: "Seta", svg: <path d="M5 19L19 5M19 5h-7M19 5v7" /> },
    { id: "circle", label: "Círculo", svg: <circle cx="12" cy="12" r="8" /> },
    { id: "line", label: "Linha", svg: <path d="M5 19L19 5" /> },
    { id: "text", label: "Texto", svg: <><path d="M5 5h14M12 5v14M9 19h6" /></> },
  ];
  return (
    <div className="bg-surface-sunken border border-border-subtle rounded-lg p-2 flex flex-col gap-1.5">
      {tools.map((t) => (
        <button key={t.id} onClick={() => setTool(t.id)} title={t.label}
          className={`size-touch rounded-md inline-flex items-center justify-center transition-colors ${tool === t.id ? "bg-primary-500 text-neutral-50 shadow-1" : "text-text-secondary hover:bg-surface-card"}`}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">{t.svg}</svg>
        </button>
      ))}
      <div className="h-px bg-border-subtle my-1" />
      {COLORS.map((c) => (
        <button key={c} onClick={() => setColor(c)} aria-label={c}
          className={`mx-auto size-7 rounded-full transition-transform ${color === c ? "ring-2 ring-offset-2 ring-offset-surface-sunken ring-primary-500 scale-110" : ""}`}
          style={{ background: c, ...(c === "#FAFAF7" ? { boxShadow: "inset 0 0 0 1px var(--border-strong)" } : {}) }} />
      ))}
      <div className="h-px bg-border-subtle my-1" />
      <button onClick={onUndo} disabled={!canUndo} title="Desfazer" className="size-touch rounded-md inline-flex items-center justify-center text-text-secondary hover:bg-surface-card disabled:opacity-30 disabled:cursor-not-allowed">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 14L4 9l5-5M4 9h11a5 5 0 010 10h-2"/></svg>
      </button>
      <button onClick={onRedo} disabled={!canRedo} title="Refazer" className="size-touch rounded-md inline-flex items-center justify-center text-text-secondary hover:bg-surface-card disabled:opacity-30 disabled:cursor-not-allowed">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M15 14l5-5-5-5M20 9H9a5 5 0 000 10h2"/></svg>
      </button>
    </div>
  );
}
