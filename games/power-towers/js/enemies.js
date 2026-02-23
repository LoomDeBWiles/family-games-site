// Enemy types and classes - Military soldier version

const EnemyTypes = {
    BASIC: 'basic',
    FAST: 'fast',
    TANK: 'tank',
    HEALER: 'healer',
    SWARM: 'swarm',
    BOSS: 'boss',
    SPRINTER: 'sprinter',
    SHIELD: 'shield',
    STEALTH: 'stealth',
    BOMBER: 'bomber',
    JUGGERNAUT: 'juggernaut',
    // New boss types
    WARLORD: 'warlord',
    TITAN: 'titan',
    NECROMANCER: 'necromancer',
    BERSERKER: 'berserker',
    MECH: 'mech'
};

const EnemyData = {
    [EnemyTypes.BASIC]: {
        name: 'Soldier',
        health: 150,
        speed: 60,
        reward: 8,
        color: '#4a5d23',
        radius: 12
    },
    [EnemyTypes.FAST]: {
        name: 'Scout',
        health: 80,
        speed: 120,
        reward: 12,
        color: '#2F4F4F',
        radius: 10
    },
    [EnemyTypes.TANK]: {
        name: 'Heavy',
        health: 600,
        speed: 35,
        reward: 25,
        color: '#3d3d3d',
        radius: 18
    },
    [EnemyTypes.HEALER]: {
        name: 'Medic',
        health: 180,
        speed: 50,
        reward: 20,
        color: '#4a5d23',
        radius: 12
    },
    [EnemyTypes.SWARM]: {
        name: 'Infantry',
        health: 40,
        speed: 75,
        reward: 4,
        color: '#556B2F',
        radius: 8
    },
    [EnemyTypes.BOSS]: {
        name: 'Commander',
        health: 3500,
        speed: 28,
        reward: 150,
        color: '#1a1a1a',
        radius: 24
    },
    [EnemyTypes.SPRINTER]: {
        name: 'Sprinter',
        health: 50,
        speed: 180,
        reward: 15,
        color: '#8B0000',
        radius: 9
    },
    [EnemyTypes.SHIELD]: {
        name: 'Shield Bearer',
        health: 300,
        speed: 40,
        reward: 30,
        color: '#4169E1',
        radius: 14
    },
    [EnemyTypes.STEALTH]: {
        name: 'Ghost',
        health: 120,
        speed: 70,
        reward: 25,
        color: '#483D8B',
        radius: 11
    },
    [EnemyTypes.BOMBER]: {
        name: 'Bomber',
        health: 200,
        speed: 45,
        reward: 20,
        color: '#FF4500',
        radius: 13
    },
    [EnemyTypes.JUGGERNAUT]: {
        name: 'Juggernaut',
        health: 1200,
        speed: 25,
        reward: 50,
        color: '#8B4513',
        radius: 20
    },
    // New boss types
    [EnemyTypes.WARLORD]: {
        name: 'Warlord',
        health: 4500,
        speed: 30,
        reward: 200,
        color: '#8B0000',
        radius: 26
    },
    [EnemyTypes.TITAN]: {
        name: 'Titan',
        health: 8000,
        speed: 18,
        reward: 250,
        color: '#4a4a6a',
        radius: 32
    },
    [EnemyTypes.NECROMANCER]: {
        name: 'Necromancer',
        health: 3000,
        speed: 35,
        reward: 220,
        color: '#2d0a2d',
        radius: 22
    },
    [EnemyTypes.BERSERKER]: {
        name: 'Berserker',
        health: 5000,
        speed: 25,
        reward: 230,
        color: '#cc2200',
        radius: 24
    },
    [EnemyTypes.MECH]: {
        name: 'War Mech',
        health: 6000,
        speed: 22,
        reward: 300,
        color: '#3a5a7a',
        radius: 30
    }
};

class Enemy {
    constructor(type, path, waveMultiplier = 1) {
        const data = EnemyData[type];
        this.type = type;
        this.name = data.name;
        this.maxHealth = Math.floor(data.health * waveMultiplier);
        this.health = this.maxHealth;
        this.baseSpeed = data.speed;
        this.speed = this.baseSpeed;
        this.reward = Math.floor(data.reward * Math.sqrt(waveMultiplier));
        this.color = data.color;
        this.radius = data.radius;

        // Position and movement
        this.path = path;
        this.waypointIndex = 0;
        this.x = path[0].x;
        this.y = path[0].y;
        this.distanceTraveled = 0;
        this.angle = 0;

        // Animation
        this.walkCycle = 0;
        this.armSwing = 0;

        // Status effects
        this.slowAmount = 0;
        this.slowDuration = 0;
        this.poisonDamage = 0;
        this.poisonDuration = 0;

        // State
        this.isDead = false;
        this.reachedEnd = false;
        this.hitFlash = 0;
        this.deathAnimation = 0;

        // Healer specific
        if (type === EnemyTypes.HEALER) {
            this.healCooldown = 0;
            this.healRadius = 80;
            this.healAmount = 8;
            this.healEffect = 0;
        }

        // Shield Bearer specific
        if (type === EnemyTypes.SHIELD) {
            this.shieldHealth = Math.floor(200 * waveMultiplier);
            this.maxShieldHealth = this.shieldHealth;
            this.shieldAngle = 0; // Faces forward
        }

        // Stealth specific
        if (type === EnemyTypes.STEALTH) {
            this.isVisible = true;
            this.stealthCooldown = 0;
            this.stealthDuration = 0;
            this.alpha = 1;
        }

        // Bomber specific
        if (type === EnemyTypes.BOMBER) {
            this.explosionRadius = 40;
            this.explosionDamage = 0; // Visual only, doesn't hurt towers
        }

        // Juggernaut specific - immune to slow
        if (type === EnemyTypes.JUGGERNAUT) {
            this.immuneToSlow = true;
            this.regenRate = 5; // HP per second
        }

        // Sprinter specific
        if (type === EnemyTypes.SPRINTER) {
            this.dashCooldown = 0;
            this.isDashing = false;
        }

        // Warlord specific - summons minions
        if (type === EnemyTypes.WARLORD) {
            this.summonCooldown = 0;
            this.summonInterval = 8000;
            this.minionsToSummon = [];
            this.battleCry = 0;
        }

        // Titan specific - creates shockwaves, extremely tanky
        if (type === EnemyTypes.TITAN) {
            this.shockwaveCooldown = 0;
            this.shockwaveRadius = 0;
            this.isShockwaving = false;
            this.armorPlates = 4; // Damage reduction phases
        }

        // Necromancer specific - heals self, raises dead
        if (type === EnemyTypes.NECROMANCER) {
            this.darkHealCooldown = 0;
            this.resurrectCooldown = 0;
            this.soulsCollected = 0;
            this.darkAura = 0;
            this.immuneToSlow = true;
            this.minionsToSummon = [];
        }

        // Berserker specific - gets stronger as damaged
        if (type === EnemyTypes.BERSERKER) {
            this.rage = 0;
            this.maxRage = 100;
            this.rageSpeed = this.baseSpeed;
            this.isEnraged = false;
        }

        // Mech specific - has shields and phases
        if (type === EnemyTypes.MECH) {
            this.mechShield = Math.floor(3000 * waveMultiplier);
            this.maxMechShield = this.mechShield;
            this.shieldRegenCooldown = 0;
            this.phase = 1; // 1, 2, 3
            this.laserCooldown = 0;
            this.immuneToSlow = true;
        }
    }

    update(deltaTime, enemies) {
        if (this.isDead || this.reachedEnd) return;

        this.updateStatusEffects(deltaTime);

        if (this.type === EnemyTypes.HEALER) {
            this.updateHealer(deltaTime, enemies);
        }

        if (this.type === EnemyTypes.STEALTH) {
            this.updateStealth(deltaTime);
        }

        if (this.type === EnemyTypes.JUGGERNAUT) {
            // Regenerate health
            this.health = Math.min(this.maxHealth, this.health + this.regenRate * (deltaTime / 1000));
        }

        if (this.type === EnemyTypes.SPRINTER) {
            this.updateSprinter(deltaTime);
        }

        if (this.type === EnemyTypes.WARLORD) {
            this.updateWarlord(deltaTime);
        }

        if (this.type === EnemyTypes.TITAN) {
            this.updateTitan(deltaTime);
        }

        if (this.type === EnemyTypes.NECROMANCER) {
            this.updateNecromancer(deltaTime, enemies);
        }

        if (this.type === EnemyTypes.BERSERKER) {
            this.updateBerserker(deltaTime);
        }

        if (this.type === EnemyTypes.MECH) {
            this.updateMech(deltaTime);
        }

        if (this.type === EnemyTypes.SHIELD) {
            // Shield faces direction of movement
            this.shieldAngle = this.angle;
        }

        const actualSpeed = this.speed * (1 - this.slowAmount);

        // Update walk animation
        this.walkCycle += actualSpeed * deltaTime * 0.008;
        this.armSwing = Math.sin(this.walkCycle) * 0.4;

        const target = this.path[this.waypointIndex];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Update facing angle
        this.angle = Math.atan2(dy, dx);

        if (dist < actualSpeed * (deltaTime / 1000)) {
            this.x = target.x;
            this.y = target.y;
            this.waypointIndex++;

            if (this.waypointIndex >= this.path.length) {
                this.reachedEnd = true;
            }
        } else {
            const moveX = (dx / dist) * actualSpeed * (deltaTime / 1000);
            const moveY = (dy / dist) * actualSpeed * (deltaTime / 1000);
            this.x += moveX;
            this.y += moveY;
            this.distanceTraveled += Math.sqrt(moveX * moveX + moveY * moveY);
        }

        if (this.hitFlash > 0) this.hitFlash -= deltaTime;
        if (this.healEffect > 0) this.healEffect -= deltaTime;
    }

