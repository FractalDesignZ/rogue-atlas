/** Principal Lambert W via Halley iteration. */
export function lambertW0(x: number): number {
  if (x < 0) throw new Error("lambertW0 is defined here for x ≥ 0");
  if (x === 0) return 0;
  let w = x < 1.5 ? x : Math.log(x);
  if (x > Math.E) w = Math.log(x) - Math.log(Math.log(x));
  for (let i = 0; i < 24; i++) {
    const ew = Math.exp(w);
    const wew = w * ew;
    const num = wew - x;
    const den = ew * (w + 1) - ((w + 2) * num) / (2 * (w + 1));
    const dw = num / den;
    w -= dw;
    if (Math.abs(dw) < 1e-15 * Math.max(1, Math.abs(w))) break;
  }
  return w;
}

/** Smooth Riemann–von Mangoldt quantile used in the paper (Proposition 6). */
export function smoothWeyl(n: number): number {
  const y = Math.max(n - 11 / 8, 1e-3);
  return (2 * Math.PI * y) / lambertW0(y / Math.E);
}

export function meanGapAt(height: number): number {
  return (2 * Math.PI) / Math.log(Math.max(height / (2 * Math.PI), Math.E));
}
