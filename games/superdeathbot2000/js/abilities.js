'use strict';
/* ============================================================
   The nine abilities, their ranks, and the upgrade cards.
   Global: AbilitySys
   ============================================================ */

function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const L = dx * dx + dy * dy;
  let t = L > 0 ? ((px - ax) * dx + (py - ay) * dy) / L : 0;
  t = U.clamp(t, 0, 1);
  return U.dist(px, py, ax + dx * t, ay + dy * t);
}

const AbilitySys = {

  /* ---------------- state ---------------- */

  freshState(id, rank) {
    return {
      id: id,
      rank: U.clamp(rank || 1, 1, ABILITY_DEFS[id].ranks.length),
      cd: 0,
      cdMax: 0.001,
      drones: [],
      saws: [],
      sawT: 0,
      chargeT: 0,      // railgun spin-up
      // chomp
      chewing: null,
      chewT: 0,
      bitesLeft: 0,
      activeT: 0,      // overdrive: seconds of no-cooldown left
    };
  },

  stats(st) { return ABILITY_DEFS[st.id].ranks[st.rank - 1]; },

  owned(id) { return !!(G.player && G.player.abilities[id]); },

  give(id, rank) {
    G.player.abilities[id] = this.freshState(id, rank || 1);
    return G.player.abilities[id];
  },

  dmg(v) { return v * (G.bonus ? G.bonus.dmg : 1); },

  /* ---------------- targeting ---------------- */

  // Nearest thing worth shooting. Enemies get priority via a distance discount.
  findTarget(x, y, range) {
    let best = null, bestScore = Infinity;

    const es = Enemies.list;
    for (let i = 0; i < es.length; i++) {
      const e = es[i];
      if (e.dead) continue;
      const d = U.dist(x, y, e.x, e.y) - e.r;
      if (d > range) continue;
      const s = d * 0.62;
      if (s < bestScore) { bestScore = s; best = e; }
    }

    const b = G.city.nearest(x, y, range, true);
    if (b) {
      const d = U.dist(x, y, b.x, b.y) - Math.max(b.w, b.d) * 0.4;
      if (d < bestScore) best = b;
    }
    return best;
  },

  // Up to n distinct targets, nearest first.
  findTargets(x, y, range, n) {
    const out = [];
    const es = Enemies.list;
    for (let i = 0; i < es.length; i++) {
      const e = es[i];
      if (!e.dead && U.dist(x, y, e.x, e.y) <= range) out.push({ o: e, d: U.dist(x, y, e.x, e.y) * 0.62 });
    }
    const list = G.city.grid.queryRect(x - range, y - range, x + range, y + range, []);
    for (let i = 0; i < list.length; i++) {
      const o = list[i];
      const d = U.dist(x, y, o.x, o.y);
      if (d <= range) out.push({ o: o, d: d * (o.isProp ? 1.7 : 1) });
    }
    out.sort((a, b) => a.d - b.d);
    const res = [];
    for (let i = 0; i < out.length && res.length < n; i++) res.push(out[i].o);
    return res;
  },

  /* ---------------- main tick ---------------- */

  update(dt) {
    const p = G.player;
    if (!p || p.dead) return;

    // ticked first so everything below sees the right overdrive state this frame
    if (p.abilities.overdrive) this.updateOverdrive(p.abilities.overdrive, dt);

    for (const id in p.abilities) {
      const st = p.abilities[id];
      if (st.cd > 0) st.cd -= dt;

      const def = ABILITY_DEFS[id];
      if (def.mode === 'passive') continue;      // armor / nanites are stat hooks

      if (id === 'drones')   this.updateDrones(st, dt);
      if (id === 'buzzsaws') this.updateSaws(st, dt);
      if (id === 'chomp')    this.updateChomp(st, dt);
      if (id === 'railgun')  this.updateRailgun(st, dt);

      // drones and buzzsaws are continuous, not cooldown-triggered
      if (def.mode === 'auto' && st.cd <= 0 && id !== 'drones' && id !== 'buzzsaws') {
        this.fire(id, st);
      }
    }
  },

  // Manual abilities come in through here (key / mouse).
  tryManual(id) {
    const p = G.player;
    if (!p || p.dead) return false;
    const st = p.abilities[id];
    if (!st || st.cd > 0) return false;
    return this.fire(id, st);
  },

  // OVERDRIVE zeroes every cooldown but its own - otherwise it would refresh
  // itself and never end.
  overdriveOn() {
    const od = G.player && G.player.abilities.overdrive;
    return !!(od && od.activeT > 0);
  },

  setCd(st, v) {
    if (st.id !== 'overdrive' && this.overdriveOn()) v = Math.min(v, CFG.OVERDRIVE.cdFloor);
    st.cd = v;
    st.cdMax = v;
  },

  fire(id, st) {
    const fn = this['fire_' + id];
    return fn ? fn.call(this, st) : false;
  },

  /* ================= MACHINE GUN ================= */
  fire_machinegun(st) {
    const s = this.stats(st), p = G.player;
    const t = this.findTarget(p.x, p.y, s.range + p.radius);
    if (!t) return false;

    const base = U.angTo(p.x, p.y, t.x, t.y);
    for (let i = 0; i < s.barrels; i++) {
      const off = (i - (s.barrels - 1) / 2) * s.spread + U.rand(-0.035, 0.035);
      const a = base + off;
      EM.bullet(
        p.x + Math.cos(a) * p.radius, p.y + Math.sin(a) * p.radius,
        a, s.speed, this.dmg(s.dmg),
        { ricochet: s.ricochet || 0, color: '#ffe082', len: 16 }
      );
    }
    SFX.shoot();
    this.setCd(st, s.cd);
    return true;
  },

  /* ================= MISSILES ================= */
  fire_missiles(st) {
    const s = this.stats(st), p = G.player;
    const targets = this.findTargets(p.x, p.y, s.range + p.radius, s.count);
    if (!targets.length) return false;

    for (let i = 0; i < s.count; i++) {
      const tgt = targets[i % targets.length];
      const a = U.rand(0, Math.PI * 2);
      EM.missile(
        p.x + Math.cos(a) * p.radius * 0.7, p.y + Math.sin(a) * p.radius * 0.7,
        a, tgt, this.dmg(s.dmg), s.splash, s.speed, s.turn, s.split || 0
      );
    }
    SFX.missile();
    this.setCd(st, s.cd);
    return true;
  },

  /* ================= LASER ZAP ================= */
  fire_laser(st) {
    const s = this.stats(st), p = G.player;
    const t = this.findTarget(p.x, p.y, s.range + p.radius);
    if (!t) return false;

    const base = U.angTo(p.x, p.y, t.x, t.y);
    const forks = s.forks || 1;
    for (let f = 0; f < forks; f++) {
      const a = base + (f - (forks - 1) / 2) * 0.34;
      this.zap(p.x, p.y, a, s.range, s.width, this.dmg(s.dmg));
    }
    SFX.laser();
    this.setCd(st, s.cd);
    return true;
  },

  zap(x, y, ang, range, width, dmg) {
    const ex = x + Math.cos(ang) * range;
    const ey = y + Math.sin(ang) * range;
    EM.beam(x, y, ex, ey, width, '#7fdcea');

    const minX = Math.min(x, ex) - width, maxX = Math.max(x, ex) + width;
    const minY = Math.min(y, ey) - width, maxY = Math.max(y, ey) + width;
    const list = G.city.grid.queryRect(minX, minY, maxX, maxY, []);
    for (let i = 0; i < list.length; i++) {
      const o = list[i];
      const r = Math.max(o.w, o.d) * 0.5;
      if (segDist(o.x, o.y, x, y, ex, ey) <= width + r) {
        EM.spark(o.x, o.y, 4, '#b3e5fc');
        G.city.damage(o, dmg);
      }
    }
    const es = Enemies.list;
    for (let i = 0; i < es.length; i++) {
      const e = es[i];
      if (!e.dead && segDist(e.x, e.y, x, y, ex, ey) <= width + e.r) {
        EM.spark(e.x, e.y, 5, '#b3e5fc');
        e.hurt(dmg);
      }
    }
  },

  /* ================= MINI DRONES ================= */
  updateDrones(st, dt) {
    const s = this.stats(st), p = G.player;

    while (st.drones.length < s.count) {
      st.drones.push({
        a: U.rand(0, Math.PI * 2), x: p.x, y: p.y,
        cd: U.rand(0, s.cd), state: 'orbit', respawn: 0, tx: 0, ty: 0, target: null,
      });
    }
    st.drones.length = s.count;

    const orbit = s.orbit + p.radius;
    for (let i = 0; i < st.drones.length; i++) {
      const d = st.drones[i];

      if (d.state === 'dead') {
        d.respawn -= dt;
        if (d.respawn <= 0) { d.state = 'orbit'; d.x = p.x; d.y = p.y; }
        continue;
      }

      if (d.state === 'dive') {
        const t = d.target;
        if (!t || t.dead) { d.state = 'orbit'; continue; }
        const a = U.angTo(d.x, d.y, t.x, t.y);
        d.x += Math.cos(a) * 420 * dt;
        d.y += Math.sin(a) * 420 * dt;
        if (U.dist(d.x, d.y, t.x, t.y) < Math.max(t.r || 0, Math.max(t.w || 0, t.d || 0) * 0.5) + 14) {
          EM.explosion(d.x, d.y, 90, this.dmg(s.dmg * 5), null);
          d.state = 'dead'; d.respawn = 2.2;
        }
        continue;
      }

      // orbit
      d.a += dt * 1.9 + i * 0.0001;
      const tx = p.x + Math.cos(d.a + i * (Math.PI * 2 / s.count)) * orbit;
      const ty = p.y + Math.sin(d.a + i * (Math.PI * 2 / s.count)) * orbit;
      d.x = U.damp(d.x, tx, 9, dt);
      d.y = U.damp(d.y, ty, 9, dt);

      d.cd -= dt;
      if (d.cd <= 0) {
        const t = this.findTarget(d.x, d.y, s.range);
        if (t) {
          if (s.kamikaze && U.chance(0.14) && U.dist(d.x, d.y, t.x, t.y) < 190) {
            d.state = 'dive'; d.target = t;
          } else {
            const a = U.angTo(d.x, d.y, t.x, t.y) + U.rand(-0.05, 0.05);
            EM.bullet(d.x, d.y, a, s.speed, this.dmg(s.dmg), { color: '#80deea', len: 11 });
            SFX.droneShot();
          }
          d.cd = s.cd;
        } else {
          d.cd = 0.18;
        }
      }
    }
  },

  /* ================= SPIDER BOTS ================= */
  fire_spiders(st) {
    const s = this.stats(st), p = G.player;
    for (let i = 0; i < s.count; i++) {
      const a = U.rand(0, Math.PI * 2);
      EM.spider(
        p.x + Math.cos(a) * p.radius, p.y + Math.sin(a) * p.radius,
        this.dmg(s.dmg), s.bite, s.life, s.boom, s.speed, s.brood || 0
      );
    }
    this.setCd(st, s.cd);
    return true;
  },

  /* ================= BAZOOKA ================= */
  fire_bazooka(st) {
    const s = this.stats(st), p = G.player;
    const base = p.aim;
    for (let i = 0; i < s.shells; i++) {
      const a = base + (i - (s.shells - 1) / 2) * s.spread;
      EM.shell(
        p.x + Math.cos(a) * p.radius, p.y + Math.sin(a) * p.radius,
        a, s.speed, this.dmg(s.dmg), s.splash, '#ff8a65', true
      );
    }
    SFX.bazooka();
    EM.shake(5);
    this.setCd(st, s.cd);
    return true;
  },

  /* ================= SUPER SMASH ================= */
  fire_smash(st) {
    const s = this.stats(st), p = G.player;
    const r = p.radius * 4.2 * s.rMul;

    p.smashAnim = 1;
    EM.explosion(p.x, p.y, r, this.dmg(s.dmg), null, { shockwave: true, color: '#ffd54f' });
    EM.ring(p.x, p.y, r, '#ffd54f', 0.5);
    EM.dust(p.x, p.y, 26, 2.2);
    EM.shake(Math.min(24, 9 + r / 26));
    SFX.smash();

    // knock enemies outward
    for (const e of Enemies.list) {
      if (e.dead) continue;
      const d = U.dist(p.x, p.y, e.x, e.y);
      if (d < r * 1.35) {
        const a = U.angTo(p.x, p.y, e.x, e.y);
        e.knock(Math.cos(a) * 420, Math.sin(a) * 420);
      }
    }

    if (s.fissure) EM.fissure(p.x, p.y, r * 1.5, this.dmg(s.dmg) * 0.5);
    this.setCd(st, s.cd);
    return true;
  },

  /* ================= NUKE ================= */
  fire_nuke(st) {
    const s = this.stats(st), p = G.player;
    const range = 520;
    const tx = p.x + Math.cos(p.aim) * range;
    const ty = p.y + Math.sin(p.aim) * range;

    for (let i = 0; i < s.heads; i++) {
      const off = s.heads > 1 ? (i - (s.heads - 1) / 2) : 0;
      const px = tx + Math.cos(p.aim + Math.PI / 2) * off * s.radius * 0.85;
      const py = ty + Math.sin(p.aim + Math.PI / 2) * off * s.radius * 0.85;
      EM.nukeShell(p.x, p.y, px, py, 0.9 + i * 0.18, s.radius, this.dmg(s.dmg));
    }
    UI.toast('NUCLEAR LAUNCH DETECTED', '#ff8a65');
    this.setCd(st, s.cd);
    return true;
  },

  /* ================= CHOMPITY CHOMP CHOMP CHOMP ================= */
  fire_chomp(st) {
    if (st.chewing) return false;          // already mid-meal
    const s = this.stats(st), p = G.player;
    const reach = p.radius * s.reach + 70;
    const t = G.city.nearest(p.x, p.y, reach, true);
    if (!t) return false;

    st.chewing = t;
    st.bitesLeft = s.bites;
    st.chewT = 0;
    p.chompAnim = 1;
    return true;
  },

  updateChomp(st, dt) {
    if (!st.chewing) return;
    const s = this.stats(st), p = G.player;
    const t = st.chewing;

    // lost the meal
    const reach = p.radius * s.reach + 130;
    if (t.dead || U.dist(p.x, p.y, t.x, t.y) > reach) {
      st.chewing = null;
      this.setCd(st, s.cd * 0.5);
      return;
    }

    st.chewT -= dt;
    if (st.chewT > 0) return;

    const i = s.bites - st.bitesLeft;
    SFX.chomp(i);
    p.chompAnim = 1;
    EM.dust(t.x, t.y, 7, 1.1);
    EM.text(t.x, t.y - 10, 'CHOMP', '#ffd54f');

    const bite = Math.max(45, t.maxHp * s.bitePct);
    G.city.damage(t, bite, { xpMul: s.xpMul });
    p.heal(p.maxHp * s.healPct / s.bites);

    if (s.vacuum) this.vacuum(s.vacuum, s.xpMul);

    st.bitesLeft--;
    st.chewT = s.biteTime;

    // A four-bite mouthful finishes anything small. Skyscrapers take
    // a second helping, which is what keeps CHOMP from outclassing the nuke.
    if (st.bitesLeft <= 0 || t.dead) {
      st.chewing = null;
      this.setCd(st, s.cd);
    }
  },

  // BLACK HOLE MAW: inhale everything small nearby
  vacuum(r, xpMul) {
    const p = G.player;
    const list = G.city.grid.queryCircle(p.x, p.y, r, []);
    for (let i = 0; i < list.length; i++) {
      const o = list[i];
      if (!o.isProp) continue;
      EM.suck(o.x, o.y, p);
      G.city.destroy(o, { xpMul: xpMul });
    }
  },

  /* ================= CHAIN LIGHTNING ================= */
  fire_chain(st) {
    const s = this.stats(st), p = G.player;
    const t = this.findTarget(p.x, p.y, s.range + p.radius);
    if (!t) return false;
    EM.chain(p.x, p.y, t, this.dmg(s.dmg), s.jumps, s.jumpRange, s.falloff);
    SFX.laser();
    this.setCd(st, s.cd);
    return true;
  },

  /* ================= BUZZSAWS ================= */
  updateSaws(st, dt) {
    const s = this.stats(st), p = G.player;

    while (st.saws.length < s.count) st.saws.push({ a: U.rand(0, 6.28) });
    st.saws.length = s.count;

    st.sawT = (st.sawT || 0) - dt;
    const hitNow = st.sawT <= 0;
    if (hitNow) st.sawT = s.tick;

    const orbit = s.orbit + p.radius;
    EM.saws.length = 0;
    for (let i = 0; i < st.saws.length; i++) {
      const w = st.saws[i];
      w.a += dt * s.spin;
      const ang = w.a + i * (Math.PI * 2 / s.count);
      w.x = p.x + Math.cos(ang) * orbit;
      w.y = p.y + Math.sin(ang) * orbit;
      w.size = s.size;
      EM.saws.push(w);

      if (!hitNow) continue;
      const list = G.city.grid.queryCircle(w.x, w.y, s.size, []);
      for (const o of list) {
        G.city.damage(o, this.dmg(s.dmg), { fromX: p.x, fromY: p.y });
        EM.spark(w.x, w.y, 2, '#ffd54f');
      }
      for (const e of Enemies.list) {
        if (!e.dead && U.dist(w.x, w.y, e.x, e.y) < s.size + e.r) {
          e.hurt(this.dmg(s.dmg) * (s.rip ? 1.6 : 1));
          EM.spark(w.x, w.y, 3, '#ff8a65');
        }
      }
      G.city.blastTraffic(w.x, w.y, s.size);
    }
  },

  /* ================= FLAMETHROWER ================= */
  fire_flamethrower(st) {
    const s = this.stats(st), p = G.player;
    const ox = p.x + Math.cos(p.aim) * p.radius * 0.8;
    const oy = p.y + Math.sin(p.aim) * p.radius * 0.8;
    EM.flame(ox, oy, p.aim, s.range + p.radius, s.arc, this.dmg(s.dmg), s.burn);

    // NAPALM leaves the ground itself alight
    if (s.napalm && U.chance(0.10)) {
      const r = U.rand(0.4, 1) * (s.range + p.radius);
      EM.fissure(ox + Math.cos(p.aim) * r, oy + Math.sin(p.aim) * r, 90, this.dmg(s.dmg) * 3);
    }
    if (SFX.throttle('flame', 90)) SFX.explode(0.45);
    this.setCd(st, s.cd);
    return true;
  },

  /* ================= RAILGUN ================= */
  fire_railgun(st) {
    if (st.chargeT > 0) return false;
    const s = this.stats(st);
    st.chargeT = s.charge;
    SFX.laser();
    return true;
  },

  updateRailgun(st, dt) {
    if (!st.chargeT || st.chargeT <= 0) return;
    const s = this.stats(st), p = G.player;
    st.chargeT -= dt;

    // spit sparks into the barrel while it spins up
    EM.spark(p.x + Math.cos(p.aim) * p.radius * 1.4,
             p.y + Math.sin(p.aim) * p.radius * 1.4, 2, '#e1f5fe');

    if (st.chargeT <= 0) {
      st.chargeT = 0;
      EM.rail(p.x, p.y, p.aim, s.range, s.width, this.dmg(s.dmg), s.quake);
      EM.flash = Math.max(EM.flash, 0.35);
      SFX.bazooka();
      this.setCd(st, s.cd);
    }
  },

  /* ================= JUMP JETS ================= */
  fire_jumpjets(st) {
    const s = this.stats(st), p = G.player;
    if (p.jumpT > 0) return false;
    p.startJump(s.dist, s.air, this.dmg(s.dmg), s.rMul, !!s.shock);
    SFX.smash();
    this.setCd(st, s.cd);
    return true;
  },

  /* ================= RAM ================= */
  fire_ram(st) {
    const s = this.stats(st), p = G.player;
    if (p.jumpT > 0 || p.ramT > 0) return false;
    p.startRam(s.dist, s.speed, this.dmg(s.dmg), s.width, s.knock, !!s.trail);
    this.setCd(st, s.cd);
    return true;
  },

  /* ================= SINGULARITY ================= */
  fire_singularity(st) {
    const s = this.stats(st), p = G.player;
    const reach = 380;
    const tx = p.x + Math.cos(p.aim) * reach;
    const ty = p.y + Math.sin(p.aim) * reach;
    EM.singularity(tx, ty, s.radius, s.pull, this.dmg(s.dps), s.life, !!s.implode);
    SFX.teleport();
    UI.toast('SINGULARITY', '#b388ff');
    this.setCd(st, s.cd);
    return true;
  },

  /* ================= CRYO CANNON ================= */
  fire_cryo(st) {
    const s = this.stats(st), p = G.player;
    const t = this.findTarget(p.x, p.y, s.range + p.radius);
    if (!t) return false;
    EM.frost(t.x, t.y, s.radius, this.dmg(s.dmg), s);
    if (SFX.throttle('cryo', 120)) SFX.laser();
    this.setCd(st, s.cd);
    return true;
  },

  /* ================= TESLA COIL ================= */
  fire_tesla(st) {
    const s = this.stats(st), p = G.player;
    const r = s.radius + p.radius;
    EM.ring(p.x, p.y, r, '#80d8ff', 0.30);
    EM.damageArea(p.x, p.y, r, this.dmg(s.dmg), false);
    for (let i = 0; i < 5; i++) {
      const a = U.rand(0, 6.2832), d = Math.sqrt(Math.random()) * r;
      EM.spark(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, 2, '#b3e5fc');
    }
    // ARC REACTOR: the pulse also throws an arc at whatever is just out of reach
    if (s.chain) {
      const t = this.findTarget(p.x, p.y, r * 2.2);
      if (t) EM.chain(p.x, p.y, t, this.dmg(s.dmg) * 0.8, s.chain, 230, 0.9);
    }
    if (SFX.throttle('tesla', 140)) SFX.laser();
    this.setCd(st, s.cd);
    return true;
  },

  /* ================= SCATTERGUN ================= */
  fire_scatter(st) {
    const s = this.stats(st), p = G.player;
    const t = this.findTarget(p.x, p.y, s.range + p.radius);
    if (!t) return false;

    const base = U.angTo(p.x, p.y, t.x, t.y);
    for (let i = 0; i < s.pellets; i++) {
      const a = base + U.rand(-s.spread, s.spread);
      EM.bullet(
        p.x + Math.cos(a) * p.radius, p.y + Math.sin(a) * p.radius,
        a, s.speed * U.rand(0.85, 1.15), this.dmg(s.dmg),
        { color: s.burn ? '#ff8a65' : '#ffe082', len: 12, burn: s.burn || 0 }
      );
    }
    SFX.bazooka();
    EM.shake(3);
    this.setCd(st, s.cd);
    return true;
  },

  /* ================= MORTAR BATTERY ================= */
  fire_mortar(st) {
    const s = this.stats(st), p = G.player;
    const targets = this.findTargets(p.x, p.y, s.range + p.radius, s.count);
    if (!targets.length) return false;

    for (let i = 0; i < s.count; i++) {
      const t = targets[i % targets.length];
      EM.mortar(
        p.x, p.y,
        t.x + U.rand(-s.scatter, s.scatter), t.y + U.rand(-s.scatter, s.scatter),
        0.85 + i * 0.13, s.radius, this.dmg(s.dmg), s.cluster || 0
      );
    }
    SFX.bazooka();
    this.setCd(st, s.cd);
    return true;
  },

  /* ================= ORBITAL STRIKE ================= */
  fire_orbital(st) {
    const s = this.stats(st), p = G.player;
    const tx = p.x + Math.cos(p.aim) * s.reach;
    const ty = p.y + Math.sin(p.aim) * s.reach;

    for (let i = 0; i < s.count; i++) {
      const a = U.rand(0, 6.2832), d = Math.sqrt(Math.random()) * s.spread;
      EM.warning(tx + Math.cos(a) * d, ty + Math.sin(a) * d,
                 s.radius, s.delay + i * s.stagger, this.dmg(s.dmg), true);
    }
    // KILL SAT leaves the ground itself glassed and burning
    if (s.beam) EM.fissure(tx, ty, s.spread * 0.8, this.dmg(s.dmg) * 0.4);

    UI.toast('ORBITAL STRIKE INBOUND', '#80d8ff');
    this.setCd(st, s.cd);
    return true;
  },

  /* ================= PROXIMITY MINES ================= */
  fire_mines(st) {
    const s = this.stats(st), p = G.player;
    for (let i = 0; i < s.count; i++) {
      const a = U.rand(0, 6.2832), d = U.rand(0.35, 1) * s.spread;
      EM.mine(p.x + Math.cos(a) * d, p.y + Math.sin(a) * d,
              this.dmg(s.dmg), s.radius, s.trigger, s.life, s.child || 0);
    }
    SFX.pick();
    this.setCd(st, s.cd);
    return true;
  },

  /* ================= OVERDRIVE ================= */
  fire_overdrive(st) {
    const s = this.stats(st), p = G.player;
    st.activeT = s.time;

    // whatever was already reloading comes back instantly
    for (const id in p.abilities) {
      if (id === 'overdrive') continue;
      p.abilities[id].cd = 0;
    }

    EM.ring(p.x, p.y, p.radius * 5, '#ff8a65', 0.6);
    EM.flash = Math.max(EM.flash, 0.3);
    EM.shake(6);
    SFX.smash();
    UI.toast('OVERDRIVE', '#ff8a65');
    this.setCd(st, s.cd);
    return true;
  },

  updateOverdrive(st, dt) {
    if (st.activeT <= 0) return;
    st.activeT -= dt;
    if (st.activeT <= 0) {
      st.activeT = 0;
      UI.toast('OVERDRIVE OFFLINE', '#90a4ae');
    }
  },

  /* ================= upgrade cards ================= */

  BONUS: [
    { key: 'repair', glyph: '⚕', name: 'REPAIR PLATING', body: 'Full repair, and +40 max HP permanently.',
      apply() { G.bonus.hp += 40; G.player.recompute(); G.player.hp = G.player.maxHp; } },
    { key: 'overclock', glyph: '▲', name: 'OVERCLOCK', body: '+12% damage from every ability you own.',
      apply() { G.bonus.dmg *= 1.12; } },
    { key: 'servo', glyph: '≫', name: 'SERVO BOOST', body: '+10% movement speed.',
      apply() { G.bonus.speed *= 1.10; } },
    { key: 'growth', glyph: '⬛', name: 'GROWTH SPURT', body: '+4 size right now. Crush taller buildings sooner.',
      apply() { G.bonus.radius += 4; G.player.recompute(); } },
  ],

  rollCards() {
    const p = G.player;
    const pool = [];

    for (const id of ABILITY_ORDER) {
      if (!p.abilities[id]) pool.push({ type: 'new', id: id, weight: 2.4 });
      else if (!ABILITY_DEFS[id].noUpgrade && p.abilities[id].rank < 5) {
        pool.push({ type: 'up', id: id, weight: 1.0 });
      }
    }

    const cards = [];
    while (cards.length < 3 && pool.length) {
      let total = 0;
      for (const c of pool) total += c.weight;
      let r = Math.random() * total, idx = 0;
      for (let i = 0; i < pool.length; i++) { r -= pool[i].weight; if (r <= 0) { idx = i; break; } }
      cards.push(pool.splice(idx, 1)[0]);
    }

    // pad with a stat bonus if the player has maxed everything
    const used = {};
    while (cards.length < 3) {
      const b = U.pick(this.BONUS);
      if (used[b.key] && Object.keys(used).length < this.BONUS.length) continue;
      used[b.key] = 1;
      cards.push({ type: 'bonus', bonus: b, weight: 1 });
    }

    return cards.map(c => this.describe(c));
  },

  describe(c) {
    if (c.type === 'bonus') {
      return { type: 'bonus', bonus: c.bonus, glyph: c.bonus.glyph, name: c.bonus.name,
               rank: 'PERMANENT', body: c.bonus.body, evo: false };
    }
    const def = ABILITY_DEFS[c.id];
    if (c.type === 'new') {
      const kb = def.kb ? '  [' + def.kb + ']'
                        : (def.mode === 'passive' ? '  [passive]' : '  [auto]');
      return { type: 'new', id: c.id, glyph: def.glyph, name: def.name,
               rank: 'NEW ABILITY' + kb, body: def.blurb, evo: false };
    }
    const st = G.player.abilities[c.id];
    const next = st.rank + 1;
    const isEvo = next === 5;
    return {
      type: 'up', id: c.id, glyph: def.glyph, name: isEvo ? def.evo : def.name,
      rank: isEvo ? 'EVOLUTION  ★★★★★' : ('RANK ' + st.rank + '  →  ' + next),
      body: def.up[st.rank - 1], evo: isEvo,
    };
  },

  applyCard(card) {
    if (card.type === 'bonus') { card.bonus.apply(); }
    else if (card.type === 'new') { this.give(card.id, 1); }
    else { G.player.abilities[card.id].rank++; }
    // REACTIVE ARMOR grants max HP, so derived stats must be recomputed
    G.player.recompute();
    SFX.pick();
  },
};