    updateStatusEffects(deltaTime) {
        if (this.slowDuration > 0) {
            this.slowDuration -= deltaTime;
            if (this.slowDuration <= 0) this.slowAmount = 0;
        }

        if (this.poisonDuration > 0) {
            this.poisonDuration -= deltaTime;
            this.takeDamage(this.poisonDamage * (deltaTime / 1000), false);
        }
    }

    updateHealer(deltaTime, enemies) {
        if (this.healCooldown > 0) {
            this.healCooldown -= deltaTime;
            return;
        }

        for (const enemy of enemies) {
            if (enemy === this || enemy.isDead) continue;

            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.healRadius && enemy.health < enemy.maxHealth) {
                enemy.health = Math.min(enemy.maxHealth, enemy.health + this.healAmount);
                enemy.healEffect = 500;
                this.healCooldown = 2000;
                break;
            }
        }
    }

    takeDamage(amount, showFlash = true) {
        // Shield bearer absorbs damage with shield first
        if (this.type === EnemyTypes.SHIELD && this.shieldHealth > 0) {
            const shieldDamage = Math.min(amount, this.shieldHealth);
            this.shieldHealth -= shieldDamage;
            amount -= shieldDamage;
            if (showFlash) this.hitFlash = 100;
            if (amount <= 0) return false;
        }

        // Mech absorbs damage with energy shield first
        if (this.type === EnemyTypes.MECH && this.mechShield > 0) {
            const shieldDamage = Math.min(amount, this.mechShield);
            this.mechShield -= shieldDamage;
            amount -= shieldDamage;
            this.shieldRegenCooldown = 3000; // Delay regen after being hit
            if (showFlash) this.hitFlash = 100;
            if (amount <= 0) return false;
        }

        // Titan has armor plates that reduce damage
        if (this.type === EnemyTypes.TITAN && this.armorPlates > 0) {
            const reduction = this.armorPlates * 0.1; // 10% per plate
            amount *= (1 - reduction);
        }

        // Berserker takes more damage but gains rage
        if (this.type === EnemyTypes.BERSERKER) {
            // Slight damage resistance when enraged
            if (this.isEnraged) {
                amount *= 0.8;
            }
        }

        this.health -= amount;
        if (showFlash) this.hitFlash = 100;

        // Titan loses armor plates at health thresholds
        if (this.type === EnemyTypes.TITAN) {
            const healthPercent = this.health / this.maxHealth;
            this.armorPlates = Math.floor(healthPercent * 4);
        }

        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
            return true;
        }
        return false;
    }

    applySlow(amount, duration) {
        // Juggernaut is immune to slow
        if (this.immuneToSlow) return;

        if (amount > this.slowAmount || duration > this.slowDuration) {
            this.slowAmount = Math.max(this.slowAmount, amount);
            this.slowDuration = Math.max(this.slowDuration, duration);
        }
    }

    updateStealth(deltaTime) {
        if (this.stealthDuration > 0) {
            this.stealthDuration -= deltaTime;
            this.alpha = 0.2;
            this.isVisible = false;
            if (this.stealthDuration <= 0) {
                this.isVisible = true;
                this.alpha = 1;
                this.stealthCooldown = 5000;
            }
        } else if (this.stealthCooldown > 0) {
            this.stealthCooldown -= deltaTime;
        } else {
            // Go stealth
            this.stealthDuration = 3000;
            this.isVisible = false;
        }
    }

    updateSprinter(deltaTime) {
        if (this.dashCooldown > 0) {
            this.dashCooldown -= deltaTime;
            this.isDashing = false;
        } else {
            // Dash burst
            this.isDashing = true;
            this.dashCooldown = 2000;
        }
    }

    updateWarlord(deltaTime) {
        if (this.battleCry > 0) this.battleCry -= deltaTime;

        if (this.summonCooldown > 0) {
            this.summonCooldown -= deltaTime;
        } else {
            // Summon minions (will be handled by game.js)
            this.minionsToSummon.push({ type: EnemyTypes.BASIC, count: 3 });
            this.summonCooldown = this.summonInterval;
            this.battleCry = 500;
        }
    }

    updateTitan(deltaTime) {
        if (this.shockwaveCooldown > 0) {
            this.shockwaveCooldown -= deltaTime;
        }

        if (this.isShockwaving) {
            this.shockwaveRadius += deltaTime * 0.3;
            if (this.shockwaveRadius > 150) {
                this.isShockwaving = false;
                this.shockwaveRadius = 0;
            }
        }

        // Ground pound every 5 seconds
        if (this.shockwaveCooldown <= 0 && !this.isShockwaving) {
            this.isShockwaving = true;
            this.shockwaveCooldown = 5000;
        }
    }

    updateNecromancer(deltaTime, enemies) {
        this.darkAura = (this.darkAura + deltaTime * 0.003) % (Math.PI * 2);

        // Heal self
        if (this.darkHealCooldown > 0) {
            this.darkHealCooldown -= deltaTime;
        } else if (this.health < this.maxHealth * 0.8) {
            this.health = Math.min(this.maxHealth, this.health + this.maxHealth * 0.1);
            this.darkHealCooldown = 6000;
            this.healEffect = 800;
        }

        // Collect souls from dead enemies nearby (handled visually)
        if (this.resurrectCooldown > 0) {
            this.resurrectCooldown -= deltaTime;
        } else if (this.soulsCollected >= 3) {
            // Resurrect (game.js will handle spawning)
            this.minionsToSummon = this.minionsToSummon || [];
            this.minionsToSummon.push({ type: EnemyTypes.SWARM, count: this.soulsCollected });
            this.soulsCollected = 0;
            this.resurrectCooldown = 10000;
        }
    }

    updateBerserker(deltaTime) {
        // Rage increases as health decreases
        const healthPercent = this.health / this.maxHealth;
        this.rage = (1 - healthPercent) * this.maxRage;

        // Speed increases with rage
        const rageBonus = 1 + (this.rage / this.maxRage) * 1.5; // Up to 2.5x speed
        this.speed = this.baseSpeed * rageBonus;

        this.isEnraged = this.rage > 50;
    }

    updateMech(deltaTime) {
        // Shield regeneration
        if (this.shieldRegenCooldown > 0) {
            this.shieldRegenCooldown -= deltaTime;
        } else if (this.mechShield < this.maxMechShield) {
            this.mechShield = Math.min(this.maxMechShield, this.mechShield + 50);
        }

        // Phase transitions based on health
        const healthPercent = this.health / this.maxHealth;
        if (healthPercent < 0.33 && this.phase < 3) {
            this.phase = 3;
            this.speed = this.baseSpeed * 1.5;
        } else if (healthPercent < 0.66 && this.phase < 2) {
            this.phase = 2;
            this.speed = this.baseSpeed * 1.25;
        }

        // Laser cooldown
        if (this.laserCooldown > 0) this.laserCooldown -= deltaTime;
    }

    applyPoison(damagePerSecond, duration) {
        this.poisonDamage = Math.max(this.poisonDamage, damagePerSecond);
        this.poisonDuration = Math.max(this.poisonDuration, duration);
    }

    draw(ctx) {
        if (this.isDead) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Draw shadow
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(3, 5, this.radius * 0.9, this.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Heal effect
        if (this.healEffect > 0) {
            ctx.strokeStyle = `rgba(0, 255, 100, ${this.healEffect / 500})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 8 + (500 - this.healEffect) / 50, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Rotate to face direction
        ctx.rotate(this.angle);

        // Draw based on type
        switch (this.type) {
            case EnemyTypes.BASIC:
                this.drawSoldier(ctx);
                break;
            case EnemyTypes.FAST:
                this.drawScout(ctx);
                break;
            case EnemyTypes.TANK:
                this.drawHeavy(ctx);
                break;
            case EnemyTypes.HEALER:
                this.drawMedic(ctx);
                break;
            case EnemyTypes.SWARM:
                this.drawInfantry(ctx);
                break;
            case EnemyTypes.BOSS:
                this.drawCommander(ctx);
                break;
            case EnemyTypes.SPRINTER:
                this.drawSprinter(ctx);
                break;
            case EnemyTypes.SHIELD:
                this.drawShieldBearer(ctx);
                break;
            case EnemyTypes.STEALTH:
                this.drawStealth(ctx);
                break;
            case EnemyTypes.BOMBER:
                this.drawBomber(ctx);
                break;
            case EnemyTypes.JUGGERNAUT:
                this.drawJuggernaut(ctx);
                break;
            case EnemyTypes.WARLORD:
                this.drawWarlord(ctx);
                break;
            case EnemyTypes.TITAN:
                this.drawTitan(ctx);
                break;
            case EnemyTypes.NECROMANCER:
                this.drawNecromancer(ctx);
                break;
            case EnemyTypes.BERSERKER:
                this.drawBerserker(ctx);
                break;
            case EnemyTypes.MECH:
                this.drawMech(ctx);
                break;
        }

        ctx.restore();

        // Draw health bar (not rotated)
        this.drawHealthBar(ctx);

        // Draw status effects
        this.drawStatusEffects(ctx);
    }

    drawSoldier(ctx) {
        const flash = this.hitFlash > 0;
        const legSwing = Math.sin(this.walkCycle) * 4;

        // Legs (animated)
        ctx.fillStyle = flash ? '#fff' : '#3d4a2a';
        ctx.save();
        ctx.translate(-8, legSwing);
        ctx.fillRect(-3, -4, 6, 10);
        ctx.restore();
        ctx.save();
        ctx.translate(-8, -legSwing);
        ctx.fillRect(-3, 4, 6, 10);
        ctx.restore();

        // Boots
        ctx.fillStyle = flash ? '#fff' : '#1a1a1a';
        ctx.fillRect(-12, legSwing - 2, 5, 6);
        ctx.fillRect(-12, -legSwing + 6, 5, 6);

        // Body/torso
        ctx.fillStyle = flash ? '#fff' : '#4a5d23';
        ctx.beginPath();
        ctx.ellipse(-2, 0, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3d4a1a';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Backpack
        ctx.fillStyle = flash ? '#fff' : '#5d6b3d';
        ctx.fillRect(-14, -5, 6, 10);

        // Arms (animated)
        ctx.fillStyle = flash ? '#fff' : '#4a5d23';
        ctx.save();
        ctx.translate(2, -6);
        ctx.rotate(this.armSwing);
        ctx.fillRect(-2, -8, 4, 10);
        ctx.restore();
        ctx.save();
        ctx.translate(2, 6);
        ctx.rotate(-this.armSwing);
        ctx.fillRect(-2, -2, 4, 10);
        ctx.restore();

        // Hands
        ctx.fillStyle = flash ? '#fff' : '#c4a67c';
        ctx.beginPath();
        ctx.arc(2, -8 - Math.sin(this.walkCycle) * 2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(2, 8 + Math.sin(this.walkCycle) * 2, 2, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = flash ? '#fff' : '#c4a67c';
        ctx.beginPath();
        ctx.arc(8, 0, 6, 0, Math.PI * 2);
        ctx.fill();

        // Helmet
        ctx.fillStyle = flash ? '#fff' : '#4a5d23';
        ctx.beginPath();
        ctx.arc(8, 0, 7, -Math.PI * 0.8, Math.PI * 0.8);
        ctx.fill();
        ctx.fillStyle = flash ? '#fff' : '#3d4a1a';
        ctx.beginPath();
        ctx.arc(8, -1, 6, -Math.PI * 0.6, Math.PI * 0.6);
        ctx.fill();

        // Rifle
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(6, -2, 16, 4);
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(2, -1.5, 8, 3);
    }

    drawScout(ctx) {
        const flash = this.hitFlash > 0;
        const legSwing = Math.sin(this.walkCycle * 1.5) * 5;

        // Fast running legs
        ctx.fillStyle = flash ? '#fff' : '#2a3a3a';
        ctx.save();
        ctx.translate(-6, legSwing);
        ctx.fillRect(-2, -3, 5, 8);
        ctx.restore();
        ctx.save();
        ctx.translate(-6, -legSwing);
        ctx.fillRect(-2, 3, 5, 8);
        ctx.restore();

        // Light boots
        ctx.fillStyle = flash ? '#fff' : '#1a1a1a';
        ctx.fillRect(-9, legSwing, 4, 5);
        ctx.fillRect(-9, -legSwing + 6, 4, 5);

        // Slim body
        ctx.fillStyle = flash ? '#fff' : '#2F4F4F';
        ctx.beginPath();
        ctx.ellipse(-1, 0, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Light vest
        ctx.fillStyle = flash ? '#fff' : '#3a4a4a';
        ctx.fillRect(-6, -4, 8, 8);

        // Arms in running position
        ctx.fillStyle = flash ? '#fff' : '#2F4F4F';
        ctx.save();
        ctx.translate(0, -5);
        ctx.rotate(-0.5 + this.armSwing);
        ctx.fillRect(-2, -6, 3, 8);
        ctx.restore();
        ctx.save();
        ctx.translate(0, 5);
        ctx.rotate(0.5 - this.armSwing);
        ctx.fillRect(-2, -2, 3, 8);
        ctx.restore();

        // Head
        ctx.fillStyle = flash ? '#fff' : '#c4a67c';
        ctx.beginPath();
        ctx.arc(7, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        // Beret
        ctx.fillStyle = flash ? '#fff' : '#2a3a3a';
        ctx.beginPath();
        ctx.ellipse(7, -2, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Goggles
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(9, -2, 4, 4);
        ctx.fillStyle = '#4a6a8a';
        ctx.fillRect(10, -1, 2, 2);

        // Compact SMG
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(5, 1, 10, 3);
    }

    drawHeavy(ctx) {
        const flash = this.hitFlash > 0;
        const legSwing = Math.sin(this.walkCycle * 0.7) * 2;

        // Heavy legs
        ctx.fillStyle = flash ? '#fff' : '#2d2d2d';
        ctx.fillRect(-12, -8 + legSwing, 8, 12);
        ctx.fillRect(-12, 4 - legSwing, 8, 12);

        // Armored boots
        ctx.fillStyle = flash ? '#fff' : '#1a1a1a';
        ctx.fillRect(-14, -4 + legSwing, 6, 8);
        ctx.fillRect(-14, 8 - legSwing, 6, 8);

        // Large armored body
        ctx.fillStyle = flash ? '#fff' : '#3d3d3d';
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Chest armor plate
        ctx.fillStyle = flash ? '#fff' : '#4a4a4a';
        ctx.beginPath();
        ctx.moveTo(-8, -10);
        ctx.lineTo(8, -8);
        ctx.lineTo(8, 8);
        ctx.lineTo(-8, 10);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#5a5a5a';
        ctx.stroke();

        // Shoulder pads
        ctx.fillStyle = flash ? '#fff' : '#4a4a4a';
        ctx.beginPath();
        ctx.ellipse(-4, -12, 8, 5, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-4, 12, 8, 5, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Heavy arms
        ctx.fillStyle = flash ? '#fff' : '#3d3d3d';
        ctx.fillRect(-2, -16, 6, 10);
        ctx.fillRect(-2, 6, 6, 10);

        // Gauntlets
        ctx.fillStyle = flash ? '#fff' : '#2a2a2a';
        ctx.fillRect(2, -15, 5, 6);
        ctx.fillRect(2, 9, 5, 6);

        // Head with heavy helmet
        ctx.fillStyle = flash ? '#fff' : '#2a2a2a';
        ctx.beginPath();
        ctx.arc(12, 0, 9, 0, Math.PI * 2);
        ctx.fill();

        // Visor
        ctx.fillStyle = '#5a8aaa';
        ctx.beginPath();
        ctx.moveTo(14, -6);
        ctx.lineTo(20, -4);
        ctx.lineTo(20, 4);
        ctx.lineTo(14, 6);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#3a3a3a';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Heavy machine gun
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(10, -5, 20, 10);
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(28, -3, 8, 6);

        // Ammo belt
        ctx.fillStyle = '#8a7a4a';
        ctx.fillRect(5, 3, 8, 3);
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = '#c9a227';
            ctx.fillRect(6 + i * 2, 4, 1.5, 1.5);
        }
    }

    drawMedic(ctx) {
        const flash = this.hitFlash > 0;
        const legSwing = Math.sin(this.walkCycle) * 3;

        // Legs
        ctx.fillStyle = flash ? '#fff' : '#3d4a2a';
        ctx.fillRect(-8, -4 + legSwing, 5, 9);
        ctx.fillRect(-8, 4 - legSwing, 5, 9);

        // Boots
        ctx.fillStyle = flash ? '#fff' : '#1a1a1a';
        ctx.fillRect(-10, legSwing, 4, 5);
        ctx.fillRect(-10, 8 - legSwing, 4, 5);

        // Body with white coat
        ctx.fillStyle = flash ? '#fff' : '#e8e8e8';
        ctx.beginPath();
        ctx.ellipse(-1, 0, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Medical cross on back
        ctx.fillStyle = '#cc0000';
        ctx.fillRect(-8, -2, 6, 4);
        ctx.fillRect(-6, -4, 2, 8);

        // Medical bag
        ctx.fillStyle = flash ? '#fff' : '#f0f0f0';
        ctx.fillRect(-14, -4, 5, 8);
        ctx.fillStyle = '#cc0000';
        ctx.fillRect(-13, -1, 3, 2);
        ctx.fillRect(-12.5, -2, 2, 4);

        // Arms
        ctx.fillStyle = flash ? '#fff' : '#e8e8e8';
        ctx.fillRect(0, -8, 4, 8);
        ctx.fillRect(0, 0, 4, 8);

        // Hands with gloves
        ctx.fillStyle = flash ? '#fff' : '#a0d0ff';
        ctx.beginPath();
        ctx.arc(3, -8, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(3, 8, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = flash ? '#fff' : '#c4a67c';
        ctx.beginPath();
        ctx.arc(8, 0, 5.5, 0, Math.PI * 2);
        ctx.fill();

        // Medic helmet with cross
        ctx.fillStyle = flash ? '#fff' : '#f0f0f0';
        ctx.beginPath();
        ctx.arc(8, 0, 6.5, -Math.PI * 0.7, Math.PI * 0.7);
        ctx.fill();
        ctx.fillStyle = '#cc0000';
        ctx.fillRect(10, -1.5, 4, 3);
        ctx.fillRect(11, -3, 2, 6);

        // Medical syringe in hand
        ctx.fillStyle = '#a0d0ff';
        ctx.fillRect(4, -10, 8, 2);
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(4, -9.5, 2, 1);

        // Heal aura
        ctx.strokeStyle = 'rgba(0, 200, 100, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.arc(0, 0, this.healRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    drawInfantry(ctx) {
        const flash = this.hitFlash > 0;
        const legSwing = Math.sin(this.walkCycle * 1.3) * 3;

        // Small legs
        ctx.fillStyle = flash ? '#fff' : '#3d4a2a';
        ctx.fillRect(-5, -3 + legSwing, 4, 6);
        ctx.fillRect(-5, 2 - legSwing, 4, 6);

        // Boots
        ctx.fillStyle = flash ? '#fff' : '#1a1a1a';
        ctx.fillRect(-6, legSwing, 3, 4);
        ctx.fillRect(-6, 5 - legSwing, 3, 4);

        // Small body
        ctx.fillStyle = flash ? '#fff' : '#556B2F';
        ctx.beginPath();
        ctx.ellipse(0, 0, 6, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Arms
        ctx.fillStyle = flash ? '#fff' : '#556B2F';
        ctx.fillRect(0, -5, 3, 5);
        ctx.fillRect(0, 0, 3, 5);

        // Head
        ctx.fillStyle = flash ? '#fff' : '#c4a67c';
        ctx.beginPath();
        ctx.arc(5, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        // Helmet
        ctx.fillStyle = flash ? '#fff' : '#4a5a3a';
        ctx.beginPath();
        ctx.arc(5, 0, 4.5, -Math.PI * 0.7, Math.PI * 0.7);
        ctx.fill();

        // Small rifle
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(4, -1, 8, 2);
    }

    drawCommander(ctx) {
        const flash = this.hitFlash > 0;
        const pulse = Math.sin(Date.now() / 200) * 0.1 + 1;
        const legSwing = Math.sin(this.walkCycle * 0.5) * 2;

        // Menacing aura
        ctx.fillStyle = 'rgba(180, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.8 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Heavy legs
        ctx.fillStyle = flash ? '#fff' : '#1a1a1a';
        ctx.fillRect(-14, -10 + legSwing, 10, 14);
        ctx.fillRect(-14, 6 - legSwing, 10, 14);

        // Armored boots
        ctx.fillStyle = flash ? '#fff' : '#0a0a0a';
        ctx.fillRect(-16, -4 + legSwing, 7, 10);
        ctx.fillRect(-16, 10 - legSwing, 7, 10);

        // Massive armored body
        ctx.fillStyle = flash ? '#fff' : '#1a1a1a';
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#8B0000';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Chest plate with insignia
        ctx.fillStyle = flash ? '#fff' : '#2a2a2a';
        ctx.beginPath();
        ctx.moveTo(-10, -14);
        ctx.lineTo(10, -12);
        ctx.lineTo(10, 12);
        ctx.lineTo(-10, 14);
        ctx.closePath();
        ctx.fill();

        // Gold eagle insignia
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(-6, 0);
        ctx.lineTo(-3, 0);
        ctx.lineTo(-3, 6);
        ctx.lineTo(3, 6);
        ctx.lineTo(3, 0);
        ctx.lineTo(6, 0);
        ctx.closePath();
        ctx.fill();

        // Cape
        ctx.fillStyle = flash ? '#fff' : '#5a0000';
        ctx.beginPath();
        ctx.moveTo(-12, -12);
        ctx.lineTo(-20, -8);
        ctx.lineTo(-22, 10);
        ctx.lineTo(-10, 12);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-12, 12);
        ctx.lineTo(-20, 8);
        ctx.lineTo(-22, -10);
        ctx.lineTo(-10, -12);
        ctx.closePath();
        ctx.fill();

        // Massive shoulder pads
        ctx.fillStyle = flash ? '#fff' : '#2a2a2a';
        ctx.beginPath();
        ctx.ellipse(-2, -16, 10, 6, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-2, 16, 10, 6, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Gold trim on shoulders
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Rank stars on shoulders
        ctx.fillStyle = '#FFD700';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(-2 + i * 4, -16, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(-2 + i * 4, 16, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Heavy arms
        ctx.fillStyle = flash ? '#fff' : '#1a1a1a';
        ctx.fillRect(0, -20, 8, 12);
        ctx.fillRect(0, 8, 8, 12);

        // Power fists
        ctx.fillStyle = flash ? '#fff' : '#2a2a2a';
        ctx.fillRect(6, -19, 6, 8);
        ctx.fillRect(6, 11, 6, 8);
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(8, -17, 3, 4);
        ctx.fillRect(8, 13, 3, 4);

        // Head with command helmet
        ctx.fillStyle = flash ? '#fff' : '#1a1a1a';
        ctx.beginPath();
        ctx.arc(14, 0, 11, 0, Math.PI * 2);
        ctx.fill();

        // Helmet crest
        ctx.fillStyle = '#8B0000';
        ctx.beginPath();
        ctx.moveTo(14, -14);
        ctx.lineTo(10, -6);
        ctx.lineTo(18, -6);
        ctx.closePath();
        ctx.fill();

        // Glowing red visor
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(18, -6);
        ctx.lineTo(26, -4);
        ctx.lineTo(26, 4);
        ctx.lineTo(18, 6);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Power sword
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(12, -24, 4, 8);
        ctx.fillStyle = '#a0a0ff';
        ctx.shadowColor = '#a0a0ff';
        ctx.shadowBlur = 8;
        ctx.fillRect(13, -35, 2, 12);
        ctx.shadowBlur = 0;

        // Plasma pistol
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(12, 14, 14, 6);
        ctx.fillStyle = '#00ff00';
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(24, 17, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    drawSprinter(ctx) {
        const flash = this.hitFlash > 0;
        const legSwing = Math.sin(this.walkCycle * 2) * 6;

        // Speed lines when dashing
        if (this.isDashing) {
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)';
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(-15 - i * 5, -3 + i * 3);
                ctx.lineTo(-25 - i * 5, -3 + i * 3);
                ctx.stroke();
            }
        }

        // Very fast running legs
        ctx.fillStyle = flash ? '#fff' : '#5a1a1a';
        ctx.save();
        ctx.translate(-5, legSwing);
        ctx.fillRect(-2, -2, 4, 7);
        ctx.restore();
        ctx.save();
        ctx.translate(-5, -legSwing);
        ctx.fillRect(-2, 2, 4, 7);
        ctx.restore();

        // Running shoes
        ctx.fillStyle = flash ? '#fff' : '#ff4444';
        ctx.fillRect(-8, legSwing + 2, 4, 3);
        ctx.fillRect(-8, -legSwing + 6, 4, 3);

        // Lean athletic body
        ctx.fillStyle = flash ? '#fff' : '#8B0000';
        ctx.beginPath();
        ctx.ellipse(0, 0, 7, 5, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Arms pumping
        ctx.fillStyle = flash ? '#fff' : '#8B0000';
        ctx.save();
        ctx.translate(0, -4);
        ctx.rotate(-0.8 + this.armSwing * 2);
        ctx.fillRect(-1, -6, 3, 7);
        ctx.restore();
        ctx.save();
        ctx.translate(0, 4);
        ctx.rotate(0.8 - this.armSwing * 2);
        ctx.fillRect(-1, -1, 3, 7);
        ctx.restore();

        // Head
        ctx.fillStyle = flash ? '#fff' : '#c4a67c';
        ctx.beginPath();
        ctx.arc(6, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        // Headband
        ctx.fillStyle = flash ? '#fff' : '#ff0000';
        ctx.fillRect(4, -3, 6, 2);

        // Determined expression
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(8, -1, 2, 1);
    }

    drawShieldBearer(ctx) {
        const flash = this.hitFlash > 0;
        const legSwing = Math.sin(this.walkCycle * 0.8) * 2;

        // Legs
        ctx.fillStyle = flash ? '#fff' : '#2a3a6a';
        ctx.fillRect(-8, -5 + legSwing, 6, 10);
        ctx.fillRect(-8, 3 - legSwing, 6, 10);

        // Heavy boots
        ctx.fillStyle = flash ? '#fff' : '#1a1a3a';
        ctx.fillRect(-10, legSwing, 5, 6);
        ctx.fillRect(-10, 8 - legSwing, 5, 6);

        // Body
        ctx.fillStyle = flash ? '#fff' : '#4169E1';
        ctx.beginPath();
        ctx.ellipse(-2, 0, 10, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Armor
        ctx.fillStyle = flash ? '#fff' : '#3a5aaa';
        ctx.fillRect(-8, -7, 10, 14);

        // Shield arm
        ctx.fillStyle = flash ? '#fff' : '#4169E1';
        ctx.fillRect(2, -10, 5, 8);
        ctx.fillRect(2, 2, 5, 8);

        // THE SHIELD (large)
        const shieldAlpha = this.shieldHealth > 0 ? 1 : 0.3;
        ctx.globalAlpha = shieldAlpha;
        ctx.fillStyle = flash ? '#fff' : '#c0c0c0';
        ctx.beginPath();
        ctx.moveTo(10, -14);
        ctx.lineTo(22, -10);
        ctx.lineTo(24, 0);
        ctx.lineTo(22, 10);
        ctx.lineTo(10, 14);
        ctx.lineTo(10, -14);
        ctx.fill();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Shield emblem
        ctx.fillStyle = '#4169E1';
        ctx.beginPath();
        ctx.arc(16, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Head
        ctx.fillStyle = flash ? '#fff' : '#c4a67c';
        ctx.beginPath();
        ctx.arc(4, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        // Helmet
        ctx.fillStyle = flash ? '#fff' : '#4a5a9a';
        ctx.beginPath();
        ctx.arc(4, 0, 6, -Math.PI * 0.7, Math.PI * 0.7);
        ctx.fill();

        // Draw shield health bar
        if (this.shieldHealth > 0) {
            ctx.fillStyle = '#4169E1';
            ctx.fillRect(10, -16, 14 * (this.shieldHealth / this.maxShieldHealth), 2);
        }
    }

    drawStealth(ctx) {
        const flash = this.hitFlash > 0;
        const legSwing = Math.sin(this.walkCycle) * 3;

        // Apply transparency when stealthed
        ctx.globalAlpha = this.alpha;

        // Ghostly legs
        ctx.fillStyle = flash ? '#fff' : '#3a3a5a';
        ctx.fillRect(-6, -3 + legSwing, 4, 8);
        ctx.fillRect(-6, 2 - legSwing, 4, 8);

        // Silent boots
        ctx.fillStyle = flash ? '#fff' : '#2a2a3a';
        ctx.fillRect(-8, legSwing + 2, 4, 4);
        ctx.fillRect(-8, 6 - legSwing, 4, 4);

        // Cloaked body
        ctx.fillStyle = flash ? '#fff' : '#483D8B';
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cloak with shimmer effect
        const shimmer = Math.sin(Date.now() / 100) * 0.2;
        ctx.fillStyle = `rgba(100, 80, 150, ${0.6 + shimmer})`;
        ctx.beginPath();
        ctx.moveTo(-10, -8);
        ctx.lineTo(-4, -6);
        ctx.lineTo(-4, 8);
        ctx.lineTo(-12, 6);
        ctx.closePath();
        ctx.fill();

        // Arms under cloak
        ctx.fillStyle = flash ? '#fff' : '#483D8B';
        ctx.fillRect(0, -6, 3, 6);
        ctx.fillRect(0, 0, 3, 6);

        // Hooded head
        ctx.fillStyle = flash ? '#fff' : '#3a3a5a';
        ctx.beginPath();
        ctx.arc(6, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        // Hood
        ctx.fillStyle = flash ? '#fff' : '#2a2a4a';
        ctx.beginPath();
        ctx.moveTo(2, -7);
        ctx.lineTo(10, -6);
        ctx.lineTo(12, 0);
        ctx.lineTo(10, 6);
        ctx.lineTo(2, 7);
        ctx.quadraticCurveTo(-2, 0, 2, -7);
        ctx.fill();

        // Glowing eyes
        if (this.isVisible) {
            ctx.fillStyle = '#ff00ff';
            ctx.shadowColor = '#ff00ff';
            ctx.shadowBlur = 5;
            ctx.beginPath();
            ctx.arc(8, -2, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(8, 2, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        ctx.globalAlpha = 1;

        // Dagger
        ctx.fillStyle = '#8a8a8a';
        ctx.fillRect(8, 4, 8, 2);
    }

    drawBomber(ctx) {
        const flash = this.hitFlash > 0;
        const legSwing = Math.sin(this.walkCycle) * 3;
        const pulse = Math.sin(Date.now() / 150) * 0.1 + 1;

        // Warning glow
        ctx.fillStyle = `rgba(255, 100, 0, ${0.2 * pulse})`;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.fillStyle = flash ? '#fff' : '#4a3a2a';
        ctx.fillRect(-7, -4 + legSwing, 5, 9);
        ctx.fillRect(-7, 3 - legSwing, 5, 9);

        // Heavy boots
        ctx.fillStyle = flash ? '#fff' : '#2a2a2a';
        ctx.fillRect(-9, legSwing + 2, 5, 5);
        ctx.fillRect(-9, 7 - legSwing, 5, 5);

        // Bomb vest body
        ctx.fillStyle = flash ? '#fff' : '#8B4513';
        ctx.beginPath();
        ctx.ellipse(-1, 0, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Explosive vest
        ctx.fillStyle = flash ? '#fff' : '#FF4500';
        ctx.fillRect(-8, -6, 12, 12);

        // Dynamite sticks
        ctx.fillStyle = '#cc0000';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(-6 + i * 3, -5, 2, 10);
        }

        // Wires
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-5, 0);
        ctx.lineTo(3, -3);
        ctx.lineTo(3, 3);
        ctx.lineTo(-5, 0);
        ctx.stroke();

        // Arms
        ctx.fillStyle = flash ? '#fff' : '#8B4513';
        ctx.fillRect(1, -8, 4, 7);
        ctx.fillRect(1, 1, 4, 7);

        // Detonator in hand
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(4, -9, 4, 3);
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(6, -10, 2, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = flash ? '#fff' : '#c4a67c';
        ctx.beginPath();
        ctx.arc(7, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        // Crazed expression
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(9, -1, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(9, 2, 1, 0, Math.PI * 2);
        ctx.fill();

        // Maniacal grin
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(8, 1, 3, 0, Math.PI);
        ctx.stroke();
    }

    drawJuggernaut(ctx) {
        const flash = this.hitFlash > 0;
        const legSwing = Math.sin(this.walkCycle * 0.5) * 2;

        // Ground shake effect
        ctx.fillStyle = 'rgba(100, 70, 40, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 8, 25, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Massive legs
        ctx.fillStyle = flash ? '#fff' : '#5a3a2a';
        ctx.fillRect(-14, -10 + legSwing, 12, 16);
        ctx.fillRect(-14, 6 - legSwing, 12, 16);

        // Armored leg plates
        ctx.fillStyle = flash ? '#fff' : '#8B4513';
        ctx.fillRect(-16, -6 + legSwing, 8, 12);
        ctx.fillRect(-16, 10 - legSwing, 8, 12);

        // Massive boots
        ctx.fillStyle = flash ? '#fff' : '#3a2a1a';
        ctx.fillRect(-18, legSwing + 2, 10, 8);
        ctx.fillRect(-18, 14 - legSwing, 10, 8);

        // Huge body
        ctx.fillStyle = flash ? '#fff' : '#8B4513';
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5a3a2a';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Chest armor with skull
        ctx.fillStyle = flash ? '#fff' : '#6a4a3a';
        ctx.beginPath();
        ctx.moveTo(-10, -12);
        ctx.lineTo(8, -10);
        ctx.lineTo(8, 10);
        ctx.lineTo(-10, 12);
        ctx.closePath();
        ctx.fill();

        // Skull emblem
        ctx.fillStyle = '#d0d0d0';
        ctx.beginPath();
        ctx.arc(0, -2, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(-2, -3, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(2, -3, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-3, 1, 6, 2);

        // Massive shoulder pads
        ctx.fillStyle = flash ? '#fff' : '#7a5a4a';
        ctx.beginPath();
        ctx.ellipse(-4, -15, 12, 6, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-4, 15, 12, 6, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Spikes on shoulders
        ctx.fillStyle = '#4a4a4a';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(-8 + i * 4, -18);
            ctx.lineTo(-6 + i * 4, -24);
            ctx.lineTo(-4 + i * 4, -18);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(-8 + i * 4, 18);
            ctx.lineTo(-6 + i * 4, 24);
            ctx.lineTo(-4 + i * 4, 18);
            ctx.fill();
        }

        // Huge arms
        ctx.fillStyle = flash ? '#fff' : '#8B4513';
        ctx.fillRect(0, -18, 10, 14);
        ctx.fillRect(0, 4, 10, 14);

        // Armored fists
        ctx.fillStyle = flash ? '#fff' : '#5a3a2a';
        ctx.fillRect(8, -16, 8, 10);
        ctx.fillRect(8, 6, 8, 10);

        // Knuckle spikes
        ctx.fillStyle = '#4a4a4a';
        for (let i = 0; i < 2; i++) {
            ctx.fillRect(14, -14 + i * 4, 4, 2);
            ctx.fillRect(14, 8 + i * 4, 4, 2);
        }

        // Head with war helmet
        ctx.fillStyle = flash ? '#fff' : '#5a3a2a';
        ctx.beginPath();
        ctx.arc(14, 0, 10, 0, Math.PI * 2);
        ctx.fill();

        // Face guard
        ctx.fillStyle = flash ? '#fff' : '#3a2a1a';
        ctx.beginPath();
        ctx.moveTo(16, -8);
        ctx.lineTo(24, -6);
        ctx.lineTo(26, 0);
        ctx.lineTo(24, 6);
        ctx.lineTo(16, 8);
        ctx.lineTo(16, -8);
        ctx.fill();

        // Eye slits (glowing)
        ctx.fillStyle = '#ff6600';
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 8;
        ctx.fillRect(18, -4, 6, 2);
        ctx.fillRect(18, 2, 6, 2);
        ctx.shadowBlur = 0;

        // Regen indicator
        ctx.fillStyle = 'rgba(0, 255, 100, 0.5)';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.8, 0, Math.PI * 2 * (this.health / this.maxHealth));
        ctx.stroke();
    }

    drawWarlord(ctx) {
        const flash = this.hitFlash > 0;
        const pulse = Math.sin(Date.now() / 300) * 0.1 + 1;
        const legSwing = Math.sin(this.walkCycle * 0.5) * 2;

        // War aura
        ctx.fillStyle = 'rgba(139, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 2 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Battle cry effect
        if (this.battleCry > 0) {
            ctx.strokeStyle = `rgba(255, 200, 0, ${this.battleCry / 500})`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 2.5, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Legs with war boots
        ctx.fillStyle = flash ? '#fff' : '#4a1a1a';
        ctx.fillRect(-14, -10 + legSwing, 10, 14);
        ctx.fillRect(-14, 6 - legSwing, 10, 14);

        // Spiked boots
        ctx.fillStyle = flash ? '#fff' : '#2a0a0a';
        ctx.fillRect(-16, -4 + legSwing, 7, 10);
        ctx.fillRect(-16, 10 - legSwing, 7, 10);
        // Spikes
        ctx.fillStyle = '#808080';
        ctx.beginPath();
        ctx.moveTo(-18, legSwing); ctx.lineTo(-22, legSwing + 3); ctx.lineTo(-18, legSwing + 6);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-18, 12 - legSwing); ctx.lineTo(-22, 15 - legSwing); ctx.lineTo(-18, 18 - legSwing);
        ctx.fill();

        // Massive body with war armor
        ctx.fillStyle = flash ? '#fff' : '#8B0000';
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5a0000';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Chest plate with skull
        ctx.fillStyle = flash ? '#fff' : '#3a0a0a';
        ctx.beginPath();
        ctx.moveTo(-10, -14); ctx.lineTo(10, -12);
        ctx.lineTo(10, 12); ctx.lineTo(-10, 14);
        ctx.closePath();
        ctx.fill();

        // Skull and crossbones
        ctx.fillStyle = '#d0d0d0';
        ctx.beginPath();
        ctx.arc(0, -2, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(-2, -4, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(2, -4, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-4, 2, 8, 2);
        // Crossbones
        ctx.strokeStyle = '#d0d0d0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-8, 6); ctx.lineTo(8, 12);
        ctx.moveTo(8, 6); ctx.lineTo(-8, 12);
        ctx.stroke();

        // War cape
        ctx.fillStyle = flash ? '#fff' : '#5a0000';
        ctx.beginPath();
        ctx.moveTo(-12, -12);
        ctx.quadraticCurveTo(-25, 0, -22, 15);
        ctx.lineTo(-10, 12);
        ctx.closePath();
        ctx.fill();

        // Spiked shoulder pads
        ctx.fillStyle = flash ? '#fff' : '#4a0a0a';
        ctx.beginPath();
        ctx.ellipse(-2, -16, 12, 7, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-2, 16, 12, 7, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Shoulder spikes
        ctx.fillStyle = '#606060';
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(-6 + i * 4, -20); ctx.lineTo(-4 + i * 4, -28); ctx.lineTo(-2 + i * 4, -20);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(-6 + i * 4, 20); ctx.lineTo(-4 + i * 4, 28); ctx.lineTo(-2 + i * 4, 20);
            ctx.fill();
        }

        // Arms
        ctx.fillStyle = flash ? '#fff' : '#8B0000';
        ctx.fillRect(0, -20, 8, 12);
        ctx.fillRect(0, 8, 8, 12);

        // Gauntlets with claws
        ctx.fillStyle = flash ? '#fff' : '#3a0a0a';
        ctx.fillRect(6, -19, 6, 8);
        ctx.fillRect(6, 11, 6, 8);
        ctx.fillStyle = '#606060';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(10, -18 + i * 2, 6, 1);
            ctx.fillRect(10, 12 + i * 2, 6, 1);
        }

        // Horned helmet head
        ctx.fillStyle = flash ? '#fff' : '#2a0a0a';
        ctx.beginPath();
        ctx.arc(14, 0, 11, 0, Math.PI * 2);
        ctx.fill();

        // Horns
        ctx.fillStyle = '#505050';
        ctx.beginPath();
        ctx.moveTo(10, -10); ctx.lineTo(4, -22); ctx.lineTo(14, -12);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(10, 10); ctx.lineTo(4, 22); ctx.lineTo(14, 12);
        ctx.fill();

        // Glowing eyes
        ctx.fillStyle = '#ff4400';
        ctx.shadowColor = '#ff4400';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(18, -3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(18, 3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Great war axe
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(12, -26, 4, 12);
        ctx.fillStyle = '#606060';
        ctx.beginPath();
        ctx.moveTo(10, -30); ctx.lineTo(22, -28); ctx.lineTo(22, -22); ctx.lineTo(10, -20);
        ctx.fill();
        ctx.strokeStyle = '#8B0000';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    drawTitan(ctx) {
        const flash = this.hitFlash > 0;
        const pulse = Math.sin(Date.now() / 400) * 0.05 + 1;
        const legSwing = Math.sin(this.walkCycle * 0.3) * 1;

        // Shockwave effect
        if (this.isShockwaving && this.shockwaveRadius > 0) {
            ctx.strokeStyle = `rgba(100, 100, 200, ${1 - this.shockwaveRadius / 150})`;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(0, 0, this.shockwaveRadius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Ground shadow (bigger due to size)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.ellipse(4, 10, 35, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Massive legs (pillars)
        ctx.fillStyle = flash ? '#fff' : '#3a3a4a';
        ctx.fillRect(-20, -14 + legSwing, 14, 20);
        ctx.fillRect(-20, 8 - legSwing, 14, 20);

        // Leg armor plates
        ctx.fillStyle = flash ? '#fff' : '#5a5a7a';
        ctx.fillRect(-22, -10 + legSwing, 10, 16);
        ctx.fillRect(-22, 12 - legSwing, 10, 16);

        // Massive feet
        ctx.fillStyle = flash ? '#fff' : '#2a2a3a';
        ctx.fillRect(-24, 4 + legSwing, 12, 10);
        ctx.fillRect(-24, 20 - legSwing, 12, 10);

        // Colossal body
        ctx.fillStyle = flash ? '#fff' : '#4a4a6a';
        ctx.beginPath();
        ctx.ellipse(0, 0, 24, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3a3a5a';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Armor plates on body
        for (let i = 0; i < this.armorPlates; i++) {
            ctx.fillStyle = flash ? '#fff' : '#6a6a8a';
            const plateAngle = (i / 4) * Math.PI * 2 - Math.PI / 2;
            const px = Math.cos(plateAngle) * 12;
            const py = Math.sin(plateAngle) * 10;
            ctx.beginPath();
            ctx.arc(px, py, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#8a8aaa';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Center core
        ctx.fillStyle = flash ? '#fff' : '#7a7aaa';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#aaaaff';
        ctx.shadowColor = '#aaaaff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Massive shoulder/arm structures
        ctx.fillStyle = flash ? '#fff' : '#4a4a6a';
        ctx.beginPath();
        ctx.ellipse(0, -22, 14, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(0, 22, 14, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Arms
        ctx.fillStyle = flash ? '#fff' : '#3a3a5a';
        ctx.fillRect(4, -26, 12, 14);
        ctx.fillRect(4, 12, 12, 14);

        // Massive fists
        ctx.fillStyle = flash ? '#fff' : '#5a5a7a';
        ctx.beginPath();
        ctx.arc(14, -20, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(14, 20, 10, 0, Math.PI * 2);
        ctx.fill();

        // Head (small compared to body)
        ctx.fillStyle = flash ? '#fff' : '#5a5a7a';
        ctx.beginPath();
        ctx.arc(20, 0, 10, 0, Math.PI * 2);
        ctx.fill();

        // Face plate
        ctx.fillStyle = flash ? '#fff' : '#3a3a5a';
        ctx.beginPath();
        ctx.moveTo(22, -8); ctx.lineTo(32, -6); ctx.lineTo(32, 6); ctx.lineTo(22, 8);
        ctx.closePath();
        ctx.fill();

        // Single eye
        ctx.fillStyle = '#00aaff';
        ctx.shadowColor = '#00aaff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(26, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    drawNecromancer(ctx) {
        const flash = this.hitFlash > 0;
        const floatOffset = Math.sin(Date.now() / 300) * 3;
        const darkPulse = Math.sin(this.darkAura) * 0.3 + 0.7;

        // Dark aura
        ctx.fillStyle = `rgba(100, 0, 100, ${0.3 * darkPulse})`;
        ctx.beginPath();
        ctx.arc(0, floatOffset, this.radius * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Soul wisps
        for (let i = 0; i < this.soulsCollected; i++) {
            const soulAngle = this.darkAura + (i * Math.PI * 2 / 3);
            const sx = Math.cos(soulAngle) * 30;
            const sy = Math.sin(soulAngle) * 20 + floatOffset;
            ctx.fillStyle = `rgba(150, 255, 150, ${0.5 + Math.sin(Date.now() / 200 + i) * 0.3})`;
            ctx.beginPath();
            ctx.arc(sx, sy, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Floating robes (no legs - floats)
        ctx.fillStyle = flash ? '#fff' : '#2d0a2d';
        ctx.beginPath();
        ctx.moveTo(-8, 5 + floatOffset);
        ctx.lineTo(-12, 20 + floatOffset);
        ctx.lineTo(0, 18 + floatOffset);
        ctx.lineTo(12, 20 + floatOffset);
        ctx.lineTo(8, 5 + floatOffset);
        ctx.closePath();
        ctx.fill();

        // Tattered edges
        ctx.strokeStyle = '#1a001a';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(-10 + i * 5, 18 + floatOffset);
            ctx.lineTo(-10 + i * 5 + Math.sin(Date.now() / 200 + i) * 2, 24 + floatOffset);
            ctx.stroke();
        }

        // Body
        ctx.fillStyle = flash ? '#fff' : '#3d1a3d';
        ctx.beginPath();
        ctx.ellipse(0, floatOffset, 12, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Skeletal arms
        ctx.strokeStyle = flash ? '#fff' : '#d0c0b0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -6 + floatOffset);
        ctx.lineTo(-10, -14 + floatOffset);
        ctx.lineTo(-14, -8 + floatOffset);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 6 + floatOffset);
        ctx.lineTo(-10, 14 + floatOffset);
        ctx.lineTo(-14, 8 + floatOffset);
        ctx.stroke();

        // Skeletal hands
        ctx.fillStyle = flash ? '#fff' : '#d0c0b0';
        ctx.beginPath();
        ctx.arc(-14, -8 + floatOffset, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-14, 8 + floatOffset, 4, 0, Math.PI * 2);
        ctx.fill();

        // Hood
        ctx.fillStyle = flash ? '#fff' : '#1a001a';
        ctx.beginPath();
        ctx.moveTo(2, -14 + floatOffset);
        ctx.quadraticCurveTo(-12, -10 + floatOffset, -8, 4 + floatOffset);
        ctx.lineTo(12, 4 + floatOffset);
        ctx.quadraticCurveTo(16, -10 + floatOffset, 2, -14 + floatOffset);
        ctx.fill();

        // Skull face
        ctx.fillStyle = '#c0b0a0';
        ctx.beginPath();
        ctx.ellipse(8, -2 + floatOffset, 7, 8, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Eye sockets with glow
        ctx.fillStyle = '#1a001a';
        ctx.beginPath();
        ctx.ellipse(6, -5 + floatOffset, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(11, -5 + floatOffset, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glowing eyes
        ctx.fillStyle = '#00ff00';
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(6, -5 + floatOffset, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(11, -5 + floatOffset, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Teeth
        ctx.fillStyle = '#1a001a';
        ctx.fillRect(5, 2 + floatOffset, 8, 3);

        // Staff
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(12, -20 + floatOffset, 3, 40);

        // Staff skull top
        ctx.fillStyle = '#c0b0a0';
        ctx.beginPath();
        ctx.arc(13.5, -24 + floatOffset, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(12, -25 + floatOffset, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(15, -25 + floatOffset, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Dark energy orb
        ctx.fillStyle = '#9900ff';
        ctx.shadowColor = '#9900ff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(13.5, -30 + floatOffset, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    drawBerserker(ctx) {
        const flash = this.hitFlash > 0;
        const rageIntensity = this.rage / this.maxRage;
        const pulse = Math.sin(Date.now() / (200 - rageIntensity * 100)) * rageIntensity * 0.2;
        const legSwing = Math.sin(this.walkCycle * (0.6 + rageIntensity * 0.4)) * (3 + rageIntensity * 3);

        // Rage aura (increases with rage)
        if (this.rage > 0) {
            ctx.fillStyle = `rgba(255, ${100 - rageIntensity * 100}, 0, ${rageIntensity * 0.4})`;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * (1.5 + pulse), 0, Math.PI * 2);
            ctx.fill();
        }

        // Enraged fire effect
        if (this.isEnraged) {
            for (let i = 0; i < 5; i++) {
                const fireX = Math.sin(Date.now() / 100 + i * 1.5) * 8;
                const fireY = -this.radius - 5 - Math.random() * 10;
                ctx.fillStyle = `rgba(255, ${150 + Math.random() * 100}, 0, 0.8)`;
                ctx.beginPath();
                ctx.arc(fireX, fireY, 4 + Math.random() * 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Legs (more frantic with rage)
        ctx.fillStyle = flash ? '#fff' : '#6a2200';
        ctx.fillRect(-12, -9 + legSwing, 9, 14);
        ctx.fillRect(-12, 5 - legSwing, 9, 14);

        // Boots
        ctx.fillStyle = flash ? '#fff' : '#3a1100';
        ctx.fillRect(-14, legSwing + 2, 7, 8);
        ctx.fillRect(-14, 12 - legSwing, 7, 8);

        // Muscular body
        const bodyColor = flash ? '#fff' : `rgb(${200 + rageIntensity * 55}, ${50 - rageIntensity * 50}, 0)`;
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 13, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#4a1100';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Chest scars
        ctx.strokeStyle = '#8a4400';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-6, -8); ctx.lineTo(4, 2);
        ctx.moveTo(-4, -6); ctx.lineTo(6, 4);
        ctx.moveTo(2, -8); ctx.lineTo(-4, 2);
        ctx.stroke();

        // Straps/harness
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-8, -12); ctx.lineTo(8, 8);
        ctx.moveTo(-8, 12); ctx.lineTo(8, -8);
        ctx.stroke();

        // Massive arms (bigger when enraged)
        const armSize = 1 + rageIntensity * 0.3;
        ctx.fillStyle = bodyColor;
        ctx.fillRect(0, -18 * armSize, 10 * armSize, 12 * armSize);
        ctx.fillRect(0, 6, 10 * armSize, 12 * armSize);

        // Fists
        ctx.fillStyle = flash ? '#fff' : '#4a1100';
        ctx.beginPath();
        ctx.arc(8 * armSize, -16 * armSize, 6 * armSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(8 * armSize, 16 * armSize, 6 * armSize, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(12, 0, 9, 0, Math.PI * 2);
        ctx.fill();

        // War paint
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(14, -6, 8, 2);
        ctx.fillRect(14, -2, 6, 2);
        ctx.fillRect(14, 2, 8, 2);

        // Enraged eyes
        const eyeColor = this.isEnraged ? '#ff0000' : '#ffaa00';
        ctx.fillStyle = eyeColor;
        ctx.shadowColor = eyeColor;
        ctx.shadowBlur = this.isEnraged ? 15 : 5;
        ctx.beginPath();
        ctx.arc(16, -3, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(16, 3, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Mohawk
        ctx.fillStyle = flash ? '#fff' : '#8a2200';
        for (let i = 0; i < 5; i++) {
            const spikeHeight = 8 + (this.isEnraged ? 4 : 0);
            ctx.beginPath();
            ctx.moveTo(8 + i * 2, -8);
            ctx.lineTo(9 + i * 2, -8 - spikeHeight);
            ctx.lineTo(10 + i * 2, -8);
            ctx.fill();
        }

        // Twin axes
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(14, -22, 3, 8);
        ctx.fillRect(14, 14, 3, 8);
        ctx.fillStyle = '#606060';
        ctx.beginPath();
        ctx.moveTo(12, -24); ctx.lineTo(22, -22); ctx.lineTo(22, -18); ctx.lineTo(12, -16);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(12, 16); ctx.lineTo(22, 18); ctx.lineTo(22, 22); ctx.lineTo(12, 24);
        ctx.fill();

        // Rage meter
        if (this.rage > 0) {
            ctx.fillStyle = '#ff4400';
            ctx.fillRect(-12, -this.radius - 25, 24 * rageIntensity, 3);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.strokeRect(-12, -this.radius - 25, 24, 3);
        }
    }

    drawMech(ctx) {
        const flash = this.hitFlash > 0;
        const pulse = Math.sin(Date.now() / 200) * 0.1 + 1;
        const legSwing = Math.sin(this.walkCycle * 0.4) * 2;
        const phaseColor = this.phase === 3 ? '#ff0000' : (this.phase === 2 ? '#ffaa00' : '#00aaff');

        // Energy field when shields up
        if (this.mechShield > 0) {
            ctx.strokeStyle = `rgba(0, 150, 255, ${0.3 + (this.mechShield / this.maxMechShield) * 0.4})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 1.3 * pulse, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Mechanical legs
        ctx.fillStyle = flash ? '#fff' : '#2a3a4a';
        // Upper legs
        ctx.fillRect(-16, -12 + legSwing, 10, 16);
        ctx.fillRect(-16, 6 - legSwing, 10, 16);
        // Lower legs
        ctx.fillStyle = flash ? '#fff' : '#3a5a7a';
        ctx.fillRect(-18, -4 + legSwing, 8, 12);
        ctx.fillRect(-18, 14 - legSwing, 8, 12);
        // Feet (mechanical)
        ctx.fillStyle = flash ? '#fff' : '#1a2a3a';
        ctx.fillRect(-22, 4 + legSwing, 12, 6);
        ctx.fillRect(-22, 22 - legSwing, 12, 6);

        // Hydraulics
        ctx.strokeStyle = '#5a5a5a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-14, -8 + legSwing); ctx.lineTo(-8, 0);
        ctx.moveTo(-14, 12 - legSwing); ctx.lineTo(-8, 4);
        ctx.stroke();

        // Main body (chassis)
        ctx.fillStyle = flash ? '#fff' : '#3a5a7a';
        ctx.beginPath();
        ctx.rect(-14, -16, 28, 32);
        ctx.fill();
        ctx.strokeStyle = '#2a4a6a';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Chest panel
        ctx.fillStyle = flash ? '#fff' : '#1a2a3a';
        ctx.fillRect(-10, -12, 20, 24);

        // Power core (glows based on phase)
        ctx.fillStyle = phaseColor;
        ctx.shadowColor = phaseColor;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Core rings
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.stroke();

        // Phase indicators
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = i < this.phase ? phaseColor : '#333';
            ctx.beginPath();
            ctx.arc(-6 + i * 6, 8, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Shoulder mounts
        ctx.fillStyle = flash ? '#fff' : '#4a6a8a';
        ctx.beginPath();
        ctx.ellipse(0, -20, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(0, 20, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Arms (weapons)
        ctx.fillStyle = flash ? '#fff' : '#3a5a7a';
        ctx.fillRect(6, -22, 10, 10);
        ctx.fillRect(6, 12, 10, 10);

        // Weapon barrels
        ctx.fillStyle = flash ? '#fff' : '#1a1a1a';
        ctx.fillRect(14, -20, 12, 3);
        ctx.fillRect(14, -16, 12, 3);
        ctx.fillRect(14, 14, 12, 3);
        ctx.fillRect(14, 18, 12, 3);

        // Head unit
        ctx.fillStyle = flash ? '#fff' : '#2a4a6a';
        ctx.beginPath();
        ctx.rect(10, -10, 16, 20);
        ctx.fill();

        // Visor
        ctx.fillStyle = phaseColor;
        ctx.shadowColor = phaseColor;
        ctx.shadowBlur = 10;
        ctx.fillRect(14, -6, 10, 12);
        ctx.shadowBlur = 0;

        // Antenna
        ctx.fillStyle = '#5a5a5a';
        ctx.fillRect(16, -16, 2, 8);
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(17, -18, 2, 0, Math.PI * 2);
        ctx.fill();

        // Shield bar
        if (this.maxMechShield > 0) {
            const shieldPercent = this.mechShield / this.maxMechShield;
            ctx.fillStyle = '#0066ff';
            ctx.fillRect(-14, -this.radius - 22, 28 * shieldPercent, 4);
            ctx.strokeStyle = '#00aaff';
            ctx.lineWidth = 1;
            ctx.strokeRect(-14, -this.radius - 22, 28, 4);
        }
    }

    drawHealthBar(ctx) {
        const barWidth = this.radius * 2.5;
        const barHeight = 5;
        const barY = this.y - this.radius - 15;
        const barX = this.x - barWidth / 2;
        const healthPercent = this.health / this.maxHealth;

        // Background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

        // Health
        const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
        if (healthPercent > 0.5) {
            gradient.addColorStop(0, '#2ecc71');
            gradient.addColorStop(1, '#27ae60');
        } else if (healthPercent > 0.25) {
            gradient.addColorStop(0, '#f39c12');
            gradient.addColorStop(1, '#e67e22');
        } else {
            gradient.addColorStop(0, '#e74c3c');
            gradient.addColorStop(1, '#c0392b');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

        // Border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }

    drawStatusEffects(ctx) {
        let iconX = this.x - this.radius;

        // Slow indicator (ice crystal)
        if (this.slowDuration > 0) {
            ctx.fillStyle = '#00bfff';
            ctx.beginPath();
            ctx.moveTo(iconX + 4, this.y - this.radius - 30);
            ctx.lineTo(iconX + 8, this.y - this.radius - 26);
            ctx.lineTo(iconX + 8, this.y - this.radius - 22);
            ctx.lineTo(iconX + 4, this.y - this.radius - 18);
            ctx.lineTo(iconX, this.y - this.radius - 22);
            ctx.lineTo(iconX, this.y - this.radius - 26);
            ctx.closePath();
            ctx.fill();
            iconX += 14;
        }

        // Poison indicator (skull)
        if (this.poisonDuration > 0) {
            ctx.fillStyle = '#00ff00';
            ctx.beginPath();
            ctx.arc(iconX + 4, this.y - this.radius - 26, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#004400';
            ctx.beginPath();
            ctx.arc(iconX + 2, this.y - this.radius - 27, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(iconX + 6, this.y - this.radius - 27, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(iconX + 2, this.y - this.radius - 23, 4, 2);
        }
    }
}
