// ============================================================
// HARVEY: SHADOW STRIKE - Ninja Action Game
// ============================================================
(() => {
'use strict';

// --- CONFIG ---
const CFG = {
  playerSpeed: 260,
  playerHealth: 100,
  starDamage: 20,
  starSpeed: 600,
  starRate: 0.22,
  gemChance: 0.55,
  gemsPerChoice: 5,
  enemyBaseHP: 40,
  enemyBaseDmg: 8,
  enemyBaseSpeed: 80,
  waveEnemies: w => 4 + w * 3,
  waveCooldown: 2.5,
};

// --- WEAPON DEFS ---
const WEAPONS = [
  { name:'Ninja Star', icon:'\u2726', color:'#c0c0c0', damage:20, rate:0.22, speed:600, pierce:false, spread:1, projSize:8, trail:'#888', unlocked:true },
  { name:'Fire Bolt',  icon:'\uD83D\uDD25', color:'#ff6a00', damage:30, rate:0.35, speed:500, pierce:false, spread:1, projSize:10, trail:'#ff4500', unlocked:false },
  { name:'Lightning',  icon:'\u26A1', color:'#00bfff', damage:25, rate:0.18, speed:900, pierce:true,  spread:1, projSize:6, trail:'#0ff', unlocked:false },
  { name:'Ice Shard',  icon:'\u2744\uFE0F', color:'#67e8f9', damage:15, rate:0.15, speed:550, pierce:false, spread:3, projSize:7, trail:'#a5f3fc', unlocked:false },
  { name:'Blade Disc', icon:'\uD83D\uDCA0', color:'#f472b6', damage:45, rate:0.5, speed:400, pierce:true,  spread:1, projSize:14, trail:'#ec4899', unlocked:false },
];

// --- POWERUP DEFS ---
const POWERUPS = [
  { name:'Shield', icon:'\uD83D\uDEE1\uFE0F', color:'#3b82f6', desc:'Block next 3 hits', duration:20 },
  { name:'Speed Boost', icon:'\uD83D\uDCA8', color:'#22c55e', desc:'2x move speed for 8s', duration:8 },
  { name:'Health Pack', icon:'\u2764\uFE0F', color:'#ef4444', desc:'Restore 40 HP', duration:0 },
  { name:'Fury', icon:'\uD83D\uDD25', color:'#f59e0b', desc:'2x attack speed for 8s', duration:8 },
];

// --- ENEMY TYPES ---
const ENEMY_TYPES = [
  { name:'Grunt',  color:'#6b7280', speed:1,   hp:1,   size:18, dmg:1,   score:10 },
  { name:'Runner', color:'#84cc16', speed:1.8, hp:0.6, size:14, dmg:0.7, score:15 },
  { name:'Brute',  color:'#dc2626', speed:0.6, hp:2.5, size:26, dmg:1.8, score:25 },
  { name:'Shadow', color:'#7c3aed', speed:1.3, hp:1,   size:16, dmg:1.2, score:20 },
  { name:'Boss',   color:'#f59e0b', speed:0.5, hp:8,   size:36, dmg:2.5, score:100 },
];

// --- BOSS DEFS ---
const BOSSES = [
  { name:'GORATH THE DESTROYER', color:'#ef4444', color2:'#991b1b', size:55, hp:25, speed:0.4, dmg:4, score:500,
    attack:'charge', attackRate:3, desc:'Charges at you with deadly speed' },
  { name:'VENOM QUEEN', color:'#22c55e', color2:'#166534', size:50, hp:30, speed:0.35, dmg:3, score:600,
    attack:'spawn', attackRate:4, desc:'Spawns poisonous minions' },
  { name:'STORM LORD', color:'#3b82f6', color2:'#1e3a5f', size:52, hp:28, speed:0.45, dmg:3.5, score:650,
    attack:'ring', attackRate:3.5, desc:'Fires rings of lightning' },
  { name:'SHADOW KING', color:'#a855f7', color2:'#581c87', size:58, hp:35, speed:0.3, dmg:5, score:800,
    attack:'teleport', attackRate:2.5, desc:'Teleports and strikes from the dark' },
  { name:'INFERNO TITAN', color:'#f97316', color2:'#7c2d12', size:65, hp:50, speed:0.25, dmg:6, score:1000,
    attack:'nova', attackRate:4, desc:'Erupts with waves of fire' },
];

// --- UTILS ---
const rand = (a,b) => Math.random()*(b-a)+a;
const randInt = (a,b) => Math.floor(rand(a,b+1));
const dist = (a,b) => Math.hypot(a.x-b.x, a.y-b.y);
const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
const angle = (a,b) => Math.atan2(b.y-a.y, b.x-a.x);

// --- CANVAS SETUP ---
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let W, H;
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// --- INPUT ---
const keys = {};
const mouse = { x: W/2, y: H/2, down: false };
window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
canvas.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
canvas.addEventListener('mousedown', e => { if(e.button===0) mouse.down = true; });
canvas.addEventListener('mouseup', e => { if(e.button===0) mouse.down = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());

// --- GAME STATE ---
let state = 'title';
let player, enemies, projectiles, gems, particles, floatTexts;
let wave, waveTimer, waveEnemiesLeft, waveSpawnTimer, waveActive;
let score, totalGems, gemsHeld, screenShake, screenShakeTimer;
let activePowerUps, comboCount, comboTimer;
let boss, bossWarningTimer, bossProjectiles;
let bgStars = [];

function initBgStars() {
  bgStars = [];
  for (let i = 0; i < 120; i++) bgStars.push({ x: rand(0,W), y: rand(0,H), s: rand(0.5,2), b: rand(0.2,0.8) });
}

function initGame() {
  player = {
    x: W/2, y: H/2, w: 22, h: 22,
    health: CFG.playerHealth, maxHealth: CFG.playerHealth,
    speed: CFG.playerSpeed,
    weaponIdx: 0, fireTimer: 0,
    facing: 0, animTime: 0, moving: false,
    invulnTimer: 0, hitFlash: 0,
    shieldHits: 0,
  };
  enemies = []; projectiles = []; gems = []; particles = []; floatTexts = [];
  wave = 0; waveTimer = 1.5; waveEnemiesLeft = 0; waveSpawnTimer = 0; waveActive = false;
  score = 0; totalGems = 0; gemsHeld = 0;
  screenShake = 0; screenShakeTimer = 0;
  activePowerUps = { shield: 0, speed: 0, fury: 0 };
  comboCount = 0; comboTimer = 0;
  boss = null; bossWarningTimer = 0; bossProjectiles = [];
  WEAPONS[0].unlocked = true;
  for (let i = 1; i < WEAPONS.length; i++) WEAPONS[i].unlocked = false;
  initBgStars();
  updateHUD();
  updateWeaponBar();
}

// --- PARTICLES ---
function spawnParticles(x, y, color, count, speed, life, size) {
  for (let i = 0; i < count; i++) {
    const a = rand(0, Math.PI*2);
    const s = rand(speed*0.3, speed);
    particles.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, life, maxLife: life, color, size: rand(size*0.5, size) });
  }
}

function spawnTrail(x, y, color, size) {
  particles.push({ x: x+rand(-3,3), y: y+rand(-3,3), vx: rand(-15,15), vy: rand(-15,15), life: 0.3, maxLife: 0.3, color, size: rand(size*0.4, size) });
}

// --- FLOATING TEXT ---
function spawnFloatText(x, y, text, color) {
  floatTexts.push({ x, y, text, color, life: 1, maxLife: 1 });
}

// --- ENEMIES ---
function edgeSpawn() {
  let x, y;
  const side = randInt(0,3);
  if (side === 0) { x = rand(0,W); y = -30; }
  else if (side === 1) { x = W+30; y = rand(0,H); }
  else if (side === 2) { x = rand(0,W); y = H+30; }
  else { x = -30; y = rand(0,H); }
  return {x, y};
}

function spawnEnemy() {
  const typeIdx = wave >= 3 ? randInt(0, 3) : randInt(0, Math.min(1, wave));
  const type = ENEMY_TYPES[typeIdx];
  const {x, y} = edgeSpawn();
  const hpMult = 1 + wave * 0.15;
  enemies.push({
    x, y, type: typeIdx,
    hp: CFG.enemyBaseHP * type.hp * hpMult,
    maxHp: CFG.enemyBaseHP * type.hp * hpMult,
    speed: CFG.enemyBaseSpeed * type.speed,
    size: type.size, damage: CFG.enemyBaseDmg * type.dmg,
    score: type.score, hitFlash: 0,
    animTime: rand(0, 10), slow: 0,
  });
}

function spawnBoss(waveNum) {
  const idx = Math.min(Math.floor((waveNum - 5) / 5), BOSSES.length - 1);
  const def = BOSSES[Math.max(0, idx)];
  const {x, y} = edgeSpawn();
  const scaleMult = 1 + (waveNum - 5) * 0.12;
  boss = {
    x, y, def, type: 4,
    hp: CFG.enemyBaseHP * def.hp * scaleMult,
    maxHp: CFG.enemyBaseHP * def.hp * scaleMult,
    speed: CFG.enemyBaseSpeed * def.speed,
    size: def.size, damage: CFG.enemyBaseDmg * def.dmg,
    score: def.score, hitFlash: 0,
    animTime: 0, slow: 0,
    attackTimer: def.attackRate,
    phase: 1, phaseThresholds: [0.6, 0.3],
    enraged: false,
  };
  bossProjectiles = [];
  announceWave(waveNum);
}

function bossAttack(b) {
  const a = angle(b, player);
  if (b.def.attack === 'charge') {
    // Dash toward player at high speed
    const chargeSpeed = 600;
    b.x += Math.cos(a) * chargeSpeed * 0.3;
    b.y += Math.sin(a) * chargeSpeed * 0.3;
    spawnParticles(b.x, b.y, b.def.color, 15, 200, 0.5, 6);
    doShake(8, 0.2);
  } else if (b.def.attack === 'spawn') {
    // Spawn 3 minions
    for (let i = 0; i < 3; i++) {
      const sa = a + (i-1) * 0.8;
      enemies.push({
        x: b.x + Math.cos(sa)*50, y: b.y + Math.sin(sa)*50, type: 0,
        hp: 25, maxHp: 25, speed: CFG.enemyBaseSpeed * 1.3,
        size: 12, damage: 5, score: 5, hitFlash: 0, animTime: rand(0,10), slow: 0,
      });
      spawnParticles(b.x + Math.cos(sa)*50, b.y + Math.sin(sa)*50, b.def.color, 8, 100, 0.3, 4);
    }
  } else if (b.def.attack === 'ring') {
    // Fire a ring of 12 projectiles
    const count = b.enraged ? 16 : 12;
    for (let i = 0; i < count; i++) {
      const ra = (Math.PI*2/count) * i;
      bossProjectiles.push({
        x: b.x, y: b.y, vx: Math.cos(ra)*220, vy: Math.sin(ra)*220,
        size: 6, damage: b.damage * 0.5, life: 3, color: b.def.color,
      });
    }
    spawnParticles(b.x, b.y, b.def.color, 10, 150, 0.4, 5);
  } else if (b.def.attack === 'teleport') {
    // Teleport near player
    spawnParticles(b.x, b.y, b.def.color, 20, 200, 0.5, 6);
    const tAngle = rand(0, Math.PI*2);
    b.x = player.x + Math.cos(tAngle) * 120;
    b.y = player.y + Math.sin(tAngle) * 120;
    b.x = clamp(b.x, b.size, W - b.size);
    b.y = clamp(b.y, b.size, H - b.size);
    spawnParticles(b.x, b.y, b.def.color, 20, 200, 0.5, 6);
    doShake(6, 0.15);
    // Fire 4 projectiles outward
    for (let i = 0; i < 4; i++) {
      const ra = (Math.PI/2) * i + a;
      bossProjectiles.push({
        x: b.x, y: b.y, vx: Math.cos(ra)*280, vy: Math.sin(ra)*280,
        size: 8, damage: b.damage * 0.6, life: 2.5, color: b.def.color,
      });
    }
  } else if (b.def.attack === 'nova') {
    // Expanding ring of fire — 2 waves
    const waves = b.enraged ? 3 : 2;
    for (let w = 0; w < waves; w++) {
      const count = 18;
      for (let i = 0; i < count; i++) {
        const ra = (Math.PI*2/count) * i + w * 0.17;
        const speed = 160 + w * 60;
        bossProjectiles.push({
          x: b.x, y: b.y, vx: Math.cos(ra)*speed, vy: Math.sin(ra)*speed,
          size: 7, damage: b.damage * 0.4, life: 2.5, color: '#ff6a00',
        });
      }
    }
    spawnParticles(b.x, b.y, '#ff6a00', 25, 250, 0.6, 7);
    doShake(10, 0.3);
  }
}

// --- PROJECTILES ---
function fireWeapon() {
  const w = WEAPONS[player.weaponIdx];
  if (!w.unlocked) return;
  const rateDiv = activePowerUps.fury > 0 ? 2 : 1;
  if (player.fireTimer > 0) return;
  player.fireTimer = w.rate / rateDiv;
  const a = angle(player, mouse);
  for (let i = 0; i < w.spread; i++) {
    const spreadAngle = w.spread > 1 ? a + (i - (w.spread-1)/2) * 0.15 : a;
    projectiles.push({
      x: player.x, y: player.y,
      vx: Math.cos(spreadAngle) * w.speed, vy: Math.sin(spreadAngle) * w.speed,
      damage: w.damage, weaponIdx: player.weaponIdx,
      pierce: w.pierce, size: w.projSize,
      color: w.color, trail: w.trail, life: 2.0,
    });
  }
}

// --- GEMS ---
function spawnGem(x, y) {
  gems.push({ x, y, bobTime: rand(0,10), life: 15, sparkle: 0, collected: false });
}

// --- SCREEN SHAKE ---
function doShake(amount, dur) {
  screenShake = Math.max(screenShake, amount);
  screenShakeTimer = Math.max(screenShakeTimer, dur);
}

// --- CHOICE MODAL ---
function showChoice() {
  state = 'choice';
  const modal = document.getElementById('choice-modal');
  const opts = document.getElementById('choice-options');
  opts.innerHTML = '';
  const lockedWeapons = WEAPONS.map((w,i) => ({...w, idx:i})).filter(w => !w.unlocked);
  const options = [];
  if (lockedWeapons.length > 0) {
    const w = lockedWeapons[randInt(0, lockedWeapons.length-1)];
    options.push({ type:'weapon', data: w, icon: w.icon, name: w.name, desc: `Unlock ${w.name}` });
  } else {
    options.push({ type:'powerup', data: POWERUPS[3], icon: POWERUPS[3].icon, name: POWERUPS[3].name, desc: POWERUPS[3].desc });
  }
  const pu = POWERUPS[randInt(0, POWERUPS.length-1)];
  options.push({ type:'powerup', data: pu, icon: pu.icon, name: pu.name, desc: pu.desc });
  options.forEach(opt => {
    const card = document.createElement('div');
    card.className = 'choice-card';
    card.innerHTML = `<div class="choice-icon">${opt.icon}</div><div class="choice-name">${opt.name}</div><div class="choice-desc">${opt.desc}</div>`;
    card.onclick = () => {
      if (opt.type === 'weapon') {
        WEAPONS[opt.data.idx].unlocked = true;
        player.weaponIdx = opt.data.idx;
        updateWeaponBar();
        spawnFloatText(player.x, player.y - 30, `${opt.data.name} unlocked!`, opt.data.color);
      } else { applyPowerUp(opt.data); }
      gemsHeld = 0;
      modal.classList.add('hidden');
      state = 'playing';
      updateHUD();
    };
    opts.appendChild(card);
  });
  modal.classList.remove('hidden');
}

function applyPowerUp(pu) {
  if (pu.name === 'Health Pack') {
    player.health = Math.min(player.maxHealth, player.health + 40);
    spawnFloatText(player.x, player.y - 30, '+40 HP', '#ef4444');
  } else if (pu.name === 'Shield') {
    activePowerUps.shield = pu.duration; player.shieldHits = 3;
    spawnFloatText(player.x, player.y - 30, 'Shield!', '#3b82f6');
  } else if (pu.name === 'Speed Boost') {
    activePowerUps.speed = pu.duration;
    spawnFloatText(player.x, player.y - 30, 'Speed!', '#22c55e');
  } else if (pu.name === 'Fury') {
    activePowerUps.fury = pu.duration;
    spawnFloatText(player.x, player.y - 30, 'Fury!', '#f59e0b');
  }
}

// --- HUD ---
function updateHUD() {
  document.getElementById('health-bar-fill').style.width = `${(player.health/player.maxHealth)*100}%`;
  document.getElementById('health-text').textContent = Math.ceil(player.health);
  document.getElementById('wave-num').textContent = wave;
  document.getElementById('score-num').textContent = score;
  document.getElementById('gem-count').textContent = gemsHeld;
}

function updateWeaponBar() {
  document.querySelectorAll('.weapon-slot').forEach((slot, i) => {
    slot.querySelector('.weapon-icon').textContent = WEAPONS[i].icon;
    slot.classList.toggle('active', i === player.weaponIdx);
    slot.classList.toggle('locked', !WEAPONS[i].unlocked);
  });
}

function showPowerUpIndicators() {
  const c = document.getElementById('hud-powerups');
  let html = '';
  if (activePowerUps.shield > 0) html += `<div class="powerup-indicator" style="border-color:#3b82f6">\uD83D\uDEE1\uFE0F ${Math.ceil(activePowerUps.shield)}s (${player.shieldHits})</div>`;
  if (activePowerUps.speed > 0) html += `<div class="powerup-indicator" style="border-color:#22c55e">\uD83D\uDCA8 ${Math.ceil(activePowerUps.speed)}s</div>`;
  if (activePowerUps.fury > 0) html += `<div class="powerup-indicator" style="border-color:#f59e0b">\uD83D\uDD25 ${Math.ceil(activePowerUps.fury)}s</div>`;
  c.innerHTML = html;
}

// --- WAVE ANNOUNCEMENT ---
function announceWave(num) {
  const el = document.getElementById('wave-announce');
  const textEl = document.getElementById('wave-announce-text');
  if (num % 5 === 0) {
    const idx = Math.min(Math.floor((num - 5) / 5), BOSSES.length - 1);
    const bdef = BOSSES[Math.max(0, idx)];
    textEl.innerHTML = `<span style="color:${bdef.color};font-size:1.2em">${bdef.name}</span><br><span style="font-size:0.5em;color:#aaa">${bdef.desc}</span>`;
  } else {
    textEl.textContent = `WAVE ${num}`;
  }
  el.classList.remove('hidden');
  el.style.animation = 'none'; void el.offsetWidth;
  el.style.animation = 'waveIn 2.5s ease-out forwards';
  setTimeout(() => el.classList.add('hidden'), 2700);
}

// --- UPDATE ---
function update(dt) {
  if (state !== 'playing') return;

  // Player movement
  let dx = 0, dy = 0;
  if (keys['w'] || keys['arrowup']) dy = -1;
  if (keys['s'] || keys['arrowdown']) dy = 1;
  if (keys['a'] || keys['arrowleft']) dx = -1;
  if (keys['d'] || keys['arrowright']) dx = 1;
  if (dx || dy) {
    const len = Math.hypot(dx, dy);
    const spdMult = activePowerUps.speed > 0 ? 2 : 1;
    player.x += (dx/len) * player.speed * spdMult * dt;
    player.y += (dy/len) * player.speed * spdMult * dt;
    player.moving = true; player.animTime += dt;
    if (Math.random() < 0.3) spawnParticles(player.x, player.y+12, '#555', 1, 30, 0.4, 3);
  } else { player.moving = false; }
  player.x = clamp(player.x, 20, W-20);
  player.y = clamp(player.y, 20, H-20);
  player.facing = angle(player, mouse);
  player.fireTimer = Math.max(0, player.fireTimer - dt);
  player.invulnTimer = Math.max(0, player.invulnTimer - dt);
  player.hitFlash = Math.max(0, player.hitFlash - dt);

  // Firing
  if (mouse.down) fireWeapon();

  // Power-up timers
  for (const k of ['shield','speed','fury']) {
    if (activePowerUps[k] > 0) { activePowerUps[k] -= dt; if (activePowerUps[k] <= 0) { activePowerUps[k] = 0; player.shieldHits = 0; } }
  }
  showPowerUpIndicators();

  // Combo timer
  if (comboTimer > 0) { comboTimer -= dt; if (comboTimer <= 0) comboCount = 0; }

  // Wave logic
  const bossAlive = boss && boss.hp > 0;
  const betweenWaves = !waveActive && waveEnemiesLeft <= 0 && enemies.length === 0 && !bossAlive && bossWarningTimer <= 0;
  if (betweenWaves) {
    waveTimer -= dt;
    if (waveTimer <= 0) {
      wave++;
      if (wave % 5 === 0) {
        // Boss wave
        bossWarningTimer = 2.0;
      } else {
        waveActive = true;
        waveEnemiesLeft = CFG.waveEnemies(wave);
        waveSpawnTimer = 0; announceWave(wave);
      }
    }
  }
  // Boss warning countdown
  if (bossWarningTimer > 0) {
    bossWarningTimer -= dt;
    if (bossWarningTimer <= 0) { spawnBoss(wave); }
  }
  if (waveActive && waveEnemiesLeft > 0) {
    waveSpawnTimer -= dt;
    if (waveSpawnTimer <= 0) { spawnEnemy(); waveEnemiesLeft--; waveSpawnTimer = rand(0.4, 1.2); if (waveEnemiesLeft <= 0) { waveActive = false; waveTimer = CFG.waveCooldown; } }
  }

  // --- BOSS UPDATE ---
  if (boss && boss.hp > 0) {
    const ba = angle(boss, player);
    const bSpdMult = boss.slow > 0 ? 0.4 : 1;
    boss.animTime += dt;
    boss.hitFlash = Math.max(0, boss.hitFlash - dt);
    boss.slow = Math.max(0, boss.slow - dt);

    // Phase check — enrage at 30% HP
    if (!boss.enraged && boss.hp / boss.maxHp <= 0.3) {
      boss.enraged = true;
      boss.speed *= 1.4;
      spawnParticles(boss.x, boss.y, '#ff0000', 30, 250, 0.8, 8);
      spawnFloatText(boss.x, boss.y - boss.size - 20, 'ENRAGED!', '#ff0000');
      doShake(10, 0.4);
    }

    // Boss movement
    boss.x += Math.cos(ba) * boss.speed * bSpdMult * dt;
    boss.y += Math.sin(ba) * boss.speed * bSpdMult * dt;
    boss.x = clamp(boss.x, boss.size, W - boss.size);
    boss.y = clamp(boss.y, boss.size, H - boss.size);

    // Boss attacks
    boss.attackTimer -= dt * (boss.enraged ? 1.5 : 1);
    if (boss.attackTimer <= 0) {
      boss.attackTimer = boss.def.attackRate;
      bossAttack(boss);
    }

    // Boss hits player
    if (dist(boss, player) < boss.size + player.w * 0.7) {
      if (player.invulnTimer <= 0) {
        if (activePowerUps.shield > 0 && player.shieldHits > 0) {
          player.shieldHits--; if (player.shieldHits <= 0) activePowerUps.shield = 0;
          spawnParticles(player.x, player.y, '#3b82f6', 12, 200, 0.5, 5);
          spawnFloatText(player.x, player.y - 20, 'Blocked!', '#3b82f6');
        } else {
          player.health -= boss.damage; player.hitFlash = 0.2;
          spawnParticles(player.x, player.y, '#ff0000', 12, 200, 0.5, 5);
          doShake(10, 0.25);
        }
        player.invulnTimer = 0.5;
      }
      const pushA = angle(player, boss);
      boss.x += Math.cos(pushA) * -30; boss.y += Math.sin(pushA) * -30;
    }

    // Projectiles hit boss
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      if (dist(p, boss) < p.size + boss.size) {
        boss.hp -= p.damage; boss.hitFlash = 0.1;
        spawnParticles(p.x, p.y, p.color, 6, 120, 0.3, 3);
        if (p.weaponIdx === 3) boss.slow = 1.5;
        if (!p.pierce) { projectiles.splice(i, 1); }
      }
    }

    // Boss death
    if (boss.hp <= 0) {
      // Massive explosion
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          if (!boss) return;
          spawnParticles(boss.x + rand(-30,30), boss.y + rand(-30,30), boss.def.color, 25, 300, 0.8, 8);
          doShake(12, 0.3);
        }, i * 150);
      }
      score += boss.score;
      spawnFloatText(boss.x, boss.y - 40, `+${boss.score}`, '#ffd700');
      spawnFloatText(boss.x, boss.y - 65, `${boss.def.name} DEFEATED!`, boss.def.color);
      // Drop 5 gems
      for (let i = 0; i < 5; i++) spawnGem(boss.x + rand(-40,40), boss.y + rand(-40,40));
      boss = null; bossProjectiles = [];
      waveTimer = CFG.waveCooldown;
    }
  }

  // Update boss projectiles
  for (let i = bossProjectiles.length - 1; i >= 0; i--) {
    const bp = bossProjectiles[i];
    bp.x += bp.vx * dt; bp.y += bp.vy * dt; bp.life -= dt;
    if (bp.life <= 0 || bp.x < -50 || bp.x > W+50 || bp.y < -50 || bp.y > H+50) {
      bossProjectiles.splice(i, 1); continue;
    }
    // Hit player
    if (dist(bp, player) < bp.size + player.w * 0.6) {
      if (player.invulnTimer <= 0) {
        if (activePowerUps.shield > 0 && player.shieldHits > 0) {
          player.shieldHits--; if (player.shieldHits <= 0) activePowerUps.shield = 0;
          spawnParticles(player.x, player.y, '#3b82f6', 8, 150, 0.4, 4);
        } else {
          player.health -= bp.damage; player.hitFlash = 0.15;
          spawnParticles(player.x, player.y, '#ff0000', 6, 120, 0.3, 4);
          doShake(5, 0.12);
        }
        player.invulnTimer = 0.3;
      }
      bossProjectiles.splice(i, 1);
    }
  }

  // Update enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    const a = angle(e, player);
    const spdMult = e.slow > 0 ? 0.4 : 1;
    e.x += Math.cos(a) * e.speed * spdMult * dt;
    e.y += Math.sin(a) * e.speed * spdMult * dt;
    e.animTime += dt; e.hitFlash = Math.max(0, e.hitFlash - dt); e.slow = Math.max(0, e.slow - dt);
    // Enemy hits player
    if (dist(e, player) < e.size + player.w * 0.7) {
      if (player.invulnTimer <= 0) {
        if (activePowerUps.shield > 0 && player.shieldHits > 0) {
          player.shieldHits--; if (player.shieldHits <= 0) activePowerUps.shield = 0;
          spawnParticles(player.x, player.y, '#3b82f6', 12, 200, 0.5, 5);
          spawnFloatText(player.x, player.y - 20, 'Blocked!', '#3b82f6');
        } else {
          player.health -= e.damage; player.hitFlash = 0.2;
          spawnParticles(player.x, player.y, '#ff0000', 8, 150, 0.4, 4);
          doShake(6, 0.15);
        }
        player.invulnTimer = 0.4;
      }
      const pushA = angle(player, e);
      e.x += Math.cos(pushA) * 40; e.y += Math.sin(pushA) * 40;
    }
    if (e.hp <= 0) {
      spawnParticles(e.x, e.y, ENEMY_TYPES[e.type].color, 20, 200, 0.6, 6);
      score += e.score * (1 + Math.floor(comboCount/5));
      comboCount++; comboTimer = 2;
      if (comboCount > 1) spawnFloatText(e.x, e.y - 25, `${comboCount}x Combo!`, '#f59e0b');
      if (Math.random() < CFG.gemChance) spawnGem(e.x, e.y);
      doShake(4, 0.1); enemies.splice(i, 1);
    }
  }

  // Update projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
    spawnTrail(p.x, p.y, p.trail, p.size * 0.5);
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (dist(p, e) < p.size + e.size) {
        e.hp -= p.damage; e.hitFlash = 0.12;
        spawnParticles(p.x, p.y, p.color, 6, 120, 0.3, 3);
        if (p.weaponIdx === 3) e.slow = 2;
        if (p.weaponIdx === 2) {
          const nearby = enemies.filter(en => en !== e && dist(e, en) < 120);
          if (nearby.length > 0) {
            nearby[0].hp -= p.damage * 0.5; nearby[0].hitFlash = 0.12;
            particles.push({ x: e.x, y: e.y, vx: nearby[0].x, vy: nearby[0].y, life: 0.15, maxLife: 0.15, color: '#0ff', size: -1 });
          }
        }
        if (!p.pierce) { projectiles.splice(i, 1); break; }
      }
    }
    if (projectiles[i] && (p.life <= 0 || p.x < -50 || p.x > W+50 || p.y < -50 || p.y > H+50)) projectiles.splice(i, 1);
  }

  // Update gems — fly toward player
  for (let i = gems.length - 1; i >= 0; i--) {
    const g = gems[i]; g.bobTime += dt; g.life -= dt; g.sparkle += dt;
    if (g.life <= 0) { gems.splice(i, 1); continue; }
    // Gems accelerate toward the player
    const d = dist(g, player);
    const pullSpeed = Math.max(350, 800 - d); // faster when closer
    const a = angle(g, player);
    g.x += Math.cos(a) * pullSpeed * dt;
    g.y += Math.sin(a) * pullSpeed * dt;
    // Collect on contact
    if (!g.collected && d < 25) {
      g.collected = true; gemsHeld++; totalGems++;
      spawnParticles(g.x, g.y, '#67e8f9', 10, 100, 0.4, 4);
      spawnFloatText(player.x, player.y - 25, '+1 Gem', '#67e8f9');
      gems.splice(i, 1);
      if (gemsHeld >= CFG.gemsPerChoice) showChoice();
    }
  }

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    if (p.size !== -1) { p.x += p.vx * dt; p.y += p.vy * dt; }
    p.life -= dt; if (p.life <= 0) particles.splice(i, 1);
  }

  // Float texts
  for (let i = floatTexts.length - 1; i >= 0; i--) {
    floatTexts[i].y -= 40 * dt; floatTexts[i].life -= dt;
    if (floatTexts[i].life <= 0) floatTexts.splice(i, 1);
  }

  // Screen shake
  if (screenShakeTimer > 0) { screenShakeTimer -= dt; if (screenShakeTimer <= 0) screenShake = 0; }

  // Death check
  if (player.health <= 0) { player.health = 0; state = 'gameover'; showGameOver(); }

  updateHUD();
}

