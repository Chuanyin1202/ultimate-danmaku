// 敵人行為系統 - 統一管理敵人移動和射擊行為
import { GameConfig, GameUtils } from './gameConfig.js';

export class EnemyBehaviorSystem {
    constructor(game) {
        this.game = game;
        this.movementStrategies = this.initializeMovementStrategies();
        this.shootingStrategies = this.initializeShootingStrategies();
    }

    // 初始化移動策略
    initializeMovementStrategies() {
        return {
            straight: this.moveEnemyStraight.bind(this),
            circle: this.moveEnemyCircle.bind(this),
            sine: this.moveEnemySineWave.bind(this),
            chase: this.moveEnemyChase.bind(this)
        };
    }

    // 初始化射擊策略
    initializeShootingStrategies() {
        return {
            straight: this.shootStraight.bind(this),
            circle: this.shootCircular.bind(this),
            spread: this.shootSpread.bind(this),
            boss: this.shootBoss.bind(this)
        };
    }

    // 更新敵人行為
    updateEnemyBehavior(enemy) {
        this.updateEnemyMovement(enemy);
        this.updateEnemyShooting(enemy);
        this.updateEnemyState(enemy);
    }

    // 更新Boss行為
    updateBossBehavior(boss) {
        this.updateBossMovement(boss);
        this.updateBossShooting(boss);
        this.updateBossState(boss);
    }

    // 更新敵人移動
    updateEnemyMovement(enemy) {
        // 更新追蹤目標
        enemy.chaseUpdateTimer++;
        if (enemy.chaseUpdateTimer >= 60) {
            enemy.chaseUpdateTimer = 0;
            enemy.targetX = this.game.player.x;
            enemy.targetY = this.game.player.y;
        }

        // 根據移動模式執行移動
        const moveStrategy = this.movementStrategies[enemy.pattern];
        if (moveStrategy) {
            moveStrategy(enemy);
        }
    }

    // 更新敵人射擊
    updateEnemyShooting(enemy) {
        if (Math.random() < 0.02) { // 2% 機率射擊
            this.enemyShoot(enemy);
        }
    }

    // 更新敵人狀態
    updateEnemyState(enemy) {
        if (enemy.hitTimer > 0) {
            enemy.hitTimer--;
        }
    }

    // 更新Boss移動
    updateBossMovement(boss) {
        if (boss.y < 100) {
            boss.y += boss.speed;
        } else {
            boss.chaseUpdateTimer++;
            if (boss.chaseUpdateTimer >= 60) {
                boss.chaseUpdateTimer = 0;
                boss.targetX = this.game.player.x;
                boss.targetY = this.game.player.y;
            }
            this.moveEnemyChase(boss);
        }
    }

    // 更新Boss射擊
    updateBossShooting(boss) {
        this.bossShoot(boss);
    }

    // 更新Boss狀態
    updateBossState(boss) {
        if (boss.hitTimer > 0) {
            boss.hitTimer--;
        }
        boss.phaseTimer++;
    }

    // 移動策略：直線追蹤
    moveEnemyStraight(enemy) {
        this.moveEnemyChase(enemy);
    }

    // 移動策略：圓形追蹤
    moveEnemyCircle(enemy) {
        this.moveEnemyChase(enemy);
    }

