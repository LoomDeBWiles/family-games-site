'use strict';
/* ============================================================
   Procedural city: buildings, props, roads, pedestrians,
   and the destruction bookkeeping. Global: City
   ============================================================ */

let STRUCT_ID = 0;

function makeStruct(kind, def, x, y, tier) {
  const s = def.sizeMul || 1;
  const w = U.rand(def.w[0], def.w[1]) * s;
  const d = U.rand(def.d[0], def.d[1]) * s;
  const h = U.rand(def.h[0], def.h[1]) * s;
  const maxHp = Math.max(6, def.hp * (def.hpMul || 1));
  return {
    id: ++STRUCT_ID,
    kind: kind,
    isProp: !!def.isProp,
    x: x, y: y, w: w, d: d, h: h,
    hp: maxHp, maxHp: maxHp,
    mass: w * d * h,
    wall: def.wall, roof: def.roof, win: def.win || null,
    seed: U.rng() * 1000,
    dead: false,
    hitT: 0,        // white flash timer
    lean: 0,        // topple animation on death
    fall: 0,
    burn: 0,        // seconds of fire left
    burnTick: 0,
    pushX: undefined,   // direction of the last hit, for directional collapse
    pushY: undefined,
    _stamp: -1,
  };
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

class City {
  // seed is optional; passing the same seed regenerates an identical city,
  // which is what lets a save restore the exact streets you were wrecking.
  constructor(tierIndex, seed) {
    this.tierIndex = tierIndex;
    this.tierNum = tierIndex + 1;
    this.seed = (seed === undefined || seed === null)
      ? (Math.random() * 0xFFFFFFFF) >>> 0
      : (seed >>> 0);
    this.def = City.tierDef(tierIndex);
    this.name = this.def.name;

    const n = this.def.blocks;
    const road = CFG.CITY.road;
    const block = CFG.CITY.block * this.def.sizeMul;
    this.road = road;
    this.block = block;
    this.n = n;
    this.span = n * block + (n + 1) * road;

    const m = CFG.CITY.margin;
    this.minX = -this.span / 2 - m;
    this.minY = -this.span / 2 - m;
    this.maxX = this.span / 2 + m;
    this.maxY = this.span / 2 + m;

    this.all = [];
    this.peds = [];
    this.lit = [];        // structures currently on fire
    this.traffic = [];    // cars actually driving around
    this.totalMass = 0;
    this.destroyedMass = 0;
    this.buildingsLeft = 0;

    this.grid = new Grid(this.minX, this.minY, this.maxX, this.maxY, CFG.CITY.gridCell);
    this._scratch = [];

    U.withSeed(this.seed, () => this.generate());
  }

  // Tiers past the hand-authored list keep scaling procedurally.
  static tierDef(i) {
    if (i < TIERS.length) return TIERS[i];
    const base = TIERS[TIERS.length - 1];
    const over = i - TIERS.length + 1;
    const d = Object.assign({}, base);
    d.name = 'SECTOR ' + (i + 1);
    d.blocks = Math.min(23, base.blocks + over * 2);
    d.hpMul = base.hpMul * Math.pow(1.42, over);
    d.sizeMul = base.sizeMul * Math.pow(1.05, over);
    d.airstrike = Math.max(6, base.airstrike - over);
    return d;
  }

  /* ---------------- generation ---------------- */

  generate() {
    const n = this.n, road = this.road, block = this.block;
    const start = -this.span / 2 + road;

    for (let by = 0; by < n; by++) {
      for (let bx = 0; bx < n; bx++) {
        const ox = start + bx * (block + road);
        const oy = start + by * (block + road);
        this.fillBlock(ox, oy, block);
      }
    }

    // road furniture
    this.scatterRoadProps();

    for (const o of this.all) {
      this.grid.insert(o);
      this.totalMass += o.mass;
      if (!o.isProp) this.buildingsLeft++;
    }

    this.spawnPeds(90);
    this.spawnTraffic(CFG.TRAFFIC.count);
  }

  fillBlock(ox, oy, block) {
    // The first archetype roll decides how finely this block is subdivided.
    const lead = U.weighted(this.def.mix);
    const leadDef = ARCH[lead];
    const avg = (leadDef.w[0] + leadDef.w[1]) / 2 * this.def.sizeMul;
    const cells = U.clamp(Math.round(block / (avg + 16)), 1, 4);
    const cell = block / cells;
    const pad = 7;

    for (let cy = 0; cy < cells; cy++) {
      for (let cx = 0; cx < cells; cx++) {
        // occasional empty lot -> park / parking
        if (cells > 1 && U.chance(0.10)) {
          if (U.chance(0.6)) this.addProp('tree', ox + (cx + 0.5) * cell, oy + (cy + 0.5) * cell, 20);
          continue;
        }
        const kind = U.chance(0.72) ? lead : U.weighted(this.def.mix);
        const def = Object.assign({}, ARCH[kind], {
          hpMul: this.def.hpMul,
          sizeMul: this.def.sizeMul,
        });
        const s = makeStruct(kind, def, 0, 0, this.tierNum);

        // shrink to fit the lot rather than overflowing into the road
        const maxW = cell - pad * 2, maxD = cell - pad * 2;
        if (s.w > maxW) { const k = maxW / s.w; s.w *= k; s.h *= U.lerp(1, k, 0.25); }
        if (s.d > maxD) { const k = maxD / s.d; s.d *= k; }
        s.mass = s.w * s.d * s.h;

        s.x = ox + (cx + 0.5) * cell + U.rand(-3, 3);
        s.y = oy + (cy + 0.5) * cell + U.rand(-3, 3);
        this.all.push(s);
      }
    }
  }

  addProp(kind, x, y, jitter, baseZ) {
    const def = Object.assign({}, PROPS[kind], { isProp: true, hpMul: 1, sizeMul: 1 });
    const p = makeStruct(kind, def, x + U.rand(-jitter, jitter), y + U.rand(-jitter, jitter), this.tierNum);
    p.baseZ = baseZ || 0;
    this.all.push(p);
    return p;
  }

  scatterRoadProps() {
    const n = this.n, road = this.road, block = this.block;
    const start = -this.span / 2 + road;
    const half = this.span / 2;

    // vertical + horizontal road centrelines
    for (let i = 0; i <= n; i++) {
      const c = start - road / 2 + i * (block + road);

      for (let t = -half + 40; t < half - 40; t += U.rand(70, 150)) {
        if (U.chance(0.55)) this.addProp('car', c + U.rand(-14, 14), t, 6);
        if (U.chance(0.45)) this.addProp('car', t, c + U.rand(-14, 14), 6);
      }
      for (let t = -half + 30; t < half - 30; t += U.rand(110, 190)) {
        if (U.chance(0.6)) this.addProp('lamp', c + road / 2 - 5, t, 4);
        if (U.chance(0.6)) this.addProp('lamp', t, c + road / 2 - 5, 4);
        if (U.chance(0.18)) this.addProp('billboard', c - road / 2 + 8, t, 6);
        if (U.chance(0.10)) this.addProp('watertank', c - road / 2 + 14, t, 8);
        if (U.chance(0.30)) this.addProp('tree', c + road / 2 - 16, t, 8);
        if (U.chance(0.30)) this.addProp('tree', t, c + road / 2 - 16, 8);
      }
    }
  }

  // centre line of every road, in world coordinates
  roadCoords() {
    if (this._roads) return this._roads;
    const r = [];
    const start = -this.span / 2 + this.road;
    for (let i = 0; i <= this.n; i++) r.push(start - this.road / 2 + i * (this.block + this.road));
    this._roads = r;
    return r;
  }

  spawnTraffic(n) {
    const roads = this.roadCoords();
    const half = this.span / 2;
    for (let i = 0; i < n; i++) {
      const vert = U.chance(0.5);
      const lane = U.pick(roads) + (U.chance(0.5) ? -13 : 13);
      const along = U.rand(-half, half);
      this.traffic.push({
        x: vert ? lane : along,
        y: vert ? along : lane,
        vert: vert,
        sgn: U.chance(0.5) ? 1 : -1,
        speed: U.rand(CFG.TRAFFIC.speed[0], CFG.TRAFFIC.speed[1]),
        panic: 0,
        color: U.pick(['#b0473c', '#37618a', '#c8b356', '#4a7a52', '#8d8d96', '#a85a2e']),
        w: U.rand(15, 19), d: U.rand(28, 36),
      });
    }
  }

  updateTraffic(dt) {
    const p = G.player;
    const half = this.span / 2 + 60;
    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const c = this.traffic[i];

      // panic and floor it when the robot is close
      const d2 = U.dist2(c.x, c.y, p.x, p.y);
      if (d2 < CFG.TRAFFIC.flee * CFG.TRAFFIC.flee) {
        c.panic = 1;
        const away = (c.vert ? (c.y - p.y) : (c.x - p.x));
        if (away !== 0) c.sgn = away > 0 ? 1 : -1;
      } else {
        c.panic = Math.max(0, c.panic - dt);
      }

      const sp = c.speed * (1 + c.panic * 1.4);
      if (c.vert) c.y += sp * c.sgn * dt; else c.x += sp * c.sgn * dt;

      // squashed flat
      if (d2 < (p.radius + 12) * (p.radius + 12)) {
        EM.carWreck(c);
        G.player.addXP(6);
        G.addScore(25);
        this.traffic.splice(i, 1);
        this.spawnTraffic(1);
        continue;
      }

      if (Math.abs(c.x) > half || Math.abs(c.y) > half) {
        this.traffic.splice(i, 1);
        this.spawnTraffic(1);
      }
    }
  }

  // explosions flip and burn cars
  blastTraffic(x, y, r) {
    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const c = this.traffic[i];
      if (U.dist2(c.x, c.y, x, y) < r * r) {
        EM.carWreck(c);
        G.addScore(25);
        this.traffic.splice(i, 1);
        this.spawnTraffic(1);
      }
    }
  }

  spawnPeds(count) {
    for (let i = 0; i < count; i++) {
      this.peds.push({
        x: U.rand(this.minX, this.maxX),
        y: U.rand(this.minY, this.maxY),
        vx: 0, vy: 0,
        p: U.rand(0, 6.28),
        panic: 0,
      });
    }
  }

  /* ---------------- queries ---------------- */

  queryCircle(x, y, r) { return this.grid.queryCircle(x, y, r, this._scratch); }

  // nearest live structure to a point; buildings weighted above props
  nearest(x, y, range, wantProps) {
    const list = this.grid.queryRect(x - range, y - range, x + range, y + range, this._scratch);
    let best = null, bestD = Infinity;
    for (let i = 0; i < list.length; i++) {
      const o = list[i];
      if (o.isProp && !wantProps) continue;
      let d = U.dist(x, y, o.x, o.y) - Math.max(o.w, o.d) * 0.4;
      if (o.isProp) d *= 1.6;              // props are a last resort
      if (d < bestD && d <= range) { bestD = d; best = o; }
    }
    return best;
  }

  /* ---------------- damage ---------------- */

  damage(o, dmg, opts) {
    if (!o || o.dead || dmg <= 0) return false;
    o.hp -= dmg;
    o.hitT = 0.12;

    // remember which way the hit came from so it topples away from the blast
    if (opts && opts.fromX !== undefined) {
      const a = U.angTo(opts.fromX, opts.fromY, o.x, o.y);
      o.pushX = Math.cos(a);
      o.pushY = Math.sin(a);
    }
    if (opts && opts.burn) this.ignite(o, opts.burn);

    if (o.hp > 0) return false;
    this.destroy(o, opts);
    return true;
  }

  // Set a structure alight. Burning does damage over time and throws smoke
  // until it collapses; fire also jumps to close neighbours.
  ignite(o, seconds) {
    if (o.dead || o.isProp) return;
    if (!o.burn) {
      if (this.lit.length >= CFG.BURN.maxLit) return;
      this.lit.push(o);
      o.burnTick = U.rand(0, CFG.BURN.tick);
    }
    o.burn = Math.max(o.burn || 0, seconds);
  }

  updateBurning(dt) {
    const B = CFG.BURN;
    for (let i = this.lit.length - 1; i >= 0; i--) {
      const o = this.lit[i];
      if (o.dead || !o.burn || o.burn <= 0) {
        o.burn = 0;
        this.lit.splice(i, 1);
        continue;
      }
      o.burn -= dt;
      o.burnTick -= dt;
      if (o.burnTick > 0) continue;
      o.burnTick = B.tick;

      this.damage(o, o.maxHp * B.dps * B.tick);
      EM.emberFrom(o);

      // fire jumps to a neighbour now and then
      if (U.chance(B.spread) && this.lit.length < B.maxLit) {
        const near = this.grid.queryCircle(o.x, o.y, B.spreadRange + Math.max(o.w, o.d) * 0.5, []);
        for (let k = 0; k < near.length; k++) {
          const n = near[k];
          if (n !== o && !n.isProp && !n.burn) { this.ignite(n, o.burn * 0.8); break; }
        }
      }
    }
  }

  destroy(o, opts) {
    if (o.dead) return;
    o.dead = true;
    o.hp = 0;
    o.fall = 0;
    o.burn = 0;

    // topple away from whatever killed it
    if (opts && opts.fromX !== undefined) {
      const a = U.angTo(opts.fromX, opts.fromY, o.x, o.y);
      o.pushX = Math.cos(a); o.pushY = Math.sin(a);
    }
    if (o.pushX === undefined) { const a = U.rand(0, 6.28); o.pushX = Math.cos(a); o.pushY = Math.sin(a); }
    o.lean = o.pushX;

    // tall buildings leave a smouldering ruin behind
    if (o.h > 70) EM.smokeColumn(o);
    this.destroyedMass += o.mass;
    if (!o.isProp) this.buildingsLeft--;

    const big = Math.min(3.0, 0.35 + o.h / 190);
    EM.rubbleBurst(o, big);
    SFX.crumble();
    if (o.h > 120) EM.shake(Math.min(16, o.h / 26));

    const xpMul = (opts && opts.xpMul) || 1;
    G.onDestroyed(o, xpMul);
  }

  /* ---------------- save / restore of the wreckage ---------------- */

  // One bit per structure, packed six to a base64 character. ~350 chars for
  // a full city, which localStorage will not even notice.
  encodeMask() {
    let s = '', acc = 0, n = 0;
    for (let i = 0; i < this.all.length; i++) {
      acc = (acc << 1) | (this.all[i].dead ? 1 : 0);
      if (++n === 6) { s += B64[acc]; acc = 0; n = 0; }
    }
    if (n) s += B64[acc << (6 - n)];
    return s;
  }

  applyMask(s) {
    if (!s) return;
    this.destroyedMass = 0;
    this.buildingsLeft = 0;
    this.lit.length = 0;
    for (let i = 0; i < this.all.length; i++) {
      const o = this.all[i];
      const ch = s[(i / 6) | 0];
      const bit = ch === undefined ? 0 : (Math.max(0, B64.indexOf(ch)) >> (5 - (i % 6))) & 1;
      o.burn = 0;
      if (bit) {
        o.dead = true; o.hp = 0; o.fall = 1;
        o.lean = 0; o.pushX = 0; o.pushY = 0;
        this.destroyedMass += o.mass;
      } else {
        o.dead = false; o.hp = o.maxHp; o.fall = 0;
        if (!o.isProp) this.buildingsLeft++;
      }
    }
  }

  get pct() {
    if (this.totalMass <= 0) return 1;
    return U.clamp(this.destroyedMass / this.totalMass, 0, 1);
  }

  get cleared() { return this.buildingsLeft <= 0 || this.pct >= 0.999; }

  /* ---------------- per-frame ---------------- */

  update(dt) {
    // collapse animation for freshly-killed structures
    for (let i = 0; i < this.all.length; i++) {
      const o = this.all[i];
      if (o.hitT > 0) o.hitT -= dt;
      if (o.dead && o.fall < 1) o.fall = Math.min(1, o.fall + dt * 3.2);
    }
    this.updateBurning(dt);
    this.updateTraffic(dt);
    this.updatePeds(dt);
  }

  updatePeds(dt) {
    const p = G.player;
    if (!p) return;
    const R = 520;
    for (let i = 0; i < this.peds.length; i++) {
      const m = this.peds[i];
      const dx = m.x - p.x, dy = m.y - p.y;
      const d2 = dx * dx + dy * dy;

      if (d2 < R * R) {
        const d = Math.sqrt(d2) || 1;
        m.panic = 1;
        const sp = 118;
        m.vx = U.damp(m.vx, (dx / d) * sp, 6, dt);
        m.vy = U.damp(m.vy, (dy / d) * sp, 6, dt);
      } else {
        m.panic = Math.max(0, m.panic - dt);
        m.p += dt * 0.7;
        m.vx = U.damp(m.vx, Math.cos(m.p) * 26, 2, dt);
        m.vy = U.damp(m.vy, Math.sin(m.p * 0.8) * 26, 2, dt);
      }

      m.x += m.vx * dt;
      m.y += m.vy * dt;

      // squish
      if (d2 < p.radius * p.radius) {
        EM.blood(m.x, m.y);
        G.addScore(5);
        this.recycle(m, p);
        continue;
      }
      // keep them near the action / inside bounds
      if (d2 > 1400 * 1400 || m.x < this.minX || m.x > this.maxX || m.y < this.minY || m.y > this.maxY) {
        this.recycle(m, p);
      }
    }
  }

  recycle(m, p) {
    const a = U.rand(0, Math.PI * 2), r = U.rand(700, 1150);
    m.x = U.clamp(p.x + Math.cos(a) * r, this.minX + 20, this.maxX - 20);
    m.y = U.clamp(p.y + Math.sin(a) * r, this.minY + 20, this.maxY - 20);
    m.vx = m.vy = 0;
    m.panic = 0;
  }
}
