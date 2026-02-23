// Main game loop and state management

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.gameState = 'start'; // 'start', 'playing', 'gameover'
        this.score = 0;
        this.level = 1;
        this.wave = 1;
        this.wavesPerLevel = 3;

        // Wave management
        this.enemiesInWave = 0;
        this.enemiesKilled = 0;
        this.enemiesSpawned = 0;
        this.spawnTimer = 0;
        this.spawnDelay = 60; // frames between spawns
        this.waveTransition = false;
        this.transitionTimer = 0;

        // Game objects
        this.player = null;
        this.enemies = [];
        this.powerUps = [];
        this.explosions = [];
        this.boss = null;
        this.bossPhase = false;

        // Power-up drop chance
        this.powerUpChance = 0.35;

        // Stars background
        this.stars = this.createStars(100);

        // Start game loop
        this.lastTime = 0;
        this.setupStartScreen();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        if (this.player) {
            this.player.resize(this.canvas.width, this.canvas.height);
        }
    }

    createStars(count) {
        const stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 0.5 + 0.2
            });
        }
        return stars;
    }

    setupStartScreen() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (this.gameState === 'start') {
                    this.startGame();
                } else if (this.gameState === 'gameover') {
                    this.restartGame();
                }
            }
        });
    }

    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.level = 1;
        this.wave = 1;
        this.player = new Player(this.canvas.width, this.canvas.height);
        this.enemies = [];
        this.powerUps = [];
        this.explosions = [];
        this.boss = null;
        this.bossPhase = false;
        this.startWave();
    }

    restartGame() {
        this.startGame();
    }

    startWave() {
        // Calculate wave difficulty
        const baseEnemies = 5;
        const enemiesPerWave = 3;
        const enemiesPerLevel = 5;

        this.enemiesInWave = baseEnemies +
            (this.wave - 1) * enemiesPerWave +
            (this.level - 1) * enemiesPerLevel;

        this.enemiesKilled = 0;
        this.enemiesSpawned = 0;
        this.spawnTimer = 0;

        // Decrease spawn delay for higher waves
        this.spawnDelay = Math.max(20, 60 - (this.wave - 1) * 10 - (this.level - 1) * 5);

        this.waveTransition = false;
    }

    spawnEnemy() {
        const padding = 50;
        const x = randomRange(padding, this.canvas.width - padding);

        // Determine enemy stats based on level and wave
        let health = 1;
        let speed = 0.8 + (this.wave - 1) * 0.15 + (this.level - 1) * 0.1;

        // Chance for stronger enemies in later waves/levels
        const strongChance = (this.wave - 1) * 0.1 + (this.level - 1) * 0.15;
        if (Math.random() < strongChance) {
            health = Math.random() < 0.3 ? 3 : 2;
        }

        this.enemies.push(new Enemy(x, -30, health, speed));
        this.enemiesSpawned++;
    }

    createExplosion(x, y, color) {
        const particles = [];
        const particleCount = 8;

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                size: randomRange(3, 6),
                life: 30,
                color: color
            });
        }

        this.explosions.push(...particles);
    }

    update() {
        // Update stars
        this.stars.forEach(star => {
            star.y += star.speed;
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * this.canvas.width;
            }
        });

        if (this.gameState !== 'playing') return;

        // Wave transition
        if (this.waveTransition) {
            this.transitionTimer--;
            if (this.transitionTimer <= 0) {
                this.wave++;
                if (this.wave > this.wavesPerLevel) {
                    // Start boss phase instead of going to next level
                    this.bossPhase = true;
                    this.waveTransition = false;
                    this.boss = new Boss(this.canvas.width, this.level);
                    return;
                }
                this.startWave();
            }
            return;
        }

        // Boss phase
        if (this.bossPhase && this.boss) {
            this.player.update();
            this.boss.update(this.canvas.height);

            // Update power-ups
            this.powerUps.forEach(powerUp => powerUp.update());
            this.powerUps = this.powerUps.filter(p => p.active);

            // Update explosions
            this.explosions.forEach(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.life--;
                particle.size *= 0.95;
            });
            this.explosions = this.explosions.filter(p => p.life > 0);

            this.checkBossCollisions();

            // Check if boss defeated
            if (!this.boss.active && this.boss.bullets.length === 0) {
                this.bossPhase = false;
                this.boss = null;
                this.wave = 0; // Will become 1 after transition increments it
                this.level++;
                this.waveTransition = true;
                this.transitionTimer = 120;
            }
            return;
        }

        // Spawn enemies
        if (this.enemiesSpawned < this.enemiesInWave) {
            this.spawnTimer--;
            if (this.spawnTimer <= 0) {
                this.spawnEnemy();
                this.spawnTimer = this.spawnDelay;
            }
        }

        // Update player
        this.player.update();

        // Update enemies
        this.enemies.forEach(enemy => {
            const escaped = enemy.update(this.canvas.height);
            if (escaped) {
                // Enemy passed player - game over
                this.player.alive = false;
                this.gameState = 'gameover';
            }
        });

        // Update power-ups
        this.powerUps.forEach(powerUp => powerUp.update());
        this.powerUps = this.powerUps.filter(p => p.active);

        // Update explosions
        this.explosions.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            particle.size *= 0.95;
        });
        this.explosions = this.explosions.filter(p => p.life > 0);

        // Check collisions
        this.checkCollisions();

        // Clean up inactive enemies
        this.enemies = this.enemies.filter(e => e.active || e.bullets.length > 0);

        // Check wave completion
        if (this.enemiesKilled >= this.enemiesInWave && this.enemies.filter(e => e.active).length === 0) {
            this.waveTransition = true;
            this.transitionTimer = 120; // 2 seconds
        }
    }

    checkCollisions() {
        const playerBounds = this.player.getBounds();

        // Player bullets vs enemies
        this.player.bullets.forEach(bullet => {
            if (!bullet.active) return;

            this.enemies.forEach(enemy => {
                if (!enemy.active) return;

                if (checkCollision(bullet, enemy.getBounds())) {
                    bullet.active = false;
                    const killed = enemy.takeDamage(bullet.damage);

                    if (killed) {
                        this.enemiesKilled++;
                        this.score += enemy.maxHealth * 100;
                        this.createExplosion(enemy.x, enemy.y, enemy.color);

                        // Chance to drop power-up
                        if (Math.random() < this.powerUpChance) {
                            this.powerUps.push(new PowerUp(
                                enemy.x,
                                enemy.y,
                                PowerUp.getRandomType()
                            ));
                        }
                    }
                }
            });
        });

        // Enemy bullets vs player
        this.enemies.forEach(enemy => {
            enemy.bullets.forEach(bullet => {
                if (!bullet.active) return;

                if (checkCollision(bullet, playerBounds)) {
                    bullet.active = false;
                    this.player.alive = false;
                    this.gameState = 'gameover';
                    this.createExplosion(this.player.x, this.player.y, '#4488ff');
                }
            });
        });

        // Power-ups vs player
        this.powerUps.forEach(powerUp => {
            if (!powerUp.active) return;

            if (checkCollision(powerUp, playerBounds)) {
                powerUp.active = false;
                this.player.applyPowerUp(powerUp.type);
                this.score += 50;
            }
        });
    }

    checkBossCollisions() {
        const playerBounds = this.player.getBounds();

        // Player bullets vs boss
        this.player.bullets.forEach(bullet => {
            if (!bullet.active || !this.boss.active) return;

            if (checkCollision(bullet, this.boss.getBounds())) {
                bullet.active = false;
                const killed = this.boss.takeDamage(bullet.damage);

                if (killed) {
                    this.score += 1000 * this.level;
                    // Big explosion for boss
                    for (let i = 0; i < 5; i++) {
                        this.createExplosion(
                            this.boss.x + randomRange(-40, 40),
                            this.boss.y + randomRange(-30, 30),
                            this.boss.color
                        );
                    }
                    // Drop power-ups
                    this.powerUps.push(new PowerUp(this.boss.x - 30, this.boss.y, POWERUP_TYPES.MULTISHOT));
                    this.powerUps.push(new PowerUp(this.boss.x + 30, this.boss.y, POWERUP_TYPES.STRONG_LASER));
                    // Clear boss bullets
                    this.boss.bullets = [];
                }
            }
        });

        // Boss bullets vs player
        this.boss.bullets.forEach(bullet => {
            if (!bullet.active) return;

            if (checkCollision(bullet, playerBounds)) {
                bullet.active = false;
                this.player.alive = false;
                this.gameState = 'gameover';
                this.createExplosion(this.player.x, this.player.y, '#4488ff');
            }
        });

        // Power-ups vs player
        this.powerUps.forEach(powerUp => {
            if (!powerUp.active) return;

            if (checkCollision(powerUp, playerBounds)) {
                powerUp.active = false;
                this.player.applyPowerUp(powerUp.type);
                this.score += 50;
            }
        });
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw stars
        this.ctx.fillStyle = '#ffffff';
        this.stars.forEach(star => {
            this.ctx.globalAlpha = star.size / 3;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;

        if (this.gameState === 'start') {
            this.drawStartScreen();
            return;
        }

        if (this.gameState === 'gameover') {
            this.drawGameObjects();
            this.drawGameOverScreen();
            return;
        }

        // Draw game objects
        this.drawGameObjects();

        // Draw wave transition
        if (this.waveTransition) {
            this.drawWaveTransition();
        }

        // Draw UI
        this.drawUI();
    }

    drawGameObjects() {
        // Draw power-ups
        this.powerUps.forEach(powerUp => powerUp.draw(this.ctx));

        // Draw enemies
        this.enemies.forEach(enemy => enemy.draw(this.ctx));

        // Draw boss
        if (this.boss) {
            this.boss.draw(this.ctx);
        }

        // Draw player
        if (this.player) {
            this.player.draw(this.ctx);
        }

        // Draw explosions
        this.explosions.forEach(particle => {
            this.ctx.globalAlpha = particle.life / 30;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
    }

    drawUI() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'left';

        // Score
        this.ctx.fillText(`Score: ${this.score}`, 20, 35);

        // Level and wave
        if (this.bossPhase) {
            this.ctx.fillStyle = '#ff0044';
            this.ctx.fillText(`Level ${this.level} - BOSS FIGHT!`, 20, 65);
            this.ctx.fillStyle = '#ffffff';
        } else {
            this.ctx.fillText(`Level ${this.level} - Wave ${this.wave}/${this.wavesPerLevel}`, 20, 65);

            // Enemies remaining
            const remaining = this.enemiesInWave - this.enemiesKilled;
            this.ctx.fillText(`Enemies: ${remaining}`, 20, 95);
        }

        // Power-up indicators
        this.ctx.textAlign = 'right';
        let powerUpY = 35;

        if (this.player.multiShot) {
            this.ctx.fillStyle = '#00ffff';
            const seconds = Math.ceil(this.player.multiShotTimer / 60);
            this.ctx.fillText(`Multi-Shot: ${seconds}s`, this.canvas.width - 20, powerUpY);
            powerUpY += 30;
        }

        if (this.player.strongLaser) {
            this.ctx.fillStyle = '#ff00ff';
            const seconds = Math.ceil(this.player.strongLaserTimer / 60);
            this.ctx.fillText(`Strong Laser: ${seconds}s`, this.canvas.width - 20, powerUpY);
        }
    }

    drawStartScreen() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 60px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GALAXY DEFENSE', this.canvas.width / 2, this.canvas.height / 2 - 80);

        this.ctx.font = '24px Arial';
        this.ctx.fillText('Arrow Keys or A/D to move', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillText('Spacebar to shoot', this.canvas.width / 2, this.canvas.height / 2 + 40);

        this.ctx.font = '30px Arial';
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillText('Press ENTER to start', this.canvas.width / 2, this.canvas.height / 2 + 120);
    }

    drawGameOverScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#ff0000';
        this.ctx.font = 'bold 60px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 60);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '30px Arial';
        this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
        this.ctx.fillText(`Reached Level ${this.level}, Wave ${this.wave}`, this.canvas.width / 2, this.canvas.height / 2 + 50);

        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillText('Press ENTER to play again', this.canvas.width / 2, this.canvas.height / 2 + 120);
    }

    drawWaveTransition() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 40px Arial';
        this.ctx.textAlign = 'center';

        let message;
        let nextMessage;

        if (this.wave === 0) {
            // Just defeated a boss
            message = `BOSS DEFEATED!`;
            this.ctx.fillStyle = '#00ff00';
            this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`Starting Level ${this.level}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
        } else if (this.wave >= this.wavesPerLevel) {
            message = `Wave ${this.wave} Complete!`;
            this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '24px Arial';
            this.ctx.fillStyle = '#ff0044';
            this.ctx.fillText(`BOSS INCOMING!`, this.canvas.width / 2, this.canvas.height / 2 + 40);
        } else {
            message = `Wave ${this.wave} Complete!`;
            this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`Next: Wave ${this.wave + 1}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
        }
    }

    gameLoop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update();
        this.draw();

        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new Game();
});
