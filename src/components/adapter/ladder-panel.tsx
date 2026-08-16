import { Badge } from "@/components/ui/badge";
import { LADDER, rungOf } from "@/lib/atlas/constitution";
import type { AdapterSource } from "@/lib/adapter/types";

export function LadderPanel({
  source,
  nullP,
}: {
  source: AdapterSource;
  nullP?: number;
}) {
  const rung = rungOf({ source, nullP, incrementalValue: false, holdout: false });
  return (
    <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)] sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] tracking-[0.18em] text-subtle uppercase">Complexity ladder</p>
          <h2 className="mt-2 font-display text-2xl leading-tight">
            L{rung.level} · {rung.title}
          </h2>
        </div>
        <Badge variant="info">held at L{rung.level}</Badge>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">{rung.note}</p>
      <p className="mt-2 text-xs leading-relaxed text-subtle">{rung.next}</p>
      <ol className="mt-4 flex flex-wrap gap-1.5">
        {LADDER.map((r) => (
          <li key={r.level}>
            <Badge variant={r.level === rung.level ? "pass" : r.level < rung.level ? "default" : "warn"}>
              L{r.level}
            </Badge>
          </li>
        ))}
      </ol>
    </section>
  );
}
