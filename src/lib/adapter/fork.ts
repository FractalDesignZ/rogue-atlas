import { transitionValue } from "./dec";
import type { AdapterReport, OutcomeKind } from "./types";

export type ForkAdvice = "walk" | "hold" | "refuse" | "open";

export type Fork = {
  stayTitle: string;
  stayKind: OutcomeKind | "open";
  stayV: number | null;
  jumpTitle: string | null;
  jumpKind: OutcomeKind | "open" | null;
  jumpV: number | null;
  untilJump: number | null;
  refuse: boolean;
  advice: ForkAdvice;
  reading: string;
};

function ownerKind(report: AdapterReport, i: number): OutcomeKind | "open" {
  return report.outcomes.find((o) => o.members.includes(i))?.kind ?? "open";
}

function ownerTitle(report: AdapterReport, i: number): string {
  return report.outcomes.find((o) => o.members.includes(i))?.title ?? "Open ground";
}

function edgeValue(report: AdapterReport, from: number, to: number): number | null {
  const a = report.states[from];
  const b = report.states[to];
  if (!a || !b) return null;
  return transitionValue(a, b, report.wasserstein[to] ?? 0, report.typeIField[to] ?? 0).v;
}

export function computeFork(report: AdapterReport): Fork {
  const n = report.states.length;
  const here = Math.min(Math.max(0, report.now), Math.max(n - 1, 0));
  if (here >= n - 1) {
    return {
      stayTitle: "Last observation",
      stayKind: ownerKind(report, here),
      stayV: null,
      jumpTitle: null,
      jumpKind: null,
      jumpV: null,
      untilJump: null,
      refuse: false,
      advice: "open",
      reading: "The walk has no next step. Anything further is invented.",
    };
  }

  const stayV = edgeValue(report, here, here + 1);
  const stayKind = ownerKind(report, here + 1);
  const stayTitle = ownerTitle(report, here + 1);
  const nextJump = report.jumps.find((j) => j.from >= here) ?? null;
  const untilJump = nextJump ? nextJump.from - here : null;
  const jumpTo = nextJump ? nextJump.to : null;
  const jumpV = jumpTo !== null ? edgeValue(report, here, jumpTo) : null;
  const jumpKind = jumpTo !== null ? ownerKind(report, jumpTo) : null;
  const jumpTitle = jumpTo !== null ? ownerTitle(report, jumpTo) : null;
  const refuse = stayV !== null && stayV < 0;

  let advice: ForkAdvice = "walk";
  let reading = `The next step stays inside “${stayTitle}”. V = ${stayV?.toFixed(2)}. The transition pays.`;

  if (refuse) {
    advice = "refuse";
    reading = `V = ${stayV!.toFixed(2)} on the next step. No new information pays the travel cost. Hold.`;
  } else if (untilJump === 0 || untilJump === 1) {
    advice = "hold";
    reading = `A jump is queued. Staying is possible; it is not necessary. The sequel is “${jumpTitle ?? stayTitle}”.`;
  } else if (stayKind === "speculative") {
    advice = "hold";
    reading = `The next basin is a sequel. Walk only if you accept a fluent, unentailed step.`;
  } else if (here === n - 1) {
    advice = "open";
    reading = "Nothing remains to continue.";
  }

  return {
    stayTitle,
    stayKind,
    stayV,
    jumpTitle,
    jumpKind,
    jumpV,
    untilJump,
    refuse,
    advice,
    reading,
  };
}