// --- RENDER ---
function render() {
  ctx.save();
  if (screenShake > 0) ctx.translate(rand(-screenShake, screenShake), rand(-screenShake, screenShake));

  // Background
  ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, W, H);

  // Stars
  bgStars.forEach(s => {
    ctx.globalAlpha = s.b * (0.7 + 0.3 * Math.sin(Date.now() * 0.002 + s.x));
    ctx.fillStyle = '#fff'; ctx.fillRect(s.x, s.y, s.s, s.s);
  });
  ctx.globalAlpha = 1;

  // Ground grid
  ctx.strokeStyle = 'rgba(168,85,247,0.06)'; ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

  // Particles
  particles.forEach(p => {
    if (p.size === -1) {
      ctx.strokeStyle = p.color; ctx.lineWidth = 2; ctx.shadowColor = p.color; ctx.shadowBlur = 10;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.beginPath(); ctx.moveTo(p.x, p.y);
      const ddx = p.vx - p.x, ddy = p.vy - p.y;
      for (let s = 1; s <= 5; s++) { const t = s/5; ctx.lineTo(p.x + ddx*t + rand(-10,10), p.y + ddy*t + rand(-10,10)); }
      ctx.stroke(); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    } else {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha; ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    }
  });

  // Gems
  gems.forEach(g => {
    const bob = Math.sin(g.bobTime * 3) * 4;
    const glow = 0.5 + 0.5 * Math.sin(g.sparkle * 5);
    ctx.save(); ctx.translate(g.x, g.y + bob);
    ctx.shadowColor = '#67e8f9'; ctx.shadowBlur = 10 + glow * 10;
    ctx.fillStyle = `rgba(103,232,249,${0.7 + glow*0.3})`;
    ctx.beginPath(); ctx.moveTo(0,-8); ctx.lineTo(7,0); ctx.lineTo(0,8); ctx.lineTo(-7,0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = `rgba(255,255,255,${0.3 + glow*0.3})`;
    ctx.beginPath(); ctx.moveTo(0,-4); ctx.lineTo(3,0); ctx.lineTo(0,4); ctx.lineTo(-3,0); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0; ctx.restore();
  });

  // Enemies
  enemies.forEach(e => {
    const type = ENEMY_TYPES[e.type];
    ctx.save(); ctx.translate(e.x, e.y);
    const wobble = Math.sin(e.animTime * 6) * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(0, e.size*0.7, e.size*0.7, e.size*0.25, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = e.hitFlash > 0 ? '#fff' : type.color;
    ctx.shadowColor = type.color; ctx.shadowBlur = e.type === 4 ? 20 : 8;
    ctx.beginPath(); ctx.arc(0, wobble, e.size, 0, Math.PI*2); ctx.fill();
    const grad = ctx.createRadialGradient(-e.size*0.3, -e.size*0.3+wobble, 0, 0, wobble, e.size);
    grad.addColorStop(0, 'rgba(255,255,255,0.2)'); grad.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(0, wobble, e.size, 0, Math.PI*2); ctx.fill();
    ctx.shadowColor = e.type===3 ? '#c084fc' : '#ff0000'; ctx.shadowBlur = 6;
    ctx.fillStyle = e.type===3 ? '#c084fc' : '#ff4444';
    const eo = e.size * 0.25;
    ctx.beginPath(); ctx.arc(-eo, -eo*0.5+wobble, e.size*0.12, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(eo, -eo*0.5+wobble, e.size*0.12, 0, Math.PI*2); ctx.fill();
    if (e.type >= 2) {
      ctx.shadowBlur = 0; const bw = e.size*1.6;
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-bw/2, -e.size-12, bw, 4);
      ctx.fillStyle = type.color; ctx.fillRect(-bw/2, -e.size-12, bw*(e.hp/e.maxHp), 4);
    }
    if (e.type === 3) ctx.globalAlpha = 0.6 + 0.2*Math.sin(e.animTime*4);
    ctx.shadowBlur = 0; ctx.restore();
  });

  // Boss
  if (boss && boss.hp > 0) {
    const b = boss;
    ctx.save(); ctx.translate(b.x, b.y);
    const wobble = Math.sin(b.animTime * 3) * 3;
    const pulse = 1 + 0.05 * Math.sin(b.animTime * 4);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath(); ctx.ellipse(0, b.size*0.7, b.size*0.8, b.size*0.3, 0, 0, Math.PI*2); ctx.fill();

    // Aura rings
    ctx.strokeStyle = b.def.color + '40'; ctx.lineWidth = 2;
    const auraR = b.size * 1.3 + Math.sin(b.animTime * 2) * 8;
    ctx.beginPath(); ctx.arc(0, wobble, auraR, 0, Math.PI*2); ctx.stroke();
    if (b.enraged) {
      ctx.strokeStyle = '#ff000050'; ctx.lineWidth = 3;
      const r2 = b.size * 1.6 + Math.sin(b.animTime * 5) * 10;
      ctx.beginPath(); ctx.arc(0, wobble, r2, 0, Math.PI*2); ctx.stroke();
    }

    // Body — main circle
    ctx.fillStyle = b.hitFlash > 0 ? '#fff' : b.def.color;
    ctx.shadowColor = b.def.color; ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.arc(0, wobble, b.size * pulse, 0, Math.PI*2); ctx.fill();

    // Inner dark gradient
    const bg = ctx.createRadialGradient(0, wobble, b.size*0.2, 0, wobble, b.size);
    bg.addColorStop(0, b.def.color2 + '80');
    bg.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(0, wobble, b.size * pulse, 0, Math.PI*2); ctx.fill();

    // Crown / horns
    ctx.fillStyle = b.def.color;
    ctx.shadowBlur = 10;
    for (let i = -2; i <= 2; i++) {
      const hx = i * b.size * 0.25;
      const hy = -b.size * 0.8 + wobble - Math.abs(i) * 4;
      ctx.beginPath();
      ctx.moveTo(hx - 5, -b.size * 0.4 + wobble);
      ctx.lineTo(hx, hy);
      ctx.lineTo(hx + 5, -b.size * 0.4 + wobble);
      ctx.closePath(); ctx.fill();
    }

    // Eyes — large, menacing
    const eyeGlow = b.enraged ? '#ff0000' : '#ff4444';
    ctx.shadowColor = eyeGlow; ctx.shadowBlur = 15;
    ctx.fillStyle = eyeGlow;
    const eyeOff = b.size * 0.28;
    const eyeSize = b.size * 0.14;
    ctx.beginPath(); ctx.arc(-eyeOff, -eyeOff*0.3 + wobble, eyeSize, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(eyeOff, -eyeOff*0.3 + wobble, eyeSize, 0, Math.PI*2); ctx.fill();
    // Eye pupils
    ctx.fillStyle = '#000';
    const pa = angle(b, player);
    ctx.beginPath(); ctx.arc(-eyeOff + Math.cos(pa)*3, -eyeOff*0.3 + wobble + Math.sin(pa)*2, eyeSize*0.45, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(eyeOff + Math.cos(pa)*3, -eyeOff*0.3 + wobble + Math.sin(pa)*2, eyeSize*0.45, 0, Math.PI*2); ctx.fill();

    // Mouth
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(-b.size*0.3, b.size*0.2 + wobble);
    for (let i = 0; i < 6; i++) {
      const mx = -b.size*0.3 + (b.size*0.6/(5)) * i;
      const my = b.size*0.2 + wobble + (i%2===0 ? 0 : 8);
      ctx.lineTo(mx, my);
    }
    ctx.stroke();

    // Ambient particles around boss
    if (Math.random() < 0.4) {
      const pa2 = rand(0, Math.PI*2);
      spawnParticles(b.x + Math.cos(pa2)*b.size, b.y + Math.sin(pa2)*b.size, b.def.color, 1, 40, 0.5, 3);
    }

    ctx.shadowBlur = 0; ctx.restore();

    // --- Boss HP bar (top of screen) ---
    const barW = Math.min(500, W * 0.6);
    const barH = 16;
    const barX = (W - barW) / 2;
    const barY = 50;
    const hpPct = boss.hp / boss.maxHp;
    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.beginPath();
    ctx.roundRect(barX - 4, barY - 4, barW + 8, barH + 8, 6);
    ctx.fill();
    // Track
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 4); ctx.fill();
    // Fill
    const hpGrad = ctx.createLinearGradient(barX, 0, barX + barW * hpPct, 0);
    hpGrad.addColorStop(0, boss.def.color);
    hpGrad.addColorStop(1, boss.enraged ? '#ff0000' : boss.def.color2 || boss.def.color);
    ctx.fillStyle = hpGrad;
    ctx.shadowColor = boss.def.color; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.roundRect(barX, barY, barW * hpPct, barH, 4); ctx.fill();
    ctx.shadowBlur = 0;
    // Name
    ctx.fillStyle = boss.def.color;
    ctx.font = 'bold 14px system-ui'; ctx.textAlign = 'center';
    ctx.shadowColor = boss.def.color; ctx.shadowBlur = 8;
    ctx.fillText(boss.def.name, W/2, barY - 8);
    ctx.shadowBlur = 0;
    // HP text
    ctx.fillStyle = '#fff'; ctx.font = '11px system-ui';
    ctx.fillText(`${Math.ceil(boss.hp)} / ${Math.ceil(boss.maxHp)}`, W/2, barY + barH - 3);
  }

  // Boss warning flash
  if (bossWarningTimer > 0) {
    const flash = Math.sin(bossWarningTimer * 12) * 0.3;
    ctx.fillStyle = `rgba(255,0,0,${Math.max(0, flash)})`;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ff4444'; ctx.font = 'bold 48px system-ui'; ctx.textAlign = 'center';
    ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 20;
    ctx.fillText('WARNING', W/2, H/2 - 20);
    ctx.font = '24px system-ui'; ctx.fillStyle = '#ff8888';
    ctx.fillText('BOSS INCOMING', W/2, H/2 + 20);
    ctx.shadowBlur = 0;
  }

  // Boss projectiles
  bossProjectiles.forEach(bp => {
    ctx.save(); ctx.translate(bp.x, bp.y);
    ctx.shadowColor = bp.color; ctx.shadowBlur = 10;
    ctx.fillStyle = bp.color;
    ctx.beginPath(); ctx.arc(0, 0, bp.size, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.arc(0, 0, bp.size * 0.4, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0; ctx.restore();
    spawnTrail(bp.x, bp.y, bp.color, bp.size * 0.4);
  });

  // Projectiles
  projectiles.forEach(p => {
    ctx.save(); ctx.translate(p.x, p.y);
    ctx.rotate(Math.atan2(p.vy, p.vx));
    ctx.shadowColor = p.color; ctx.shadowBlur = 12; ctx.fillStyle = p.color;
    if (p.weaponIdx === 0) {
      ctx.rotate(Date.now()*0.015); ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const ang = (Math.PI/2)*i;
        ctx.lineTo(Math.cos(ang)*p.size, Math.sin(ang)*p.size);
        ctx.lineTo(Math.cos(ang+Math.PI/4)*p.size*0.35, Math.sin(ang+Math.PI/4)*p.size*0.35);
      }
      ctx.closePath(); ctx.fill(); ctx.strokeStyle='#fff'; ctx.lineWidth=0.5; ctx.stroke();
    } else if (p.weaponIdx === 1) {
      ctx.beginPath(); ctx.ellipse(0,0,p.size,p.size*0.6,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#ff0'; ctx.beginPath(); ctx.ellipse(2,0,p.size*0.4,p.size*0.3,0,0,Math.PI*2); ctx.fill();
    } else if (p.weaponIdx === 2) {
      ctx.strokeStyle=p.color; ctx.lineWidth=3; ctx.beginPath();
      ctx.moveTo(-p.size,0); ctx.lineTo(-2,-3); ctx.lineTo(2,3); ctx.lineTo(p.size,0); ctx.stroke();
    } else if (p.weaponIdx === 3) {
      ctx.beginPath(); ctx.moveTo(p.size,0); ctx.lineTo(0,-p.size*0.5); ctx.lineTo(-p.size*0.6,0); ctx.lineTo(0,p.size*0.5); ctx.closePath(); ctx.fill();
    } else {
      ctx.rotate(Date.now()*0.02); ctx.beginPath(); ctx.arc(0,0,p.size,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#0a0a1a';
      for (let i=0;i<6;i++){const ang=(Math.PI/3)*i; ctx.beginPath(); ctx.arc(Math.cos(ang)*p.size*0.5,Math.sin(ang)*p.size*0.5,3,0,Math.PI*2); ctx.fill();}
    }
    ctx.shadowBlur = 0; ctx.restore();
  });

  // Player
  drawPlayer();

  // Float texts
  floatTexts.forEach(f => {
    ctx.globalAlpha = f.life/f.maxLife; ctx.fillStyle = f.color;
    ctx.font = 'bold 16px system-ui'; ctx.textAlign = 'center';
    ctx.shadowColor = f.color; ctx.shadowBlur = 6;
    ctx.fillText(f.text, f.x, f.y); ctx.shadowBlur = 0;
  });
  ctx.globalAlpha = 1;

  // Combo
  if (comboCount >= 3) {
    ctx.fillStyle='#f59e0b'; ctx.font='bold 24px system-ui'; ctx.textAlign='right';
    ctx.shadowColor='#f59e0b'; ctx.shadowBlur=10;
    ctx.fillText(`${comboCount}x COMBO`, W-30, H-90); ctx.shadowBlur=0;
  }

  // Crosshair
  if (state === 'playing') {
    ctx.strokeStyle='rgba(168,85,247,0.6)'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.arc(mouse.x,mouse.y,12,0,Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mouse.x-16,mouse.y); ctx.lineTo(mouse.x-8,mouse.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mouse.x+8,mouse.y); ctx.lineTo(mouse.x+16,mouse.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mouse.x,mouse.y-16); ctx.lineTo(mouse.x,mouse.y-8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mouse.x,mouse.y+8); ctx.lineTo(mouse.x,mouse.y+16); ctx.stroke();
  }
  ctx.restore();
}

function drawPlayer() {
  ctx.save(); ctx.translate(player.x, player.y);
  // Shadow
  ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(0,16,16,5,0,0,Math.PI*2); ctx.fill();
  // Shield aura
  if (activePowerUps.shield > 0) {
    ctx.strokeStyle='rgba(59,130,246,0.5)'; ctx.lineWidth=2; ctx.shadowColor='#3b82f6'; ctx.shadowBlur=15;
    ctx.beginPath(); ctx.arc(0,0,28,0,Math.PI*2); ctx.stroke(); ctx.shadowBlur=0;
  }
  // Speed rings
  if (activePowerUps.speed > 0) {
    ctx.strokeStyle='rgba(34,197,94,0.3)'; ctx.lineWidth=1;
    for (let i=0;i<3;i++){const off=((Date.now()*0.01+i*30)%40)-20; ctx.beginPath(); ctx.arc(0,0,20+off,0,Math.PI*2); ctx.stroke();}
  }
  const bob = player.moving ? Math.sin(player.animTime*12)*2 : 0;
  ctx.globalAlpha = player.invulnTimer > 0 ? 0.5+0.5*Math.sin(Date.now()*0.03) : (player.hitFlash>0?0.5:1);
  // Legs
  ctx.fillStyle='#1a1a2e';
  const ls = player.moving ? Math.sin(player.animTime*12)*4 : 0;
  ctx.beginPath(); ctx.ellipse(-5,10+ls,5,7,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(5,10-ls,5,7,0,0,Math.PI*2); ctx.fill();
  // Body
  ctx.fillStyle='#2d1b4e'; ctx.beginPath(); ctx.ellipse(0,bob,14,16,0,0,Math.PI*2); ctx.fill();
  const bg = ctx.createRadialGradient(-4,-4+bob,0,0,bob,16);
  bg.addColorStop(0,'rgba(168,85,247,0.2)'); bg.addColorStop(1,'rgba(0,0,0,0.2)');
  ctx.fillStyle=bg; ctx.beginPath(); ctx.ellipse(0,bob,14,16,0,0,Math.PI*2); ctx.fill();
  // Belt
  ctx.fillStyle='#7c3aed'; ctx.fillRect(-12,-1+bob,24,3);
  // Arms
  ctx.fillStyle='#2d1b4e';
  const as = player.moving ? Math.sin(player.animTime*12)*8 : 0;
  ctx.beginPath(); ctx.ellipse(-14,bob+as,5,6,0.2,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(14,bob-as,5,6,-0.2,0,Math.PI*2); ctx.fill();
  // Head
  ctx.fillStyle='#fbbf24'; ctx.beginPath(); ctx.arc(0,-14+bob,10,0,Math.PI*2); ctx.fill();
  // Hair
  ctx.fillStyle='#451a03'; ctx.beginPath(); ctx.arc(0,-17+bob,10,Math.PI,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0,-17+bob,11,4,0,Math.PI*0.8,Math.PI*2.2); ctx.fill();
  for (let i=-2;i<=2;i++){ctx.beginPath(); ctx.moveTo(i*4,-22+bob); ctx.lineTo(i*4-2,-27+bob+Math.abs(i)); ctx.lineTo(i*4+2,-27+bob+Math.abs(i)); ctx.closePath(); ctx.fill();}
  // Eyes
  ctx.fillStyle='#1a1a2e';
  ctx.beginPath(); ctx.arc(-3.5,-15+bob,1.5,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(3.5,-15+bob,1.5,0,Math.PI*2); ctx.fill();
  // Mouth
  ctx.strokeStyle='#1a1a2e'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.arc(0,-11+bob,3,0.1,Math.PI-0.1); ctx.stroke();
  // Weapon glow
  const wx = Math.cos(player.facing)*20, wy = Math.sin(player.facing)*20;
  ctx.shadowColor=WEAPONS[player.weaponIdx].color; ctx.shadowBlur=8;
  ctx.fillStyle=WEAPONS[player.weaponIdx].color;
  ctx.beginPath(); ctx.arc(wx,wy+bob,3,0,Math.PI*2); ctx.fill();
  ctx.shadowBlur=0; ctx.globalAlpha=1;
  ctx.restore();
}

// --- GAME OVER ---
function showGameOver() {
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('final-score').textContent = `Score: ${score}`;
  document.getElementById('final-stats').innerHTML = `Waves survived: ${wave}<br>Gems collected: ${totalGems}`;
  document.getElementById('screen-gameover').classList.remove('hidden');
}

// --- GAME LOOP ---
let lastTime = 0;
function gameLoop(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;
  update(dt); render();
  requestAnimationFrame(gameLoop);
}

// --- START ---
function startGame() {
  document.getElementById('screen-title').classList.add('hidden');
  document.getElementById('screen-gameover').classList.add('hidden');
  document.getElementById('choice-modal').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  initGame(); state = 'playing';
}

document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-restart').addEventListener('click', startGame);
canvas.style.cursor = 'none';
initGame();
requestAnimationFrame(gameLoop);

})();
