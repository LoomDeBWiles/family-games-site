// Tower types and classes - Realistic version with more towers

const TowerTypes = {
    BASIC: 'basic',
    SNIPER: 'sniper',
    CANNON: 'cannon',
    FROST: 'frost',
    POISON: 'poison',
    LASER: 'laser',
    TESLA: 'tesla',
    FLAME: 'flame',
    MISSILE: 'missile',
    RAILGUN: 'railgun',
    MINIGUN: 'minigun',
    MORTAR: 'mortar',
    SHOCKWAVE: 'shockwave',
    PLASMA: 'plasma',
    EMP: 'emp',
    VORTEX: 'vortex',
    SAW: 'saw',
    NUKE: 'nuke',
    LIGHTNING: 'lightning',
    DEATH_RAY: 'death_ray',
    GATLING: 'gatling',
    ACID: 'acid',
    DRONE: 'drone',
    VAMPIRE: 'vampire',
    METEOR: 'meteor',
    BARRACKS: 'barracks'
};

const TowerData = {
    [TowerTypes.BASIC]: {
        name: 'Machine Gun',
        description: 'Rapid fire turret',
        cost: 50,
        damage: 15,
        range: 120,
        fireRate: 400,
        color: '#5a5a5a',
        projectileSpeed: 500,
        projectileColor: '#ffd700',
        upgrades: [
            { cost: 40, damage: 22, range: 130, projectileSpeed: 525, fireRate: 380 },
            { cost: 80, damage: 35, range: 145, projectileSpeed: 550, fireRate: 360 },
            { cost: 150, damage: 55, range: 160, projectileSpeed: 580, fireRate: 340 }
        ]
    },
    [TowerTypes.SNIPER]: {
        name: 'Sniper Tower',
        description: 'Long range, high damage',
        cost: 100,
        damage: 100,
        range: 280,
        fireRate: 1800,
        color: '#2c3e50',
        projectileSpeed: 1000,
        projectileColor: '#e74c3c',
        upgrades: [
            { cost: 80, damage: 150, range: 310, projectileSpeed: 1050, fireRate: 1700 },
            { cost: 150, damage: 220, range: 340, projectileSpeed: 1100, fireRate: 1620 },
            { cost: 300, damage: 350, range: 380, projectileSpeed: 1150, fireRate: 1540 }
        ]
    },
    [TowerTypes.CANNON]: {
        name: 'Artillery',
        description: 'Explosive splash damage',
        cost: 125,
        damage: 40,
        range: 130,
        fireRate: 1500,
        color: '#8B4513',
        projectileSpeed: 200,
        projectileColor: '#333',
        splashRadius: 60,
        upgrades: [
            { cost: 100, damage: 60, range: 145, splashRadius: 70, projectileSpeed: 215, fireRate: 1420 },
            { cost: 200, damage: 90, range: 160, splashRadius: 85, projectileSpeed: 230, fireRate: 1350 },
            { cost: 350, damage: 130, range: 175, splashRadius: 100, projectileSpeed: 245, fireRate: 1280 }
        ]
    },
    [TowerTypes.FROST]: {
        name: 'Cryo Tower',
        description: 'Freezes and slows enemies',
        cost: 100,
        damage: 10,
        range: 110,
        fireRate: 600,
        color: '#4fc3f7',
        projectileSpeed: 350,
        projectileColor: '#81d4fa',
        slowAmount: 0.4,
        slowDuration: 2000,
        upgrades: [
            { cost: 80, damage: 15, slowAmount: 0.5, slowDuration: 2500, projectileSpeed: 370, fireRate: 570 },
            { cost: 160, damage: 22, slowAmount: 0.6, slowDuration: 3000, projectileSpeed: 390, fireRate: 540 },
            { cost: 300, damage: 32, slowAmount: 0.7, slowDuration: 3500, projectileSpeed: 410, fireRate: 510 }
        ]
    },
    [TowerTypes.POISON]: {
        name: 'Chemical Sprayer',
        description: 'Toxic damage over time',
        cost: 125,
        damage: 8,
        range: 100,
        fireRate: 800,
        color: '#7cb342',
        projectileSpeed: 280,
        projectileColor: '#8bc34a',
        poisonDamage: 20,
        poisonDuration: 3000,
        upgrades: [
            { cost: 100, damage: 12, poisonDamage: 35, poisonDuration: 3500, projectileSpeed: 295, fireRate: 760 },
            { cost: 200, damage: 18, poisonDamage: 50, poisonDuration: 4000, projectileSpeed: 310, fireRate: 720 },
            { cost: 350, damage: 25, poisonDamage: 75, poisonDuration: 4500, projectileSpeed: 330, fireRate: 680 }
        ]
    },
    [TowerTypes.LASER]: {
        name: 'Laser Cannon',
        description: 'Continuous beam, ramps damage',
        cost: 200,
        damage: 5,
        range: 160,
        fireRate: 80,
        color: '#e91e63',
        isBeam: true,
        upgrades: [
            { cost: 150, damage: 8, range: 175, fireRate: 76 },
            { cost: 300, damage: 12, range: 190, fireRate: 72 },
            { cost: 500, damage: 18, range: 210, fireRate: 68 }
        ]
    },
    [TowerTypes.TESLA]: {
        name: 'Tesla Coil',
        description: 'Chain lightning hits multiple enemies',
        cost: 175,
        damage: 30,
        range: 120,
        fireRate: 1000,
        color: '#9c27b0',
        chainCount: 3,
        chainRange: 80,
        upgrades: [
            { cost: 120, damage: 45, chainCount: 4, fireRate: 950 },
            { cost: 240, damage: 65, chainCount: 5, chainRange: 100, fireRate: 900 },
            { cost: 400, damage: 90, chainCount: 6, chainRange: 120, fireRate: 850 }
        ]
    },
    [TowerTypes.FLAME]: {
        name: 'Flamethrower',
        description: 'Burns all enemies in cone',
        cost: 150,
        damage: 8,
        range: 90,
        fireRate: 100,
        color: '#ff5722',
        coneAngle: 0.6,
        burnDamage: 15,
        burnDuration: 2000,
        upgrades: [
            { cost: 100, damage: 12, burnDamage: 25, range: 100, fireRate: 95 },
            { cost: 200, damage: 18, burnDamage: 40, range: 110, fireRate: 90 },
            { cost: 350, damage: 25, burnDamage: 60, range: 120, fireRate: 85 }
        ]
    },
    [TowerTypes.MISSILE]: {
        name: 'Missile Launcher',
        description: 'Homing missiles with splash',
        cost: 200,
        damage: 80,
        range: 180,
        fireRate: 2000,
        color: '#607d8b',
        projectileSpeed: 150,
        projectileColor: '#455a64',
        splashRadius: 50,
        isHoming: true,
        upgrades: [
            { cost: 150, damage: 120, splashRadius: 60, projectileSpeed: 160, fireRate: 1900 },
            { cost: 300, damage: 180, splashRadius: 75, range: 200, projectileSpeed: 170, fireRate: 1800 },
            { cost: 500, damage: 260, splashRadius: 90, range: 220, projectileSpeed: 185, fireRate: 1700 }
        ]
    },
    [TowerTypes.RAILGUN]: {
        name: 'Railgun',
        description: 'Pierces through all enemies in line',
        cost: 300,
        damage: 200,
        range: 350,
        fireRate: 3000,
        color: '#00bcd4',
        isPiercing: true,
        upgrades: [
            { cost: 200, damage: 300, range: 380, fireRate: 2850 },
            { cost: 400, damage: 450, range: 420, fireRate: 2700 },
            { cost: 700, damage: 650, range: 500, fireRate: 2550 }
        ]
    },
    [TowerTypes.MINIGUN]: {
        name: 'Minigun',
        description: 'Extremely fast fire rate',
        cost: 175,
        damage: 8,
        range: 130,
        fireRate: 80,
        color: '#795548',
        projectileSpeed: 600,
        projectileColor: '#ffeb3b',
        upgrades: [
            { cost: 120, damage: 12, range: 140, projectileSpeed: 630, fireRate: 76 },
            { cost: 220, damage: 18, range: 150, fireRate: 68, projectileSpeed: 660 },
            { cost: 400, damage: 25, range: 165, fireRate: 60, projectileSpeed: 700 }
        ]
    },
    [TowerTypes.MORTAR]: {
        name: 'Mortar',
        description: 'Long range explosive shells',
        cost: 150,
        damage: 60,
        range: 250,
        fireRate: 2500,
        color: '#5d4037',
        projectileSpeed: 120,
        projectileColor: '#3e2723',
        splashRadius: 80,
        isArcing: true,
        upgrades: [
            { cost: 120, damage: 90, splashRadius: 95, projectileSpeed: 130, fireRate: 2400 },
            { cost: 250, damage: 140, splashRadius: 110, range: 280, projectileSpeed: 140, fireRate: 2300 },
            { cost: 450, damage: 200, splashRadius: 130, range: 320, projectileSpeed: 150, fireRate: 2200 }
        ]
    },
    [TowerTypes.SHOCKWAVE]: {
        name: 'Shockwave',
        description: 'Pulses damage to all nearby enemies',
        cost: 225,
        damage: 25,
        range: 100,
        fireRate: 1200,
        color: '#ff9800',
        isShockwave: true,
        upgrades: [
            { cost: 150, damage: 40, range: 115, fireRate: 1140 },
            { cost: 300, damage: 60, range: 130, fireRate: 1080 },
            { cost: 500, damage: 85, range: 150, fireRate: 1020 }
        ]
    },
    [TowerTypes.PLASMA]: {
        name: 'Plasma Cannon',
        description: 'Superheated plasma with splash burn',
        cost: 250,
        damage: 70,
        range: 150,
        fireRate: 1400,
        color: '#76ff03',
        projectileSpeed: 350,
        projectileColor: '#b2ff59',
        splashRadius: 40,
        burnDamage: 30,
        burnDuration: 2500,
        upgrades: [
            { cost: 180, damage: 100, burnDamage: 45, projectileSpeed: 370, fireRate: 1330 },
            { cost: 350, damage: 150, burnDamage: 65, splashRadius: 50, projectileSpeed: 390, fireRate: 1260 },
            { cost: 600, damage: 220, burnDamage: 90, splashRadius: 65, projectileSpeed: 410, fireRate: 1190 }
        ]
    },
    [TowerTypes.EMP]: {
        name: 'EMP Tower',
        description: 'Stuns and heavily slows all enemies in range',
        cost: 275,
        damage: 15,
        range: 120,
        fireRate: 3000,
        color: '#2196f3',
        isEMP: true,
        stunDuration: 1000,
        slowAmount: 0.7,
        slowDuration: 4000,
        upgrades: [
            { cost: 200, damage: 25, stunDuration: 1300, range: 135, fireRate: 2850 },
            { cost: 400, damage: 40, stunDuration: 1600, slowAmount: 0.8, range: 150, fireRate: 2700 },
            { cost: 650, damage: 60, stunDuration: 2000, slowAmount: 0.85, range: 170, fireRate: 2550 }
        ]
    },
    [TowerTypes.VORTEX]: {
        name: 'Black Hole',
        description: 'Gravity well pulls enemies backward',
        cost: 350,
        damage: 10,
        range: 130,
        fireRate: 2000,
        color: '#4a0080',
        isVortex: true,
        slowAmount: 0.9,
        slowDuration: 1500,
        upgrades: [
            { cost: 250, damage: 15, range: 145, slowDuration: 1800, fireRate: 1900 },
            { cost: 450, damage: 25, range: 160, slowDuration: 2200, fireRate: 1800 },
            { cost: 700, damage: 40, range: 180, slowDuration: 2800, fireRate: 1700 }
        ]
    },
    [TowerTypes.SAW]: {
        name: 'Saw Launcher',
        description: 'Bouncing saw blades ricochet between enemies',
        cost: 200,
        damage: 35,
        range: 140,
        fireRate: 1200,
        color: '#b0bec5',
        projectileSpeed: 300,
        projectileColor: '#cfd8dc',
        bounceCount: 3,
        bounceRange: 100,
        upgrades: [
            { cost: 150, damage: 50, bounceCount: 4, projectileSpeed: 320, fireRate: 1140 },
            { cost: 300, damage: 75, bounceCount: 5, bounceRange: 120, projectileSpeed: 340, fireRate: 1080 },
            { cost: 500, damage: 110, bounceCount: 6, bounceRange: 140, projectileSpeed: 365, fireRate: 1020 }
        ]
    },
    [TowerTypes.NUKE]: {
        name: 'Nuclear Silo',
        description: 'Massive explosion, extreme damage',
        cost: 500,
        damage: 500,
        range: 200,
        fireRate: 8000,
        color: '#ff1744',
        projectileSpeed: 120,
        projectileColor: '#d50000',
        splashRadius: 150,
        isArcing: true,
        upgrades: [
            { cost: 400, damage: 750, splashRadius: 170, projectileSpeed: 125, fireRate: 7700 },
            { cost: 700, damage: 1100, splashRadius: 190, range: 230, projectileSpeed: 130, fireRate: 7400 },
            { cost: 1000, damage: 1600, splashRadius: 220, range: 260, projectileSpeed: 140, fireRate: 7100 }
        ]
    },
    [TowerTypes.LIGHTNING]: {
        name: 'Storm Tower',
        description: 'Random lightning strikes on multiple enemies',
        cost: 225,
        damage: 45,
        range: 140,
        fireRate: 1000,
        color: '#ffd600',
        isLightning: true,
        strikeCount: 3,
        upgrades: [
            { cost: 160, damage: 65, strikeCount: 4, range: 155, fireRate: 950 },
            { cost: 320, damage: 95, strikeCount: 5, range: 170, fireRate: 900 },
            { cost: 550, damage: 140, strikeCount: 6, range: 190, fireRate: 850 }
        ]
    },
    [TowerTypes.DEATH_RAY]: {
        name: 'Death Ray',
        description: 'Devastating beam, extreme single-target damage',
        cost: 400,
        damage: 300,
        range: 200,
        fireRate: 4000,
        color: '#d50000',
        isDeathRay: true,
        upgrades: [
            { cost: 300, damage: 450, range: 220, fireRate: 3850 },
            { cost: 550, damage: 650, range: 250, fireRate: 3700 },
            { cost: 900, damage: 1000, range: 280, fireRate: 3550 }
        ]
    },
    [TowerTypes.GATLING]: {
        name: 'Gatling Gun',
        description: 'Spins up — fires faster the longer it shoots',
        cost: 175,
        damage: 12,
        range: 130,
        fireRate: 500,
        color: '#6d4c41',
        projectileSpeed: 550,
        projectileColor: '#ffcc00',
        isGatling: true,
        upgrades: [
            { cost: 120, damage: 18, range: 140, projectileSpeed: 575, fireRate: 475 },
            { cost: 240, damage: 26, range: 155, projectileSpeed: 600, fireRate: 450 },
            { cost: 420, damage: 38, range: 170, projectileSpeed: 630, fireRate: 425 }
        ]
    },
    [TowerTypes.ACID]: {
        name: 'Acid Sprayer',
        description: 'Corrosive acid slows and melts enemies',
        cost: 150,
        damage: 12,
        range: 110,
        fireRate: 700,
        color: '#aeea00',
        projectileSpeed: 300,
        projectileColor: '#c6ff00',
        slowAmount: 0.3,
        slowDuration: 1500,
        poisonDamage: 25,
        poisonDuration: 3000,
        upgrades: [
            { cost: 100, damage: 18, poisonDamage: 40, slowAmount: 0.4, projectileSpeed: 315, fireRate: 665 },
            { cost: 200, damage: 25, poisonDamage: 60, slowAmount: 0.5, slowDuration: 2000, projectileSpeed: 330, fireRate: 630 },
            { cost: 380, damage: 35, poisonDamage: 85, slowAmount: 0.6, slowDuration: 2500, projectileSpeed: 350, fireRate: 595 }
        ]
    },
    [TowerTypes.DRONE]: {
        name: 'Drone Bay',
        description: 'Launches swarms of attack drones',
        cost: 275,
        damage: 20,
        range: 160,
        fireRate: 1800,
        color: '#00acc1',
        projectileSpeed: 400,
        projectileColor: '#26c6da',
        isDrone: true,
        droneCount: 3,
        upgrades: [
            { cost: 200, damage: 30, droneCount: 4, projectileSpeed: 420, fireRate: 1710 },
            { cost: 380, damage: 45, droneCount: 5, range: 180, projectileSpeed: 440, fireRate: 1620 },
            { cost: 600, damage: 65, droneCount: 6, range: 200, projectileSpeed: 465, fireRate: 1530 }
        ]
    },
    [TowerTypes.VAMPIRE]: {
        name: 'Soul Harvester',
        description: 'Drains life force from enemies',
        cost: 300,
        damage: 50,
        range: 140,
        fireRate: 1400,
        color: '#880e4f',
        isVampire: true,
        upgrades: [
            { cost: 220, damage: 80, range: 155, fireRate: 1330 },
            { cost: 420, damage: 120, range: 170, fireRate: 1260 },
            { cost: 700, damage: 180, range: 190, fireRate: 1190 }
        ]
    },
    [TowerTypes.METEOR]: {
        name: 'Meteor Strike',
        description: 'Rains meteors at random spots in range',
        cost: 450,
        damage: 120,
        range: 180,
        fireRate: 2500,
        color: '#e65100',
        isMeteor: true,
        meteorCount: 3,
        splashRadius: 55,
        upgrades: [
            { cost: 300, damage: 180, meteorCount: 4, splashRadius: 65, fireRate: 2400 },
            { cost: 550, damage: 260, meteorCount: 5, splashRadius: 75, range: 200, fireRate: 2300 },
            { cost: 850, damage: 380, meteorCount: 6, splashRadius: 90, range: 220, fireRate: 2200 }
        ]
    },
    [TowerTypes.BARRACKS]: {
        name: 'Barracks',
        description: 'Endless warriors swarm enemies!',
        cost: 200,
        damage: 50,
        range: 180,
        fireRate: 4000,
        color: '#8B0000',
        isBarracks: true,
        warriorCount: 15,
        warriorHealth: 80,
        warriorSpeed: 80,
        spawnRate: 600,
        upgrades: [
            { cost: 150, damage: 80, warriorCount: 20, warriorHealth: 120, spawnRate: 450, range: 200, fireRate: 3800 },
            { cost: 300, damage: 130, warriorCount: 25, warriorHealth: 160, spawnRate: 300, range: 220, fireRate: 3600 },
            { cost: 500, damage: 200, warriorCount: 30, warriorHealth: 220, spawnRate: 200, range: 250, fireRate: 3400 }
        ]
    }
};

