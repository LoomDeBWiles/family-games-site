// Enemy classes

class Enemy {
    constructor(x, y, health, speed, damage, radius, color) {
        this.x = x;
        this.y = y;
        this.maxHealth = health;
        this.health = health;
        this.speed = speed;
        this.damage = damage;
        this.radius = radius;
        this.color = color;

        this.velX = 0;
        this.velY = 0;
        this.isDead = false;
        this.type = 'enemy';

        // Attack cooldown
        this.attackCooldown = 0;
        this.attackRate = 1000; // ms between attacks

        // Hit flash
        this.hitFlash = 0;
    }

    update(deltaTime, player, enemies) {
        if (this.isDead) return;

        // Update cooldowns
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }

        if (this.hitFlash > 0) {
            this.hitFlash -= deltaTime;
        }

        // Move towards player
        this.moveTowardsPlayer(player, deltaTime, enemies);
    }

    moveTowardsPlayer(player, deltaTime, enemies) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            this.velX = (dx / distance) * this.speed;
            this.velY = (dy / distance) * this.speed;
        }

        // Simple separation from other enemies
        for (const other of enemies) {
            if (other === this || other.isDead) continue;

            const sepDx = this.x - other.x;
            const sepDy = this.y - other.y;
            const sepDist = Math.sqrt(sepDx * sepDx + sepDy * sepDy);
            const minDist = this.radius + other.radius;

            if (sepDist < minDist && sepDist > 0) {
                const pushForce = (minDist - sepDist) / minDist;
                this.velX += (sepDx / sepDist) * pushForce * 50;
                this.velY += (sepDy / sepDist) * pushForce * 50;
            }
        }

        this.x += this.velX * (deltaTime / 1000);
        this.y += this.velY * (deltaTime / 1000);
    }

    canAttack(player) {
        if (this.attackCooldown > 0) return false;

        const distance = Collision.distance(this.x, this.y, player.x, player.y);
        return distance < this.radius + player.radius + 5;
    }

    attack(player) {
        if (this.canAttack(player)) {
            this.attackCooldown = this.attackRate;
            return this.damage;
        }
        return 0;
    }

    takeDamage(amount) {
        this.health -= amount;
        this.hitFlash = 100;

        if (this.health <= 0) {
            this.isDead = true;
            return true;
        }
        return false;
    }

    draw(ctx) {
        if (this.isDead) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Hit flash effect
        if (this.hitFlash > 0) {
            ctx.fillStyle = '#FFFFFF';
        } else {
            ctx.fillStyle = this.color;
        }

        this.drawBody(ctx);

        // Health bar
        this.drawHealthBar(ctx);

        ctx.restore();
    }

    drawBody(ctx) {
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = this.darkenColor(this.color);
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawHealthBar(ctx) {
        const barWidth = this.radius * 2;
        const barHeight = 6;
        const barY = -this.radius - 12;

        // Background
        ctx.fillStyle = '#333';
        ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);

        // Health
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.3 ? '#22c55e' : '#ef4444';
        ctx.fillRect(-barWidth / 2, barY, barWidth * healthPercent, barHeight);

        // Border
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(-barWidth / 2, barY, barWidth, barHeight);
    }

    darkenColor(color) {
        // Simple color darkening
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 40);
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 40);
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 40);
        return `rgb(${r}, ${g}, ${b})`;
    }
}

// Zombie - slow, medium health
class Zombie extends Enemy {
    constructor(x, y, level = 1) {
        const health = 50 + (level - 1) * 15;
        const speed = 35 + (level - 1) * 3;
        const damage = 5 + (level - 1) * 2;

        super(x, y, health, speed, damage, 18, '#4A7023');
        this.type = 'zombie';
        this.level = level;
    }

    drawBody(ctx) {
        // Zombie body
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2D4A12';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Zombie arms (reaching forward)
        ctx.strokeStyle = this.hitFlash > 0 ? '#FFFFFF' : this.color;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(this.radius - 5, -8);
        ctx.lineTo(this.radius + 12, -5);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.radius - 5, 8);
        ctx.lineTo(this.radius + 12, 5);
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(-5, -5, 3, 0, Math.PI * 2);
        ctx.arc(5, -5, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Skeleton - fast, low health
class Skeleton extends Enemy {
    constructor(x, y, level = 1) {
        const health = 30 + (level - 1) * 10;
        const speed = 60 + (level - 1) * 5;
        const damage = 8 + (level - 1) * 2;

        super(x, y, health, speed, damage, 15, '#E8E8E8');
        this.type = 'skeleton';
        this.level = level;
    }

    drawBody(ctx) {
        // Skeleton body (skull shape)
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#A0A0A0';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Eye sockets
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-5, -3, 4, 0, Math.PI * 2);
        ctx.arc(5, -3, 4, 0, Math.PI * 2);
        ctx.fill();

        // Nose hole
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-2, 4);
        ctx.lineTo(2, 4);
        ctx.closePath();
        ctx.fill();

        // Teeth
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-6, 6, 12, 4);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        for (let i = -4; i <= 4; i += 2) {
            ctx.beginPath();
            ctx.moveTo(i, 6);
            ctx.lineTo(i, 10);
            ctx.stroke();
        }
    }
}

// Ghost - floats, semi-transparent
class Ghost extends Enemy {
    constructor(x, y, level = 1) {
        const health = 25 + (level - 1) * 8;
        const speed = 50 + (level - 1) * 5;
        const damage = 8 + (level - 1) * 2;

        super(x, y, health, speed, damage, 16, 'rgba(200, 200, 255, 0.7)');
        this.type = 'ghost';
        this.level = level;
        this.floatOffset = Math.random() * Math.PI * 2;
    }

    update(deltaTime, player, enemies) {
        super.update(deltaTime, player, enemies);
        this.floatOffset += deltaTime * 0.005;
    }

