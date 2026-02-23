// Main game controller with realistic visuals

class Game {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;

        // Game state
        this.state = 'menu'; // menu, playing, gameover, victory
        this.gold = 250;
        this.lives = 20;
        this.score = 0;
        this.gameSpeed = 1;

        // Game objects
        this.path = new Path();
        this.waveManager = new WaveManager();
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.explosions = [];
        this.particles = [];
        this.shellCasings = [];
        this.bloodSplatters = [];
        this.craters = [];
        this.scorchMarks = [];
        this.icePatches = [];
        this.footprints = [];
        this.bulletHoles = [];

        // Screen shake
        this.screenShake = 0;
        this.shakeX = 0;
        this.shakeY = 0;

        // Selection state
        this.selectedTowerType = null;
        this.selectedTower = null;
        this.hoveredTile = null;
        this.rallyMode = false;

        // Initialize path
        this.pathWaypoints = this.path.generatePath(this.canvas.width, this.canvas.height);

        // Generate environment decorations
        this.trees = this.generateTrees();
        this.rocks = this.generateRocks();
        this.grassTufts = this.generateGrassTufts();

        // Timing
        this.lastTime = 0;

        // Setup UI
        this.setupUI();
        this.bindEvents();

        // Start game loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    generateTrees() {
        const trees = [];
        const pathTiles = this.path.getPathTiles();

