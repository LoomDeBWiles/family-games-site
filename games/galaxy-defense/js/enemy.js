// Enemy/Alien class

class Enemy {
    constructor(x, y, health = 1, speed = 2) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 35;
        this.health = health;
        this.maxHealth = health;
        this.speed = speed;
        this.active = true;

        // Shooting
        this.shootChance = 0.001; // Chance to shoot each frame
        this.bullets = [];

        // Animation
        this.wobblePhase = Math.random() * Math.PI * 2;
        this.wobbleSpeed = 0.05;
        this.wobbleAmount = 1;

        // Color based on health
        this.updateColor();
    }

    updateColor() {
        if (this.maxHealth >= 3) {
            this.color = '#ff0066'; // Strong enemy - pink
            this.eyeColor = '#ff66aa';
        } else if (this.maxHealth >= 2) {
            this.color = '#ff6600'; // Medium enemy - orange
            this.eyeColor = '#ffaa44';
        } else {
            this.color = '#00ff66'; // Weak enemy - green
            this.eyeColor = '#66ffaa';
        }
    }

    update(canvasHeight) {
        // Move down
        this.y += this.speed;

        // Random shooting
        if (Math.random() < this.shootChance) {
            this.shoot();
        }

        // Update bullets
        this.bullets.forEach(bullet => bullet.update());
        this.bullets = this.bullets.filter(bullet => bullet.active);

        // Check if passed bottom of screen
        if (this.y > canvasHeight + this.height) {
            this.active = false;
            return true; // Indicates enemy escaped
        }

        return false;
    }

    shoot() {
        this.bullets.push(new Bullet(this.x, this.y + this.height / 2, false));
    }

    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.active = false;
            return true; // Enemy died
        }
        return false;
    }

    draw(ctx) {
        // Draw bullets first
        this.bullets.forEach(bullet => bullet.draw(ctx));

        if (!this.active) return;

        // Draw alien body (rounded rectangle)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        const radius = 8;
        const x = this.x - this.width / 2;
        const y = this.y - this.height / 2;

        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + this.width - radius, y);
        ctx.quadraticCurveTo(x + this.width, y, x + this.width, y + radius);
        ctx.lineTo(x + this.width, y + this.height - radius);
        ctx.quadraticCurveTo(x + this.width, y + this.height, x + this.width - radius, y + this.height);
        ctx.lineTo(x + radius, y + this.height);
        ctx.quadraticCurveTo(x, y + this.height, x, y + this.height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();

        // Draw eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(this.x - 10, this.y - 3, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(this.x + 10, this.y - 3, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw eye pupils (looking down at player)
        ctx.fillStyle = this.eyeColor;
        ctx.beginPath();
        ctx.arc(this.x - 10, this.y + 1, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 1, 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw health bar if damaged
        if (this.health < this.maxHealth) {
            const barWidth = this.width;
            const barHeight = 4;
            const healthPercent = this.health / this.maxHealth;

            ctx.fillStyle = '#333';
            ctx.fillRect(this.x - barWidth / 2, this.y - this.height / 2 - 8, barWidth, barHeight);

            ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
            ctx.fillRect(this.x - barWidth / 2, this.y - this.height / 2 - 8, barWidth * healthPercent, barHeight);
        }
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
}
