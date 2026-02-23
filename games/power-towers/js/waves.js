// Wave management system - Harder difficulty with more bosses

class WaveManager {
    constructor() {
        this.currentWave = 0;
        this.totalWaves = 50;
        this.enemiesRemaining = 0;
        this.isWaveActive = false;
        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.spawnInterval = 600; // Faster spawns
        this.bonusGiven = false;
    }

    getWaveData(waveNumber) {
        const wave = {
            enemies: [],
            spawnInterval: Math.max(250, 600 - waveNumber * 8) // Gets faster
        };

        // Difficulty multiplier scales harder in late game
        const multiplier = 1 + (waveNumber - 1) * 0.18 + (waveNumber > 30 ? (waveNumber - 30) * 0.1 : 0);

        // Final boss wave 50 - Ultimate challenge with ALL boss types
        if (waveNumber === 50) {
            // The ultimate boss gauntlet
            wave.enemies.push({ type: EnemyTypes.MECH, count: 1, multiplier: multiplier * 2.5 }); // Final boss: War Mech
            wave.enemies.push({ type: EnemyTypes.TITAN, count: 1, multiplier: multiplier * 2 });
            wave.enemies.push({ type: EnemyTypes.NECROMANCER, count: 1, multiplier: multiplier * 2 });
            wave.enemies.push({ type: EnemyTypes.BERSERKER, count: 2, multiplier: multiplier * 1.8 });
            wave.enemies.push({ type: EnemyTypes.WARLORD, count: 2, multiplier: multiplier * 1.8 });
            wave.enemies.push({ type: EnemyTypes.BOSS, count: 3, multiplier: multiplier * 1.5 });
            wave.enemies.push({ type: EnemyTypes.JUGGERNAUT, count: 5, multiplier: multiplier * 1.5 });
            wave.enemies.push({ type: EnemyTypes.TANK, count: 10, multiplier: multiplier * 1.5 });
            wave.enemies.push({ type: EnemyTypes.HEALER, count: 6, multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.SHIELD, count: 8, multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.FAST, count: 15, multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.SPRINTER, count: 10, multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.STEALTH, count: 6, multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.BOMBER, count: 8, multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.SWARM, count: 30, multiplier: multiplier });
            return wave;
        }

        // Big boss every 10 waves - different boss each time!
        if (waveNumber % 10 === 0) {
            // Different boss type for each milestone wave
            let bossType;
            switch (waveNumber) {
                case 10:
                    bossType = EnemyTypes.WARLORD; // Summons minions
                    break;
                case 20:
                    bossType = EnemyTypes.BERSERKER; // Gets stronger when damaged
                    break;
                case 30:
                    bossType = EnemyTypes.TITAN; // Massive tank with shockwaves
                    break;
                case 40:
                    bossType = EnemyTypes.NECROMANCER; // Heals and raises dead
                    break;
                default:
                    bossType = EnemyTypes.BOSS;
            }

            const bossCount = Math.floor(waveNumber / 20) + 1;
            wave.enemies.push({ type: bossType, count: bossCount, multiplier: multiplier * 1.5 });

            // Add a Commander as secondary boss on later waves
            if (waveNumber >= 20) {
                wave.enemies.push({ type: EnemyTypes.BOSS, count: 1, multiplier: multiplier * 1.2 });
            }

            wave.enemies.push({ type: EnemyTypes.TANK, count: 4 + Math.floor(waveNumber / 10), multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.HEALER, count: 3 + Math.floor(waveNumber / 15), multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.SHIELD, count: 2 + Math.floor(waveNumber / 15), multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.BASIC, count: 8, multiplier: multiplier });
            // Add juggernauts in later boss waves
            if (waveNumber >= 30) {
                wave.enemies.push({ type: EnemyTypes.JUGGERNAUT, count: Math.floor(waveNumber / 20), multiplier: multiplier });
            }
            // Add stealth units to boss waves
            if (waveNumber >= 20) {
                wave.enemies.push({ type: EnemyTypes.STEALTH, count: 2 + Math.floor(waveNumber / 20), multiplier: multiplier });
            }
            return wave;
        }

        // Mini-boss every 5 waves
        if (waveNumber % 5 === 0) {
            wave.enemies.push({ type: EnemyTypes.TANK, count: 2 + Math.floor(waveNumber / 15), multiplier: multiplier * 2 });
            wave.enemies.push({ type: EnemyTypes.HEALER, count: 2 + Math.floor(waveNumber / 20), multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.BASIC, count: 6, multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.FAST, count: 4 + Math.floor(waveNumber / 10), multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.SPRINTER, count: 2 + Math.floor(waveNumber / 15), multiplier: multiplier });
            // Add bombers to mini-boss waves after wave 15
            if (waveNumber >= 15) {
                wave.enemies.push({ type: EnemyTypes.BOMBER, count: 2 + Math.floor(waveNumber / 20), multiplier: multiplier });
            }
            // Add shield bearers after wave 25
            if (waveNumber >= 25) {
                wave.enemies.push({ type: EnemyTypes.SHIELD, count: 2 + Math.floor(waveNumber / 25), multiplier: multiplier });
            }
            return wave;
        }

        // Regular waves
        const baseCount = 8 + Math.floor(waveNumber * 0.7);

        if (waveNumber <= 2) {
            wave.enemies.push({ type: EnemyTypes.BASIC, count: baseCount, multiplier: multiplier });
        } else if (waveNumber <= 4) {
            wave.enemies.push({ type: EnemyTypes.BASIC, count: Math.floor(baseCount * 0.6), multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.FAST, count: Math.floor(baseCount * 0.4), multiplier: multiplier });
        } else if (waveNumber <= 7) {
            wave.enemies.push({ type: EnemyTypes.BASIC, count: Math.floor(baseCount * 0.4), multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.FAST, count: Math.floor(baseCount * 0.3), multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.TANK, count: Math.floor(baseCount * 0.2), multiplier: multiplier });
        } else if (waveNumber <= 12) {
            wave.enemies.push({ type: EnemyTypes.BASIC, count: Math.floor(baseCount * 0.3), multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.FAST, count: Math.floor(baseCount * 0.2), multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.TANK, count: Math.floor(baseCount * 0.15), multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.SWARM, count: Math.floor(baseCount * 1.0), multiplier: multiplier });
            // Introduce sprinters
            wave.enemies.push({ type: EnemyTypes.SPRINTER, count: Math.floor(baseCount * 0.15), multiplier: multiplier });
        } else if (waveNumber <= 20) {
            wave.enemies.push({ type: EnemyTypes.BASIC, count: Math.floor(baseCount * 0.25), multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.FAST, count: Math.floor(baseCount * 0.2), multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.TANK, count: Math.floor(baseCount * 0.2), multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.SWARM, count: Math.floor(baseCount * 0.8), multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.HEALER, count: Math.floor(baseCount * 0.15), multiplier: multiplier });
            // Add shield bearers and bombers
            wave.enemies.push({ type: EnemyTypes.SPRINTER, count: Math.floor(baseCount * 0.1), multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.SHIELD, count: Math.floor(baseCount * 0.1), multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.BOMBER, count: Math.floor(baseCount * 0.1), multiplier: multiplier });
        } else if (waveNumber <= 35) {
            // Mid-late game - add stealth units
            wave.enemies.push({ type: EnemyTypes.BASIC, count: Math.floor(baseCount * 0.2), multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.FAST, count: Math.floor(baseCount * 0.2), multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.TANK, count: Math.floor(baseCount * 0.2), multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.SWARM, count: Math.floor(baseCount * 0.8), multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.HEALER, count: Math.floor(baseCount * 0.15), multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.SPRINTER, count: Math.floor(baseCount * 0.15), multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.SHIELD, count: Math.floor(baseCount * 0.15), multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.STEALTH, count: Math.floor(baseCount * 0.1), multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.BOMBER, count: Math.floor(baseCount * 0.1), multiplier: multiplier });
        } else {
            // Endgame chaos - everything including juggernauts
            wave.enemies.push({ type: EnemyTypes.BASIC, count: Math.floor(baseCount * 0.2), multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.FAST, count: Math.floor(baseCount * 0.25), multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.TANK, count: Math.floor(baseCount * 0.2), multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.SWARM, count: Math.floor(baseCount * 1.0), multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.HEALER, count: Math.floor(baseCount * 0.2), multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.SPRINTER, count: Math.floor(baseCount * 0.2), multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.SHIELD, count: Math.floor(baseCount * 0.15), multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.STEALTH, count: Math.floor(baseCount * 0.15), multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.BOMBER, count: Math.floor(baseCount * 0.15), multiplier: multiplier });
            wave.enemies.push({ type: EnemyTypes.JUGGERNAUT, count: Math.floor(baseCount * 0.08), multiplier: multiplier });
        }

        return wave;
    }

