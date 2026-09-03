'use strict';
/* ============================================================
   Military resistance. Global: Enemies
   ============================================================ */

class Enemy {
  constructor(type, x, y, tierNum) {
    const d = ENEMY_DEFS[type];
    this.type = type;
    this.def = d;
    this.isEnemy = true;

    const scale = 1 + (tierNum - 1) * 0.45;
    this.maxHp = d.hp * scale;
    this.hp = this.maxHp;
    this.dmg = d.dmg * (1 + (tierNum - 1) * 0.22);
    this.xp = d.xp * scale;
    this.score = d.score;

    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.kx = 0; this.ky = 0;     // knockback velocity
    this.r = d.r;
    this.ang = 0;
    this.cd = U.rand(0.3, d.cd || 1);
    this.dead = false;
    this.hitT = 0;
    this.t = U.rand(0, 100);
    this.boss = !!d.boss;
    this.bombs = d.bombs || 0;
    this.bombT = 0;
    this.orbitDir = U.chance(0.5) ? 1 : -1;
    this.rotor = 0;

    // cryo
    this.slowT = 0;
    this.slowMul = 1;
    this.brittle = 1;
  }

  // Frozen things move and shoot slower, and crack easier when hit.
  chill(time, mul, brittle) {
    this.slowT = Math.max(this.slowT, time);
    this.slowMul = Math.min(this.slowMul, mul);
    this.brittle = Math.max(this.brittle, brittle || 1);
    EM.spark(this.x, this.y, 3, '#b3e5fc');
  }

  hurt(dmg) {
    if (this.dead) return;
    if (this.slowT > 0) dmg *= this.brittle;
    this.hp -= dmg;
    this.hitT = 0.1;
    EM.spark(this.x, this.y, 2, '#ffab91');
    if (this.hp <= 0) this.die();
  }

  knock(vx, vy) { this.kx += vx; this.ky += vy; }

  die() {
    if (this.dead) return;
    this.dead = true;
    EM.explosion(this.x, this.y, this.r * (this.boss ? 6 : 3.2), this.boss ? 400 : 30, null,
                 { color: this.def.accent });
    G.addScore(this.score);
    G.player.addXP(this.xp);
    EM.text(this.x, this.y - this.r - 8, '+' + Math.round(this.xp), '#4dd0e1');

    // repair nanites top you up on every kill
    const nan = G.player.passive('nanites');
    if (nan && nan.onKill) G.player.heal(G.player.maxHp * nan.onKill);
    if (this.boss) { UI.toast('RIVAL MECH DESTROYED', '#ff80d5'); EM.shake(26); }
  }

  update(dt) {
    if (this.dead) return;
    const p = G.player;
    this.t += dt;
    if (this.hitT > 0) this.hitT -= dt;

    // knockback decays fast
    this.x += this.kx * dt; this.y += this.ky * dt;
    this.kx *= (1 - Math.min(1, dt * 5)); this.ky *= (1 - Math.min(1, dt * 5));

    // being frozen slows the whole machine down - driving and shooting alike
    let adt = dt;
    if (this.slowT > 0) {
      this.slowT -= dt;
      adt = dt * this.slowMul;
      if (this.slowT <= 0) { this.slowT = 0; this.slowMul = 1; this.brittle = 1; }
      else if (U.chance(dt * 6)) EM.spark(this.x, this.y, 1, '#b3e5fc');
    }

    switch (this.def.ai) {
      case 'ram':    this.aiRam(adt, p);    break;
      case 'shoot':  this.aiShoot(adt, p);  break;
      case 'strafe': this.aiStrafe(adt, p); break;
      case 'pass':   this.aiPass(adt, p);   break;
      case 'boss':   this.aiBoss(adt, p);   break;
    }

    // ground vehicles drive around buildings, not through them
    if (CFG.COLLIDE.enemies && this.def.ai !== 'strafe' && this.def.ai !== 'pass') {
      this.collide();
    }
  }

