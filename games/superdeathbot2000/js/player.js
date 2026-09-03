'use strict';
/* ============================================================
   The robot. Movement, growth, XP, HP, and crushing.
   Global: Player
   ============================================================ */

class Player {
  constructor() {
    this.x = 0; this.y = 0;
    this.vx = 0; this.vy = 0;
    this.level = 1;
    this.xp = 0;
    this.radius = CFG.PLAYER.baseRadius;
    this.maxHp = CFG.PLAYER.baseHP;
    this.hp = this.maxHp;
    this.aim = 0;        // where the mouse is
    this.face = 0;       // body heading, lags behind movement
    this.walk = 0;       // gait phase
    this.invulnT = 0;
    this.hurtFlash = 0;
    this.levelFlash = 0;
    this.pendingUpgrades = 0;
    this.abilities = {};
    this.dead = false;
    this.smashAnim = 0;  // 0..1, drives the ground-pound pose
    this.chompAnim = 0;
    this.jumpT = 0; this.jumpZ = 0; this.jumpDur = 1;
    this.jumpFromX = 0; this.jumpFromY = 0; this.jumpToX = 0; this.jumpToY = 0;
    this.jumpDmg = 0; this.jumpR = 1; this.jumpShock = false;
    this.ramT = 0; this.ramDur = 1; this.ramAng = 0; this.ramSpeed = 0;
    this.ramDmg = 0; this.ramWidth = 1.5; this.ramKnock = 0; this.ramTrail = false;
    this.ramHit = [];
    this.shield = 0;      // deflector pool, spent before HP
    this.shieldMax = 0;
    this.shieldT = 0;     // seconds since the last hit
    this.shieldFlash = 0;
    this.recompute();
  }

  /* ---------------- derived stats ---------------- */

  recompute() {
    const b = (typeof G !== 'undefined' && G.bonus) ? G.bonus : { radius: 0, hp: 0, speed: 1 };
    this.radius = CFG.PLAYER.baseRadius + (this.level - 1) * CFG.PLAYER.growthPerLevel + b.radius;
    const arm = (this.abilities && this.abilities.armor)
      ? ABILITY_DEFS.armor.ranks[this.abilities.armor.rank - 1] : null;
    this.maxHp = CFG.PLAYER.baseHP + (this.level - 1) * CFG.PLAYER.hpPerLevel + b.hp +
                 (arm ? arm.hp : 0);
    if (this.hp > this.maxHp) this.hp = this.maxHp;

    const sh = (this.abilities && this.abilities.shield)
      ? ABILITY_DEFS.shield.ranks[this.abilities.shield.rank - 1] : null;
    this.shieldMax = sh ? sh.cap : 0;
    if (this.shield > this.shieldMax) this.shield = this.shieldMax;
  }

  get speed() {
    const mul = (typeof G !== 'undefined' && G.bonus) ? G.bonus.speed : 1;
    return (CFG.PLAYER.baseSpeed + this.radius * CFG.PLAYER.speedPerRadius) * mul;
  }

  get crushHeight() {
    return Math.max(0, (this.radius - CFG.PLAYER.crushSlack) * CFG.PLAYER.crushMul);
  }

  get xpNext() { return Math.floor(CFG.XP.curveA * Math.pow(this.level, CFG.XP.curveP)); }

  /* ---------------- progression ---------------- */

  addXP(n) {
    if (this.dead) return;
    this.xp += n * CFG.XP.mult;
    let guard = 0;
    while (this.xp >= this.xpNext && guard++ < 200) {
      this.xp -= this.xpNext;
      this.levelUp();
    }
  }

