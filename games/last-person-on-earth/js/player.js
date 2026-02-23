// Player class

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.speed = 200; // pixels per second
        this.maxHealth = 200;
        this.health = this.maxHealth;

        // Movement
        this.velX = 0;
        this.velY = 0;
        this.facing = 0; // angle in radians

        // Equipment
        this.weapon = new Weapon(WeaponTypes.BAT);
        this.armor = new Armor(ArmorTypes.NONE);

        // Combat
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.attackAnimationTime = 0;
        this.attackAnimationDuration = 150; // ms

        // Inventory
        this.inventory = new Inventory();

        // Owned items (for shop)
        this.ownedWeapons = [WeaponTypes.BAT];
        this.ownedArmor = [ArmorTypes.NONE];

        // Input state
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false
        };

        // Invincibility frames
        this.invincible = false;
        this.invincibleTime = 0;
        this.invincibleDuration = 500; // ms
    }

    handleKeyDown(key) {
        const k = key.toLowerCase();
        if (this.keys.hasOwnProperty(k)) {
            this.keys[k] = true;
        }
        // Arrow key support
        if (key === 'ArrowUp') this.keys.w = true;
        if (key === 'ArrowDown') this.keys.s = true;
        if (key === 'ArrowLeft') this.keys.a = true;
        if (key === 'ArrowRight') this.keys.d = true;
    }

    handleKeyUp(key) {
        const k = key.toLowerCase();
        if (this.keys.hasOwnProperty(k)) {
            this.keys[k] = false;
        }
        // Arrow key support
        if (key === 'ArrowUp') this.keys.w = false;
        if (key === 'ArrowDown') this.keys.s = false;
        if (key === 'ArrowLeft') this.keys.a = false;
        if (key === 'ArrowRight') this.keys.d = false;
    }

    handleMouseMove(mouseX, mouseY) {
        // Update facing direction towards mouse
        this.facing = Math.atan2(mouseY - this.y, mouseX - this.x);
    }

    attack() {
        if (this.attackCooldown <= 0) {
            this.isAttacking = true;
            this.attackCooldown = this.weapon.speed;
            this.attackAnimationTime = this.attackAnimationDuration;
            return true;
        }
        return false;
    }

    // Check if attack hits an enemy
    checkAttackHit(enemy) {
        if (!this.isAttacking || this.attackAnimationTime < this.attackAnimationDuration * 0.5) {
            return false;
        }

        return Collision.arcHit(
            this.x, this.y,
            this.facing,
            this.weapon.arcWidth,
            this.weapon.range + this.radius,
            enemy.x, enemy.y,
            enemy.radius
        );
    }

    takeDamage(amount) {
        if (this.invincible) return 0;

        const reducedDamage = this.armor.reduceDamage(amount);
        this.health = Math.max(0, this.health - reducedDamage);

        // Start invincibility frames
        this.invincible = true;
        this.invincibleTime = this.invincibleDuration;

        return reducedDamage;
    }

    heal(amount) {
        const oldHealth = this.health;
        this.health = Math.min(this.maxHealth, this.health + amount);
        return this.health - oldHealth;
    }

    equipWeapon(weaponType) {
        if (this.ownedWeapons.includes(weaponType)) {
            // Find existing weapon with upgrades or create new
            this.weapon = new Weapon(weaponType);
        }
    }

    equipArmor(armorType) {
        if (this.ownedArmor.includes(armorType)) {
            this.armor = new Armor(armorType);
        }
    }

    update(deltaTime, canvasWidth, canvasHeight) {
        // Update cooldowns
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }

        if (this.attackAnimationTime > 0) {
            this.attackAnimationTime -= deltaTime;
            if (this.attackAnimationTime <= 0) {
                this.isAttacking = false;
            }
        }

        // Update invincibility
        if (this.invincibleTime > 0) {
            this.invincibleTime -= deltaTime;
            if (this.invincibleTime <= 0) {
                this.invincible = false;
            }
        }

        // Calculate velocity based on input
        this.velX = 0;
        this.velY = 0;

        if (this.keys.w) this.velY = -1;
        if (this.keys.s) this.velY = 1;
        if (this.keys.a) this.velX = -1;
        if (this.keys.d) this.velX = 1;

        // Normalize diagonal movement
        if (this.velX !== 0 && this.velY !== 0) {
            const length = Math.sqrt(this.velX * this.velX + this.velY * this.velY);
            this.velX /= length;
            this.velY /= length;
        }

        // Apply movement
        this.x += this.velX * this.speed * (deltaTime / 1000);
        this.y += this.velY * this.speed * (deltaTime / 1000);

        // Keep player in bounds
        this.x = Math.max(this.radius, Math.min(canvasWidth - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(canvasHeight - this.radius, this.y));
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Flash when invincible
        if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Draw body
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#4A90D9';
        ctx.fill();
        ctx.strokeStyle = '#2E5A8A';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw armor indicator
        if (this.armor.type !== ArmorTypes.NONE) {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius - 5, 0, Math.PI * 2);
            ctx.strokeStyle = this.armor.color;
            ctx.lineWidth = 4;
            ctx.stroke();
        }

        // Draw facing direction indicator
        ctx.rotate(this.facing);
        ctx.beginPath();
        ctx.moveTo(this.radius - 5, 0);
        ctx.lineTo(this.radius + 5, 0);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw weapon
        this.drawWeapon(ctx);

        ctx.restore();
    }

    drawWeapon(ctx) {
        // Weapon swing animation
        let swingAngle = 0;
        if (this.attackAnimationTime > 0) {
            const progress = 1 - (this.attackAnimationTime / this.attackAnimationDuration);
            swingAngle = Math.sin(progress * Math.PI) * (this.weapon.arcWidth / 2);
        }

        ctx.rotate(swingAngle - this.weapon.arcWidth / 4);

        const weaponLength = this.weapon.range * 0.8;

        ctx.beginPath();
        ctx.moveTo(this.radius, 0);
        ctx.lineTo(this.radius + weaponLength, 0);
        ctx.strokeStyle = this.weapon.color;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Draw attack arc when attacking
        if (this.isAttacking && this.attackAnimationTime > this.attackAnimationDuration * 0.3) {
            ctx.rotate(-swingAngle + this.weapon.arcWidth / 4); // Reset rotation
            ctx.beginPath();
            ctx.arc(0, 0, this.weapon.range + this.radius, -this.weapon.arcWidth / 2, this.weapon.arcWidth / 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.health = this.maxHealth;
        this.velX = 0;
        this.velY = 0;
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.invincible = false;
        this.keys = { w: false, a: false, s: false, d: false };
    }
}
