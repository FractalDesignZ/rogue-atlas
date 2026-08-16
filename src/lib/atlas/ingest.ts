import type { AdapterSource } from "../adapter/types";
import { SOURCE_COORDINATE, type CoordinateRole } from "./constitution";

export type IngestSniff = {
  source: AdapterSource;
  role: CoordinateRole;
  note: string;
};

export function sniffIngest(text: string): IngestSniff {
  const lower = text.slice(0, 4000).toLowerCase();
  const nums = text.match(/-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g);
  const n = nums?.length ?? 0;

  if (/wob|rpm|torque|\brop\b|stick-slip|stick slip|bit bounce/.test(lower)) {
    return { source: "drill", role: "physical-time", note: "Drilling mnemonics in the file. Clock is operational." };
  }
  if (/\btvd\b|\bmd\b|inclination|azimuth|wellbore|survey/.test(lower)) {
    return { source: "wellbore", role: "spatial", note: "Survey / TVT columns. This is a path, not a clock." };
  }
  if (/gamma|ordinate|riemann|zeta zero|prime zero/.test(lower)) {
    return { source: "zeta", role: "spectral", note: "Spectral ordinates named in the file. Not physical time." };
  }
  if (/(timestamp|utc|datetime|iso8601)/.test(lower) && n >= 6) {
    return { source: "pulse", role: "physical-time", note: "A clock column is declared." };
  }
  if (n >= 6) {
    return { source: "custom", role: "sequence", note: "Numbers without a declared clock or ordinate. Order is the walk." };
  }
  return { source: "thought", role: "sequence", note: "Prose. Continuity is topological." };
}

export function roleFor(source: AdapterSource, text: string): { role: CoordinateRole; note: string } {
  if (source === "custom" || source === "thought") {
    const sniff = sniffIngest(text);
    return { role: sniff.role, note: sniff.note };
  }
  const role = SOURCE_COORDINATE[source];
  return { role, note: `Declared by source. ${role}.` };
}
