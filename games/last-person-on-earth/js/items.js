// Item drop and fragment system

const ItemTypes = {
    COIN: 'coin',
    HEALTH_POTION: 'health_potion',
    WEAPON_FRAGMENT: 'weapon_fragment',
    ARMOR_FRAGMENT: 'armor_fragment'
};

class Item {
    constructor(type, x, y, value = 1, subType = null) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.value = value;
        this.subType = subType; // For fragments: which weapon/armor type
        this.radius = 12;
        this.collected = false;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.lifetime = 30000; // 30 seconds before despawn
        this.spawnTime = Date.now();
    }

    get isExpired() {
        return Date.now() - this.spawnTime > this.lifetime;
    }

    update(deltaTime) {
        this.bobOffset += deltaTime * 0.003;
    }

    draw(ctx) {
        const bobY = Math.sin(this.bobOffset) * 3;

        ctx.save();
        ctx.translate(this.x, this.y + bobY);

        switch (this.type) {
            case ItemTypes.COIN:
                this.drawCoin(ctx);
                break;
            case ItemTypes.HEALTH_POTION:
                this.drawHealthPotion(ctx);
                break;
            case ItemTypes.WEAPON_FRAGMENT:
                this.drawFragment(ctx, '#C0C0C0');
                break;
            case ItemTypes.ARMOR_FRAGMENT:
                this.drawFragment(ctx, '#8B4513');
                break;
        }

        ctx.restore();
    }

    drawCoin(ctx) {
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Dollar sign
        ctx.fillStyle = '#B8860B';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 0);
    }

    drawHealthPotion(ctx) {
        // Bottle shape
        ctx.beginPath();
        ctx.moveTo(-6, -8);
        ctx.lineTo(-6, -4);
        ctx.lineTo(-10, 0);
        ctx.lineTo(-10, 10);
        ctx.lineTo(10, 10);
        ctx.lineTo(10, 0);
        ctx.lineTo(6, -4);
        ctx.lineTo(6, -8);
        ctx.closePath();
        ctx.fillStyle = '#FF4444';
        ctx.fill();
        ctx.strokeStyle = '#AA0000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Cork
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-4, -12, 8, 5);
    }

    drawFragment(ctx, color) {
        // Crystal/shard shape
        ctx.beginPath();
        ctx.moveTo(0, -this.radius);
        ctx.lineTo(this.radius * 0.7, 0);
        ctx.lineTo(0, this.radius);
        ctx.lineTo(-this.radius * 0.7, 0);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Shine effect
        ctx.beginPath();
        ctx.moveTo(-2, -6);
        ctx.lineTo(2, -2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// Inventory system for fragments
class Inventory {
    constructor() {
        this.coins = 0;
        this.weaponFragments = {};
        this.armorFragments = {};

        // Initialize fragment counts for each type
        Object.values(WeaponTypes).forEach(type => {
            this.weaponFragments[type] = 0;
        });
        Object.values(ArmorTypes).forEach(type => {
            if (type !== ArmorTypes.NONE) {
                this.armorFragments[type] = 0;
            }
        });
    }

    addCoins(amount) {
        this.coins += amount;
    }

    spendCoins(amount) {
        if (this.coins >= amount) {
            this.coins -= amount;
            return true;
        }
        return false;
    }

    addWeaponFragment(weaponType) {
        if (this.weaponFragments[weaponType] !== undefined) {
            this.weaponFragments[weaponType]++;
        }
    }

    addArmorFragment(armorType) {
        if (this.armorFragments[armorType] !== undefined) {
            this.armorFragments[armorType]++;
        }
    }

    // Check if we can combine fragments into an item
    canCombineWeapon(weaponType) {
        return this.weaponFragments[weaponType] >= 3;
    }

    canCombineArmor(armorType) {
        return this.armorFragments[armorType] >= 3;
    }

    // Combine 3 fragments into item (returns true if successful)
    combineWeaponFragments(weaponType) {
        if (this.canCombineWeapon(weaponType)) {
            this.weaponFragments[weaponType] -= 3;
            return true;
        }
        return false;
    }

    combineArmorFragments(armorType) {
        if (this.canCombineArmor(armorType)) {
            this.armorFragments[armorType] -= 3;
            return true;
        }
        return false;
    }
}

// Item drop generation
function generateDrop(x, y, enemyType, level = 1) {
    const items = [];
    const rand = Math.random();

    // Coins - always drop some
    const coinAmount = Math.floor(Math.random() * 5 + 3) * level;
    items.push(new Item(ItemTypes.COIN, x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 20, coinAmount));

    // Health potion - common drop
    if (Math.random() < 0.3) {
        items.push(new Item(ItemTypes.HEALTH_POTION, x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 30, 25));
    }

    // Fragments based on enemy type
    let dropChance = 0;
    switch (enemyType) {
        case 'zombie':
            dropChance = 0.7;
            break;
        case 'skeleton':
            dropChance = 0.8;
            break;
        case 'ghost':
            dropChance = 0.75;
            break;
        case 'demon':
            dropChance = 0.85;
            break;
        case 'vampire':
            dropChance = 0.9;
            break;
        case 'wraith':
            dropChance = 0.85;
            break;
        case 'golem':
            dropChance = 0.95;
            break;
        case 'banshee':
            dropChance = 0.8;
            break;
        case 'reaper':
            dropChance = 0.9;
            break;
        case 'elemental':
            dropChance = 0.85;
            break;
        case 'boss':
            dropChance = 1.0;
            break;
        default:
            dropChance = 0.75;
            break;
    }

    if (Math.random() < dropChance) {
        // Randomly choose weapon or armor fragment
        if (Math.random() < 0.5) {
            const weaponTypes = Object.values(WeaponTypes);
            const subType = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
            items.push(new Item(ItemTypes.WEAPON_FRAGMENT, x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 40, 1, subType));
        } else {
            const armorTypes = Object.values(ArmorTypes).filter(t => t !== ArmorTypes.NONE);
            const subType = armorTypes[Math.floor(Math.random() * armorTypes.length)];
            items.push(new Item(ItemTypes.ARMOR_FRAGMENT, x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 40, 1, subType));
        }
    }

    // Boss drops extra fragments
    if (enemyType === 'boss') {
        for (let i = 0; i < 3; i++) {
            if (Math.random() < 0.5) {
                const weaponTypes = Object.values(WeaponTypes);
                const subType = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
                items.push(new Item(ItemTypes.WEAPON_FRAGMENT, x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 60, 1, subType));
            } else {
                const armorTypes = Object.values(ArmorTypes).filter(t => t !== ArmorTypes.NONE);
                const subType = armorTypes[Math.floor(Math.random() * armorTypes.length)];
                items.push(new Item(ItemTypes.ARMOR_FRAGMENT, x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 60, 1, subType));
            }
        }
        // Boss drops bonus coins
        items.push(new Item(ItemTypes.COIN, x, y, 50 * level));
    }

    return items;
}
