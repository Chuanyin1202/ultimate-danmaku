// 碰撞檢測系統 - 統一管理所有碰撞檢測邏輯
import { GameUtils } from './gameConfig.js';

export class CollisionSystem {
    constructor(game) {
        this.game = game;
    }

    // 主要碰撞檢測方法
    checkAllCollisions() {
        this.checkBulletCollisions();
        this.checkPlayerCollisions();
        this.checkPowerUpCollisions();
    }

    // 子彈與敵人的碰撞檢測
    checkBulletCollisions() {
        const bulletsToRelease = [];
        const activeBullets = this.game.bulletPool.getActiveObjects();
        const activeEnemies = this.game.enemyPool.getActiveObjects();
        const bosses = this.game.bosses;

        activeBullets.forEach(bullet => {
            const targets = [...activeEnemies, ...bosses];
            
            targets.forEach(target => {
                if (this.checkHit(bullet, target)) {
                    this.handleBulletHit(bullet, target, bulletsToRelease);
                }
            });
        });

        this.game.bulletPool.releaseAll(bulletsToRelease);
    }

    // 玩家與敵人/敵人子彈的碰撞檢測
    checkPlayerCollisions() {
        if (this.game.player.invulnerable <= 0) {
            const threats = [
                ...this.game.enemyBulletPool.getActiveObjects(),
                ...this.game.enemyPool.getActiveObjects(),
                ...this.game.bosses
            ];

            threats.forEach(threat => {
                if (this.checkHit(threat, this.game.player)) {
                    this.handlePlayerHit(threat);
                }
            });
        }
    }

    // 道具收集碰撞檢測
    checkPowerUpCollisions() {
        this.game.powerUps.forEach((powerUp, index) => {
            if (this.checkHit(powerUp, this.game.player)) {
                this.handlePowerUpCollection(powerUp);
                this.game.powerUps.splice(index, 1);
            }
        });
    }

    // 基礎碰撞檢測邏輯
    checkHit(obj1, obj2) {
        if (!obj1 || !obj2) return false;
        
        // 特殊處理：波動類型武器
        if (obj1.type === 'wave') {
            return this.checkCircleCollision(obj1, obj2);
        }
        
        // 標準圓形碰撞檢測
        return this.checkCircleCollision(obj1, obj2);
    }

    // 圓形碰撞檢測
    checkCircleCollision(obj1, obj2) {
        const distance = GameUtils.calculateDistance(obj1.x, obj1.y, obj2.x, obj2.y);
        const radius1 = obj1.radius || (obj1.w || 0) / 2;
        const radius2 = obj2.radius || (obj2.w || 0) / 2;
        return distance < radius1 + radius2;
    }