    drawBody(ctx) {
        ctx.globalAlpha = 0.6 + Math.sin(this.floatOffset) * 0.2;

        // Ghost body
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, Math.PI, 0);
        ctx.lineTo(this.radius, this.radius);
        // Wavy bottom
        for (let i = this.radius; i >= -this.radius; i -= 6) {
            ctx.lineTo(i, this.radius + Math.sin(i * 0.5 + this.floatOffset) * 4);
        }
        ctx.closePath();
        ctx.fillStyle = this.hitFlash > 0 ? '#FFFFFF' : 'rgba(200, 200, 255, 0.8)';
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-5, -2, 4, 0, Math.PI * 2);
        ctx.arc(5, -2, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
    }
}

// Demon - strong, medium speed
class Demon extends Enemy {
    constructor(x, y, level = 1) {
        const health = 60 + (level - 1) * 20;
        const speed = 55 + (level - 1) * 5;
        const damage = 12 + (level - 1) * 3;

        super(x, y, health, speed, damage, 20, '#8B0000');
        this.type = 'demon';
        this.level = level;
    }

    drawBody(ctx) {
        // Demon body
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.hitFlash > 0 ? '#FFFFFF' : this.color;
        ctx.fill();
        ctx.strokeStyle = '#4A0000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Horns
        ctx.fillStyle = '#2F2F2F';
        ctx.beginPath();
        ctx.moveTo(-12, -this.radius + 5);
        ctx.lineTo(-15, -this.radius - 12);
        ctx.lineTo(-8, -this.radius + 2);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(12, -this.radius + 5);
        ctx.lineTo(15, -this.radius - 12);
        ctx.lineTo(8, -this.radius + 2);
        ctx.closePath();
        ctx.fill();

        // Glowing eyes
        ctx.fillStyle = '#FFFF00';
        ctx.shadowColor = '#FFFF00';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(-6, -3, 3, 0, Math.PI * 2);
        ctx.arc(6, -3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Mouth
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 5, 8, 0.2, Math.PI - 0.2);
        ctx.stroke();
    }
}

// Vampire - fast, heals on hit
class Vampire extends Enemy {
    constructor(x, y, level = 1) {
        const health = 40 + (level - 1) * 12;
        const speed = 70 + (level - 1) * 8;
        const damage = 10 + (level - 1) * 3;

        super(x, y, health, speed, damage, 17, '#4A0030');
        this.type = 'vampire';
        this.level = level;
    }

    attack(player) {
        const damage = super.attack(player);
        if (damage > 0) {
            // Heal on hit
            this.health = Math.min(this.maxHealth, this.health + 5);
        }
        return damage;
    }

    drawBody(ctx) {
        // Vampire body with cape
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.hitFlash > 0 ? '#FFFFFF' : '#1a1a2e';
        ctx.fill();
        ctx.strokeStyle = '#4A0030';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Cape
        ctx.fillStyle = '#4A0030';
        ctx.beginPath();
        ctx.moveTo(-this.radius, -5);
        ctx.lineTo(-this.radius - 8, this.radius);
        ctx.lineTo(this.radius + 8, this.radius);
        ctx.lineTo(this.radius, -5);
        ctx.closePath();
        ctx.fill();

        // Pale face
        ctx.fillStyle = '#E8E8E8';
        ctx.beginPath();
        ctx.arc(0, -2, 10, 0, Math.PI * 2);
        ctx.fill();

        // Red eyes
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(-4, -4, 2, 0, Math.PI * 2);
        ctx.arc(4, -4, 2, 0, Math.PI * 2);
        ctx.fill();

        // Fangs
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(-3, 2);
        ctx.lineTo(-2, 7);
        ctx.lineTo(-1, 2);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(1, 2);
        ctx.lineTo(2, 7);
        ctx.lineTo(3, 2);
        ctx.closePath();
        ctx.fill();
    }
}

// Boss Base Class
class Boss extends Enemy {
    constructor(x, y, health, speed, damage, radius, color, name) {
        super(x, y, health, speed, damage, radius, color);
        this.type = 'boss';
        this.name = name;
        this.phase = 1;
        this.specialCooldown = 0;
        this.specialRate = 5000; // ms between special attacks
    }

    update(deltaTime, player, enemies) {
        super.update(deltaTime, player, enemies);

        if (this.specialCooldown > 0) {
            this.specialCooldown -= deltaTime;
        }

        // Phase transitions
        if (this.health < this.maxHealth * 0.5 && this.phase === 1) {
            this.phase = 2;
            this.onPhaseChange();
        }
    }

    onPhaseChange() {
        // Override in subclasses
    }

    specialAttack(game) {
        // Override in subclasses
    }

    drawHealthBar(ctx) {
        // Boss has larger health bar drawn by UI
    }
}

// Level 1 Boss: Giant Zombie
class GiantZombie extends Boss {
    constructor(x, y, level = 1) {
        const health = 500 + (level - 1) * 200;
        super(x, y, health, 50, 25, 40, '#3D5A1F', 'Giant Zombie');
        this.level = level;
        this.spawnCooldown = 0;
    }

    update(deltaTime, player, enemies) {
        super.update(deltaTime, player, enemies);

        if (this.spawnCooldown > 0) {
            this.spawnCooldown -= deltaTime;
        }
    }

    specialAttack(game) {
        // Giant Zombie doesn't spawn minions
        return null;
    }

    drawBody(ctx) {
        // Giant zombie body
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2D4A12';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Muscular arms
        ctx.strokeStyle = this.hitFlash > 0 ? '#FFFFFF' : this.color;
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(this.radius - 10, -15);
        ctx.lineTo(this.radius + 25, -10);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.radius - 10, 15);
        ctx.lineTo(this.radius + 25, 10);
        ctx.stroke();

        // Glowing eyes
        ctx.fillStyle = '#FF0000';
        ctx.shadowColor = '#FF0000';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(-10, -8, 5, 0, Math.PI * 2);
        ctx.arc(10, -8, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Scars
        ctx.strokeStyle = '#2D4A12';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-15, 5);
        ctx.lineTo(-5, 15);
        ctx.stroke();
    }
}

