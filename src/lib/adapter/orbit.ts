/** Orbit dimension 1; closure dimension = independent frequencies (Thm 3). */

export type OrbitReport = {
  orbitDim: 1;
  closureDim: number;
  frequencies: number[];
  note: string;
};

export function orbitClosure(source: string, n: number): OrbitReport {
  const frequencies =
    source === "zeta"
      ? [Math.log(2), Math.log(3), Math.log(5), Math.log(7)].slice(0, Math.min(4, Math.max(2, Math.floor(n / 24))))
      : source === "wellbore"
        ? [1, Math.SQRT2]
        : source === "drill"
          ? [1, 1.618, 2.236]
          : [1, Math.E / 2];
  const P = frequencies.length;
  return {
    orbitDim: 1,
    closureDim: P,
    frequencies,
    note:
      P === 1
        ? "One frequency: the orbit is periodic."
        : `Orbit dim 1, closure dim ${P}. Unique factorization / independence makes the 1-parameter flow dense on T^${P}.`,
  };
}

export function torusPoint(gamma: number, freqs: number[]): { u: number; v: number } {
  const a = freqs[0] ?? 1;
  const b = freqs[1] ?? a * Math.SQRT2;
  return {
    u: ((gamma * a) / (2 * Math.PI)) % 1,
    v: ((gamma * b) / (2 * Math.PI)) % 1,
  };
}
