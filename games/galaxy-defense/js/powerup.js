// Power-up class

const POWERUP_TYPES = {
    MULTISHOT: 'multishot',
    STRONG_LASER: 'strong_laser'
};

class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 25;
        this.height = 25;
        this.type = type;
        this.speed = 2;
        this.active = true;
        this.pulsePhase = 0;

        // Set color based on type
        if (type === POWERUP_TYPES.MULTISHOT) {
            this.color = '#00ffff';
            this.symbol = 'M';
        } else if (type === POWERUP_TYPES.STRONG_LASER) {
            this.color = '#ff00ff';
            this.symbol = 'S';
        }
    }

    update() {
        this.y += this.speed;
        this.pulsePhase += 0.1;

        // Deactivate if off screen
        if (this.y > window.innerHeight + this.height) {
            this.active = false;
        }
    }

    draw(ctx) {
        const pulse = Math.sin(this.pulsePhase) * 0.3 + 1;
        const size = this.width * pulse;

        // Draw glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;

        // Draw power-up box
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(
            this.x - size / 2,
            this.y - size / 2,
            size,
            size
        );

        ctx.globalAlpha = 1;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(
            this.x - size / 2,
            this.y - size / 2,
            size,
            size
        );

        // Draw symbol
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.symbol, this.x, this.y);

        // Reset
        ctx.shadowBlur = 0;
    }

    static getRandomType() {
        const types = Object.values(POWERUP_TYPES);
        return types[randomInt(0, types.length - 1)];
    }
}