  levelUp() {
    this.level++;
    const beforeMax = this.maxHp;
    this.recompute();
    this.hp = Math.min(this.maxHp, this.hp + (this.maxHp - beforeMax) + this.maxHp * CFG.PLAYER.levelHealPct);
    this.levelFlash = 1;
    EM.shake(7);
    EM.ring(this.x, this.y, this.radius * 5, '#4dd0e1', 0.55);
    SFX.levelup();
    UI.toast('LEVEL ' + this.level, '#4dd0e1');

    if (this.level % CFG.UPGRADE_EVERY === 0) this.pendingUpgrades++;
  }

  heal(n, silent) {
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + n);
    const got = this.hp - before;
    if (!silent && got > 1) EM.text(this.x, this.y - this.radius - 14, '+' + Math.round(got), '#69f0ae');
  }

  hurt(dmg) {
    if (this.dead || this.invulnT > 0) return;

    // reactive armor soaks the hit
    const arm = this.passive('armor');
    if (arm) dmg *= (1 - arm.reduce);

    // the deflector bubble spends itself before the chassis takes anything
    this.shieldT = 0;
    if (this.shield > 0) {
      const sh = this.passive('shield');
      const absorbed = Math.min(this.shield, dmg);
      this.shield -= absorbed;
      dmg -= absorbed;
      this.shieldFlash = 1;
      EM.ring(this.x, this.y, this.radius * 2.4, '#80d8ff', 0.30);
      if (this.shield <= 0) {
        this.shield = 0;
        UI.toast('SHIELD DOWN', '#80d8ff');
        // BULWARK and up go off like a grenade when the bubble pops
        if (sh && sh.burst > 0) {
          EM.explosion(this.x, this.y, this.radius * 5, sh.burst, null,
                       { color: '#80d8ff', shockwave: true });
        }
      }
      if (dmg <= 0) { this.invulnT = CFG.PLAYER.invuln * 0.5; SFX.hurt(); return; }
    }

    this.hp -= dmg;
    this.invulnT = CFG.PLAYER.invuln;
    this.hurtFlash = 1;
    EM.shake(Math.min(13, 3 + dmg * 0.16));
    SFX.hurt();

    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
      SFX.die();
      EM.explosion(this.x, this.y, this.radius * 4.5, 0, null);
      G.onDeath();
      return;
    }

    // ...and spits it back, but only if the chassis survived the hit
    if (arm && arm.thorns > 0) {
      EM.explosion(this.x, this.y, this.radius * 3.4, arm.thorns, null,
                   { color: '#80d8ff', life: 0.34 });
    }
  }

  /* ---------------- per-frame ---------------- */

  // stats of a passive ability, or null if not owned
  passive(id) {
    const st = this.abilities[id];
    return st ? ABILITY_DEFS[id].ranks[st.rank - 1] : null;
  }

  update(dt, input) {
    if (this.dead) return;

    // ----- jump jets: airborne, nothing else applies -----
    if (this.jumpT > 0) {
      this.jumpT -= dt;
      const k = 1 - U.clamp(this.jumpT / this.jumpDur, 0, 1);
      this.x = U.lerp(this.jumpFromX, this.jumpToX, k);
      this.y = U.lerp(this.jumpFromY, this.jumpToY, k);
      this.jumpZ = Math.sin(k * Math.PI) * 130;
      this.walk += dt * 6;
      if (U.chance(dt * 40)) EM.dust(this.x, this.y, 1, 1.2);
      if (this.jumpT <= 0) this.land();
      return;
    }
    this.jumpZ = 0;

    // ----- ram: locked into a straight charge until it runs out -----
    if (this.ramT > 0) {
      this.ramT -= dt;
      if (this.invulnT > 0) this.invulnT -= dt;
      if (this.hurtFlash > 0) this.hurtFlash = Math.max(0, this.hurtFlash - dt * 3);

      const step = this.ramSpeed * dt;
      this.x += Math.cos(this.ramAng) * step;
      this.y += Math.sin(this.ramAng) * step;

      const c = G.city;
      if (c) {
        this.x = U.clamp(this.x, c.minX + this.radius, c.maxX - this.radius);
        this.y = U.clamp(this.y, c.minY + this.radius, c.maxY - this.radius);
      }

      this.walk += dt * 15;
      this.face += U.angDiff(this.face, this.ramAng) * Math.min(1, dt * 20);
      this.ramStep(dt);
      if (this.ramT <= 0) this.endRam();
      return;
    }

    if (this.invulnT > 0) this.invulnT -= dt;
    if (this.hurtFlash > 0) this.hurtFlash = Math.max(0, this.hurtFlash - dt * 3);
    if (this.levelFlash > 0) this.levelFlash = Math.max(0, this.levelFlash - dt * 1.6);
    if (this.smashAnim > 0) this.smashAnim = Math.max(0, this.smashAnim - dt * 3.4);
    if (this.chompAnim > 0) this.chompAnim = Math.max(0, this.chompAnim - dt * 5);

    // ----- movement -----
    let dx = 0, dy = 0;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    const len = Math.hypot(dx, dy);
    if (len > 0) { dx /= len; dy /= len; }

    const sp = this.speed;
    this.vx = U.damp(this.vx, dx * sp, CFG.PLAYER.accel, dt);
    this.vy = U.damp(this.vy, dy * sp, CFG.PLAYER.accel, dt);
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    const c = G.city;
    if (c) {
      this.x = U.clamp(this.x, c.minX + this.radius, c.maxX - this.radius);
      this.y = U.clamp(this.y, c.minY + this.radius, c.maxY - this.radius);
    }

    const movingFast = Math.hypot(this.vx, this.vy);
    this.walk += dt * (2 + movingFast / 42);
    if (len > 0) {
      const want = Math.atan2(dy, dx);
      this.face += U.angDiff(this.face, want) * Math.min(1, dt * 11);
    }

    this.crush(dt);
    if (CFG.COLLIDE.player) this.collide();

    // repair nanites
    const nan = this.passive('nanites');
    if (nan && this.hp < this.maxHp) this.heal(this.maxHp * nan.regen * dt, true);

    this.updateShield(dt);
  }

  // The bubble stays down for a beat after every hit, then refills.
  updateShield(dt) {
    if (this.shieldFlash > 0) this.shieldFlash = Math.max(0, this.shieldFlash - dt * 3);
    const sh = this.passive('shield');
    if (!sh) { this.shield = 0; return; }
    this.shieldT += dt;
    if (this.shieldT < sh.delay || this.shield >= this.shieldMax) return;
    const before = this.shield;
    this.shield = Math.min(this.shieldMax, this.shield + this.shieldMax * sh.regen * dt);
    if (before <= 0 && this.shield > 0) EM.ring(this.x, this.y, this.radius * 2.2, '#80d8ff', 0.4);
  }

  /* ---------------- solid buildings ---------------- */

  // Anything taller than you can crush is a wall. You shove up against it
  // (and grind it down) instead of strolling through a skyscraper.
  collide() {
    const c = G.city;
    if (!c) return;
    const ch = this.crushHeight;
    const r = this.radius;
    const list = c.queryCircle(this.x, this.y, r);

    for (let i = 0; i < list.length; i++) {
      const o = list[i];
      if (o.dead || o.isProp || o.h <= ch) continue;

      const hw = o.w / 2, hd = o.d / 2;
      const nx = U.clamp(this.x, o.x - hw, o.x + hw);
      const ny = U.clamp(this.y, o.y - hd, o.y + hd);
      let dx = this.x - nx, dy = this.y - ny;
      let d = Math.hypot(dx, dy);

      if (d > r || d === 0) {
        // dead centre inside the footprint: eject along the shallowest axis
        const ox = (this.x < o.x ? -1 : 1) * (hw - Math.abs(this.x - o.x) + r);
        const oy = (this.y < o.y ? -1 : 1) * (hd - Math.abs(this.y - o.y) + r);
        if (Math.abs(ox) < Math.abs(oy)) this.x += ox; else this.y += oy;
        continue;
      }

      const push = r - d;
      dx /= d; dy /= d;
      this.x += dx * push;
      this.y += dy * push;

      // kill the velocity component heading into the wall, so you slide
      const into = this.vx * dx + this.vy * dy;
      if (into < 0) { this.vx -= dx * into; this.vy -= dy * into; }
    }
  }

  /* ---------------- jump jets ---------------- */

  startJump(dist, dur, dmg, rMul, shock) {
    const c = G.city;
    this.jumpFromX = this.x; this.jumpFromY = this.y;
    let tx = this.x + Math.cos(this.aim) * dist;
    let ty = this.y + Math.sin(this.aim) * dist;
    if (c) {
      tx = U.clamp(tx, c.minX + this.radius, c.maxX - this.radius);
      ty = U.clamp(ty, c.minY + this.radius, c.maxY - this.radius);
    }
    this.jumpToX = tx; this.jumpToY = ty;
    this.jumpDur = dur;
    this.jumpT = dur;
    this.jumpDmg = dmg;
    this.jumpR = rMul;
    this.jumpShock = shock;
    this.invulnT = Math.max(this.invulnT, dur * 0.8);
    EM.dust(this.x, this.y, 14, 1.6);
  }

  land() {
    this.jumpT = 0;
    this.jumpZ = 0;
    this.smashAnim = 1;
    const r = this.radius * 4.2 * this.jumpR;
    EM.explosion(this.x, this.y, r, this.jumpDmg, null, { shockwave: true, color: '#ffd54f' });
    EM.ring(this.x, this.y, r, '#ffd54f', 0.5);
    EM.dust(this.x, this.y, 24, 2.2);
    EM.scorch(this.x, this.y, r * 0.4);
    EM.shake(16);
    SFX.smash();
    if (this.jumpShock) {
      EM.explosion(this.x, this.y, r * 1.7, this.jumpDmg * 0.5, null, { color: '#ffab40', life: 0.55 });
      EM.ring(this.x, this.y, r * 1.9, '#ffab40', 0.7);
    }
  }

  /* ---------------- ram ---------------- */

  startRam(dist, speed, dmg, width, knock, trail) {
    this.ramSpeed = speed;
    this.ramDur = dist / speed;
    this.ramT = this.ramDur;
    this.ramAng = this.aim;
    this.ramDmg = dmg;
    this.ramWidth = width;
    this.ramKnock = knock;
    this.ramTrail = !!trail;
    this.ramHit.length = 0;
    // shrug off chip damage mid-charge, but not enough to use as a panic button
    this.invulnT = Math.max(this.invulnT, this.ramDur * 0.6);
    EM.ring(this.x, this.y, this.radius * 3, '#ffab40', 0.35);
    EM.dust(this.x, this.y, 12, 1.4);
    EM.shake(6);
    SFX.smash();
  }

  // Everything in the plow path takes one full hit, then goes on the ignore
  // list so a long charge cannot chew the same tower over and over.
  ramStep(dt) {
    const c = G.city;
    if (!c) return;
    const r = this.radius * this.ramWidth;

    // fresh array, not the city scratch buffer: damage here can explode,
    // and an explosion runs its own queries
    const list = c.grid.queryCircle(this.x, this.y, r, []);
    for (let i = 0; i < list.length; i++) {
      const o = list[i];
      if (o.dead || this.ramHit.indexOf(o) >= 0) continue;
      this.ramHit.push(o);
      c.damage(o, this.ramDmg, { fromX: this.x, fromY: this.y });
      EM.dust(o.x, o.y, 6, 1.2);
      if (this.ramTrail) {
        EM.explosion(o.x, o.y, 96, this.ramDmg * 0.35, null, { color: '#ffab40', life: 0.3 });
      }
    }

    const es = Enemies.list;
    for (let i = 0; i < es.length; i++) {
      const e = es[i];
      if (e.dead || this.ramHit.indexOf(e) >= 0) continue;
      if (U.dist(this.x, this.y, e.x, e.y) > r + e.r) continue;
      this.ramHit.push(e);
      e.hurt(this.ramDmg);
      e.knock(Math.cos(this.ramAng) * this.ramKnock, Math.sin(this.ramAng) * this.ramKnock);
      EM.spark(e.x, e.y, 7, '#ffd54f');
      EM.hitStop = Math.max(EM.hitStop, 0.04);
    }

    c.blastTraffic(this.x, this.y, r);

    // dust kicked up behind the heels
    if (U.chance(dt * 46)) {
      EM.dust(this.x - Math.cos(this.ramAng) * this.radius,
              this.y - Math.sin(this.ramAng) * this.radius, 1, 1.3);
    }
  }

  endRam() {
    this.ramT = 0;
    this.ramHit.length = 0;
    // carry some momentum out of the charge instead of dead-stopping
    this.vx = Math.cos(this.ramAng) * this.ramSpeed * 0.3;
    this.vy = Math.sin(this.ramAng) * this.ramSpeed * 0.3;
    EM.dust(this.x, this.y, 10, 1.5);
    EM.shake(5);
  }

  // Walking through the city grinds it down. Small enough buildings just pop.
  crush(dt) {
    const c = G.city;
    if (!c) return;
    const ch = this.crushHeight;
    const list = c.queryCircle(this.x, this.y, this.radius);

    for (let i = 0; i < list.length; i++) {
      const o = list[i];
      if (o.dead) continue;

      if (o.h <= ch) {
        c.destroy(o);
        EM.dust(o.x, o.y, 8, 1);
        continue;
      }

      let f = ch > 0 ? U.clamp(ch / o.h, 0, 1) : 0;
      if (o.isProp) f = Math.max(f, 0.6);

      // Plowing: a building too tall to crush outright still gets torn up as
      // you barge through it, in proportion to how fast you are moving.
      let plow = 0;
      if (!CFG.COLLIDE.player) {
        const sf = Math.hypot(this.vx, this.vy) / Math.max(1, this.speed);
        if (sf > CFG.PLOW.minSpeedFrac) plow = CFG.PLOW.dps * sf;
      }
      if (f <= 0 && plow <= 0) continue;

      c.damage(o, o.maxHp * (CFG.PLAYER.crushDps * f * f + plow) * dt,
               { fromX: this.x, fromY: this.y });
      const rate = 14 + plow * CFG.PLOW.dustRate;
      if (U.chance(dt * rate)) EM.dust(o.x + U.rand(-o.w / 2, o.w / 2), o.y + U.rand(-o.d / 2, o.d / 2), 1, 0.7);
    }
  }

  /* ---------------- save / load ---------------- */

  serialize() {
    const ab = {};
    for (const k in this.abilities) ab[k] = this.abilities[k].rank;
    return { level: this.level, xp: this.xp, hp: Math.round(this.hp),
             abilities: ab, pending: this.pendingUpgrades };
  }

  restore(data) {
    this.level = Math.max(1, data.level | 0 || 1);
    this.xp = Math.max(0, data.xp || 0);
    this.pendingUpgrades = data.pending | 0;
    this.recompute();
    // never resume into an instant death
    this.hp = data.hp ? U.clamp(data.hp, this.maxHp * 0.25, this.maxHp) : this.maxHp;
    this.abilities = {};
    const ab = data.abilities || {};
    for (const k in ab) {
      if (ABILITY_DEFS[k]) this.abilities[k] = AbilitySys.freshState(k, U.clamp(ab[k] | 0, 1, 5));
    }
    if (!Object.keys(this.abilities).length) {
      this.abilities[STARTING_ABILITY] = AbilitySys.freshState(STARTING_ABILITY, 1);
    }
  }
}
