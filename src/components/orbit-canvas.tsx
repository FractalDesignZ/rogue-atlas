import { useEffect, useRef } from "react";
import type { GeometryReport } from "@/lib/meridian/types";

export function OrbitCanvas({
  geometry,
  className,
}: {
  geometry: GeometryReport;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const parent = canvas.parentElement;
    const draw = () => {
      const w = parent?.clientWidth ?? 640;
      const h = parent?.clientHeight ?? 360;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.fillStyle = "#0c0c0e";
      ctx.fillRect(0, 0, w, h);

      const pts = geometry.orbit;
      if (pts.length < 2) return;

      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
      for (const p of pts) {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      }
      const pad = 28;
      const sx = (w - pad * 2) / Math.max(maxX - minX, 1e-6);
      const sy = (h - pad * 2) / Math.max(maxY - minY, 1e-6);
      const s = Math.min(sx, sy);
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const map = (x: number, y: number) => ({
        x: w / 2 + (x - cx) * s,
        y: h / 2 + (y - cy) * s,
      });

      ctx.strokeStyle = "rgba(242,239,232,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.36, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.22, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = "rgba(215,210,200,0.18)";
      ctx.moveTo(w / 2, pad);
      ctx.lineTo(w / 2, h - pad);
      ctx.stroke();

      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(242,239,232,0.88)";
      ctx.lineWidth = 1.35;
      ctx.beginPath();
      pts.forEach((p, i) => {
        const q = map(p.x, p.y);
        if (i === 0) ctx.moveTo(q.x, q.y);
        else ctx.lineTo(q.x, q.y);
      });
      ctx.stroke();

      const step = Math.max(1, Math.floor(pts.length / 28));
      for (let i = 0; i < pts.length; i += step) {
        const q = map(pts[i].x, pts[i].y);
        const t = i / pts.length;
        ctx.fillStyle = `rgba(215,210,200,${0.25 + 0.6 * t})`;
        ctx.beginPath();
        ctx.arc(q.x, q.y, i === 0 ? 2.6 : 1.7, 0, Math.PI * 2);
        ctx.fill();
      }

      const last = map(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.strokeStyle = "rgba(138,163,146,0.9)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(last.x, last.y, 6, 0, Math.PI * 2);
      ctx.stroke();
    };

    draw();
    const ro = new ResizeObserver(draw);
    if (parent) ro.observe(parent);
    return () => ro.disconnect();
  }, [geometry]);

  return <canvas ref={ref} className={className} aria-label="Phase orbit projection" />;
}
