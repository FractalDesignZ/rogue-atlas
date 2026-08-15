import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Copy,
  Download,
  ImageDown,
  Link2,
  Pause,
  Pin,
  PinOff,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Wind,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { AccountChip } from "@/components/account-chip";
import { BettiChart } from "@/components/adapter/betti-chart";
import { CeilingPanel } from "@/components/adapter/ceiling-panel";
import { ClaimLedger } from "@/components/adapter/claim-ledger";
import { DrillConsole } from "@/components/adapter/drill-console";
import { ForecastStrip } from "@/components/adapter/forecast-strip";
import { SeedInspector } from "@/components/adapter/inspector";
import { NullPanel } from "@/components/adapter/null-panel";
import { OutcomeTape } from "@/components/adapter/outcome-tape";
import { PipelineStrip } from "@/components/adapter/pipeline-strip";
import { VvPanel } from "@/components/adapter/vv-panel";
import { SeedField } from "@/components/adapter/seed-field";
import { TorusView } from "@/components/adapter/torus-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { downloadReadingCard } from "@/lib/adapter/card";
import { computeFork } from "@/lib/adapter/fork";
import { forecastAhead } from "@/lib/adapter/forecast";
import { ADAPTER_PRESETS, COMPASS_SCENES, SOURCE_META, WEIGHT_META } from "@/lib/adapter/presets";
import { readingParagraphs, writeReading } from "@/lib/adapter/reading";
import { matchingPreset, readShare, writeShare } from "@/lib/adapter/share";
import { STAGE_IDS, stageById } from "@/lib/adapter/pipeline";
import { useAdapter } from "@/lib/adapter/store";
import { canSpeak, speakText, stopSpeaking } from "@/lib/adapter/voice";
import type {
  AbstractionLevel,
  GraphKind,
  ModalityLens,
  OutcomeKind,
  TimeKind,
} from "@/lib/adapter/types";
import { cn, formatFixed } from "@/lib/utils";

const LEVELS: { id: AbstractionLevel; label: string }[] = [
  { id: "low", label: "Events" },
  { id: "mid", label: "Sets" },
  { id: "high", label: "Architecture" },
];
const LENSES: { id: ModalityLens; label: string }[] = [
  { id: "all", label: "All" },
  { id: "necessary", label: "□" },
  { id: "possible", label: "◊" },
  { id: "unentailed", label: "Jump" },
];
const TIMES: { id: TimeKind; label: string }[] = [
  { id: "parameter", label: "Parameter" },
  { id: "physical", label: "Physical" },
  { id: "filtration", label: "Filtration" },
  { id: "simulation", label: "Simulation" },
];
const GRAPHS: { id: GraphKind; label: string }[] = [
  { id: "local", label: "Local" },
  { id: "recurrence", label: "Recurrence" },
];
const KIND_BADGE: Record<OutcomeKind, "pass" | "info" | "warn"> = {
  known: "pass",
  perceived: "info",
  speculative: "warn",
};
const KIND_LABEL: Record<OutcomeKind, string> = {
  known: "known",
  perceived: "perceived",
  speculative: "speculative",
};
const TIME_NOTE: Record<TimeKind, string> = {
  parameter: "The walk coordinate is a parameter. It is not physical time.",
  physical: "This axis is claimed as physical time. Only a timestamped series earns that.",
  filtration: "This axis is scale. Persistence grows here — it does not tick.",
  simulation: "This axis is a solver step. It is not a dimension of nature.",
};

function gpuClass(): string {
  if (typeof navigator === "undefined") return "CPU";
  const gl =
    document.createElement("canvas").getContext("webgl2") ||
    document.createElement("canvas").getContext("webgl");
  if (!gl) return "CPU";
  const ext = (gl as WebGLRenderingContext).getExtension("WEBGL_debug_renderer_info");
  const raw = ext
    ? (gl as WebGLRenderingContext).getParameter(ext.UNMASKED_RENDERER_WEBGL)
    : "WebGL";
  return typeof raw === "string" && raw.length ? raw.replace(/ANGLE \(|\)/g, "").slice(0, 42) : "WebGL";
}

