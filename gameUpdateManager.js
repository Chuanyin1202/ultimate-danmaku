// 遊戲更新管理器 - 統一管理遊戲物件的更新邏輯
import { GameConfig, GameUtils } from './gameConfig.js';

export class GameUpdateManager {
    constructor(game) {
        this.game = game;
    }

    // 主要更新方法
    update(delta) {
        if (!this.game.started || this.game.gameOver || this.game.paused) return;

        this.updateGameState(delta);
        this.updatePlayer(delta);
        this.updateBullets();
        this.updateEnemyBullets();
        this.updateEnemies();
        this.updateBosses();
        this.updatePowerUps();
        this.updateParticles();
        this.updateDrones();
        this.updateTimers();
        this.cleanupInactiveObjects();
        this.updateLevel();
    }

    // 更新遊戲狀態
    updateGameState(delta) {
        if (this.game.shakeDuration > 0) {
            this.game.shakeDuration--;
        }

        if (this.game.slowMotion) {
            this.game.slowTimer--;
            if (this.game.slowTimer <= 0) {
                this.game.slowMotion = false;
                document.getElementById('slowmoOverlay').classList.remove('active');
            }
        }
    }

    // 更新玩家
    updatePlayer(delta) {
        this.game.player.update(delta, this.game.touchPos);
        this.game.autoShoot();
    }

    // 更新玩家子彈
    updateBullets() {
        const bulletsToRelease = [];
        
        this.game.bulletPool.getActiveObjects().forEach(bullet => {
            if (bullet.type === 'wave') {
                bullet.radius += 10;
                // 波動類型子彈的最大半徑限制
                if (bullet.radius > 300) {
                    bulletsToRelease.push(bullet);
                }
            } else {
                bullet.x += bullet.vx;
                bullet.y += bullet.vy;
            }
            
            bullet.life--;
            
            if (bullet.life <= 0 || GameUtils.isOutOfBounds(bullet, this.game.w, this.game.h)) {
                bulletsToRelease.push(bullet);
            }
        });
        
        this.game.bulletPool.releaseAll(bulletsToRelease);
    }

    // 更新敵人子彈
    updateEnemyBullets() {
        const bulletsToRelease = [];
        
        this.game.enemyBulletPool.getActiveObjects().forEach(bullet => {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            bullet.life--;
            
            if (bullet.life <= 0 || GameUtils.isOutOfBounds(bullet, this.game.w, this.game.h)) {
                bulletsToRelease.push(bullet);
            }
        });
        
        this.game.enemyBulletPool.releaseAll(bulletsToRelease);
    }

    // 更新敵人
    updateEnemies() {
        const enemiesToRelease = [];
        
        this.game.enemyPool.getActiveObjects().forEach(enemy => {
            this.game.enemyBehaviorSystem.updateEnemyBehavior(enemy);
            
            if (GameUtils.isOutOfBounds(enemy, this.game.w, this.game.h, 200)) {
                enemiesToRelease.push(enemy);
            }
        });
        
        this.game.enemyPool.releaseAll(enemiesToRelease);
    }

    // 更新Boss
    updateBosses() {
        this.game.bosses.forEach(boss => {
            this.game.enemyBehaviorSystem.updateBossBehavior(boss);
        });
    }

    // 更新道具
    updatePowerUps() {
        this.game.powerUps.forEach(powerUp => {
            powerUp.y += powerUp.speed;
        });
        
        this.game.powerUps = this.game.powerUps.filter(powerUp => 
            powerUp.y < this.game.h + 50
        );
    }

    // 更新粒子效果
    updateParticles() {
        const particlesToRelease = [];
        
        this.game.particlePool.getActiveObjects().forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            
            if (particle.life <= 0) {
                particlesToRelease.push(particle);
            }
        });
        
        this.game.particlePool.releaseAll(particlesToRelease);
    }

    // 更新無人機
    updateDrones() {
        this.game.drones.forEach(drone => {
            drone.update();
        });
    }

    // 更新計時器
    updateTimers() {
        // 連擊計時器
        if (this.game.comboTimer > 0) {
            this.game.comboTimer--;
        } else if (this.game.combo > 0) {
            this.game.resetCombo();
        }

        // 波次管理器更新
        this.game.waveManager.update();
    }

    // 清理非活動物件
    cleanupInactiveObjects() {
        // 這個方法主要用於確保物件池的健康狀態
        // 大部分清理工作已經在各個更新方法中完成
    }

    // 更新等級
    updateLevel() {
        this.game.levelTimer++;
        if (this.game.levelTimer > GameConfig.gameSettings.levelUpTime) {
            this.game.level++;
            this.game.levelTimer = 0;
        }
    }

    // 特殊更新：慢動作效果
    updateSlowMotion() {
        const slowFactor = this.game.slowMotion ? 0.3 : 1.0;
        
        // 這個方法可以用來調整各種時間相關的參數
        // 例如子彈速度、敵人移動速度等
        return slowFactor;
    }

    // 更新遊戲物理
    updatePhysics() {
        // 這裡可以加入重力、摩擦力等物理效果
        // 目前遊戲較為簡單，暫時不需要複雜的物理系統
    }

    // 更新特效
    updateEffects() {
        // 處理各種視覺特效的更新
        // 例如屏幕扭曲、顏色濾鏡等
    }

    // 更新音效
    updateAudio() {
        // 處理音效的播放和管理
        // 例如背景音樂、音效的淡入淡出等
    }

    // 效能監控
    updatePerformance() {
        // 監控遊戲效能
        // 例如 FPS、記憶體使用等
        const activeObjects = {
            bullets: this.game.bulletPool.getActiveObjects().length,
            enemies: this.game.enemyPool.getActiveObjects().length,
            enemyBullets: this.game.enemyBulletPool.getActiveObjects().length,
            particles: this.game.particlePool.getActiveObjects().length,
            powerUps: this.game.powerUps.length,
            drones: this.game.drones.length,
            bosses: this.game.bosses.length
        };
        
        // 可以在這裡添加效能警告邏輯
        const totalObjects = Object.values(activeObjects).reduce((sum, count) => sum + count, 0);
        
        if (totalObjects > 500) {
            console.warn('High object count detected:', totalObjects, activeObjects);
        }
        
        return activeObjects;
    }

    // 暫停更新
    pauseUpdate() {
        // 暫停時需要處理的邏輯
        // 例如暫停音效、停止計時器等
    }

    // 恢復更新
    resumeUpdate() {
        // 恢復時需要處理的邏輯
        // 例如恢復音效、重置計時器等
    }
}