// Level 2 Boss: Skeleton King
class SkeletonKing extends Boss {
    constructor(x, y, level = 1) {
        const health = 300 + (level - 1) * 100;
        super(x, y, health, 70, 30, 35, '#F5F5DC', 'Skeleton King');
        this.level = level;
        this.projectiles = [];
    }

    update(deltaTime, player, enemies) {
        super.update(deltaTime, player, enemies);

        // Update projectiles
        this.projectiles = this.projectiles.filter(p => !p.expired);
        this.projectiles.forEach(p => p.update(deltaTime));
    }

    specialAttack(game) {
        if (this.specialCooldown > 0) return null;

        this.specialCooldown = this.phase === 2 ? 3000 : 4000;

        // Throw bones at player
        const boneCount = this.phase === 2 ? 5 : 3;
        const angleToPlayer = Collision.angle(this.x, this.y, game.player.x, game.player.y);

        for (let i = 0; i < boneCount; i++) {
            const spread = (i - Math.floor(boneCount / 2)) * 0.3;
            const bone = new BoneProjectile(this.x, this.y, angleToPlayer + spread, 15 + this.level * 5);
            this.projectiles.push(bone);
        }

        // Also summon skeletons in phase 2
        if (this.phase === 2 && Math.random() < 0.5) {
            const spawned = [];
            for (let i = 0; i < 2; i++) {
                const angle = Math.random() * Math.PI * 2;
                const spawnX = this.x + Math.cos(angle) * (this.radius + 40);
                const spawnY = this.y + Math.sin(angle) * (this.radius + 40);
                spawned.push(new Skeleton(spawnX, spawnY, this.level));
            }
            return spawned;
        }

        return null;
    }

    draw(ctx) {
        super.draw(ctx);

        // Draw projectiles
        this.projectiles.forEach(p => p.draw(ctx));
    }