class Tower {
    constructor(type, x, y) {
        const data = TowerData[type];
        this.type = type;
        this.x = x;
        this.y = y;
        this.level = 1;
        this.maxLevel = 4;

        this.name = data.name;
        this.damage = data.damage;
        this.range = data.range;
        this.fireRate = data.fireRate;
        this.color = data.color;
        this.projectileSpeed = data.projectileSpeed;
        this.projectileColor = data.projectileColor;

        this.splashRadius = data.splashRadius || 0;
        this.slowAmount = data.slowAmount || 0;
        this.slowDuration = data.slowDuration || 0;
        this.poisonDamage = data.poisonDamage || 0;
        this.poisonDuration = data.poisonDuration || 0;
        this.isBeam = data.isBeam || false;
        this.chainCount = data.chainCount || 0;
        this.chainRange = data.chainRange || 0;
        this.coneAngle = data.coneAngle || 0;
        this.burnDamage = data.burnDamage || 0;
        this.burnDuration = data.burnDuration || 0;
        this.isHoming = data.isHoming || false;
        this.isPiercing = data.isPiercing || false;
        this.isArcing = data.isArcing || false;
        this.isShockwave = data.isShockwave || false;
        this.isEMP = data.isEMP || false;
        this.stunDuration = data.stunDuration || 0;
        this.isVortex = data.isVortex || false;
        this.bounceCount = data.bounceCount || 0;
        this.bounceRange = data.bounceRange || 0;
        this.isLightning = data.isLightning || false;
        this.strikeCount = data.strikeCount || 0;
        this.isDeathRay = data.isDeathRay || false;
        this.isGatling = data.isGatling || false;
        this.isDrone = data.isDrone || false;
        this.droneCount = data.droneCount || 0;
        this.isVampire = data.isVampire || false;
        this.isMeteor = data.isMeteor || false;
        this.meteorCount = data.meteorCount || 0;
        this.isBarracks = data.isBarracks || false;
        this.warriorCount = data.warriorCount || 0;
        this.warriorHealth = data.warriorHealth || 60;
        this.warriorSpeed = data.warriorSpeed || 80;
        this.spawnRate = data.spawnRate || 800;
        this.spawnTimer = 0;
        this.warriors = [];

        this.fireCooldown = 0;
        this.target = null;
        this.angle = 0;
        this.targetAngle = 0;
        this.totalDamageDealt = 0;
        this.totalKills = 0;

        this.beamTarget = null;
        this.beamDamageMultiplier = 1;

        // Animation
        this.recoil = 0;
        this.muzzleFlash = 0;
        this.barrelRotation = 0;
        this.teslaArc = [];
        this.flameParticles = [];
        this.railgunBeam = 0;
        this.shockwaveRadius = 0;
        this.empPulse = 0;
        this.minigunRotation = 0;
        this.vortexRotation = 0;
        this.vortexPulse = 0;
        this.lightningStrikes = [];
        this.deathRayBeam = 0;
        this.deathRayCharge = 0;
        this.sawRotation = 0;
        this.gatlingSpinUp = 0;
        this.gatlingRotation = 0;
        this.vampireDrain = 0;
        this.vampireDrainTarget = null;
        this.meteorImpacts = [];
        this.droneAngle = 0;
    }

