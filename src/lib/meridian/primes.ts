export type PrimePower = {
  q: number;
  p: number;
  k: number;
  omega: number;
  lambda: number;
};

export function primesUpTo(limit: number): number[] {
  if (limit < 2) return [];
  const sieve = new Uint8Array(limit + 1);
  const out: number[] = [];
  for (let i = 2; i <= limit; i++) {
    if (sieve[i]) continue;
    out.push(i);
    if (i * i <= limit) {
      for (let j = i * i; j <= limit; j += i) sieve[j] = 1;
    }
  }
  return out;
}

export function primePowersUpTo(Q: number): PrimePower[] {
  const primes = primesUpTo(Q);
  const out: PrimePower[] = [];
  for (const p of primes) {
    let q = p;
    let k = 1;
    while (q <= Q) {
      out.push({
        q,
        p,
        k,
        omega: Math.log(q),
        lambda: Math.log(p),
      });
      if (q > Q / p) break;
      q *= p;
      k += 1;
    }
  }
  out.sort((a, b) => a.q - b.q);
  return out;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
