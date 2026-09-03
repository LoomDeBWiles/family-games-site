'use strict';
/* ============================================================
   Touch controls for iPad / phones. Global: Touch

   Only wakes up on a touch device - on a desktop every function
   here returns immediately and the game behaves exactly as before.

   Layout:
     left ~45% of the canvas   floating movement stick (analog)
     rest of the canvas        drag to aim, same as moving the mouse
     ability bar               tap/hold a manual slot to fire it
     top-centre buttons        pause and mute (no P / M key on a tablet)
   ============================================================ */

const Touch = {
  on: false,

  // movement stick
  stickId: null, baseX: 0, baseY: 0, dx: 0, dy: 0,
  R: 62,            // how far the knob travels before the stick is at full tilt
  DEAD: 9,          // ignore a thumb that has barely moved

  // aim drag
  aimId: null,
  aimEverUsed: false,

  el: { stick: null, knob: null },

  // Every manual ability already has an input flag that handleManual() reads.
  // Touch just holds that flag down, so cooldowns, hold-to-fire and OVERDRIVE
  // all behave exactly as they do on a keyboard.
  KEY_OF: {
    bazooka: 'q', smash: 'space', nuke: 'e', chomp: 'rmb', flamethrower: 'f',
    railgun: 'r', singularity: 'c', ram: 'x', jumpjets: 'shift',
    overdrive: 'v', orbital: 'g', mines: 'z',
  },

  init() {
    // ?touch=1 forces the tablet layout on a desktop (and ?touch=0 forces it
    // off) - the same dev-hook style as ?autostart=1 in boot()
    const q = new URLSearchParams(location.search);
    this.on = q.has('touch')
      ? q.get('touch') !== '0'
      : ((navigator.maxTouchPoints || 0) > 0 || 'ontouchstart' in window);
    if (!this.on) return;
    document.body.classList.add('touch');
    this.buildStick();
    this.buildTopButtons();
    this.bindCanvas();
  },

  /* ---------------- stick ---------------- */

  buildStick() {
    const s = document.createElement('div');
    s.id = 'tstick';
    s.className = 'hidden';
    const k = document.createElement('div');
    k.id = 'tknob';
    s.appendChild(k);
    document.body.appendChild(s);
    this.el.stick = s;
    this.el.knob = k;
  },

  showStick(x, y) {
    const s = this.el.stick;
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    s.classList.remove('hidden');
    this.moveKnob(0, 0);
  },

  moveKnob(px, py) {
    this.el.knob.style.transform =
      'translate(-50%,-50%) translate(' + px + 'px,' + py + 'px)';
  },

  hideStick() {
    this.el.stick.classList.add('hidden');
    this.dx = this.dy = 0;
    G.input.adx = G.input.ady = 0;
  },

  /* ---------------- top buttons ---------------- */

  buildTopButtons() {
    const wrap = document.createElement('div');
    wrap.id = 'ttop';

    const pause = document.createElement('button');
    pause.className = 'tbtn';
    pause.textContent = '❚❚';
    pause.onclick = () => {
      if (G.state === 'playing') { G.save(); G.setState('paused'); UI.showPause(); }
      else if (G.state === 'paused') G.setState('playing');
    };

    const mute = document.createElement('button');
    mute.className = 'tbtn';
    mute.textContent = '♪';
    mute.onclick = () => {
      SFX.init();
      const muted = SFX.toggleMute();
      mute.classList.toggle('off', muted);
      UI.toast(muted ? 'MUTED' : 'SOUND ON', '#8fa4b8');
    };

    wrap.appendChild(pause);
    wrap.appendChild(mute);
    // Inside the HUD so these hide with it - there is nothing to pause or
    // mute on the title screen.
    document.getElementById('hud').appendChild(wrap);
  },

  /* ---------------- ability bar ---------------- */

  // Called by UI.buildAbilityBar every time the loadout changes, so slots
  // gained mid-run get wired up too.
  wireBar(slots) {
    if (!this.on) return;
    for (const id in slots) {
      const def = ABILITY_DEFS[id];
      const key = this.KEY_OF[id];
      if (!def || def.mode !== 'manual' || !key) continue;

      const root = slots[id].root;
      root.classList.add('tappable');

      const press = (e) => {
        e.preventDefault();
        SFX.init(); SFX.resume();
        G.input[key] = 1;
        root.classList.add('pressed');
      };
      const release = (e) => {
        e.preventDefault();
        G.input[key] = 0;
        root.classList.remove('pressed');
      };

      root.addEventListener('touchstart', press, { passive: false });
      root.addEventListener('touchend', release, { passive: false });
      root.addEventListener('touchcancel', release, { passive: false });
    }
  },

  /* ---------------- canvas ---------------- */

  bindCanvas() {
    const cv = Render.cv;
    const opt = { passive: false };
    cv.addEventListener('touchstart', (e) => this.onStart(e), opt);
    cv.addEventListener('touchmove', (e) => this.onMove(e), opt);
    cv.addEventListener('touchend', (e) => this.onEnd(e), opt);
    cv.addEventListener('touchcancel', (e) => this.onEnd(e), opt);
  },

  stickZone(x) { return x < window.innerWidth * 0.45; },

  onStart(e) {
    e.preventDefault();
    SFX.init(); SFX.resume();
    for (const t of e.changedTouches) {
      if (this.stickId === null && this.stickZone(t.clientX)) {
        this.stickId = t.identifier;
        this.baseX = t.clientX; this.baseY = t.clientY;
        this.showStick(t.clientX, t.clientY);
      } else if (this.aimId === null) {
        this.aimId = t.identifier;
        this.aimEverUsed = true;
        this.setAim(t);
      }
    }
  },

  onMove(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === this.stickId) {
        let ox = t.clientX - this.baseX;
        let oy = t.clientY - this.baseY;
        let len = Math.hypot(ox, oy);

        // Thumbs drift. Once the stick is pushed past full tilt, drag the base
        // along with it so the stick never runs out of travel mid-sprint.
        if (len > this.R) {
          const k = this.R / len;
          this.baseX += ox * (1 - k);
          this.baseY += oy * (1 - k);
          ox *= k; oy *= k;
          len = this.R;             // the knob is now exactly at full tilt
          this.el.stick.style.left = this.baseX + 'px';
          this.el.stick.style.top = this.baseY + 'px';
        }
        this.moveKnob(ox, oy);

        if (len < this.DEAD) { this.dx = this.dy = 0; }
        else {
          const mag = Math.min(1, len / this.R);
          this.dx = (ox / len) * mag;
          this.dy = (oy / len) * mag;
        }
      } else if (t.identifier === this.aimId) {
        this.setAim(t);
      }
    }
  },

  onEnd(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === this.stickId) { this.stickId = null; this.hideStick(); }
      else if (t.identifier === this.aimId) { this.aimId = null; }
    }
  },

  setAim(t) {
    const I = G.input;
    I.mx = t.clientX;
    I.my = t.clientY;
    I.aimAng = null;          // back to aiming at a point, like the mouse
  },

  /* ---------------- per-frame ---------------- */

  // Feeds the stick into the shared input object. Until the player has aimed
  // by hand even once, the robot simply faces the way it is walking - so a
  // first-timer can move and shoot with one thumb.
  update() {
    if (!this.on) return;
    const I = G.input;
    I.adx = this.dx;
    I.ady = this.dy;
    if (!this.aimEverUsed && (this.dx || this.dy)) I.aimAng = Math.atan2(this.dy, this.dx);
  },

  // Same job as the keyboard's blur handler.
  releaseAll() {
    if (!this.on) return;
    this.stickId = null;
    this.aimId = null;
    this.hideStick();
    const held = document.querySelectorAll('#abilitybar .pressed');
    for (const el of held) el.classList.remove('pressed');
  },

  /* ---------------- help text ---------------- */

  // Replaces the keyboard cheat sheet on the title and pause screens.
  helpHtml() {
    return '<b>LEFT THUMB</b> drag anywhere on the left half to walk<br>' +
      '<b>RIGHT SIDE</b> drag to aim<br>' +
      '<b>TAP A WEAPON</b> at the bottom to fire it<br>' +
      'hold the flamethrower down to keep it burning<br>' +
      '<b>❚❚</b> pause &nbsp; <b>♪</b> mute';
  },
};
