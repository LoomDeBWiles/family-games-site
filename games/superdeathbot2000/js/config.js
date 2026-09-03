'use strict';
/* ============================================================
   SUPERDEATHBOT 2000 - all tunable numbers live here.
   Tweak freely; nothing else needs to change.
   ============================================================ */

const CFG = {
  PLAYER: {
    baseRadius: 14,
    growthPerLevel: 1.9,
    baseSpeed: 218,
    speedPerRadius: 0.85,
    baseHP: 120,
    hpPerLevel: 16,
    levelHealPct: 0.30,
    crushSlack: 21,      // no crushing until radius exceeds this
    crushMul: 2.4,       // crushHeight = (radius - crushSlack) * crushMul
    crushDps: 3.0,       // walking into a too-tall building still grinds it down
    invuln: 0.45,
    accel: 12,
  },

  XP: { curveA: 50, curveP: 1.45, mult: 1.0 },
  UPGRADE_EVERY: 10,

  CAM: { baseZoom: 1.15, zoomK: 46, min: 0.13, max: 1.4, follow: 5.5, aimLead: 0.10 },

  CITY: { road: 64, block: 232, margin: 150, gridCell: 180 },

  // fake-3d extrusion
  VIEW: { hUp: 0.45, hSpread: 0.00055, spreadMax: 0.35 },

  AIRSTRIKE: { warn: 1.7, radius: 130, dmg: 55, count: 5, spacing: 0.28 },

  // Screen shake. scale 0 turns it off completely, 1 is the original
  // teeth-rattling amount. cap limits how violent a single nuke can get.
  SHAKE: { scale: 0.40, cap: 18 },

  AUTOSAVE: 15,   // seconds between background saves

  // OVERDRIVE: while it is up, nothing else you own has a cooldown.
  // cdFloor is a safety valve, not a balance knob - at a true 0 the auto
  // abilities fire once per frame, and 15 seconds of held-down NUKE spawns
  // hundreds of blasts and chokes the browser. 0.10 still reads as "no
  // cooldown" on screen. Drop it to 0 if you want it truly uncapped.
  OVERDRIVE: { time: 15, cdFloor: 0.10 },

  // ---- realism ----
  // You walk straight through buildings, grinding them down as you go -
  // being stopped by a skyscraper is not what a superdeathbot is for.
  // Flip player back to true to make them solid walls again.
  // Enemies still have to drive around them.
  COLLIDE: { player: false, enemies: true, grind: 1.1 },

  // Damage dealt to whatever you are standing inside, as a fraction of its
  // max HP per second, scaled by how fast you are moving through it.
  PLOW: { dps: 0.55, minSpeedFrac: 0.25, dustRate: 22 },

  // Structures set alight keep burning, spreading to close neighbours.
  BURN: { dps: 0.045, tick: 0.35, spread: 0.16, spreadRange: 95, maxLit: 90 },

  // Scorch marks and craters left on the ground by explosions.
  DECAL: { max: 220 },

  // Cars driving the streets, on top of the parked ones.
  TRAFFIC: { count: 46, speed: [55, 115], flee: 300 },
};

/* ---------- building archetypes ---------- */
const ARCH = {
  house:      { w:[34,54],   d:[34,54],   h:[24,40],   hp:  90, wall:'#6d5a4e', roof:'#8a7263', win:'#ffcc80' },
  shop:       { w:[54,86],   d:[44,68],   h:[32,52],   hp: 170, wall:'#5b6a74', roof:'#78909c', win:'#80deea' },
  office:     { w:[64,98],   d:[64,98],   h:[92,180],  hp: 540, wall:'#4d6069', roof:'#68828e', win:'#b3e5fc' },
  tower:      { w:[70,102],  d:[70,102],  h:[190,320], hp:1150, wall:'#42555f', roof:'#5b7581', win:'#c5e9fb' },
  skyscraper: { w:[80,122],  d:[80,122],  h:[320,540], hp:2500, wall:'#37474f', roof:'#51686f', win:'#e1f5fe' },
  factory:    { w:[112,176], d:[92,142],  h:[52,94],   hp: 920, wall:'#5d4a3e', roof:'#7a6252', win:'#ffab40' },
  stadium:    { w:[172,236], d:[152,206], h:[62,104],  hp:1850, wall:'#43554a', roof:'#5d7365', win:'#dcedc8' },
  megatower:  { w:[112,168], d:[112,168], h:[540,920], hp:5400, wall:'#2b383f', roof:'#44585f', win:'#ffffff' },
};

