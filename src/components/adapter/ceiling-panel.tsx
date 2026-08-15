import { Badge } from "@/components/ui/badge";
import type { CeilingReport } from "@/lib/adapter/ceiling";

const VARIANT = {
  pair: "default" as const,
  metric: "info" as const,
  connection: "pass" as const,
  sheaf: "pass" as const,
  blocked: "warn" as const,
};

export function CeilingPanel({ ceiling }: { ceiling: CeilingReport }) {
  return (
    <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)] sm:p-5">
      <p className="text-[11px] tracking-[0.18em] text-subtle uppercase">Metric ceiling</p>
      <h2 className="mt-2 font-display text-2xl leading-tight">What the picture is allowed to know.</h2>
      <p className="mt-2 text-xs leading-relaxed text-muted">{ceiling.note}</p>
      <ol className="mt-4 space-y-2">
        {ceiling.layers.map((layer) => (
          <li key={layer.id} className="rounded-md bg-raised px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={VARIANT[layer.status]}>{layer.status}</Badge>
              <span className="font-display text-lg leading-tight">{layer.title}</span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">{layer.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
