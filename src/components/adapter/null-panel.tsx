import { Badge } from "@/components/ui/badge";
import type { NullReport } from "@/lib/adapter/nulls";
import { formatFixed } from "@/lib/utils";

export function NullPanel({ nulls }: { nulls: NullReport }) {
  return (
    <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)] sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] tracking-[0.18em] text-subtle uppercase">Justified null</p>
        <Badge variant={nulls.pApprox > 0.2 ? "info" : "warn"}>{nulls.name}</Badge>
      </div>
      <h2 className="mt-2 font-display text-2xl leading-tight">
        p ≈ {formatFixed(nulls.pApprox, 2)}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{nulls.note}</p>
      <p className="mt-2 text-xs leading-relaxed text-subtle">{nulls.justification}</p>
      <dl className="mt-4 grid grid-cols-3 gap-3">
        <div>
          <dt className="text-[11px] text-subtle uppercase">Live</dt>
          <dd className="mt-1 font-mono text-sm tabular-nums">{formatFixed(nulls.live, 2)}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-subtle uppercase">Null mean</dt>
          <dd className="mt-1 font-mono text-sm tabular-nums">{formatFixed(nulls.nullMean, 2)}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-subtle uppercase">Draws</dt>
          <dd className="mt-1 font-mono text-sm tabular-nums">{nulls.replicates}</dd>
        </div>
      </dl>
    </section>
  );
}