    update(deltaTime, enemies, projectiles) {
        if (this.fireCooldown > 0) this.fireCooldown -= deltaTime;
        if (this.recoil > 0) this.recoil -= deltaTime * 0.01;
        if (this.muzzleFlash > 0) this.muzzleFlash -= deltaTime;
        if (this.railgunBeam > 0) this.railgunBeam -= deltaTime;
        if (this.shockwaveRadius > 0) this.shockwaveRadius += deltaTime * 0.3;
        if (this.shockwaveRadius > this.range) this.shockwaveRadius = 0;
        if (this.empPulse > 0) this.empPulse -= deltaTime;
        if (this.deathRayBeam > 0) this.deathRayBeam -= deltaTime;

        // Vortex always spins
        if (this.type === TowerTypes.VORTEX) {
            this.vortexRotation += deltaTime * 0.005;
            if (this.vortexPulse > 0) this.vortexPulse -= deltaTime;
        }

        // Saw tower blade spins
        if (this.type === TowerTypes.SAW) {
            this.sawRotation += deltaTime * 0.015;
        }

        // Death ray charge animation
        if (this.type === TowerTypes.DEATH_RAY && this.fireCooldown > 0) {
            this.deathRayCharge = 1 - (this.fireCooldown / this.fireRate);
        }

        // Vampire drain fades
        if (this.vampireDrain > 0) this.vampireDrain -= deltaTime;

        // Meteor impacts fade
        if (this.meteorImpacts.length > 0) {
            this.meteorImpacts = this.meteorImpacts.filter(m => {
                m.life -= deltaTime;
                return m.life > 0;
            });
        }

        // Gatling spin-up: accelerates while firing, decays when idle
        if (this.type === TowerTypes.GATLING) {
            if (this.target) {
                this.gatlingSpinUp = Math.min(1, this.gatlingSpinUp + deltaTime * 0.0008);
                this.gatlingRotation += deltaTime * (0.01 + this.gatlingSpinUp * 0.04);
            } else {
                this.gatlingSpinUp = Math.max(0, this.gatlingSpinUp - deltaTime * 0.001);
                this.gatlingRotation += deltaTime * (0.005 * this.gatlingSpinUp);
            }
        }

        // Drone bay rotation
        if (this.type === TowerTypes.DRONE) {
            this.droneAngle += deltaTime * 0.003;
        }

        // Barracks - update warriors
        if (this.type === TowerTypes.BARRACKS) {
            this.updateWarriors(deltaTime, enemies);
        }

        // Rotate barrel for machine gun
        if (this.type === TowerTypes.BASIC && this.target) {
            this.barrelRotation += deltaTime * 0.02;
        }

        // Rotate minigun barrel (faster when firing)
        if (this.type === TowerTypes.MINIGUN) {
            if (this.target) {
                this.minigunRotation += deltaTime * 0.05;
            } else {
                this.minigunRotation += deltaTime * 0.005; // Slow spin down
            }
        }

        this.target = this.findTarget(enemies);

        if (this.target) {
            this.targetAngle = Math.atan2(this.target.y - this.y, this.target.x - this.x);

            // Smooth rotation
            let angleDiff = this.targetAngle - this.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            this.angle += angleDiff * 0.15;

            if (this.fireCooldown <= 0) {
                this.fire(projectiles, enemies);
                // Gatling fires faster as it spins up (down to 40% of base fire rate)
                if (this.isGatling) {
                    this.fireCooldown = this.fireRate * (1 - this.gatlingSpinUp * 0.6);
                } else {
                    this.fireCooldown = this.fireRate;
                }
                this.recoil = 1;
                this.muzzleFlash = 80;
            }
        } else {
            if (this.isBeam) {
                this.beamDamageMultiplier = 1;
                this.beamTarget = null;
            }
        }

        // Update flame particles
        if (this.type === TowerTypes.FLAME) {
            this.flameParticles = this.flameParticles.filter(p => {
                p.life -= deltaTime;
                p.x += p.vx * deltaTime / 1000;
                p.y += p.vy * deltaTime / 1000;
                return p.life > 0;
            });
        }
    }

    findTarget(enemies) {
        let bestTarget = null;
        let bestProgress = -1;

        for (const enemy of enemies) {
            if (enemy.isDead || enemy.reachedEnd) continue;

            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= this.range && enemy.distanceTraveled > bestProgress) {
                bestProgress = enemy.distanceTraveled;
                bestTarget = enemy;
            }
        }

