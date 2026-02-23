// Shop system

class Shop {
    constructor(game) {
        this.game = game;

        // DOM elements
        this.shopModal = document.getElementById('shop-modal');
        this.shopCoins = document.getElementById('shop-coins');
        this.weaponsList = document.getElementById('weapons-list');
        this.armorList = document.getElementById('armor-list');
        this.inventoryDisplay = document.getElementById('inventory-display');
        this.fragmentsDisplay = document.getElementById('fragments-display');
        this.continueBtn = document.getElementById('continue-btn');

        // Bind continue button
        this.continueBtn.addEventListener('click', () => this.onContinue());
    }

    open() {
        this.render();
        this.shopModal.classList.remove('hidden');
    }

    close() {
        this.shopModal.classList.add('hidden');
    }

    render() {
        const player = this.game.player;

        // Update coins display
        this.shopCoins.textContent = `Coins: ${player.inventory.coins}`;

        // Render weapons
        this.renderWeapons(player);

        // Render armor
        this.renderArmor(player);

        // Render inventory with upgrades
        this.renderInventory(player);

        // Render fragments
        this.renderFragments(player);
    }

    renderWeapons(player) {
        this.weaponsList.innerHTML = '';

        Object.entries(WeaponData).forEach(([type, data]) => {
            const owned = player.ownedWeapons.includes(type);
            const equipped = player.weapon.type === type;

            const item = document.createElement('div');
            item.className = 'shop-item';
            if (owned) item.classList.add('owned');
            if (equipped) item.classList.add('equipped');

            const weapon = owned && equipped ? player.weapon : new Weapon(type);

            item.innerHTML = `
                <div class="shop-item-name">${owned && equipped ? weapon.displayName : data.name}</div>
                <div class="shop-item-stats">
                    Dmg: ${weapon.damage} | Range: ${weapon.range}
                </div>
                <div class="shop-item-price">
                    ${owned ? (equipped ? 'Equipped' : 'Click to Equip') : `${data.price} coins`}
                </div>
            `;

            // Check if can combine fragments
            if (!owned && player.inventory.canCombineWeapon(type)) {
                const combineBtn = document.createElement('button');
                combineBtn.textContent = 'Combine (3 frags)';
                combineBtn.className = 'shop-small-btn';
                combineBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.combineWeapon(type);
                });
                item.appendChild(combineBtn);
            }

            item.addEventListener('click', () => this.onWeaponClick(type, owned, equipped));
            this.weaponsList.appendChild(item);
        });
    }

    renderArmor(player) {
        this.armorList.innerHTML = '';

        Object.entries(ArmorData).forEach(([type, data]) => {
            const owned = player.ownedArmor.includes(type);
            const equipped = player.armor.type === type;

            const item = document.createElement('div');
            item.className = 'shop-item';
            if (owned) item.classList.add('owned');
            if (equipped) item.classList.add('equipped');

            const armor = owned && equipped ? player.armor : new Armor(type);

            item.innerHTML = `
                <div class="shop-item-name">${owned && equipped ? armor.displayName : data.name}</div>
                <div class="shop-item-stats">
                    Defense: ${Math.round(armor.defense * 100)}%
                </div>
                <div class="shop-item-price">
                    ${type === ArmorTypes.NONE ? 'Default' : (owned ? (equipped ? 'Equipped' : 'Click to Equip') : `${data.price} coins`)}
                </div>
            `;

            // Check if can combine fragments
            if (!owned && type !== ArmorTypes.NONE && player.inventory.canCombineArmor(type)) {
                const combineBtn = document.createElement('button');
                combineBtn.textContent = 'Combine (3 frags)';
                combineBtn.className = 'shop-small-btn';
                combineBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.combineArmor(type);
                });
                item.appendChild(combineBtn);
            }

            item.addEventListener('click', () => this.onArmorClick(type, owned, equipped));
            this.armorList.appendChild(item);
        });
    }

    renderInventory(player) {
        const weapon = player.weapon;
        const armor = player.armor;

        this.inventoryDisplay.innerHTML = `
            <div class="inventory-section">
                <h4>Equipped Weapon: ${weapon.displayName}</h4>
                <div class="stats-display">
                    Damage: ${weapon.damage} (+${weapon.damageBonus} bonus)<br>
                    Range: ${weapon.range} (+${weapon.rangeBonus} bonus)
                </div>
                <div class="upgrade-buttons">
                    <button class="upgrade-btn" id="upgrade-damage-btn">
                        +5 Damage (${weapon.damageUpgradePrice} coins)
                    </button>
                    <button class="upgrade-btn" id="upgrade-range-btn">
                        +5 Range (${weapon.rangeUpgradePrice} coins)
                    </button>
                </div>
            </div>
            <div class="inventory-section">
                <h4>Equipped Armor: ${armor.displayName}</h4>
                <div class="stats-display">
                    Defense: ${Math.round(armor.defense * 100)}% (+${Math.round(armor.defenseBonus * 100)}% bonus)
                </div>
                ${armor.type !== ArmorTypes.NONE ? `
                <div class="upgrade-buttons">
                    <button class="upgrade-btn" id="upgrade-defense-btn">
                        +2% Defense (${armor.defenseUpgradePrice} coins)
                    </button>
                </div>
                ` : ''}
            </div>
        `;

        // Bind upgrade buttons
        document.getElementById('upgrade-damage-btn')?.addEventListener('click', () => this.upgradeDamage());
        document.getElementById('upgrade-range-btn')?.addEventListener('click', () => this.upgradeRange());
        document.getElementById('upgrade-defense-btn')?.addEventListener('click', () => this.upgradeDefense());
    }

    renderFragments(player) {
        let fragmentsHtml = '<strong>Fragments:</strong> ';

        // Weapon fragments
        const weaponFrags = [];
        Object.entries(player.inventory.weaponFragments).forEach(([type, count]) => {
            if (count > 0 && WeaponData[type]) {
                weaponFrags.push(`${WeaponData[type].name}: ${count}/3`);
            }
        });

        // Armor fragments
        const armorFrags = [];
        Object.entries(player.inventory.armorFragments).forEach(([type, count]) => {
            if (count > 0 && ArmorData[type]) {
                armorFrags.push(`${ArmorData[type].name}: ${count}/3`);
            }
        });

        if (weaponFrags.length === 0 && armorFrags.length === 0) {
            fragmentsHtml += 'None';
        } else {
            fragmentsHtml += [...weaponFrags, ...armorFrags].join(', ');
        }

        this.fragmentsDisplay.innerHTML = fragmentsHtml;
    }

    onWeaponClick(type, owned, equipped) {
        const player = this.game.player;

        if (owned) {
            if (!equipped) {
                // Transfer upgrades to the new weapon
                const oldWeapon = player.weapon;
                player.weapon = new Weapon(type);
                // Keep some upgrades when switching
                this.render();
            }
        } else {
            // Try to buy
            const price = WeaponData[type].price;
            if (player.inventory.spendCoins(price)) {
                player.ownedWeapons.push(type);
                player.weapon = new Weapon(type);
                this.render();
            }
        }
    }

    onArmorClick(type, owned, equipped) {
        const player = this.game.player;

        if (type === ArmorTypes.NONE) {
            player.armor = new Armor(type);
            this.render();
            return;
        }

        if (owned) {
            if (!equipped) {
                player.armor = new Armor(type);
                this.render();
            }
        } else {
            // Try to buy
            const price = ArmorData[type].price;
            if (player.inventory.spendCoins(price)) {
                player.ownedArmor.push(type);
                player.armor = new Armor(type);
                this.render();
            }
        }
    }

    upgradeDamage() {
        const player = this.game.player;
        const price = player.weapon.damageUpgradePrice;

        if (player.inventory.spendCoins(price)) {
            player.weapon.upgradeDamage();
            this.render();
        }
    }

    upgradeRange() {
        const player = this.game.player;
        const price = player.weapon.rangeUpgradePrice;

        if (player.inventory.spendCoins(price)) {
            player.weapon.upgradeRange();
            this.render();
        }
    }

    upgradeDefense() {
        const player = this.game.player;
        const price = player.armor.defenseUpgradePrice;

        if (player.inventory.spendCoins(price)) {
            player.armor.upgradeDefense();
            this.render();
        }
    }

    combineWeapon(type) {
        const player = this.game.player;

        if (player.inventory.combineWeaponFragments(type)) {
            player.ownedWeapons.push(type);
            this.render();
        }
    }

    combineArmor(type) {
        const player = this.game.player;

        if (player.inventory.combineArmorFragments(type)) {
            player.ownedArmor.push(type);
            this.render();
        }
    }

    onContinue() {
        this.close();
        this.game.nextLevel();
    }
}
