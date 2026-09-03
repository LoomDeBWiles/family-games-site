'use strict';
/* ============================================================
   Everything that flies, crawls, burns or sparkles.
   Owns all transient game objects + screen shake. Global: EM
   Drawing lives in render.js; this file is state + simulation.
   ============================================================ */

const MAX_PARTICLES = 1500;
const MAX_DEBRIS    = 700;

const EM = {
  bullets: [], missiles: [], shells: [], spiders: [], hostiles: [],
  beams: [], explosions: [], rings: [], particles: [], debris: [],
  texts: [], warns: [], fissures: [], nukes: [], sucks: [],
  // realism + new abilities
  decals: [], columns: [], wells: [], flames: [], arcs: [], rails: [], saws: [],
  mortars: [], mines: [],

  shakeAmt: 0,
  flash: 0,
  hitStop: 0,

  clear() {
    for (const k of ['bullets','missiles','shells','spiders','hostiles','beams','explosions',
                     'rings','particles','debris','texts','warns','fissures','nukes','sucks',
                     'decals','columns','wells','flames','arcs','rails','saws',
                     'mortars','mines']) {
      this[k].length = 0;
    }
    this.shakeAmt = 0; this.flash = 0; this.hitStop = 0;
  },

  shake(a) {
    this.shakeAmt = Math.min(CFG.SHAKE.cap, this.shakeAmt + a * CFG.SHAKE.scale);
  },

  /* ================= spawners ================= */

  bullet(x, y, ang, speed, dmg, o) {
    o = o || {};
    this.bullets.push({
      x, y, px: x, py: y,
      vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
      dmg, life: 1.4, r: 3,
      ricochet: o.ricochet || 0,
      burn: o.burn || 0,
      color: o.color || '#ffe082',
      len: o.len || 14,
    });
  },

  hostileBullet(x, y, ang, speed, dmg, color, r) {
    this.hostiles.push({
      x, y, px: x, py: y,
      vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
      dmg, life: 4, r: r || 5, color: color || '#ff7043',
    });
  },

  missile(x, y, ang, target, dmg, splash, speed, turn, split) {
    this.missiles.push({
      x, y, ang,
      vx: Math.cos(ang) * speed * 0.4, vy: Math.sin(ang) * speed * 0.4,
      target, dmg, splash, speed, turn, split: split || 0,
      life: 5, smoke: 0,
    });
  },

  shell(x, y, ang, speed, dmg, splash, color, friendly) {
    this.shells.push({
      x, y, ang,
      vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
      dmg, splash, color: color || '#ff8a65', friendly: !!friendly,
      life: 3.2, smoke: 0,
    });
  },

  spider(x, y, dmg, bite, life, boom, speed, brood) {
    this.spiders.push({
      x, y, vx: 0, vy: 0, ang: U.rand(0, 6.28),
      dmg, bite, biteT: 0, life, boom, speed, brood: brood || 0,
      target: null, leg: U.rand(0, 6.28), hp: 1,
    });
  },

  beam(x1, y1, x2, y2, w, color) {
    this.beams.push({ x1, y1, x2, y2, w, color, t: 0, life: 0.22 });
  },

  ring(x, y, r, color, life) {
    this.rings.push({ x, y, r: r * 0.15, max: r, color, t: 0, life: life || 0.45 });
  },

  text(x, y, str, color) {
    if (this.texts.length > 60) this.texts.shift();
    this.texts.push({ x, y, str, color, t: 0, life: 0.85, vy: -34 });
  },

  fissure(x, y, r, dps) {
    this.fissures.push({ x, y, r, dps, t: 0, life: 4.5, tick: 0 });
  },

  suck(x, y, to) {
    this.sucks.push({ x, y, tx: to.x, ty: to.y, t: 0, life: 0.35 });
  },

  nukeShell(sx, sy, tx, ty, dur, radius, dmg) {
    this.nukes.push({ sx, sy, tx, ty, t: 0, dur, radius, dmg });
    SFX.warn();
  },

  // friendly warnings are the ORBITAL STRIKE: same telegraph, but the blast
  // spares the robot that called it in.
  warning(x, y, r, delay, dmg, friendly) {
    this.warns.push({ x, y, r, t: 0, dur: delay, dmg, friendly: !!friendly });
    SFX.warn();
  },

  /* ---------------- cryo ---------------- */

  frost(x, y, r, dmg, s) {
    this.ring(x, y, r, '#b3e5fc', 0.45);
    this.damageArea(x, y, r, dmg, false);
    for (let i = 0; i < 14; i++) {
      const a = U.rand(0, 6.2832), d = Math.sqrt(Math.random()) * r;
      this.spark(x + Math.cos(a) * d, y + Math.sin(a) * d, 2, '#e1f5fe');
    }
    for (const e of Enemies.list) {
      if (e.dead || U.dist(x, y, e.x, e.y) > r + e.r) continue;
      e.chill(s.time, s.slow, s.brittle);
      // ABSOLUTE ZERO: anything already hurt simply shatters
      if (s.shatter && e.hp < e.maxHp * s.shatter) {
        this.text(e.x, e.y - e.r - 8, 'SHATTER', '#b3e5fc');
        e.hurt(e.hp + 1);
      }
    }
    this.shake(4);
  },

  /* ---------------- mortars ---------------- */

  mortar(sx, sy, tx, ty, dur, radius, dmg, cluster) {
    this.mortars.push({ sx, sy, tx, ty, t: 0, dur, radius, dmg, cluster: cluster || 0 });
  },

  updMortars(dt) {
    const a = this.mortars;
    for (let i = a.length - 1; i >= 0; i--) {
      const m = a[i];
      m.t += dt;
      if (m.t < m.dur) continue;
      this.explosion(m.tx, m.ty, m.radius, m.dmg, null, { color: '#ffb74d' });
      // CARPET BOMB: the shell breaks up over the target
      for (let k = 0; k < m.cluster; k++) {
        const ang = U.rand(0, 6.2832), d = U.rand(50, 140);
        this.mortar(m.tx, m.ty, m.tx + Math.cos(ang) * d, m.ty + Math.sin(ang) * d,
                    U.rand(0.25, 0.45), m.radius * 0.62, m.dmg * 0.5, 0);
      }
      a.splice(i, 1);
    }
  },

  /* ---------------- proximity mines ---------------- */

  mine(x, y, dmg, radius, trigger, life, child) {
    // OVERDRIVE plus a held Z can carpet the map; the oldest mine goes off
    // rather than letting the field grow without limit.
    while (this.mines.length >= 120) {
      const old = this.mines.shift();
      this.explosion(old.x, old.y, old.radius, old.dmg, null, { color: '#ffd54f' });
    }
    this.mines.push({ x, y, dmg, radius, trigger, life, child: child || 0, arm: 0.4, t: 0, blink: 0 });
  },

  blowMine(m) {
    this.explosion(m.x, m.y, m.radius, m.dmg, null, { color: '#ffd54f', shockwave: true });
    for (let k = 0; k < m.child; k++) {
      const a = U.rand(0, 6.2832), d = U.rand(60, 150);
      this.mine(m.x + Math.cos(a) * d, m.y + Math.sin(a) * d,
                m.dmg * 0.45, m.radius * 0.7, m.trigger, m.life * 0.6, 0);
    }
  },

  updMines(dt) {
    const a = this.mines;
    for (let i = a.length - 1; i >= 0; i--) {
      const m = a[i];
      m.t += dt;
      m.blink += dt;
      if (m.arm > 0) { m.arm -= dt; continue; }

      let pop = m.t >= m.life;
      if (!pop) {
        for (const e of Enemies.list) {
          if (!e.dead && U.dist(m.x, m.y, e.x, e.y) < m.trigger + e.r) { pop = true; break; }
        }
      }
      if (pop) { this.blowMine(m); a.splice(i, 1); }
    }
  },

  /* ================= particles ================= */

  _part(p) {
    if (this.particles.length >= MAX_PARTICLES) this.particles.shift();
    this.particles.push(p);
  },

  dust(x, y, n, scale) {
    scale = scale || 1;
    for (let i = 0; i < n; i++) {
      const a = U.rand(0, 6.28), s = U.rand(20, 95) * scale;
      this._part({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: U.rand(0.5, 1.3), max: 1.3, size: U.rand(3, 10) * scale,
        color: '#9e9e9e', kind: 'smoke', grow: 26 * scale,
      });
    }
  },

  spark(x, y, n, color) {
    for (let i = 0; i < n; i++) {
      const a = U.rand(0, 6.28), s = U.rand(90, 300);
      this._part({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: U.rand(0.15, 0.4), max: 0.4, size: U.rand(1.5, 3.5),
        color: color || '#ffe082', kind: 'spark', grow: 0,
      });
    }
  },

  fire(x, y, n, scale) {
    scale = scale || 1;
    for (let i = 0; i < n; i++) {
      const a = U.rand(0, 6.28), s = U.rand(30, 160) * scale;
      this._part({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: U.rand(0.25, 0.7), max: 0.7, size: U.rand(5, 16) * scale,
        color: U.pick(['#ffca28', '#ff7043', '#ff5252', '#ffe082']),
        kind: 'fire', grow: 30 * scale,
      });
    }
  },

  blood(x, y) {
    for (let i = 0; i < 5; i++) {
      const a = U.rand(0, 6.28), s = U.rand(40, 130);
      this._part({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: U.rand(0.2, 0.5), max: 0.5, size: U.rand(1.5, 3.5),
        color: '#e53935', kind: 'spark', grow: 0,
      });
    }
  },

  // chunks of a destroyed structure, thrown with a fake vertical arc
  rubbleBurst(o, scale) {
    const n = Math.min(26, 5 + Math.floor(o.mass / 32000));
    // A nuke can level a hundred buildings in one frame; without this the
    // debris list grows into the thousands and the draw loop stalls.
    const over = this.debris.length + n - MAX_DEBRIS;
    if (over > 0) this.debris.splice(0, over);
    for (let i = 0; i < n; i++) {
      const a = U.rand(0, 6.28), s = U.rand(40, 150) * scale;
      this.debris.push({
        x: o.x + U.rand(-o.w / 2, o.w / 2),
        y: o.y + U.rand(-o.d / 2, o.d / 2),
        vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        z: U.rand(o.h * 0.2, o.h * 0.9), vz: U.rand(90, 260) * scale,
        size: U.rand(4, 13) * scale,
        rot: U.rand(0, 6.28), vr: U.rand(-7, 7),
        color: U.chance(0.5) ? o.wall : o.roof,
        life: U.rand(1.4, 2.6),
      });
    }
    this.dust(o.x, o.y, Math.min(18, 4 + (o.h / 22) | 0), scale);
    if (o.h > 90) this.fire(o.x, o.y, 6, scale * 0.8);
  },

  /* ================= realism effects ================= */

  // A permanent-ish scorch mark / crater on the ground.
  scorch(x, y, r) {
    if (this.decals.length >= CFG.DECAL.max) this.decals.shift();
    this.decals.push({ x, y, r, a: U.rand(0.30, 0.55), rot: U.rand(0, 6.28) });
  },

  // Smoke rising off a burning building.
  emberFrom(o) {
    const x = o.x + U.rand(-o.w / 2, o.w / 2);
    const y = o.y + U.rand(-o.d / 2, o.d / 2);
    this._part({
      x, y, vx: U.rand(-10, 10), vy: U.rand(-34, -14),
      life: U.rand(0.8, 1.8), max: 1.8, size: U.rand(5, 13),
      color: '#8a8a8a', kind: 'smoke', grow: 20,
    });
    if (U.chance(0.5)) {
      this._part({
        x, y, vx: U.rand(-18, 18), vy: U.rand(-40, -12),
        life: U.rand(0.25, 0.6), max: 0.6, size: U.rand(4, 10),
        color: U.pick(['#ffca28', '#ff7043', '#ff5252']), kind: 'fire', grow: 8,
      });
    }
  },

  // A ruin keeps smoking for a while after it falls.
  smokeColumn(o) {
    this.columns.push({
      x: o.x, y: o.y, w: Math.max(o.w, o.d),
      t: 0, life: U.rand(9, 18), tick: 0,
    });
    if (this.columns.length > 60) this.columns.shift();
  },

  // Deliberately does NOT route through explosion(): that calls blastTraffic,
  // which would wreck the next car along and recurse until the stack blows.
  carWreck(c) {
    this.explosions.push({
      x: c.x, y: c.y, r: 10, max: 46, t: 0, life: 0.3,
      color: '#ff8a65', shock: false,
    });
    this.fire(c.x, c.y, 7, 0.7);
    this.dust(c.x, c.y, 5, 0.8);
    this.damageArea(c.x, c.y, 46, 30, false);
    SFX.explode(0.4);
    this.shake(3);
    this.scorch(c.x, c.y, 26);
    if (this.debris.length > MAX_DEBRIS - 6) this.debris.splice(0, 6);
    for (let i = 0; i < 6; i++) {
      const a = U.rand(0, 6.28), s = U.rand(50, 160);
      this.debris.push({
        x: c.x, y: c.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        z: 10, vz: U.rand(110, 210), size: U.rand(3, 7),
        rot: U.rand(0, 6.28), vr: U.rand(-9, 9),
        color: c.color, life: U.rand(1.0, 1.8),
      });
    }
  },

  updColumns(dt) {
    for (let i = this.columns.length - 1; i >= 0; i--) {
      const c = this.columns[i];
      c.t += dt; c.tick -= dt;
      if (c.tick <= 0) {
        c.tick = 0.22;
        const fade = 1 - c.t / c.life;
        this._part({
          x: c.x + U.rand(-c.w, c.w) * 0.35, y: c.y + U.rand(-c.w, c.w) * 0.25,
          vx: U.rand(-8, 8), vy: U.rand(-30, -12),
          life: U.rand(1.2, 2.4), max: 2.4, size: U.rand(6, 15) * fade + 3,
          color: '#7d7d7d', kind: 'smoke', grow: 16,
        });
      }
      if (c.t >= c.life) this.columns.splice(i, 1);
    }
  },

  /* ---------------- singularity ---------------- */

  singularity(x, y, radius, pull, dps, life, implode) {
    this.wells.push({ x, y, radius, pull, dps, t: 0, life, implode, tick: 0, spin: 0 });
    this.shake(6);
  },

  updWells(dt) {
    for (let i = this.wells.length - 1; i >= 0; i--) {
      const w = this.wells[i];
      w.t += dt;
      w.spin += dt * 5;
      w.tick -= dt;

      // drag loose things inward
      const drag = (arr) => {
        for (const o of arr) {
          const d = U.dist(o.x, o.y, w.x, w.y);
          if (d > w.radius || d < 1) continue;
          const a = U.angTo(o.x, o.y, w.x, w.y);
          const f = w.pull * (1 - d / w.radius) * dt;
          o.x += Math.cos(a) * f; o.y += Math.sin(a) * f;
        }
      };
      drag(this.debris);
      drag(G.city.traffic);
      drag(G.city.peds);
      for (const e of Enemies.list) {
        if (e.dead || e.boss) continue;
        const d = U.dist(e.x, e.y, w.x, w.y);
        if (d > w.radius || d < 1) continue;
        const a = U.angTo(e.x, e.y, w.x, w.y);
        const f = w.pull * (1 - d / w.radius) * dt * 0.7;
        e.x += Math.cos(a) * f; e.y += Math.sin(a) * f;
      }

      if (w.tick <= 0) {
        w.tick = 0.2;
        this.damageArea(w.x, w.y, w.radius, w.dps * 0.2, false);
        G.city.blastTraffic(w.x, w.y, w.radius * 0.35);
        for (let k = 0; k < 3; k++) {
          const a = U.rand(0, 6.28), r = U.rand(w.radius * 0.5, w.radius);
          this._part({
            x: w.x + Math.cos(a) * r, y: w.y + Math.sin(a) * r,
            vx: -Math.cos(a) * 190, vy: -Math.sin(a) * 190,
            life: 0.5, max: 0.5, size: U.rand(3, 7),
            color: '#b388ff', kind: 'spark', grow: 0,
          });
        }
      }

      if (w.t >= w.life) {
        if (w.implode) {
          this.explosion(w.x, w.y, w.radius * 1.5, w.dps * 3, null,
                         { color: '#b388ff', life: 0.6, shockwave: true });
          this.ring(w.x, w.y, w.radius * 2, '#b388ff', 0.7);
        }
        this.scorch(w.x, w.y, w.radius * 0.5);
        this.wells.splice(i, 1);
      }
    }
  },

  /* ---------------- flame cone ---------------- */

  flame(x, y, ang, range, arc, dmg, burn) {
    this.flames.push({ x, y, ang, range, arc, t: 0, life: 0.18 });

    // damage everything inside the cone
    const list = G.city.grid.queryCircle(x, y, range, []);
    for (const o of list) {
      if (Math.abs(U.angDiff(ang, U.angTo(x, y, o.x, o.y))) > arc) continue;
      G.city.damage(o, dmg, { fromX: x, fromY: y, burn: burn });
    }
    for (const e of Enemies.list) {
      if (e.dead) continue;
      if (U.dist(x, y, e.x, e.y) > range + e.r) continue;
      if (Math.abs(U.angDiff(ang, U.angTo(x, y, e.x, e.y))) > arc) continue;
      e.hurt(dmg);
    }
    G.city.blastTraffic(x + Math.cos(ang) * range * 0.6, y + Math.sin(ang) * range * 0.6, range * 0.4);

    for (let i = 0; i < 3; i++) {
      const a = ang + U.rand(-arc, arc), r = U.rand(0, range);
      this._part({
        x: x + Math.cos(a) * r * 0.3, y: y + Math.sin(a) * r * 0.3,
        vx: Math.cos(a) * U.rand(180, 420), vy: Math.sin(a) * U.rand(180, 420),
        life: U.rand(0.25, 0.5), max: 0.5, size: U.rand(6, 14),
        color: U.pick(['#ffca28', '#ff7043', '#ffe082']), kind: 'fire', grow: 42,
      });
    }
  },

  /* ---------------- chain lightning ---------------- */

  chain(x, y, first, dmg, jumps, jumpRange, falloff) {
    let cur = first, cx = x, cy = y, d = dmg;
    const hit = [];
    for (let i = 0; i < jumps && cur; i++) {
      this.arcs.push({ x1: cx, y1: cy, x2: cur.x, y2: cur.y, t: 0, life: 0.26,
                       seed: U.rand(0, 1000) });
      if (cur.isEnemy) cur.hurt(d); else G.city.damage(cur, d, { fromX: cx, fromY: cy });
      this.spark(cur.x, cur.y, 4, '#b3e5fc');
      hit.push(cur);
      cx = cur.x; cy = cur.y;
      d *= falloff;

      // find the next unhit thing nearby
      let next = null, bestD = Infinity;
      const near = G.city.grid.queryCircle(cx, cy, jumpRange, []);
      for (const o of near) {
        if (hit.indexOf(o) >= 0) continue;
        const dd = U.dist(cx, cy, o.x, o.y);
        if (dd < bestD) { bestD = dd; next = o; }
      }
      for (const e of Enemies.list) {
        if (e.dead || hit.indexOf(e) >= 0) continue;
        const dd = U.dist(cx, cy, e.x, e.y) * 0.6;
        if (dd < bestD && dd <= jumpRange) { bestD = dd; next = e; }
      }
      cur = next;
    }
  },

  /* ---------------- railgun ---------------- */

  rail(x, y, ang, range, width, dmg, quake) {
    const ex = x + Math.cos(ang) * range, ey = y + Math.sin(ang) * range;
    this.rails.push({ x1: x, y1: y, x2: ex, y2: ey, w: width, t: 0, life: 0.5 });

    const list = G.city.grid.queryRect(
      Math.min(x, ex) - width, Math.min(y, ey) - width,
      Math.max(x, ex) + width, Math.max(y, ey) + width, []);
    for (const o of list) {
      const r = Math.max(o.w, o.d) * 0.5;
      if (segDist(o.x, o.y, x, y, ex, ey) <= width + r) {
        G.city.damage(o, dmg, { fromX: x, fromY: y });
        this.dust(o.x, o.y, 4, 1.3);
      }
    }
    for (const e of Enemies.list) {
      if (!e.dead && segDist(e.x, e.y, x, y, ex, ey) <= width + e.r) e.hurt(dmg);
    }

    // scorch a line along the ground
    const steps = Math.min(24, Math.floor(range / 90));
    for (let i = 1; i <= steps; i++) {
      const k = i / steps;
      const sx = U.lerp(x, ex, k), sy = U.lerp(y, ey, k);
      G.city.blastTraffic(sx, sy, width * 2);
      if (quake && i % 2 === 0) this.scorch(sx, sy, width * 1.8);
    }
    this.shake(14);
  },

  /* ================= damage helpers ================= */

  // Returns the thing hit, or null.
  hitScan(x, y, r, dmg, friendly) {
    if (friendly) {
      const es = Enemies.list;
      for (let i = 0; i < es.length; i++) {
        const e = es[i];
        if (!e.dead && U.dist2(x, y, e.x, e.y) < (e.r + r) * (e.r + r)) { e.hurt(dmg); return e; }
      }
    } else {
      const p = G.player;
      if (p && !p.dead && U.dist2(x, y, p.x, p.y) < (p.radius + r) * (p.radius + r)) { p.hurt(dmg); return p; }
    }
    const list = G.city.queryCircle(x, y, r);
    if (list.length) {
      const o = list[0];
      if (friendly) G.city.damage(o, dmg);
      return o;
    }
    return null;
  },

  damageArea(x, y, r, dmg, hitPlayer, xpMul) {
    if (dmg <= 0) return;
    // Fresh array, not the city's shared scratch buffer: an explosion here can
    // kill an enemy, whose death explosion re-enters this function.
    const list = G.city.grid.queryCircle(x, y, r, []);
    for (let i = 0; i < list.length; i++) {
      const o = list[i];
      const d = U.dist(x, y, o.x, o.y);
      const f = U.clamp(1 - d / (r * 1.15), 0.3, 1);
      G.city.damage(o, dmg * f, { xpMul: xpMul, fromX: x, fromY: y });
    }
    const es = Enemies.list;
    for (let i = 0; i < es.length; i++) {
      const e = es[i];
      if (e.dead) continue;
      const d = U.dist(x, y, e.x, e.y);
      if (d < r + e.r) e.hurt(dmg * U.clamp(1 - d / (r * 1.15), 0.3, 1));
    }
    if (hitPlayer) {
      const p = G.player;
      if (p && !p.dead) {
        const d = U.dist(x, y, p.x, p.y);
        if (d < r + p.radius) p.hurt(dmg * U.clamp(1 - d / (r * 1.15), 0.35, 1));
      }
    }
  },

  explosion(x, y, r, dmg, owner, o) {
    o = o || {};
    this.explosions.push({
      x, y, r: r * 0.2, max: r, t: 0, life: o.life || 0.42,
      color: o.color || '#ff8a65', shock: !!o.shockwave,
    });
    this.fire(x, y, Math.min(30, 6 + r / 14), Math.min(2.4, r / 90));
    this.dust(x, y, Math.min(22, 5 + r / 20), Math.min(2.4, r / 90));
    this.damageArea(x, y, r, dmg, !!o.hostile, o.xpMul);
    if (G.city) G.city.blastTraffic(x, y, r * 0.8);
    if (r > 55) this.scorch(x, y, r * 0.55);
    SFX.explode(r / 110);
    this.shake(Math.min(20, r / 16));
  },

  /* ================= simulation ================= */

  update(dt) {
    this.shakeAmt = Math.max(0, this.shakeAmt - dt * 46);
    this.flash = Math.max(0, this.flash - dt * 2.4);

    this.updBullets(dt);
    this.updHostiles(dt);
    this.updMissiles(dt);
    this.updShells(dt);
    this.updSpiders(dt);
    this.updNukes(dt);
    this.updWarns(dt);
    this.updMortars(dt);
    this.updMines(dt);
    this.updFissures(dt);
    this.updColumns(dt);
    this.updWells(dt);
    this.updSimple(dt);
  },

  updBullets(dt) {
    const a = this.bullets;
    for (let i = a.length - 1; i >= 0; i--) {
      const b = a[i];
      b.px = b.x; b.py = b.y;
      b.x += b.vx * dt; b.y += b.vy * dt;
      b.life -= dt;

      const hit = this.hitScan(b.x, b.y, b.r, b.dmg, true);
      if (hit) {
        this.spark(b.x, b.y, 3, b.color);
        // incendiary pellets leave the structure burning behind them
        if (b.burn && !hit.isEnemy && hit !== G.player) G.city.ignite(hit, b.burn);
        if (b.ricochet > 0) {
          const t = AbilitySys.findTarget(b.x, b.y, 300);
          if (t && t !== hit) {
            const ang = U.angTo(b.x, b.y, t.x, t.y);
            const sp = Math.hypot(b.vx, b.vy);
            b.vx = Math.cos(ang) * sp; b.vy = Math.sin(ang) * sp;
            b.ricochet--;
            b.life = Math.max(b.life, 0.6);
            continue;
          }
        }
        a.splice(i, 1); continue;
      }
      if (b.life <= 0) a.splice(i, 1);
    }
  },

  updHostiles(dt) {
    const a = this.hostiles;
    for (let i = a.length - 1; i >= 0; i--) {
      const b = a[i];
      b.px = b.x; b.py = b.y;
      b.x += b.vx * dt; b.y += b.vy * dt;
      b.life -= dt;

      const p = G.player;
      if (p && !p.dead && U.dist2(b.x, b.y, p.x, p.y) < (p.radius + b.r) * (p.radius + b.r)) {
        p.hurt(b.dmg);
        this.spark(b.x, b.y, 6, '#ff5252');
        a.splice(i, 1); continue;
      }
      // enemy fire also wrecks the city, which is fine by us
      const list = G.city.queryCircle(b.x, b.y, b.r);
      if (list.length) {
        G.city.damage(list[0], b.dmg * 0.6);
        this.spark(b.x, b.y, 3, b.color);
        a.splice(i, 1); continue;
      }
      if (b.life <= 0) a.splice(i, 1);
    }
  },

  updMissiles(dt) {
    const a = this.missiles;
    for (let i = a.length - 1; i >= 0; i--) {
      const m = a[i];
      m.life -= dt;

      if (!m.target || m.target.dead) {
        m.target = AbilitySys.findTarget(m.x, m.y, 620);
      }
      if (m.target) {
        const want = U.angTo(m.x, m.y, m.target.x, m.target.y);
        m.ang += U.angDiff(m.ang, want) * Math.min(1, m.turn * dt);
      }
      const sp = m.speed;
      m.vx = U.damp(m.vx, Math.cos(m.ang) * sp, 6, dt);
      m.vy = U.damp(m.vy, Math.sin(m.ang) * sp, 6, dt);
      m.x += m.vx * dt; m.y += m.vy * dt;

      m.smoke -= dt;
      if (m.smoke <= 0) {
        m.smoke = 0.022;
        this._part({ x: m.x, y: m.y, vx: U.rand(-12, 12), vy: U.rand(-12, 12),
                     life: 0.5, max: 0.5, size: 5, color: '#cfd8dc', kind: 'smoke', grow: 22 });
      }

      const hit = this.hitScan(m.x, m.y, 5, 0, true);
      if (hit || m.life <= 0) {
        this.explosion(m.x, m.y, m.splash, m.dmg, null, { life: 0.34 });
        if (m.split > 0) {
          for (let k = 0; k < m.split; k++) {
            const ang = U.rand(0, 6.28);
            this.missile(m.x, m.y, ang, null, m.dmg * 0.45, m.splash * 0.7, m.speed * 0.9, m.turn, 0);
          }
        }
        a.splice(i, 1);
      }
    }
  },

  updShells(dt) {
    const a = this.shells;
    for (let i = a.length - 1; i >= 0; i--) {
      const s = a[i];
      s.x += s.vx * dt; s.y += s.vy * dt;
      s.life -= dt;

      s.smoke -= dt;
      if (s.smoke <= 0) {
        s.smoke = 0.03;
        this._part({ x: s.x, y: s.y, vx: 0, vy: 0, life: 0.4, max: 0.4,
                     size: 4, color: '#b0bec5', kind: 'smoke', grow: 18 });
      }

      const hit = this.hitScan(s.x, s.y, 6, 0, s.friendly);
      if (hit || s.life <= 0) {
        this.explosion(s.x, s.y, s.splash, s.dmg, null,
                       { color: s.color, hostile: !s.friendly, life: 0.45 });
        a.splice(i, 1);
      }
    }
  },

  updSpiders(dt) {
    const a = this.spiders;
    for (let i = a.length - 1; i >= 0; i--) {
      const s = a[i];
      s.life -= dt;
      s.leg += dt * 15;

      if (!s.target || s.target.dead) s.target = G.city.nearest(s.x, s.y, 900, true);

      if (s.target) {
        const t = s.target;
        const reach = Math.max(t.w, t.d) * 0.5 + 12;
        const d = U.dist(s.x, s.y, t.x, t.y);
        if (d > reach) {
          const ang = U.angTo(s.x, s.y, t.x, t.y);
          s.ang = ang;
          s.x += Math.cos(ang) * s.speed * dt;
          s.y += Math.sin(ang) * s.speed * dt;
        } else {
          s.biteT -= dt;
          if (s.biteT <= 0) {
            s.biteT = s.bite;
            G.city.damage(t, s.dmg);
            this.spark(s.x, s.y, 3, '#ff8a65');
          }
        }
      } else {
        s.x += Math.cos(s.ang) * s.speed * 0.4 * dt;
        s.y += Math.sin(s.ang) * s.speed * 0.4 * dt;
      }

      if (s.life <= 0) {
        this.explosion(s.x, s.y, s.boom, s.dmg * 2.2, null, { life: 0.3 });
        for (let k = 0; k < s.brood; k++) {
          this.spider(s.x + U.rand(-16, 16), s.y + U.rand(-16, 16),
                      s.dmg * 0.7, s.bite, s.life + 8, s.boom * 0.7, s.speed, 0);
        }
        a.splice(i, 1);
      }
    }
  },

  updNukes(dt) {
    const a = this.nukes;
    for (let i = a.length - 1; i >= 0; i--) {
      const n = a[i];
      n.t += dt;
      const k = n.t / n.dur;
      if (k >= 1) {
        this.flash = 1;
        this.hitStop = 0.10;
        this.explosion(n.tx, n.ty, n.radius, n.dmg, null,
                       { color: '#fff59d', life: 1.0, shockwave: true });
        this.ring(n.tx, n.ty, n.radius * 1.7, '#fff59d', 1.1);
        this.fire(n.tx, n.ty, 60, 3.2);
        this.dust(n.tx, n.ty, 50, 3.4);
        this.shake(38);
        SFX.nuke();
        a.splice(i, 1);
      }
    }
  },

  updWarns(dt) {
    const a = this.warns;
    for (let i = a.length - 1; i >= 0; i--) {
      const w = a[i];
      w.t += dt;
      if (w.t >= w.dur) {
        this.explosion(w.x, w.y, w.r, w.dmg, null,
                       { hostile: !w.friendly, color: w.friendly ? '#80d8ff' : '#ff7043' });
        a.splice(i, 1);
      }
    }
  },

  updFissures(dt) {
    const a = this.fissures;
    for (let i = a.length - 1; i >= 0; i--) {
      const f = a[i];
      f.t += dt;
      f.tick -= dt;
      if (f.tick <= 0) {
        f.tick = 0.35;
        this.damageArea(f.x, f.y, f.r, f.dps * 0.35, false);
        this.fire(f.x + U.rand(-f.r, f.r) * 0.6, f.y + U.rand(-f.r, f.r) * 0.6, 3, 1.1);
      }
      if (f.t >= f.life) a.splice(i, 1);
    }
  },

  updSimple(dt) {
    let a;

    a = this.particles;
    for (let i = a.length - 1; i >= 0; i--) {
      const p = a[i];
      p.life -= dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= (1 - dt * 2.6); p.vy *= (1 - dt * 2.6);
      if (p.grow) p.size += p.grow * dt;
      if (p.life <= 0) a.splice(i, 1);
    }

    a = this.debris;
    for (let i = a.length - 1; i >= 0; i--) {
      const d = a[i];
      d.life -= dt;
      d.x += d.vx * dt; d.y += d.vy * dt;
      d.vz -= 620 * dt;
      d.z += d.vz * dt;
      d.rot += d.vr * dt;
      if (d.z <= 0) { d.z = 0; d.vz *= -0.34; d.vx *= 0.6; d.vy *= 0.6; d.vr *= 0.6; }
      if (d.life <= 0) a.splice(i, 1);
    }

    a = this.explosions;
    for (let i = a.length - 1; i >= 0; i--) {
      const e = a[i];
      e.t += dt;
      e.r = e.max * Math.min(1, Math.pow(e.t / e.life, 0.45));
      if (e.t >= e.life) a.splice(i, 1);
    }

    a = this.rings;
    for (let i = a.length - 1; i >= 0; i--) {
      const r = a[i];
      r.t += dt;
      r.r = U.lerp(r.max * 0.15, r.max, Math.min(1, r.t / r.life));
      if (r.t >= r.life) a.splice(i, 1);
    }

    for (const key of ['beams', 'flames', 'arcs', 'rails']) {
      const b = this[key];
      for (let i = b.length - 1; i >= 0; i--) {
        b[i].t += dt;
        if (b[i].t >= b[i].life) b.splice(i, 1);
      }
    }

    a = this.texts;
    for (let i = a.length - 1; i >= 0; i--) {
      const t = a[i];
      t.t += dt;
      t.y += t.vy * dt;
      t.vy *= (1 - dt * 1.8);
      if (t.t >= t.life) a.splice(i, 1);
    }

    a = this.sucks;
    for (let i = a.length - 1; i >= 0; i--) {
      a[i].t += dt;
      if (a[i].t >= a[i].life) a.splice(i, 1);
    }
  },
};
