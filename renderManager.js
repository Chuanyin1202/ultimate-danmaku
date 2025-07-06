// 渲染管理器 - 統一管理所有渲染邏輯
import { GameConfig, GameUtils } from './gameConfig.js';

export class RenderManager {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.renderLayers = this.initializeRenderLayers();
    }

    // 初始化渲染層級
    initializeRenderLayers() {
        return {
            background: this.drawBackground.bind(this),
            effects: this.drawEffects.bind(this),
            powerUps: this.drawPowerUps.bind(this),
            particles: this.drawParticles.bind(this),
            bullets: this.drawBullets.bind(this),
            enemyBullets: this.drawEnemyBullets.bind(this),
            enemies: this.drawEnemies.bind(this),
            bosses: this.drawBosses.bind(this),
            drones: this.drawDrones.bind(this),
            player: this.drawPlayer.bind(this),
            ui: this.drawUI.bind(this)
        };
    }

    // 主要渲染方法
    draw() {
        // 清除畫布
        this.clearCanvas();
        
        // 保存畫布狀態
        this.ctx.save();
        
        // 應用螢幕震動效果
        if (this.game.shakeDuration > 0) {
            this.applyScreenShake();
        }
        
        // 渲染背景
        this.renderLayer('background');
        
        // 如果遊戲未開始或暫停，只渲染背景
        if (!this.game.started || this.game.paused) {
            this.ctx.restore();
            return;
        }
        
        // 渲染遊戲物件（按層級順序）
        this.renderLayer('effects');
        this.renderLayer('powerUps');
        this.renderLayer('particles');
        this.renderLayer('bullets');
        this.renderLayer('enemyBullets');
        this.renderLayer('enemies');
        this.renderLayer('bosses');
        this.renderLayer('drones');
        this.renderLayer('player');
        
        // 恢復畫布狀態
        this.ctx.restore();
        
        // 渲染UI（不受震動影響）
        this.renderLayer('ui');
    }

    // 渲染指定層級
    renderLayer(layerName) {
        const renderFunc = this.renderLayers[layerName];
        if (renderFunc) {
            renderFunc();
        }
    }

    // 清除畫布
    clearCanvas() {
        this.ctx.fillStyle = 'rgba(15, 20, 25, 0.3)';
        this.ctx.fillRect(0, 0, this.game.w, this.game.h);
    }

    // 應用螢幕震動
    applyScreenShake() {
        const shakeX = (Math.random() - 0.5) * this.game.shakeMagnitude;
        const shakeY = (Math.random() - 0.5) * this.game.shakeMagnitude;
        this.ctx.translate(shakeX, shakeY);
    }

    // 渲染背景
    drawBackground() {
        this.ctx.save();
        
        // 渲染星雲
        this.game.nebula.forEach(nebula => {
            nebula.y += nebula.speed;
            nebula.x += Math.cos(nebula.drift);
            
            if (nebula.y > this.game.h + nebula.size) {
                nebula.y = -nebula.size;
                nebula.x = Math.random() * this.game.w;
            }
            
            const grad = this.ctx.createRadialGradient(
                nebula.x, nebula.y, nebula.size * 0.1,
                nebula.x, nebula.y, nebula.size
            );
            grad.addColorStop(0, nebula.color.replace('0.1', '0.3'));
            grad.addColorStop(1, nebula.color);
            
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(0, 0, this.game.w, this.game.h);
        });
        
        // 渲染星星
        this.game.bgStars.forEach(star => {
            star.y += star.speed * (this.game.slowMotion ? 0.3 : 1);
            star.twinkle += star.twinkleSpeed;
            
            if (star.y > this.game.h) {
                star.y = 0;
                star.x = Math.random() * this.game.w;
            }
            
            this.ctx.globalAlpha = 0.5 + Math.sin(star.twinkle) * 0.5;
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        });
        
        this.ctx.restore();
    }

    // 渲染特效
    drawEffects() {
        // 渲染慢動作覆蓋層等特效
        if (this.game.slowMotion) {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0, 100, 255, 0.1)';
            this.ctx.fillRect(0, 0, this.game.w, this.game.h);
            this.ctx.restore();
        }
    }

    // 渲染道具
    drawPowerUps() {
        this.game.powerUps.forEach(powerUp => {
            this.drawPowerUp(powerUp);
        });
    }

    // 渲染單個道具
    drawPowerUp(powerUp) {
        this.ctx.save();
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = '#ffd700';
        this.ctx.shadowBlur = 20;
        this.ctx.fillText(powerUp.symbol, powerUp.x, powerUp.y);
        this.ctx.restore();
    }

    // 渲染粒子
    drawParticles() {
        this.game.particlePool.getActiveObjects().forEach(particle => {
            this.drawParticle(particle);
        });
    }

    // 渲染單個粒子
    drawParticle(particle) {
        this.ctx.save();
        this.ctx.globalAlpha = particle.life / 50;
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    // 渲染玩家子彈
    drawBullets() {
        this.game.bulletPool.getActiveObjects().forEach(bullet => {
            this.drawBullet(bullet);
        });
    }

    // 渲染單個玩家子彈
    drawBullet(bullet) {
        this.ctx.save();
        
        if (bullet.type === 'wave') {
            this.drawWaveBullet(bullet);
        } else if (bullet.type === 'flame') {
            this.drawFlameBullet(bullet);
        } else {
            this.drawNormalBullet(bullet);
        }
        
        this.ctx.restore();
    }

    // 渲染波動子彈
    drawWaveBullet(bullet) {
        this.ctx.strokeStyle = `rgba(233, 213, 255, ${bullet.life / 90 * 0.8})`;
        this.ctx.lineWidth = 10;
        this.ctx.shadowColor = '#e9d5ff';
        this.ctx.shadowBlur = 30;
        this.ctx.beginPath();
        this.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    // 渲染火焰子彈
    drawFlameBullet(bullet) {
        const grad = this.ctx.createRadialGradient(bullet.x, bullet.y, 0, bullet.x, bullet.y, bullet.w);
        grad.addColorStop(0, `rgba(255, 200, 100, ${bullet.life / 30})`);
        grad.addColorStop(1, `rgba(255, 100, 50, 0)`);
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(bullet.x, bullet.y, bullet.w, 0, Math.PI * 2);
        this.ctx.fill();
    }

    // 渲染普通子彈
    drawNormalBullet(bullet) {
        this.ctx.fillStyle = this.game.player.weapon.color;
        this.ctx.shadowColor = this.game.player.weapon.color;
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.arc(bullet.x, bullet.y, bullet.w / 2, 0, Math.PI * 2);
        this.ctx.fill();
    }

    // 渲染敵人子彈
    drawEnemyBullets() {
        this.game.enemyBulletPool.getActiveObjects().forEach(bullet => {
            this.drawEnemyBullet(bullet);
        });
    }

    // 渲染單個敵人子彈
    drawEnemyBullet(bullet) {
        this.ctx.save();
        this.ctx.fillStyle = bullet.color;
        this.ctx.shadowColor = bullet.color;
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.arc(bullet.x, bullet.y, bullet.w / 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    // 渲染敵人
    drawEnemies() {
        this.game.enemyPool.getActiveObjects().forEach(enemy => {
            this.drawEnemy(enemy);
        });
    }

    // 渲染Boss
    drawBosses() {
        this.game.bosses.forEach(boss => {
            this.drawEnemy(boss);
        });
    }

    // 渲染單個敵人/Boss
    drawEnemy(enemy) {
        this.ctx.save();
        
        // 受傷閃爍效果
        if (enemy.hitTimer > 0) {
            this.ctx.filter = 'brightness(2)';
        }
        
        // 渲染敵人主體
        this.ctx.fillStyle = enemy.color;
        this.ctx.shadowColor = enemy.color;
        this.ctx.shadowBlur = 20;
        this.ctx.fillRect(enemy.x - enemy.w / 2, enemy.y - enemy.h / 2, enemy.w, enemy.h);
        
        this.ctx.restore();
        
        // 渲染血條
        this.drawHealthBar(enemy);
    }

    // 渲染血條
    drawHealthBar(enemy) {
        const hpPercent = enemy.hp / enemy.maxHp;
        
        // 背景
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(enemy.x - enemy.w / 2, enemy.y - enemy.h / 2 - 10, enemy.w, 5);
        
        // 血條
        this.ctx.fillStyle = hpPercent > 0.5 ? '#4CAF50' : hpPercent > 0.25 ? '#FFC107' : '#F44336';
        this.ctx.fillRect(enemy.x - enemy.w / 2, enemy.y - enemy.h / 2 - 10, enemy.w * hpPercent, 5);
    }

    // 渲染無人機
    drawDrones() {
        this.game.drones.forEach(drone => {
            drone.draw(this.ctx);
        });
    }

    // 渲染玩家
    drawPlayer() {
        this.game.player.draw(this.ctx);
    }

    // 渲染UI
    drawUI() {
        // UI渲染由UIManager處理，這裡可以添加遊戲內的UI元素
        this.drawCrosshair();
        this.drawMiniMap();
    }

    // 渲染準星
    drawCrosshair() {
        if (!this.game.started || this.game.gameOver) return;
        
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        const { x, y } = this.game.touchPos;
        const size = 20;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x - size, y);
        this.ctx.lineTo(x + size, y);
        this.ctx.moveTo(x, y - size);
        this.ctx.lineTo(x, y + size);
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    // 渲染小地圖
    drawMiniMap() {
        if (!this.game.started || this.game.gameOver) return;
        
        const mapSize = 120;
        const mapX = this.game.w - mapSize - 230; // 調整位置避免與血條重疊
        const mapY = 15;
        const scale = mapSize / Math.max(this.game.w, this.game.h);
        
        this.ctx.save();
        
        // 地圖背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(mapX, mapY, mapSize, mapSize);
        
        // 地圖邊框
        this.ctx.strokeStyle = 'rgba(0, 212, 255, 0.6)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(mapX, mapY, mapSize, mapSize);
        
        // 添加發光效果
        this.ctx.shadowColor = 'rgba(0, 212, 255, 0.3)';
        this.ctx.shadowBlur = 10;
        this.ctx.strokeRect(mapX, mapY, mapSize, mapSize);
        this.ctx.shadowBlur = 0;
        
        // 玩家位置
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(
            mapX + this.game.player.x * scale - 1,
            mapY + this.game.player.y * scale - 1,
            2, 2
        );
        
        // 敵人位置
        this.ctx.fillStyle = '#ff0000';
        this.game.enemyPool.getActiveObjects().forEach(enemy => {
            this.ctx.fillRect(
                mapX + enemy.x * scale - 1,
                mapY + enemy.y * scale - 1,
                1, 1
            );
        });
        
        // Boss位置
        this.ctx.fillStyle = '#ff00ff';
        this.game.bosses.forEach(boss => {
            this.ctx.fillRect(
                mapX + boss.x * scale - 2,
                mapY + boss.y * scale - 2,
                4, 4
            );
        });
        
        this.ctx.restore();
    }

    // 渲染調試信息
    drawDebugInfo() {
        if (!this.game.debug) return;
        
        this.ctx.save();
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';
        
        const debugInfo = [
            `FPS: ${Math.round(1000 / (performance.now() - this.lastFrameTime))}`,
            `Objects: ${this.game.bulletPool.getActiveObjects().length + this.game.enemyPool.getActiveObjects().length}`,
            `Position: (${Math.round(this.game.player.x)}, ${Math.round(this.game.player.y)})`,
            `Score: ${this.game.score}`,
            `Level: ${this.game.level}`
        ];
        
        debugInfo.forEach((info, index) => {
            this.ctx.fillText(info, 10, 20 + index * 15);
        });
        
        this.ctx.restore();
        this.lastFrameTime = performance.now();
    }

    // 設置渲染品質
    setRenderQuality(quality) {
        switch (quality) {
            case 'low':
                this.ctx.imageSmoothingEnabled = false;
                break;
            case 'medium':
                this.ctx.imageSmoothingEnabled = true;
                break;
            case 'high':
                this.ctx.imageSmoothingEnabled = true;
                this.ctx.imageSmoothingQuality = 'high';
                break;
        }
    }

    // 截圖功能
    takeScreenshot() {
        const canvas = this.game.canvas;
        const link = document.createElement('a');
        link.download = `danmaku_screenshot_${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
    }
}