        for (let i = 0; i < 15; i++) {
            let x, y, valid;
            let attempts = 0;

            do {
                x = Math.random() * (this.canvas.width - 60) + 30;
                y = Math.random() * (this.canvas.height - 60) + 30;

                const tileX = Math.floor(x / this.path.tileSize);
                const tileY = Math.floor(y / this.path.tileSize);

                valid = !pathTiles.some(t =>
                    Math.abs(t.x - tileX) <= 1 && Math.abs(t.y - tileY) <= 1
                );
                attempts++;
            } while (!valid && attempts < 50);

            if (valid) {
                trees.push({
                    x,
                    y,
                    size: 0.7 + Math.random() * 0.6,
                    type: Math.floor(Math.random() * 3)
                });
            }
        }
        return trees;
    }

    generateRocks() {
        const rocks = [];
        const pathTiles = this.path.getPathTiles();

        for (let i = 0; i < 20; i++) {
            let x, y, valid;
            let attempts = 0;

            do {
                x = Math.random() * this.canvas.width;
                y = Math.random() * this.canvas.height;

                const tileX = Math.floor(x / this.path.tileSize);
                const tileY = Math.floor(y / this.path.tileSize);

                valid = !pathTiles.some(t => t.x === tileX && t.y === tileY);
                attempts++;
            } while (!valid && attempts < 30);

            if (valid) {
                rocks.push({
                    x,
                    y,
                    size: 3 + Math.random() * 8,
                    color: Math.random() > 0.5 ? '#666' : '#777'
                });
            }
        }
        return rocks;
    }

    generateGrassTufts() {
        const tufts = [];
        const pathTiles = this.path.getPathTiles();

        for (let i = 0; i < 60; i++) {
            let x, y, valid;
            let attempts = 0;

            do {
                x = Math.random() * this.canvas.width;
                y = Math.random() * this.canvas.height;

                const tileX = Math.floor(x / this.path.tileSize);
                const tileY = Math.floor(y / this.path.tileSize);

                valid = !pathTiles.some(t => t.x === tileX && t.y === tileY);
                attempts++;
            } while (!valid && attempts < 20);

            if (valid) {
                tufts.push({
                    x,
                    y,
                    height: 5 + Math.random() * 10,
                    blades: 3 + Math.floor(Math.random() * 4)
                });
            }
        }
        return tufts;
    }

    setupUI() {
        // Create tower buttons
        const towerButtons = document.getElementById('tower-buttons');
        towerButtons.innerHTML = '';

        Object.entries(TowerData).forEach(([type, data]) => {
            const btn = document.createElement('div');
            btn.className = 'tower-btn';
            btn.dataset.type = type;
            btn.innerHTML = `
                <div class="tower-icon" style="background: ${data.color}"></div>
                <div class="tower-btn-info">
                    <div class="tower-btn-name">${data.name}</div>
                    <div class="tower-btn-cost">${data.cost} gold</div>
                </div>
            `;
            btn.addEventListener('click', () => this.selectTowerType(type));
            towerButtons.appendChild(btn);
        });

        // Update HUD
        this.updateHUD();
    }

    bindEvents() {
        // Canvas click
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));

        // Menu buttons
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.startGame());
        document.getElementById('play-again-btn').addEventListener('click', () => this.startGame());

        // Wave controls
        document.getElementById('start-wave-btn').addEventListener('click', () => this.startWave());
        document.getElementById('fast-forward-btn').addEventListener('click', () => this.toggleSpeed());

        // Tower info buttons
        document.getElementById('upgrade-btn').addEventListener('click', () => this.upgradeTower());
        document.getElementById('rally-btn').addEventListener('click', () => this.toggleRallyMode());
        document.getElementById('sell-btn').addEventListener('click', () => this.sellTower());
    }

    startGame() {
        this.state = 'playing';
        this.gold = 250;
        this.lives = 20;
        this.score = 0;
        this.gameSpeed = 1;

        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.explosions = [];
        this.particles = [];
        this.shellCasings = [];
        this.bloodSplatters = [];
        this.craters = [];
        this.scorchMarks = [];
        this.icePatches = [];
        this.footprints = [];
        this.bulletHoles = [];
        this.screenShake = 0;
        this.waveManager = new WaveManager();

        this.selectedTowerType = null;
        this.selectedTower = null;

        this.hideOverlays();
        this.updateHUD();
        this.updateSpeedButton();
    }

    startWave() {
        if (this.waveManager.isWaveActive) return;

        const nextWave = this.waveManager.currentWave + 1;
        if (nextWave > this.waveManager.totalWaves) return;

        this.waveManager.startWave(nextWave, this.pathWaypoints);
        document.getElementById('start-wave-btn').disabled = true;
    }

    toggleSpeed() {
        this.gameSpeed = this.gameSpeed === 1 ? 2 : this.gameSpeed === 2 ? 3 : 1;
        this.updateSpeedButton();
    }

    updateSpeedButton() {
        document.getElementById('fast-forward-btn').textContent = `Speed: ${this.gameSpeed}x`;
    }

    selectTowerType(type) {
        if (this.gold < TowerData[type].cost) return;

        // Deselect tower if clicking same type
        if (this.selectedTowerType === type) {
            this.selectedTowerType = null;
        } else {
            this.selectedTowerType = type;
            this.selectedTower = null;
            this.hideTowerInfo();
        }

        this.updateTowerButtons();
    }

    updateTowerButtons() {
        document.querySelectorAll('.tower-btn').forEach(btn => {
            const type = btn.dataset.type;
            btn.classList.toggle('selected', type === this.selectedTowerType);
            btn.classList.toggle('disabled', this.gold < TowerData[type].cost);
        });
    }

    handleCanvasClick(e) {
        if (this.state !== 'playing') return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Rally mode — set rally point
        if (this.rallyMode && this.selectedTower && this.selectedTower.isBarracks) {
            this.setRallyPoint(x, y);
            return;
        }

        // Check if clicking on a tower
        const clickedTower = this.getTowerAt(x, y);
        if (clickedTower) {
            this.selectedTower = clickedTower;
            this.selectedTowerType = null;
            this.showTowerInfo(clickedTower);
            this.updateTowerButtons();
            return;
        }

        // Try to place tower
        if (this.selectedTowerType) {
            this.placeTower(x, y);
        } else {
            // Deselect
            this.selectedTower = null;
            this.hideTowerInfo();
        }
    }

    handleCanvasMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calculate hovered tile
        const tileX = Math.floor(x / this.path.tileSize);
        const tileY = Math.floor(y / this.path.tileSize);
        this.hoveredTile = { x: tileX, y: tileY };
    }

    getTowerAt(x, y) {
        for (const tower of this.towers) {
            const dx = tower.x - x;
            const dy = tower.y - y;
            if (Math.sqrt(dx * dx + dy * dy) < 25) {
                return tower;
            }
        }
        return null;
    }

    canPlaceTower(tileX, tileY) {
        // Check if on path
        const pathTiles = this.path.getPathTiles();
        if (pathTiles.some(t => t.x === tileX && t.y === tileY)) {
            return false;
        }

        // Check if tower already exists
        const centerX = tileX * this.path.tileSize + this.path.tileSize / 2;
        const centerY = tileY * this.path.tileSize + this.path.tileSize / 2;
        if (this.getTowerAt(centerX, centerY)) {
            return false;
        }

        // Check bounds
        if (tileX < 0 || tileY < 0 ||
            tileX >= this.canvas.width / this.path.tileSize ||
            tileY >= this.canvas.height / this.path.tileSize) {
            return false;
        }

        return true;
    }

    placeTower(x, y) {
        const tileX = Math.floor(x / this.path.tileSize);
        const tileY = Math.floor(y / this.path.tileSize);

        if (!this.canPlaceTower(tileX, tileY)) return;

        const cost = TowerData[this.selectedTowerType].cost;
        if (this.gold < cost) return;

        // Place tower
        const centerX = tileX * this.path.tileSize + this.path.tileSize / 2;
        const centerY = tileY * this.path.tileSize + this.path.tileSize / 2;

        const tower = new Tower(this.selectedTowerType, centerX, centerY);
        tower.pathWaypoints = this.pathWaypoints;
        this.towers.push(tower);

        this.gold -= cost;
        this.updateHUD();
        this.updateTowerButtons();
    }

    showTowerInfo(tower) {
        const info = document.getElementById('tower-info');
        const name = document.getElementById('tower-info-name');
        const stats = document.getElementById('tower-info-stats');
        const upgradeBtn = document.getElementById('upgrade-btn');

        name.textContent = `${tower.name} (Lvl ${tower.level})`;

        stats.innerHTML = `
            Damage: ${tower.damage}<br>
            Range: ${tower.range}<br>
            Fire Rate: ${tower.fireRate}ms<br>
            ${tower.splashRadius ? `Splash: ${tower.splashRadius}<br>` : ''}
            ${tower.slowAmount ? `Slow: ${Math.round(tower.slowAmount * 100)}%<br>` : ''}
            ${tower.poisonDamage ? `Poison: ${tower.poisonDamage}/s<br>` : ''}
            ${tower.isBarracks ? `Warriors: ${tower.warriors.length}/${tower.warriorCount}<br>Warrior HP: ${tower.warriorHealth}<br>` : ''}
            <br>
            Kills: ${tower.totalKills}<br>
            Total Damage: ${Math.floor(tower.totalDamageDealt)}<br>
            Sell Value: ${tower.getSellValue()} gold
        `;

        if (tower.canUpgrade()) {
            upgradeBtn.textContent = `Upgrade (${tower.getUpgradeCost()} gold)`;
            upgradeBtn.classList.toggle('disabled', this.gold < tower.getUpgradeCost());
        } else {
            upgradeBtn.textContent = 'Max Level';
            upgradeBtn.classList.add('disabled');
        }

        // Show rally button only for barracks
        const rallyBtn = document.getElementById('rally-btn');
        if (tower.isBarracks) {
            rallyBtn.classList.remove('hidden');
            rallyBtn.classList.remove('active');
        } else {
            rallyBtn.classList.add('hidden');
        }
        this.rallyMode = false;

        info.classList.remove('hidden');
    }

    hideTowerInfo() {
        document.getElementById('tower-info').classList.add('hidden');
        this.rallyMode = false;
    }

    upgradeTower() {
        if (!this.selectedTower || !this.selectedTower.canUpgrade()) return;

        const cost = this.selectedTower.getUpgradeCost();
        if (this.gold < cost) return;

        this.gold -= cost;
        this.selectedTower.upgrade();

        this.updateHUD();
        this.updateTowerButtons();
        this.showTowerInfo(this.selectedTower);
    }

    sellTower() {
        if (!this.selectedTower) return;

        const value = this.selectedTower.getSellValue();
        this.gold += value;

        const index = this.towers.indexOf(this.selectedTower);
        if (index > -1) {
            this.towers.splice(index, 1);
        }

        this.selectedTower = null;
        this.rallyMode = false;
        this.hideTowerInfo();
        this.updateHUD();
        this.updateTowerButtons();
    }

    toggleRallyMode() {
        if (!this.selectedTower || !this.selectedTower.isBarracks) return;
        this.rallyMode = !this.rallyMode;
        document.getElementById('rally-btn').classList.toggle('active', this.rallyMode);
    }

    setRallyPoint(x, y) {
        if (!this.selectedTower || !this.selectedTower.isBarracks) return;

        // Check if click is within tower range
        const dx = x - this.selectedTower.x;
        const dy = y - this.selectedTower.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > this.selectedTower.range) return;

        this.selectedTower.rallyPoint = { x, y };

        // Update all warriors' goal positions to the rally point
        for (const w of this.selectedTower.warriors) {
            w.goalX = x + (Math.random() - 0.5) * 20;
            w.goalY = y + (Math.random() - 0.5) * 20;
        }

        this.rallyMode = false;
        document.getElementById('rally-btn').classList.remove('active');
    }

    updateHUD() {
        document.getElementById('gold').textContent = this.gold;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('wave').textContent = this.waveManager.currentWave;
        document.getElementById('score').textContent = this.score;
    }

    hideOverlays() {
        document.querySelectorAll('.overlay').forEach(o => o.classList.add('hidden'));
    }

    showOverlay(id) {
        document.getElementById(id).classList.remove('hidden');
    }

    createExplosion(x, y, radius, color) {
        if (typeof Explosion !== 'undefined') {
            this.explosions.push(new Explosion(x, y, radius, color));
        }
        // Screen shake based on explosion size
        this.createScreenShake(Math.min(15, radius * 0.2));
        // Add sparks
        this.createSpark(x, y, 8);
        // Add scorch mark
        this.createScorchMark(x, y, radius * 0.6);
    }

    createBloodSplatter(x, y, radius) {
        // Create multiple blood drops
        const dropCount = 5 + Math.floor(radius * 0.5);
        for (let i = 0; i < dropCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 30 + Math.random() * 60;
            const size = 2 + Math.random() * 4;
            this.bloodSplatters.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                alpha: 1,
                lifetime: 500 + Math.random() * 500,
                age: 0,
                settled: false,
                groundX: 0,
                groundY: 0
            });
        }
    }

    createDeathParticles(x, y, color) {
        // Create debris and sparks
        const particleCount = 8 + Math.floor(Math.random() * 6);
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 20 + Math.random() * 80;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 30, // Initial upward velocity
                size: 1 + Math.random() * 3,
                color: color || '#555',
                alpha: 1,
                lifetime: 400 + Math.random() * 400,
                age: 0,
                type: 'death',
                life: 1, // Normalized life for necromancer soul detection
                gravity: 150
            });
        }

        // Add some sparks/glints
        for (let i = 0; i < 4; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 100;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 50,
                size: 1 + Math.random() * 2,
                color: '#FFD700',
                alpha: 1,
                lifetime: 200 + Math.random() * 200,
                age: 0,
                gravity: 100
            });
        }
    }

    createDustCloud(x, y, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 10 + Math.random() * 40;
            const size = 5 + Math.random() * 15;
            this.particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 20,
                size: size,
                color: '#8B7355',
                alpha: 0.6,
                lifetime: 600 + Math.random() * 400,
                age: 0,
                gravity: -10, // Float upward slightly
                isDust: true
            });
        }
    }

    createCrater(x, y, radius) {
        this.craters.push({
            x: x,
            y: y,
            radius: Math.max(8, radius),
            alpha: 0.7,
            age: 0
        });

        // Limit crater count to prevent performance issues
        if (this.craters.length > 30) {
            this.craters.shift();
        }
    }

    createShellCasing(x, y, angle) {
        const ejectAngle = angle + Math.PI / 2 + (Math.random() - 0.5) * 0.5;
        const speed = 30 + Math.random() * 20;
        this.shellCasings.push({
            x: x,
            y: y,
            vx: Math.cos(ejectAngle) * speed,
            vy: Math.sin(ejectAngle) * speed - 40,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 20,
            size: 3,
            alpha: 1,
            lifetime: 2000,
            age: 0,
            gravity: 200,
            bounces: 0
        });
    }

    createMuzzleSmoke(x, y, angle) {
        // Create smoke puffs from the muzzle
        for (let i = 0; i < 8; i++) {
            const spread = (Math.random() - 0.5) * 0.8;
            const speed = 20 + Math.random() * 40;
            const smokeAngle = angle + spread;
            this.particles.push({
                x: x + (Math.random() - 0.5) * 10,
                y: y + (Math.random() - 0.5) * 10,
                vx: Math.cos(smokeAngle) * speed,
                vy: Math.sin(smokeAngle) * speed - 15,
                size: 8 + Math.random() * 12,
                color: '#666',
                alpha: 0.6,
                lifetime: 500 + Math.random() * 300,
                age: 0,
                gravity: -20, // Float upward
                isDust: true,
                isSmoke: true
            });
        }
    }

    createScorchMark(x, y, radius) {
        this.scorchMarks.push({
            x: x,
            y: y,
            radius: radius || 20,
            alpha: 0.6,
            age: 0
        });
        if (this.scorchMarks.length > 40) {
            this.scorchMarks.shift();
        }
    }

    createIcePatch(x, y, radius) {
        this.icePatches.push({
            x: x,
            y: y,
            radius: radius || 15,
            alpha: 0.7,
            age: 0
        });
        if (this.icePatches.length > 30) {
            this.icePatches.shift();
        }
    }

    createFootprint(x, y, angle) {
        this.footprints.push({
            x: x,
            y: y,
            angle: angle,
            alpha: 0.3,
            age: 0,
            isLeft: Math.random() > 0.5
        });
        if (this.footprints.length > 100) {
            this.footprints.shift();
        }
    }

    createBulletHole(x, y) {
        this.bulletHoles.push({
            x: x,
            y: y,
            size: 2 + Math.random() * 2,
            alpha: 0.5,
            age: 0
        });
        if (this.bulletHoles.length > 50) {
            this.bulletHoles.shift();
        }
    }

    createScreenShake(intensity) {
        this.screenShake = Math.max(this.screenShake, intensity);
    }

    createSpark(x, y, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 100;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 30,
                size: 1 + Math.random() * 2,
                color: '#FFA500',
                alpha: 1,
                lifetime: 150 + Math.random() * 150,
                age: 0,
                gravity: 150,
                isSpark: true
            });
        }
    }

    createFireParticle(x, y, angle) {
        const spread = (Math.random() - 0.5) * 0.5;
        const speed = 30 + Math.random() * 50;
        this.particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle + spread) * speed,
            vy: Math.sin(angle + spread) * speed - 20,
            size: 4 + Math.random() * 8,
            color: Math.random() > 0.5 ? '#FF4500' : '#FF6600',
            alpha: 0.8,
            lifetime: 200 + Math.random() * 200,
            age: 0,
            gravity: -50,
            isFire: true
        });
    }

    updateEffects(deltaTime) {
        const dt = deltaTime / 1000;

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.age += deltaTime;

            if (p.age >= p.lifetime) {
                this.particles.splice(i, 1);
                continue;
            }

            // Physics
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += p.gravity * dt;

            // Friction for dust
            if (p.isDust) {
                p.vx *= 0.98;
                p.vy *= 0.98;
                p.size += dt * 10; // Expand dust
            }

            // Fade out
            p.alpha = 1 - (p.age / p.lifetime);
            p.life = 1 - (p.age / p.lifetime); // Normalized life for effects
        }

        // Update blood splatters
        for (let i = this.bloodSplatters.length - 1; i >= 0; i--) {
            const b = this.bloodSplatters[i];
            b.age += deltaTime;

            if (b.age >= b.lifetime) {
                this.bloodSplatters.splice(i, 1);
                continue;
            }

            if (!b.settled) {
                // Flying through air
                b.x += b.vx * dt;
                b.y += b.vy * dt;
                b.vy += 200 * dt; // Gravity

                // Check if hit ground (simple check)
                if (b.vy > 0 && b.y > b.y + 10) {
                    b.settled = true;
                    b.groundX = b.x;
                    b.groundY = b.y;
                }

                // Settle after a short time
                if (b.age > 150) {
                    b.settled = true;
                    b.groundX = b.x;
                    b.groundY = b.y;
                }
            }

            // Fade out
            b.alpha = Math.max(0, 1 - (b.age / b.lifetime));
        }

        // Update shell casings
        for (let i = this.shellCasings.length - 1; i >= 0; i--) {
            const s = this.shellCasings[i];
            s.age += deltaTime;

            if (s.age >= s.lifetime) {
                this.shellCasings.splice(i, 1);
                continue;
            }

            s.x += s.vx * dt;
            s.y += s.vy * dt;
            s.vy += s.gravity * dt;
            s.rotation += s.rotationSpeed * dt;

            // Bounce off ground
            if (s.y > this.canvas.height - 10 && s.bounces < 3) {
                s.y = this.canvas.height - 10;
                s.vy = -s.vy * 0.4;
                s.vx *= 0.7;
                s.rotationSpeed *= 0.5;
                s.bounces++;
            }

            // Fade out near end
            if (s.age > s.lifetime * 0.7) {
                s.alpha = 1 - ((s.age - s.lifetime * 0.7) / (s.lifetime * 0.3));
            }
        }

        // Fade craters slowly
        for (let i = this.craters.length - 1; i >= 0; i--) {
            const c = this.craters[i];
            c.age += deltaTime;

            // Fade very slowly over 30 seconds
            if (c.age > 30000) {
                c.alpha -= dt * 0.1;
                if (c.alpha <= 0) {
                    this.craters.splice(i, 1);
                }
            }
        }

        // Fade scorch marks
        for (let i = this.scorchMarks.length - 1; i >= 0; i--) {
            const s = this.scorchMarks[i];
            s.age += deltaTime;
            if (s.age > 20000) {
                s.alpha -= dt * 0.05;
                if (s.alpha <= 0) {
                    this.scorchMarks.splice(i, 1);
                }
            }
        }

        // Fade ice patches
        for (let i = this.icePatches.length - 1; i >= 0; i--) {
            const p = this.icePatches[i];
            p.age += deltaTime;
            if (p.age > 8000) {
                p.alpha -= dt * 0.2;
                if (p.alpha <= 0) {
                    this.icePatches.splice(i, 1);
                }
            }
        }

        // Fade footprints
        for (let i = this.footprints.length - 1; i >= 0; i--) {
            const f = this.footprints[i];
            f.age += deltaTime;
            if (f.age > 5000) {
                f.alpha -= dt * 0.1;
                if (f.alpha <= 0) {
                    this.footprints.splice(i, 1);
                }
            }
        }

        // Fade bullet holes
        for (let i = this.bulletHoles.length - 1; i >= 0; i--) {
            const h = this.bulletHoles[i];
            h.age += deltaTime;
            if (h.age > 15000) {
                h.alpha -= dt * 0.1;
                if (h.alpha <= 0) {
                    this.bulletHoles.splice(i, 1);
                }
            }
        }

        // Update screen shake
        if (this.screenShake > 0) {
            this.shakeX = (Math.random() - 0.5) * this.screenShake;
            this.shakeY = (Math.random() - 0.5) * this.screenShake;
            this.screenShake *= 0.9;
            if (this.screenShake < 0.5) this.screenShake = 0;
        } else {
            this.shakeX = 0;
            this.shakeY = 0;
        }
    }

    gameLoop(currentTime) {
        let deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Cap delta time
        if (deltaTime > 100) deltaTime = 100;

        // Apply game speed
        deltaTime *= this.gameSpeed;

        if (this.state === 'playing') {
            this.update(deltaTime);
        }

        this.render();

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        // Spawn enemies
        const newEnemy = this.waveManager.update(deltaTime, this.enemies);
        if (newEnemy) {
            this.enemies.push(newEnemy);
        }

        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const oldX = enemy.x;
            const oldY = enemy.y;
            enemy.update(deltaTime, this.enemies);

            // Create footprints occasionally as enemies walk
            if (!enemy.isDead && !enemy.reachedEnd && Math.random() < 0.02) {
                const angle = Math.atan2(enemy.y - oldY, enemy.x - oldX);
                this.createFootprint(enemy.x, enemy.y, angle);
            }

            // Handle boss abilities - summon minions
            if (enemy.minionsToSummon && enemy.minionsToSummon.length > 0) {
                for (const summon of enemy.minionsToSummon) {
                    for (let s = 0; s < summon.count; s++) {
                        // Spawn minions at boss position with slight offset
                        const minion = new Enemy(summon.type, this.pathWaypoints, 1);
                        // Find closest waypoint to boss
                        let closestIdx = 0;
                        let closestDist = Infinity;
                        for (let w = 0; w < this.pathWaypoints.length; w++) {
                            const dx = this.pathWaypoints[w].x - enemy.x;
                            const dy = this.pathWaypoints[w].y - enemy.y;
                            const dist = dx * dx + dy * dy;
                            if (dist < closestDist) {
                                closestDist = dist;
                                closestIdx = w;
                            }
                        }
                        minion.waypointIndex = Math.min(closestIdx + 1, this.pathWaypoints.length - 1);
                        minion.x = enemy.x + (Math.random() - 0.5) * 30;
                        minion.y = enemy.y + (Math.random() - 0.5) * 30;
                        this.enemies.push(minion);
                    }
                }
                enemy.minionsToSummon = [];

                // Create summon effect
                this.createExplosion(enemy.x, enemy.y, enemy.type === EnemyTypes.NECROMANCER ? '#9900ff' : '#ff4400', 20);
            }

            // Necromancer collects souls from nearby dead enemies
            if (enemy.type === EnemyTypes.NECROMANCER && !enemy.isDead) {
                // Increment souls based on nearby deaths (tracked by death particles)
                if (this.particles.some(p => p.type === 'death' &&
                    Math.hypot(p.x - enemy.x, p.y - enemy.y) < 100 &&
                    p.life > 0.9)) {
                    enemy.soulsCollected = Math.min(5, (enemy.soulsCollected || 0) + 1);
                }
            }

            if (enemy.reachedEnd) {
                this.lives--;
                this.enemies.splice(i, 1);

                if (this.lives <= 0) {
                    this.gameOver();
                    return;
                }
            } else if (enemy.isDead) {
                this.gold += enemy.reward;
                this.score += enemy.reward * 10;

                // Create death effects
                this.createBloodSplatter(enemy.x, enemy.y, enemy.radius);
                this.createDeathParticles(enemy.x, enemy.y, enemy.color);

                // Bomber explosion on death
                if (enemy.type === EnemyTypes.BOMBER) {
                    this.createExplosion(enemy.x, enemy.y, '#ff4400', 40);
                    this.createScorchMark(enemy.x, enemy.y, 30);
                    this.createScreenShake(8);
                }

                this.enemies.splice(i, 1);
            }
        }

        // Update towers
        for (const tower of this.towers) {
            const wasFiring = tower.muzzleFlash <= 0;
            tower.update(deltaTime, this.enemies, this.projectiles);

            // Create shell casings for bullet-based towers
            if (wasFiring && tower.muzzleFlash > 0) {
                if (tower.type === TowerTypes.BASIC || tower.type === TowerTypes.SNIPER) {
                    this.createShellCasing(
                        tower.x + Math.cos(tower.angle + Math.PI/2) * 10,
                        tower.y + Math.sin(tower.angle + Math.PI/2) * 10,
                        tower.angle
                    );
                }
                // Create muzzle smoke for heavy weapons
                if (tower.type === TowerTypes.CANNON || tower.type === TowerTypes.MISSILE) {
                    this.createMuzzleSmoke(
                        tower.x + Math.cos(tower.angle) * 25,
                        tower.y + Math.sin(tower.angle) * 25,
                        tower.angle
                    );
                }
                // Shell casings for minigun too
                if (tower.type === TowerTypes.MINIGUN) {
                    this.createShellCasing(
                        tower.x + Math.cos(tower.angle + Math.PI/2) * 8,
                        tower.y + Math.sin(tower.angle + Math.PI/2) * 8,
                        tower.angle
                    );
                }
            }
            // Flamethrower fire particles (continuous)
            if (tower.type === TowerTypes.FLAME && tower.target && tower.muzzleFlash > 0) {
                this.createFireParticle(
                    tower.x + Math.cos(tower.angle) * 30,
                    tower.y + Math.sin(tower.angle) * 30,
                    tower.angle
                );
                // Scorch mark at flame endpoint
                if (Math.random() < 0.05) {
                    const dist = tower.range * 0.6;
                    this.createScorchMark(
                        tower.x + Math.cos(tower.angle) * dist,
                        tower.y + Math.sin(tower.angle) * dist,
                        8
                    );
                }
            }
        }

        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            const wasAlive = !projectile.isExpired;
            projectile.update(deltaTime, this.enemies);

            if (projectile.isExpired) {
                // Create effects based on projectile type
                if (wasAlive) {
                    if (projectile.splashRadius > 0) {
                        this.createExplosion(projectile.x, projectile.y, projectile.splashRadius, '#FF6600');
                        this.createCrater(projectile.x, projectile.y, projectile.splashRadius * 0.4);
                        this.createDustCloud(projectile.x, projectile.y, 15);
                    }

                    // Ice effect for frost
                    if (projectile.projectileType === 'frost') {
                        this.createIcePatch(projectile.x, projectile.y, 12);
                    }

                    // Scorch for plasma
                    if (projectile.projectileType === 'plasma') {
                        this.createScorchMark(projectile.x, projectile.y, 15);
                        this.createSpark(projectile.x, projectile.y, 5);
                    }

                    // Bullet hole for regular bullets
                    if (projectile.projectileType === 'bullet' || projectile.projectileType === 'sniper') {
                        this.createBulletHole(projectile.x, projectile.y);
                        this.createSpark(projectile.x, projectile.y, 2);
                    }
                }
                this.projectiles.splice(i, 1);
            }
        }

        // Update explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            this.explosions[i].update(deltaTime);
            if (this.explosions[i].isExpired) {
                this.explosions.splice(i, 1);
            }
        }

        // Update visual effects
        this.updateEffects(deltaTime);

        // Check wave completion (only give bonus once)
        if (this.waveManager.isComplete() && !this.waveManager.bonusGiven) {
            this.waveManager.bonusGiven = true;
            this.gold += this.waveManager.getWaveBonus();
            document.getElementById('start-wave-btn').disabled = false;

            if (this.waveManager.isGameComplete()) {
                this.victory();
            }
        }

        // Update UI
        this.updateHUD();
        this.updateTowerButtons();

        // Update selected tower info
        if (this.selectedTower) {
            this.showTowerInfo(this.selectedTower);
        }
    }

    gameOver() {
        this.state = 'gameover';
        document.getElementById('final-wave').textContent = this.waveManager.currentWave;
        document.getElementById('final-score').textContent = this.score;
        this.showOverlay('game-over');
    }

    victory() {
        this.state = 'victory';
        document.getElementById('victory-score').textContent = this.score;
        this.showOverlay('victory');
    }

    render() {
        // Apply screen shake
        this.ctx.save();
        this.ctx.translate(this.shakeX, this.shakeY);

        // Clear canvas with sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a3d1a');
        gradient.addColorStop(1, '#2d5a27');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(-10, -10, this.canvas.width + 20, this.canvas.height + 20);

        // Draw grass pattern
        this.drawGrass();

        // Draw rocks (below path)
        this.drawRocks();

        // Draw grass tufts
        this.drawGrassTufts();

        // Draw footprints (on ground)
        for (const f of this.footprints) {
            this.ctx.save();
            this.ctx.translate(f.x, f.y);
            this.ctx.rotate(f.angle);
            this.ctx.globalAlpha = f.alpha;
            this.ctx.fillStyle = '#1a3010';
            // Boot print shape
            this.ctx.beginPath();
            if (f.isLeft) {
                this.ctx.ellipse(-2, 0, 3, 5, 0, 0, Math.PI * 2);
            } else {
                this.ctx.ellipse(2, 0, 3, 5, 0, 0, Math.PI * 2);
            }
            this.ctx.fill();
            this.ctx.restore();
        }

        // Draw scorch marks (on ground)
        for (const s of this.scorchMarks) {
            this.ctx.save();
            this.ctx.translate(s.x, s.y);
            const grad = this.ctx.createRadialGradient(0, 0, 0, 0, 0, s.radius);
            grad.addColorStop(0, `rgba(20, 15, 10, ${s.alpha})`);
            grad.addColorStop(0.5, `rgba(40, 25, 15, ${s.alpha * 0.6})`);
            grad.addColorStop(1, `rgba(60, 40, 20, 0)`);
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, s.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        // Draw ice patches (on ground)
        for (const p of this.icePatches) {
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            const grad = this.ctx.createRadialGradient(0, 0, 0, 0, 0, p.radius);
            grad.addColorStop(0, `rgba(200, 230, 255, ${p.alpha * 0.6})`);
            grad.addColorStop(0.6, `rgba(150, 200, 240, ${p.alpha * 0.4})`);
            grad.addColorStop(1, `rgba(100, 180, 220, 0)`);
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            // Irregular ice shape
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const r = p.radius * (0.7 + Math.sin(i * 3) * 0.3);
                if (i === 0) this.ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
                else this.ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
            }
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.restore();
        }

        // Draw bullet holes (on ground)
        for (const h of this.bulletHoles) {
            this.ctx.save();
            this.ctx.globalAlpha = h.alpha;
            this.ctx.fillStyle = '#1a1a10';
            this.ctx.beginPath();
            this.ctx.arc(h.x, h.y, h.size, 0, Math.PI * 2);
            this.ctx.fill();
            // Dirt ring
            this.ctx.strokeStyle = '#3a3520';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(h.x, h.y, h.size + 1, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
        }

        // Draw craters (on ground, before path)
        for (const crater of this.craters) {
            this.ctx.save();
            this.ctx.translate(crater.x, crater.y);

            const craterGrad = this.ctx.createRadialGradient(0, 0, 0, 0, 0, crater.radius);
            craterGrad.addColorStop(0, `rgba(30, 20, 10, ${crater.alpha * 0.8})`);
            craterGrad.addColorStop(0.6, `rgba(50, 35, 20, ${crater.alpha * 0.5})`);
            craterGrad.addColorStop(1, `rgba(70, 50, 30, 0)`);

            this.ctx.fillStyle = craterGrad;
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, crater.radius, crater.radius * 0.7, 0, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.restore();
        }

        // Draw path
        this.path.draw(this.ctx);

        // Draw trees (some behind, some in front)
        this.drawTrees(false); // Behind towers

        // Draw tower placement preview
        if (this.selectedTowerType && this.hoveredTile) {
            this.drawPlacementPreview();
        }

        // Draw towers
        for (const tower of this.towers) {
            tower.draw(this.ctx, tower === this.selectedTower);

            // Draw rally flag for barracks
            if (tower.isBarracks && tower.rallyPoint) {
                const rp = tower.rallyPoint;
                // Flag pole
                this.ctx.strokeStyle = '#333';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(rp.x, rp.y);
                this.ctx.lineTo(rp.x, rp.y - 20);
                this.ctx.stroke();
                // Flag
                const wave = Math.sin(Date.now() / 200) * 2;
                this.ctx.fillStyle = '#42a5f5';
                this.ctx.beginPath();
                this.ctx.moveTo(rp.x, rp.y - 20);
                this.ctx.lineTo(rp.x + 12, rp.y - 17 + wave);
                this.ctx.lineTo(rp.x + 12, rp.y - 11 + wave);
                this.ctx.lineTo(rp.x, rp.y - 14);
                this.ctx.closePath();
                this.ctx.fill();
                // Ground dot
                this.ctx.fillStyle = 'rgba(66, 165, 245, 0.3)';
                this.ctx.beginPath();
                this.ctx.arc(rp.x, rp.y, 8, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        // Rally mode blue circle
        if (this.rallyMode && this.selectedTower && this.selectedTower.isBarracks) {
            const t = this.selectedTower;
            const pulse = Math.sin(Date.now() / 300) * 0.1 + 0.2;
            this.ctx.fillStyle = `rgba(66, 165, 245, ${pulse})`;
            this.ctx.beginPath();
            this.ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(66, 165, 245, 0.7)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([8, 4]);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        // Draw enemies
        for (const enemy of this.enemies) {
            enemy.draw(this.ctx);
        }

        // Draw projectiles
        for (const projectile of this.projectiles) {
            projectile.draw(this.ctx);
        }

        // Draw explosions
        for (const explosion of this.explosions) {
            explosion.draw(this.ctx);
        }

        // Draw blood splatters
        for (const blood of this.bloodSplatters) {
            this.ctx.save();
            this.ctx.globalAlpha = blood.alpha;

            const gradient = this.ctx.createRadialGradient(blood.x, blood.y, 0, blood.x, blood.y, blood.size);
            gradient.addColorStop(0, '#8B0000');
            gradient.addColorStop(1, '#4a0000');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(blood.x, blood.y, blood.size, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.restore();
        }

        // Draw shell casings
        for (const shell of this.shellCasings) {
            this.ctx.save();
            this.ctx.translate(shell.x, shell.y);
            this.ctx.rotate(shell.rotation);
            this.ctx.globalAlpha = shell.alpha;

            this.ctx.fillStyle = '#B8860B';
            this.ctx.fillRect(-shell.size, -shell.size * 0.3, shell.size * 2, shell.size * 0.6);

            this.ctx.fillStyle = '#DAA520';
            this.ctx.fillRect(-shell.size, -shell.size * 0.3, shell.size * 2, shell.size * 0.2);

            this.ctx.restore();
        }

        // Draw particles
        for (const p of this.particles) {
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;

            if (p.isDust) {
                const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                gradient.addColorStop(0, `rgba(139, 115, 85, ${p.alpha * 0.5})`);
                gradient.addColorStop(1, `rgba(139, 115, 85, 0)`);
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (p.isFire) {
                // Fire particle with glow
                this.ctx.shadowColor = p.color;
                this.ctx.shadowBlur = 10;
                const fireGrad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                fireGrad.addColorStop(0, '#FFFF00');
                fireGrad.addColorStop(0.4, p.color);
                fireGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');
                this.ctx.fillStyle = fireGrad;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            } else if (p.isSpark) {
                // Spark with bright glow
                this.ctx.shadowColor = '#FFA500';
                this.ctx.shadowBlur = 8;
                this.ctx.fillStyle = '#FFFF00';
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            } else {
                this.ctx.fillStyle = p.color;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();

                if (p.color === '#FFD700') {
                    this.ctx.shadowColor = p.color;
                    this.ctx.shadowBlur = 5;
                    this.ctx.fill();
                    this.ctx.shadowBlur = 0;
                }
            }

            this.ctx.restore();
        }

        // Draw trees in front
        this.drawTrees(true);

        // End screen shake
        this.ctx.restore();
    }

    drawGrass() {
        // Base grass tiles with variation
        for (let x = 0; x < this.canvas.width; x += 50) {
            for (let y = 0; y < this.canvas.height; y += 50) {
                const shade = ((x + y) % 100 === 0) ? '#3d6b2d' : '#2d5a27';
                this.ctx.fillStyle = shade;
                this.ctx.fillRect(x, y, 50, 50);

                // Add subtle noise
                this.ctx.fillStyle = 'rgba(0,0,0,0.05)';
                for (let i = 0; i < 3; i++) {
                    this.ctx.fillRect(
                        x + Math.random() * 50,
                        y + Math.random() * 50,
                        2 + Math.random() * 4,
                        2 + Math.random() * 4
                    );
                }
            }
        }
    }

    drawRocks() {
        this.ctx.fillStyle = '#666';
        for (const rock of this.rocks) {
            this.ctx.save();
            this.ctx.translate(rock.x, rock.y);

            // Shadow
            this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
            this.ctx.beginPath();
            this.ctx.ellipse(2, 2, rock.size * 1.1, rock.size * 0.7, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // Rock
            this.ctx.fillStyle = rock.color;
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, rock.size, rock.size * 0.7, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // Highlight
            this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
            this.ctx.beginPath();
            this.ctx.ellipse(-rock.size * 0.3, -rock.size * 0.2, rock.size * 0.3, rock.size * 0.2, 0, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.restore();
        }
    }

    drawGrassTufts() {
        this.ctx.strokeStyle = '#4a7a3a';
        this.ctx.lineWidth = 1;

        for (const tuft of this.grassTufts) {
            this.ctx.save();
            this.ctx.translate(tuft.x, tuft.y);

            for (let i = 0; i < tuft.blades; i++) {
                const angle = (i / tuft.blades - 0.5) * 0.8;
                const height = tuft.height * (0.7 + Math.random() * 0.3);

                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.quadraticCurveTo(
                    Math.sin(angle) * height * 0.5,
                    -height * 0.5,
                    Math.sin(angle) * height,
                    -height
                );
                this.ctx.stroke();
            }

            this.ctx.restore();
        }
    }

    drawTrees(inFront) {
        for (const tree of this.trees) {
            // Draw trees in front if they're in the lower half
            const shouldDrawNow = inFront ? (tree.y > this.canvas.height / 2) : (tree.y <= this.canvas.height / 2);
            if (!shouldDrawNow) continue;

            this.ctx.save();
            this.ctx.translate(tree.x, tree.y);
            const s = tree.size;

            // Shadow
            this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
            this.ctx.beginPath();
            this.ctx.ellipse(10 * s, 20 * s, 25 * s, 10 * s, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // Trunk
            this.ctx.fillStyle = '#4a3728';
            this.ctx.fillRect(-5 * s, -10 * s, 10 * s, 35 * s);

            // Trunk texture
            this.ctx.strokeStyle = '#3a2718';
            this.ctx.lineWidth = 1;
            for (let i = 0; i < 4; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(-3 * s + i * 2 * s, -10 * s);
                this.ctx.lineTo(-3 * s + i * 2 * s, 25 * s);
                this.ctx.stroke();
            }

            // Foliage layers based on tree type
            if (tree.type === 0) {
                // Round tree
                this.ctx.fillStyle = '#1a4a1a';
                this.ctx.beginPath();
                this.ctx.arc(0, -30 * s, 28 * s, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#2d6b2d';
                this.ctx.beginPath();
                this.ctx.arc(-8 * s, -35 * s, 20 * s, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#3d7b3d';
                this.ctx.beginPath();
                this.ctx.arc(5 * s, -40 * s, 15 * s, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (tree.type === 1) {
                // Pine tree
                this.ctx.fillStyle = '#1a4a2a';
                this.ctx.beginPath();
                this.ctx.moveTo(0, -60 * s);
                this.ctx.lineTo(-25 * s, -10 * s);
                this.ctx.lineTo(25 * s, -10 * s);
                this.ctx.closePath();
                this.ctx.fill();

                this.ctx.fillStyle = '#2d6b3d';
                this.ctx.beginPath();
                this.ctx.moveTo(0, -45 * s);
                this.ctx.lineTo(-20 * s, -5 * s);
                this.ctx.lineTo(20 * s, -5 * s);
                this.ctx.closePath();
                this.ctx.fill();
            } else {
                // Oak tree
                this.ctx.fillStyle = '#2a5a2a';
                this.ctx.beginPath();
                this.ctx.arc(-12 * s, -25 * s, 18 * s, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.arc(12 * s, -25 * s, 18 * s, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.arc(0, -35 * s, 20 * s, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = '#3d7b3d';
                this.ctx.beginPath();
                this.ctx.arc(-5 * s, -30 * s, 12 * s, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.arc(8 * s, -38 * s, 10 * s, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.restore();
        }
    }

    drawPlacementPreview() {
        const tileX = this.hoveredTile.x;
        const tileY = this.hoveredTile.y;
        const canPlace = this.canPlaceTower(tileX, tileY);

        const x = tileX * this.path.tileSize;
        const y = tileY * this.path.tileSize;

        // Draw tile highlight
        this.ctx.fillStyle = canPlace ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)';
        this.ctx.fillRect(x, y, this.path.tileSize, this.path.tileSize);

        // Draw range preview
        if (canPlace) {
            const centerX = x + this.path.tileSize / 2;
            const centerY = y + this.path.tileSize / 2;
            const range = TowerData[this.selectedTowerType].range;

            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, range, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }
    }
}

// Start game when page loads
window.addEventListener('load', () => {
    window.game = new Game();
});