    // 移動策略：正弦波移動
    moveEnemySineWave(enemy) {
        const dx = enemy.targetX - enemy.x;
        const dy = enemy.targetY - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const mainMoveX = (dx / distance) * enemy.chaseSpeed * 0.7;
            const mainMoveY = (dy / distance) * enemy.chaseSpeed * 0.7;
            
            enemy.movementTimer += 0.1;
            const sineOffset = Math.sin(enemy.movementTimer) * 2;
            const perpX = -dy / distance * sineOffset;
            const perpY = dx / distance * sineOffset;
            
            enemy.x += mainMoveX + perpX;
            enemy.y += mainMoveY + perpY;
        }
    }

    // 移動策略：追蹤移動
    moveEnemyChase(enemy) {
        const dx = enemy.targetX - enemy.x;
        const dy = enemy.targetY - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            enemy.x += (dx / distance) * enemy.chaseSpeed;
            enemy.y += (dy / distance) * enemy.chaseSpeed;
        }
    }

    // 敵人射擊
    enemyShoot(enemy) {
        const now = Date.now();
        const cooldown = GameConfig.shootingConfig[`enemy_${enemy.pattern}`]?.cooldown || 2500;
        
        if (now - enemy.lastShot < cooldown) return;
        enemy.lastShot = now;

        const shootStrategy = this.shootingStrategies[enemy.pattern];
        if (shootStrategy) {
            shootStrategy(enemy);
        }
    }

    // Boss射擊
    bossShoot(boss) {
        const now = Date.now();
        const cooldown = GameConfig.shootingConfig.boss.cooldown;
        
        if (now - boss.lastShot < cooldown) return;
        boss.lastShot = now;

        this.shootingStrategies.boss(boss);
    }

    // 射擊策略：直線射擊
    shootStraight(enemy) {
        const angle = GameUtils.calculateAngle(enemy.x, enemy.y, this.game.player.x, this.game.player.y);
        const bullet = this.game.enemyBulletPool.get();
        
        Object.assign(bullet, {
            x: enemy.x + enemy.w / 2,
            y: enemy.y + enemy.h / 2,
            vx: Math.cos(angle) * 5,
            vy: Math.sin(angle) * 5,
            w: 8,
            h: 8,
            color: enemy.color,
            life: 300
        });
    }

    // 射擊策略：圓形散射
    shootCircular(enemy) {
        const bulletCount = 8;
        for (let i = 0; i < bulletCount; i++) {
            const angle = (Math.PI * 2 / bulletCount) * i + enemy.angle;
            const bullet = this.game.enemyBulletPool.get();
            
            Object.assign(bullet, {
                x: enemy.x + enemy.w / 2,
                y: enemy.y + enemy.h / 2,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                w: 6,
                h: 6,
                color: enemy.color,
                life: 300
            });
        }
        enemy.angle += 0.5;
    }

    // 射擊策略：散射
    shootSpread(enemy) {
        const bulletCount = 3;
        const baseAngle = GameUtils.calculateAngle(enemy.x, enemy.y, this.game.player.x, this.game.player.y);
        const spreadAngle = Math.PI / 6; // 30度散射角
        
        for (let i = 0; i < bulletCount; i++) {
            const angle = baseAngle + (i - 1) * spreadAngle / (bulletCount - 1);
            const bullet = this.game.enemyBulletPool.get();
            
            Object.assign(bullet, {
                x: enemy.x + enemy.w / 2,
                y: enemy.y + enemy.h / 2,
                vx: Math.cos(angle) * 4,
                vy: Math.sin(angle) * 4,
                w: 6,
                h: 6,
                color: enemy.color,
                life: 300
            });
        }
    }

    // 射擊策略：Boss螺旋射擊
    shootBoss(boss) {
        const bulletCount = 3;
        for (let i = 0; i < bulletCount; i++) {
            const angle = (Math.PI * 2 / 12) * boss.phaseTimer + (i * Math.PI * 0.5);
            const bullet = this.game.enemyBulletPool.get();
            
            Object.assign(bullet, {
                x: boss.x + boss.w / 2,
                y: boss.y + boss.h / 2,
                vx: Math.cos(angle) * 4,
                vy: Math.sin(angle) * 4,
                w: 10,
                h: 10,
                color: boss.color,
                life: 400
            });
        }
    }

    // 生成敵人
    spawnEnemyAtPosition(x, y, enemyType) {
        const typeConfig = GameConfig.enemyTypes[enemyType];
        if (!typeConfig) return;

        const enemy = this.game.enemyPool.get();
        Object.assign(enemy, {
            x, y,
            targetX: this.game.player.x,
            targetY: this.game.player.y,
            chaseUpdateTimer: 0,
            ...typeConfig,
            maxHp: typeConfig.hp,
            hp: typeConfig.hp,
            lastShot: Date.now(),
            angle: 0,
            hitTimer: 0
        });
    }

    // 生成Boss
    spawnBoss() {
        const bossConfig = GameConfig.bossConfig;
        this.game.currentBoss = {
            x: this.game.w / 2,
            y: -120,
            ...bossConfig,
            maxHp: bossConfig.hp,
            lastShot: 0,
            angle: 0,
            phase: 1,
            hitTimer: 0,
            phaseTimer: 0,
            targetX: this.game.player.x,
            targetY: this.game.player.y,
            chaseUpdateTimer: 0
        };
        
        this.game.bosses.push(this.game.currentBoss);
        this.game.uiManager.bossHealthBar.style.display = 'block';
    }

    // 特殊行為：群體移動
    updateSwarmBehavior(enemies) {
        const swarmCenter = this.calculateSwarmCenter(enemies);
        const avoidanceRadius = 50;
        
        enemies.forEach(enemy => {
            // 計算群體凝聚力
            const cohesionForce = this.calculateCohesion(enemy, swarmCenter);
            
            // 計算分離力
            const separationForce = this.calculateSeparation(enemy, enemies, avoidanceRadius);
            
            // 計算對齊力
            const alignmentForce = this.calculateAlignment(enemy, enemies);
            
            // 綜合力量
            const totalForceX = cohesionForce.x + separationForce.x + alignmentForce.x;
            const totalForceY = cohesionForce.y + separationForce.y + alignmentForce.y;
            
            // 應用力量（可以調整權重）
            enemy.x += totalForceX * 0.1;
            enemy.y += totalForceY * 0.1;
        });
    }

    // 計算群體中心
    calculateSwarmCenter(enemies) {
        if (enemies.length === 0) return { x: 0, y: 0 };
        
        const totalX = enemies.reduce((sum, enemy) => sum + enemy.x, 0);
        const totalY = enemies.reduce((sum, enemy) => sum + enemy.y, 0);
        
        return {
            x: totalX / enemies.length,
            y: totalY / enemies.length
        };
    }

    // 計算凝聚力
    calculateCohesion(enemy, center) {
        const dx = center.x - enemy.x;
        const dy = center.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return { x: 0, y: 0 };
        
        return {
            x: (dx / distance) * 0.5,
            y: (dy / distance) * 0.5
        };
    }

    // 計算分離力
    calculateSeparation(enemy, neighbors, radius) {
        let forceX = 0;
        let forceY = 0;
        let count = 0;
        
        neighbors.forEach(neighbor => {
            if (neighbor === enemy) return;
            
            const distance = GameUtils.calculateDistance(enemy.x, enemy.y, neighbor.x, neighbor.y);
            if (distance < radius && distance > 0) {
                const dx = enemy.x - neighbor.x;
                const dy = enemy.y - neighbor.y;
                forceX += dx / distance;
                forceY += dy / distance;
                count++;
            }
        });
        
        if (count === 0) return { x: 0, y: 0 };
        
        return {
            x: forceX / count,
            y: forceY / count
        };
    }

    // 計算對齊力
    calculateAlignment(enemy, neighbors) {
        let avgVelX = 0;
        let avgVelY = 0;
        let count = 0;
        
        neighbors.forEach(neighbor => {
            if (neighbor === enemy) return;
            
            const distance = GameUtils.calculateDistance(enemy.x, enemy.y, neighbor.x, neighbor.y);
            if (distance < 100) {
                avgVelX += neighbor.vx || 0;
                avgVelY += neighbor.vy || 0;
                count++;
            }
        });
        
        if (count === 0) return { x: 0, y: 0 };
        
        return {
            x: avgVelX / count,
            y: avgVelY / count
        };
    }
}