import { Badge } from "@/components/ui/badge";
import {
  COORDINATE_NOTE,
  representationsFor,
  SOURCE_COORDINATE,
  type Imposition,
} from "@/lib/atlas/constitution";
import type { AdapterSource } from "@/lib/adapter/types";

const TONE: Record<Imposition, "info" | "default" | "warn"> = {
  imposed: "info",
  estimated: "default",
  learned: "warn",
};

export function RepresentationLab({
  source,
  role,
  note,
}: {
  source: AdapterSource;
  role?: import("@/lib/atlas/constitution").CoordinateRole;
  note?: string;
}) {
  const resolved = role ?? SOURCE_COORDINATE[source];
  const reps = representationsFor(source);
  return (
    <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)] sm:p-5">
      <p className="text-[11px] tracking-[0.18em] text-subtle uppercase">Representation lab</p>
      <h2 className="mt-2 font-display text-2xl leading-tight">What we put in.</h2>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        Coordinate role: <span className="text-fg">{resolved}</span>. {note ?? COORDINATE_NOTE[resolved]}
      </p>
      <ol className="mt-4 space-y-2">
        {reps.map((r) => (
          <li key={r.name} className="rounded-md bg-raised px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={TONE[r.imposition]}>{r.imposition}</Badge>
              <span className="text-sm text-fg">{r.name}</span>
              <span className="text-[11px] text-subtle">{r.role}</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted">{r.note}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