/* ---------- props (small crushable scenery) ---------- */
const PROPS = {
  car:       { w:[14,20], d:[26,36], h:[12,16], hp: 22, wall:'#b0473c', roof:'#d4695c' },
  tree:      { w:[20,30], d:[20,30], h:[26,44], hp: 18, wall:'#3f5b34', roof:'#5d8a4a' },
  lamp:      { w:[5,7],   d:[5,7],   h:[30,40], hp: 10, wall:'#546e7a', roof:'#ffe082' },
  billboard: { w:[46,70], d:[8,12],  h:[42,62], hp: 40, wall:'#455a64', roof:'#ef5350' },
  watertank: { w:[26,36], d:[26,36], h:[34,52], hp: 60, wall:'#78909c', roof:'#b0bec5' },
};

/* ---------- city tiers ---------- */
const TIERS = [
  { name:'SUBURBIA',    blocks: 7, hpMul:1.00, sizeMul:1.00,
    mix:{ house:9, shop:3, office:1 },
    enemies:{ police:{rate:5.5,max:6} }, airstrike:0,
    ground:'#1b2a1d', road:'#22262b', sky:'#0b1119' },

  { name:'DOWNTOWN',    blocks: 9, hpMul:1.55, sizeMul:1.08,
    mix:{ house:3, shop:5, office:6, tower:2, factory:2 },
    enemies:{ police:{rate:4.5,max:7}, tank:{rate:8.5,max:5} }, airstrike:0,
    ground:'#25262c', road:'#1b1e23', sky:'#0d1220' },

  { name:'METROPOLIS',  blocks:11, hpMul:2.35, sizeMul:1.16,
    mix:{ shop:3, office:7, tower:5, skyscraper:3, factory:2, stadium:1 },
    enemies:{ police:{rate:5,max:6}, tank:{rate:6,max:7}, heli:{rate:7.5,max:5} }, airstrike:18,
    ground:'#22242b', road:'#17191e', sky:'#10111f' },

  { name:'MEGACITY',    blocks:13, hpMul:3.40, sizeMul:1.26,
    mix:{ office:4, tower:6, skyscraper:7, megatower:3, stadium:2, factory:2 },
    enemies:{ tank:{rate:5,max:8}, heli:{rate:5.5,max:6}, jet:{rate:9,max:3}, mech:{rate:40,max:1} }, airstrike:13,
    ground:'#1e2027', road:'#141519', sky:'#120d1c' },

  { name:'NEO-CAPITAL', blocks:15, hpMul:4.80, sizeMul:1.38,
    mix:{ tower:5, skyscraper:8, megatower:6, stadium:2, factory:2 },
    enemies:{ tank:{rate:4,max:9}, heli:{rate:4.5,max:7}, jet:{rate:7,max:4}, mech:{rate:30,max:2} }, airstrike:10,
    ground:'#1a1c26', road:'#111218', sky:'#0d0a1a' },
];

