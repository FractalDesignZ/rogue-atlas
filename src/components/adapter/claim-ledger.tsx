import { CLAIM_LABEL, type ClaimClass, type ClaimItem } from "@/lib/adapter/claims";
import { evidenceOf, EVIDENCE_LABEL, type EvidenceStatus } from "@/lib/atlas/constitution";
import { Badge } from "@/components/ui/badge";

const VARIANT: Record<ClaimClass, "pass" | "info" | "warn" | "default"> = {
  identity: "info",
  certificate: "pass",
  empirical: "default",
  excluded: "warn",
};

const EVIDENCE_TONE: Record<EvidenceStatus, "info" | "pass" | "default" | "warn" | "fail"> = {
  exact: "info",
  certified: "pass",
  observed: "default",
  validated: "pass",
  failed: "fail",
  speculative: "warn",
};

export function ClaimLedger({ items }: { items: ClaimItem[] }) {
  return (
    <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)] sm:p-5">
      <p className="text-[11px] tracking-[0.18em] text-subtle uppercase">Evidence ledger</p>
      <h2 className="mt-2 font-display text-2xl leading-tight">What this is allowed to mean.</h2>
      <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted">
        Exact follows the representation. Certified is a finite check. Observed is the
        loaded data. Validated survived a holdout. Failed is a test that did not pass.
        Speculative is a jump we refuse to sell.
      </p>
      <ol className="mt-4 space-y-3">
        {items.map((c) => {
          const ev = evidenceOf(c.klass, c.extras);
          return (
            <li key={c.id} className="rounded-md bg-raised px-3 py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={EVIDENCE_TONE[ev]}>{EVIDENCE_LABEL[ev]}</Badge>
                <Badge variant={VARIANT[c.klass]}>{CLAIM_LABEL[c.klass]}</Badge>
                <span className="font-display text-lg leading-tight">{c.title}</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{c.body}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}