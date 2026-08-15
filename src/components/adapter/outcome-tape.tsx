import type { AdapterReport, OutcomeKind } from "@/lib/adapter/types";
import { cn } from "@/lib/utils";

const KIND_BG: Record<OutcomeKind | "open", string> = {
  known: "bg-pass/70",
  perceived: "bg-info/70",
  speculative: "bg-warn/70",
  open: "bg-faint",
};

function owner(report: AdapterReport, i: number): OutcomeKind | "open" {
  return report.outcomes.find((o) => o.members.includes(i))?.kind ?? "open";
}

export function OutcomeTape({
  report,
  onNow,
}: {
  report: AdapterReport;
  onNow: (i: number) => void;
}) {
  const n = report.states.length;
  if (n < 2) return null;
  const now = Math.min(Math.max(0, report.now), n - 1);
  const play = n <= 1 ? 0 : now / (n - 1);
  const midCut = report.middleOut ? report.middleOut.cut / Math.max(n - 1, 1) : null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px] tracking-wide text-subtle uppercase">
        <span>Tape</span>
        <span className="font-mono normal-case tabular-nums">
          {now + 1} / {n}
        </span>
      </div>
      <div className="relative">
        <div
          className="flex h-7 overflow-hidden rounded-sm bg-inset"
          role="slider"
          aria-label="Now on the tape"
          aria-valuemin={0}
          aria-valuemax={n - 1}
          aria-valuenow={now}
        >
          {report.states.map((s) => {
            const kind = owner(report, s.i);
            const cut = report.jumps.some((j) => j.to === s.i);
            const cliff = (report.typeIIField[s.i] ?? 0) > 0.78;
            return (
              <button
                key={s.i}
                type="button"
                title={s.clause ?? s.label}
                onClick={() => onNow(s.i)}
                style={{ flexGrow: Math.max(0.35, s.gap) }}
                className={cn(
                  "relative min-w-px border-0 p-0",
                  KIND_BG[kind],
                  cut && "bg-fail/80",
                )}
              >
                {cliff ? (
                  <span className="absolute inset-x-0 top-0 h-0.5 bg-accent/80" />
                ) : null}
              </button>
            );
          })}
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-accent"
          style={{ left: `clamp(0px, calc(${play * 100}% - 1px), calc(100% - 2px))` }}
        />
        {midCut !== null ? (
          <div
            aria-hidden
            title="Middle-out cut"
            className="pointer-events-none absolute top-0 bottom-0 w-px bg-warn/80"
            style={{ left: `clamp(0px, calc(${midCut * 100}%), calc(100% - 1px))` }}
          />
        ) : null}
      </div>
      <div className="flex flex-wrap gap-3 text-[11px] text-subtle">
        <span className="inline-flex items-center gap-1.5">
          <i className="size-1.5 rounded-full bg-pass" /> Known
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="size-1.5 rounded-full bg-info" /> Perceived
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="size-1.5 rounded-full bg-warn" /> Speculative
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="size-1.5 rounded-full bg-fail" /> Jump
        </span>
      </div>
    </div>
  );
}
