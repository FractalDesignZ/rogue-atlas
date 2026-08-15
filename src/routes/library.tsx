import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { ADAPTER_PRESETS } from "@/lib/adapter/presets";
import { useAdapter } from "@/lib/adapter/store";
import { DOMAIN_META, DOMAIN_ORDER } from "@/lib/meridian/domains";
import { useStudio } from "@/lib/meridian/store";
import type { AdapterSource } from "@/lib/adapter/types";

export const Route = createFileRoute("/library")({ component: Library });

function Library() {
  const setDomain = useStudio((s) => s.setDomain);
  const setSource = useAdapter((s) => s.setSource);
  const loadPreset = useAdapter((s) => s.loadPreset);
  return (
    <div className="min-h-dvh overflow-x-hidden bg-bg text-fg">
      <SiteHeader solid />
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-[11px] tracking-[0.22em] text-subtle uppercase">Library</p>
        <h1 className="mt-3 max-w-2xl font-display text-4xl sm:text-5xl">
          Walks ready to read, series ready to freeze.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
          Start with a thought or a pasted walk. The same arithmetic kernel sits underneath
          every studio series — use it when you want a frozen cell, not a reading.
        </p>

        <h2 className="mt-12 font-display text-2xl">Readings</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {ADAPTER_PRESETS.map((p) => (
            <article
              key={p.id}
              className="flex flex-col justify-between rounded-xl bg-surface p-5 shadow-[var(--shadow-panel)]"
            >
              <div>
                <p className="text-[11px] tracking-wide text-subtle uppercase">{p.kicker}</p>
                <h3 className="mt-2 font-display text-2xl">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.note}</p>
              </div>
              <div className="mt-5">
                <Button asChild>
                  <Link to="/adapter" onClick={() => loadPreset(p.id)}>
                    Open this walk
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </div>

        <h2 className="mt-14 font-display text-2xl">Studio series</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {DOMAIN_ORDER.map((id) => {
            const d = DOMAIN_META[id];
            return (
              <article
                key={id}
                className="flex flex-col justify-between rounded-xl bg-surface p-5 shadow-[var(--shadow-panel)]"
              >
                <div>
                  <p className="text-[11px] tracking-wide text-subtle uppercase">{d.short}</p>
                  <h3 className="mt-2 font-display text-2xl">{d.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{d.blurb}</p>
                  <p className="mt-3 text-xs text-subtle">{d.frequencyNote}</p>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button asChild variant="secondary">
                    <Link to="/studio" onClick={() => setDomain(id)}>
                      Analyze in studio
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link
                      to="/adapter"
                      onClick={() => setSource(id === "custom" ? "custom" : (id as AdapterSource))}
                    >
                      {id === "custom" ? "Paste into adapter" : "Read as ranges"}
                    </Link>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
