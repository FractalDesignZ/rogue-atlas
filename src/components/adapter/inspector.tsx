import { BookmarkPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { inspectSeed } from "@/lib/adapter/inspect";
import { useAdapter } from "@/lib/adapter/store";
import type { AdapterReport } from "@/lib/adapter/types";
import { formatFixed } from "@/lib/utils";

const ROLE_BADGE = {
  prime: "pass" as const,
  gateway: "info" as const,
  dependent: "warn" as const,
  ordinary: "default" as const,
};

export function SeedInspector({
  report,
  focus,
}: {
  report: AdapterReport;
  focus: number | null;
}) {
  const noticeFocus = useAdapter((s) => s.noticeFocus);
  const noticed = useAdapter((s) => s.noticed);
  const seed = focus === null ? null : inspectSeed(report, focus);
  if (!seed) {
    return (
      <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)]">
        <h2 className="font-display text-xl">Seed</h2>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          Click a seed, or step with the arrow keys. This is one condition:state — gap, role,
          and whether it sits on the geodesic.
        </p>
      </section>
    );
  }
  const noticedId = `${report.source}:${report.prompt.slice(0, 40)}:${seed.i}`;
  const already = noticed.some((n) => n.id === noticedId);
  return (
    <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={ROLE_BADGE[seed.role]}>{seed.role}</Badge>
          {seed.onGeodesic ? <Badge>on path</Badge> : null}
          {seed.isJump ? <Badge variant="warn">jump</Badge> : null}
          {seed.outcome ? <Badge variant="info">{seed.outcome.kind}</Badge> : null}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => noticeFocus()}>
          <BookmarkPlus className="size-3.5" />
          {already ? "Noticed" : "Notice"}
        </Button>
      </div>
      <h2 className="mt-3 font-display text-2xl leading-tight">
        {seed.clause ?? seed.label}
      </h2>
      <p className="mt-2 text-xs leading-relaxed text-muted">{seed.roleNote}</p>
      {seed.openProperty ? (
        <p className="mt-2 text-xs text-subtle">Open set: {seed.openProperty}</p>
      ) : null}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat k="Gap" v={formatFixed(seed.gap, 3)} />
        <Stat k="Value" v={formatFixed(seed.value, 3)} />
        <Stat k="Surprise" v={formatFixed(seed.surprise, 3)} />
        <Stat k="Type I / II" v={`${formatFixed(seed.typeI, 2)} / ${formatFixed(seed.typeII, 2)}`} />
      </div>
    </section>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[11px] tracking-wide text-subtle uppercase">{k}</div>
      <div className="mt-1 font-mono text-sm tabular-nums">{v}</div>
    </div>
  );
}
