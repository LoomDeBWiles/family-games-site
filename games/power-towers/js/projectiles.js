// Projectile class with realistic visuals

class Projectile {
    constructor(x, y, target, damage, speed, color, effects = {}) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;
        this.speed = speed;
        this.color = color;
        this.radius = 5;

        // Projectile type for visual rendering
        this.projectileType = effects.projectileType || 'bullet';

        // Effects
        this.splashRadius = effects.splashRadius || 0;
        this.slowAmount = effects.slowAmount || 0;
        this.slowDuration = effects.slowDuration || 0;
        this.poisonDamage = effects.poisonDamage || 0;
        this.poisonDuration = effects.poisonDuration || 0;
        this.burnDamage = effects.burnDamage || 0;
        this.burnDuration = effects.burnDuration || 0;
        this.isArcing = effects.isArcing || false;
        this.isHoming = effects.isHoming || false;
        this.bounceCount = effects.bounceCount || 0;
        this.bounceRange = effects.bounceRange || 0;
        this.bouncesRemaining = this.bounceCount;
        this.hitEnemies = [];

        // State
        this.isExpired = false;
        this.tower = null; // Reference to firing tower for kill tracking

        // Visual effects
        this.trail = [];
        this.maxTrailLength = 8;
        this.rotation = 0;
        this.particleTimer = 0;

        // Arcing projectile height (for mortars)
        this.arcHeight = 0;
        this.arcProgress = 0;
        this.startX = x;
        this.startY = y;

