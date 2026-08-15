import type { ForecastStep } from "@/lib/adapter/forecast";
import type { OutcomeKind } from "@/lib/adapter/types";
import { Badge } from "@/components/ui/badge";
import { cn, formatFixed } from "@/lib/utils";

const KIND_BADGE: Record<OutcomeKind | "open", "pass" | "info" | "warn" | "default"> = {
  known: "pass",
  perceived: "info",
  speculative: "warn",
  open: "default",
};

export function ForecastStrip({
  steps,
  onNow,
}: {
  steps: ForecastStep[];
  onNow: (i: number) => void;
}) {
  if (!steps.length) {
    return (
      <p className="text-xs leading-relaxed text-muted">
        Nothing sits ahead. The last observation is already now.
      </p>
    );
  }
  return (
    <ol className="grid gap-2 sm:grid-cols-5">
      {steps.map((s, idx) => (
        <li key={s.i}>
          <button
            type="button"
            onClick={() => onNow(s.i)}
            className={cn(
              "min-h-11 w-full rounded-md bg-raised px-3 py-2 text-left",
              s.refuse && "ring-1 ring-fail/40",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] text-subtle tabular-nums">+{idx + 1}</span>
              <Badge variant={s.refuse ? "warn" : KIND_BADGE[s.kind]}>
                {s.refuse ? "refuse" : s.isJump ? "jump" : s.kind}
              </Badge>
            </div>
            <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-fg">{s.label}</p>
            <p className="mt-1 font-mono text-[11px] text-subtle tabular-nums">
              V {s.v === null ? "—" : formatFixed(s.v, 2)}
            </p>
          </button>
        </li>
      ))}
    </ol>
  );
}
