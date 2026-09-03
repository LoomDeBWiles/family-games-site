'use strict';
/* ============================================================
   Camera + all canvas drawing. Global: Render
   Buildings are extruded top-down blocks (roof + two faces),
   sorted back-to-front by their south edge.
   ============================================================ */

const Render = {
  cv: null, ctx: null,
  W: 0, H: 0, dpr: 1,
  cam: { x: 0, y: 0, zoom: 1, sx: 0, sy: 0 },
  items: [],
  scratch: [],
  winBudget: 0,

  init() {
    this.cv = document.getElementById('game');
    this.ctx = this.cv.getContext('2d', { alpha: false });
    this.resize();
    window.addEventListener('resize', () => this.resize());
    // iOS reports the new size a beat after the rotation animation starts, and
    // hiding the Safari toolbars resizes the visual viewport without firing a
    // window resize at all.
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 250));
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => this.resize());
    }
  },

  resize() {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.cv.width = Math.floor(this.W * this.dpr);
    this.cv.height = Math.floor(this.H * this.dpr);
    this.cv.style.width = this.W + 'px';
    this.cv.style.height = this.H + 'px';
  },

  /* ---------------- camera ---------------- */

  updateCam(dt, snap) {
    const p = G.player;
    if (!p) return;
    const c = this.cam;
    // The floor adapts to the city: keep pulling back as the robot grows, but
    // never so far that a small city swims in empty space.
    const floor = G.city
      ? Math.max(CFG.CAM.min, this.W / (G.city.span * 1.6))
      : CFG.CAM.min;
    const wantZoom = U.clamp(CFG.CAM.baseZoom / (1 + p.radius / CFG.CAM.zoomK), floor, CFG.CAM.max);
    const lead = CFG.CAM.aimLead * (this.H / Math.max(0.2, wantZoom)) * 0.5;
    const tx = p.x + Math.cos(p.aim) * lead * 0.35;
    const ty = p.y + Math.sin(p.aim) * lead * 0.35;

    if (snap) { c.x = tx; c.y = ty; c.zoom = wantZoom; }
    else {
      c.x = U.damp(c.x, tx, CFG.CAM.follow, dt);
      c.y = U.damp(c.y, ty, CFG.CAM.follow, dt);
      c.zoom = U.damp(c.zoom, wantZoom, 2.2, dt);
    }

    const s = EM.shakeAmt;
    c.sx = s > 0 ? U.rand(-s, s) : 0;
    c.sy = s > 0 ? U.rand(-s, s) : 0;
  },

  screenToWorld(mx, my) {
    const c = this.cam;
    return { x: (mx - this.W / 2) / c.zoom + c.x, y: (my - this.H / 2) / c.zoom + c.y };
  },

  /* ---------------- frame ---------------- */

  draw() {
    const ctx = this.ctx, c = this.cam;
    const city = G.city;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = city ? city.def.sky : '#0b1119';
    ctx.fillRect(0, 0, this.W, this.H);
    if (!city || !G.player) return;

    ctx.setTransform(
      this.dpr * c.zoom, 0, 0, this.dpr * c.zoom,
      this.dpr * (this.W / 2 - c.x * c.zoom + c.sx),
      this.dpr * (this.H / 2 - c.y * c.zoom + c.sy)
    );

    const vw = this.W / c.zoom, vh = this.H / c.zoom;
    const L = c.x - vw / 2 - 80, R = c.x + vw / 2 + 80;
    const T = c.y - vh / 2 - 80, B = c.y + vh / 2 + 80;

    this.drawGround(ctx, city, L, T, R, B);
    this.drawDecals(ctx);

    // gather everything that needs depth sorting
    const items = this.items;
    items.length = 0;
    this.winBudget = 2600;

    // tall buildings poke far above their footprint, so reach further up
    const list = city.grid.queryRect(L, T - 40, R, B + 1400, this.scratch, true);
    for (let i = 0; i < list.length; i++) items.push({ y: list[i].y + list[i].d / 2, t: 0, o: list[i] });

    for (const e of Enemies.list) if (!e.dead) items.push({ y: e.y, t: 2, o: e });
    for (const s of EM.spiders) items.push({ y: s.y, t: 3, o: s });
    for (const d of EM.debris) items.push({ y: d.y, t: 4, o: d });
    for (const m of city.peds) if (m.x > L && m.x < R && m.y > T && m.y < B) items.push({ y: m.y, t: 5, o: m });
    for (const c2 of city.traffic) if (c2.x > L && c2.x < R && c2.y > T && c2.y < B) items.push({ y: c2.y, t: 7, o: c2 });
    for (const w of EM.saws) items.push({ y: w.y, t: 8, o: w });

    const dr = G.player.abilities.drones;
    if (dr) for (const d of dr.drones) if (d.state !== 'dead') items.push({ y: d.y, t: 6, o: d });

    items.push({ y: G.player.y, t: 1, o: G.player });

    items.sort((a, b) => a.y - b.y);

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      switch (it.t) {
        case 0: this.drawStruct(ctx, it.o); break;
        case 1: this.drawRobot(ctx, it.o); break;
        case 2: this.drawEnemy(ctx, it.o); break;
        case 3: this.drawSpider(ctx, it.o); break;
        case 4: this.drawDebris(ctx, it.o); break;
        case 5: this.drawPed(ctx, it.o); break;
        case 6: this.drawDrone(ctx, it.o); break;
        case 7: this.drawCar(ctx, it.o); break;
        case 8: this.drawSaw(ctx, it.o); break;
      }
    }

    this.drawProjectiles(ctx);
    this.drawFx(ctx);

    // ---- screen space ----
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.drawMinimap(ctx, city);
    this.drawVignette(ctx);

    if (EM.flash > 0) {
      ctx.fillStyle = 'rgba(255,255,240,' + (EM.flash * 0.85).toFixed(3) + ')';
      ctx.fillRect(0, 0, this.W, this.H);
    }
    if (G.player.hurtFlash > 0) {
      ctx.fillStyle = 'rgba(200,20,20,' + (G.player.hurtFlash * 0.28).toFixed(3) + ')';
      ctx.fillRect(0, 0, this.W, this.H);
    }
  },

  /* ---------------- ground + roads ---------------- */

  drawGround(ctx, city, L, T, R, B) {
    ctx.fillStyle = city.def.ground;
    ctx.fillRect(city.minX, city.minY, city.maxX - city.minX, city.maxY - city.minY);

    // outside the city limits
    ctx.fillStyle = '#0a0d12';
    if (L < city.minX) ctx.fillRect(L, T, city.minX - L, B - T);
    if (R > city.maxX) ctx.fillRect(city.maxX, T, R - city.maxX, B - T);
    if (T < city.minY) ctx.fillRect(L, T, R - L, city.minY - T);
    if (B > city.maxY) ctx.fillRect(L, city.maxY, R - L, B - city.maxY);

    // road grid
    const n = city.n, road = city.road, block = city.block;
    const start = -city.span / 2 + road;
    ctx.fillStyle = city.def.road;
    for (let i = 0; i <= n; i++) {
      const cpos = start - road + i * (block + road);
      if (cpos + road > L && cpos < R) ctx.fillRect(cpos, -city.span / 2, road, city.span);
      if (cpos + road > T && cpos < B) ctx.fillRect(-city.span / 2, cpos, city.span, road);
    }

    // sidewalks around every block
    ctx.strokeStyle = 'rgba(190,195,200,.10)';
    ctx.lineWidth = 9;
    ctx.beginPath();
    for (let by = 0; by < n; by++) {
      for (let bx = 0; bx < n; bx++) {
        const ox = start + bx * (block + road), oy = start + by * (block + road);
        if (ox > R || ox + block < L || oy > B || oy + block < T) continue;
        ctx.rect(ox - 5, oy - 5, block + 10, block + 10);
      }
    }
    ctx.stroke();

    // centre lines
    ctx.strokeStyle = 'rgba(255,235,150,.13)';
    ctx.lineWidth = 2;
    ctx.setLineDash([16, 20]);
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const cpos = start - road / 2 + i * (block + road);
      ctx.moveTo(cpos, -city.span / 2); ctx.lineTo(cpos, city.span / 2);
      ctx.moveTo(-city.span / 2, cpos); ctx.lineTo(city.span / 2, cpos);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  },

  drawDecals(ctx) {
    // scorch marks and craters, oldest first
    for (const s of EM.decals) {
      ctx.fillStyle = 'rgba(12,10,9,' + s.a.toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.fill();
      ctx.fillStyle = 'rgba(40,32,26,' + (s.a * 0.5).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 1.35, 0, 6.2832); ctx.fill();
    }

    for (const f of EM.fissures) {
      const k = 1 - f.t / f.life;
      ctx.fillStyle = 'rgba(20,8,4,' + (0.7 * k).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = 'rgba(255,120,40,' + (0.55 * k).toFixed(3) + ')';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 0.82, 0, 6.2832); ctx.stroke();
    }

    for (const w of EM.warns) {
      const k = U.clamp(w.t / w.dur, 0, 1);
      const pulse = 0.35 + 0.4 * Math.abs(Math.sin(w.t * 14));
      const rgb = w.friendly ? '90,190,255' : '255,60,40';
      ctx.strokeStyle = 'rgba(' + rgb + ',' + pulse.toFixed(3) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, 6.2832); ctx.stroke();
      ctx.fillStyle = 'rgba(' + rgb + ',.10)';
      ctx.beginPath(); ctx.arc(w.x, w.y, w.r * k, 0, 6.2832); ctx.fill();
    }

    // ---- proximity mines: a dish on the tarmac with a blinking light ----
    for (const m of EM.mines) {
      const armed = m.arm <= 0;
      ctx.fillStyle = 'rgba(20,22,26,.85)';
      ctx.beginPath(); ctx.arc(m.x, m.y, 7, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = armed ? 'rgba(255,90,60,.75)' : 'rgba(120,130,140,.6)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(m.x, m.y, m.trigger, 0, 6.2832); ctx.stroke();
      if (armed && Math.sin(m.blink * 9) > 0) {
        ctx.fillStyle = '#ff5252';
        ctx.beginPath(); ctx.arc(m.x, m.y, 3.2, 0, 6.2832); ctx.fill();
      }
    }
  },

  /* ---------------- structures ---------------- */

  quad(ctx, ax, ay, bx, by, cx, cy, dx, dy, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy); ctx.lineTo(dx, dy);
    ctx.closePath(); ctx.fill();
  },

  drawStruct(ctx, o) {
    const V = CFG.VIEW;
    const hw = o.w / 2, hd = o.d / 2;
    const base = o.baseZ || 0;

    let h = o.h;
    if (o.dead) h = U.lerp(o.h, Math.min(12, o.h * 0.09), o.fall);
    h += base;

    let ox = U.clamp((o.x - this.cam.x) * V.hSpread, -V.spreadMax, V.spreadMax) * h;
    let oy = -h * V.hUp;
    // a collapsing building topples away from whatever hit it
    if (o.dead && o.pushX !== undefined) {
      ox += o.pushX * o.fall * h * 0.30;
      oy += o.pushY * o.fall * h * 0.30 * V.hUp;
    }

    // corners
    const ax = o.x - hw, ay = o.y - hd;   // NW
    const bx = o.x + hw, by = o.y - hd;   // NE
    const cx = o.x + hw, cy = o.y + hd;   // SE
    const dx = o.x - hw, dy = o.y + hd;   // SW

    const hpF = o.dead ? 0 : U.clamp(o.hp / o.maxHp, 0, 1);
    const dmgDark = o.dead ? -0.55 : -(1 - hpF) * 0.33;

    let wall = U.shade(o.wall, dmgDark);
    let roof = U.shade(o.roof, dmgDark);
    if (o.hitT > 0) { wall = '#ffffff'; roof = '#ffffff'; }

    // ground shadow
    ctx.fillStyle = 'rgba(0,0,0,.30)';
    ctx.fillRect(ax + 3, ay + 3, o.w, o.d);

    // side face (only one is ever visible)
    if (ox < 0) {
      this.quad(ctx, cx, cy, bx, by, bx + ox, by + oy, cx + ox, cy + oy, U.shade(o.wall, dmgDark - 0.22));
    } else if (ox > 0) {
      this.quad(ctx, ax, ay, dx, dy, dx + ox, dy + oy, ax + ox, ay + oy, U.shade(o.wall, dmgDark - 0.22));
    }

    // south face
    this.quad(ctx, dx, dy, cx, cy, cx + ox, cy + oy, dx + ox, dy + oy, wall);

    // roof
    this.quad(ctx, ax + ox, ay + oy, bx + ox, by + oy, cx + ox, cy + oy, dx + ox, dy + oy, roof);

    // windows on the south face
    if (!o.dead && !o.isProp && o.win && this.winBudget > 0 && h * this.cam.zoom > 34) {
      this.drawWindows(ctx, o, dx, dy, ox, oy, h);
    }

    // structural damage: cracks across the face as it gets chewed up
    if (!o.dead && !o.isProp && hpF < 0.7) {
      const n = hpF < 0.35 ? 4 : 2;
      ctx.strokeStyle = 'rgba(0,0,0,' + (0.55 * (1 - hpF)).toFixed(2) + ')';
      ctx.lineWidth = Math.max(1, o.w * 0.03);
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const u = ((o.seed * (i + 2) * 53) % 100) / 100;
        const x0 = dx + o.w * u, y0 = dy;
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0 + ox * 0.45 + (u - 0.5) * o.w * 0.3, y0 + oy * 0.45);
        ctx.lineTo(x0 + ox * 0.85 + (0.5 - u) * o.w * 0.2, y0 + oy * 0.85);
      }
      ctx.stroke();
    }

    // fire glow on a burning building
    if (o.burn > 0 && !o.dead) {
      const flick = 0.45 + 0.3 * Math.sin(performance.now() / 70 + o.seed);
      this.quad(ctx, dx, dy, cx, cy, cx + ox, cy + oy, dx + ox, dy + oy,
                'rgba(255,110,35,' + (flick * 0.35).toFixed(3) + ')');
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(o.x + ox, o.y + oy, 0, o.x + ox, o.y + oy, Math.max(o.w, o.d));
      g.addColorStop(0, 'rgba(255,150,40,' + (flick * 0.5).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(255,80,20,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(o.x + ox, o.y + oy, Math.max(o.w, o.d), 0, 6.2832); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }

    // rooftop clutter makes tall blocks read as real buildings
    if (!o.dead && !o.isProp && o.h > 90 && h * this.cam.zoom > 60) {
      ctx.fillStyle = U.shade(o.roof, -0.28);
      const rw = o.w * 0.22, rd = o.d * 0.22;
      ctx.fillRect(o.x + ox - rw * 1.4, o.y + oy - rd * 0.6, rw, rd);
      if (((o.seed | 0) % 3) === 0) ctx.fillRect(o.x + ox + rw * 0.3, o.y + oy + rd * 0.2, rw * 0.8, rd * 0.8);
      if (((o.seed | 0) % 4) === 0) {
        ctx.strokeStyle = 'rgba(255,90,80,.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(o.x + ox, o.y + oy);
        ctx.lineTo(o.x + ox, o.y + oy - Math.min(30, o.h * 0.09));
        ctx.stroke();
      }
    }

    // rubble scatter once collapsed
    if (o.dead && o.fall >= 1) {
      ctx.fillStyle = 'rgba(0,0,0,.22)';
      const s = (o.seed | 0);
      for (let i = 0; i < 4; i++) {
        const rx = ax + ((s * (i + 3) * 37) % 100) / 100 * o.w;
        const ry = ay + ((s * (i + 7) * 53) % 100) / 100 * o.d;
        ctx.fillRect(rx, ry, o.w * 0.16, o.d * 0.16);
      }
    }
  },

  drawWindows(ctx, o, bxl, byl, ox, oy, h) {
    const cols = U.clamp(Math.floor(o.w / 15), 1, 10);
    const rows = U.clamp(Math.floor(h / 24), 1, 22);
    const n = cols * rows;
    if (n > this.winBudget) return;
    this.winBudget -= n;

    const du = 1 / cols, dv = 1 / rows;
    const wu = du * 0.52, wv = dv * 0.46;
    const seed = o.seed;
    ctx.fillStyle = o.win;
    ctx.globalAlpha = 0.55;

    for (let r = 0; r < rows; r++) {
      for (let cI = 0; cI < cols; cI++) {
        // deterministic pseudo-random "is this one lit"
        if (((seed * 7919 + r * 131 + cI * 419) % 100) / 100 > 0.62) continue;
        const u = (cI + 0.24) * du, v = (r + 0.27) * dv;
        const px = bxl + o.w * u + ox * v;
        const py = byl + oy * v;
        ctx.fillRect(px, py, o.w * wu, Math.max(1.4, -oy * wv));
      }
    }
    ctx.globalAlpha = 1;
  },

  /* ---------------- the robot ---------------- */

  drawRobot(ctx, p) {
    const r = p.radius;
    const squash = 1 - p.smashAnim * 0.28;
    const bob = Math.sin(p.walk * 2) * r * 0.06;

    // shadow - shrinks and darkens away while airborne
    const air = U.clamp((p.jumpZ || 0) / 130, 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,' + (0.42 - air * 0.24).toFixed(2) + ')';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + r * 0.30, r * (1.05 - air * 0.35), r * (0.62 - air * 0.2), 0, 0, 6.2832);
    ctx.fill();

    // ram: motion streaks dragged out behind the charge
    const dash = p.ramT > 0 ? U.clamp(p.ramT / Math.max(0.001, p.ramDur), 0, 1) : 0;
    if (dash > 0) {
      const back = p.ramAng + Math.PI;
      const side = back + Math.PI / 2;
      ctx.strokeStyle = 'rgba(255,200,90,' + (0.22 + dash * 0.38).toFixed(2) + ')';
      ctx.lineWidth = Math.max(2, r * 0.14);
      ctx.beginPath();
      for (let i = -1; i <= 1; i++) {
        const sx = p.x + Math.cos(side) * i * r * 0.7;
        const sy = p.y + Math.sin(side) * i * r * 0.7;
        const len = r * (2.6 + (1 - Math.abs(i)) * 0.9);
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(back) * len, sy + Math.sin(back) * len);
      }
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(p.x, p.y - r * 0.34 * CFG.VIEW.hUp * 2 + bob - (p.jumpZ || 0) * CFG.VIEW.hUp);
    ctx.rotate(p.face + Math.PI / 2);
    // the body stretches along the direction of travel while ramming
    ctx.scale(1 - dash * 0.15, squash * (1 + dash * 0.28));

    const body = p.hurtFlash > 0.05 ? '#ff8a80' : '#546e7a';
    const trim = p.levelFlash > 0.05 ? '#4dd0e1' : '#37474f';

    // legs
    const step = Math.sin(p.walk * 2) * r * 0.30;
    ctx.fillStyle = '#37474f';
    this.rrect(ctx, -r * 0.62, -r * 0.16 + step, r * 0.40, r * 0.95, r * 0.13);
    this.rrect(ctx,  r * 0.22, -r * 0.16 - step, r * 0.40, r * 0.95, r * 0.13);

    // torso
    ctx.fillStyle = trim;
    this.rrect(ctx, -r * 0.86, -r * 0.92, r * 1.72, r * 1.30, r * 0.22);
    ctx.fillStyle = body;
    this.rrect(ctx, -r * 0.72, -r * 0.86, r * 1.44, r * 1.12, r * 0.20);

    // chest reactor
    const glow = 0.5 + 0.5 * Math.sin(p.walk * 3);
    ctx.fillStyle = 'rgba(120,230,255,' + (0.45 + glow * 0.4).toFixed(2) + ')';
    ctx.beginPath(); ctx.arc(0, -r * 0.26, r * 0.24, 0, 6.2832); ctx.fill();

    // shoulder pods
    ctx.fillStyle = '#455a64';
    this.rrect(ctx, -r * 1.10, -r * 0.94, r * 0.42, r * 0.60, r * 0.12);
    this.rrect(ctx,  r * 0.68, -r * 0.94, r * 0.42, r * 0.60, r * 0.12);

    // head
    ctx.fillStyle = '#607d8b';
    this.rrect(ctx, -r * 0.40, -r * 1.42, r * 0.80, r * 0.62, r * 0.16);

    // visor / jaw
    const jaw = p.chompAnim;
    ctx.fillStyle = '#ff5252';
    if (jaw > 0.02) {
      ctx.fillStyle = '#ffca28';
      ctx.fillRect(-r * 0.30, -r * 1.26, r * 0.60, r * 0.14);
      ctx.fillStyle = '#b71c1c';
      ctx.fillRect(-r * 0.26, -r * 1.10, r * 0.52, r * 0.20 * jaw + r * 0.05);
    } else {
      ctx.fillStyle = 'rgba(255,80,80,.95)';
      ctx.fillRect(-r * 0.30, -r * 1.24, r * 0.60, r * 0.16);
    }

    ctx.restore();

    // arm cannon follows the mouse
    ctx.save();
    ctx.translate(p.x, p.y - r * 0.34 * CFG.VIEW.hUp * 2 + bob - (p.jumpZ || 0) * CFG.VIEW.hUp);
    ctx.rotate(p.aim);
    ctx.fillStyle = '#78909c';
    this.rrect(ctx, r * 0.35, -r * 0.20, r * 0.95, r * 0.40, r * 0.10);
    ctx.fillStyle = '#37474f';
    this.rrect(ctx, r * 1.05, -r * 0.13, r * 0.36, r * 0.26, r * 0.06);
    ctx.restore();

    // level-up flare
    if (p.levelFlash > 0.02) {
      ctx.strokeStyle = 'rgba(80,220,240,' + p.levelFlash.toFixed(2) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(p.x, p.y, r * (1.4 + (1 - p.levelFlash) * 2.6), 0, 6.2832); ctx.stroke();
    }
    // invulnerability shimmer
    if (p.invulnT > 0) {
      ctx.strokeStyle = 'rgba(255,255,255,.35)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x, p.y, r * 1.2, 0, 6.2832); ctx.stroke();
    }
  },

  rrect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  },

  /* ---------------- enemies ---------------- */

  drawEnemy(ctx, e) {
    const r = e.r;
    const flash = e.hitT > 0;

    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath(); ctx.ellipse(e.x, e.y + r * 0.4, r, r * 0.55, 0, 0, 6.2832); ctx.fill();

    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.ang);
    const col = flash ? '#ffffff' : e.def.color;

    if (e.type === 'police') {
      ctx.fillStyle = col; this.rrect(ctx, -r * 0.6, -r * 0.9, r * 1.2, r * 1.8, r * 0.3);
      ctx.fillStyle = (Math.floor(e.t * 8) % 2) ? '#ff5252' : '#448aff';
      ctx.fillRect(-r * 0.5, -r * 0.15, r, r * 0.3);

    } else if (e.type === 'tank') {
      ctx.fillStyle = '#2f3a28';
      ctx.fillRect(-r * 0.95, -r, r * 0.34, r * 2);
      ctx.fillRect(r * 0.61, -r, r * 0.34, r * 2);
      ctx.fillStyle = col; this.rrect(ctx, -r * 0.7, -r * 0.95, r * 1.4, r * 1.9, r * 0.16);
      ctx.fillStyle = flash ? '#fff' : e.def.accent;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.5, 0, 6.2832); ctx.fill();
      ctx.fillRect(r * 0.2, -r * 0.13, r * 1.35, r * 0.26);

    } else if (e.type === 'heli') {
      ctx.fillStyle = col; this.rrect(ctx, -r * 0.5, -r * 1.0, r, r * 1.9, r * 0.4);
      ctx.fillStyle = '#263238'; ctx.fillRect(-r * 0.14, r * 0.7, r * 0.28, r * 1.1);
      ctx.strokeStyle = 'rgba(200,220,235,.55)'; ctx.lineWidth = 2.4;
      ctx.save(); ctx.rotate(e.rotor);
      ctx.beginPath();
      ctx.moveTo(-r * 2.1, 0); ctx.lineTo(r * 2.1, 0);
      ctx.moveTo(0, -r * 2.1); ctx.lineTo(0, r * 2.1);
      ctx.stroke(); ctx.restore();

    } else if (e.type === 'jet') {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(r * 1.6, 0); ctx.lineTo(-r * 0.8, -r * 0.9);
      ctx.lineTo(-r * 0.3, 0); ctx.lineTo(-r * 0.8, r * 0.9);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffab40';
      ctx.fillRect(-r * 0.9, -r * 0.14, r * 0.3, r * 0.28);

    } else { // mech
      ctx.fillStyle = '#2b1b26';
      this.rrect(ctx, -r * 0.75, -r * 0.2, r * 0.45, r * 1.1, r * 0.12);
      this.rrect(ctx,  r * 0.30, -r * 0.2, r * 0.45, r * 1.1, r * 0.12);
      ctx.fillStyle = col; this.rrect(ctx, -r * 0.85, -r * 1.0, r * 1.7, r * 1.3, r * 0.24);
      ctx.fillStyle = flash ? '#fff' : e.def.accent;
      ctx.beginPath(); ctx.arc(0, -r * 0.35, r * 0.30, 0, 6.2832); ctx.fill();
      ctx.fillStyle = '#37474f'; this.rrect(ctx, -r * 0.35, -r * 1.5, r * 0.7, r * 0.55, r * 0.14);
      ctx.fillStyle = '#ff1744'; ctx.fillRect(-r * 0.24, -r * 1.36, r * 0.48, r * 0.14);
      ctx.fillStyle = '#4a2a3e'; ctx.fillRect(r * 0.5, -r * 0.5, r * 1.3, r * 0.26);
    }
    ctx.restore();

    // hp pip for anything that isn't a one-shot
    if (!e.boss && e.hp < e.maxHp) {
      const w = r * 2;
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(e.x - w / 2, e.y - r * 1.9, w, 3);
      ctx.fillStyle = '#ff5252'; ctx.fillRect(e.x - w / 2, e.y - r * 1.9, w * (e.hp / e.maxHp), 3);
    }
  },

  drawSpider(ctx, s) {
    const r = 7;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.ang);
    ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const off = Math.sin(s.leg + i * 1.7) * r * 0.5;
      const yy = (i - 1) * r * 0.55;
      ctx.moveTo(0, yy); ctx.lineTo(-r * 1.5, yy + off);
      ctx.moveTo(0, yy); ctx.lineTo(r * 1.5, yy - off);
    }
    ctx.stroke();
    ctx.fillStyle = '#455a64';
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.9, r * 0.65, 0, 0, 6.2832); ctx.fill();
    ctx.fillStyle = '#ff5252';
    ctx.beginPath(); ctx.arc(r * 0.5, 0, r * 0.22, 0, 6.2832); ctx.fill();
    ctx.restore();
  },

  drawDrone(ctx, d) {
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.a * 2);
    ctx.fillStyle = d.state === 'dive' ? '#ff5252' : '#4dd0e1';
    ctx.beginPath();
    ctx.moveTo(0, -7); ctx.lineTo(6, 0); ctx.lineTo(0, 7); ctx.lineTo(-6, 0);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(120,230,255,.35)';
    ctx.beginPath(); ctx.arc(0, 0, 11, 0, 6.2832); ctx.fill();
    ctx.restore();
  },

  drawCar(ctx, c) {
    const h = 14;
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.fillRect(c.x - c.w / 2 + 2, c.y - c.d / 2 + 2, c.w, c.d);

    ctx.save();
    ctx.translate(c.x, c.y - h * CFG.VIEW.hUp);
    if (!c.vert) ctx.rotate(Math.PI / 2);
    ctx.fillStyle = U.shade(c.color, -0.3);
    this.rrect(ctx, -c.w / 2, -c.d / 2, c.w, c.d, 3);
    ctx.fillStyle = c.color;
    this.rrect(ctx, -c.w / 2 + 1.5, -c.d / 2 + 2, c.w - 3, c.d - 4, 2.5);
    // windscreen
    ctx.fillStyle = 'rgba(180,220,240,.5)';
    ctx.fillRect(-c.w / 2 + 3, -c.d * 0.16, c.w - 6, c.d * 0.28);
    // headlights, pointing the way it drives
    ctx.fillStyle = c.panic > 0 ? '#fff59d' : '#ffe082';
    const front = c.sgn > 0 ? c.d / 2 - 2 : -c.d / 2;
    ctx.fillRect(-c.w / 2 + 2, front, 3, 2.5);
    ctx.fillRect(c.w / 2 - 5, front, 3, 2.5);
    ctx.restore();
  },

  drawSaw(ctx, w) {
    const t = performance.now() / 40;
    ctx.save();
    ctx.translate(w.x, w.y);
    ctx.rotate(t);
    ctx.fillStyle = '#cfd8dc';
    ctx.beginPath();
    const teeth = 8;
    for (let i = 0; i < teeth * 2; i++) {
      const a = (i / (teeth * 2)) * 6.2832;
      const r = (i % 2 === 0) ? w.size : w.size * 0.72;
      const px = Math.cos(a) * r, py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#455a64';
    ctx.beginPath(); ctx.arc(0, 0, w.size * 0.32, 0, 6.2832); ctx.fill();
    ctx.restore();
  },

  drawPed(ctx, m) {
    ctx.fillStyle = m.panic > 0 ? '#ffcc80' : '#90a4ae';
    ctx.fillRect(m.x - 1.6, m.y - 4.5, 3.2, 6);
  },

  drawDebris(ctx, d) {
    ctx.save();
    ctx.translate(d.x, d.y - d.z * CFG.VIEW.hUp);
    ctx.rotate(d.rot);
    ctx.globalAlpha = U.clamp(d.life, 0, 1);
    ctx.fillStyle = d.color;
    ctx.fillRect(-d.size / 2, -d.size / 2, d.size, d.size);
    ctx.restore();
    ctx.globalAlpha = 1;
  },

  /* ---------------- projectiles + fx ---------------- */

  drawProjectiles(ctx) {
    ctx.lineCap = 'round';

    ctx.lineWidth = 2.4;
    for (const b of EM.bullets) {
      ctx.strokeStyle = b.color;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - b.vx * 0.012, b.y - b.vy * 0.012);
      ctx.stroke();
    }
    ctx.lineWidth = 3;
    for (const b of EM.hostiles) {
      ctx.strokeStyle = b.color;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - b.vx * 0.014, b.y - b.vy * 0.014);
      ctx.stroke();
    }

    for (const m of EM.missiles) {
      ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(m.ang);
      ctx.fillStyle = '#eceff1'; ctx.fillRect(-6, -2, 12, 4);
      ctx.fillStyle = '#ff7043'; ctx.fillRect(-9, -1.6, 4, 3.2);
      ctx.restore();
    }

    for (const s of EM.shells) {
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.ang);
      ctx.fillStyle = s.color; ctx.fillRect(-7, -3, 14, 6);
      ctx.restore();
    }

    // nuke: reticle at the target, warhead in transit
    for (const n of EM.nukes) {
      const k = n.t / n.dur;
      const x = U.lerp(n.sx, n.tx, k);
      const y = U.lerp(n.sy, n.ty, k) - Math.sin(k * Math.PI) * 260;
      ctx.strokeStyle = 'rgba(255,80,60,.85)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(n.tx, n.ty, n.radius * (0.25 + k * 0.75), 0, 6.2832); ctx.stroke();
      ctx.beginPath(); ctx.arc(n.tx, n.ty, 14, 0, 6.2832); ctx.stroke();
      ctx.fillStyle = '#fff59d';
      ctx.beginPath(); ctx.arc(x, y, 7, 0, 6.2832); ctx.fill();
    }

    // mortar: shell arcs over the rooftops, shadow tracks the impact point
    for (const m of EM.mortars) {
      const k = m.t / m.dur;
      const x = U.lerp(m.sx, m.tx, k);
      const y = U.lerp(m.sy, m.ty, k) - Math.sin(k * Math.PI) * 150;
      ctx.strokeStyle = 'rgba(255,183,77,.5)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(m.tx, m.ty, m.radius * (0.2 + k * 0.8), 0, 6.2832); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,.35)';
      ctx.beginPath(); ctx.arc(U.lerp(m.sx, m.tx, k), U.lerp(m.sy, m.ty, k), 4, 0, 6.2832); ctx.fill();
      ctx.fillStyle = '#ffb74d';
      ctx.beginPath(); ctx.arc(x, y, 5, 0, 6.2832); ctx.fill();
    }
  },

  drawFx(ctx) {
    // ---- deflector bubble ----
    const pl = G.player;
    if (pl && !pl.dead && pl.shield > 0.5) {
      const k = pl.shield / Math.max(1, pl.shieldMax);
      ctx.strokeStyle = 'rgba(128,216,255,' + (0.18 + 0.45 * k + 0.3 * pl.shieldFlash).toFixed(3) + ')';
      ctx.lineWidth = 2 + 2 * k;
      ctx.beginPath(); ctx.arc(pl.x, pl.y - pl.jumpZ, pl.radius * 2.1, 0, 6.2832); ctx.stroke();
    }

    // ---- singularities ----
    for (const w of EM.wells) {
      const k = U.clamp(w.t / w.life, 0, 1);
      const pulse = 1 - Math.abs(Math.sin(w.t * 3)) * 0.12;
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, w.radius);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(0.30, 'rgba(90,40,180,.75)');
      g.addColorStop(0.75, 'rgba(179,136,255,.28)');
      g.addColorStop(1, 'rgba(120,80,220,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(w.x, w.y, w.radius * pulse, 0, 6.2832); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      ctx.fillStyle = '#05030a';
      ctx.beginPath(); ctx.arc(w.x, w.y, w.radius * 0.2 * (1 - k * 0.4), 0, 6.2832); ctx.fill();

      ctx.strokeStyle = 'rgba(179,136,255,.7)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const a = w.spin + i * 2.1;
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.radius * (0.35 + i * 0.2), a, a + 1.5);
        ctx.stroke();
      }
    }

    // ---- flamethrower cone ----
    ctx.globalCompositeOperation = 'lighter';
    for (const f of EM.flames) {
      const k = 1 - f.t / f.life;
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.range);
      g.addColorStop(0, 'rgba(255,245,180,' + (0.55 * k).toFixed(3) + ')');
      g.addColorStop(0.45, 'rgba(255,140,40,' + (0.40 * k).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(200,40,10,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(f.x, f.y);
      ctx.arc(f.x, f.y, f.range, f.ang - f.arc, f.ang + f.arc);
      ctx.closePath(); ctx.fill();
    }

    // ---- chain lightning ----
    for (const a of EM.arcs) {
      const k = 1 - a.t / a.life;
      ctx.strokeStyle = 'rgba(190,240,255,' + k.toFixed(3) + ')';
      ctx.lineWidth = 3.5 * k + 1;
      ctx.beginPath();
      ctx.moveTo(a.x1, a.y1);
      const segs = 5;
      for (let i = 1; i < segs; i++) {
        const t = i / segs;
        const jx = Math.sin(a.seed + i * 9.1) * 16;
        const jy = Math.cos(a.seed + i * 5.7) * 16;
        ctx.lineTo(U.lerp(a.x1, a.x2, t) + jx, U.lerp(a.y1, a.y2, t) + jy);
      }
      ctx.lineTo(a.x2, a.y2);
      ctx.stroke();
    }

    // ---- railgun ----
    for (const r of EM.rails) {
      const k = 1 - r.t / r.life;
      ctx.strokeStyle = 'rgba(140,220,255,' + (0.35 * k).toFixed(3) + ')';
      ctx.lineWidth = r.w * 3.5 * k;
      ctx.beginPath(); ctx.moveTo(r.x1, r.y1); ctx.lineTo(r.x2, r.y2); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,' + k.toFixed(3) + ')';
      ctx.lineWidth = r.w * k;
      ctx.beginPath(); ctx.moveTo(r.x1, r.y1); ctx.lineTo(r.x2, r.y2); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';

    // beams
    for (const b of EM.beams) {
      const k = 1 - b.t / b.life;
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(120,220,240,' + (0.30 * k).toFixed(3) + ')';
      ctx.lineWidth = b.w * 3.2;
      ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.95 * k).toFixed(3) + ')';
      ctx.lineWidth = b.w * k;
      ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }

    // particles
    ctx.globalCompositeOperation = 'lighter';
    for (const p of EM.particles) {
      const a = U.clamp(p.life / p.max, 0, 1);
      if (p.kind === 'smoke') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(150,155,160,' + (a * 0.30).toFixed(3) + ')';
      } else {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
      }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 6.2832); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.globalCompositeOperation = 'source-over';

    // explosions
    ctx.globalCompositeOperation = 'lighter';
    for (const e of EM.explosions) {
      const k = 1 - e.t / e.life;
      const g = ctx.createRadialGradient(e.x, e.y, e.r * 0.1, e.x, e.y, e.r);
      g.addColorStop(0, 'rgba(255,255,220,' + (0.85 * k).toFixed(3) + ')');
      g.addColorStop(0.45, 'rgba(255,150,60,' + (0.55 * k).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(255,60,20,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, 6.2832); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    // rings
    for (const r of EM.rings) {
      const k = 1 - r.t / r.life;
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = k * 0.8;
      ctx.lineWidth = 4 * k + 1;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 6.2832); ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // vacuum streaks
    ctx.strokeStyle = 'rgba(255,214,80,.6)'; ctx.lineWidth = 2;
    for (const s of EM.sucks) {
      const k = s.t / s.life;
      ctx.globalAlpha = 1 - k;
      ctx.beginPath();
      ctx.moveTo(U.lerp(s.x, s.tx, k), U.lerp(s.y, s.ty, k));
      ctx.lineTo(U.lerp(s.x, s.tx, Math.max(0, k - 0.25)), U.lerp(s.y, s.ty, Math.max(0, k - 0.25)));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // floating text
    ctx.textAlign = 'center';
    for (const t of EM.texts) {
      const k = 1 - t.t / t.life;
      ctx.globalAlpha = k;
      ctx.fillStyle = t.color;
      ctx.font = 'bold 13px Consolas, monospace';
      ctx.fillText(t.str, t.x, t.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  },

  /* ---------------- minimap ---------------- */

  drawMinimap(ctx, city) {
    const S = Math.min(160, this.W * 0.17);
    const x0 = this.W - S - 14, y0 = this.H - S - 14;
    const span = (city.maxX - city.minX);
    const k = S / span;

    ctx.fillStyle = 'rgba(4,8,14,.78)';
    ctx.fillRect(x0, y0, S, S);
    ctx.strokeStyle = 'rgba(140,170,200,.3)'; ctx.lineWidth = 2;
    ctx.strokeRect(x0, y0, S, S);

    const all = city.all;
    ctx.fillStyle = 'rgba(120,190,220,.75)';
    for (let i = 0; i < all.length; i++) {
      const o = all[i];
      if (o.dead || o.isProp) continue;
      ctx.fillRect(x0 + (o.x - city.minX) * k, y0 + (o.y - city.minY) * k, 2, 2);
    }

    ctx.fillStyle = '#ff5252';
    for (const e of Enemies.list) {
      if (e.dead) continue;
      ctx.fillRect(x0 + (e.x - city.minX) * k - 1, y0 + (e.y - city.minY) * k - 1, 3, 3);
    }

    const p = G.player;
    ctx.fillStyle = '#ffd54f';
    ctx.beginPath();
    ctx.arc(x0 + (p.x - city.minX) * k, y0 + (p.y - city.minY) * k, 3.4, 0, 6.2832);
    ctx.fill();
  },

  drawVignette(ctx) {
    const p = G.player;
    const low = p ? U.clamp(1 - p.hp / p.maxHp, 0, 1) : 0;
    if (low > 0.55) {
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 190);
      const g = ctx.createRadialGradient(this.W / 2, this.H / 2, this.H * 0.28,
                                         this.W / 2, this.H / 2, this.H * 0.78);
      g.addColorStop(0, 'rgba(180,0,0,0)');
      g.addColorStop(1, 'rgba(180,0,0,' + ((low - 0.55) * 1.4 * (0.5 + pulse * 0.5)).toFixed(3) + ')');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, this.W, this.H);
    }
  },
};