  collide() {
    const c = G.city;
    if (!c) return;
    const list = c.queryCircle(this.x, this.y, this.r);
    for (let i = 0; i < list.length; i++) {
      const o = list[i];
      if (o.dead || o.isProp) continue;
      const hw = o.w / 2, hd = o.d / 2;
      const nx = U.clamp(this.x, o.x - hw, o.x + hw);
      const ny = U.clamp(this.y, o.y - hd, o.y + hd);
      let dx = this.x - nx, dy = this.y - ny;
      const d = Math.hypot(dx, dy);
      if (d === 0 || d > this.r) {
        // wedged inside - shove out the short way
        const ox = (this.x < o.x ? -1 : 1) * (hw - Math.abs(this.x - o.x) + this.r);
        const oy = (this.y < o.y ? -1 : 1) * (hd - Math.abs(this.y - o.y) + this.r);
        if (Math.abs(ox) < Math.abs(oy)) this.x += ox; else this.y += oy;
        continue;
      }
      dx /= d; dy /= d;
      this.x += dx * (this.r - d);
      this.y += dy * (this.r - d);
      const into = this.vx * dx + this.vy * dy;
      if (into < 0) { this.vx -= dx * into; this.vy -= dy * into; }
    }
  }

  moveToward(dt, tx, ty, speed) {
    const a = U.angTo(this.x, this.y, tx, ty);
    this.ang = a;
    this.vx = U.damp(this.vx, Math.cos(a) * speed, 5, dt);
    this.vy = U.damp(this.vy, Math.sin(a) * speed, 5, dt);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  aiRam(dt, p) {
    this.moveToward(dt, p.x, p.y, this.def.speed);
    if (U.dist(this.x, this.y, p.x, p.y) < p.radius + this.r) {
      p.hurt(this.dmg);
      EM.explosion(this.x, this.y, 60, 0, null, { color: '#ff8a65' });
      this.dead = true;
      G.addScore(this.score);
      G.player.addXP(this.xp * 0.5);
    }
  }

  aiShoot(dt, p) {
    const d = U.dist(this.x, this.y, p.x, p.y);
    const want = this.def.range * 0.72;
    if (d > want * 1.1)      this.moveToward(dt, p.x, p.y, this.def.speed);
    else if (d < want * 0.6) this.moveToward(dt, this.x * 2 - p.x, this.y * 2 - p.y, this.def.speed * 0.7);
    else { this.vx *= 0.9; this.vy *= 0.9; this.ang = U.angTo(this.x, this.y, p.x, p.y); }

    this.cd -= dt;
    if (this.cd <= 0 && d < this.def.range) {
      this.cd = this.def.cd;
      // lead the shot
      const tof = d / this.def.shot;
      const a = U.angTo(this.x, this.y, p.x + p.vx * tof, p.y + p.vy * tof);
      EM.shell(this.x + Math.cos(a) * this.r, this.y + Math.sin(a) * this.r,
               a, this.def.shot, this.dmg, 58, '#ffab40', false);
      EM.spark(this.x + Math.cos(a) * this.r, this.y + Math.sin(a) * this.r, 4, '#ffca28');
    }
  }

  aiStrafe(dt, p) {
    this.rotor += dt * 30;
    const d = U.dist(this.x, this.y, p.x, p.y);
    const want = this.def.range * 0.8;
    const toP = U.angTo(this.x, this.y, p.x, p.y);
    const tangent = toP + Math.PI / 2 * this.orbitDir;
    const radial = (d - want) / Math.max(1, want);

    const sp = this.def.speed;
    const vx = Math.cos(tangent) * sp * 0.8 + Math.cos(toP) * sp * U.clamp(radial, -1, 1);
    const vy = Math.sin(tangent) * sp * 0.8 + Math.sin(toP) * sp * U.clamp(radial, -1, 1);
    this.vx = U.damp(this.vx, vx, 4, dt);
    this.vy = U.damp(this.vy, vy, 4, dt);
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.ang = toP;

    this.cd -= dt;
    if (this.cd <= 0 && d < this.def.range * 1.2) {
      this.cd = this.def.cd;
      for (let i = 0; i < 2; i++) {
        const a = toP + U.rand(-0.12, 0.12);
        EM.hostileBullet(this.x, this.y, a, this.def.shot, this.dmg * 0.6, '#ff7043', 5);
      }
    }
  }

  aiPass(dt, p) {
    // set a straight course once, then fly it and carpet-bomb along the way
    if (!this.course) {
      const a = U.angTo(this.x, this.y, p.x, p.y);
      this.course = a;
      this.ang = a;
    }
    this.x += Math.cos(this.course) * this.def.speed * dt;
    this.y += Math.sin(this.course) * this.def.speed * dt;
    this.ang = this.course;

    this.bombT -= dt;
    if (this.bombs > 0 && this.bombT <= 0 && U.dist(this.x, this.y, p.x, p.y) < 900) {
      this.bombT = 0.13;
      this.bombs--;
      EM.warning(this.x, this.y, 90, 0.9, this.dmg);
    }

    if (U.dist(this.x, this.y, p.x, p.y) > 2200) this.dead = true;
  }

  aiBoss(dt, p) {
    const d = U.dist(this.x, this.y, p.x, p.y);
    const want = this.def.range * 0.65;
    if (d > want) this.moveToward(dt, p.x, p.y, this.def.speed);
    else { this.vx *= 0.92; this.vy *= 0.92; this.ang = U.angTo(this.x, this.y, p.x, p.y); }

    this.cd -= dt;
    if (this.cd <= 0) {
      this.cd = this.def.cd;
      const a = U.angTo(this.x, this.y, p.x, p.y);
      if (U.chance(0.35)) {
        // shoulder rockets
        for (let i = -1; i <= 1; i++) {
          EM.shell(this.x, this.y, a + i * 0.16, this.def.shot, this.dmg * 0.8, 70, '#ff4081', false);
        }
      } else {
        for (let i = 0; i < 4; i++) {
          EM.hostileBullet(this.x, this.y, a + U.rand(-0.18, 0.18), this.def.shot * 1.2,
                           this.dmg * 0.45, '#ff80ab', 6);
        }
      }
    }

    // stomp when close
    if (d < p.radius + this.r + 30 && U.chance(dt * 0.8)) {
      EM.explosion(this.x, this.y, 150, this.dmg * 1.4, null, { hostile: true, color: '#ff4081' });
    }
  }
}

/* ============================================================ */

const Enemies = {
  list: [],
  timers: {},
  airT: 0,

  reset(city) {
    this.list.length = 0;
    this.timers = {};
    const def = city.def;
    for (const k in def.enemies) this.timers[k] = U.rand(2.5, 6);
    this.airT = def.airstrike ? def.airstrike * 0.8 : 0;
  },

  count(type) {
    let n = 0;
    for (const e of this.list) if (!e.dead && e.type === type) n++;
    return n;
  },

  spawnPoint(p, minR, maxR) {
    const a = U.rand(0, Math.PI * 2);
    const r = U.rand(minR, maxR);
    const c = G.city;
    return {
      x: U.clamp(p.x + Math.cos(a) * r, c.minX + 40, c.maxX - 40),
      y: U.clamp(p.y + Math.sin(a) * r, c.minY + 40, c.maxY - 40),
    };
  },

  spawn(type) {
    const p = G.player;
    const pt = this.spawnPoint(p, 700, 1050);
    const e = new Enemy(type, pt.x, pt.y, G.city.tierNum);
    this.list.push(e);
    if (e.boss) { UI.toast('WARNING: RIVAL MECH INBOUND', '#ff4081'); SFX.warn(); }
    return e;
  },

  update(dt) {
    const p = G.player;
    if (!p || p.dead) return;
    const def = G.city.def;

    for (const type in def.enemies) {
      const cfg = def.enemies[type];
      this.timers[type] -= dt;
      if (this.timers[type] <= 0) {
        this.timers[type] = cfg.rate * U.rand(0.75, 1.3);
        if (this.count(type) < cfg.max) this.spawn(type);
      }
    }

    if (def.airstrike > 0) {
      this.airT -= dt;
      if (this.airT <= 0) {
        this.airT = def.airstrike * U.rand(0.8, 1.25);
        this.callAirstrike();
      }
    }

    for (let i = this.list.length - 1; i >= 0; i--) {
      const e = this.list[i];
      e.update(dt);
      if (e.dead) this.list.splice(i, 1);
    }
  },

  callAirstrike() {
    const p = G.player;
    const a = U.rand(0, Math.PI * 2);
    const A = CFG.AIRSTRIKE;
    const step = A.radius * 1.5;
    const sx = p.x - Math.cos(a) * step * (A.count / 2);
    const sy = p.y - Math.sin(a) * step * (A.count / 2);
    for (let i = 0; i < A.count; i++) {
      EM.warning(sx + Math.cos(a) * step * i + U.rand(-25, 25),
                 sy + Math.sin(a) * step * i + U.rand(-25, 25),
                 A.radius, A.warn + i * A.spacing, A.dmg);
    }
    UI.toast('AIRSTRIKE INBOUND', '#ff7043');
  },
};
