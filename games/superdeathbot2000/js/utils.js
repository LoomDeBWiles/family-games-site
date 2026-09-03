'use strict';
/* ============================================================
   Small math / random / spatial helpers. Global: U
   ============================================================ */

const U = {
  clamp(v, a, b) { return v < a ? a : (v > b ? b : v); },
  lerp(a, b, t) { return a + (b - a) * t; },
  // frame-rate independent smoothing
  damp(a, b, rate, dt) { return U.lerp(a, b, 1 - Math.exp(-rate * dt)); },
  dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); },
  dist2(ax, ay, bx, by) { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; },
  angTo(ax, ay, bx, by) { return Math.atan2(by - ay, bx - ax); },

  // shortest signed angle from a to b
  angDiff(a, b) {
    let d = (b - a) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    return d;
  },

  // All randomness routes through U.rng so city generation can be made
  // deterministic (seeded) and therefore restorable from a save file.
  rng: Math.random,

  // mulberry32 - small, fast, good enough, and identical across browsers
  seeded(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },

  withSeed(seed, fn) {
    const prev = U.rng;
    U.rng = U.seeded(seed);
    try { return fn(); } finally { U.rng = prev; }
  },

  rand(a, b) { return a + U.rng() * (b - a); },
  randInt(a, b) { return Math.floor(a + U.rng() * (b - a + 1)); },
  pick(arr) { return arr[(U.rng() * arr.length) | 0]; },
  chance(p) { return U.rng() < p; },

  // pick a key from {key: weight}
  weighted(obj) {
    let total = 0;
    for (const k in obj) total += obj[k];
    let r = U.rng() * total;
    for (const k in obj) { r -= obj[k]; if (r <= 0) return k; }
    return Object.keys(obj)[0];
  },

  // circle vs axis-aligned box (box given by center + half extents)
  circleBox(cx, cy, r, bx, by, hw, hd) {
    const nx = U.clamp(cx, bx - hw, bx + hw);
    const ny = U.clamp(cy, by - hd, by + hd);
    return U.dist2(cx, cy, nx, ny) <= r * r;
  },

  fmt(n) {
    n = Math.floor(n);
    if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M';
    if (n >= 1e4) return (n / 1e3).toFixed(n >= 1e5 ? 0 : 1) + 'k';
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  // slightly shift a hex colour's brightness. amt in [-1,1]
  shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    if (amt >= 0) {
      r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt;
    } else {
      const k = 1 + amt; r *= k; g *= k; b *= k;
    }
    return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
  },
};

/* ============================================================
   Uniform spatial grid over static world objects.
   Objects need { x, y, w, d, dead }.
   ============================================================ */
class Grid {
  constructor(minX, minY, maxX, maxY, cell) {
    this.minX = minX; this.minY = minY;
    this.cell = cell;
    this.cols = Math.max(1, Math.ceil((maxX - minX) / cell));
    this.rows = Math.max(1, Math.ceil((maxY - minY) / cell));
    this.buckets = new Array(this.cols * this.rows);
    for (let i = 0; i < this.buckets.length; i++) this.buckets[i] = [];
  }

  _cx(x) { return U.clamp(Math.floor((x - this.minX) / this.cell), 0, this.cols - 1); }
  _cy(y) { return U.clamp(Math.floor((y - this.minY) / this.cell), 0, this.rows - 1); }

  insert(o) {
    const x0 = this._cx(o.x - o.w / 2), x1 = this._cx(o.x + o.w / 2);
    const y0 = this._cy(o.y - o.d / 2), y1 = this._cy(o.y + o.d / 2);
    for (let cy = y0; cy <= y1; cy++)
      for (let cx = x0; cx <= x1; cx++)
        this.buckets[cy * this.cols + cx].push(o);
  }

  // Collect objects overlapping a world-space rect. Deduped via a stamp.
  // Dead (destroyed) objects are skipped unless includeDead is set - the
  // renderer wants them so it can draw the rubble they leave behind.
  queryRect(x0, y0, x1, y1, out, includeDead) {
    out.length = 0;
    const stamp = ++Grid._stamp;
    const cx0 = this._cx(x0), cx1 = this._cx(x1);
    const cy0 = this._cy(y0), cy1 = this._cy(y1);
    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        const b = this.buckets[cy * this.cols + cx];
        for (let i = 0; i < b.length; i++) {
          const o = b[i];
          if (o._stamp === stamp) continue;
          if (o.dead && !includeDead) continue;
          o._stamp = stamp;
          out.push(o);
        }
      }
    }
    return out;
  }

  queryCircle(x, y, r, out) {
    this.queryRect(x - r, y - r, x + r, y + r, out);
    let n = 0;
    for (let i = 0; i < out.length; i++) {
      const o = out[i];
      if (U.circleBox(x, y, r, o.x, o.y, o.w / 2, o.d / 2)) out[n++] = o;
    }
    out.length = n;
    return out;
  }
}
Grid._stamp = 0;