    startWave(waveNumber, path) {
        this.currentWave = waveNumber;
        this.isWaveActive = true;
        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.bonusGiven = false;

        const waveData = this.getWaveData(waveNumber);
        this.spawnInterval = waveData.spawnInterval;

        // Build spawn queue
        for (const group of waveData.enemies) {
            for (let i = 0; i < group.count; i++) {
                this.spawnQueue.push({
                    type: group.type,
                    multiplier: group.multiplier,
                    path: path
                });
            }
        }

        // Shuffle spawn queue for variety (except keep all boss types at end)
        const bossTypes = [
            EnemyTypes.BOSS, EnemyTypes.WARLORD, EnemyTypes.TITAN,
            EnemyTypes.NECROMANCER, EnemyTypes.BERSERKER, EnemyTypes.MECH
        ];
        const bosses = this.spawnQueue.filter(e => bossTypes.includes(e.type));
        const tanks = this.spawnQueue.filter(e => e.type === EnemyTypes.TANK || e.type === EnemyTypes.JUGGERNAUT);
        const others = this.spawnQueue.filter(e => !bossTypes.includes(e.type) && e.type !== EnemyTypes.TANK && e.type !== EnemyTypes.JUGGERNAUT);
        this.shuffleArray(others);
        this.shuffleArray(tanks);
        this.shuffleArray(bosses);
        this.spawnQueue = [...others, ...tanks, ...bosses];

        this.enemiesRemaining = this.spawnQueue.length;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    update(deltaTime, enemies) {
        if (!this.isWaveActive) return null;

        // Spawn enemies from queue
        if (this.spawnQueue.length > 0) {
            this.spawnTimer += deltaTime;

            if (this.spawnTimer >= this.spawnInterval) {
                this.spawnTimer = 0;
                const spawnData = this.spawnQueue.shift();
                return new Enemy(spawnData.type, spawnData.path, spawnData.multiplier);
            }
        }

        // Check if wave is complete
        if (this.spawnQueue.length === 0) {
            const aliveEnemies = enemies.filter(e => !e.isDead && !e.reachedEnd);
            if (aliveEnemies.length === 0) {
                this.isWaveActive = false;
            }
        }

        return null;
    }

    isComplete() {
        return !this.isWaveActive && this.currentWave > 0;
    }

    isGameComplete() {
        return this.currentWave >= this.totalWaves && this.isComplete();
    }

    getWaveBonus() {
        // Bonus gold for completing a wave
        return 15 + this.currentWave * 3;
    }
}