    // 矩形碰撞檢測（備用）
    checkRectCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.w &&
               obj1.x + obj1.w > obj2.x &&
               obj1.y < obj2.y + obj2.h &&
               obj1.y + obj1.h > obj2.y;
    }

    // 處理子彈擊中敵人
    handleBulletHit(bullet, target, bulletsToRelease) {
        // 為持續傷害武器添加傷害免疫機制
        if (bullet.type === 'wave' || bullet.type === 'flame') {
            // 初始化或檢查傷害免疫時間
            if (!target.lastDamageTime) target.lastDamageTime = {};
            if (!target.lastDamageTime[bullet.type]) target.lastDamageTime[bullet.type] = 0;
            
            const now = Date.now();
            const damageInterval = bullet.type === 'wave' ? 200 : 100; // 波動200ms，火焰100ms
            
            if (now - target.lastDamageTime[bullet.type] < damageInterval) {
                return; // 還在免疫時間內，不造成傷害
            }
            
            target.lastDamageTime[bullet.type] = now;
        }
        
        // 造成傷害
        target.hp -= bullet.damage;
        target.hitTimer = 5;

        // 火焰和波動武器不會在擊中時消失
        if (bullet.type !== 'flame' && bullet.type !== 'wave') {
            bulletsToRelease.push(bullet);
        }

        // 敵人死亡處理
        if (target.hp <= 0) {
            this.handleEnemyDeath(target);
        }
    }

    // 處理敵人死亡
    handleEnemyDeath(enemy) {
        // 更新分數和統計
        this.game.score += enemy.points * this.game.multiplier;
        this.game.kills++;
        this.game.data.totalKills++;
        
        // 增加連擊
        this.game.addCombo();
        
        // 生成道具
        this.game.spawnPowerUp(enemy.x, enemy.y);
        
        // 視覺效果
        this.game.addParticles(enemy.x, enemy.y, enemy.color, 15, 1.2);
        this.game.triggerShake(15, 5);
        
        // 處理 Boss 死亡
        if (this.game.bosses.includes(enemy)) {
            this.handleBossDeath(enemy);
        } else {
            this.game.enemyPool.release(enemy);
        }
    }

    // 處理 Boss 死亡
    handleBossDeath(boss) {
        this.game.bosses.splice(this.game.bosses.indexOf(boss), 1);
        this.game.uiManager.bossHealthBar.style.display = 'none';
        this.game.triggerShake(50, 10);
        this.game.currentBoss = null;
    }

    // 處理玩家受傷
    handlePlayerHit(threat) {
        this.game.triggerShake(20, 5);
        
        // 計算傷害
        const damage = threat.hasOwnProperty('hp') ? 30 : 20;
        this.game.player.takeDamage(damage);
        
        // 視覺效果
        this.game.addParticles(this.game.player.x, this.game.player.y, '#ff4757', 10);
        this.game.resetCombo();
        
        // 生命處理
        if (this.game.player.hp <= 0) {
            this.handlePlayerDeath();
        }
    }

    // 處理玩家死亡
    handlePlayerDeath() {
        this.game.lives--;
        if (this.game.lives > 0) {
            // 復活
            this.game.player.hp = this.game.player.maxHp;
            this.game.player.shield = 50;
            this.game.player.invulnerable = 180;
        } else {
            // 遊戲結束
            this.game.endGame();
        }
    }

    // 處理道具收集
    handlePowerUpCollection(powerUp) {
        switch (powerUp.type) {
            case 'health':
                this.game.player.hp = Math.min(this.game.player.maxHp, this.game.player.hp + 50);
                break;
            case 'shield':
                this.game.player.shield = Math.min(this.game.player.maxShield, this.game.player.shield + 50);
                break;
            case 'drone':
                if (this.game.drones.length < 2) {
                    // 動態導入 Drone 類別
                    import('./drone.js').then(module => {
                        const Drone = module.default;
                        this.game.drones.push(new Drone(this.game.drones.length, this.game));
                    });
                }
                break;
        }
        
        // 視覺效果
        this.game.addParticles(powerUp.x, powerUp.y, '#ffd700', 10);
        this.game.player.special = Math.min(100, this.game.player.special + 10);
    }

    // 範圍傷害檢測（用於爆炸等效果）
    checkRadiusDamage(centerX, centerY, radius, damage, excludePlayer = false) {
        const affected = [];
        
        // 檢查敵人
        this.game.enemyPool.getActiveObjects().forEach(enemy => {
            const distance = GameUtils.calculateDistance(centerX, centerY, enemy.x, enemy.y);
            if (distance <= radius) {
                enemy.hp -= damage;
                enemy.hitTimer = 5;
                affected.push(enemy);
            }
        });
        
        // 檢查玩家
        if (!excludePlayer && this.game.player.invulnerable <= 0) {
            const distance = GameUtils.calculateDistance(centerX, centerY, this.game.player.x, this.game.player.y);
            if (distance <= radius) {
                this.game.player.takeDamage(damage);
                affected.push(this.game.player);
            }
        }
        
        return affected;
    }

    // 線性掃射檢測（用於雷射等效果）
    checkLineDamage(x1, y1, x2, y2, width, damage) {
        const affected = [];
        
        this.game.enemyPool.getActiveObjects().forEach(enemy => {
            if (this.isPointNearLine(enemy.x, enemy.y, x1, y1, x2, y2, width)) {
                enemy.hp -= damage;
                enemy.hitTimer = 5;
                affected.push(enemy);
            }
        });
        
        return affected;
    }

    // 檢查點是否靠近線段
    isPointNearLine(px, py, x1, y1, x2, y2, threshold) {
        const lineLength = GameUtils.calculateDistance(x1, y1, x2, y2);
        if (lineLength === 0) return GameUtils.calculateDistance(px, py, x1, y1) <= threshold;
        
        const t = Math.max(0, Math.min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / (lineLength * lineLength)));
        const nearestX = x1 + t * (x2 - x1);
        const nearestY = y1 + t * (y2 - y1);
        
        return GameUtils.calculateDistance(px, py, nearestX, nearestY) <= threshold;
    }
}