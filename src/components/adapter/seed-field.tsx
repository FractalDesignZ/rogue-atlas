import { useEffect, useRef, useState } from "react";
import type { AbstractionLevel, AdapterReport, GraphKind, ModalityLens, OutcomeKind } from "@/lib/adapter/types";

const KIND: Record<OutcomeKind, string> = {
  known: "rgba(138,163,146,0.92)",
  perceived: "rgba(138,150,163,0.92)",
  speculative: "rgba(196,165,116,0.92)",
};

type Tip = { x: number; y: number; title: string; meta: string };

export function SeedField({
  report,
  released,
  selected,
  level = "high",
  ghost,
  focus = null,
  lens = "all",
  sequence = null,
  graphKind = "local",
  onSelect,
  onNow,
  className,
}: {
  report: AdapterReport;
  released: boolean;
  selected: string | null;
  level?: AbstractionLevel;
  ghost?: AdapterReport | null;
  focus?: number | null;
  lens?: ModalityLens;
  sequence?: number[] | null;
  graphKind?: GraphKind;
  onSelect: (id: string | null) => void;
  onNow?: (i: number) => void;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef(report);
  const releasedRef = useRef(released);
  const selectedRef = useRef(selected);
  const levelRef = useRef(level);
  const ghostRef = useRef(ghost ?? null);
  const focusRef = useRef(focus);
  const lensRef = useRef(lens);
  const sequenceRef = useRef(sequence);
  const graphRef = useRef(graphKind);
  const phaseRef = useRef(0);
  const blowRef = useRef(0);
  const [tip, setTip] = useState<Tip | null>(null);

  reportRef.current = report;
  releasedRef.current = released;
  selectedRef.current = selected;
  levelRef.current = level;
  ghostRef.current = ghost ?? null;
  focusRef.current = focus;
  lensRef.current = lens;
  sequenceRef.current = sequence;
  graphRef.current = graphKind;

  useEffect(() => {
    if (released) blowRef.current = 0;
  }, [released, report.weights, report.source, report.prompt]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const project = (w: number, h: number) => {
      const pts = reportRef.current.states;
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
      minX = Math.min(minX, -0.2);
      maxX = Math.max(maxX, 0.2);
      minY = Math.min(minY, -0.2);
      maxY = Math.max(maxY, 0.2);
      for (const o of reportRef.current.outcomes) {
        minX = Math.min(minX, o.attractor.x);
        maxX = Math.max(maxX, o.attractor.x);
        minY = Math.min(minY, o.attractor.y);
        maxY = Math.max(maxY, o.attractor.y);
      }
      const pad = 36;
      const sx = (w - pad * 2) / Math.max(maxX - minX, 0.8);
      const sy = (h - pad * 2 - 22) / Math.max(maxY - minY, 0.8);
      const s = Math.min(sx, sy);
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      return (x: number, y: number) => ({
        x: w / 2 + (x - cx) * s,
        y: (h - 22) / 2 + (y - cy) * s,
      });
    };

    const hitTest = (mx: number, my: number) => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      const map = project(w, h);
      const r = reportRef.current;
      for (const o of r.outcomes) {
        const p = map(o.attractor.x, o.attractor.y);
        if (Math.hypot(mx - p.x, my - p.y) < 18) return { kind: "outcome" as const, id: o.id, i: -1 };
      }
      for (const s of r.states) {
        const p = map(s.x, s.y);
        if (Math.hypot(mx - p.x, my - p.y) < 12) {
          return { kind: "state" as const, id: null, i: s.i };
        }
      }
      return null;
    };

    const drawBarcode = (w: number, h: number) => {
      const bars = reportRef.current.persistence?.h0 ?? [];
      if (!bars.length) return;
      const y = h - 14;
      const x0 = 16;
      const x1 = w - 16;
      const span = Math.max(x1 - x0, 1);
      ctx.strokeStyle = "rgba(242,239,232,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y);
      ctx.stroke();
      bars.forEach((b, i) => {
        const a = x0 + (b.birth / Math.max(reportRef.current.persistence.maxScale, 1e-6)) * span;
        const d = x0 + (b.death / Math.max(reportRef.current.persistence.maxScale, 1e-6)) * span;
        ctx.strokeStyle = b.persist > 0.45 ? "rgba(215,210,200,0.55)" : "rgba(215,210,200,0.22)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(a, y - 3 - (i % 5));
        ctx.lineTo(Math.max(d, a + 1), y - 3 - (i % 5));
        ctx.stroke();
      });
    };

    const draw = () => {
      if (!running) return;
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.fillStyle = "#0c0c0e";
      ctx.fillRect(0, 0, w, h);

      const r = reportRef.current;
      if (r.states.length < 2) return;
      const map = project(w, h);
      const phase = phaseRef.current;
      const blow = releasedRef.current ? Math.min(1, blowRef.current) : 0;
      const level = levelRef.current;
      const showOpen = level !== "low";
      const showHigh = level === "high";

      ctx.strokeStyle = "rgba(242,239,232,0.05)";
      ctx.lineWidth = 1;
      const rad = Math.min(w, h);
      for (const f of [0.18, 0.3, 0.44]) {
        ctx.beginPath();
        ctx.arc(w / 2, (h - 22) / 2, rad * f, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (showOpen) {
        for (const o of r.opens) {
          const c = r.states[o.center];
          if (!c) continue;
          const p = map(c.x, c.y);
          const q = map(c.x + o.radius, c.y);
          const rr = Math.max(14, Math.abs(q.x - p.x));
          ctx.beginPath();
          ctx.fillStyle =
            o.property === "robust interior"
              ? "rgba(138,163,146,0.10)"
              : o.property === "boundary layer"
                ? "rgba(196,165,116,0.09)"
                : "rgba(215,210,200,0.06)";
          ctx.arc(p.x, p.y, rr, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(242,239,232,0.10)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      if (r.states.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = level === "low" ? "rgba(242,239,232,0.38)" : "rgba(242,239,232,0.22)";
        ctx.lineWidth = 1.05;
        r.states.forEach((s, i) => {
          const p = map(s.x, s.y);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
      }

      const edges =
        graphRef.current === "recurrence" ? r.graphs?.recurrence : r.graphs?.local;
      if (edges && edges.length && level !== "low") {
        ctx.strokeStyle =
          graphRef.current === "recurrence"
            ? "rgba(196,165,116,0.38)"
            : "rgba(138,163,146,0.32)";
        ctx.lineWidth = 0.9;
        for (const e of edges) {
          const a = r.states[e.a];
          const b = r.states[e.b];
          if (!a || !b) continue;
          const pa = map(a.x, a.y);
          const pb = map(b.x, b.y);
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          ctx.stroke();
        }
      }

      if (showHigh && r.states.length > 1) {
        const start = map(r.states[0]!.x, r.states[0]!.y);
        const here = r.states[r.now] ?? r.states[r.states.length - 1]!;
        const end = map(here.x, here.y);
        ctx.beginPath();
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = "rgba(196,123,114,0.35)";
        ctx.lineWidth = 1;
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const ghost = ghostRef.current;
      if (ghost && ghost.geodesic.length > 1 && showHigh) {
        ctx.beginPath();
        ctx.setLineDash([3, 5]);
        ctx.strokeStyle = "rgba(138,150,163,0.45)";
        ctx.lineWidth = 1.1;
        ghost.geodesic.forEach((idx, i) => {
          const s = ghost.states[idx];
          if (!s) return;
          const p = map(s.x, s.y);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const chain = sequenceRef.current;
      if (chain && chain.length > 1 && showHigh) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(196,165,116,0.7)";
        ctx.lineWidth = 2;
        chain.forEach((idx, i) => {
          const s = r.states[idx];
          if (!s) return;
          const p = map(s.x, s.y);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
      }

      if (showHigh) {
        for (const o of r.outcomes) {
          const p = map(o.attractor.x, o.attractor.y);
          ctx.beginPath();
          ctx.strokeStyle = KIND[o.kind];
          ctx.globalAlpha = selectedRef.current === o.id ? 0.95 : 0.45;
          ctx.lineWidth = selectedRef.current === o.id ? 1.6 : 1.1;
          ctx.arc(p.x, p.y, 16 + (o.kind === "speculative" ? 4 : 0), 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        const path = r.geodesic;
        if (path.length > 1) {
          ctx.beginPath();
          ctx.lineJoin = "round";
          ctx.lineCap = "round";
          ctx.strokeStyle = "rgba(242,239,232,0.78)";
          ctx.lineWidth = 1.4;
          path.forEach((idx, i) => {
            const s = r.states[idx]!;
            const dest = r.outcomes.find((o) => o.members.includes(idx))?.attractor;
            const u = dest
              ? { x: s.x + (dest.x - s.x) * blow * 0.55, y: s.y + (dest.y - s.y) * blow * 0.55 }
              : { x: s.x, y: s.y };
            const p = map(u.x, u.y);
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          });
          ctx.stroke();
        }
      }

      if (showOpen) {
        for (const j of r.jumps) {
          const a = r.states[j.from];
          const b = r.states[j.to];
          if (!a || !b) continue;
          const pa = map(a.x, a.y);
          const pb = map(b.x, b.y);
          ctx.beginPath();
          ctx.setLineDash([4, 5]);
          ctx.strokeStyle = "rgba(196,123,114,0.72)";
          ctx.lineWidth = 1.15;
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      const t1s = [...r.typeIField].sort((a, b) => a - b);
      const t2s = [...r.typeIIField].sort((a, b) => a - b);
      const t1Cut = t1s[Math.floor(t1s.length * 0.78)] ?? Infinity;
      const t2Cut = t2s[Math.floor(t2s.length * 0.78)] ?? Infinity;
      const primeSet = new Set(r.primes.filter((p) => p.role === "prime").map((p) => p.i));
      const gateSet = new Set(r.primes.filter((p) => p.role === "gateway").map((p) => p.i));
      const nextJump = r.jumps.find((j) => j.from >= r.now);

      r.states.forEach((s, i) => {
        const dest = r.outcomes.find((o) => o.members.includes(s.i))?.attractor;
        const drift = reduced ? 0 : Math.sin(phase * 0.9 + i * 0.45) * 1.4;
        const ux = dest && showHigh ? s.x + (dest.x - s.x) * blow * 0.72 : s.x;
        const uy = dest && showHigh ? s.y + (dest.y - s.y) * blow * 0.72 : s.y;
        const p = map(ux, uy);
        p.y += drift;

        const owner = r.outcomes.find((o) => o.members.includes(s.i));
        const seed = owner ? KIND[owner.kind] : "rgba(215,210,200,0.9)";
        const val = r.valueField[i] ?? 0.4;
        const radS = 2.4 + val * 3.2;
        const t1 = r.typeIField[i] ?? 0;
        const t2 = r.typeIIField[i] ?? 0;
        const isNow = s.i === r.now;
        const isFocus = s.i === focusRef.current;
        const isHorizon = nextJump?.from === s.i;
        const isJump = r.jumps.some((j) => j.to === s.i || j.from === s.i);
        const lens = lensRef.current;
        const shown =
          lens === "all" ||
          (lens === "necessary" && owner?.modality === "necessary") ||
          (lens === "possible" && owner?.modality === "possible") ||
          (lens === "unentailed" && (owner?.modality === "unentailed" || isJump || !owner));

        ctx.save();
        ctx.globalAlpha = shown || isNow || isFocus ? 1 : 0.16;
        ctx.translate(p.x, p.y);
        ctx.strokeStyle = "rgba(242,239,232,0.28)";
        ctx.lineWidth = 0.8;
        const arms = primeSet.has(s.i) ? 10 : 8;
        for (let a = 0; a < arms; a++) {
          const th = (a / arms) * Math.PI * 2 + phase * 0.15 + i * 0.05;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(th) * (7 + radS * 1.8), Math.sin(th) * (7 + radS * 1.8));
          ctx.stroke();
        }
        ctx.fillStyle = seed;
        ctx.beginPath();
        ctx.arc(0, 0, radS, 0, Math.PI * 2);
        ctx.fill();
        if (primeSet.has(s.i)) {
          ctx.strokeStyle = "rgba(242,239,232,0.88)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(0, 0, radS + 6.2, 0, Math.PI * 2);
          ctx.stroke();
        } else if (gateSet.has(s.i) && showHigh) {
          ctx.strokeStyle = "rgba(138,150,163,0.75)";
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 3]);
          ctx.beginPath();
          ctx.arc(0, 0, radS + 5.2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        if (showOpen && t1 > t1Cut) {
          ctx.strokeStyle = "rgba(196,123,114,0.75)";
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.arc(0, 0, radS + 3.4, 0, Math.PI * 2);
          ctx.stroke();
        }
        if (showOpen && t2 > t2Cut) {
          ctx.strokeStyle = "rgba(196,165,116,0.7)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(0, 0, radS + 5.6, 0, Math.PI * 2);
          ctx.stroke();
        }
        if (isFocus && !isNow) {
          ctx.strokeStyle = "rgba(215,210,200,0.7)";
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.arc(0, 0, 14, 0, Math.PI * 2);
          ctx.stroke();
        }
        if (isHorizon) {
          ctx.strokeStyle = "rgba(196,123,114,0.9)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(0, 0, 13, 0, Math.PI * 2);
          ctx.stroke();
        }
        if (isNow) {
          ctx.strokeStyle = "rgba(242,239,232,0.95)";
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.arc(0, 0, 11, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      });

      const now = r.states[r.now];
      if (now) {
        const dest = r.outcomes.find((o) => o.members.includes(now.i))?.attractor;
        const ux = dest && showHigh ? now.x + (dest.x - now.x) * blow * 0.72 : now.x;
        const uy = dest && showHigh ? now.y + (dest.y - now.y) * blow * 0.72 : now.y;
        const p = map(ux, uy);
        ctx.fillStyle = "rgba(242,239,232,0.78)";
        ctx.font = "11px 'IBM Plex Sans', sans-serif";
        ctx.fillText("now", p.x + 14, p.y - 10);
      }

      if (showHigh) {
        ctx.font = "11px 'IBM Plex Sans', sans-serif";
        for (const o of r.outcomes) {
          const p = map(o.attractor.x, o.attractor.y);
          ctx.fillStyle = KIND[o.kind];
          ctx.globalAlpha = 0.85;
          ctx.fillText(o.kind, p.x + 14, p.y + 4);
          ctx.globalAlpha = 1;
        }
      }

      if (level !== "low") drawBarcode(w, h);

      if (!reduced) {
        phaseRef.current += 0.016;
        if (releasedRef.current) blowRef.current = Math.min(1, blowRef.current + 0.018);
      } else if (releasedRef.current) {
        blowRef.current = 1;
      }

      raf = requestAnimationFrame(draw);
    };

    const onClick = (ev: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const hit = hitTest(ev.clientX - rect.left, ev.clientY - rect.top);
      if (!hit) {
        onSelect(null);
        return;
      }
      if (hit.kind === "outcome") onSelect(hit.id);
      else {
        const owner = reportRef.current.outcomes.find((o) => o.members.includes(hit.i));
        onSelect(owner?.id ?? null);
        onNow?.(hit.i);
      }
    };

    const onMove = (ev: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = ev.clientX - rect.left;
      const my = ev.clientY - rect.top;
      const hit = hitTest(mx, my);
      if (!hit) {
        setTip(null);
        return;
      }
      if (hit.kind === "outcome") {
        const o = reportRef.current.outcomes.find((x) => x.id === hit.id);
        if (!o) return;
        setTip({
          x: mx,
          y: my,
          title: o.title,
          meta: `${o.kind} · ${o.low.toFixed(2)}–${o.high.toFixed(2)}`,
        });
        return;
      }
      const s = reportRef.current.states[hit.i];
      if (!s) return;
      const prime = reportRef.current.primes.find((p) => p.i === s.i);
      setTip({
        x: mx,
        y: my,
        title: s.clause ?? s.label,
        meta: `gap ${s.gap.toFixed(2)}${prime ? ` · ${prime.role}` : ""}`,
      });
    };

    canvas.addEventListener("click", onClick);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", () => setTip(null));
    const ro = new ResizeObserver(() => {
      /* next frame redraws */
    });
    ro.observe(wrap);
    raf = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("mousemove", onMove);
      ro.disconnect();
    };
  }, [onSelect, onNow]);

  return (
    <div ref={wrapRef} className={`relative ${className ?? ""}`}>
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-pointer"
        aria-label="Condition-state seed field"
      />
      {tip ? (
        <div
          className="pointer-events-none absolute z-10 max-w-56 rounded-md bg-raised px-2.5 py-1.5 shadow-[var(--shadow-lift)]"
          style={{ left: tip.x + 12, top: tip.y + 12 }}
        >
          <div className="truncate text-xs text-fg">{tip.title}</div>
          <div className="font-mono text-[11px] text-subtle">{tip.meta}</div>
        </div>
      ) : null}
    </div>
  );
}
