// Deterministic seeded RNG so `pnpm db:seed` produces the same data every run.
// Uses mulberry32 — small, fast, good enough for fixture generation.

export class Rng {
  private state: number;

  constructor(seed: number = 0x4357_5247) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  intBetween(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  floatBetween(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  pick<T>(arr: readonly T[]): T {
    if (arr.length === 0) throw new Error("Cannot pick from empty array");
    return arr[this.intBetween(0, arr.length - 1)] as T;
  }

  weighted<T extends { weight: number }>(arr: readonly T[]): T {
    const total = arr.reduce((acc, x) => acc + x.weight, 0);
    let r = this.next() * total;
    for (const x of arr) {
      r -= x.weight;
      if (r <= 0) return x;
    }
    return arr[arr.length - 1] as T;
  }

  bool(pTrue: number): boolean {
    return this.next() < pTrue;
  }
}