/* ---------- enemies ---------- */
const ENEMY_DEFS = {
  police: { hp:  60, speed:230, dmg: 9, r:12, xp: 22, score:  60, ai:'ram',    color:'#2b4a8f', accent:'#ff5252' },
  tank:   { hp: 430, speed: 80, dmg:28, r:19, xp: 95, score: 220, ai:'shoot',  color:'#4d5b3f', accent:'#8d9a6b', range:430, cd:2.4, shot:430 },
  heli:   { hp: 310, speed:160, dmg:17, r:17, xp:115, score: 280, ai:'strafe', color:'#3d4a52', accent:'#90a4ae', range:380, cd:1.5, shot:350 },
  jet:    { hp: 240, speed:520, dmg:36, r:16, xp:140, score: 340, ai:'pass',   color:'#5a6a78', accent:'#cfd8dc', bombs:7 },
  mech:   { hp:3400, speed:118, dmg:46, r:38, xp:950, score:2600, ai:'boss',   color:'#5c2f4a', accent:'#ff4081', range:470, cd:1.1, shot:400, boss:true },
};

/* ============================================================
   ABILITIES - 9 of them, 5 ranks each. Rank 5 is the evolution.
   mode 'auto'   : fires itself on cooldown
   mode 'manual' : bound to a key / mouse button
   ============================================================ */
