import { Badge } from "@/components/ui/badge";
import { drillSnapshot, type DrillRegime } from "@/lib/adapter/drilling";
import { formatFixed } from "@/lib/utils";

const REGIME_LABEL: Record<DrillRegime, string> = {
  normal: "Normal",
  "stick-slip": "Stick-slip",
  whirl: "Whirl",
  bounce: "Bit bounce",
};

export function DrillConsole({ nowRatio, refuse }: { nowRatio: number; refuse: boolean }) {
  const d = drillSnapshot(nowRatio, refuse);
  return (
    <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)] sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] tracking-[0.18em] text-subtle uppercase">Drill console</p>
        <Badge variant={d.regime === "normal" ? "pass" : "warn"}>
          {REGIME_LABEL[d.regime]} · {Math.round(d.confidence * 100)}%
        </Badge>
      </div>
      <h2 className="mt-2 font-display text-2xl leading-tight">
        β₀ {d.beta0} · β₁ {d.beta1}
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Sliding-window Rips on (WOB, RPM). A loop is stick-slip. Two loops, whirl. Split
        components, bounce. Synthetic — not a certified controller.
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(
          [
            ["WOB", d.channels.wob, "kN"],
            ["RPM", d.channels.rpm, ""],
            ["Torque", d.channels.torque, "kNm"],
            ["ROP", d.channels.rop, "m/h"],
          ] as const
        ).map(([k, v, u]) => (
          <div key={k} className="rounded-md bg-raised px-3 py-2">
            <dt className="text-[11px] tracking-wide text-subtle uppercase">{k}</dt>
            <dd className="mt-1 font-mono text-sm tabular-nums">
              {formatFixed(v, 1)}
              {u ? ` ${u}` : ""}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {d.axioms.map((a) => (
          <div key={a.id} className="rounded-md bg-raised px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] text-subtle">{a.id}</span>
              <Badge variant={a.status === "hard" ? "warn" : a.status === "warn" ? "info" : "pass"}>
                {a.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm">{a.name}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{a.note}</p>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <p className="text-[11px] tracking-wide text-subtle uppercase">Experts</p>
        <ul className="mt-2 space-y-1.5">
          {d.experts.map((e) => (
            <li key={e.id} className="flex items-center gap-2">
              <span className="w-24 text-xs text-muted">{REGIME_LABEL[e.id]}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-inset">
                <span
                  className="block h-full bg-accent"
                  style={{ width: `${Math.round(e.weight * 100)}%` }}
                />
              </span>
              <span className="w-8 text-right font-mono text-[11px] tabular-nums text-subtle">
                {Math.round(e.weight * 100)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
