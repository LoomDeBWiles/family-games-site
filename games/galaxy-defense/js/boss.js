// Boss class - appears at the end of each level

class Boss {
    constructor(canvasWidth, level) {
        this.width = 120;
        this.height = 80;
        this.x = canvasWidth / 2;
        this.y = -this.height;
        this.targetY = 100;
        this.canvasWidth = canvasWidth;

        // Health scales with level
        this.maxHealth = 20 + (level - 1) * 15;
        this.health = this.maxHealth;

        this.speed = 2;
        this.active = true;
        this.entering = true;

        // Movement pattern
        this.moveDirection = 1;
        this.moveSpeed = 1.5 + level * 0.3;

        // Shooting
        this.shootTimer = 0;
        this.shootDelay = 60; // frames between shots
        this.bullets = [];

        // Visual
        this.color = '#ff0044';
        this.pulsePhase = 0;
    }

    update(canvasHeight) {
        // Enter from top
        if (this.entering) {
            this.y += this.speed;
            if (this.y >= this.targetY) {
                this.y = this.targetY;
                this.entering = false;
            }
            return false;
        }

        // Move side to side (only if alive)
        if (this.active) {
            this.x += this.moveDirection * this.moveSpeed;

            // Bounce off walls
            if (this.x <= this.width / 2 + 20) {
                this.x = this.width / 2 + 20;
                this.moveDirection = 1;
            } else if (this.x >= this.canvasWidth - this.width / 2 - 20) {
                this.x = this.canvasWidth - this.width / 2 - 20;
                this.moveDirection = -1;
            }
        }

        // Shooting (only if alive)
        if (this.active) {
            this.shootTimer--;
            if (this.shootTimer <= 0) {
                this.shoot();
                this.shootTimer = this.shootDelay;
            }
        }

        // Update bullets
        this.bullets.forEach(bullet => bullet.update());
        this.bullets = this.bullets.filter(bullet => bullet.active);

        // Pulse animation
        this.pulsePhase += 0.05;

        return false;
    }

    shoot() {
        // Fire spread of 3 bullets
        this.bullets.push(new Bullet(this.x - 30, this.y + this.height / 2, false));
        this.bullets.push(new Bullet(this.x, this.y + this.height / 2, false));
        this.bullets.push(new Bullet(this.x + 30, this.y + this.height / 2, false));
    }

    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.active = false;
            return true; // Boss defeated
        }
        return false;
    }

    draw(ctx) {
        // Draw bullets
        this.bullets.forEach(bullet => bullet.draw(ctx));

        if (!this.active) return;

        const pulse = Math.sin(this.pulsePhase) * 0.1 + 1;

        // Draw boss body (hexagon-like shape)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.height / 2 * pulse);
        ctx.lineTo(this.x + this.width / 2 * pulse, this.y - this.height / 4);
        ctx.lineTo(this.x + this.width / 2 * pulse, this.y + this.height / 4);
        ctx.lineTo(this.x, this.y + this.height / 2 * pulse);
        ctx.lineTo(this.x - this.width / 2 * pulse, this.y + this.height / 4);
        ctx.lineTo(this.x - this.width / 2 * pulse, this.y - this.height / 4);
        ctx.closePath();
        ctx.fill();

        // Draw menacing eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(this.x - 25, this.y - 5, 15, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(this.x + 25, this.y - 5, 15, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eye glow
        ctx.fillStyle = '#ff6666';
        ctx.beginPath();
        ctx.arc(this.x - 25, this.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 25, this.y, 8, 0, Math.PI * 2);
        ctx.fill();

        // Draw health bar
        const barWidth = this.width + 40;
        const barHeight = 10;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.height / 2 - 25;
        const healthPercent = this.health / this.maxHealth;

        // Background
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Health
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

        // Border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Boss label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BOSS', this.x, barY - 8);
    }

    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }
}
