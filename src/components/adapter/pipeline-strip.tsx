import { CLAIM_LABEL, type ClaimClass } from "@/lib/adapter/claims";
import { pipelineOf } from "@/lib/adapter/pipeline";
import type { AdapterReport } from "@/lib/adapter/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const VARIANT: Record<ClaimClass, "pass" | "info" | "warn" | "default"> = {
  identity: "info",
  certificate: "pass",
  empirical: "default",
  excluded: "warn",
};

export function PipelineStrip({
  report,
  active,
  onSelect,
}: {
  report: AdapterReport;
  active: string | null;
  onSelect: (id: string) => void;
}) {
  const stages = pipelineOf(report);
  const current = stages.find((s) => s.id === active) ?? stages[0];
  return (
    <section id="stage-pipeline" className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)] sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] tracking-[0.18em] text-subtle uppercase">Run pipeline</p>
          <h2 className="mt-2 font-display text-2xl leading-tight">
            Data to null, with a gate in the middle.
          </h2>
        </div>
        <p className="text-[11px] text-subtle">[ ] walks the stages</p>
      </div>
      <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {stages.map((s, i) => {
          const selected = current?.id === s.id;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                className={cn(
                  "min-h-11 w-full rounded-md bg-raised px-2.5 py-2 text-left transition-colors",
                  s.klass === "excluded" && !selected && "opacity-80",
                  selected && "ring-1 ring-accent/70",
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono text-[10px] text-subtle">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Badge variant={VARIANT[s.klass]}>{CLAIM_LABEL[s.klass]}</Badge>
                </div>
                <p className="mt-1.5 font-display text-lg leading-tight">{s.label}</p>
                <p className="mt-1 font-mono text-[11px] text-fg">{s.status}</p>
              </button>
            </li>
          );
        })}
      </ol>
      {current ? (
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">{current.brief}</p>
      ) : null}
    </section>
  );
}
