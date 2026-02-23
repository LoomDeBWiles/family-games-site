// Weapon definitions and classes

const WeaponTypes = {
    BAT: 'bat',
    SWORD: 'sword',
    AXE: 'axe',
    SPEAR: 'spear',
    DAGGER: 'dagger',
    HAMMER: 'hammer',
    SCYTHE: 'scythe',
    KATANA: 'katana',
    FLAIL: 'flail',
    GREATSWORD: 'greatsword'
};

const WeaponData = {
    [WeaponTypes.BAT]: {
        name: 'Bat',
        damage: 10,
        range: 40,
        speed: 0,
        arcWidth: Math.PI / 2,
        color: '#8B4513',
        price: 0,
        description: 'A trusty wooden bat.'
    },
    [WeaponTypes.DAGGER]: {
        name: 'Dagger',
        damage: 8,
        range: 30,
        speed: 0,
        arcWidth: Math.PI / 4,
        color: '#A9A9A9',
        price: 50,
        description: 'Quick and nimble.'
    },
    [WeaponTypes.SWORD]: {
        name: 'Sword',
        damage: 20,
        range: 55,
        speed: 0,
        arcWidth: Math.PI / 3,
        color: '#C0C0C0',
        price: 100,
        description: 'Balanced damage and reach.'
    },
    [WeaponTypes.SPEAR]: {
        name: 'Spear',
        damage: 15,
        range: 90,
        speed: 0,
        arcWidth: Math.PI / 6,
        color: '#DAA520',
        price: 150,
        description: 'Long reach, narrow arc.'
    },
    [WeaponTypes.AXE]: {
        name: 'Axe',
        damage: 35,
        range: 45,
        speed: 0,
        arcWidth: Math.PI / 2.5,
        color: '#696969',
        price: 200,
        description: 'Heavy damage.'
    },
    [WeaponTypes.HAMMER]: {
        name: 'Hammer',
        damage: 45,
        range: 50,
        speed: 0,
        arcWidth: Math.PI / 2,
        color: '#4A4A4A',
        price: 275,
        description: 'Massive damage, wide arc.'
    },
    [WeaponTypes.KATANA]: {
        name: 'Katana',
        damage: 28,
        range: 65,
        speed: 0,
        arcWidth: Math.PI / 4,
        color: '#E8E8E8',
        price: 325,
        description: 'Elegant and deadly.'
    },
    [WeaponTypes.SCYTHE]: {
        name: 'Scythe',
        damage: 40,
        range: 75,
        speed: 0,
        arcWidth: Math.PI / 1.5,
        color: '#2F2F2F',
        price: 400,
        description: 'Wide sweeping attacks.'
    },
    [WeaponTypes.FLAIL]: {
        name: 'Flail',
        damage: 50,
        range: 60,
        speed: 0,
        arcWidth: Math.PI,
        color: '#8B4513',
        price: 450,
        description: 'Full circle attack.'
    },
    [WeaponTypes.GREATSWORD]: {
        name: 'Greatsword',
        damage: 65,
        range: 80,
        speed: 0,
        arcWidth: Math.PI / 2,
        color: '#B8860B',
        price: 600,
        description: 'Ultimate power and reach.'
    }
};

class Weapon {
    constructor(type, tier = 1) {
        this.type = type;
        this.tier = tier;
        const data = WeaponData[type];
        this.name = data.name;
        this.baseDamage = data.damage;
        this.baseRange = data.range;
        this.baseSpeed = data.speed;
        this.arcWidth = data.arcWidth;
        this.color = data.color;
        this.price = data.price;
        this.description = data.description;

        // Individual stat upgrades
        this.damageBonus = 0;
        this.rangeBonus = 0;
    }

    get damage() {
        return Math.floor(this.baseDamage * (1 + (this.tier - 1) * 0.25)) + this.damageBonus;
    }

    get range() {
        return this.baseRange + (this.tier - 1) * 5 + this.rangeBonus;
    }

    get speed() {
        return Math.max(this.baseSpeed - (this.tier - 1) * 30, 0);
    }

    get displayName() {
        if (this.tier > 1) {
            return `${this.name} +${this.tier - 1}`;
        }
        return this.name;
    }

    get upgradePrice() {
        return Math.floor(this.price * 0.5 * this.tier) + 50;
    }

    get damageUpgradePrice() {
        return 30 + this.damageBonus * 10;
    }

    get rangeUpgradePrice() {
        return 25 + this.rangeBonus * 8;
    }

    upgrade() {
        if (this.tier < 10) {
            this.tier++;
            return true;
        }
        return false;
    }

    upgradeDamage() {
        if (this.damageBonus < 50) {
            this.damageBonus += 5;
            return true;
        }
        return false;
    }

    upgradeRange() {
        if (this.rangeBonus < 40) {
            this.rangeBonus += 5;
            return true;
        }
        return false;
    }

    clone() {
        const w = new Weapon(this.type, this.tier);
        w.damageBonus = this.damageBonus;
        w.rangeBonus = this.rangeBonus;
        return w;
    }
}