    drawBody(ctx) {
        // Skull
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#A0A0A0';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Crown
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(-20, -this.radius + 5);
        ctx.lineTo(-15, -this.radius - 15);
        ctx.lineTo(-10, -this.radius + 5);
        ctx.lineTo(-5, -this.radius - 10);
        ctx.lineTo(0, -this.radius + 5);
        ctx.lineTo(5, -this.radius - 10);
        ctx.lineTo(10, -this.radius + 5);
        ctx.lineTo(15, -this.radius - 15);
        ctx.lineTo(20, -this.radius + 5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Eye sockets with glow
        ctx.fillStyle = '#FF4444';
        ctx.shadowColor = '#FF0000';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(-10, -5, 6, 0, Math.PI * 2);
        ctx.arc(10, -5, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Nose
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.moveTo(0, 2);
        ctx.lineTo(-4, 10);
        ctx.lineTo(4, 10);
        ctx.closePath();
        ctx.fill();

        // Jaw
        ctx.fillStyle = '#E8E8E8';
        ctx.fillRect(-15, 12, 30, 10);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        for (let i = -12; i <= 12; i += 4) {
            ctx.beginPath();
            ctx.moveTo(i, 12);
            ctx.lineTo(i, 22);
            ctx.stroke();
        }
    }
}

// Bone Projectile for Skeleton King
class BoneProjectile {
    constructor(x, y, angle, damage) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = 120;
        this.damage = damage;
        this.radius = 8;
        this.rotation = 0;
        this.lifetime = 3000;
        this.expired = false;
    }

    update(deltaTime) {
        this.x += Math.cos(this.angle) * this.speed * (deltaTime / 1000);
        this.y += Math.sin(this.angle) * this.speed * (deltaTime / 1000);
        this.rotation += deltaTime * 0.01;
        this.lifetime -= deltaTime;

        if (this.lifetime <= 0) {
            this.expired = true;
        }
    }

    checkHit(player) {
        if (this.expired) return false;

        if (Collision.circleCircle(this.x, this.y, this.radius, player.x, player.y, player.radius)) {
            this.expired = true;
            return true;
        }
        return false;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Bone shape
        ctx.fillStyle = '#E8E8E8';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius * 1.5, this.radius * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bone ends
        ctx.beginPath();
        ctx.arc(-this.radius, 0, 4, 0, Math.PI * 2);
        ctx.arc(this.radius, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// Level 3 Boss: Necromancer
class Necromancer extends Boss {
    constructor(x, y, level = 1) {
        const health = 450 + (level - 1) * 200;
        super(x, y, health, 60, 20, 30, '#4B0082', 'Necromancer');
        this.level = level;
        this.projectiles = [];
        this.teleportCooldown = 0;
        this.resurrectCooldown = 0;
    }

    update(deltaTime, player, enemies) {
        // Necromancer stays in place
        if (this.isDead) return;

        if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;
        if (this.hitFlash > 0) this.hitFlash -= deltaTime;
        if (this.specialCooldown > 0) this.specialCooldown -= deltaTime;
        if (this.teleportCooldown > 0) this.teleportCooldown -= deltaTime;
        if (this.resurrectCooldown > 0) this.resurrectCooldown -= deltaTime;

        // Update projectiles
        this.projectiles = this.projectiles.filter(p => !p.expired);
        this.projectiles.forEach(p => p.update(deltaTime));

        // Phase check
        if (this.health < this.maxHealth * 0.5 && this.phase === 1) {
            this.phase = 2;
            this.onPhaseChange();
        }
    }

    onPhaseChange() {
        // No teleport, just phase change
    }

    teleport() {
        if (this.teleportCooldown > 0) return;

        this.teleportCooldown = 8000;
        // Random position on the map
        this.x = 100 + Math.random() * 824;
        this.y = 100 + Math.random() * 568;
    }

    specialAttack(game) {
        if (this.specialCooldown > 0) return null;

        this.specialCooldown = this.phase === 2 ? 2000 : 3000;

        // Fire magic projectiles
        const projectileCount = this.phase === 2 ? 8 : 5;
        const angleToPlayer = Collision.angle(this.x, this.y, game.player.x, game.player.y);

        for (let i = 0; i < projectileCount; i++) {
            const spread = (i - Math.floor(projectileCount / 2)) * 0.25;
            const magic = new MagicProjectile(this.x, this.y, angleToPlayer + spread, 12 + this.level * 4);
            this.projectiles.push(magic);
        }

        return null;
    }

    resurrectDead(deadEnemies, canvasWidth, canvasHeight) {
        if (this.resurrectCooldown > 0 || deadEnemies.length === 0) return [];

        this.resurrectCooldown = 10000;

        const count = Math.min(this.phase === 2 ? 4 : 2, deadEnemies.length);
        const resurrected = [];

        for (let i = 0; i < count; i++) {
            const x = 50 + Math.random() * (canvasWidth - 100);
            const y = 50 + Math.random() * (canvasHeight - 100);

            if (Math.random() < 0.5) {
                resurrected.push(new Zombie(x, y, this.level));
            } else {
                resurrected.push(new Skeleton(x, y, this.level));
            }
        }

        return resurrected;
    }

    draw(ctx) {
        super.draw(ctx);
        this.projectiles.forEach(p => p.draw(ctx));
    }

    drawBody(ctx) {
        // Robe
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2E0854';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Hood
        ctx.beginPath();
        ctx.arc(0, -5, this.radius * 0.7, Math.PI, 0);
        ctx.fillStyle = '#1a0033';
        ctx.fill();

        // Glowing eyes in hood
        ctx.fillStyle = '#00FF00';
        ctx.shadowColor = '#00FF00';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(-8, -8, 4, 0, Math.PI * 2);
        ctx.arc(8, -8, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Staff
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.radius + 5, -20);
        ctx.lineTo(this.radius + 5, 25);
        ctx.stroke();

        // Staff orb
        ctx.fillStyle = '#9400D3';
        ctx.shadowColor = '#9400D3';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.radius + 5, -25, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// Magic Projectile for Necromancer
class MagicProjectile {
    constructor(x, y, angle, damage) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = 180;
        this.damage = damage;
        this.radius = 10;
        this.lifetime = 4000;
        this.expired = false;
        this.pulsePhase = 0;
    }

    update(deltaTime) {
        this.x += Math.cos(this.angle) * this.speed * (deltaTime / 1000);
        this.y += Math.sin(this.angle) * this.speed * (deltaTime / 1000);
        this.pulsePhase += deltaTime * 0.01;
        this.lifetime -= deltaTime;

        if (this.lifetime <= 0) {
            this.expired = true;
        }
    }

    checkHit(player) {
        if (this.expired) return false;

        if (Collision.circleCircle(this.x, this.y, this.radius, player.x, player.y, player.radius)) {
            this.expired = true;
            return true;
        }
        return false;
    }

    draw(ctx) {
        const pulse = Math.sin(this.pulsePhase) * 0.3 + 1;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Outer glow
        ctx.fillStyle = 'rgba(148, 0, 211, 0.3)';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.5 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Inner orb
        ctx.fillStyle = '#9400D3';
        ctx.shadowColor = '#9400D3';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = '#FF00FF';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.4 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// Level 4 Boss: Demon Lord
class DemonLord extends Boss {
    constructor(x, y, level = 1) {
        const health = 400 + (level - 1) * 150;
        super(x, y, health, 45, 15, 45, '#8B0000', 'Demon Lord');
        this.level = level;
        this.projectiles = [];
    }

    update(deltaTime, player, enemies) {
        super.update(deltaTime, player, enemies);
        this.projectiles = this.projectiles.filter(p => !p.expired);
        this.projectiles.forEach(p => p.update(deltaTime));
    }

    specialAttack(game) {
        if (this.specialCooldown > 0) return null;
        this.specialCooldown = 4000;

        // Fire ring of fireballs
        const count = this.phase === 2 ? 12 : 8;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            this.projectiles.push(new FireballProjectile(this.x, this.y, angle, 10 + this.level * 3));
        }
        return null;
    }

    draw(ctx) {
        super.draw(ctx);
        this.projectiles.forEach(p => p.draw(ctx));
    }

    drawBody(ctx) {
        // Demon Lord body
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.hitFlash > 0 ? '#FFFFFF' : this.color;
        ctx.fill();
        ctx.strokeStyle = '#4A0000';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Large horns
        ctx.fillStyle = '#2F2F2F';
        ctx.beginPath();
        ctx.moveTo(-20, -this.radius + 10);
        ctx.lineTo(-28, -this.radius - 25);
        ctx.lineTo(-12, -this.radius + 5);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(20, -this.radius + 10);
        ctx.lineTo(28, -this.radius - 25);
        ctx.lineTo(12, -this.radius + 5);
        ctx.closePath();
        ctx.fill();

        // Flaming eyes
        ctx.fillStyle = '#FF4500';
        ctx.shadowColor = '#FF4500';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(-12, -8, 6, 0, Math.PI * 2);
        ctx.arc(12, -8, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Mouth with flames
        ctx.fillStyle = '#FF4500';
        ctx.beginPath();
        ctx.arc(0, 10, 12, 0, Math.PI);
        ctx.fill();
    }
}

// Fireball Projectile for Demon Lord
class FireballProjectile {
    constructor(x, y, angle, damage) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = 100;
        this.damage = damage;
        this.radius = 12;
        this.lifetime = 5000;
        this.expired = false;
        this.flickerPhase = 0;
    }

    update(deltaTime) {
        this.x += Math.cos(this.angle) * this.speed * (deltaTime / 1000);
        this.y += Math.sin(this.angle) * this.speed * (deltaTime / 1000);
        this.flickerPhase += deltaTime * 0.02;
        this.lifetime -= deltaTime;
        if (this.lifetime <= 0) this.expired = true;
    }

    checkHit(player) {
        if (this.expired) return false;
        if (Collision.circleCircle(this.x, this.y, this.radius, player.x, player.y, player.radius)) {
            this.expired = true;
            return true;
        }
        return false;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        const flicker = Math.sin(this.flickerPhase) * 0.2 + 1;

        // Outer flame
        ctx.fillStyle = 'rgba(255, 100, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.3 * flicker, 0, Math.PI * 2);
        ctx.fill();

        // Inner flame
        ctx.fillStyle = '#FF4500';
        ctx.shadowColor = '#FF4500';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * flicker, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// Level 5 Boss: Vampire King
class VampireKing extends Boss {
    constructor(x, y, level = 1) {
        const health = 350 + (level - 1) * 120;
        super(x, y, health, 70, 12, 38, '#2D0A1F', 'Vampire King');
        this.level = level;
    }

    specialAttack(game) {
        if (this.specialCooldown > 0) return null;
        this.specialCooldown = 6000;

        // Summon vampire bats (vampires)
        const count = this.phase === 2 ? 4 : 2;
        const spawned = [];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = this.radius + 40;
            spawned.push(new Vampire(this.x + Math.cos(angle) * dist, this.y + Math.sin(angle) * dist, this.level));
        }
        return spawned;
    }

    attack(player) {
        const damage = super.attack(player);
        if (damage > 0) {
            // Heal on hit
            this.health = Math.min(this.maxHealth, this.health + 15);
        }
        return damage;
    }

    drawBody(ctx) {
        // Cape
        ctx.fillStyle = '#4A0030';
        ctx.beginPath();
        ctx.moveTo(-this.radius - 5, -10);
        ctx.lineTo(-this.radius - 15, this.radius + 10);
        ctx.lineTo(this.radius + 15, this.radius + 10);
        ctx.lineTo(this.radius + 5, -10);
        ctx.closePath();
        ctx.fill();

        // Body
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.hitFlash > 0 ? '#FFFFFF' : '#1a1a2e';
        ctx.fill();
        ctx.strokeStyle = '#4A0030';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Pale face
        ctx.fillStyle = '#E8E8E8';
        ctx.beginPath();
        ctx.arc(0, -5, 18, 0, Math.PI * 2);
        ctx.fill();

        // Crown
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(-15, -25);
        ctx.lineTo(-12, -35);
        ctx.lineTo(-6, -28);
        ctx.lineTo(0, -38);
        ctx.lineTo(6, -28);
        ctx.lineTo(12, -35);
        ctx.lineTo(15, -25);
        ctx.closePath();
        ctx.fill();

        // Red eyes
        ctx.fillStyle = '#FF0000';
        ctx.shadowColor = '#FF0000';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(-7, -8, 4, 0, Math.PI * 2);
        ctx.arc(7, -8, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Large fangs
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(-5, 5);
        ctx.lineTo(-3, 15);
        ctx.lineTo(-1, 5);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(1, 5);
        ctx.lineTo(3, 15);
        ctx.lineTo(5, 5);
        ctx.closePath();
        ctx.fill();
    }
}

// Wraith - teleports, hard to catch
class Wraith extends Enemy {
    constructor(x, y, level = 1) {
        const health = 35 + (level - 1) * 10;
        const speed = 80 + (level - 1) * 5;
        const damage = 12 + (level - 1) * 3;

        super(x, y, health, speed, damage, 18, '#1a0033');
        this.type = 'wraith';
        this.level = level;
        this.teleportCooldown = 0;
        this.phaseOffset = Math.random() * Math.PI * 2;
    }

    update(deltaTime, player, enemies) {
        super.update(deltaTime, player, enemies);
        this.phaseOffset += deltaTime * 0.005;

        if (this.teleportCooldown > 0) {
            this.teleportCooldown -= deltaTime;
        } else if (Math.random() < 0.01) {
            // Random teleport near player
            const angle = Math.random() * Math.PI * 2;
            const dist = 100 + Math.random() * 100;
            this.x = player.x + Math.cos(angle) * dist;
            this.y = player.y + Math.sin(angle) * dist;
            this.teleportCooldown = 3000;
        }
    }

    drawBody(ctx) {
        ctx.globalAlpha = 0.5 + Math.sin(this.phaseOffset) * 0.3;

        // Dark ethereal body
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.hitFlash > 0 ? '#FFFFFF' : '#1a0033';
        ctx.fill();

        // Inner glow
        ctx.fillStyle = '#9400D3';
        ctx.shadowColor = '#9400D3';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Eyes
        ctx.fillStyle = '#FF00FF';
        ctx.beginPath();
        ctx.arc(-5, -3, 3, 0, Math.PI * 2);
        ctx.arc(5, -3, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
    }
}

// Golem - very slow but tanky
class Golem extends Enemy {
    constructor(x, y, level = 1) {
        const health = 120 + (level - 1) * 40;
        const speed = 25 + (level - 1) * 2;
        const damage = 20 + (level - 1) * 5;

        super(x, y, health, speed, damage, 25, '#696969');
        this.type = 'golem';
        this.level = level;
    }

    drawBody(ctx) {
        // Rocky body
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.hitFlash > 0 ? '#FFFFFF' : this.color;
        ctx.fill();
        ctx.strokeStyle = '#4a4a4a';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Cracks
        ctx.strokeStyle = '#3a3a3a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-10, -15);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-12, 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(8, -12);
        ctx.lineTo(12, 5);
        ctx.stroke();

        // Glowing core
        ctx.fillStyle = '#FF6600';
        ctx.shadowColor = '#FF6600';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// Banshee - screams damage nearby
class Banshee extends Enemy {
    constructor(x, y, level = 1) {
        const health = 30 + (level - 1) * 8;
        const speed = 65 + (level - 1) * 5;
        const damage = 6 + (level - 1) * 2;

        super(x, y, health, speed, damage, 16, '#E6E6FA');
        this.type = 'banshee';
        this.level = level;
        this.screamCooldown = 0;
        this.isScreaming = false;
        this.screamRadius = 80;
    }

    update(deltaTime, player, enemies) {
        super.update(deltaTime, player, enemies);

        if (this.screamCooldown > 0) {
            this.screamCooldown -= deltaTime;
        }

        this.isScreaming = this.screamCooldown > 1500;
    }

    canAttack(player) {
        // Banshee attacks with scream at range
        if (this.screamCooldown > 0) return false;
        const distance = Collision.distance(this.x, this.y, player.x, player.y);
        return distance < this.screamRadius;
    }

    attack(player) {
        if (this.canAttack(player)) {
            this.screamCooldown = 2000;
            return this.damage;
        }
        return 0;
    }

    drawBody(ctx) {
        // Ghostly form
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, Math.PI, 0);
        ctx.lineTo(this.radius, this.radius);
        for (let i = this.radius; i >= -this.radius; i -= 5) {
            ctx.lineTo(i, this.radius + Math.sin(i * 0.3) * 5);
        }
        ctx.closePath();
        ctx.fillStyle = this.hitFlash > 0 ? '#FFFFFF' : this.color;
        ctx.fill();

        // Screaming effect
        if (this.isScreaming) {
            ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.screamRadius * 0.5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, this.screamRadius * 0.8, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Face
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-4, -4, 3, 0, Math.PI * 2);
        ctx.arc(4, -4, 3, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        ctx.beginPath();
        ctx.arc(0, 4, this.isScreaming ? 6 : 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
    }
}

// Reaper - slow but deadly
class Reaper extends Enemy {
    constructor(x, y, level = 1) {
        const health = 50 + (level - 1) * 15;
        const speed = 40 + (level - 1) * 3;
        const damage = 25 + (level - 1) * 5;

        super(x, y, health, speed, damage, 20, '#0a0a0a');
        this.type = 'reaper';
        this.level = level;
        this.floatOffset = Math.random() * Math.PI * 2;
    }

    update(deltaTime, player, enemies) {
        super.update(deltaTime, player, enemies);
        this.floatOffset += deltaTime * 0.003;
    }

    drawBody(ctx) {
        const float = Math.sin(this.floatOffset) * 3;
        ctx.translate(0, float);

        // Cloak
        ctx.fillStyle = this.hitFlash > 0 ? '#FFFFFF' : '#0a0a0a';
        ctx.beginPath();
        ctx.arc(0, -5, this.radius * 0.8, Math.PI, 0);
        ctx.lineTo(this.radius, this.radius);
        ctx.lineTo(-this.radius, this.radius);
        ctx.closePath();
        ctx.fill();

        // Hood
        ctx.beginPath();
        ctx.arc(0, -8, 12, Math.PI * 0.2, Math.PI * 0.8);
        ctx.fill();

        // Glowing eyes
        ctx.fillStyle = '#FF0000';
        ctx.shadowColor = '#FF0000';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(-4, -8, 2, 0, Math.PI * 2);
        ctx.arc(4, -8, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Scythe
        ctx.strokeStyle = '#4a4a4a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.radius - 5, -15);
        ctx.lineTo(this.radius + 15, 10);
        ctx.stroke();

        ctx.strokeStyle = '#c0c0c0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.radius + 10, -10, 15, Math.PI * 0.5, Math.PI);
        ctx.stroke();
    }
}

// Elemental - random element each spawn
class Elemental extends Enemy {
    constructor(x, y, level = 1) {
        const health = 45 + (level - 1) * 12;
        const speed = 55 + (level - 1) * 4;
        const damage = 14 + (level - 1) * 3;

        const elements = ['fire', 'ice', 'lightning'];
        const element = elements[Math.floor(Math.random() * elements.length)];
        const colors = { fire: '#FF4500', ice: '#00BFFF', lightning: '#FFD700' };

        super(x, y, health, speed, damage, 18, colors[element]);
        this.type = 'elemental';
        this.element = element;
        this.level = level;
        this.pulsePhase = Math.random() * Math.PI * 2;
    }

    update(deltaTime, player, enemies) {
        super.update(deltaTime, player, enemies);
        this.pulsePhase += deltaTime * 0.008;
    }

    drawBody(ctx) {
        const pulse = Math.sin(this.pulsePhase) * 0.2 + 1;

        // Outer glow
        ctx.fillStyle = this.color + '44';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.3 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = this.hitFlash > 0 ? '#FFFFFF' : this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Inner core
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// Level 6 Boss: Lich King
class LichKing extends Boss {
    constructor(x, y, level = 1) {
        const health = 500 + (level - 1) * 180;
        super(x, y, health, 40, 18, 42, '#1a1a3e', 'Lich King');
        this.level = level;
        this.projectiles = [];
    }

    update(deltaTime, player, enemies) {
        super.update(deltaTime, player, enemies);
        this.projectiles = this.projectiles.filter(p => !p.expired);
        this.projectiles.forEach(p => p.update(deltaTime));
    }

    specialAttack(game) {
        if (this.specialCooldown > 0) return null;
        this.specialCooldown = 3000;

        // Frost nova - ring of projectiles
        const count = this.phase === 2 ? 16 : 10;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            this.projectiles.push(new FrostProjectile(this.x, this.y, angle, 8 + this.level * 2));
        }

        // Summon wraiths in phase 2
        if (this.phase === 2) {
            const spawned = [];
            for (let i = 0; i < 2; i++) {
                const angle = Math.random() * Math.PI * 2;
                spawned.push(new Wraith(this.x + Math.cos(angle) * 60, this.y + Math.sin(angle) * 60, this.level));
            }
            return spawned;
        }
        return null;
    }

    draw(ctx) {
        super.draw(ctx);
        this.projectiles.forEach(p => p.draw(ctx));
    }

    drawBody(ctx) {
        // Robes
        ctx.fillStyle = this.hitFlash > 0 ? '#FFFFFF' : this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0a0a2e';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Crown
        ctx.fillStyle = '#00BFFF';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = -Math.PI / 2 + (i - 2) * 0.3;
            ctx.lineTo(Math.cos(angle) * 25, Math.sin(angle) * 25 - 15);
            ctx.lineTo(Math.cos(angle + 0.15) * 35, Math.sin(angle + 0.15) * 35 - 15);
        }
        ctx.closePath();
        ctx.fill();

        // Skull face
        ctx.fillStyle = '#E8E8E8';
        ctx.beginPath();
        ctx.arc(0, -5, 15, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#00BFFF';
        ctx.shadowColor = '#00BFFF';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(-6, -8, 4, 0, Math.PI * 2);
        ctx.arc(6, -8, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// Frost Projectile
class FrostProjectile {
    constructor(x, y, angle, damage) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = 80;
        this.damage = damage;
        this.radius = 10;
        this.lifetime = 5000;
        this.expired = false;
    }

    update(deltaTime) {
        this.x += Math.cos(this.angle) * this.speed * (deltaTime / 1000);
        this.y += Math.sin(this.angle) * this.speed * (deltaTime / 1000);
        this.lifetime -= deltaTime;
        if (this.lifetime <= 0) this.expired = true;
    }

    checkHit(player) {
        if (this.expired) return false;
        if (Collision.circleCircle(this.x, this.y, this.radius, player.x, player.y, player.radius)) {
            this.expired = true;
            return true;
        }
        return false;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = '#00BFFF';
        ctx.shadowColor = '#00BFFF';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Level 7 Boss: Golem King
class GolemKing extends Boss {
    constructor(x, y, level = 1) {
        const health = 700 + (level - 1) * 200;
        super(x, y, health, 30, 30, 55, '#5a5a5a', 'Golem King');
        this.level = level;
    }

    specialAttack(game) {
        if (this.specialCooldown > 0) return null;
        this.specialCooldown = 5000;

        // Spawn golems
        const count = this.phase === 2 ? 4 : 2;
        const spawned = [];
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            spawned.push(new Golem(this.x + Math.cos(angle) * 80, this.y + Math.sin(angle) * 80, this.level));
        }
        return spawned;
    }

    drawBody(ctx) {
        // Massive rocky body
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.hitFlash > 0 ? '#FFFFFF' : this.color;
        ctx.fill();
        ctx.strokeStyle = '#3a3a3a';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Cracks
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 3;
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 / 5) * i;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * this.radius * 0.8, Math.sin(angle) * this.radius * 0.8);
            ctx.stroke();
        }

        // Glowing core
        ctx.fillStyle = '#FF6600';
        ctx.shadowColor = '#FF6600';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(-15, -15, 6, 0, Math.PI * 2);
        ctx.arc(15, -15, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// Level 8 Boss: Banshee Queen
class BansheeQueen extends Boss {
    constructor(x, y, level = 1) {
        const health = 400 + (level - 1) * 150;
        super(x, y, health, 50, 15, 40, '#DDA0DD', 'Banshee Queen');
        this.level = level;
        this.screamPhase = 0;
    }

    update(deltaTime, player, enemies) {
        super.update(deltaTime, player, enemies);
        this.screamPhase += deltaTime * 0.005;
    }

    specialAttack(game) {
        if (this.specialCooldown > 0) return null;
        this.specialCooldown = 4000;

        // Summon banshees
        const spawned = [];
        const count = this.phase === 2 ? 4 : 2;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            spawned.push(new Banshee(this.x + Math.cos(angle) * 70, this.y + Math.sin(angle) * 70, this.level));
        }
        return spawned;
    }

    drawBody(ctx) {
        ctx.globalAlpha = 0.8;

        // Ethereal body
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, Math.PI, 0);
        for (let i = this.radius; i >= -this.radius; i -= 8) {
            ctx.lineTo(i, this.radius + Math.sin(i * 0.2 + this.screamPhase) * 10);
        }
        ctx.closePath();
        ctx.fillStyle = this.hitFlash > 0 ? '#FFFFFF' : this.color;
        ctx.fill();

        // Scream waves
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.4)';
        ctx.lineWidth = 2;
        for (let r = 40; r < 100; r += 20) {
            ctx.beginPath();
            ctx.arc(0, 0, r + Math.sin(this.screamPhase * 2) * 5, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Crown
        ctx.fillStyle = '#9400D3';
        ctx.beginPath();
        ctx.moveTo(-15, -this.radius + 10);
        ctx.lineTo(-10, -this.radius - 10);
        ctx.lineTo(0, -this.radius + 5);
        ctx.lineTo(10, -this.radius - 10);
        ctx.lineTo(15, -this.radius + 10);
        ctx.closePath();
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#FF00FF';
        ctx.shadowColor = '#FF00FF';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(-8, -10, 5, 0, Math.PI * 2);
        ctx.arc(8, -10, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.globalAlpha = 1;
    }
}

// Level 9 Boss: Death Knight
class DeathKnight extends Boss {
    constructor(x, y, level = 1) {
        const health = 600 + (level - 1) * 180;
        super(x, y, health, 55, 25, 45, '#1a1a1a', 'Death Knight');
        this.level = level;
        this.projectiles = [];
    }

    update(deltaTime, player, enemies) {
        super.update(deltaTime, player, enemies);
        this.projectiles = this.projectiles.filter(p => !p.expired);
        this.projectiles.forEach(p => p.update(deltaTime));
    }

    specialAttack(game) {
        if (this.specialCooldown > 0) return null;
        this.specialCooldown = 2500;

        // Death coil projectiles
        const count = this.phase === 2 ? 5 : 3;
        const angleToPlayer = Collision.angle(this.x, this.y, game.player.x, game.player.y);
        for (let i = 0; i < count; i++) {
            const spread = (i - Math.floor(count / 2)) * 0.2;
            this.projectiles.push(new DeathCoilProjectile(this.x, this.y, angleToPlayer + spread, 12 + this.level * 3));
        }

        // Summon reapers in phase 2
        if (this.phase === 2 && Math.random() < 0.5) {
            return [new Reaper(this.x + 50, this.y, this.level), new Reaper(this.x - 50, this.y, this.level)];
        }
        return null;
    }

    draw(ctx) {
        super.draw(ctx);
        this.projectiles.forEach(p => p.draw(ctx));
    }

    drawBody(ctx) {
        // Dark armor
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.hitFlash > 0 ? '#FFFFFF' : this.color;
        ctx.fill();
        ctx.strokeStyle = '#4a0000';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Helmet
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.arc(0, -10, 20, Math.PI, 0);
        ctx.lineTo(15, 5);
        ctx.lineTo(-15, 5);
        ctx.closePath();
        ctx.fill();

        // Glowing visor
        ctx.fillStyle = '#FF0000';
        ctx.shadowColor = '#FF0000';
        ctx.shadowBlur = 15;
        ctx.fillRect(-12, -8, 24, 6);
        ctx.shadowBlur = 0;

        // Sword
        ctx.strokeStyle = '#4a4a4a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.radius - 10, -25);
        ctx.lineTo(this.radius + 20, 15);
        ctx.stroke();

        ctx.fillStyle = '#c0c0c0';
        ctx.beginPath();
        ctx.moveTo(this.radius + 20, 15);
        ctx.lineTo(this.radius + 25, 20);
        ctx.lineTo(this.radius + 15, 20);
        ctx.closePath();
        ctx.fill();
    }
}

// Death Coil Projectile
class DeathCoilProjectile {
    constructor(x, y, angle, damage) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = 150;
        this.damage = damage;
        this.radius = 12;
        this.lifetime = 4000;
        this.expired = false;
        this.rotation = 0;
    }

    update(deltaTime) {
        this.x += Math.cos(this.angle) * this.speed * (deltaTime / 1000);
        this.y += Math.sin(this.angle) * this.speed * (deltaTime / 1000);
        this.rotation += deltaTime * 0.01;
        this.lifetime -= deltaTime;
        if (this.lifetime <= 0) this.expired = true;
    }

    checkHit(player) {
        if (this.expired) return false;
        if (Collision.circleCircle(this.x, this.y, this.radius, player.x, player.y, player.radius)) {
            this.expired = true;
            return true;
        }
        return false;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        ctx.fillStyle = '#00FF00';
        ctx.shadowColor = '#00FF00';
        ctx.shadowBlur = 15;

        // Skull shape
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-3, -2, 3, 0, Math.PI * 2);
        ctx.arc(3, -2, 3, 0, Math.PI * 2);
        ctx.arc(0, 4, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// Level 10 Boss: The Apocalypse
class Apocalypse extends Boss {
    constructor(x, y, level = 1) {
        const health = 1000 + (level - 1) * 300;
        super(x, y, health, 45, 35, 60, '#0a0a0a', 'The Apocalypse');
        this.level = level;
        this.projectiles = [];
        this.auraPhase = 0;
    }

    update(deltaTime, player, enemies) {
        super.update(deltaTime, player, enemies);
        this.auraPhase += deltaTime * 0.003;
        this.projectiles = this.projectiles.filter(p => !p.expired);
        this.projectiles.forEach(p => p.update(deltaTime));
    }

    specialAttack(game) {
        if (this.specialCooldown > 0) return null;
        this.specialCooldown = this.phase === 2 ? 2000 : 3000;

        // Doom projectiles in all directions
        const count = this.phase === 2 ? 20 : 12;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + this.auraPhase;
            this.projectiles.push(new DoomProjectile(this.x, this.y, angle, 15 + this.level * 4));
        }

        // Summon random enemies in phase 2
        if (this.phase === 2) {
            const spawned = [];
            const types = [Wraith, Golem, Banshee, Reaper, Elemental];
            for (let i = 0; i < 3; i++) {
                const Type = types[Math.floor(Math.random() * types.length)];
                const angle = Math.random() * Math.PI * 2;
                spawned.push(new Type(this.x + Math.cos(angle) * 100, this.y + Math.sin(angle) * 100, this.level));
            }
            return spawned;
        }
        return null;
    }

    draw(ctx) {
        super.draw(ctx);
        this.projectiles.forEach(p => p.draw(ctx));
    }

    drawBody(ctx) {
        // Dark aura
        ctx.fillStyle = `rgba(50, 0, 50, ${0.3 + Math.sin(this.auraPhase) * 0.2})`;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.hitFlash > 0 ? '#FFFFFF' : this.color;
        ctx.fill();

        // Pulsing rings
        for (let i = 0; i < 3; i++) {
            ctx.strokeStyle = `rgba(255, 0, 0, ${0.3 - i * 0.1})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 10 + i * 15 + Math.sin(this.auraPhase + i) * 5, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Multiple eyes
        ctx.fillStyle = '#FF0000';
        ctx.shadowColor = '#FF0000';
        ctx.shadowBlur = 20;
        const eyePositions = [[-15, -15], [15, -15], [0, -5], [-20, 5], [20, 5]];
        eyePositions.forEach(([ex, ey]) => {
            ctx.beginPath();
            ctx.arc(ex, ey, 4 + Math.sin(this.auraPhase * 2) * 1, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.shadowBlur = 0;

        // Crown of darkness
        ctx.fillStyle = '#4a0000';
        for (let i = 0; i < 7; i++) {
            const angle = -Math.PI / 2 + (i - 3) * 0.25;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * 30, Math.sin(angle) * 30 - 20);
            ctx.lineTo(Math.cos(angle) * 45, Math.sin(angle) * 45 - 20);
            ctx.lineTo(Math.cos(angle + 0.1) * 30, Math.sin(angle + 0.1) * 30 - 20);
            ctx.closePath();
            ctx.fill();
        }
    }
}

// Doom Projectile
class DoomProjectile {
    constructor(x, y, angle, damage) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = 100;
        this.damage = damage;
        this.radius = 8;
        this.lifetime = 6000;
        this.expired = false;
        this.pulse = 0;
    }

    update(deltaTime) {
        this.x += Math.cos(this.angle) * this.speed * (deltaTime / 1000);
        this.y += Math.sin(this.angle) * this.speed * (deltaTime / 1000);
        this.pulse += deltaTime * 0.01;
        this.lifetime -= deltaTime;
        if (this.lifetime <= 0) this.expired = true;
    }

    checkHit(player) {
        if (this.expired) return false;
        if (Collision.circleCircle(this.x, this.y, this.radius, player.x, player.y, player.radius)) {
            this.expired = true;
            return true;
        }
        return false;
    }

    draw(ctx) {
        const size = this.radius * (1 + Math.sin(this.pulse) * 0.2);
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.fillStyle = 'rgba(100, 0, 100, 0.5)';
        ctx.beginPath();
        ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#9400D3';
        ctx.shadowColor = '#9400D3';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FF00FF';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
