// Enemy spawner system

class Spawner {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        // Spawn settings
        this.spawnInterval = 5000; // ms between spawns
        this.spawnTimer = 0;
        this.minSpawnInterval = 2000; // Minimum spawn interval

        // Difficulty scaling
        this.difficultyMultiplier = 1;
        this.baseEnemiesPerSpawn = 1;
        this.maxEnemiesPerSpawn = 2;

        // Enemy type weights
        this.zombieWeight = 0.6;
        this.skeletonWeight = 0.4;

        // Game time tracking (for difficulty scaling)
        this.gameTime = 0;
        this.roundDuration = 60000; // 1 minute in ms

        // Boss spawned flag
        this.bossSpawned = false;
    }

    reset() {
        this.spawnTimer = 0;
        this.gameTime = 0;
        this.difficultyMultiplier = 1;
        this.bossSpawned = false;
        this.spawnInterval = 3000;
    }

    update(deltaTime, currentLevel) {
        this.gameTime += deltaTime;

        // Scale difficulty over time (reduced scaling)
        const timeProgress = this.gameTime / this.roundDuration;
        this.difficultyMultiplier = 1 + timeProgress * 0.5; // Up to 1.5x difficulty at end

        // Decrease spawn interval over time (less aggressive)
        this.spawnInterval = Math.max(
            this.minSpawnInterval,
            5000 - timeProgress * 1000
        );

        // Update spawn timer
        this.spawnTimer += deltaTime;
    }

    shouldSpawn() {
        if (this.bossSpawned) return false; // Stop spawning during boss fight

        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            return true;
        }
        return false;
    }

    getTimeRemaining() {
        return Math.max(0, this.roundDuration - this.gameTime);
    }

    isRoundComplete() {
        return this.gameTime >= this.roundDuration;
    }

    shouldSpawnBoss() {
        return this.isRoundComplete() && !this.bossSpawned;
    }

    spawnEnemies(currentLevel, playerX, playerY) {
        const enemies = [];

        // Calculate how many enemies to spawn
        const baseCount = this.baseEnemiesPerSpawn + Math.floor(this.difficultyMultiplier - 1);
        const count = Math.min(baseCount, this.maxEnemiesPerSpawn);

        for (let i = 0; i < count; i++) {
            const position = this.getSpawnPosition(playerX, playerY);
            const enemy = this.createEnemy(currentLevel, position.x, position.y);
            enemies.push(enemy);
        }

        return enemies;
    }

    getSpawnPosition(playerX, playerY) {
        // Spawn enemies at the edges of the screen, away from the player
        const minDistanceFromPlayer = 200;
        let x, y;
        let attempts = 0;

        do {
            // Choose a random edge
            const edge = Math.floor(Math.random() * 4);
            const margin = 30;

            switch (edge) {
                case 0: // Top
                    x = margin + Math.random() * (this.canvasWidth - margin * 2);
                    y = margin;
                    break;
                case 1: // Right
                    x = this.canvasWidth - margin;
                    y = margin + Math.random() * (this.canvasHeight - margin * 2);
                    break;
                case 2: // Bottom
                    x = margin + Math.random() * (this.canvasWidth - margin * 2);
                    y = this.canvasHeight - margin;
                    break;
                case 3: // Left
                    x = margin;
                    y = margin + Math.random() * (this.canvasHeight - margin * 2);
                    break;
            }

            attempts++;
        } while (
            Collision.distance(x, y, playerX, playerY) < minDistanceFromPlayer &&
            attempts < 10
        );

        return { x, y };
    }

    createEnemy(level, x, y) {
        // Each level introduces new enemy types
        const rand = Math.random();
        const enemies = this.getEnemyTypesForLevel(level);
        const index = Math.floor(rand * enemies.length);
        const EnemyClass = enemies[index];
        return new EnemyClass(x, y, level);
    }

    getEnemyTypesForLevel(level) {
        switch (level) {
            case 1: return [Zombie];
            case 2: return [Zombie, Skeleton];
            case 3: return [Zombie, Skeleton, Ghost];
            case 4: return [Skeleton, Ghost, Demon];
            case 5: return [Ghost, Demon, Vampire];
            case 6: return [Demon, Vampire, Wraith];
            case 7: return [Vampire, Wraith, Golem];
            case 8: return [Wraith, Golem, Banshee];
            case 9: return [Golem, Banshee, Reaper];
            case 10:
            default: return [Banshee, Reaper, Elemental, Wraith];
        }
    }

    spawnBoss(level, canvasWidth, canvasHeight) {
        this.bossSpawned = true;

        // Spawn boss in center of arena
        const x = canvasWidth / 2;
        const y = canvasHeight / 2;

        switch (level) {
            case 1: return new GiantZombie(x, y, level);
            case 2: return new SkeletonKing(x, y, level);
            case 3: return new Necromancer(x, y, level);
            case 4: return new DemonLord(x, y, level);
            case 5: return new VampireKing(x, y, level);
            case 6: return new LichKing(x, y, level);
            case 7: return new GolemKing(x, y, level);
            case 8: return new BansheeQueen(x, y, level);
            case 9: return new DeathKnight(x, y, level);
            case 10:
            default: return new Apocalypse(x, y, level);
        }
    }

    getBossName(level) {
        switch (level) {
            case 1: return 'Giant Zombie';
            case 2: return 'Skeleton King';
            case 3: return 'Necromancer';
            case 4: return 'Demon Lord';
            case 5: return 'Vampire King';
            case 6: return 'Lich King';
            case 7: return 'Golem King';
            case 8: return 'Banshee Queen';
            case 9: return 'Death Knight';
            case 10:
            default: return 'The Apocalypse';
        }
    }
}
