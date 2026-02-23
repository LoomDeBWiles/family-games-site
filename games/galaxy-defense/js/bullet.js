// Bullet class for player and enemy projectiles

class Bullet {
    constructor(x, y, isPlayerBullet = true, damage = 1) {
        this.x = x;
        this.y = y;
        this.width = isPlayerBullet ? 4 : 6;
        this.height = isPlayerBullet ? 15 : 12;
        this.speed = isPlayerBullet ? 12 : 4;
        this.isPlayerBullet = isPlayerBullet;
        this.damage = damage;
        this.active = true;

        // Visual properties
        this.color = isPlayerBullet ? '#00ff00' : '#ff0000';
        this.glowColor = isPlayerBullet ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
    }

    update() {
        if (this.isPlayerBullet) {
            this.y -= this.speed;
        } else {
            this.y += this.speed;
        }

        // Deactivate if off screen
        if (this.y < -this.height || this.y > window.innerHeight + this.height) {
            this.active = false;
        }
    }

    draw(ctx) {
        // Draw glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.glowColor;

        // Draw bullet
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

        // Reset shadow
        ctx.shadowBlur = 0;
    }
}