        // Calculate initial direction
        this.updateDirection();
        this.angle = Math.atan2(this.velY, this.velX);
    }

    updateDirection() {
        if (!this.target || this.target.isDead) {
            this.isExpired = true;
            return;
        }

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            this.velX = (dx / dist) * this.speed;
            this.velY = (dy / dist) * this.speed;
            this.angle = Math.atan2(this.velY, this.velX);
        }
    }

    update(deltaTime, enemies) {
        if (this.isExpired) return;

        // Store trail position
        this.trail.unshift({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.pop();
        }

        // Update direction to track target
        this.updateDirection();

        if (this.isExpired) return;

        // Move
        this.x += this.velX * (deltaTime / 1000);
        this.y += this.velY * (deltaTime / 1000);

        // Rotate shells, mortars, and saws
        if (this.projectileType === 'shell' || this.projectileType === 'mortar') {
            this.rotation += deltaTime * 0.01;
        }
        if (this.projectileType === 'saw') {
            this.rotation += deltaTime * 0.03;
        }
        if (this.projectileType === 'nuke') {
            this.rotation += deltaTime * 0.005;
        }

        // Calculate arc height for mortar projectiles
        if (this.isArcing && this.target) {
            const totalDist = Math.sqrt(
                Math.pow(this.target.x - this.startX, 2) +
                Math.pow(this.target.y - this.startY, 2)
            );
            const currentDist = Math.sqrt(
                Math.pow(this.x - this.startX, 2) +
                Math.pow(this.y - this.startY, 2)
            );
            this.arcProgress = Math.min(1, currentDist / totalDist);
            // Parabolic arc: height peaks at midpoint
            this.arcHeight = Math.sin(this.arcProgress * Math.PI) * Math.min(100, totalDist * 0.4);
        }

        // Check if hit target
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.target.radius + this.radius) {
            this.hit(enemies);
        }

        // Check if out of bounds
        if (this.x < -50 || this.x > 1000 || this.y < -50 || this.y > 700) {
            this.isExpired = true;
        }
    }

    hit(enemies) {
        // Saw blade bouncing logic
        if (this.projectileType === 'saw' && this.bouncesRemaining > 0) {
            // Damage current target
            this.hitEnemies.push(this.target);
            const killed = this.target.takeDamage(this.damage);
            if (this.tower) {
                this.tower.totalDamageDealt += this.damage;
                if (killed) this.tower.totalKills++;
            }
            this.applyEffects(this.target);

            // Find next bounce target
            let nearestDist = this.bounceRange;
            let nearestEnemy = null;
            for (const enemy of enemies) {
                if (enemy.isDead || this.hitEnemies.includes(enemy)) continue;
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestEnemy = enemy;
                }
            }

            if (nearestEnemy) {
                this.target = nearestEnemy;
                this.bouncesRemaining--;
                this.updateDirection();
                return; // Don't expire — keep bouncing
            }
            // No target found, expire normally
        }

        this.isExpired = true;

        if (this.splashRadius > 0) {
            // Splash damage
            for (const enemy of enemies) {
                if (enemy.isDead) continue;

                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist <= this.splashRadius) {
                    // Damage falls off with distance
                    const falloff = 1 - (dist / this.splashRadius) * 0.5;
                    const actualDamage = this.damage * falloff;

                    const killed = enemy.takeDamage(actualDamage);
                    if (this.tower) {
                        this.tower.totalDamageDealt += actualDamage;
                        if (killed) this.tower.totalKills++;
                    }

                    // Apply effects
                    this.applyEffects(enemy);
                }
            }
        } else {
            // Single target damage
            const killed = this.target.takeDamage(this.damage);
            if (this.tower) {
                this.tower.totalDamageDealt += this.damage;
                if (killed) this.tower.totalKills++;
            }

            // Apply effects
            this.applyEffects(this.target);
        }
    }

    applyEffects(enemy) {
        if (this.slowAmount > 0) {
            enemy.applySlow(this.slowAmount, this.slowDuration);
        }

        if (this.poisonDamage > 0) {
            enemy.applyPoison(this.poisonDamage, this.poisonDuration);
        }

        if (this.burnDamage > 0) {
            enemy.applyPoison(this.burnDamage, this.burnDuration); // Burn uses same system as poison
        }
    }

    draw(ctx) {
        if (this.isExpired) return;

        ctx.save();

        // Draw based on projectile type
        switch (this.projectileType) {
            case 'bullet':
                this.drawBullet(ctx);
                break;
            case 'sniper':
                this.drawSniperRound(ctx);
                break;
            case 'shell':
                this.drawArtilleryShell(ctx);
                break;
            case 'frost':
                this.drawFrostProjectile(ctx);
                break;
            case 'chemical':
                this.drawChemicalSpray(ctx);
                break;
            case 'laser':
                this.drawLaserBeam(ctx);
                break;
            case 'missile':
                this.drawMissile(ctx);
                break;
            case 'mortar':
                this.drawMortar(ctx);
                break;
            case 'plasma':
                this.drawPlasma(ctx);
                break;
            case 'saw':
                this.drawSaw(ctx);
                break;
            case 'nuke':
                this.drawNukeProjectile(ctx);
                break;
            case 'acid':
                this.drawAcidProjectile(ctx);
                break;
            case 'drone':
                this.drawDroneProjectile(ctx);
                break;
            case 'meteor':
                this.drawMeteorProjectile(ctx);
                break;
            default:
                this.drawBullet(ctx);
        }

        ctx.restore();
    }

    drawBullet(ctx) {
        // Draw bullet trail
        if (this.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            for (let i = 0; i < this.trail.length; i++) {
                const alpha = 1 - (i / this.trail.length);
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            ctx.strokeStyle = 'rgba(255, 200, 100, 0.6)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Draw bullet
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Bullet casing (elongated)
        ctx.fillStyle = '#C9A227';
        ctx.beginPath();
        ctx.ellipse(0, 0, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bullet tip
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.moveTo(6, 0);
        ctx.lineTo(4, -2);
        ctx.lineTo(4, 2);
        ctx.closePath();
        ctx.fill();

        // Shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(-1, -1, 2, 1, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawSniperRound(ctx) {
        // Long tracer trail
        if (this.trail.length > 1) {
            const gradient = ctx.createLinearGradient(
                this.trail[this.trail.length - 1].x,
                this.trail[this.trail.length - 1].y,
                this.x, this.y
            );
            gradient.addColorStop(0, 'rgba(255, 100, 100, 0)');
            gradient.addColorStop(1, 'rgba(255, 100, 100, 0.8)');

            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            for (let i = 0; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Large rifle round
        ctx.fillStyle = '#2B5F2B';
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Copper jacket
        ctx.fillStyle = '#B87333';
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(6, -3);
        ctx.lineTo(6, 3);
        ctx.closePath();
        ctx.fill();

        // Hot glow
        ctx.fillStyle = 'rgba(255, 150, 50, 0.6)';
        ctx.beginPath();
        ctx.arc(-8, 0, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    drawArtilleryShell(ctx) {
        // Smoke trail
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = 0.3 * (1 - i / this.trail.length);
            const size = 8 + i * 2;
            ctx.fillStyle = `rgba(100, 100, 100, ${alpha})`;
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + this.rotation);

        // Shell body
        ctx.fillStyle = '#4A4A4A';
        ctx.beginPath();
        ctx.roundRect(-12, -6, 24, 12, 3);
        ctx.fill();

        // Shell tip (cone)
        ctx.fillStyle = '#8B0000';
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(18, 0);
        ctx.lineTo(12, -5);
        ctx.lineTo(12, 5);
        ctx.closePath();
        ctx.fill();

        // Fins
        ctx.fillStyle = '#666';
        ctx.fillRect(-12, -8, 4, 16);

        // Band
        ctx.fillStyle = '#C9A227';
        ctx.fillRect(2, -6, 3, 12);

        // Hot exhaust
        ctx.fillStyle = 'rgba(255, 150, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(-15, 0, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawFrostProjectile(ctx) {
        // Ice crystal trail
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = 0.5 * (1 - i / this.trail.length);
            const size = 4 - i * 0.3;
            ctx.fillStyle = `rgba(150, 220, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.translate(this.x, this.y);

        // Frost aura
        ctx.fillStyle = 'rgba(150, 220, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        // Ice crystal (hexagonal)
        ctx.fillStyle = '#A0E0FF';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
            const x = Math.cos(angle) * 8;
            const y = Math.sin(angle) * 8;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner crystal
        ctx.fillStyle = '#D0F0FF';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = Math.cos(angle) * 4;
            const y = Math.sin(angle) * 4;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        // Sparkles
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 6;
            ctx.beginPath();
            ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawChemicalSpray(ctx) {
        // Toxic cloud trail
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = 0.4 * (1 - i / this.trail.length);
            const size = 10 + i * 3;
            ctx.fillStyle = `rgba(100, 200, 50, ${alpha})`;
            ctx.beginPath();
            ctx.arc(
                this.trail[i].x + Math.sin(i * 2) * 3,
                this.trail[i].y + Math.cos(i * 2) * 3,
                size, 0, Math.PI * 2
            );
            ctx.fill();
        }

        ctx.translate(this.x, this.y);

        // Main toxic cloud
        ctx.fillStyle = 'rgba(100, 200, 50, 0.6)';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();

        // Bubbles
        ctx.fillStyle = 'rgba(150, 255, 100, 0.7)';
        ctx.beginPath();
        ctx.arc(-5, -3, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(4, 2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-2, 5, 4, 0, Math.PI * 2);
        ctx.fill();

        // Toxic symbol hint
        ctx.strokeStyle = 'rgba(0, 100, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawLaserBeam(ctx) {
        // Laser doesn't really use the projectile system the same way
        // But if it did, draw an energy bolt
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Outer glow
        ctx.fillStyle = 'rgba(255, 50, 50, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 15, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Core beam
        const gradient = ctx.createLinearGradient(-10, 0, 10, 0);
        gradient.addColorStop(0, '#FF0000');
        gradient.addColorStop(0.5, '#FFFFFF');
        gradient.addColorStop(1, '#FF0000');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Energy particles
        ctx.fillStyle = '#FFFF00';
        for (let i = 0; i < 3; i++) {
            const px = (Math.random() - 0.5) * 16;
            const py = (Math.random() - 0.5) * 6;
            ctx.beginPath();
            ctx.arc(px, py, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawMissile(ctx) {
        // Smoke trail
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = 0.4 * (1 - i / this.trail.length);
            const size = 6 + i * 2;
            ctx.fillStyle = `rgba(150, 150, 150, ${alpha})`;
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Missile body
        ctx.fillStyle = '#455a64';
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(5, -5);
        ctx.lineTo(-10, -5);
        ctx.lineTo(-10, 5);
        ctx.lineTo(5, 5);
        ctx.closePath();
        ctx.fill();

        // Nose cone
        ctx.fillStyle = '#f44336';
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(8, -3);
        ctx.lineTo(8, 3);
        ctx.closePath();
        ctx.fill();

        // Fins
        ctx.fillStyle = '#37474f';
        ctx.fillRect(-10, -8, 5, 3);
        ctx.fillRect(-10, 5, 5, 3);

        // Exhaust flame
        ctx.fillStyle = '#ff9800';
        ctx.beginPath();
        ctx.moveTo(-10, -3);
        ctx.lineTo(-18 - Math.random() * 5, 0);
        ctx.lineTo(-10, 3);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.moveTo(-10, -2);
        ctx.lineTo(-14 - Math.random() * 3, 0);
        ctx.lineTo(-10, 2);
        ctx.closePath();
        ctx.fill();
    }

    drawMortar(ctx) {
        // Draw shadow on ground (shows where it will land)
        if (this.isArcing) {
            ctx.fillStyle = `rgba(0, 0, 0, ${0.3 * (1 - this.arcProgress * 0.5)})`;
            ctx.beginPath();
            ctx.ellipse(this.x, this.y + this.arcHeight, 12, 6, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Smoke trail (at arc height)
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = 0.35 * (1 - i / this.trail.length);
            const size = 6 + i * 1.5;
            ctx.fillStyle = `rgba(80, 80, 80, ${alpha})`;
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y - this.arcHeight * (1 - i / this.trail.length), size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.translate(this.x, this.y - this.arcHeight);
        ctx.rotate(this.angle + this.rotation);

        // Mortar shell body (larger than artillery)
        ctx.fillStyle = '#3e2723';
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shell nose
        ctx.fillStyle = '#bf360c';
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(20, 0);
        ctx.lineTo(14, -6);
        ctx.lineTo(14, 6);
        ctx.closePath();
        ctx.fill();

        // Fins
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(-14, -10, 5, 20);

        // Marking band
        ctx.fillStyle = '#ffeb3b';
        ctx.fillRect(-2, -8, 4, 16);
    }

    drawPlasma(ctx) {
        // Energy trail
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = 0.6 * (1 - i / this.trail.length);
            const size = 8 - i * 0.5;
            ctx.fillStyle = `rgba(118, 255, 3, ${alpha})`;
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.translate(this.x, this.y);

        // Outer plasma glow
        ctx.shadowColor = '#76ff03';
        ctx.shadowBlur = 15;

        ctx.fillStyle = 'rgba(118, 255, 3, 0.4)';
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();

        // Middle layer
        ctx.fillStyle = 'rgba(178, 255, 89, 0.6)';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = '#CCFF90';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        // Energy sparks
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 4; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 12;
            ctx.beginPath();
            ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.shadowBlur = 0;
    }

    drawSaw(ctx) {
        // Metallic spark trail
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = 0.5 * (1 - i / this.trail.length);
            ctx.fillStyle = `rgba(200, 200, 220, ${alpha})`;
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y, 3 - i * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Outer blade ring
        ctx.strokeStyle = '#90a4ae';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.stroke();

        // Saw teeth
        ctx.fillStyle = '#b0bec5';
        for (let i = 0; i < 12; i++) {
            const a = (Math.PI * 2 / 12) * i;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * 8, Math.sin(a) * 8);
            ctx.lineTo(Math.cos(a + 0.15) * 13, Math.sin(a + 0.15) * 13);
            ctx.lineTo(Math.cos(a - 0.15) * 13, Math.sin(a - 0.15) * 13);
            ctx.closePath();
            ctx.fill();
        }

        // Center hub
        ctx.fillStyle = '#546e7a';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        // Center bolt
        ctx.fillStyle = '#37474f';
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();

        // Spin gleam
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(3, -3, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawNukeProjectile(ctx) {
        // Heavy smoke trail
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = 0.5 * (1 - i / this.trail.length);
            const size = 10 + i * 3;
            ctx.fillStyle = `rgba(80, 80, 80, ${alpha})`;
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y - this.arcHeight * (1 - i / this.trail.length), size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw shadow on ground
        if (this.isArcing) {
            ctx.fillStyle = `rgba(0, 0, 0, ${0.4 * (1 - this.arcProgress * 0.5)})`;
            ctx.beginPath();
            ctx.ellipse(this.x, this.y + this.arcHeight, 16, 8, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.translate(this.x, this.y - this.arcHeight);
        ctx.rotate(this.angle + this.rotation);

        // Warhead body (fat and menacing)
        ctx.fillStyle = '#424242';
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nose cone (red)
        ctx.fillStyle = '#d50000';
        ctx.beginPath();
        ctx.moveTo(18, 0);
        ctx.lineTo(26, 0);
        ctx.lineTo(18, -8);
        ctx.lineTo(18, 8);
        ctx.closePath();
        ctx.fill();

        // Tail fins
        ctx.fillStyle = '#616161';
        ctx.fillRect(-18, -14, 6, 28);

        // Warning stripe
        ctx.fillStyle = '#ffc107';
        ctx.fillRect(-4, -10, 4, 20);

        // Nuclear symbol on body
        ctx.fillStyle = '#ffc107';
        ctx.beginPath();
        ctx.arc(4, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#424242';
        ctx.beginPath();
        ctx.arc(4, 0, 2, 0, Math.PI * 2);
        ctx.fill();

        // Exhaust flame
        ctx.fillStyle = '#ff6d00';
        ctx.beginPath();
        ctx.moveTo(-18, -5);
        ctx.lineTo(-28 - Math.random() * 8, 0);
        ctx.lineTo(-18, 5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffab00';
        ctx.beginPath();
        ctx.moveTo(-18, -3);
        ctx.lineTo(-24 - Math.random() * 4, 0);
        ctx.lineTo(-18, 3);
        ctx.closePath();
        ctx.fill();
    }

    drawAcidProjectile(ctx) {
        // Acid drip trail
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = 0.5 * (1 - i / this.trail.length);
            const size = 6 + i * 1.5;
            ctx.fillStyle = `rgba(174, 234, 0, ${alpha})`;
            ctx.beginPath();
            ctx.arc(
                this.trail[i].x + Math.sin(i * 3) * 2,
                this.trail[i].y + Math.cos(i * 3) * 2,
                size, 0, Math.PI * 2
            );
            ctx.fill();
        }

        ctx.translate(this.x, this.y);

        // Acid glob outer
        ctx.fillStyle = 'rgba(174, 234, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        // Main glob
        ctx.fillStyle = '#c6ff00';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();

        // Bubbles inside
        ctx.fillStyle = 'rgba(255, 255, 100, 0.6)';
        ctx.beginPath();
        ctx.arc(-2, -2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(3, 1, 2, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(-3, -3, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawDroneProjectile(ctx) {
        // Light trail
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = 0.4 * (1 - i / this.trail.length);
            ctx.fillStyle = `rgba(38, 198, 218, ${alpha})`;
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y, 3 - i * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Drone body
        ctx.fillStyle = '#26c6da';
        ctx.beginPath();
        ctx.ellipse(0, 0, 7, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Drone wings
        ctx.fillStyle = '#00acc1';
        ctx.fillRect(-3, -7, 6, 3);
        ctx.fillRect(-3, 4, 6, 3);

        // Front sensor
        ctx.fillStyle = '#e0f7fa';
        ctx.beginPath();
        ctx.arc(5, 0, 2, 0, Math.PI * 2);
        ctx.fill();

        // Propulsion glow
        ctx.fillStyle = 'rgba(0, 172, 193, 0.6)';
        ctx.beginPath();
        ctx.arc(-7, 0, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawMeteorProjectile(ctx) {
        // Fire trail
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = 0.6 * (1 - i / this.trail.length);
            const size = 10 + i * 2;
            const r = 255;
            const g = Math.floor(100 + 50 * (i / this.trail.length));
            ctx.fillStyle = `rgba(${r}, ${g}, 0, ${alpha})`;
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Outer fire aura
        ctx.fillStyle = 'rgba(255, 100, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();

        // Rock body
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();

        // Cracks/lava glow
        ctx.strokeStyle = '#ff6d00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-5, -3);
        ctx.lineTo(2, 1);
        ctx.lineTo(6, -2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-3, 4);
        ctx.lineTo(4, 5);
        ctx.stroke();

        // Hot core
        ctx.fillStyle = '#ffab00';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        // Leading flame
        ctx.fillStyle = '#ff6d00';
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(6, -5);
        ctx.lineTo(6, 5);
        ctx.closePath();
        ctx.fill();
    }
}

// Explosion effect class for visual feedback
class Explosion {
    constructor(x, y, radius, color = '#FF6600') {
        this.x = x;
        this.y = y;
        this.maxRadius = radius;
        this.radius = 0;
        this.color = color;
        this.alpha = 1;
        this.isExpired = false;
        this.particles = [];

        // Create debris particles
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                angle: (i / 12) * Math.PI * 2,
                speed: 50 + Math.random() * 50,
                size: 3 + Math.random() * 4,
                distance: 0
            });
        }
    }

    update(deltaTime) {
        const dt = deltaTime / 1000;

        // Expand
        this.radius += dt * 200;
        if (this.radius > this.maxRadius) {
            this.radius = this.maxRadius;
        }

        // Fade
        this.alpha -= dt * 3;
        if (this.alpha <= 0) {
            this.isExpired = true;
        }

        // Update particles
        for (const p of this.particles) {
            p.distance += p.speed * dt;
        }
    }

    draw(ctx) {
        if (this.isExpired) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.globalAlpha = this.alpha;

        // Outer ring
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner glow
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        gradient.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
        gradient.addColorStop(0.5, `rgba(255, 150, 50, 0.4)`);
        gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Debris particles
        ctx.fillStyle = '#333';
        for (const p of this.particles) {
            const px = Math.cos(p.angle) * p.distance;
            const py = Math.sin(p.angle) * p.distance;
            ctx.beginPath();
            ctx.arc(px, py, p.size * this.alpha, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