        return bestTarget;
    }

    fire(projectiles, enemies) {
        if (!this.target) return;

        if (this.isBeam) {
            // Laser beam
            if (this.beamTarget === this.target) {
                this.beamDamageMultiplier = Math.min(4, this.beamDamageMultiplier + 0.15);
            } else {
                this.beamDamageMultiplier = 1;
                this.beamTarget = this.target;
            }

            const actualDamage = this.damage * this.beamDamageMultiplier;
            const killed = this.target.takeDamage(actualDamage);
            this.totalDamageDealt += actualDamage;
            if (killed) this.totalKills++;
        } else if (this.type === TowerTypes.TESLA) {
            // Chain lightning
            this.fireChainLightning(enemies);
        } else if (this.type === TowerTypes.FLAME) {
            // Flamethrower cone
            this.fireFlamethrower(enemies);
        } else if (this.type === TowerTypes.RAILGUN) {
            // Piercing railgun
            this.fireRailgun(enemies);
        } else if (this.type === TowerTypes.SHOCKWAVE) {
            // Shockwave pulse
            this.fireShockwave(enemies);
        } else if (this.type === TowerTypes.EMP) {
            // EMP blast
            this.fireEMP(enemies);
        } else if (this.type === TowerTypes.VORTEX) {
            // Vortex gravity well
            this.fireVortex(enemies);
        } else if (this.type === TowerTypes.LIGHTNING) {
            // Random lightning strikes
            this.fireLightning(enemies);
        } else if (this.type === TowerTypes.DEATH_RAY) {
            // Death ray beam
            this.fireDeathRay(enemies);
        } else if (this.type === TowerTypes.DRONE) {
            // Drone swarm burst
            this.fireDrones(projectiles, enemies);
        } else if (this.type === TowerTypes.VAMPIRE) {
            // Soul drain
            this.fireVampire(enemies);
        } else if (this.type === TowerTypes.METEOR) {
            // Meteor rain
            this.fireMeteor(projectiles, enemies);
        } else if (this.type === TowerTypes.BARRACKS) {
            // Barracks doesn't fire — warriors handle combat
            return;
        } else {
            // Standard projectile
            const projectileTypeMap = {
                [TowerTypes.BASIC]: 'bullet',
                [TowerTypes.SNIPER]: 'sniper',
                [TowerTypes.CANNON]: 'shell',
                [TowerTypes.FROST]: 'frost',
                [TowerTypes.POISON]: 'chemical',
                [TowerTypes.LASER]: 'laser',
                [TowerTypes.MISSILE]: 'missile',
                [TowerTypes.MINIGUN]: 'bullet',
                [TowerTypes.MORTAR]: 'mortar',
                [TowerTypes.PLASMA]: 'plasma',
                [TowerTypes.NUKE]: 'nuke',
                [TowerTypes.GATLING]: 'bullet',
                [TowerTypes.ACID]: 'acid'
            };

            const projectile = new Projectile(
                this.x + Math.cos(this.angle) * 25,
                this.y + Math.sin(this.angle) * 25,
                this.target,
                this.damage,
                this.projectileSpeed,
                this.projectileColor,
                {
                    splashRadius: this.splashRadius,
                    slowAmount: this.slowAmount,
                    slowDuration: this.slowDuration,
                    poisonDamage: this.poisonDamage,
                    poisonDuration: this.poisonDuration,
                    burnDamage: this.burnDamage,
                    burnDuration: this.burnDuration,
                    projectileType: projectileTypeMap[this.type] || (this.type === TowerTypes.SAW ? 'saw' : 'bullet'),
                    isHoming: this.isHoming,
                    isArcing: this.isArcing,
                    bounceCount: this.bounceCount,
                    bounceRange: this.bounceRange
                }
            );
            projectile.tower = this;
            projectiles.push(projectile);
        }
    }

    fireChainLightning(enemies) {
        const hitTargets = [this.target];
        let currentTarget = this.target;

        // Build chain
        for (let i = 0; i < this.chainCount - 1; i++) {
            let nearestDist = this.chainRange;
            let nearestEnemy = null;

            for (const enemy of enemies) {
                if (enemy.isDead || hitTargets.includes(enemy)) continue;

                const dx = enemy.x - currentTarget.x;
                const dy = enemy.y - currentTarget.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestEnemy = enemy;
                }
            }

            if (nearestEnemy) {
                hitTargets.push(nearestEnemy);
                currentTarget = nearestEnemy;
            } else {
                break;
            }
        }

        // Store arc for drawing
        this.teslaArc = [{ x: this.x, y: this.y }];

        // Apply damage to all targets
        let damage = this.damage;
        for (const enemy of hitTargets) {
            this.teslaArc.push({ x: enemy.x, y: enemy.y });
            const killed = enemy.takeDamage(damage);
            this.totalDamageDealt += damage;
            if (killed) this.totalKills++;
            damage *= 0.8; // Reduce damage for each chain
        }
    }

    fireFlamethrower(enemies) {
        // Hit all enemies in cone
        for (const enemy of enemies) {
            if (enemy.isDead) continue;

            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > this.range) continue;

            const angleToEnemy = Math.atan2(dy, dx);
            let angleDiff = angleToEnemy - this.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            if (Math.abs(angleDiff) <= this.coneAngle) {
                const killed = enemy.takeDamage(this.damage);
                this.totalDamageDealt += this.damage;
                if (killed) this.totalKills++;

                // Apply burn
                if (this.burnDamage > 0) {
                    enemy.applyPoison(this.burnDamage, this.burnDuration);
                }
            }
        }

        // Add flame particles
        for (let i = 0; i < 3; i++) {
            const spread = (Math.random() - 0.5) * this.coneAngle * 2;
            const speed = 100 + Math.random() * 50;
            this.flameParticles.push({
                x: this.x + Math.cos(this.angle) * 20,
                y: this.y + Math.sin(this.angle) * 20,
                vx: Math.cos(this.angle + spread) * speed,
                vy: Math.sin(this.angle + spread) * speed,
                life: 300,
                size: 5 + Math.random() * 5
            });
        }
    }

    fireRailgun(enemies) {
        this.railgunBeam = 200;

        // Hit all enemies in a line
        const endX = this.x + Math.cos(this.angle) * this.range;
        const endY = this.y + Math.sin(this.angle) * this.range;

        for (const enemy of enemies) {
            if (enemy.isDead) continue;

            // Check if enemy is near the line
            const dist = this.pointToLineDistance(
                enemy.x, enemy.y,
                this.x, this.y,
                endX, endY
            );

            if (dist < enemy.radius + 10) {
                // Check if enemy is within range
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const enemyDist = Math.sqrt(dx * dx + dy * dy);

                if (enemyDist <= this.range) {
                    const killed = enemy.takeDamage(this.damage);
                    this.totalDamageDealt += this.damage;
                    if (killed) this.totalKills++;
                }
            }
        }
    }

    pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    fireShockwave(enemies) {
        this.shockwaveRadius = 1; // Start the animation

        // Hit all enemies in range
        for (const enemy of enemies) {
            if (enemy.isDead) continue;

            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= this.range) {
                const killed = enemy.takeDamage(this.damage);
                this.totalDamageDealt += this.damage;
                if (killed) this.totalKills++;
            }
        }
    }

    fireEMP(enemies) {
        this.empPulse = 300; // Start the animation

        // Hit all enemies in range with stun and slow
        for (const enemy of enemies) {
            if (enemy.isDead) continue;

            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= this.range) {
                const killed = enemy.takeDamage(this.damage);
                this.totalDamageDealt += this.damage;
                if (killed) this.totalKills++;

                // Apply stun (using slow with very high amount)
                if (this.stunDuration > 0) {
                    enemy.applySlow(0.95, this.stunDuration); // 95% slow = almost stopped
                }
                // Apply additional slow after stun
                if (this.slowAmount > 0) {
                    enemy.applySlow(this.slowAmount, this.slowDuration);
                }
            }
        }
    }

    fireVortex(enemies) {
        this.vortexPulse = 400;

        for (const enemy of enemies) {
            if (enemy.isDead) continue;

            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= this.range) {
                const killed = enemy.takeDamage(this.damage);
                this.totalDamageDealt += this.damage;
                if (killed) this.totalKills++;

                // Massive slow (pulls enemies backward along path)
                enemy.applySlow(this.slowAmount, this.slowDuration);
            }
        }
    }

    fireLightning(enemies) {
        // Pick random enemies in range
        const inRange = [];
        for (const enemy of enemies) {
            if (enemy.isDead) continue;
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= this.range) inRange.push(enemy);
        }

        // Shuffle and pick up to strikeCount targets
        const targets = [];
        const shuffled = [...inRange].sort(() => Math.random() - 0.5);
        for (let i = 0; i < Math.min(this.strikeCount, shuffled.length); i++) {
            targets.push(shuffled[i]);
        }

        // Store strikes for drawing
        this.lightningStrikes = [];
        for (const enemy of targets) {
            const killed = enemy.takeDamage(this.damage);
            this.totalDamageDealt += this.damage;
            if (killed) this.totalKills++;
            this.lightningStrikes.push({ x: enemy.x, y: enemy.y });
        }
    }

    fireDeathRay(enemies) {
        if (!this.target) return;

        this.deathRayBeam = 300;
        this.deathRayCharge = 0;

        const killed = this.target.takeDamage(this.damage);
        this.totalDamageDealt += this.damage;
        if (killed) this.totalKills++;
    }

    fireDrones(projectiles, enemies) {
        // Find multiple targets in range
        const inRange = [];
        for (const enemy of enemies) {
            if (enemy.isDead) continue;
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= this.range) inRange.push(enemy);
        }

        if (inRange.length === 0) return;

        // Launch droneCount projectiles, spreading across available targets
        for (let i = 0; i < this.droneCount; i++) {
            const target = inRange[i % inRange.length];
            const spreadAngle = this.angle + (Math.random() - 0.5) * 0.5;
            const projectile = new Projectile(
                this.x + Math.cos(spreadAngle) * 20,
                this.y + Math.sin(spreadAngle) * 20,
                target,
                this.damage,
                this.projectileSpeed,
                this.projectileColor,
                {
                    projectileType: 'drone',
                    isHoming: true
                }
            );
            projectile.tower = this;
            projectiles.push(projectile);
        }
    }

    fireVampire(enemies) {
        if (!this.target) return;

        this.vampireDrain = 250;
        this.vampireDrainTarget = this.target;

        const killed = this.target.takeDamage(this.damage);
        this.totalDamageDealt += this.damage;
        if (killed) this.totalKills++;
    }

    fireMeteor(projectiles, enemies) {
        // Find enemies in range to use as meteor target positions
        const inRange = [];
        for (const enemy of enemies) {
            if (enemy.isDead) continue;
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= this.range) inRange.push(enemy);
        }

        if (inRange.length === 0) return;

        // Shuffle and pick meteorCount targets
        const shuffled = [...inRange].sort(() => Math.random() - 0.5);
        const count = Math.min(this.meteorCount, shuffled.length);

        for (let i = 0; i < count; i++) {
            const target = shuffled[i];
            // Meteor comes from above (offset start position high)
            const projectile = new Projectile(
                target.x + (Math.random() - 0.5) * 40,
                target.y - 200 - Math.random() * 60,
                target,
                this.damage,
                250,
                '#ff6d00',
                {
                    projectileType: 'meteor',
                    splashRadius: this.splashRadius,
                    isArcing: false
                }
            );
            projectile.tower = this;
            projectiles.push(projectile);
        }

        // Store impacts for visual
        this.meteorImpacts = shuffled.slice(0, count).map(e => ({
            x: e.x, y: e.y, life: 400
        }));
    }

    updateWarriors(deltaTime, enemies) {
        // Find nearest path point to tower (cache it)
        if (!this.pathPoint && this.pathWaypoints) {
            let bestDist = Infinity;
            for (const wp of this.pathWaypoints) {
                const dx = wp.x - this.x;
                const dy = wp.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < bestDist) {
                    bestDist = dist;
                    this.pathPoint = { x: wp.x, y: wp.y };
                }
            }
        }

        // Spawn warriors up to max
        this.spawnTimer -= deltaTime;
        if (this.spawnTimer <= 0 && this.warriors.length < this.warriorCount) {
            // Use rally point if set, otherwise use path point
            const dest = this.rallyPoint || this.pathPoint || { x: this.x, y: this.y };
            const spawnX = dest.x + (Math.random() - 0.5) * 30;
            const spawnY = dest.y + (Math.random() - 0.5) * 20;
            this.warriors.push({
                x: this.x,
                y: this.y,
                goalX: spawnX,
                goalY: spawnY,
                health: this.warriorHealth,
                maxHealth: this.warriorHealth,
                target: null,
                attackCooldown: 0,
                spawnAnim: 300
            });
            this.spawnTimer = this.spawnRate;
        }

        for (let i = this.warriors.length - 1; i >= 0; i--) {
            const w = this.warriors[i];

            // Spawn animation
            if (w.spawnAnim > 0) w.spawnAnim -= deltaTime;

            // Attack cooldown
            if (w.attackCooldown > 0) w.attackCooldown -= deltaTime;

            // Find nearest enemy in tower range
            let nearest = null;
            let nearestDist = this.range;
            for (const enemy of enemies) {
                if (enemy.isDead || enemy.reachedEnd) continue;
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const distToTower = Math.sqrt(dx * dx + dy * dy);
                if (distToTower > this.range) continue;

                const dx2 = enemy.x - w.x;
                const dy2 = enemy.y - w.y;
                const dist = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearest = enemy;
                }
            }
            w.target = nearest;

            if (w.target) {
                // Move toward target
                const dx = w.target.x - w.x;
                const dy = w.target.y - w.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 18) {
                    w.x += (dx / dist) * this.warriorSpeed * deltaTime / 1000;
                    w.y += (dy / dist) * this.warriorSpeed * deltaTime / 1000;
                    // Enemy sees warrior coming — slow down
                    if (dist < 60) {
                        w.target.applySlow(0.8, 300);
                    }
                } else {
                    // BLOCK the enemy — near full stop (0.95 so they still creep)
                    w.target.applySlow(0.95, 300);

                    // Enemy fights back — tougher enemies hit harder
                    const enemyDmg = (w.target.maxHealth / 100) * 8;
                    w.health -= enemyDmg * deltaTime / 1000;

                    if (w.attackCooldown <= 0) {
                        const killed = w.target.takeDamage(this.damage);
                        this.totalDamageDealt += this.damage;
                        if (killed) this.totalKills++;
                        w.attackCooldown = 500;
                    }
                }
            } else {
                // No enemies — go to rally point or road
                const dest = this.rallyPoint || this.pathPoint || { x: this.x, y: this.y };
                const gx = w.goalX || dest.x;
                const gy = w.goalY || dest.y;
                const dx = gx - w.x;
                const dy = gy - w.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 5) {
                    w.x += (dx / dist) * this.warriorSpeed * deltaTime / 1000;
                    w.y += (dy / dist) * this.warriorSpeed * deltaTime / 1000;
                }
            }

            // Other nearby enemies also damage the warrior
            for (const enemy of enemies) {
                if (enemy === w.target || enemy.isDead || enemy.reachedEnd) continue;
                const dx = enemy.x - w.x;
                const dy = enemy.y - w.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 15) {
                    w.health -= (enemy.maxHealth / 100) * 4 * deltaTime / 1000;
                }
            }

            // Remove dead warriors
            if (w.health <= 0) {
                this.warriors.splice(i, 1);
            }
        }
    }

    canUpgrade() {
        return this.level < this.maxLevel;
    }

    getUpgradeCost() {
        if (!this.canUpgrade()) return 0;
        return TowerData[this.type].upgrades[this.level - 1].cost;
    }

    upgrade() {
        if (!this.canUpgrade()) return false;

        const upgradeData = TowerData[this.type].upgrades[this.level - 1];
        this.level++;

        if (upgradeData.damage) this.damage = upgradeData.damage;
        if (upgradeData.range) this.range = upgradeData.range;
        if (upgradeData.splashRadius) this.splashRadius = upgradeData.splashRadius;
        if (upgradeData.slowAmount) this.slowAmount = upgradeData.slowAmount;
        if (upgradeData.slowDuration) this.slowDuration = upgradeData.slowDuration;
        if (upgradeData.poisonDamage) this.poisonDamage = upgradeData.poisonDamage;
        if (upgradeData.poisonDuration) this.poisonDuration = upgradeData.poisonDuration;
        if (upgradeData.chainCount) this.chainCount = upgradeData.chainCount;
        if (upgradeData.chainRange) this.chainRange = upgradeData.chainRange;
        if (upgradeData.burnDamage) this.burnDamage = upgradeData.burnDamage;
        if (upgradeData.stunDuration) this.stunDuration = upgradeData.stunDuration;
        if (upgradeData.fireRate) this.fireRate = upgradeData.fireRate;
        if (upgradeData.bounceCount) this.bounceCount = upgradeData.bounceCount;
        if (upgradeData.bounceRange) this.bounceRange = upgradeData.bounceRange;
        if (upgradeData.strikeCount) this.strikeCount = upgradeData.strikeCount;
        if (upgradeData.droneCount) this.droneCount = upgradeData.droneCount;
        if (upgradeData.meteorCount) this.meteorCount = upgradeData.meteorCount;
        if (upgradeData.projectileSpeed) this.projectileSpeed = upgradeData.projectileSpeed;
        if (upgradeData.warriorCount) this.warriorCount = upgradeData.warriorCount;
        if (upgradeData.spawnRate) this.spawnRate = upgradeData.spawnRate;
        if (upgradeData.warriorHealth) {
            this.warriorHealth = upgradeData.warriorHealth;
            // Heal existing warriors on upgrade
            for (const w of this.warriors) {
                w.maxHealth = this.warriorHealth;
                w.health = this.warriorHealth;
            }
        }

        return true;
    }

    getSellValue() {
        let totalCost = TowerData[this.type].cost;
        for (let i = 0; i < this.level - 1; i++) {
            totalCost += TowerData[this.type].upgrades[i].cost;
        }
        return Math.floor(totalCost * 0.7);
    }

    draw(ctx, isSelected = false) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Draw range indicator if selected
        if (isSelected) {
            ctx.beginPath();
            ctx.arc(0, 0, this.range, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Draw shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 5, 22, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw base based on type
        switch (this.type) {
            case TowerTypes.BASIC:
                this.drawMachineGun(ctx);
                break;
            case TowerTypes.SNIPER:
                this.drawSniper(ctx);
                break;
            case TowerTypes.CANNON:
                this.drawCannon(ctx);
                break;
            case TowerTypes.FROST:
                this.drawCryo(ctx);
                break;
            case TowerTypes.POISON:
                this.drawChemical(ctx);
                break;
            case TowerTypes.LASER:
                this.drawLaser(ctx);
                break;
            case TowerTypes.TESLA:
                this.drawTesla(ctx);
                break;
            case TowerTypes.FLAME:
                this.drawFlame(ctx);
                break;
            case TowerTypes.MISSILE:
                this.drawMissile(ctx);
                break;
            case TowerTypes.RAILGUN:
                this.drawRailgun(ctx);
                break;
            case TowerTypes.MINIGUN:
                this.drawMinigun(ctx);
                break;
            case TowerTypes.MORTAR:
                this.drawMortar(ctx);
                break;
            case TowerTypes.SHOCKWAVE:
                this.drawShockwaveTower(ctx);
                break;
            case TowerTypes.PLASMA:
                this.drawPlasma(ctx);
                break;
            case TowerTypes.EMP:
                this.drawEMP(ctx);
                break;
            case TowerTypes.VORTEX:
                this.drawVortex(ctx);
                break;
            case TowerTypes.SAW:
                this.drawSawTower(ctx);
                break;
            case TowerTypes.NUKE:
                this.drawNuke(ctx);
                break;
            case TowerTypes.LIGHTNING:
                this.drawLightningTower(ctx);
                break;
            case TowerTypes.DEATH_RAY:
                this.drawDeathRayTower(ctx);
                break;
            case TowerTypes.GATLING:
                this.drawGatling(ctx);
                break;
            case TowerTypes.ACID:
                this.drawAcid(ctx);
                break;
            case TowerTypes.DRONE:
                this.drawDroneBay(ctx);
                break;
            case TowerTypes.VAMPIRE:
                this.drawVampire(ctx);
                break;
            case TowerTypes.METEOR:
                this.drawMeteorTower(ctx);
                break;
            case TowerTypes.BARRACKS:
                this.drawBarracks(ctx);
                break;
        }

        // Draw level stars
        ctx.rotate(-this.angle);
        for (let i = 0; i < this.level; i++) {
            const starAngle = (Math.PI * 2 / 4) * i - Math.PI / 2;
            const starX = Math.cos(starAngle) * 28;
            const starY = Math.sin(starAngle) * 28;
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(starX, starY, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#b8860b';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.restore();

        // Draw tesla arc (outside of transform)
        if (this.type === TowerTypes.TESLA && this.muzzleFlash > 0 && this.teslaArc.length > 1) {
            this.drawTeslaArc(ctx);
        }

        // Draw railgun beam
        if (this.type === TowerTypes.RAILGUN && this.railgunBeam > 0) {
            this.drawRailgunBeam(ctx);
        }

        // Draw lightning strikes
        if (this.type === TowerTypes.LIGHTNING && this.muzzleFlash > 0 && this.lightningStrikes.length > 0) {
            this.drawLightningStrikes(ctx);
        }

        // Draw death ray beam
        if (this.type === TowerTypes.DEATH_RAY && this.deathRayBeam > 0 && this.target) {
            this.drawDeathRayBeam(ctx);
        }

        // Draw vampire drain beam
        if (this.type === TowerTypes.VAMPIRE && this.vampireDrain > 0 && this.vampireDrainTarget) {
            this.drawVampireDrain(ctx);
        }

        // Draw meteor impact markers
        if (this.type === TowerTypes.METEOR && this.meteorImpacts.length > 0) {
            this.drawMeteorImpacts(ctx);
        }

        // Draw warriors
        if (this.type === TowerTypes.BARRACKS && this.warriors.length > 0) {
            this.drawWarriors(ctx);
        }
    }

    drawMachineGun(ctx) {
        ctx.fillStyle = '#3a3a3a';
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#8B7355';
        for (let i = 0; i < 6; i++) {
            const a = (Math.PI * 2 / 6) * i;
            ctx.beginPath();
            ctx.ellipse(Math.cos(a) * 18, Math.sin(a) * 18, 8, 5, a, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.rotate(this.angle);

        ctx.fillStyle = '#5a5a5a';
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();

        const recoilOffset = this.recoil * 3;
        ctx.save();
        ctx.rotate(this.barrelRotation);
        ctx.fillStyle = '#3a3a3a';
        for (let i = 0; i < 4; i++) {
            ctx.save();
            ctx.rotate((Math.PI * 2 / 4) * i);
            ctx.fillRect(8 - recoilOffset, -2, 22, 4);
            ctx.restore();
        }
        ctx.restore();

        if (this.muzzleFlash > 0) {
            ctx.fillStyle = `rgba(255, 200, 0, ${this.muzzleFlash / 80})`;
            ctx.beginPath();
            ctx.arc(28, 0, 8 + Math.random() * 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawSniper(ctx) {
        ctx.fillStyle = '#4a4a4a';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#3a3a3a';
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(this.angle);

        const recoilOffset = this.recoil * 8;
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(-5, -5, 15, 10);
        ctx.fillRect(10 - recoilOffset, -3, 35, 6);

        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(15 - recoilOffset, -8, 12, 5);
        ctx.fillRect(42 - recoilOffset, -4, 6, 8);

        if (this.muzzleFlash > 0) {
            ctx.fillStyle = `rgba(255, 100, 50, ${this.muzzleFlash / 80})`;
            ctx.beginPath();
            ctx.arc(50 - recoilOffset, 0, 12, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawCannon(ctx) {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-20, -20, 40, 40);
        ctx.strokeStyle = '#5D3A1A';
        ctx.lineWidth = 2;
        ctx.strokeRect(-20, -20, 40, 40);

        ctx.fillStyle = '#4a4a4a';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(this.angle);

        const recoilOffset = this.recoil * 10;
        ctx.fillStyle = '#5a5a5a';
        ctx.beginPath();
        ctx.moveTo(-10, -10);
        ctx.lineTo(20 - recoilOffset, -8);
        ctx.lineTo(30 - recoilOffset, -5);
        ctx.lineTo(30 - recoilOffset, 5);
        ctx.lineTo(20 - recoilOffset, 8);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#3a3a3a';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (this.muzzleFlash > 0) {
            ctx.fillStyle = `rgba(255, 150, 50, ${this.muzzleFlash / 80})`;
            ctx.beginPath();
            ctx.arc(32 - recoilOffset, 0, 15 + Math.random() * 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawCryo(ctx) {
        ctx.fillStyle = '#b3e5fc';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = (Math.PI * 2 / 6) * i;
            const r = i % 2 === 0 ? 22 : 16;
            if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#4fc3f7';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = 'rgba(129, 212, 250, 0.5)';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(this.angle);

        ctx.fillStyle = '#4fc3f7';
        ctx.fillRect(-5, -6, 30, 12);
        ctx.fillStyle = '#81d4fa';
        ctx.fillRect(22, -4, 8, 8);

        if (this.muzzleFlash > 0) {
            ctx.fillStyle = `rgba(200, 240, 255, ${this.muzzleFlash / 80})`;
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.arc(30 + Math.random() * 15, (Math.random() - 0.5) * 15, 3 + Math.random() * 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    drawChemical(ctx) {
        ctx.fillStyle = '#4a4a4a';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffc107';
        ctx.fillRect(-18, -3, 36, 6);
        ctx.fillStyle = '#1a1a1a';
        for (let i = -18; i < 18; i += 8) {
            ctx.fillRect(i, -3, 4, 6);
        }

        ctx.fillStyle = '#7cb342';
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#558b2f';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.rotate(this.angle);

        ctx.fillStyle = '#5a5a5a';
        ctx.fillRect(10, -4, 20, 8);

        if (this.muzzleFlash > 0) {
            ctx.fillStyle = `rgba(139, 195, 74, ${this.muzzleFlash / 100})`;
            ctx.beginPath();
            ctx.moveTo(28, -2);
            ctx.lineTo(45, -12);
            ctx.lineTo(45, 12);
            ctx.lineTo(28, 2);
            ctx.closePath();
            ctx.fill();
        }
    }

    drawLaser(ctx) {
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#e91e63';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.stroke();

        const pulse = Math.sin(Date.now() / 150) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(233, 30, 99, ${pulse})`;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(this.angle);

        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(-5, -8, 35, 16);
        ctx.fillStyle = '#e91e63';
        ctx.fillRect(28, -5, 8, 10);

        if (this.beamTarget && !this.beamTarget.isDead) {
            const targetX = this.beamTarget.x - this.x;
            const targetY = this.beamTarget.y - this.y;
            const dist = Math.sqrt(targetX * targetX + targetY * targetY);

            ctx.strokeStyle = `rgba(233, 30, 99, ${0.2 + this.beamDamageMultiplier * 0.1})`;
            ctx.lineWidth = 8 + this.beamDamageMultiplier * 3;
            ctx.beginPath();
            ctx.moveTo(35, 0);
            ctx.lineTo(dist, 0);
            ctx.stroke();

            ctx.strokeStyle = `rgba(255, 100, 150, ${0.5 + this.beamDamageMultiplier * 0.15})`;
            ctx.lineWidth = 2 + this.beamDamageMultiplier;
            ctx.beginPath();
            ctx.moveTo(35, 0);
            ctx.lineTo(dist, 0);
            ctx.stroke();
        }
    }

    drawTesla(ctx) {
        // Tesla coil base
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        // Coil rings
        ctx.strokeStyle = '#9c27b0';
        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, 8 + i * 5, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Central coil
        ctx.fillStyle = '#7b1fa2';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();

        // Energy glow
        const pulse = Math.sin(Date.now() / 100) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(156, 39, 176, ${pulse})`;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        // Sparks
        if (this.muzzleFlash > 0) {
            ctx.strokeStyle = '#e1bee7';
            ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
                const angle = Math.random() * Math.PI * 2;
                const len = 15 + Math.random() * 10;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
                ctx.stroke();
            }
        }
    }

    drawTeslaArc(ctx) {
        ctx.strokeStyle = '#e1bee7';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#9c27b0';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.moveTo(this.teslaArc[0].x, this.teslaArc[0].y);
        for (let i = 1; i < this.teslaArc.length; i++) {
            // Add some randomness for lightning effect
            const midX = (this.teslaArc[i-1].x + this.teslaArc[i].x) / 2 + (Math.random() - 0.5) * 20;
            const midY = (this.teslaArc[i-1].y + this.teslaArc[i].y) / 2 + (Math.random() - 0.5) * 20;
            ctx.lineTo(midX, midY);
            ctx.lineTo(this.teslaArc[i].x, this.teslaArc[i].y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    drawFlame(ctx) {
        // Metal base
        ctx.fillStyle = '#4a4a4a';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        // Warning stripes
        ctx.fillStyle = '#ff5722';
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#bf360c';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        // Fuel tank
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.ellipse(-8, 0, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(this.angle);

        // Nozzle
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(5, -6, 25, 12);
        ctx.fillRect(28, -8, 8, 16);

        // Pilot light
        ctx.fillStyle = '#ff9800';
        ctx.beginPath();
        ctx.arc(34, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw flame particles
        ctx.rotate(-this.angle);
        for (const p of this.flameParticles) {
            const alpha = p.life / 300;
            const r = 255;
            const g = Math.floor(150 * alpha);
            const b = 0;
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            ctx.beginPath();
            ctx.arc(p.x - this.x, p.y - this.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawMissile(ctx) {
        // Launch platform
        ctx.fillStyle = '#455a64';
        ctx.fillRect(-18, -18, 36, 36);
        ctx.strokeStyle = '#37474f';
        ctx.lineWidth = 2;
        ctx.strokeRect(-18, -18, 36, 36);

        // Missile tubes
        ctx.fillStyle = '#607d8b';
        for (let i = 0; i < 4; i++) {
            const x = (i % 2) * 16 - 8;
            const y = Math.floor(i / 2) * 16 - 8;
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#263238';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#607d8b';
        }

        // Center targeting system
        ctx.fillStyle = '#f44336';
        const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
        ctx.globalAlpha = pulse;
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Smoke when firing
        if (this.muzzleFlash > 0) {
            ctx.fillStyle = `rgba(150, 150, 150, ${this.muzzleFlash / 120})`;
            for (let i = 0; i < 6; i++) {
                ctx.beginPath();
                ctx.arc(
                    (Math.random() - 0.5) * 30,
                    (Math.random() - 0.5) * 30,
                    5 + Math.random() * 5,
                    0, Math.PI * 2
                );
                ctx.fill();
            }
        }
    }

    drawRailgun(ctx) {
        // High-tech platform
        ctx.fillStyle = '#1a237e';
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();

        // Energy rings
        const pulse = Math.sin(Date.now() / 100);
        ctx.strokeStyle = '#00bcd4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 18 + pulse * 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.rotate(this.angle);

        // Rail housing
        ctx.fillStyle = '#0d47a1';
        ctx.fillRect(-8, -10, 45, 20);

        // Rails
        ctx.fillStyle = '#00bcd4';
        ctx.fillRect(0, -8, 35, 3);
        ctx.fillRect(0, 5, 35, 3);

        // Capacitors
        ctx.fillStyle = '#4dd0e1';
        ctx.fillRect(-5, -6, 8, 4);
        ctx.fillRect(-5, 2, 8, 4);

        // Barrel tip
        ctx.fillStyle = '#00838f';
        ctx.fillRect(35, -6, 10, 12);

        // Charging effect
        if (this.fireCooldown > this.fireRate * 0.7) {
            const charge = 1 - (this.fireCooldown - this.fireRate * 0.7) / (this.fireRate * 0.3);
            ctx.fillStyle = `rgba(0, 188, 212, ${charge * 0.5})`;
            ctx.fillRect(0, -6, 35 * charge, 12);
        }
    }

    drawRailgunBeam(ctx) {
        const alpha = this.railgunBeam / 200;
        const endX = this.x + Math.cos(this.angle) * this.range;
        const endY = this.y + Math.sin(this.angle) * this.range;

        // Outer glow
        ctx.strokeStyle = `rgba(0, 188, 212, ${alpha * 0.3})`;
        ctx.lineWidth = 20;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Core beam
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }

    drawMinigun(ctx) {
        // Heavy base platform
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Ammo belt feeds
        ctx.fillStyle = '#ffc107';
        ctx.fillRect(-18, -5, 8, 10);
        ctx.fillStyle = '#ff8f00';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(-17, -4 + i * 3, 6, 2);
        }

        ctx.rotate(this.angle);

        // Gun housing
        ctx.fillStyle = '#795548';
        ctx.fillRect(-8, -10, 20, 20);

        // Rotating barrels
        ctx.save();
        ctx.translate(15, 0);
        ctx.rotate(this.minigunRotation);

        ctx.fillStyle = '#4a4a4a';
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 / 6) * i;
            ctx.fillStyle = i % 2 === 0 ? '#4a4a4a' : '#3a3a3a';
            ctx.beginPath();
            ctx.arc(Math.cos(angle) * 6, Math.sin(angle) * 6, 3, 0, Math.PI * 2);
            ctx.fill();
            // Barrel
            ctx.fillRect(Math.cos(angle) * 6 - 1, Math.sin(angle) * 6 - 1, 18, 2);
        }

        // Center hub
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Muzzle flash
        if (this.muzzleFlash > 0) {
            ctx.fillStyle = `rgba(255, 200, 50, ${this.muzzleFlash / 80})`;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(35 + Math.random() * 5, (Math.random() - 0.5) * 10, 4 + Math.random() * 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    drawMortar(ctx) {
        // Sandbag base
        ctx.fillStyle = '#8d6e63';
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            ctx.beginPath();
            ctx.ellipse(Math.cos(angle) * 16, Math.sin(angle) * 16, 8, 5, angle, 0, Math.PI * 2);
            ctx.fill();
        }

        // Inner sandbags
        ctx.fillStyle = '#a1887f';
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 / 6) * i + 0.3;
            ctx.beginPath();
            ctx.ellipse(Math.cos(angle) * 10, Math.sin(angle) * 10, 6, 4, angle, 0, Math.PI * 2);
            ctx.fill();
        }

        // Base plate
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(this.angle);

        // Mortar tube
        const recoilOffset = this.recoil * 5;
        ctx.fillStyle = '#3e2723';
        ctx.beginPath();
        ctx.moveTo(-6, -8);
        ctx.lineTo(25 - recoilOffset, -6);
        ctx.lineTo(28 - recoilOffset, 0);
        ctx.lineTo(25 - recoilOffset, 6);
        ctx.lineTo(-6, 8);
        ctx.closePath();
        ctx.fill();

        // Tube opening
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.ellipse(26 - recoilOffset, 0, 5, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Muzzle blast
        if (this.muzzleFlash > 0) {
            ctx.fillStyle = `rgba(255, 150, 50, ${this.muzzleFlash / 80})`;
            ctx.beginPath();
            ctx.arc(30 - recoilOffset, 0, 12 + Math.random() * 5, 0, Math.PI * 2);
            ctx.fill();

            // Smoke ring
            ctx.strokeStyle = `rgba(150, 150, 150, ${this.muzzleFlash / 120})`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(35 - recoilOffset, 0, 8 + (80 - this.muzzleFlash) * 0.2, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    drawShockwaveTower(ctx) {
        // Metallic base
        ctx.fillStyle = '#424242';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        // Orange warning stripes
        ctx.strokeStyle = '#ff9800';
        ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * 12, Math.sin(angle) * 12);
            ctx.lineTo(Math.cos(angle) * 18, Math.sin(angle) * 18);
            ctx.stroke();
        }

        // Central emitter
        ctx.fillStyle = '#ff5722';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing core
        const pulse = Math.sin(Date.now() / 150) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 152, 0, ${pulse})`;
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();

        // Draw shockwave animation
        if (this.shockwaveRadius > 0) {
            const alpha = 1 - (this.shockwaveRadius / this.range);
            ctx.strokeStyle = `rgba(255, 152, 0, ${alpha})`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, this.shockwaveRadius, 0, Math.PI * 2);
            ctx.stroke();

            // Inner ring
            ctx.strokeStyle = `rgba(255, 87, 34, ${alpha * 0.7})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.shockwaveRadius * 0.7, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    drawPlasma(ctx) {
        // Tech base
        ctx.fillStyle = '#1b5e20';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        // Energy coils
        ctx.strokeStyle = '#76ff03';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, 10 + i * 4, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.rotate(this.angle);

        // Plasma chamber
        ctx.fillStyle = '#2e7d32';
        ctx.fillRect(-8, -10, 30, 20);

        // Energy core (glowing)
        const glow = Math.sin(Date.now() / 100) * 0.2 + 0.8;
        ctx.fillStyle = `rgba(118, 255, 3, ${glow})`;
        ctx.beginPath();
        ctx.arc(5, 0, 8, 0, Math.PI * 2);
        ctx.fill();

        // Barrel
        ctx.fillStyle = '#1b5e20';
        ctx.fillRect(20, -6, 15, 12);

        // Plasma glow at barrel
        ctx.fillStyle = '#b2ff59';
        ctx.beginPath();
        ctx.arc(33, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        // Firing effect
        if (this.muzzleFlash > 0) {
            ctx.shadowColor = '#76ff03';
            ctx.shadowBlur = 15;
            ctx.fillStyle = `rgba(178, 255, 89, ${this.muzzleFlash / 80})`;
            ctx.beginPath();
            ctx.arc(38, 0, 10 + Math.random() * 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    drawVortex(ctx) {
        // Dark swirling vortex
        ctx.save();
        ctx.rotate(this.vortexRotation);

        // Outer swirl arms
        for (let i = 0; i < 4; i++) {
            const armAngle = (Math.PI * 2 / 4) * i;
            ctx.strokeStyle = `rgba(100, 0, 180, 0.6)`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            for (let t = 0; t < 1; t += 0.05) {
                const r = 6 + t * 16;
                const a = armAngle + t * Math.PI * 1.5;
                const px = Math.cos(a) * r;
                const py = Math.sin(a) * r;
                if (t === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.stroke();
        }

        ctx.restore();

        // Dark core
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 22);
        gradient.addColorStop(0, '#1a0033');
        gradient.addColorStop(0.5, 'rgba(74, 0, 128, 0.8)');
        gradient.addColorStop(1, 'rgba(74, 0, 128, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();

        // Central black hole
        ctx.fillStyle = '#0a0015';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();

        // Purple event horizon ring
        const pulse = Math.sin(Date.now() / 120) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(180, 50, 255, ${pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.stroke();

        // Particle accretion
        ctx.fillStyle = 'rgba(150, 50, 255, 0.6)';
        for (let i = 0; i < 6; i++) {
            const a = this.vortexRotation * 3 + (Math.PI * 2 / 6) * i;
            const r = 14 + Math.sin(a * 2) * 4;
            ctx.beginPath();
            ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Vortex pulse animation
        if (this.vortexPulse > 0) {
            const progress = 1 - (this.vortexPulse / 400);
            // Inward-pulling rings
            for (let i = 0; i < 3; i++) {
                const ringRadius = this.range * (1 - progress) * (1 - i * 0.25);
                if (ringRadius > 0) {
                    const alpha = (1 - progress) * (1 - i * 0.3);
                    ctx.strokeStyle = `rgba(120, 0, 200, ${alpha * 0.6})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        }
    }

    drawSawTower(ctx) {
        // Metal platform
        ctx.fillStyle = '#546e7a';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#37474f';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Launcher mechanism
        ctx.fillStyle = '#455a64';
        ctx.fillRect(-12, -8, 24, 16);

        ctx.rotate(this.angle);

        // Launch rail
        ctx.fillStyle = '#607d8b';
        ctx.fillRect(0, -5, 25, 10);
        ctx.fillStyle = '#455a64';
        ctx.fillRect(22, -7, 8, 14);

        // Rotating saw blade display on tower
        ctx.save();
        ctx.translate(5, 0);
        ctx.rotate(this.sawRotation);
        ctx.strokeStyle = '#cfd8dc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.stroke();
        // Saw teeth
        for (let i = 0; i < 8; i++) {
            const a = (Math.PI * 2 / 8) * i;
            ctx.fillStyle = '#b0bec5';
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * 6, Math.sin(a) * 6);
            ctx.lineTo(Math.cos(a + 0.2) * 10, Math.sin(a + 0.2) * 10);
            ctx.lineTo(Math.cos(a - 0.2) * 10, Math.sin(a - 0.2) * 10);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();

        // Muzzle flash
        if (this.muzzleFlash > 0) {
            ctx.fillStyle = `rgba(200, 200, 220, ${this.muzzleFlash / 80})`;
            ctx.beginPath();
            ctx.arc(28, 0, 6, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawNuke(ctx) {
        // Silo base with warning stripes
        ctx.fillStyle = '#424242';
        ctx.fillRect(-20, -20, 40, 40);
        ctx.strokeStyle = '#212121';
        ctx.lineWidth = 2;
        ctx.strokeRect(-20, -20, 40, 40);

        // Warning stripes (yellow/black diagonal)
        ctx.save();
        ctx.beginPath();
        ctx.rect(-18, -18, 36, 36);
        ctx.clip();
        ctx.fillStyle = '#ffc107';
        for (let i = -6; i < 8; i++) {
            ctx.beginPath();
            ctx.moveTo(-20 + i * 10, -20);
            ctx.lineTo(-15 + i * 10, -20);
            ctx.lineTo(-20 + i * 10 + 40, 20);
            ctx.lineTo(-25 + i * 10 + 40, 20);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();

        // Silo hatch (dark center)
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();

        // Nuclear symbol
        ctx.strokeStyle = '#ffc107';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.stroke();

        // Radiation trefoil
        ctx.fillStyle = '#ffc107';
        for (let i = 0; i < 3; i++) {
            const a = (Math.PI * 2 / 3) * i - Math.PI / 2;
            ctx.beginPath();
            ctx.arc(0, 0, 8, a - 0.4, a + 0.4);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fill();
        }

        // Center dot
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        // Red warning light
        const pulse = Math.sin(Date.now() / 300) * 0.4 + 0.6;
        ctx.fillStyle = `rgba(255, 23, 68, ${pulse})`;
        ctx.beginPath();
        ctx.arc(14, -14, 4, 0, Math.PI * 2);
        ctx.fill();

        // Smoke when firing
        if (this.muzzleFlash > 0) {
            ctx.fillStyle = `rgba(100, 100, 100, ${this.muzzleFlash / 100})`;
            for (let i = 0; i < 8; i++) {
                ctx.beginPath();
                ctx.arc(
                    (Math.random() - 0.5) * 30,
                    (Math.random() - 0.5) * 30,
                    6 + Math.random() * 6,
                    0, Math.PI * 2
                );
                ctx.fill();
            }
        }
    }

    drawLightningTower(ctx) {
        // Stone/metal base
        ctx.fillStyle = '#424242';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        // Tall spire effect (concentric circles getting smaller = top-down tower)
        ctx.fillStyle = '#616161';
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#757575';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        // Storm cloud aura
        const cloudPulse = Math.sin(Date.now() / 200) * 0.2 + 0.4;
        ctx.fillStyle = `rgba(100, 100, 120, ${cloudPulse})`;
        for (let i = 0; i < 5; i++) {
            const a = (Math.PI * 2 / 5) * i + Date.now() / 2000;
            ctx.beginPath();
            ctx.arc(Math.cos(a) * 15, Math.sin(a) * 15, 8, 0, Math.PI * 2);
            ctx.fill();
        }

        // Lightning rod tip
        ctx.fillStyle = '#ffd600';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();

        // Crackling sparks
        const sparkPulse = Math.sin(Date.now() / 80) * 0.5 + 0.5;
        ctx.strokeStyle = `rgba(255, 255, 100, ${sparkPulse})`;
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const a = Math.random() * Math.PI * 2;
            const len = 8 + Math.random() * 8;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            const midX = Math.cos(a) * len * 0.5 + (Math.random() - 0.5) * 6;
            const midY = Math.sin(a) * len * 0.5 + (Math.random() - 0.5) * 6;
            ctx.lineTo(midX, midY);
            ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
            ctx.stroke();
        }
    }

    drawLightningStrikes(ctx) {
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ffd600';
        ctx.shadowBlur = 15;

        for (const strike of this.lightningStrikes) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);

            // Jagged lightning bolt
            const dx = strike.x - this.x;
            const dy = strike.y - this.y;
            const segments = 4;
            for (let i = 1; i <= segments; i++) {
                const t = i / segments;
                const px = this.x + dx * t + (i < segments ? (Math.random() - 0.5) * 30 : 0);
                const py = this.y + dy * t + (i < segments ? (Math.random() - 0.5) * 30 : 0);
                ctx.lineTo(px, py);
            }
            ctx.stroke();

            // Impact flash
            ctx.fillStyle = `rgba(255, 255, 200, ${this.muzzleFlash / 80})`;
            ctx.beginPath();
            ctx.arc(strike.x, strike.y, 8, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }

    drawDeathRayTower(ctx) {
        // Heavy sci-fi base
        ctx.fillStyle = '#4a0000';
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();

        // Tech ring
        ctx.strokeStyle = '#d50000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.stroke();

        // Capacitor banks
        ctx.fillStyle = '#b71c1c';
        for (let i = 0; i < 4; i++) {
            const a = (Math.PI * 2 / 4) * i + Math.PI / 4;
            ctx.fillRect(
                Math.cos(a) * 14 - 4,
                Math.sin(a) * 14 - 3,
                8, 6
            );
        }

        ctx.rotate(this.angle);

        // Main cannon body
        ctx.fillStyle = '#880000';
        ctx.fillRect(-10, -12, 35, 24);

        // Barrel
        ctx.fillStyle = '#4a0000';
        ctx.fillRect(20, -8, 20, 16);

        // Barrel tip with lens
        ctx.fillStyle = '#d50000';
        ctx.beginPath();
        ctx.arc(38, 0, 6, 0, Math.PI * 2);
        ctx.fill();

        // Charging glow
        if (this.deathRayCharge > 0.3) {
            const chargeAlpha = (this.deathRayCharge - 0.3) / 0.7;
            ctx.fillStyle = `rgba(255, 50, 50, ${chargeAlpha * 0.6})`;
            ctx.beginPath();
            ctx.arc(38, 0, 8 + chargeAlpha * 4, 0, Math.PI * 2);
            ctx.fill();

            // Energy gathering particles
            ctx.fillStyle = `rgba(255, 100, 100, ${chargeAlpha})`;
            for (let i = 0; i < 4; i++) {
                const a = Date.now() / 200 + (Math.PI * 2 / 4) * i;
                const r = 15 * (1 - chargeAlpha);
                ctx.beginPath();
                ctx.arc(38 + Math.cos(a) * r, Math.sin(a) * r, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    drawDeathRayBeam(ctx) {
        if (!this.target || this.target.isDead) return;

        const alpha = this.deathRayBeam / 300;

        // Outer destructive glow
        ctx.strokeStyle = `rgba(255, 0, 0, ${alpha * 0.3})`;
        ctx.lineWidth = 24;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.target.x, this.target.y);
        ctx.stroke();

        // Middle beam
        ctx.strokeStyle = `rgba(255, 50, 0, ${alpha * 0.6})`;
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.target.x, this.target.y);
        ctx.stroke();

        // Core beam (white-hot)
        ctx.strokeStyle = `rgba(255, 255, 200, ${alpha})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.target.x, this.target.y);
        ctx.stroke();

        // Impact explosion
        ctx.fillStyle = `rgba(255, 100, 0, ${alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(this.target.x, this.target.y, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.target.x, this.target.y, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    drawEMP(ctx) {
        // High-tech circular base
        ctx.fillStyle = '#0d47a1';
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();

        // Circuit patterns
        ctx.strokeStyle = '#2196f3';
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 / 6) * i;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * 18, Math.sin(angle) * 18);
            ctx.stroke();

            // Circuit nodes
            ctx.fillStyle = '#64b5f6';
            ctx.beginPath();
            ctx.arc(Math.cos(angle) * 12, Math.sin(angle) * 12, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Central antenna
        ctx.fillStyle = '#1565c0';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();

        // Antenna tip
        ctx.fillStyle = '#2196f3';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing energy
        const pulse = Math.sin(Date.now() / 200) * 0.4 + 0.6;
        ctx.fillStyle = `rgba(33, 150, 243, ${pulse})`;
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();

        // EMP pulse animation
        if (this.empPulse > 0) {
            const progress = 1 - (this.empPulse / 300);
            const radius = this.range * progress;
            const alpha = 1 - progress;

            // Multiple pulse rings
            for (let i = 0; i < 3; i++) {
                const ringRadius = radius * (1 - i * 0.2);
                if (ringRadius > 0) {
                    ctx.strokeStyle = `rgba(33, 150, 243, ${alpha * (1 - i * 0.3)})`;
                    ctx.lineWidth = 3 - i;
                    ctx.beginPath();
                    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }

            // Electric arcs
            ctx.strokeStyle = `rgba(100, 181, 246, ${alpha})`;
            ctx.lineWidth = 2;
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i + Date.now() / 500;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                const midX = Math.cos(angle) * radius * 0.5 + (Math.random() - 0.5) * 20;
                const midY = Math.sin(angle) * radius * 0.5 + (Math.random() - 0.5) * 20;
                ctx.lineTo(midX, midY);
                ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
                ctx.stroke();
            }
        }
    }

    drawGatling(ctx) {
        // Heavy reinforced base
        ctx.fillStyle = '#4e342e';
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Ammo hopper on the side
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(-18, -8, 10, 16);
        ctx.fillStyle = '#ffc107';
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(-17, -7 + i * 3.5, 8, 2);
        }

        ctx.rotate(this.angle);

        // Gun housing
        ctx.fillStyle = '#6d4c41';
        ctx.fillRect(-8, -12, 22, 24);

        // Spinning barrel assembly
        ctx.save();
        ctx.translate(18, 0);
        ctx.rotate(this.gatlingRotation);

        // 8 barrels for a beefy gatling
        for (let i = 0; i < 8; i++) {
            const a = (Math.PI * 2 / 8) * i;
            ctx.fillStyle = i % 2 === 0 ? '#5d4037' : '#4e342e';
            ctx.beginPath();
            ctx.arc(Math.cos(a) * 7, Math.sin(a) * 7, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(Math.cos(a) * 7 - 1.5, Math.sin(a) * 7 - 1.5, 16, 3);
        }

        // Center hub
        ctx.fillStyle = '#3e2723';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Spin-up heat glow
        if (this.gatlingSpinUp > 0.3) {
            const heat = (this.gatlingSpinUp - 0.3) / 0.7;
            ctx.fillStyle = `rgba(255, 100, 0, ${heat * 0.4})`;
            ctx.beginPath();
            ctx.arc(32, 0, 6 + heat * 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Muzzle flash (intense when spun up)
        if (this.muzzleFlash > 0) {
            const intensity = 1 + this.gatlingSpinUp;
            ctx.fillStyle = `rgba(255, 200, 50, ${this.muzzleFlash / 80 * intensity})`;
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.arc(35 + Math.random() * 5, (Math.random() - 0.5) * 12, 3 + Math.random() * 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    drawAcid(ctx) {
        // Corroded metal base
        ctx.fillStyle = '#4a4a4a';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        // Acid stains on base
        ctx.fillStyle = 'rgba(174, 234, 0, 0.4)';
        for (let i = 0; i < 5; i++) {
            const a = (Math.PI * 2 / 5) * i;
            ctx.beginPath();
            ctx.arc(Math.cos(a) * 14, Math.sin(a) * 14, 6, 0, Math.PI * 2);
            ctx.fill();
        }

        // Acid tank (center)
        ctx.fillStyle = '#c6ff00';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#aeea00';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Bubbling effect
        const bubble1 = Math.sin(Date.now() / 200) * 3;
        const bubble2 = Math.sin(Date.now() / 150 + 1) * 3;
        ctx.fillStyle = 'rgba(200, 255, 0, 0.7)';
        ctx.beginPath();
        ctx.arc(-3, -2 + bubble1, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(4, 1 + bubble2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(this.angle);

        // Spray nozzle
        ctx.fillStyle = '#5a5a5a';
        ctx.fillRect(8, -5, 22, 10);

        // Nozzle tip with dripping acid
        ctx.fillStyle = '#aeea00';
        ctx.fillRect(28, -3, 6, 6);

        // Drip
        const drip = (Date.now() / 500) % 1;
        ctx.fillStyle = `rgba(174, 234, 0, ${1 - drip})`;
        ctx.beginPath();
        ctx.arc(31, 5 + drip * 8, 2, 0, Math.PI * 2);
        ctx.fill();

        // Spray when firing
        if (this.muzzleFlash > 0) {
            ctx.fillStyle = `rgba(198, 255, 0, ${this.muzzleFlash / 80})`;
            ctx.beginPath();
            ctx.moveTo(32, -4);
            ctx.lineTo(50, -14);
            ctx.lineTo(50, 14);
            ctx.lineTo(32, 4);
            ctx.closePath();
            ctx.fill();
        }
    }

    drawDroneBay(ctx) {
        // Landing pad base
        ctx.fillStyle = '#37474f';
        ctx.fillRect(-20, -20, 40, 40);
        ctx.strokeStyle = '#263238';
        ctx.lineWidth = 2;
        ctx.strokeRect(-20, -20, 40, 40);

        // Landing H
        ctx.strokeStyle = '#00acc1';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-8, -10);
        ctx.lineTo(-8, 10);
        ctx.moveTo(8, -10);
        ctx.lineTo(8, 10);
        ctx.moveTo(-8, 0);
        ctx.lineTo(8, 0);
        ctx.stroke();

        // Corner lights
        ctx.fillStyle = '#00acc1';
        const blink = Math.sin(Date.now() / 300) > 0 ? 0.8 : 0.3;
        ctx.globalAlpha = blink;
        ctx.beginPath();
        ctx.arc(-16, -16, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(16, -16, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-16, 16, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(16, 16, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Orbiting mini drones
        for (let i = 0; i < Math.min(this.droneCount, 4); i++) {
            const a = this.droneAngle + (Math.PI * 2 / Math.min(this.droneCount, 4)) * i;
            const dx = Math.cos(a) * 16;
            const dy = Math.sin(a) * 16;

            // Drone body
            ctx.fillStyle = '#26c6da';
            ctx.beginPath();
            ctx.arc(dx, dy, 4, 0, Math.PI * 2);
            ctx.fill();

            // Drone rotors
            ctx.strokeStyle = 'rgba(0, 172, 193, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(dx, dy, 6, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Launch smoke
        if (this.muzzleFlash > 0) {
            ctx.fillStyle = `rgba(100, 100, 100, ${this.muzzleFlash / 120})`;
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.arc(
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 20,
                    4 + Math.random() * 3,
                    0, Math.PI * 2
                );
                ctx.fill();
            }
        }
    }

    drawVampire(ctx) {
        // Dark gothic base
        ctx.fillStyle = '#1a0a20';
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();

        // Arcane ring
        ctx.strokeStyle = '#880e4f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.stroke();

        // Soul runes
        ctx.fillStyle = '#ad1457';
        for (let i = 0; i < 6; i++) {
            const a = (Math.PI * 2 / 6) * i + Date.now() / 3000;
            const r = 15;
            ctx.beginPath();
            ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Central soul orb
        const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(136, 14, 79, ${pulse})`;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();

        // Inner glow
        ctx.fillStyle = '#f48fb1';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        // Floating soul wisps
        for (let i = 0; i < 3; i++) {
            const t = Date.now() / 1000 + i * 2;
            const wx = Math.sin(t) * 12;
            const wy = Math.cos(t * 1.3) * 12;
            ctx.fillStyle = `rgba(244, 143, 177, ${0.4 + Math.sin(t * 2) * 0.2})`;
            ctx.beginPath();
            ctx.arc(wx, wy, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawVampireDrain(ctx) {
        if (!this.vampireDrainTarget || this.vampireDrainTarget.isDead) return;

        const alpha = this.vampireDrain / 250;
        const tx = this.vampireDrainTarget.x;
        const ty = this.vampireDrainTarget.y;

        // Soul drain beam (wispy, dark magenta)
        ctx.strokeStyle = `rgba(136, 14, 79, ${alpha * 0.4})`;
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        // Inner beam
        ctx.strokeStyle = `rgba(244, 143, 177, ${alpha * 0.7})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        // Core beam
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        // Soul particles flowing from enemy to tower
        for (let i = 0; i < 4; i++) {
            const t = ((Date.now() / 300 + i * 0.25) % 1);
            const px = tx + (this.x - tx) * t + (Math.random() - 0.5) * 10;
            const py = ty + (this.y - ty) * t + (Math.random() - 0.5) * 10;
            ctx.fillStyle = `rgba(244, 143, 177, ${alpha * (1 - t)})`;
            ctx.beginPath();
            ctx.arc(px, py, 3 * (1 - t), 0, Math.PI * 2);
            ctx.fill();
        }

        // Drain effect on enemy
        ctx.fillStyle = `rgba(136, 14, 79, ${alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(tx, ty, 12, 0, Math.PI * 2);
        ctx.fill();
    }

    drawMeteorTower(ctx) {
        // Stone summoning circle base
        ctx.fillStyle = '#4e342e';
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();

        // Outer rune circle
        ctx.strokeStyle = '#e65100';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 19, 0, Math.PI * 2);
        ctx.stroke();

        // Arcane rune marks
        ctx.strokeStyle = '#ff6d00';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const a = (Math.PI * 2 / 8) * i + Date.now() / 4000;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * 10, Math.sin(a) * 10);
            ctx.lineTo(Math.cos(a) * 18, Math.sin(a) * 18);
            ctx.stroke();
        }

        // Inner fire circle
        const firePulse = Math.sin(Date.now() / 150) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(230, 81, 0, ${firePulse})`;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        // Central flame
        ctx.fillStyle = '#ff6d00';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();

        // Flame tips
        ctx.fillStyle = '#ffab00';
        for (let i = 0; i < 5; i++) {
            const a = (Math.PI * 2 / 5) * i + Date.now() / 500;
            const len = 5 + Math.sin(Date.now() / 100 + i) * 3;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(a - 0.3) * 4, Math.sin(a - 0.3) * 4);
            ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
            ctx.lineTo(Math.cos(a + 0.3) * 4, Math.sin(a + 0.3) * 4);
            ctx.closePath();
            ctx.fill();
        }

        // Summoning energy when firing
        if (this.muzzleFlash > 0) {
            ctx.strokeStyle = `rgba(255, 109, 0, ${this.muzzleFlash / 80})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 22 + (80 - this.muzzleFlash) * 0.3, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    drawBarracks(ctx) {
        // Wooden fort base
        ctx.fillStyle = '#5D3A1A';
        ctx.fillRect(-20, -20, 40, 40);
        ctx.strokeStyle = '#3E2510';
        ctx.lineWidth = 2;
        ctx.strokeRect(-20, -20, 40, 40);

        // Wooden planks
        ctx.strokeStyle = '#4A2E14';
        ctx.lineWidth = 1;
        for (let i = -15; i <= 15; i += 10) {
            ctx.beginPath();
            ctx.moveTo(i, -20);
            ctx.lineTo(i, 20);
            ctx.stroke();
        }

        // Corner posts
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(-20, -20, 6, 6);
        ctx.fillRect(14, -20, 6, 6);
        ctx.fillRect(-20, 14, 6, 6);
        ctx.fillRect(14, 14, 6, 6);

        // Banner/flag
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(-2, -18, 4, 14);
        // Flag cloth
        const wave = Math.sin(Date.now() / 200) * 2;
        ctx.fillStyle = '#FF4444';
        ctx.beginPath();
        ctx.moveTo(2, -18);
        ctx.lineTo(12, -15 + wave);
        ctx.lineTo(12, -9 + wave);
        ctx.lineTo(2, -12);
        ctx.closePath();
        ctx.fill();

        // Sword symbol on banner
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(6, -16 + wave * 0.5);
        ctx.lineTo(6, -10 + wave * 0.5);
        ctx.moveTo(4, -14 + wave * 0.5);
        ctx.lineTo(8, -14 + wave * 0.5);
        ctx.stroke();

        // Inner yard
        ctx.fillStyle = '#7A5530';
        ctx.fillRect(-14, -14, 28, 28);

        // Warrior count indicator
        const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 68, 68, ${pulse})`;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.warriors.length, 0, 0);
    }

    drawWarriors(ctx) {
        for (const w of this.warriors) {
            ctx.save();
            ctx.translate(w.x, w.y);

            // Spawn flash
            if (w.spawnAnim > 0) {
                ctx.fillStyle = `rgba(255, 255, 200, ${w.spawnAnim / 300})`;
                ctx.beginPath();
                ctx.arc(0, 0, 12, 0, Math.PI * 2);
                ctx.fill();
            }

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(0, 4, 6, 3, 0, 0, Math.PI * 2);
            ctx.fill();

            // Body (small soldier)
            ctx.fillStyle = '#8B0000';
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#5A0000';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Helmet
            ctx.fillStyle = '#666';
            ctx.beginPath();
            ctx.arc(0, -2, 4, Math.PI, 0);
            ctx.fill();

            // Sword (when attacking)
            if (w.attackCooldown > 400) {
                const swordAngle = w.target ?
                    Math.atan2(w.target.y - w.y, w.target.x - w.x) : 0;
                ctx.save();
                ctx.rotate(swordAngle);
                ctx.strokeStyle = '#C0C0C0';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(6, 0);
                ctx.lineTo(14, 0);
                ctx.stroke();
                // Sword tip
                ctx.fillStyle = '#E0E0E0';
                ctx.beginPath();
                ctx.moveTo(14, -2);
                ctx.lineTo(17, 0);
                ctx.lineTo(14, 2);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }

            // Health bar
            if (w.health < w.maxHealth) {
                const barWidth = 14;
                const barHeight = 3;
                const healthPct = w.health / w.maxHealth;
                ctx.fillStyle = '#333';
                ctx.fillRect(-barWidth / 2, -11, barWidth, barHeight);
                ctx.fillStyle = healthPct > 0.5 ? '#4CAF50' : healthPct > 0.25 ? '#FF9800' : '#F44336';
                ctx.fillRect(-barWidth / 2, -11, barWidth * healthPct, barHeight);
            }

            ctx.restore();
        }
    }

    drawMeteorImpacts(ctx) {
        for (const impact of this.meteorImpacts) {
            const alpha = impact.life / 400;
            const progress = 1 - alpha;

            // Ground scorch
            ctx.fillStyle = `rgba(255, 109, 0, ${alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(impact.x, impact.y, 20 + progress * 15, 0, Math.PI * 2);
            ctx.fill();

            // Impact ring
            ctx.strokeStyle = `rgba(255, 171, 0, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(impact.x, impact.y, progress * 30, 0, Math.PI * 2);
            ctx.stroke();

            // Ember particles
            ctx.fillStyle = `rgba(255, 200, 50, ${alpha})`;
            for (let i = 0; i < 4; i++) {
                const a = (Math.PI * 2 / 4) * i + progress * 2;
                const r = progress * 25;
                ctx.beginPath();
                ctx.arc(
                    impact.x + Math.cos(a) * r,
                    impact.y + Math.sin(a) * r,
                    2, 0, Math.PI * 2
                );
                ctx.fill();
            }
        }
    }
}
