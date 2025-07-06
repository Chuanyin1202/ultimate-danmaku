// 📄 waveManager.js

export default class WaveManager {
    constructor(game) {
        this.game = game;
        this.reset();
    }

    reset() {
        this.spawnTimer = 0;
        this.baseSpawnRate = 120;
        this.currentSpawnRate = 120;
        this.maxEnemies = 60;
        this.difficultyTimer = 0;
        this.spawnDistance = 60;
        this.startTime = Date.now();
        this.bossSpawned = false;
    }

    update() {
        this.updateDifficulty();
        this.spawnTimer--;

        const activeEnemies = this.game.enemyPool.getActiveObjects().length;
        if (this.spawnTimer <= 0 && activeEnemies < this.maxEnemies) {
            this.spawnEnemyFromEdge();
            this.spawnTimer = this.currentSpawnRate;
        }
    }

    updateDifficulty() {
        this.difficultyTimer++;
        if (this.difficultyTimer >= 1800) { // 每 30 秒提升一次難度
            this.difficultyTimer = 0;
            this.currentSpawnRate = Math.max(20, this.currentSpawnRate - 8);
            this.maxEnemies = Math.min(120, this.maxEnemies + 8);

            console.log(`難度提升！生成間隔: ${this.currentSpawnRate.toFixed(2)}, 最大敵人: ${this.maxEnemies}`);
        }

        const survivalMinutes = Math.floor((Date.now() - this.startTime) / 60000);
        if (survivalMinutes >= 2 && !this.bossSpawned) {
             this.game.spawnBoss();
             this.bossSpawned = true;
        }
    }

    spawnEnemyFromEdge() {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        switch(side) {
            case 0: x = Math.random() * this.game.w; y = -this.spawnDistance; break; // Top
            case 1: x = this.game.w + this.spawnDistance; y = Math.random() * this.game.h; break; // Right
            case 2: x = Math.random() * this.game.w; y = this.game.h + this.spawnDistance; break; // Bottom
            case 3: x = -this.spawnDistance; y = Math.random() * this.game.h; break; // Left
        }
        const enemyTypes = ['straight', 'straight', 'straight', 'sine', 'circle'];
        const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        this.game.spawnEnemyAtPosition(x, y, randomType);
    }
}