'use strict';
/* ============================================================
   State machine, main loop, input, save/load. Global: G
   ============================================================ */

const G = {
  state: 'title',        // title | playing | upgrade | cityclear | dead | paused
  player: null,
  city: null,
  tier: 0,               // 0-based index into TIERS
  score: 0,
  bonus: { dmg: 1, speed: 1, radius: 0, hp: 0 },
  input: { up: 0, down: 0, left: 0, right: 0, mx: 0, my: 0, rmb: 0,
           space: 0, q: 0, e: 0, f: 0, r: 0, c: 0, x: 0, v: 0, g: 0, z: 0, shift: 0 },
  last: 0,
  saveT: 0,
  storageOk: true,

  /* ---------------- boot ---------------- */

  boot() {
    UI.init();
    Render.init();
    this.bindInput();

    UI.showHud(false);
    UI.showTitle(!!this.loadRaw());

    this.last = performance.now();
    requestAnimationFrame((t) => this.frame(t));

    // dev hooks, e.g. index.html?autostart=1&xp=40&tier=2 - handy for
    // checking a late-game city without grinding to it
    const q = new URLSearchParams(location.search);
    if (q.has('xp')) CFG.XP.mult = parseFloat(q.get('xp')) || 1;
    if (q.has('autostart')) {
      this.startNew();
      const t = parseInt(q.get('tier'), 10);
      if (t > 0) { this.tier = t; this.buildCity(t); }
    }
  },

  setState(s) {
    this.state = s;
    if (s === 'playing') UI.hideOverlay();
  },

  /* ---------------- run lifecycle ---------------- */

  startNew() {
    SFX.init(); SFX.resume();
    this.score = 0;
    this.tier = 0;
    this.bonus = { dmg: 1, speed: 1, radius: 0, hp: 0 };
    this.player = new Player();
    this.player.abilities[STARTING_ABILITY] = AbilitySys.freshState(STARTING_ABILITY, 1);
    this.buildCity(0);
    UI.showHud(true);
    UI.sig = '';
    this.setState('playing');
    UI.toast('DESTROY ' + this.city.name, '#ffd54f');
    this.save();
  },

  startFromSave() {
    SFX.init(); SFX.resume();
    const d = this.loadRaw();
    if (!d) return this.startNew();
    this.score = d.score || 0;
    this.tier = d.tier | 0;
    this.bonus = Object.assign({ dmg: 1, speed: 1, radius: 0, hp: 0 }, d.bonus || {});
    this.player = new Player();
    this.player.restore(d.player || {});
    this.buildCity(this.tier, d.seed);

    if (d.mask) this.city.applyMask(d.mask);
    if (typeof d.x === 'number') { this.player.x = d.x; this.player.y = d.y; }
    // buildCity heals to full; put the saved HP back
    if (d.player && d.player.hp) {
      this.player.hp = U.clamp(d.player.hp, this.player.maxHp * 0.25, this.player.maxHp);
    }
    Render.updateCam(0, true);

    UI.showHud(true);
    UI.sig = '';
    this.setState('playing');
    UI.toast('RESUMING IN ' + this.city.name, '#ffd54f');
  },

  quitToTitle() {
    UI.showHud(false);
    this.setState('title');
    UI.showTitle(!!this.loadRaw());
  },

  buildCity(tierIndex, seed) {
    this.tier = tierIndex;
    this.city = new City(tierIndex, seed);
    EM.clear();
    Enemies.reset(this.city);

    // drop the player in the middle of the nearest road junction
    this.player.x = 0;
    this.player.y = 0;
    this.player.vx = this.player.vy = 0;
    this.player.dead = false;
    this.player.hp = this.player.maxHp;
    this.player.jumpT = 0; this.player.jumpZ = 0;
    this.player.ramT = 0; this.player.ramHit.length = 0;
    for (const id in this.player.abilities) {
      const st = this.player.abilities[id];
      st.cd = 0; st.chewing = null; st.chargeT = 0; st.activeT = 0;
      st.drones.length = 0; st.saws.length = 0;
    }
    Render.updateCam(0, true);
  },

  nextCity() {
    this.tier++;
    this.buildCity(this.tier);
    this.setState('playing');
    EM.flash = 0.8;
    SFX.teleport();
    UI.toast('WELCOME TO ' + this.city.name, '#4dd0e1');
    this.save();
  },

  restartCity() {
    this.buildCity(this.tier);
    this.setState('playing');
    UI.toast('REBOOTED', '#4dd0e1');
    this.save();
  },

  /* ---------------- events from the world ---------------- */

  onDestroyed(o, xpMul) {
    const xp = Math.ceil(Math.sqrt(o.mass) / 3) * (xpMul || 1);
    this.player.addXP(xp);
    this.addScore(Math.round(xp * 1.5));
    if (o.mass > 900000) EM.text(o.x, o.y - 20, '+' + Math.round(xp), '#4dd0e1');
  },

  addScore(n) { this.score += n; },

  onDeath() {
    this.setState('dead');
    UI.showDeath(this.city, () => this.restartCity());
    this.save();
  },

  /* ---------------- save ---------------- */

  // The city seed plus a one-bit-per-structure rubble mask means CONTINUE
  // drops you back into the same half-demolished streets, not a fresh city.
  save(loud) {
    if (!this.player || !this.city) return false;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        v: 2,
        player: this.player.serialize(),
        x: Math.round(this.player.x),
        y: Math.round(this.player.y),
        tier: this.tier,
        seed: this.city.seed,
        mask: this.city.encodeMask(),
        score: this.score,
        bonus: this.bonus,
        at: Date.now(),
      }));
      this.saveT = 0;
      this.storageOk = true;
      if (loud) UI.toast('SAVED', '#69f0ae');
      return true;
    } catch (e) {
      this.storageOk = false;
      if (loud) UI.toast('COULD NOT SAVE - STORAGE BLOCKED', '#ff5252');
      return false;
    }
  },

  loadRaw() {
    try {
      const s = localStorage.getItem(SAVE_KEY);
      return s ? JSON.parse(s) : null;
    } catch (e) { return null; }
  },

  wipeSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* nothing to do */ }
  },

  // one-line description of the save, for the title and pause screens
  saveSummary() {
    const d = this.loadRaw();
    if (!d) return null;
    const p = d.player || {};
    const name = City.tierDef(d.tier | 0).name;
    const abilities = p.abilities ? Object.keys(p.abilities).length : 0;
    return 'LV ' + (p.level || 1) + ' · ' + name + ' · ' + U.fmt(d.score || 0) +
           ' pts · ' + abilities + ' abilit' + (abilities === 1 ? 'y' : 'ies');
  },

  /* ---------------- input ---------------- */

  bindInput() {
    const I = this.input;

    const setKey = (e, on) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp':    I.up = on; break;
        case 'KeyS': case 'ArrowDown':  I.down = on; break;
        case 'KeyA': case 'ArrowLeft':  I.left = on; break;
        case 'KeyD': case 'ArrowRight': I.right = on; break;
        case 'Space': I.space = on; break;
        case 'KeyQ':  I.q = on; break;
        case 'KeyE':  I.e = on; break;
        case 'KeyF':  I.f = on; break;
        case 'KeyR':  I.r = on; break;
        case 'KeyC':  I.c = on; break;
        case 'KeyX':  I.x = on; break;
        case 'KeyV':  I.v = on; break;
        case 'KeyG':  I.g = on; break;
        case 'KeyZ':  I.z = on; break;
        case 'ShiftLeft': case 'ShiftRight': I.shift = on; break;
        default: return false;
      }
      return true;
    };

    window.addEventListener('keydown', (e) => {
      // Ctrl+S saves instead of opening the browser's save-page dialog
      if (e.ctrlKey && e.code === 'KeyS') { e.preventDefault(); this.save(true); return; }
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.repeat) { if (setKey(e, 1)) e.preventDefault(); return; }
      if (setKey(e, 1)) e.preventDefault();

      if (e.code === 'KeyM') {
        SFX.init();
        UI.toast(SFX.toggleMute() ? 'MUTED' : 'SOUND ON', '#8fa4b8');
      }
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (this.state === 'playing') { this.save(); this.setState('paused'); UI.showPause(); }
        else if (this.state === 'paused') this.setState('playing');
      }
    });

    window.addEventListener('keyup', (e) => { if (setKey(e, 0)) e.preventDefault(); });
    window.addEventListener('blur', () => {
      I.up = I.down = I.left = I.right = 0;
      I.space = I.q = I.e = I.rmb = I.f = I.r = I.c = I.x = I.shift = 0;
      I.v = I.g = I.z = 0;
      if (this.state === 'playing') this.save();
    });

    // don't lose a run to a closed tab
    window.addEventListener('beforeunload', () => { if (this.player) this.save(); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.player) this.save();
    });

    const cv = Render.cv;
    window.addEventListener('mousemove', (e) => { I.mx = e.clientX; I.my = e.clientY; });
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    cv.addEventListener('mousedown', (e) => {
      SFX.init(); SFX.resume();
      if (e.button === 2) I.rmb = 1;
      if (e.button === 0 && this.state === 'playing') AbilitySys.tryManual('bazooka');
    });
    window.addEventListener('mouseup', (e) => { if (e.button === 2) I.rmb = 0; });
  },

  handleManual() {
    const I = this.input;
    if (I.space) AbilitySys.tryManual('smash');
    if (I.q)     AbilitySys.tryManual('bazooka');
    if (I.e)     AbilitySys.tryManual('nuke');
    if (I.rmb)   AbilitySys.tryManual('chomp');
    if (I.f)     AbilitySys.tryManual('flamethrower');
    if (I.r)     AbilitySys.tryManual('railgun');
    if (I.c)     AbilitySys.tryManual('singularity');
    if (I.x)     AbilitySys.tryManual('ram');
    if (I.shift) AbilitySys.tryManual('jumpjets');
    if (I.v)     AbilitySys.tryManual('overdrive');
    if (I.g)     AbilitySys.tryManual('orbital');
    if (I.z)     AbilitySys.tryManual('mines');
  },

  /* ---------------- loop ---------------- */

  frame(now) {
    requestAnimationFrame((t) => this.frame(t));

    let dt = (now - this.last) / 1000;
    this.last = now;
    if (!isFinite(dt)) dt = 0;
    dt = Math.min(dt, 0.05);          // never simulate more than 50ms in one step

    if (this.state === 'playing') {
      let sim = dt;
      if (EM.hitStop > 0) { EM.hitStop -= dt; sim = dt * 0.18; }
      this.update(sim, dt);
    } else if (this.player && this.city) {
      // frozen, but keep the fx breathing so overlays aren't static
      EM.updSimple(dt * 0.35);
      EM.shakeAmt = Math.max(0, EM.shakeAmt - dt * 46);
      EM.flash = Math.max(0, EM.flash - dt * 2.4);
      Render.updateCam(dt, false);
    }

    if (this.player && this.city) {
      Render.draw();
      if (this.state !== 'title') UI.update();
    }
  },

  update(dt, realDt) {
    const p = this.player;

    // aim follows the mouse
    const w = Render.screenToWorld(this.input.mx, this.input.my);
    p.aim = U.angTo(p.x, p.y, w.x, w.y);

    p.update(dt, this.input);
    if (p.dead) return;

    this.handleManual();
    AbilitySys.update(dt);
    Enemies.update(dt);
    EM.update(dt);
    this.city.update(dt);
    Render.updateCam(realDt, false);

    // dying mid-frame (enemy fire lands during EM.update) already switched state
    if (this.state !== 'playing') return;

    this.saveT += dt;
    if (this.saveT >= CFG.AUTOSAVE) this.save();

    // level 10, 20, 30 ... open the upgrade screen
    if (p.pendingUpgrades > 0) { this.openUpgrade(); return; }

    if (this.city.cleared) {
      this.setState('cityclear');
      SFX.teleport();
      EM.flash = 0.6;
      const nextName = City.tierDef(this.tier + 1).name;
      UI.showCityClear(this.city, nextName, () => this.nextCity());
      this.save();
    }
  },

  openUpgrade() {
    this.setState('upgrade');
    const cards = AbilitySys.rollCards();
    UI.showUpgrade(cards, (card) => {
      AbilitySys.applyCard(card);
      this.player.pendingUpgrades--;
      UI.toast(card.name + ' ACQUIRED', card.evo ? '#ff80d5' : '#4dd0e1');
      this.save();
      if (this.player.pendingUpgrades > 0) this.openUpgrade();
      else this.setState('playing');
    });
  },
};

window.addEventListener('load', () => G.boot());
