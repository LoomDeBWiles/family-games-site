// Main game controller

class Game {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 1024;
        this.canvas.height = 768;

        // Game state
        this.state = 'menu'; // menu, playing, boss, victory, gameover, shop, win
        this.level = 1;
        this.maxLevel = 10;

        // Game objects
        this.player = null;
        this.enemies = [];
        this.items = [];
        this.boss = null;
        this.deadEnemyCount = 0;

        // Systems
        this.spawner = new Spawner(this.canvas.width, this.canvas.height);
        this.ui = new UI(this);
        this.shop = new Shop(this);

        // Timing
        this.lastTime = 0;
        this.deltaTime = 0;

        // Input
        this.mouseX = 0;
        this.mouseY = 0;

        // Bind event listeners
        this.bindEvents();

        // Start game loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    bindEvents() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            if (this.player && this.state === 'playing' || this.state === 'boss') {
                this.player.handleKeyDown(e.key);
            }
        });

        window.addEventListener('keyup', (e) => {
            if (this.player) {
                this.player.handleKeyUp(e.key);
            }
        });

        // Mouse
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;

            if (this.player) {
                this.player.handleMouseMove(this.mouseX, this.mouseY);
            }
        });

        this.canvas.addEventListener('mousedown', (e) => {
            if (this.player && (this.state === 'playing' || this.state === 'boss')) {
                this.player.attack();
            }
        });

        // UI Buttons
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.retryLevel());
        document.getElementById('shop-btn').addEventListener('click', () => this.openShop());
        document.getElementById('play-again-btn').addEventListener('click', () => this.resetGame());
    }

    startGame() {
        this.state = 'playing';
        this.level = 1;

        // Initialize player
        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2);

        // Clear game objects
        this.enemies = [];
        this.items = [];
        this.boss = null;
        this.deadEnemyCount = 0;

        // Reset spawner
        this.spawner.reset();

        // Hide menu
        this.ui.hideAllOverlays();
    }

    resetGame() {
        this.level = 1;
        this.player = null;
        this.enemies = [];
        this.items = [];
        this.boss = null;
        this.state = 'menu';
        this.ui.showOverlay('main-menu');
    }

    retryLevel() {
        // Keep current level, just reset the round
        this.state = 'playing';
        this.enemies = [];
        this.items = [];
        this.boss = null;
        this.deadEnemyCount = 0;
        this.spawner.reset();

        // Reset player position and health but keep inventory/equipment
        this.player.reset(this.canvas.width / 2, this.canvas.height / 2);

        this.ui.hideAllOverlays();
    }

    nextLevel() {
        this.level++;

        if (this.level > this.maxLevel) {
            // Game complete!
            this.state = 'win';
            this.ui.showOverlay('win-screen');
            return;
        }

        // Reset for next level
        this.state = 'playing';
        this.enemies = [];
        this.items = [];
        this.boss = null;
        this.deadEnemyCount = 0;
        this.spawner.reset();

        // Reset player position and health
        this.player.reset(this.canvas.width / 2, this.canvas.height / 2);

        this.ui.hideAllOverlays();
    }

    openShop() {
        this.state = 'shop';
        this.ui.hideAllOverlays();
        this.shop.open();
    }

    gameLoop(currentTime) {
        // Calculate delta time
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Cap delta time to prevent huge jumps
        if (this.deltaTime > 100) this.deltaTime = 100;

        // Update and render based on state
        this.update();
        this.render();

        // Continue loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update() {
        if (this.state === 'playing') {
            this.updatePlaying();
        } else if (this.state === 'boss') {
            this.updateBoss();
        }

        // Always update UI
        this.ui.update(this.deltaTime);
    }

    updatePlaying() {
        // Update spawner
        this.spawner.update(this.deltaTime, this.level);

        // Spawn enemies
        if (this.spawner.shouldSpawn()) {
            const newEnemies = this.spawner.spawnEnemies(this.level, this.player.x, this.player.y);
            this.enemies.push(...newEnemies);
        }

        // Check for boss spawn
        if (this.spawner.shouldSpawnBoss()) {
            this.spawnBoss();
        }

        // Update player
        this.player.update(this.deltaTime, this.canvas.width, this.canvas.height);

        // Update enemies
        this.updateEnemies();

        // Update items
        this.updateItems();

        // Check player death
        if (this.player.health <= 0) {
            this.gameOver();
        }

        // Update HUD
        this.ui.updateHUD(this.player, this.spawner, this.level);
    }

    updateBoss() {
        // Update player
        this.player.update(this.deltaTime, this.canvas.width, this.canvas.height);

        // Update boss
        if (this.boss && !this.boss.isDead) {
            this.boss.update(this.deltaTime, this.player, this.enemies);

            // Boss special attacks
            const spawned = this.boss.specialAttack(this);
            if (spawned) {
                this.enemies.push(...spawned);
            }

            // Necromancer resurrection
            if (this.boss instanceof Necromancer) {
                const resurrected = this.boss.resurrectDead(
                    Array(this.deadEnemyCount).fill(null),
                    this.canvas.width,
                    this.canvas.height
                );
                if (resurrected.length > 0) {
                    this.enemies.push(...resurrected);
                    this.deadEnemyCount = Math.max(0, this.deadEnemyCount - resurrected.length);
                }
            }

            // Check boss projectiles hitting player
            if (this.boss.projectiles) {
                this.boss.projectiles.forEach(proj => {
                    if (proj.checkHit(this.player)) {
                        const damage = this.player.takeDamage(proj.damage);
                        if (damage > 0) {
                            this.ui.addDamageNumber(this.player.x, this.player.y, damage);
                        }
                    }
                });
            }

            // Boss melee attack
            const bossDamage = this.boss.attack(this.player);
            if (bossDamage > 0) {
                const actualDamage = this.player.takeDamage(bossDamage);
                if (actualDamage > 0) {
                    this.ui.addDamageNumber(this.player.x, this.player.y, actualDamage);
                }
            }

            // Player attack boss
            if (this.player.isAttacking && this.player.checkAttackHit(this.boss)) {
                const killed = this.boss.takeDamage(this.player.weapon.damage);
                this.ui.addDamageNumber(this.boss.x, this.boss.y, this.player.weapon.damage);

                if (killed) {
                    this.onBossKilled();
                }
            }
        }

        // Update remaining enemies
        this.updateEnemies();

        // Update items
        this.updateItems();

        // Check player death
        if (this.player.health <= 0) {
            this.gameOver();
        }

        // Update HUD
        this.ui.updateHUD(this.player, this.spawner, this.level);
    }

    updateEnemies() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];

            if (enemy.isDead) {
                // Drop items
                const drops = generateDrop(enemy.x, enemy.y, enemy.type, this.level);
                this.items.push(...drops);
                this.deadEnemyCount++;

                this.enemies.splice(i, 1);
                continue;
            }

            enemy.update(this.deltaTime, this.player, this.enemies);

            // Enemy attack player
            const damage = enemy.attack(this.player);
            if (damage > 0) {
                const actualDamage = this.player.takeDamage(damage);
                if (actualDamage > 0) {
                    this.ui.addDamageNumber(this.player.x, this.player.y, actualDamage);
                }
            }

            // Player attack enemy
            if (this.player.isAttacking && this.player.checkAttackHit(enemy)) {
                const killed = enemy.takeDamage(this.player.weapon.damage);
                this.ui.addDamageNumber(enemy.x, enemy.y, this.player.weapon.damage);
            }

            // Keep enemy in bounds
            enemy.x = Math.max(enemy.radius, Math.min(this.canvas.width - enemy.radius, enemy.x));
            enemy.y = Math.max(enemy.radius, Math.min(this.canvas.height - enemy.radius, enemy.y));
        }
    }

    updateItems() {
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];

            item.update(this.deltaTime);

            // Check expiration
            if (item.isExpired || item.collected) {
                this.items.splice(i, 1);
                continue;
            }

            // Check collection
            if (Collision.circleCircle(this.player.x, this.player.y, this.player.radius + 10,
                                        item.x, item.y, item.radius)) {
                this.collectItem(item);
                item.collected = true;
            }
        }
    }

    collectItem(item) {
        switch (item.type) {
            case ItemTypes.COIN:
                this.player.inventory.addCoins(item.value);
                this.ui.addPickupNotification(`+${item.value} coins`);
                break;

            case ItemTypes.HEALTH_POTION:
                const healed = this.player.heal(item.value);
                if (healed > 0) {
                    this.ui.addDamageNumber(this.player.x, this.player.y, healed, false, true);
                    this.ui.addPickupNotification(`+${healed} health`);
                }
                break;

            case ItemTypes.WEAPON_FRAGMENT:
                this.player.inventory.addWeaponFragment(item.subType);
                this.ui.addPickupNotification(`+1 ${WeaponData[item.subType].name} fragment`);
                break;

            case ItemTypes.ARMOR_FRAGMENT:
                this.player.inventory.addArmorFragment(item.subType);
                this.ui.addPickupNotification(`+1 ${ArmorData[item.subType].name} fragment`);
                break;
        }
    }

    spawnBoss() {
        this.state = 'boss';
        this.boss = this.spawner.spawnBoss(this.level, this.canvas.width, this.canvas.height);

        // Clear remaining enemies (give them a moment to be killed)
        // Actually, keep them for added challenge!
    }

    onBossKilled() {
        // Drop boss loot
        const drops = generateDrop(this.boss.x, this.boss.y, 'boss', this.level);
        this.items.push(...drops);

        // Show victory
        this.state = 'victory';

        document.getElementById('victory-message').textContent =
            `You defeated the ${this.boss.name}!`;

        this.ui.showOverlay('victory-screen');
    }

    gameOver() {
        this.state = 'gameover';
        this.ui.showOverlay('game-over-screen');
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#2d2d44';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.state === 'menu' || this.state === 'gameover' || this.state === 'victory' ||
            this.state === 'shop' || this.state === 'win') {
            // Just draw background grid
            this.drawArenaBackground();
            return;
        }

        // Draw arena
        this.drawArenaBackground();

        // Draw items
        this.items.forEach(item => item.draw(this.ctx));

        // Draw enemies
        this.enemies.forEach(enemy => enemy.draw(this.ctx));

        // Draw boss
        if (this.boss && !this.boss.isDead) {
            this.boss.draw(this.ctx);
            this.ui.drawBossHealthBar(this.ctx, this.boss);
        }

        // Draw player
        if (this.player) {
            this.player.draw(this.ctx);
        }

        // Draw UI effects
        this.ui.draw(this.ctx);
        this.ui.drawNotifications(this.ctx);
    }

    drawArenaBackground() {
        // Draw grid pattern
        this.ctx.strokeStyle = '#3d3d5c';
        this.ctx.lineWidth = 1;

        const gridSize = 50;

        for (let x = 0; x <= this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y <= this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        // Draw border
        this.ctx.strokeStyle = '#5a5a8a';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(2, 2, this.canvas.width - 4, this.canvas.height - 4);
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    window.game = new Game();
});
