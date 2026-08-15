import type { AdapterReport, Horizon, OutcomeKind } from "./types";

export function computeHorizon(report: AdapterReport, now = report.now): Horizon {
  const { states, outcomes, jumps } = report;
  const n = states.length;
  if (!n) {
    return {
      nextKind: "open",
      nextTitle: "Empty",
      reading: "Nothing to continue.",
      untilJump: null,
      stepsAhead: 0,
      remainingKnown: 0,
      remainingSpeculative: 0,
    };
  }
  const here = Math.min(Math.max(0, now), n - 1);
  const ahead = states.slice(here + 1);
  const remainingKnown = ahead.filter((s) =>
    outcomes.some((o) => o.kind === "known" && o.members.includes(s.i)),
  ).length;
  const remainingSpeculative = ahead.filter((s) =>
    outcomes.some((o) => o.kind === "speculative" && o.members.includes(s.i)),
  ).length;
  const nextJump = jumps.find((j) => j.from >= here) ?? null;
  const untilJump = nextJump ? nextJump.from - here : null;

  let nextKind: OutcomeKind | "open" = "open";
  let nextTitle = "Open ground";
  let reading = "The walk has reached the last observation. Anything further is invented.";
  let stepsAhead = 0;

  if (ahead.length) {
    const next = ahead[0]!;
    const owner = outcomes.find((o) => o.members.includes(next.i));
    stepsAhead = ahead.length;
    if (untilJump === 0 || untilJump === 1) {
      nextKind = "speculative";
      nextTitle = "A jump is next";
      reading = `The next step crosses a discontinuity. Fluent, not entailed. ${remainingSpeculative} speculative seeds remain.`;
    } else if (owner) {
      nextKind = owner.kind;
      nextTitle = owner.title;
      const guard =
        untilJump === null
          ? "No jump is queued."
          : `A jump sits ${untilJump} step${untilJump === 1 ? "" : "s"} ahead.`;
      reading =
        owner.kind === "known"
          ? `From here the next range is already an interior: ${owner.low.toFixed(2)}–${owner.high.toFixed(2)}. ${guard}`
          : owner.kind === "perceived"
            ? `From here a continuous geodesic can still reach “${owner.title}”. ${guard}`
            : `From here the next basin is a sequel. ${guard}`;
    } else {
      reading = `The next ${stepsAhead} observation${stepsAhead === 1 ? "" : "s"} sit outside a named basin. ${
        untilJump === null ? "The plan can stay continuous." : `A jump sits ${untilJump} steps ahead.`
      }`;
    }
  }

  return {
    nextKind,
    nextTitle,
    reading,
    untilJump,
    stepsAhead,
    remainingKnown,
    remainingSpeculative,
  };
}
