// Armor definitions and classes

const ArmorTypes = {
    NONE: 'none',
    CLOTH: 'cloth',
    LEATHER: 'leather',
    STUDDED: 'studded',
    CHAIN: 'chain',
    SCALE: 'scale',
    PLATE: 'plate',
    DRAGON: 'dragon',
    HOLY: 'holy'
};

const ArmorData = {
    [ArmorTypes.NONE]: {
        name: 'No Armor',
        defense: 0,
        color: '#666666',
        price: 0,
        description: 'No protection.'
    },
    [ArmorTypes.CLOTH]: {
        name: 'Cloth Armor',
        defense: 0.1,
        color: '#DEB887',
        price: 40,
        description: 'Basic protection. 10% reduction.'
    },
    [ArmorTypes.LEATHER]: {
        name: 'Leather Armor',
        defense: 0.2,
        color: '#8B4513',
        price: 75,
        description: 'Light armor. 20% reduction.'
    },
    [ArmorTypes.STUDDED]: {
        name: 'Studded Leather',
        defense: 0.3,
        color: '#6B4423',
        price: 120,
        description: 'Reinforced leather. 30% reduction.'
    },
    [ArmorTypes.CHAIN]: {
        name: 'Chain Mail',
        defense: 0.4,
        color: '#A9A9A9',
        price: 175,
        description: 'Medium armor. 40% reduction.'
    },
    [ArmorTypes.SCALE]: {
        name: 'Scale Mail',
        defense: 0.5,
        color: '#708090',
        price: 250,
        description: 'Overlapping scales. 50% reduction.'
    },
    [ArmorTypes.PLATE]: {
        name: 'Plate Armor',
        defense: 0.6,
        color: '#C0C0C0',
        price: 350,
        description: 'Heavy armor. 60% reduction.'
    },
    [ArmorTypes.DRAGON]: {
        name: 'Dragon Armor',
        defense: 0.7,
        color: '#8B0000',
        price: 500,
        description: 'Forged from dragon scales. 70% reduction.'
    },
    [ArmorTypes.HOLY]: {
        name: 'Holy Armor',
        defense: 0.8,
        color: '#FFD700',
        price: 750,
        description: 'Divine protection. 80% reduction.'
    }
};

class Armor {
    constructor(type, tier = 1) {
        this.type = type;
        this.tier = tier;
        const data = ArmorData[type];
        this.name = data.name;
        this.baseDefense = data.defense;
        this.color = data.color;
        this.price = data.price;
        this.description = data.description;

        // Bonus defense from upgrades
        this.defenseBonus = 0;
    }

    get defense() {
        // Each tier increases defense by 3% (additive)
        return Math.min(this.baseDefense + (this.tier - 1) * 0.03 + this.defenseBonus, 0.9);
    }

    get displayName() {
        if (this.tier > 1 && this.type !== ArmorTypes.NONE) {
            return `${this.name} +${this.tier - 1}`;
        }
        return this.name;
    }

    get upgradePrice() {
        return Math.floor(this.price * 0.5 * this.tier) + 40;
    }

    get defenseUpgradePrice() {
        return 35 + Math.floor(this.defenseBonus * 100) * 5;
    }

    // Calculate damage after armor reduction
    reduceDamage(damage) {
        return Math.floor(damage * (1 - this.defense));
    }

    upgrade() {
        if (this.tier < 10 && this.type !== ArmorTypes.NONE) {
            this.tier++;
            return true;
        }
        return false;
    }

    upgradeDefense() {
        if (this.defenseBonus < 0.15 && this.type !== ArmorTypes.NONE) {
            this.defenseBonus += 0.02;
            return true;
        }
        return false;
    }

    clone() {
        const a = new Armor(this.type, this.tier);
        a.defenseBonus = this.defenseBonus;
        return a;
    }
}
