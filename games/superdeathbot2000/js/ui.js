'use strict';
/* ============================================================
   HUD + all full-screen overlays. Global: UI
   ============================================================ */

const UI = {
  el: {},
  slots: {},
  sig: '',

  init() {
    const id = (s) => document.getElementById(s);
    this.el = {
      hud: id('hud'),
      hpfill: id('hpfill'), hptext: id('hptext'),
      xpfill: id('xpfill'), xptext: id('xptext'),
      nextup: id('nextup'),
      cityname: id('cityname'),
      destfill: id('destfill'), desttext: id('desttext'),
      scoretext: id('scoretext'),
      abilitybar: id('abilitybar'),
      toaster: id('toaster'),
      overlay: id('overlay'),
      errpanel: id('errpanel'),
      bosswrap: id('bosswrap'), bossfill: id('bossfill'), bossname: id('bossname'),
    };
  },

  /* ---------------- HUD ---------------- */

  showHud(on) { this.el.hud.classList.toggle('hidden', !on); },

  update() {
    const p = G.player, c = G.city;
    if (!p || !c) return;

    const hpF = U.clamp(p.hp / p.maxHp, 0, 1);
    this.el.hpfill.style.width = (hpF * 100).toFixed(1) + '%';
    this.el.hptext.textContent = Math.ceil(p.hp) + ' / ' + Math.round(p.maxHp);

    this.el.xpfill.style.width = (U.clamp(p.xp / p.xpNext, 0, 1) * 100).toFixed(1) + '%';
    this.el.xptext.textContent = 'LV ' + p.level + '   ' + Math.floor(p.xp) + ' / ' + p.xpNext;

    const nextAt = (Math.floor(p.level / CFG.UPGRADE_EVERY) + 1) * CFG.UPGRADE_EVERY;
    this.el.nextup.textContent = 'size ' + p.radius.toFixed(0) +
      '   ·   crush height ' + p.crushHeight.toFixed(0) +
      '   ·   next upgrade LV ' + nextAt;

    this.el.cityname.textContent = c.name;
    const d = c.pct;
    this.el.destfill.style.width = (d * 100).toFixed(1) + '%';
    this.el.desttext.textContent = (d * 100).toFixed(1) + '% DESTROYED';
    this.el.scoretext.textContent = U.fmt(G.score);

    this.updateAbilityBar(p);
    this.updateBoss();
  },

  updateBoss() {
    let boss = null;
    for (const e of Enemies.list) if (!e.dead && e.boss) { boss = e; break; }
    this.el.bosswrap.classList.toggle('hidden', !boss);
    if (boss) this.el.bossfill.style.width = (U.clamp(boss.hp / boss.maxHp, 0, 1) * 100).toFixed(1) + '%';
  },

  updateAbilityBar(p) {
    // rebuild only when the loadout actually changed
    let sig = '';
    for (const id of ABILITY_ORDER) if (p.abilities[id]) sig += id + p.abilities[id].rank + '|';
    if (sig !== this.sig) { this.sig = sig; this.buildAbilityBar(p); }

    const od = AbilitySys.overdriveOn();
    for (const id in this.slots) {
      const st = p.abilities[id];
      if (!st) continue;
      const frac = st.cdMax > 0 ? U.clamp(st.cd / st.cdMax, 0, 1) : 0;
      this.slots[id].cool.style.height = (frac * 100).toFixed(0) + '%';
      this.slots[id].root.classList.toggle('ready', st.cd <= 0);
      this.slots[id].root.classList.toggle('od', od && id !== 'overdrive');
    }
  },

  buildAbilityBar(p) {
    const bar = this.el.abilitybar;
    bar.innerHTML = '';
    this.slots = {};

    for (const id of ABILITY_ORDER) {
      const st = p.abilities[id];
      if (!st) continue;
      const def = ABILITY_DEFS[id];
      const evo = st.rank >= 5;

      const root = document.createElement('div');
      root.className = 'slot' + (def.mode === 'manual' ? ' manual' : '') + (evo ? ' evo' : '');

      const cool = document.createElement('div');
      cool.className = 'cool';

      const rk = document.createElement('div');
      rk.className = 'rk';
      rk.textContent = def.noUpgrade ? '∞' : (evo ? '★' : st.rank);

      const kb = document.createElement('div');
      kb.className = 'kb';
      kb.textContent = def.kb || 'A';

      const glyph = document.createElement('div');
      glyph.className = 'glyph';
      glyph.textContent = def.glyph;

      const nm = document.createElement('div');
      nm.className = 'nm';
      nm.textContent = evo ? def.evo : def.name;

      root.appendChild(cool); root.appendChild(rk); root.appendChild(kb);
      root.appendChild(glyph); root.appendChild(nm);
      bar.appendChild(root);
      this.slots[id] = { root, cool };
    }

    Touch.wireBar(this.slots);   // makes manual slots tappable on a tablet
  },

  toast(msg, color) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.style.color = color || '#ffd54f';
    t.textContent = msg;
    this.el.toaster.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  },

  /* ---------------- overlays ---------------- */

  hideOverlay() {
    this.el.overlay.classList.add('hidden');
    this.el.overlay.innerHTML = '';
  },

  _show(html) {
    const o = this.el.overlay;
    o.innerHTML = html;
    o.classList.remove('hidden');
    return o;
  },

  // The cheat sheet on the title and pause screens - keys, or thumbs.
  controlsHtml() {
    if (Touch.on) return Touch.helpHtml();
    return '<b>WASD</b> move &nbsp; <b>MOUSE</b> aim<br>' +
      '<b>SPACE</b> super smash &nbsp; <b>RMB</b> (right mouse button) chompity chomp<br>' +
      '<b>Q</b> bazooka &nbsp; <b>E</b> nuke &nbsp; <b>F</b> flamethrower &nbsp; <b>R</b> railgun<br>' +
      '<b>C</b> singularity &nbsp; <b>X</b> ram &nbsp; <b>SHIFT</b> jump jets &nbsp; <b>V</b> overdrive<br>' +
      '<b>G</b> orbital strike &nbsp; <b>Z</b> proximity mines<br>' +
      '<b>P</b> pause &nbsp; <b>M</b> mute &nbsp; <b>Ctrl+S</b> save';
  },

  showTitle() {
    const summary = G.saveSummary();
    const o = this._show(
      '<h1>SUPERDEATHBOT 2000</h1>' +
      '<div class="sub">GROW. DESTROY. TELEPORT. REPEAT.</div>' +
      (summary ? '<div class="savebox">SAVED RUN<br><b>' + summary + '</b></div>' : '') +
      '<div>' +
      (summary ? '<button class="btn" id="btn-continue">CONTINUE</button>' : '') +
      '<button class="btn' + (summary ? ' ghost' : '') + '" id="btn-new">NEW GAME</button>' +
      '</div>' +
      (summary ? '<div><button class="btn ghost tiny" id="btn-wipe">DELETE SAVE</button></div>' : '') +
      '<div class="note">' +
      this.controlsHtml() + '<br><br>' +
      'Passive weapons fire themselves. The game saves itself every ' + CFG.AUTOSAVE + 's,<br>' +
      'on pause, and when you close the tab.<br><br>' +
      'Buildings are not walls - walk straight through them and they come<br>' +
      'apart as you go. Destroy the whole city to open the portal.' +
      '</div>'
    );
    const cont = o.querySelector('#btn-continue');
    if (cont) cont.onclick = () => G.startFromSave();
    o.querySelector('#btn-new').onclick = () => {
      if (summary && !confirm('Start over? This erases your saved run.')) return;
      G.startNew();
    };
    const wipe = o.querySelector('#btn-wipe');
    if (wipe) wipe.onclick = () => {
      if (!confirm('Delete the saved run permanently?')) return;
      G.wipeSave();
      this.showTitle();
    };
  },

  showUpgrade(cards, onPick) {
    let html =
      '<h2>UPGRADE</h2>' +
      '<div class="sub">LEVEL ' + G.player.level + ' &nbsp;·&nbsp; CHOOSE ONE</div>' +
      '<div class="cards">';
    cards.forEach((c, i) => {
      html +=
        '<div class="card ' + c.type + (c.evo ? ' evo' : '') + '" data-i="' + i + '">' +
        '<div class="tag">' + c.rank + '</div>' +
        '<div class="glyph">' + c.glyph + '</div>' +
        '<div class="name">' + c.name + '</div>' +
        '<div class="body">' + c.body + '</div>' +
        '</div>';
    });
    html += '</div>';

    const o = this._show(html);
    o.querySelectorAll('.card').forEach(el => {
      el.onclick = () => onPick(cards[+el.dataset.i]);
    });
  },

  showCityClear(city, nextName, onNext) {
    const o = this._show(
      '<h2>CITY FLATTENED</h2>' +
      '<div class="sub">' + city.name + ' &nbsp;·&nbsp; 100% DESTROYED</div>' +
      '<div class="note">' +
      'Score <b>' + U.fmt(G.score) + '</b> &nbsp;·&nbsp; Level <b>' + G.player.level + '</b><br>' +
      'A portal opens. Something bigger is on the other side.' +
      '</div>' +
      '<div><button class="btn" id="btn-next">TELEPORT TO ' + nextName + '</button></div>'
    );
    o.querySelector('#btn-next').onclick = onNext;
  },

  showDeath(city, onRetry) {
    const o = this._show(
      '<h2 style="color:#ff5252">SYSTEM FAILURE</h2>' +
      '<div class="sub">CHASSIS DESTROYED IN ' + city.name + '</div>' +
      '<div class="note">' +
      'You keep your level and every ability.<br>' +
      'The city rebuilds itself. Go again.' +
      '</div>' +
      '<div><button class="btn" id="btn-retry">REBOOT</button></div>'
    );
    o.querySelector('#btn-retry').onclick = onRetry;
  },

  showPause() {
    const summary = G.saveSummary();
    const o = this._show(
      '<h2>PAUSED</h2>' +
      (summary
        ? '<div class="savebox">' + (G.storageOk ? 'SAVED' : 'SAVE FAILED - STORAGE BLOCKED') +
          '<br><b>' + summary + '</b></div>'
        : '<div class="savebox">NO SAVE YET</div>') +
      '<div class="note">' + this.controlsHtml() + '</div>' +
      '<div><button class="btn" id="btn-resume">RESUME</button>' +
      '<button class="btn ghost" id="btn-save">SAVE NOW</button>' +
      '<button class="btn ghost" id="btn-quit">QUIT TO TITLE</button></div>'
    );
    o.querySelector('#btn-resume').onclick = () => G.setState('playing');
    o.querySelector('#btn-save').onclick = () => { G.save(true); this.showPause(); };
    o.querySelector('#btn-quit').onclick = () => { G.save(); G.quitToTitle(); };
  },

  /* ---------------- errors ---------------- */

  // The panel itself is installed by the inline script in index.html so that
  // it survives a parse error in any of these files.
  error(msg) { if (window.__err) window.__err(msg); },
};
