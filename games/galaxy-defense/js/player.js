// Player spaceship class

class Player {
    constructor(canvasWidth, canvasHeight) {
        this.width = 50;
        this.height = 40;
        this.x = canvasWidth / 2;
        this.y = canvasHeight - 60;
        this.speed = 10;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        // Shooting
        this.shootCooldown = 0;
        this.shootDelay = 8; // frames between shots
        this.bullets = [];

        // Power-ups
        this.multiShot = false;
        this.multiShotTimer = 0;
        this.strongLaser = false;
        this.strongLaserTimer = 0;
        this.powerUpDuration = 600; // frames (about 10 seconds at 60fps)

        // State
        this.alive = true;

        // Input state
        this.keys = {
            left: false,
            right: false,
            shoot: false
        };

        this.setupControls();
    }

    setupControls() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                this.keys.left = true;
            }
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                this.keys.right = true;
            }
            if (e.key === ' ') {
                this.keys.shoot = true;
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                this.keys.left = false;
            }
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                this.keys.right = false;
            }
            if (e.key === ' ') {
                this.keys.shoot = false;
            }
        });
    }

    update() {
        if (!this.alive) return;

        // Movement
        if (this.keys.left) {
            this.x -= this.speed;
        }
        if (this.keys.right) {
            this.x += this.speed;
        }

        // Keep player within bounds
        this.x = clamp(this.x, this.width / 2, this.canvasWidth - this.width / 2);

        // Shooting
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }

        if (this.keys.shoot && this.shootCooldown === 0) {
            this.shoot();
            this.shootCooldown = this.shootDelay;
        }

        // Update bullets
        this.bullets.forEach(bullet => bullet.update());
        this.bullets = this.bullets.filter(bullet => bullet.active);

        // Update power-up timers
        if (this.multiShot) {
            this.multiShotTimer--;
            if (this.multiShotTimer <= 0) {
                this.multiShot = false;
            }
        }

        if (this.strongLaser) {
            this.strongLaserTimer--;
            if (this.strongLaserTimer <= 0) {
                this.strongLaser = false;
            }
        }
    }

    shoot() {
        const damage = this.strongLaser ? 3 : 1;

        if (this.multiShot) {
            // Fire three bullets
            this.bullets.push(new Bullet(this.x - 15, this.y - this.height / 2, true, damage));
            this.bullets.push(new Bullet(this.x, this.y - this.height / 2, true, damage));
            this.bullets.push(new Bullet(this.x + 15, this.y - this.height / 2, true, damage));
        } else {
            // Single bullet
            this.bullets.push(new Bullet(this.x, this.y - this.height / 2, true, damage));
        }
    }

    applyPowerUp(type) {
        if (type === POWERUP_TYPES.MULTISHOT) {
            this.multiShot = true;
            this.multiShotTimer = this.powerUpDuration;
        } else if (type === POWERUP_TYPES.STRONG_LASER) {
            this.strongLaser = true;
            this.strongLaserTimer = this.powerUpDuration;
        }
    }

    draw(ctx) {
        if (!this.alive) return;

        // Draw bullets
        this.bullets.forEach(bullet => bullet.draw(ctx));

        // Draw ship body (triangle)
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.height / 2);
        ctx.lineTo(this.x - this.width / 2, this.y + this.height / 2);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2);
        ctx.closePath();

        // Ship color with power-up effects
        let shipColor = '#4488ff';
        if (this.multiShot && this.strongLaser) {
            shipColor = '#ffffff';
        } else if (this.multiShot) {
            shipColor = '#00ffff';
        } else if (this.strongLaser) {
            shipColor = '#ff00ff';
        }

        ctx.fillStyle = shipColor;
        ctx.fill();

        // Draw cockpit
        ctx.beginPath();
        ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#88ccff';
        ctx.fill();

        // Draw engine glow
        ctx.beginPath();
        ctx.moveTo(this.x - 10, this.y + this.height / 2);
        ctx.lineTo(this.x, this.y + this.height / 2 + 15);
        ctx.lineTo(this.x + 10, this.y + this.height / 2);
        ctx.closePath();
        ctx.fillStyle = '#ff6600';
        ctx.fill();
    }

    // Get bounding box for collision detection
    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    resize(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.y = canvasHeight - 60;
        this.x = clamp(this.x, this.width / 2, canvasWidth - this.width / 2);
    }
}