const ABILITY_DEFS = {

  machinegun: {
    name:'MACHINE GUN', glyph:'≡', mode:'auto', kb:'',
    blurb:'Rapid tracer fire at the nearest target.',
    evo:'MINIGUN',
    ranks:[
      { dmg: 16, cd:0.110, range:330, barrels:1, spread:0.10, speed: 900 },
      { dmg: 25, cd:0.100, range:355, barrels:1, spread:0.10, speed: 940 },
      { dmg: 33, cd:0.090, range:380, barrels:2, spread:0.13, speed: 980 },
      { dmg: 47, cd:0.075, range:425, barrels:2, spread:0.11, speed:1030 },
      { dmg: 64, cd:0.055, range:480, barrels:3, spread:0.14, speed:1100, ricochet:2 },
    ],
    up:['+55% damage','Twin barrels, faster fire','+damage, +range','MINIGUN - three barrels, bullets ricochet'],
  },

  missiles: {
    name:'MISSILE LAUNCH', glyph:'➶', mode:'auto', kb:'',
    blurb:'Volley of homing missiles with a splash blast.',
    evo:'SWARM',
    ranks:[
      { dmg: 60, cd:2.20, count:2, range:520, splash: 54, speed:330, turn:3.4 },
      { dmg: 82, cd:2.00, count:3, range:560, splash: 60, speed:350, turn:3.6 },
      { dmg:108, cd:1.70, count:4, range:600, splash: 68, speed:370, turn:3.8 },
      { dmg:142, cd:1.45, count:5, range:650, splash: 78, speed:395, turn:4.1 },
      { dmg:178, cd:1.20, count:6, range:700, splash: 88, speed:420, turn:4.4, split:3 },
    ],
    up:['+1 missile, +damage','+1 missile, faster reload','+1 missile, bigger blast','SWARM - six missiles that split on impact'],
  },

  laser: {
    name:'LASER ZAP', glyph:'⚡', mode:'auto', kb:'',
    blurb:'Instant beam that pierces everything in a line.',
    evo:'PRISM',
    ranks:[
      { dmg: 95, cd:1.50, range:520, width: 5, forks:1 },
      { dmg:135, cd:1.30, range:560, width: 7, forks:1 },
      { dmg:190, cd:1.10, range:610, width: 9, forks:1 },
      { dmg:260, cd:0.90, range:670, width:12, forks:1 },
      { dmg:340, cd:0.75, range:770, width:17, forks:3 },
    ],
    up:['+42% damage, thicker beam','+damage, +range','+damage, much faster','PRISM - the beam forks three ways'],
  },

  drones: {
    name:'MINI DRONES', glyph:'◈', mode:'auto', kb:'',
    blurb:'Drones orbit you and shoot anything nearby.',
    evo:'HIVE',
    ranks:[
      { count:2, dmg:20, cd:0.50, orbit: 72, range:280, speed:660 },
      { count:3, dmg:28, cd:0.50, orbit: 80, range:300, speed:680 },
      { count:4, dmg:37, cd:0.42, orbit: 90, range:320, speed:700 },
      { count:5, dmg:49, cd:0.36, orbit:100, range:345, speed:730 },
      { count:6, dmg:64, cd:0.30, orbit:114, range:380, speed:780, kamikaze:true },
    ],
    up:['+1 drone, +damage','+1 drone, faster guns','+1 drone, wider orbit','HIVE - six drones that also kamikaze dive'],
  },

  spiders: {
    name:'SPIDER BOTS', glyph:'✳', mode:'auto', kb:'',
    blurb:'Crawlers seek out buildings, latch on and gnaw.',
    evo:'BROODMOTHER',
    ranks:[
      { count:2, cd:3.40, dmg:26, bite:0.55, life:14, boom: 90, speed:195 },
      { count:3, cd:3.10, dmg:36, bite:0.50, life:15, boom:100, speed:205 },
      { count:3, cd:2.70, dmg:48, bite:0.44, life:16, boom:115, speed:220 },
      { count:4, cd:2.35, dmg:60, bite:0.38, life:17, boom:130, speed:235 },
      { count:5, cd:2.00, dmg:76, bite:0.32, life:18, boom:150, speed:255, brood:2 },
    ],
    up:['+1 spider, +damage','Faster bite, bigger death blast','+1 spider, +damage','BROODMOTHER - each spider spawns two more when it dies'],
  },

  bazooka: {
    name:'BAZOOKA', glyph:'⌖', mode:'manual', kb:'Q',
    blurb:'Big aimed shell. Heavy splash, slow reload.',
    evo:'QUAD BARREL',
    ranks:[
      { dmg:270, cd:2.60, splash:112, speed:540, shells:1, spread:0    },
      { dmg:350, cd:2.30, splash:126, speed:560, shells:1, spread:0    },
      { dmg:440, cd:2.00, splash:142, speed:585, shells:2, spread:0.13 },
      { dmg:540, cd:1.75, splash:160, speed:610, shells:3, spread:0.20 },
      { dmg:660, cd:1.45, splash:186, speed:650, shells:4, spread:0.28 },
    ],
    up:['+30% damage','Double shot','Triple shot, bigger blast','QUAD BARREL - four shells, huge blast'],
  },

  smash: {
    name:'SUPER SMASH', glyph:'◎', mode:'manual', kb:'SPACE',
    blurb:'Ground pound. Shockwave radius scales with your size.',
    evo:'SEISMIC',
    ranks:[
      { dmg:190, cd:2.40, rMul:1.00 },
      { dmg:265, cd:2.15, rMul:1.22 },
      { dmg:350, cd:1.90, rMul:1.46 },
      { dmg:440, cd:1.65, rMul:1.74 },
      { dmg:560, cd:1.35, rMul:2.10, fissure:true },
    ],
    up:['+40% damage, wider wave','+damage, wider wave','+damage, faster recovery','SEISMIC - leaves a burning fissure behind'],
  },

  nuke: {
    name:'NUKE', glyph:'☢', mode:'manual', kb:'E',
    blurb:'City-block-erasing warhead. Very long reload.',
    evo:'MIRV',
    ranks:[
      { dmg:2600, cd:30, radius:620, heads:1 },
      { dmg:3300, cd:26, radius:700, heads:1 },
      { dmg:4100, cd:23, radius:780, heads:1 },
      { dmg:5000, cd:19, radius:840, heads:1 },
      { dmg:6200, cd:16, radius:920, heads:3 },
    ],
    up:['+27% damage, bigger radius','+damage, bigger radius','+damage, much faster reload','MIRV - three independent warheads'],
  },

  chomp: {
    name:'CHOMPITY CHOMP', glyph:'◕', mode:'manual', kb:'RMB',
    blurb:'Bite a building four times. Eating it HEALS you and pays double XP.',
    evo:'BLACK HOLE MAW',
    ranks:[
      { cd:1.20, reach:1.7, bites:4, biteTime:0.16, bitePct:0.18, healPct:0.10, xpMul:2.0, vacuum:0   },
      { cd:1.05, reach:1.9, bites:4, biteTime:0.14, bitePct:0.21, healPct:0.13, xpMul:2.2, vacuum:0   },
      { cd:0.90, reach:2.1, bites:4, biteTime:0.12, bitePct:0.24, healPct:0.16, xpMul:2.4, vacuum:0   },
      { cd:0.70, reach:2.3, bites:4, biteTime:0.10, bitePct:0.27, healPct:0.19, xpMul:2.7, vacuum:0   },
      { cd:0.50, reach:2.7, bites:4, biteTime:0.09, bitePct:0.32, healPct:0.23, xpMul:3.0, vacuum:280 },
    ],
    up:['Bigger bites, more healing','Longer reach, faster chewing','Much faster, more healing','BLACK HOLE MAW - inhales cars, trees and debris too'],
  },

  /* ---------- second wave of abilities ---------- */

  flamethrower: {
    name:'FLAMETHROWER', glyph:'🔥', mode:'manual', kb:'F', hold:true,
    blurb:'Short-range cone of fire. Sets buildings burning long after the flame stops.',
    evo:'NAPALM',
    ranks:[
      { dmg:18, cd:0.060, range:155, arc:0.55, burn: 4 },
      { dmg:25, cd:0.055, range:175, arc:0.60, burn: 5 },
      { dmg:33, cd:0.050, range:198, arc:0.65, burn: 7 },
      { dmg:44, cd:0.045, range:225, arc:0.72, burn: 9 },
      { dmg:60, cd:0.040, range:265, arc:0.82, burn:14, napalm:true },
    ],
    up:['+40% damage, longer flame','+damage, wider cone','+damage, longer burn','NAPALM - leaves burning ground that spreads'],
  },

  railgun: {
    name:'RAILGUN', glyph:'✦', mode:'manual', kb:'R',
    blurb:'Charged slug that punches through an entire city block in a straight line.',
    evo:'ANNIHILATOR',
    ranks:[
      { dmg: 900, cd:4.5, range:1400, width:13, charge:0.45 },
      { dmg:1250, cd:4.0, range:1600, width:16, charge:0.40 },
      { dmg:1650, cd:3.5, range:1800, width:19, charge:0.34 },
      { dmg:2100, cd:3.0, range:2000, width:22, charge:0.28 },
      { dmg:2800, cd:2.4, range:2400, width:28, charge:0.20, quake:true },
    ],
    up:['+39% damage, faster charge','+damage, +range','+damage, much faster','ANNIHILATOR - the shot cracks the ground it crosses'],
  },

  chain: {
    name:'CHAIN LIGHTNING', glyph:'⌁', mode:'auto', kb:'',
    blurb:'Arcs from target to target, losing a little bite with each jump.',
    evo:'STORMCALLER',
    ranks:[
      { dmg: 70, cd:1.60, range:340, jumps:3, jumpRange:200, falloff:0.78 },
      { dmg: 96, cd:1.40, range:380, jumps:4, jumpRange:225, falloff:0.82 },
      { dmg:128, cd:1.20, range:410, jumps:5, jumpRange:245, falloff:0.86 },
      { dmg:162, cd:1.05, range:440, jumps:6, jumpRange:262, falloff:0.90 },
      { dmg:210, cd:0.85, range:480, jumps:9, jumpRange:300, falloff:0.95 },
    ],
    up:['+1 jump, +damage','+1 jump, longer arcs','+1 jump, less falloff','STORMCALLER - nine jumps that barely weaken'],
  },

  buzzsaws: {
    name:'BUZZSAWS', glyph:'✸', mode:'auto', kb:'',
    blurb:'Circular blades orbit you, grinding anything they touch.',
    evo:'MEATGRINDER',
    ranks:[
      { count:2, dmg: 34, tick:0.25, orbit: 80, size:15, spin:3.2 },
      { count:3, dmg: 48, tick:0.22, orbit: 90, size:17, spin:3.6 },
      { count:3, dmg: 66, tick:0.19, orbit:100, size:20, spin:4.1 },
      { count:4, dmg: 90, tick:0.16, orbit:110, size:23, spin:4.6 },
      { count:5, dmg:124, tick:0.13, orbit:124, size:27, spin:5.2, rip:true },
    ],
    up:['+1 blade, +damage','Bigger, faster blades','+1 blade, +damage','MEATGRINDER - five huge blades that shred armour'],
  },

  jumpjets: {
    name:'JUMP JETS', glyph:'⇪', mode:'manual', kb:'SHIFT',
    blurb:'Launch to where you are aiming and land like a dropped anvil.',
    evo:'ORBITAL DROP',
    ranks:[
      { cd:4.0, dist:420, dmg:200, rMul:1.4, air:0.42 },
      { cd:3.4, dist:500, dmg:290, rMul:1.6, air:0.40 },
      { cd:2.8, dist:580, dmg:390, rMul:1.8, air:0.38 },
      { cd:2.3, dist:670, dmg:500, rMul:2.1, air:0.36 },
      { cd:1.8, dist:780, dmg:660, rMul:2.5, air:0.33, shock:true },
    ],
    up:['+45% damage, further leap','+damage, further leap','+damage, faster recharge','ORBITAL DROP - lands with a second shockwave'],
  },

  ram: {
    name:'RAM', glyph:'⇥', mode:'manual', kb:'X',
    blurb:'Charge in a straight line. Buildings crumple, enemies get thrown aside.',
    evo:'JUGGERNAUT',
    ranks:[
      { cd:3.2, dist:340, speed:1150, dmg:260, width:1.50, knock:520 },
      { cd:2.8, dist:405, speed:1230, dmg:365, width:1.62, knock:580 },
      { cd:2.4, dist:475, speed:1320, dmg:490, width:1.78, knock:650 },
      { cd:2.0, dist:550, speed:1420, dmg:640, width:1.95, knock:720 },
      { cd:1.5, dist:650, speed:1580, dmg:880, width:2.20, knock:860, trail:true },
    ],
    up:['+40% damage, longer charge','+damage, wider plow','+damage, faster recharge','JUGGERNAUT - the wreckage behind you detonates'],
  },

  singularity: {
    name:'SINGULARITY', glyph:'◉', mode:'manual', kb:'C',
    blurb:'Drops a gravity well that drags the neighbourhood into itself.',
    evo:'EVENT HORIZON',
    ranks:[
      { cd:9.0, radius:230, pull:280, dps:180, life:2.4 },
      { cd:8.0, radius:265, pull:330, dps:250, life:2.6 },
      { cd:7.0, radius:300, pull:390, dps:330, life:2.9 },
      { cd:6.0, radius:340, pull:450, dps:420, life:3.1 },
      { cd:5.0, radius:390, pull:540, dps:560, life:3.4, implode:true },
    ],
    up:['Wider well, +damage','+pull, +damage','+damage, faster recharge','EVENT HORIZON - collapses into a final implosion'],
  },

  // The only single-rank ability. rollCards skips it once you own it, so it
  // never comes back to eat a second level-up choice.
  overdrive: {
    name:'OVERDRIVE', glyph:'∞', mode:'manual', kb:'V', noUpgrade:true,
    blurb:'For 15 seconds nothing else you own has a cooldown. Never upgrades.',
    evo:'OVERDRIVE',
    ranks:[
      { cd:60, time:CFG.OVERDRIVE.time },
    ],
    up:[],
  },

  /* ---------- third wave of abilities ---------- */

  cryo: {
    name:'CRYO CANNON', glyph:'❄', mode:'auto', kb:'',
    blurb:'Freezing burst that slows everything caught in it and leaves it brittle.',
    evo:'ABSOLUTE ZERO',
    ranks:[
      { dmg: 55, cd:2.20, range:340, radius:120, slow:0.55, time:2.0, brittle:1.15 },
      { dmg: 78, cd:2.00, range:375, radius:140, slow:0.50, time:2.4, brittle:1.22 },
      { dmg:105, cd:1.75, range:410, radius:162, slow:0.44, time:2.8, brittle:1.30 },
      { dmg:140, cd:1.50, range:450, radius:186, slow:0.36, time:3.2, brittle:1.40 },
      { dmg:195, cd:1.20, range:510, radius:225, slow:0.20, time:4.2, brittle:1.75, shatter:0.32 },
    ],
    up:['+42% damage, wider burst','+damage, colder slow','+damage, faster reload','ABSOLUTE ZERO - near-total freeze, and wounded enemies shatter outright'],
  },

  tesla: {
    name:'TESLA COIL', glyph:'⌇', mode:'auto', kb:'',
    blurb:'Pulses a ring of current through everything standing too close.',
    evo:'ARC REACTOR',
    ranks:[
      { dmg: 44, cd:0.90, radius:130 },
      { dmg: 62, cd:0.80, radius:150 },
      { dmg: 86, cd:0.70, radius:172 },
      { dmg:116, cd:0.60, radius:196 },
      { dmg:158, cd:0.48, radius:230, chain:4 },
    ],
    up:['+40% damage, wider ring','+damage, faster pulse','+damage, wider ring','ARC REACTOR - every pulse also throws a four-jump arc'],
  },

  scatter: {
    name:'SCATTERGUN', glyph:'⁂', mode:'auto', kb:'',
    blurb:'Short-range wall of pellets. Devastating up close, useless far away.',
    evo:"DRAGON'S BREATH",
    ranks:[
      { dmg: 15, cd:0.95, range:200, pellets: 7, spread:0.40, speed:760 },
      { dmg: 21, cd:0.85, range:220, pellets: 9, spread:0.42, speed:790 },
      { dmg: 28, cd:0.75, range:240, pellets:11, spread:0.44, speed:820 },
      { dmg: 37, cd:0.65, range:265, pellets:13, spread:0.46, speed:860 },
      { dmg: 50, cd:0.50, range:300, pellets:16, spread:0.50, speed:920, burn:6 },
    ],
    up:['+2 pellets, +damage','+2 pellets, longer reach','+2 pellets, faster reload',"DRAGON'S BREATH - sixteen incendiary pellets that set the block alight"],
  },

  mortar: {
    name:'MORTAR BATTERY', glyph:'⌃', mode:'auto', kb:'',
    blurb:'Lobs shells over the rooftops onto distant targets.',
    evo:'CARPET BOMB',
    ranks:[
      { dmg:190, cd:2.60, count:2, range: 900, radius:100, scatter:55 },
      { dmg:250, cd:2.35, count:2, range: 980, radius:112, scatter:58 },
      { dmg:325, cd:2.10, count:3, range:1060, radius:124, scatter:62 },
      { dmg:415, cd:1.85, count:4, range:1150, radius:138, scatter:66 },
      { dmg:540, cd:1.50, count:5, range:1300, radius:158, scatter:72, cluster:3 },
    ],
    up:['+32% damage, bigger blast','+1 shell, +range','+1 shell, +damage','CARPET BOMB - every shell breaks into three bomblets'],
  },

  orbital: {
    name:'ORBITAL STRIKE', glyph:'⊕', mode:'manual', kb:'G',
    blurb:'Paints where you are aiming and calls down a barrage from the satellite grid.',
    evo:'KILL SAT',
    ranks:[
      { cd:11.0, dmg: 420, count: 4, radius:120, spread:150, reach:430, delay:1.5, stagger:0.18 },
      { cd: 9.5, dmg: 560, count: 5, radius:132, spread:170, reach:470, delay:1.4, stagger:0.16 },
      { cd: 8.0, dmg: 730, count: 7, radius:145, spread:195, reach:510, delay:1.3, stagger:0.14 },
      { cd: 6.5, dmg: 940, count: 9, radius:158, spread:220, reach:550, delay:1.2, stagger:0.12 },
      { cd: 5.0, dmg:1250, count:13, radius:180, spread:260, reach:610, delay:1.0, stagger:0.10, beam:true },
    ],
    up:['+1 impact, +damage','+2 impacts, +damage','+2 impacts, faster recharge','KILL SAT - thirteen impacts and a burning glassed crater'],
  },

  mines: {
    name:'PROXIMITY MINES', glyph:'◘', mode:'manual', kb:'Z',
    blurb:'Scatters mines around you. They arm, they wait, they take a leg off.',
    evo:'MINEFIELD',
    ranks:[
      { cd:5.0, dmg: 320, count:3, radius:110, trigger: 70, spread: 90, life:16 },
      { cd:4.4, dmg: 430, count:4, radius:122, trigger: 78, spread:105, life:18 },
      { cd:3.8, dmg: 570, count:5, radius:136, trigger: 86, spread:120, life:20 },
      { cd:3.2, dmg: 730, count:6, radius:150, trigger: 94, spread:135, life:22 },
      { cd:2.5, dmg: 980, count:8, radius:172, trigger:108, spread:160, life:26, child:3 },
    ],
    up:['+1 mine, +damage','+1 mine, bigger blast','+1 mine, faster recharge','MINEFIELD - eight mines, each seeding three more when it blows'],
  },

  shield: {
    name:'DEFLECTOR SHIELD', glyph:'◇', mode:'passive', kb:'',
    blurb:'A recharging bubble that eats damage before your chassis ever feels it.',
    evo:'BULWARK',
    ranks:[
      { cap: 60, regen:0.16, delay:4.0, burst:  0 },
      { cap:110, regen:0.20, delay:3.5, burst:  0 },
      { cap:175, regen:0.25, delay:3.0, burst:120 },
      { cap:260, regen:0.32, delay:2.5, burst:200 },
      { cap:400, regen:0.45, delay:1.8, burst:420 },
    ],
    up:['+83% capacity, faster recharge','+capacity, and it detonates when it breaks','+capacity, quicker to come back','BULWARK - 400 points of shielding and a huge break blast'],
  },

  armor: {
    name:'REACTIVE ARMOR', glyph:'⛊', mode:'passive', kb:'',
    blurb:'Plating that soaks incoming damage and spits some of it back.',
    evo:'FORTRESS PLATING',
    ranks:[
      { reduce:0.10, thorns:  0, hp: 40 },
      { reduce:0.17, thorns: 60, hp: 90 },
      { reduce:0.24, thorns:110, hp:150 },
      { reduce:0.31, thorns:170, hp:220 },
      { reduce:0.40, thorns:260, hp:320 },
    ],
    up:['+7% resist, reflects damage','+resist, +max HP','+resist, +thorns','FORTRESS PLATING - 40% resist and a heavy counterblast'],
  },

  nanites: {
    name:'REPAIR NANITES', glyph:'✚', mode:'passive', kb:'',
    blurb:'Constantly rebuilds your chassis, and patches you up on every kill.',
    evo:'SELF-FORGE',
    ranks:[
      { regen:0.010, onKill:0.000 },
      { regen:0.017, onKill:0.008 },
      { regen:0.025, onKill:0.014 },
      { regen:0.034, onKill:0.022 },
      { regen:0.048, onKill:0.038 },
    ],
    up:['+70% regen, heals on kills','+regen, +kill healing','+regen, +kill healing','SELF-FORGE - heavy regeneration, big kill healing'],
  },
};

const ABILITY_ORDER = [
  'machinegun','missiles','laser','drones','spiders','chain','buzzsaws','scatter','tesla','cryo','mortar',
  'bazooka','smash','nuke','chomp','flamethrower','railgun','jumpjets','ram','singularity','orbital','mines',
  'overdrive','armor','nanites','shield',
];
const STARTING_ABILITY = 'machinegun';
const SAVE_KEY = 'superdeathbot2000.save.v1';