export function AdapterApp() {
  const source = useAdapter((s) => s.source);
  const prompt = useAdapter((s) => s.prompt);
  const weights = useAdapter((s) => s.weights);
  const nowRatio = useAdapter((s) => s.nowRatio);
  const released = useAdapter((s) => s.released);
  const selected = useAdapter((s) => s.selected);
  const focus = useAdapter((s) => s.focus);
  const level = useAdapter((s) => s.level);
  const lens = useAdapter((s) => s.lens);
  const timeKind = useAdapter((s) => s.timeKind);
  const graphKind = useAdapter((s) => s.graphKind);
  const walking = useAdapter((s) => s.walking);
  const sequenceId = useAdapter((s) => s.sequenceId);
  const playQueue = useAdapter((s) => s.playQueue);
  const report = useAdapter((s) => s.report);
  const pinned = useAdapter((s) => s.pinned);
  const compare = useAdapter((s) => s.compare);
  const delta = useAdapter((s) => s.delta);
  const atlas = useAdapter((s) => s.atlas);
  const journal = useAdapter((s) => s.journal);
  const hydrate = useAdapter((s) => s.hydrate);
  const setSource = useAdapter((s) => s.setSource);
  const setPrompt = useAdapter((s) => s.setPrompt);
  const setWeight = useAdapter((s) => s.setWeight);
  const setNowRatio = useAdapter((s) => s.setNowRatio);
  const setNowIndex = useAdapter((s) => s.setNowIndex);
  const stepNow = useAdapter((s) => s.stepNow);
  const setLevel = useAdapter((s) => s.setLevel);
  const setLens = useAdapter((s) => s.setLens);
  const setTimeKind = useAdapter((s) => s.setTimeKind);
  const setGraphKind = useAdapter((s) => s.setGraphKind);
  const setWalking = useAdapter((s) => s.setWalking);
  const playSequence = useAdapter((s) => s.playSequence);
  const applyScene = useAdapter((s) => s.applyScene);
  const loadPreset = useAdapter((s) => s.loadPreset);
  const ingestText = useAdapter((s) => s.ingestText);
  const recompute = useAdapter((s) => s.recompute);
  const release = useAdapter((s) => s.release);
  const resetRelease = useAdapter((s) => s.resetRelease);
  const selectOutcome = useAdapter((s) => s.selectOutcome);
  const pin = useAdapter((s) => s.pin);
  const unpin = useAdapter((s) => s.unpin);
  const saveToAtlas = useAdapter((s) => s.saveToAtlas);
  const restoreAtlas = useAdapter((s) => s.restoreAtlas);
  const removeAtlas = useAdapter((s) => s.removeAtlas);
  const markJournal = useAdapter((s) => s.markJournal);
  const replayJournal = useAdapter((s) => s.replayJournal);
  const noticeFocus = useAdapter((s) => s.noticeFocus);

  const fileRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [linked, setLinked] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [whisper, setWhisper] = useState(false);
  const [listening, setListening] = useState(false);
  const [beat, setBeat] = useState(3);
  const [gpu, setGpu] = useState("WebGL");
  const [stageId, setStageId] = useState("neighborhood");
  const stageIdRef = useRef("neighborhood");
  stageIdRef.current = stageId;

  const active = useMemo(
    () => report.outcomes.find((o) => o.id === selected) ?? report.outcomes[0],
    [report.outcomes, selected],
  );
  const paragraphs = useMemo(() => readingParagraphs(report, compare), [report, compare]);
  const fork = useMemo(() => computeFork(report), [report]);
  const ahead = useMemo(() => forecastAhead(report, 5), [report]);
  const ghost =
    pinned && pinned.prompt === report.prompt && pinned.source === report.source ? pinned : null;
  const horizonKind =
    report.horizon.nextKind === "open" ? "info" : KIND_BADGE[report.horizon.nextKind];
  const sequence = report.sequences.find((s) => s.id === sequenceId)?.chain ?? null;
  const stage = useMemo(() => stageById(report, stageId), [report, stageId]);

  function applyStage(id: string) {
    setStageId(id);
    stageIdRef.current = id;
    const next = stageById(report, id);
    if (!next) return;
    if (next.graph) setGraphKind(next.graph);
    if (next.level) setLevel(next.level);
    window.requestAnimationFrame(() => {
      document.getElementById(`stage-${next.target}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }

  function cycleStage(dir: number) {
    const i = STAGE_IDS.indexOf(stageIdRef.current as (typeof STAGE_IDS)[number]);
    const idx = i < 0 ? 0 : i;
    applyStage(STAGE_IDS[(idx + dir + STAGE_IDS.length) % STAGE_IDS.length]!);
  }

  useEffect(() => {
    hydrate();
    setGpu(gpuClass());
    return () => stopSpeaking();
  }, [hydrate]);

  useEffect(() => {
    function apply() {
      const share = readShare();
      if (share.preset) loadPreset(share.preset);
      else if (share.source) setSource(share.source);
      if (share.now !== undefined) {
        window.setTimeout(() => useAdapter.getState().setNowRatio(share.now!), 0);
      }
    }
    apply();
    window.addEventListener("popstate", apply);
    return () => window.removeEventListener("popstate", apply);
  }, [loadPreset, setSource]);

  useEffect(() => {
    try {
      const seen = localStorage.getItem("meridian-seen-v1");
      const tour = Number(localStorage.getItem("meridian-tour-v1") ?? "0");
      if (!seen) {
        setWhisper(true);
        localStorage.setItem("meridian-seen-v1", "1");
      }
      if (Number.isFinite(tour) && tour < 3) setBeat(tour);
    } catch {
      /* ignore */
    }
  }, []);

  function advanceBeat(n: number) {
    setBeat((cur) => {
      const next = Math.max(cur, n);
      try {
        localStorage.setItem("meridian-tour-v1", String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  useEffect(() => {
    if (!playQueue?.length) return;
    const id = window.setInterval(() => {
      const s = useAdapter.getState();
      const next = s.popPlayQueue();
      if (next === null) return;
      s.setNowIndex(next);
    }, 480);
    return () => window.clearInterval(id);
  }, [playQueue]);

  useEffect(() => {
    if (!walking) return;
    const id = window.setInterval(() => {
      const s = useAdapter.getState();
      if (s.nowRatio >= 0.995) {
        s.setWalking(false);
        return;
      }
      s.stepNow(1);
    }, 420);
    return () => window.clearInterval(id);
  }, [walking]);

  useEffect(() => {
    function onKey(ev: KeyboardEvent) {
      const tag = (ev.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (ev.key === " " || ev.key === "ArrowRight") {
        ev.preventDefault();
        if (ev.key === " ") {
          const s = useAdapter.getState();
          if (s.walking) s.setWalking(false);
          else {
            if (s.nowRatio >= 0.98) s.setNowRatio(0);
            s.setWalking(true);
            advanceBeat(1);
          }
        } else stepNow(1);
      } else if (ev.key === "ArrowLeft") {
        ev.preventDefault();
        stepNow(-1);
      } else if (ev.key === "1") setLevel("low");
      else if (ev.key === "2") setLevel("mid");
      else if (ev.key === "3") setLevel("high");
      else if (ev.key === "l" || ev.key === "L") setGraphKind("local");
      else if (ev.key === "r" || ev.key === "R") setGraphKind("recurrence");
      else if (ev.key === "n" || ev.key === "N") {
        noticeFocus();
        advanceBeat(2);
      } else if (ev.key === "h" || ev.key === "H") markJournal();
      else if (ev.key === "[") {
        ev.preventDefault();
        cycleStage(-1);
      } else if (ev.key === "]") {
        ev.preventDefault();
        cycleStage(1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stepNow, setLevel, setGraphKind, noticeFocus, markJournal, report]);

  function exportReading() {
    const blob = new Blob([writeReading(report, compare)], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${report.title.replace(/\s+/g, "-").toLowerCase()}-reading.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function copyReading() {
    void navigator.clipboard.writeText(writeReading(report, compare)).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    });
  }

  function shareLink() {
    const href = writeShare({
      preset: matchingPreset(prompt),
      source,
      now: nowRatio,
    });
    void navigator.clipboard.writeText(href).then(() => {
      setLinked(true);
      window.setTimeout(() => setLinked(false), 1400);
    });
  }

  return (
    <div className="min-h-dvh overflow-x-hidden bg-bg text-fg">
      <header className="sticky top-0 z-40 border-b border-line/80 bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <BrandMark />
            <span className="font-display text-lg">Meridian</span>
          </Link>
          <nav className="hidden items-center gap-4 text-sm text-muted sm:flex">
            <Link to="/adapter" className="text-fg">
              Adapter
            </Link>
            <Link to="/studio">Studio</Link>
            <Link to="/library">Library</Link>
            <Link to="/method">Method</Link>
          </nav>
          <AccountChip />
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.18fr)]">
        <div className="space-y-4">
          <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)] sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] tracking-[0.18em] text-subtle uppercase">Source</p>
              <span className="font-mono text-[10px] text-subtle">{gpu}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {SOURCE_META.map((s) => (
                <Button
                  key={s.id}
                  type="button"
                  size="sm"
                  variant={source === s.id ? "default" : "ghost"}
                  onClick={() => setSource(s.id)}
                >
                  {s.label}
                </Button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {ADAPTER_PRESETS.map((p) => (
                <Button key={p.id} type="button" size="sm" variant="outline" onClick={() => loadPreset(p.id)}>
                  {p.title}
                </Button>
              ))}
            </div>
            <Label className="mt-4 block text-[11px] tracking-wide text-subtle uppercase">Field</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onBlur={() => recompute()}
              rows={5}
              className="mt-2"
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) void file.text().then(ingestText);
              }}
              aria-label="Series or thought"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".txt,.csv,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void file.text().then(ingestText);
                }}
              />
              <Button type="button" size="sm" variant="ghost" onClick={() => fileRef.current?.click()}>
                Drop a series
              </Button>
              <span className={cn("text-xs text-subtle", dragging && "text-accent")}>
                Numbers become a walk. Six or more samples make a field.
              </span>
            </div>
            {report.provenance ? (
              <p className="mt-3 font-mono text-[10px] text-subtle">
                {report.provenance.hash} · {report.provenance.gates.join(" · ") || "no gates"}
              </p>
            ) : null}
          </section>

          <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)] sm:p-5">
            <p className="text-[11px] tracking-[0.18em] text-subtle uppercase">Observer</p>
            <div className="mt-4 space-y-4">
              {WEIGHT_META.map((w) => (
                <div key={w.key}>
                  <div className="flex items-center justify-between gap-2">
                    <Label>{w.label}</Label>
                    <span className="font-mono text-[11px] tabular-nums text-subtle">
                      {formatFixed(weights[w.key], 2)}
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={[weights[w.key]]}
                    onValueChange={(v) => setWeight(w.key, v[0] ?? 0)}
                    aria-label={w.label}
                  />
                  <p className="mt-1 text-[11px] text-subtle">{w.hint}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {COMPASS_SCENES.map((s) => (
                <Button
                  key={s.id}
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    applyScene(s.id);
                    advanceBeat(3);
                  }}
                >
                  {s.label}
                </Button>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section
            id="stage-field"
            className={cn(
              "overflow-hidden rounded-xl bg-surface p-3 shadow-[var(--shadow-panel)] sm:p-4",
              stage?.target === "field" && "ring-1 ring-accent/50",
            )}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] tracking-[0.18em] text-subtle uppercase">{report.title}</p>
                <h1 className="font-display text-3xl leading-tight">{report.title}</h1>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant={report.continuity > 0.62 ? "pass" : "warn"}>
                  Continuity {formatFixed(report.continuity, 2)}
                </Badge>
                <Badge variant={report.planContinuous ? "pass" : "warn"}>
                  {report.planContinuous ? "Continuous plan" : "Plan jumps"}
                </Badge>
                {report.planeTangent ? (
                  <Badge variant={report.planeTangent.local > 0.85 ? "pass" : "warn"}>
                    Tangent {formatFixed(report.planeTangent.local, 2)}
                  </Badge>
                ) : null}
                {report.vv ? (
                  <Badge variant={report.vv.criticalFailed ? "warn" : "pass"}>
                    V&V {report.vv.passed}/{report.vv.checks.length}
                  </Badge>
                ) : null}
              </div>
            </div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {LEVELS.map((l) => (
                <Button
                  key={l.id}
                  type="button"
                  size="sm"
                  variant={level === l.id ? "default" : "ghost"}
                  onClick={() => setLevel(l.id)}
                >
                  {l.label}
                </Button>
              ))}
              {LENSES.map((l) => (
                <Button
                  key={l.id}
                  type="button"
                  size="sm"
                  variant={lens === l.id ? "secondary" : "ghost"}
                  onClick={() => setLens(l.id)}
                >
                  {l.label}
                </Button>
              ))}
            </div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {TIMES.map((t) => (
                <Button
                  key={t.id}
                  type="button"
                  size="sm"
                  variant={timeKind === t.id ? "outline" : "ghost"}
                  onClick={() => setTimeKind(t.id)}
                >
                  {t.label}
                </Button>
              ))}
              {GRAPHS.map((g) => (
                <Button
                  key={g.id}
                  type="button"
                  size="sm"
                  variant={graphKind === g.id ? "outline" : "ghost"}
                  onClick={() => setGraphKind(g.id)}
                >
                  {g.label}
                </Button>
              ))}
            </div>
            <div className="h-72 overflow-hidden rounded-lg bg-inset sm:h-80">
              <SeedField
                report={report}
                released={released}
                selected={selected}
                level={level}
                ghost={ghost}
                focus={focus}
                lens={lens}
                graphKind={graphKind}
                sequence={sequence}
                onSelect={selectOutcome}
                onNow={setNowIndex}
                className="h-full w-full"
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="min-w-40 flex-1">
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={[nowRatio]}
                  onValueChange={(v) => {
                    setWalking(false);
                    setNowRatio(v[0] ?? 0);
                  }}
                  aria-label="Now"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (walking) setWalking(false);
                  else {
                    if (nowRatio >= 0.98) setNowRatio(0);
                    setWalking(true);
                    advanceBeat(1);
                  }
                }}
              >
                {walking ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                {walking ? "Pause" : "Walk"}
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => resetRelease()}>
                <RotateCcw className="size-3.5" />
                Gather
              </Button>
              <Button type="button" size="sm" onClick={() => release()}>
                <Wind className="size-3.5" />
                Release
              </Button>
            </div>
            <OutcomeTape report={report} onNow={setNowIndex} />
            <p className="mt-2 max-w-xl text-xs leading-relaxed text-muted">
              {beat < 3
                ? [
                    "Space walks the field. Start there.",
                    "Good. Click a seed, or press N to notice it.",
                    "Now ask what if — Keep the room, or Let it surprise.",
                  ][beat]
                : whisper
                  ? "L is local. R is recurrence. [ ] walks the pipeline."
                  : `${TIME_NOTE[timeKind]} ${report.nowCaption}`}
            </p>
            {report.graphs ? (
              <p className="mt-1 text-[11px] leading-relaxed text-subtle">
                {graphKind === "recurrence" ? "Recurrence edges" : "Local edges"} ·{" "}
                {report.graphs.note}
              </p>
            ) : null}
          </section>

          <SeedInspector report={report} focus={focus ?? report.now} />

          {source === "drill" ? <DrillConsole nowRatio={nowRatio} refuse={fork.refuse} /> : null}

          <PipelineStrip report={report} active={stageId} onSelect={applyStage} />

          {report.vv ? <VvPanel vv={report.vv} onStage={applyStage} /> : null}

          {report.pathCost ? (
            <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)] sm:p-5">
              <p className="text-[11px] tracking-[0.18em] text-subtle uppercase">Walk vs chord</p>
              <h2 className="mt-2 font-display text-2xl leading-tight">
                Extra {formatFixed(report.pathCost.extra, 2)}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{report.pathCost.note}</p>
              <p className="mt-2 font-mono text-[11px] text-subtle">
                geodesic {formatFixed(report.pathCost.geodesic, 2)} · chord{" "}
                {formatFixed(report.pathCost.chord, 2)}
              </p>
            </section>
          ) : null}

          <div
            id="stage-torus"
            className={cn(stage?.target === "torus" && "rounded-xl ring-1 ring-accent/50")}
          >
            <TorusView report={report} />
          </div>

          {report.ceiling ? (
            <div
              id="stage-ceiling"
              className={cn(stage?.target === "ceiling" && "rounded-xl ring-1 ring-accent/50")}
            >
              <CeilingPanel ceiling={report.ceiling} />
            </div>
          ) : null}

          {report.nulls ? (
            <div
              id="stage-null"
              className={cn(stage?.target === "null" && "rounded-xl ring-1 ring-accent/50")}
            >
              <NullPanel nulls={report.nulls} />
            </div>
          ) : null}

          {delta ? (
            <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)] sm:p-5">
              <p className="text-[11px] tracking-[0.18em] text-subtle uppercase">What moved</p>
              <h2 className="mt-2 font-display text-2xl leading-tight">{delta.headline}</h2>
              <ul className="mt-3 space-y-1.5">
                {delta.lines.map((line) => (
                  <li key={line} className="text-sm leading-relaxed text-muted">
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)] sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] tracking-[0.18em] text-subtle uppercase">From here</p>
              <Badge variant={horizonKind}>
                {report.horizon.nextKind === "open" ? "open" : KIND_LABEL[report.horizon.nextKind]}
              </Badge>
            </div>
            <h2 className="mt-2 font-display text-3xl leading-tight">{report.horizon.nextTitle}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{report.horizon.reading}</p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div>
                <p className="text-[11px] text-subtle uppercase">Known left</p>
                <p className="mt-1 font-mono text-sm tabular-nums">{report.horizon.remainingKnown}</p>
              </div>
              <div>
                <p className="text-[11px] text-subtle uppercase">Speculative</p>
                <p className="mt-1 font-mono text-sm tabular-nums">{report.horizon.remainingSpeculative}</p>
              </div>
              <div>
                <p className="text-[11px] text-subtle uppercase">Until jump</p>
                <p className="mt-1 font-mono text-sm tabular-nums">
                  {report.horizon.untilJump ?? "—"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)] sm:p-5">
            <p className="text-[11px] tracking-[0.18em] text-subtle uppercase">Stay or jump</p>
            <h2 className="mt-2 font-display text-2xl leading-tight">
              {fork.refuse ? "Refuse." : fork.advice === "walk" ? "Walk." : "Hold."}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{fork.reading}</p>
            {fork.stayV !== null ? (
              <p className="mt-2 font-mono text-xs text-subtle">Stay V {fork.stayV.toFixed(2)}</p>
            ) : null}
          </section>

          <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)] sm:p-5">
            <p className="text-[11px] tracking-[0.18em] text-subtle uppercase">Next five</p>
            <div className="mt-3">
              <ForecastStrip steps={ahead} onNow={setNowIndex} />
            </div>
          </section>

          {report.sequences.length ? (
            <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)] sm:p-5">
              <p className="text-[11px] tracking-[0.18em] text-subtle uppercase">Sequences</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {report.sequences.map((s) => (
                  <Button
                    key={s.id}
                    type="button"
                    size="sm"
                    variant={sequenceId === s.id ? "default" : "outline"}
                    onClick={() => playSequence(s.id)}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
              {report.sequences[0] ? (
                <p className="mt-3 text-xs leading-relaxed text-muted">{report.sequences[0].note}</p>
              ) : null}
            </section>
          ) : null}

          {report.ladder.length ? (
            <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)] sm:p-5">
              <p className="text-[11px] tracking-[0.18em] text-subtle uppercase">Ladder</p>
              <ol className="mt-3 space-y-3">
                {report.ladder.map((rung) => (
                  <li key={rung.level}>
                    <p className="font-display text-xl leading-tight">{rung.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{rung.body}</p>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {report.languageShifts.length ? (
            <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)] sm:p-5">
              <p className="text-[11px] tracking-[0.18em] text-subtle uppercase">Language</p>
              <ul className="mt-3 space-y-2">
                {report.languageShifts.map((s) => (
                  <li key={`${s.from}-${s.to}`}>
                    <p className="text-sm">
                      {s.from} → {s.to}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{s.note}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {report.modes?.length ? (
            <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)] sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] tracking-[0.18em] text-subtle uppercase">Abstraction modes</p>
                {report.middleOut ? (
                  <Badge variant={report.middleOut.gate3 === "accept" ? "pass" : "warn"}>
                    Gate3 {report.middleOut.gate3}
                  </Badge>
                ) : null}
              </div>
              <ol className="mt-4 grid gap-2 sm:grid-cols-2">
                {report.modes.map((m) => (
                  <li key={m.id} className="rounded-md bg-raised px-3 py-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-[11px] text-subtle">{m.id}</span>
                      <span className="text-[11px] text-subtle">{m.role}</span>
                    </div>
                    <div className="mt-1 font-display text-xl leading-tight">{m.name}</div>
                    <p className="mt-1 font-mono text-[11px] text-fg">{m.status}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{m.note}</p>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {report.claims ? (
            <div
              id="stage-claims"
              className={cn(stage?.target === "claims" && "rounded-xl ring-1 ring-accent/50")}
            >
              <ClaimLedger items={report.claims} />
            </div>
          ) : null}

          <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)] sm:p-5">
            <p className="text-[11px] tracking-[0.18em] text-subtle uppercase">Ranges</p>
            <div className="mt-3 space-y-2">
              {report.outcomes.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => selectOutcome(o.id)}
                  className={cn(
                    "block min-h-11 w-full rounded-md bg-raised px-3 py-3 text-left",
                    active?.id === o.id && "ring-1 ring-accent/50",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant={KIND_BADGE[o.kind]}>{o.kind}</Badge>
                      <span className="font-display text-lg leading-tight">{o.title}</span>
                    </div>
                    <span className="font-mono text-[11px] text-subtle tabular-nums">
                      {formatFixed(o.low, 2)}–{formatFixed(o.high, 2)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{o.reading}</p>
                </button>
              ))}
            </div>
          </section>

          <div
            id="stage-topology"
            className={cn(
              "rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)] sm:p-5",
              stage?.target === "topology" && "ring-1 ring-accent/50",
            )}
          >
            <p className="text-[11px] tracking-[0.18em] text-subtle uppercase">Topology</p>
            <h2 className="mt-2 font-display text-2xl leading-tight">
              {report.persistence.longLived} long H₀
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {stage?.target === "topology"
                ? stage.brief
                : "Metric-derived. A barcode is not a new structure."}
            </p>
            <div className="mt-3">
              <BettiChart persistence={report.persistence} />
            </div>
          </div>

          <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)] sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] tracking-[0.18em] text-subtle uppercase">Reading</p>
              <div className="flex flex-wrap gap-1">
                <Button type="button" variant="ghost" size="sm" onClick={copyReading}>
                  <Copy className="size-3.5" />
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={exportReading}>
                  <Download className="size-3.5" />
                  Pack
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void downloadReadingCard(report, compare)}
                >
                  <ImageDown className="size-3.5" />
                  Card
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={shareLink}>
                  <Link2 className="size-3.5" />
                  {linked ? "Linked" : "Link"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (listening) {
                      stopSpeaking();
                      setListening(false);
                    } else {
                      const ok = speakText(writeReading(report, compare), () => setListening(false));
                      setListening(ok);
                    }
                  }}
                >
                  {listening ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
                  {listening ? "Stop" : "Listen"}
                </Button>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {paragraphs.map((p) => (
                <p key={p} className="text-sm leading-relaxed text-muted">
                  {p}
                </p>
              ))}
            </div>
          </section>

          <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-panel)] sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] tracking-[0.18em] text-subtle uppercase">Hold / atlas</p>
              <div className="flex gap-1">
                <Button type="button" size="sm" variant="secondary" onClick={() => (pinned ? unpin() : pin())}>
                  {pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
                  {pinned ? "Unpin" : "Hold"}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => saveToAtlas()}>
                  Save
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => markJournal()}>
                  Mark
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => replayJournal()}>
                  Replay
                </Button>
              </div>
            </div>
            {compare ? (
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {compare.headline} {compare.transfers.filter((t) => t.kind === "holds").length} hold,{" "}
                {compare.transfers.filter((t) => t.kind === "warps").length} warp,{" "}
                {compare.transfers.filter((t) => t.kind === "breaks").length} break.
              </p>
            ) : (
              <p className="mt-2 text-xs text-muted">Hold a field, then change the observer.</p>
            )}
            {atlas.length ? (
              <ul className="mt-3 space-y-1.5">
                {atlas.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-2 rounded-md bg-raised px-3 py-2">
                    <button type="button" className="text-left text-sm" onClick={() => restoreAtlas(e.id)}>
                      {e.title}
                    </button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => removeAtlas(e.id)}>
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
            {journal.length ? (
              <p className="mt-2 text-[11px] text-subtle">{journal.length} marks in this walk.</p>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}
