// UI rendering and effects

class UI {
    constructor(game) {
        this.game = game;

        // DOM elements
        this.healthBar = document.getElementById('health-bar');
        this.healthText = document.getElementById('health-text');
        this.timerDisplay = document.getElementById('timer');
        this.levelDisplay = document.getElementById('level-display');
        this.coinsDisplay = document.getElementById('coins-display');

        // Floating text effects
        this.floatingTexts = [];
        this.notifications = [];
    }

    update(deltaTime) {
        // Update floating texts
        this.floatingTexts = this.floatingTexts.filter(text => {
            text.lifetime -= deltaTime;
            text.y -= 30 * (deltaTime / 1000);
            text.alpha = text.lifetime / text.maxLifetime;
            return text.lifetime > 0;
        });

        // Update notifications
        this.notifications = this.notifications.filter(notif => {
            notif.lifetime -= deltaTime;
            return notif.lifetime > 0;
        });
    }

    updateHUD(player, spawner, level) {
        // Health bar
        const healthPercent = (player.health / player.maxHealth) * 100;
        this.healthBar.style.width = `${healthPercent}%`;
        this.healthText.textContent = `${Math.ceil(player.health)}/${player.maxHealth}`;

        // Health bar color
        if (healthPercent > 50) {
            this.healthBar.style.background = 'linear-gradient(to bottom, #4ade80, #22c55e)';
        } else if (healthPercent > 25) {
            this.healthBar.style.background = 'linear-gradient(to bottom, #fbbf24, #f59e0b)';
        } else {
            this.healthBar.style.background = 'linear-gradient(to bottom, #ef4444, #dc2626)';
        }

        // Timer
        const timeRemaining = spawner.getTimeRemaining();
        const minutes = Math.floor(timeRemaining / 60000);
        const seconds = Math.floor((timeRemaining % 60000) / 1000);
        this.timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Flash timer when low
        if (timeRemaining < 30000) {
            this.timerDisplay.style.color = '#ef4444';
        } else if (timeRemaining < 60000) {
            this.timerDisplay.style.color = '#fbbf24';
        } else {
            this.timerDisplay.style.color = '#fbbf24';
        }

        // Level
        this.levelDisplay.textContent = `Level ${level}`;

        // Coins
        this.coinsDisplay.textContent = `Coins: ${player.inventory.coins}`;
    }

    addDamageNumber(x, y, damage, isCrit = false, isHeal = false) {
        this.floatingTexts.push({
            x: x + (Math.random() - 0.5) * 20,
            y: y - 20,
            text: isHeal ? `+${damage}` : `-${damage}`,
            color: isHeal ? '#22c55e' : (isCrit ? '#fbbf24' : '#ef4444'),
            fontSize: isCrit ? 28 : 20,
            lifetime: 1000,
            maxLifetime: 1000,
            alpha: 1
        });
    }

    addPickupNotification(text) {
        this.notifications.push({
            text: text,
            lifetime: 2000,
            maxLifetime: 2000
        });
    }

    draw(ctx) {
        // Draw floating damage numbers
        this.floatingTexts.forEach(text => {
            ctx.save();
            ctx.globalAlpha = text.alpha;
            ctx.font = `bold ${text.fontSize}px Arial`;
            ctx.fillStyle = text.color;
            ctx.textAlign = 'center';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.strokeText(text.text, text.x, text.y);
            ctx.fillText(text.text, text.x, text.y);
            ctx.restore();
        });
    }

    drawBossHealthBar(ctx, boss) {
        if (!boss || boss.isDead) return;

        const barWidth = 400;
        const barHeight = 20;
        const x = (ctx.canvas.width - barWidth) / 2;
        const y = ctx.canvas.height - 60;

        // Boss name
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#ef4444';
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.strokeText(boss.name, ctx.canvas.width / 2, y - 10);
        ctx.fillText(boss.name, ctx.canvas.width / 2, y - 10);

        // Background
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, barWidth, barHeight);

        // Health
        const healthPercent = boss.health / boss.maxHealth;
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x, y, barWidth * healthPercent, barHeight);

        // Border
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, barWidth, barHeight);

        // Phase indicator
        if (boss.phase === 2) {
            ctx.fillStyle = '#fbbf24';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'right';
            ctx.fillText('ENRAGED', x + barWidth, y - 5);
        }
    }

    drawNotifications(ctx) {
        this.notifications.forEach((notif, index) => {
            const alpha = Math.min(1, notif.lifetime / 500);
            const y = ctx.canvas.height - 100 - index * 30;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = 'bold 16px Arial';
            ctx.fillStyle = '#fcd34d';
            ctx.textAlign = 'center';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.strokeText(notif.text, ctx.canvas.width / 2, y);
            ctx.fillText(notif.text, ctx.canvas.width / 2, y);
            ctx.restore();
        });
    }

    showOverlay(overlayId) {
        document.querySelectorAll('.overlay').forEach(overlay => {
            overlay.classList.add('hidden');
        });
        document.getElementById(overlayId).classList.remove('hidden');
    }

    hideAllOverlays() {
        document.querySelectorAll('.overlay').forEach(overlay => {
            overlay.classList.add('hidden');
        });
    }
}
