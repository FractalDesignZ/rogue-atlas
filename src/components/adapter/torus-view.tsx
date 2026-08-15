import { useEffect, useRef } from "react";
import type { AdapterReport } from "@/lib/adapter/types";
import { torusPoint } from "@/lib/adapter/orbit";

export function TorusView({ report }: { report: AdapterReport }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const orbit = report.orbit;
  const now = report.now;
  const t = report.states[now]?.t ?? 0;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !orbit) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(18, 16, 14, 1)";
    ctx.fillRect(0, 0, w, h);
    const pad = 18;
    const iw = w - pad * 2;
    const ih = h - pad * 2;
    ctx.strokeStyle = "rgba(232, 224, 208, 0.12)";
    ctx.lineWidth = 1;
    ctx.strokeRect(pad, pad, iw, ih);
    ctx.beginPath();
    const freqs = orbit.frequencies;
    for (let i = 0; i < report.states.length; i++) {
      const p = torusPoint(report.states[i]!.t, freqs);
      const x = pad + ((p.u + 1) % 1) * iw;
      const y = pad + ((p.v + 1) % 1) * ih;
      if (i === 0) ctx.moveTo(x, y);
      else {
        const prev = torusPoint(report.states[i - 1]!.t, freqs);
        const wrap = Math.abs(p.u - prev.u) > 0.5 || Math.abs(p.v - prev.v) > 0.5;
        if (wrap) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    }
    ctx.strokeStyle = "rgba(196, 164, 110, 0.85)";
    ctx.lineWidth = 1.25;
    ctx.stroke();
    const here = torusPoint(t, freqs);
    ctx.fillStyle = "rgba(196, 164, 110, 1)";
    ctx.beginPath();
    ctx.arc(pad + ((here.u + 1) % 1) * iw, pad + ((here.v + 1) % 1) * ih, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }, [report.states, orbit, t]);

  if (!orbit) return null;
  return (
    <section className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-panel)]">
      <div className="flex items-end justify-between gap-3 px-4 pt-4">
        <div>
          <p className="text-[11px] tracking-[0.18em] text-subtle uppercase">Orbit / closure</p>
          <h2 className="mt-1 font-display text-xl leading-tight">
            Dim {orbit.orbitDim} on T<sup>{orbit.closureDim}</sup>
          </h2>
        </div>
        <p className="max-w-[14rem] text-right text-[11px] leading-relaxed text-subtle">
          {orbit.note}
        </p>
      </div>
      <canvas ref={ref} className="mt-2 h-44 w-full" />
    </section>
  );
}
