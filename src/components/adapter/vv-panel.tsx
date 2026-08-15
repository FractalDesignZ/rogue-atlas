import { useEffect, useState } from "react";
import type { VerifyCheck, VerifyReport } from "@/lib/adapter/verify";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PATH_STAGE: Record<string, string> = {
  "spine.sheaf": "sheaf",
  "spine.pipeline": "sheaf",
  "spine.null": "null",
  "spine.graphs": "neighborhood",
  "spine.metric": "data",
  "spine.fork": "data",
  "spine.claims": "sheaf",
  "paper.tangent": "neighborhood",
  "paper.orbit": "transport",
  "domain.drill": "null",
  "guard.epistemic": "frames",
  "guard.provenance": "data",
};

export function VvPanel({
  vv,
  onStage,
}: {
  vv: VerifyReport;
  onStage?: (id: string) => void;
}) {
  const ordered = [...vv.checks].sort((a, b) => Number(a.ok) - Number(b.ok));
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => {
    setMs(vv.elapsedMs);
  }, [vv.elapsedMs]);
  return (
    <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)] sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] tracking-[0.18em] text-subtle uppercase">V&V</p>
          <h2 className="mt-2 font-display text-2xl leading-tight">{vv.headline}</h2>
        </div>
        <Badge variant={vv.criticalFailed ? "warn" : vv.failed ? "info" : "pass"}>
          {vv.passed}/{vv.checks.length}
          {ms !== null ? ` · ${ms} ms` : ""}
        </Badge>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">{vv.note}</p>
      <ol className="mt-4 space-y-1.5">
        {ordered.map((c) => (
          <CheckRow key={c.id} check={c} onStage={onStage} />
        ))}
      </ol>
    </section>
  );
}

function CheckRow({
  check,
  onStage,
}: {
  check: VerifyCheck;
  onStage?: (id: string) => void;
}) {
  const stage = PATH_STAGE[check.path];
  return (
    <li>
      <button
        type="button"
        disabled={!onStage || !stage}
        onClick={() => {
          if (stage) onStage?.(stage);
        }}
        className={cn(
          "flex min-h-11 w-full items-start justify-between gap-3 rounded-md bg-raised px-3 py-2 text-left",
          !check.ok && "ring-1 ring-warn/40",
        )}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[10px] text-subtle">{check.path}</span>
            <Badge variant={check.ok ? "pass" : check.merit === "critical" ? "warn" : "info"}>
              {check.ok ? "held" : check.merit}
            </Badge>
          </div>
          <p className="mt-1 text-sm leading-snug text-fg">{check.note}</p>
        </div>
        <div className="shrink-0 text-right font-mono text-[11px] tabular-nums text-subtle">
          <div>{check.got}</div>
          {!check.ok ? <div className="text-warn">want {check.want}</div> : null}
        </div>
      </button>
    </li>
  );
}
