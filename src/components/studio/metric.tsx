import { formatFixed } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function Metric({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "default" | "pass" | "warn" | "fail";
}) {
  const color =
    tone === "pass"
      ? "text-pass"
      : tone === "warn"
        ? "text-warn"
        : tone === "fail"
          ? "text-fail"
          : "text-fg";
  return (
    <div className="min-w-0">
      <div className="text-[11px] tracking-wide text-subtle uppercase">{label}</div>
      <div className={cn("mt-1 font-mono text-lg tabular-nums", color)}>
        {typeof value === "number" ? formatFixed(value, 3) : value}
      </div>
      {hint ? <div className="mt-0.5 text-xs text-muted">{hint}</div> : null}
    </div>
  );
}
