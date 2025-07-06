// 重構後的 main.js - 使用模組化架構
import Player from './player.js';
import UIManager from './uiManager.js';
import WaveManager from './waveManager.js';
import Drone from './drone.js';
import { GameConfig, GameUtils } from './gameConfig.js';
import { CollisionSystem } from './collisionSystem.js';
import { GameUpdateManager } from './gameUpdateManager.js';
import { EnemyBehaviorSystem } from './enemyBehaviorSystem.js';
import { RenderManager } from './renderManager.js';

// 物件池類別保持不變
class ObjectPool {
    constructor(objectFactory, initialSize) {
        this.pool = [];
        this.inactivePool = [];
        this.objectFactory = objectFactory;
        for (let i = 0; i < initialSize; i++) {
            const obj = this.objectFactory();
            obj.active = false;
            this.pool.push(obj);
            this.inactivePool.push(obj);
        }
    }

    get() {
        let obj;
        if (this.inactivePool.length > 0) {
            obj = this.inactivePool.pop();
        } else {
            obj = this.objectFactory();
            this.pool.push(obj);
        }
        obj.active = true;
        return obj;
    }

    release(obj) {
        obj.active = false;
        if (!this.inactivePool.includes(obj)) {
            this.inactivePool.push(obj);
        }
    }

    getActiveObjects() {
        return this.pool.filter(obj => obj.active);
    }

    releaseAll(objectsToRelease) {
        objectsToRelease.forEach(obj => {
            if (obj.active) {
                this.release(obj);
            }
        });
    }
}

// 重構後的 Game 類別 - 大幅簡化
class Game {
    constructor() {
        this.setupCore();
        this.setupManagers();
        this.setupGameData();
        this.setupObjectPools();
        this.setupUI();
        this.setupControls();
        this.setupBackground();
        this.initGame();
        this.loop();
    }

    // 核心設置
    setupCore() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        this.playerSelection = {};
        this.touchPos = { x: 0, y: 0 };
    }

    // 設置管理器
    setupManagers() {
        this.uiManager = new UIManager(this);
        this.player = new Player(this);
        this.waveManager = new WaveManager(this);
        this.collisionSystem = new CollisionSystem(this);
        this.updateManager = new GameUpdateManager(this);
        this.enemyBehaviorSystem = new EnemyBehaviorSystem(this);
        this.renderManager = new RenderManager(this);
    }

    // 設置遊戲數據
    setupGameData() {
        this.loadData();
        this.setupAudio();
    }

    // 設置物件池
    setupObjectPools() {
        const poolSizes = GameConfig.poolSizes;
        this.bulletPool = new ObjectPool(() => ({ active: false }), poolSizes.bullets);
        this.enemyPool = new ObjectPool(() => ({ active: false }), poolSizes.enemies);
        this.enemyBulletPool = new ObjectPool(() => ({ active: false }), poolSizes.enemyBullets);
        this.particlePool = new ObjectPool(() => ({ active: false }), poolSizes.particles);
    }

    // 設置UI
    setupUI() {
        this.setupBuilderScreen();
    }

    // 畫布設置
    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.w = this.canvas.width;
        this.h = this.canvas.height;
    }

    // 數據載入和保存
    loadData() {
        this.data = {
            highScore: parseInt(localStorage.getItem('bhHighScore') || '0'),
            totalGames: parseInt(localStorage.getItem('bhTotalGames') || '0'),
            totalKills: parseInt(localStorage.getItem('bhTotalKills') || '0'),
            achievements: JSON.parse(localStorage.getItem('bhAchievements') || '[]')
        };
        this.uiManager.updateStartScreen(this.data);
    }

    saveData() {
        localStorage.setItem('bhHighScore', this.data.highScore);
        localStorage.setItem('bhTotalGames', this.data.totalGames);
        localStorage.setItem('bhTotalKills', this.data.totalKills);
        localStorage.setItem('bhAchievements', JSON.stringify(this.data.achievements));
    }

    // 音效設置
    setupAudio() {
        this.sfx = {};
    }

    playSound(sound) {
        if (sound && sound.readyState >= 2) {
            sound.currentTime = 0;
            sound.play().catch(e => {});
        }
    }

    // 背景設置
    setupBackground() {
        this.bgStars = [];
        this.nebula = [];
        const bgConfig = GameConfig.backgroundConfig;
        
        // 生成星星
        for (let i = 0; i < bgConfig.starCount; i++) {
            const speed = Math.random() * (bgConfig.starSpeeds.max - bgConfig.starSpeeds.min) + bgConfig.starSpeeds.min;
            this.bgStars.push({
                x: Math.random() * this.w,
                y: Math.random() * this.h,
                size: Math.random() * (bgConfig.starSizes.max - bgConfig.starSizes.min) + bgConfig.starSizes.min,
                speed: speed,
                alpha: 0.3 + speed * 0.7,
                twinkle: Math.random() * Math.PI * 2,
                twinkleSpeed: Math.random() * 0.02 + 0.01
            });
        }
        
        // 生成星雲
        for (let i = 0; i < bgConfig.nebulaCount; i++) {
            this.nebula.push({
                x: Math.random() * this.w,
                y: Math.random() * this.h,
                size: Math.random() * (bgConfig.nebulaSizes.max - bgConfig.nebulaSizes.min) + bgConfig.nebulaSizes.min,
                color: Math.random() > 0.5 ? 'rgba(100,50,200,0.1)' : 'rgba(50,100,200,0.1)',
                speed: Math.random() * (bgConfig.nebulaSpeeds.max - bgConfig.nebulaSpeeds.min) + bgConfig.nebulaSpeeds.min,
                drift: Math.random() * Math.PI * 2
            });
        }
    }

    // UI建構器設置
    setupBuilderScreen() {
        const populateSelector = (selectorId, items, type, title) => {
            const container = document.getElementById(selectorId);
            container.innerHTML = `<h3>${title}</h3>`;
            const itemContainer = document.createElement('div');
            itemContainer.style.display = 'flex';
            itemContainer.style.flexDirection = 'column';
            itemContainer.style.gap = '12px';
            
            items.forEach(item => {
                const btn = document.createElement('button');
                btn.className = 'part-btn';
                btn.id = item.id;
                btn.style.backgroundColor = item.color;
                btn.innerHTML = `${item.name}<br><span class="effect">${item.effect}</span>`;
                btn.addEventListener('click', () => this.selectPart(type, item));
                itemContainer.appendChild(btn);
            });
            container.appendChild(itemContainer);
        };

        const fighterParts = GameConfig.fighterParts;
        populateSelector('body-selector', fighterParts.bodies, 'body', '🔧 主體');
        populateSelector('weapon-selector', fighterParts.weapons, 'weapon', '🎯 武器');
        populateSelector('engine-selector', fighterParts.engines, 'engine', '🚀 引擎');
    }

    // 配件選擇
    selectPart(type, selectedItem) {
        if (!this.playerSelection) {
            this.playerSelection = {};
        }
        this.playerSelection[type] = selectedItem;
        
        const allButtons = document.querySelectorAll(`#${type}-selector .part-btn`);
        allButtons.forEach(btn => btn.classList.remove('selected'));
        document.getElementById(selectedItem.id).classList.add('selected');
        
        this.uiManager.updateBuilderSummary(this.playerSelection);
    }

    // 遊戲初始化
    initGame() {
        const settings = GameConfig.gameSettings;
        
        this.started = false;
        this.gameOver = false;
        this.paused = false;
        this.score = 0;
        this.level = 1;
        this.lives = settings.initialLives;
        this.kills = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.multiplier = 1;
        this.slowMotion = false;
        this.slowTimer = 0;
        this.grazeCount = 0;
        this.shakeDuration = 0;
        this.shakeMagnitude = 0;
        this.levelTimer = 0;
        this.currentBoss = null;
        
        // 重置陣列
        this.drones = [];
        this.powerUps = [];
        this.bosses = [];
        
        // 重置物件
        if (this.player) this.player.reset();
        if (this.waveManager) this.waveManager.reset();
        
        // 成就定義
        this.achievementDefs = GameConfig.achievementDefs;
        
        this.uiManager.init();
    }

    // 控制設置
    setupControls() {
        const updateTouch = (e) => {
            if (!this.started || this.gameOver || this.paused) return;
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches ? e.touches[0] : e;
            this.touchPos.x = (touch.clientX - rect.left) / rect.width * this.w;
            this.touchPos.y = (touch.clientY - rect.top) / rect.height * this.h;
        };

        this.canvas.addEventListener('touchstart', updateTouch);
        this.canvas.addEventListener('touchmove', updateTouch);
        this.canvas.addEventListener('mousedown', updateTouch);
        this.canvas.addEventListener('mousemove', updateTouch);

        this.lastTap = 0;
        this.canvas.addEventListener('pointerdown', () => {
            const now = Date.now();
            if (now - this.lastTap < 300) {
                this.player.tryDash();
            }
            this.lastTap = now;
        });

        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'p') this.togglePause();
            if (e.key === ' ') this.player.tryDash();
        });

        document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    }

    // 遊戲狀態控制
    showBuilderScreen() {
        this.uiManager.showBuilderScreen();
        const fighterParts = GameConfig.fighterParts;
        
        if (!this.playerSelection.body) {
            this.selectPart('body', fighterParts.bodies[0]);
        }
        if (!this.playerSelection.weapon) {
            this.selectPart('weapon', fighterParts.weapons[0]);
        }
        if (!this.playerSelection.engine) {
            this.selectPart('engine', fighterParts.engines[0]);
        }
    }

    confirmSelectionAndStart() {
        if (!this.playerSelection.body || !this.playerSelection.weapon || !this.playerSelection.engine) {
            alert('請選擇完整的戰機配件！');
            return;
        }
        this.uiManager.hideBuilderScreen();
        this.applyPlayerConfig();
        this.startGame();
    }

    applyPlayerConfig() {
        this.player.reset();
    }

    startGame() {
        this.started = true;
        this.data.totalGames++;
        this.waveManager.reset();
    }

    togglePause() {
        if (this.gameOver || !this.started) return;
        this.paused = !this.paused;
        this.uiManager.togglePause(this.paused);
    }

    useSpecial() {
        if (this.player.special >= 100 && !this.slowMotion) {
            this.player.special = 0;
            this.slowMotion = true;
            this.slowTimer = 300;
            document.getElementById('slowmoOverlay').classList.add('active');
        }
    }

    // 射擊系統
    autoShoot() {
        const now = Date.now();
        const weapon = this.player.weapon;
        const cooldown = GameConfig.shootingConfig[weapon.id]?.cooldown || 150;
        
        if (now - this.player.lastShot < cooldown) return;
        this.player.lastShot = now;
        
        const target = this.findClosestEnemy();
        if (this.player.weaponMethod && this.bulletPool) {
            this.player.weaponMethod(this.player, target, this.bulletPool);
        }
    }

    findClosestEnemy() {
        let closestEnemy = null;
        let minDistance = 500;
        
        this.enemyPool.getActiveObjects().forEach(enemy => {
            const distance = GameUtils.calculateDistance(enemy.x, enemy.y, this.player.x, this.player.y);
            if (distance < minDistance) {
                minDistance = distance;
                closestEnemy = enemy;
            }
        });
        
        return closestEnemy;
    }

    // 敵人和道具生成（委派給對應的系統）
    spawnEnemyAtPosition(x, y, enemyType) {
        this.enemyBehaviorSystem.spawnEnemyAtPosition(x, y, enemyType);
    }

    spawnBoss() {
        this.enemyBehaviorSystem.spawnBoss();
    }

    spawnPowerUp(x, y) {
        if (Math.random() < 0.3) {
            const types = GameConfig.powerUpTypes;
            let selected = types[0];
            const rand = Math.random();
            let cum = 0;
            
            for (const type of types) {
                cum += type.rarity;
                if (rand <= cum) {
                    selected = type;
                    break;
                }
            }
            
            this.powerUps.push({
                w: 25, h: 25, x, y, speed: 2,
                angle: Math.random() * Math.PI * 2,
                ...selected
            });
        }
    }

    // 粒子效果
    addParticles(x, y, color, count = 8, lifeMultiplier = 1) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            const p = this.particlePool.get();
            Object.assign(p, {
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: (Math.random() * 30 + 20) * lifeMultiplier,
                color,
                size: Math.random() * 3 + 2
            });
        }
    }

    // 連擊系統
    addCombo() {
        this.combo++;
        this.comboTimer = GameConfig.gameSettings.comboResetTime;
        this.multiplier = Math.min(GameConfig.gameSettings.maxComboMultiplier, Math.floor(this.combo / 5) + 1);
        this.player.special = Math.min(GameConfig.gameSettings.maxSpecial, this.player.special + GameConfig.gameSettings.specialComboBonus);
    }

    resetCombo() {
        this.combo = 0;
        this.multiplier = 1;
    }

    // 成就系統
    checkAchievements() {
        const newAchievements = [];
        this.achievementDefs.forEach(aDef => {
            const check = () => {
                switch (aDef.id) {
                    case 'first_kill': return this.kills >= 1;
                    case 'combo_10': return this.combo >= 10;
                    case 'level_5': return this.level >= 5;
                    case 'score_5k': return this.score >= 5000;
                    case 'boss_killer': return this.bosses.length === 0 && this.currentBoss;
                    case 'total_100': return this.data.totalKills >= 100;
                    default: return false;
                }
            };
            
            if (!this.data.achievements.includes(aDef.id) && check()) {
                this.data.achievements.push(aDef.id);
                newAchievements.push(aDef);
                this.uiManager.showAchievement(aDef);
            }
        });
        return newAchievements;
    }

    // 效果系統
    triggerShake(duration, magnitude) {
        this.shakeDuration = duration;
        this.shakeMagnitude = magnitude;
    }

    // 輔助方法
    hexToRgb(hex) {
        return GameUtils.hexToRgb(hex);
    }

    // 主要更新和渲染（委派給管理器）
    update() {
        this.updateManager.update(1);
        this.collisionSystem.checkAllCollisions();
        this.uiManager.update(this);
    }

    draw() {
        this.renderManager.draw();
    }

    // 遊戲結束
    endGame() {
        this.gameOver = true;
        if (this.score > this.data.highScore) {
            this.data.highScore = this.score;
        }
        const newAchievements = this.checkAchievements();
        this.saveData();
        this.uiManager.showGameOver(this);
    }

    restart() {
        this.uiManager.gameOverScreen.style.display = 'none';
        
        // 完全清除所有物件池和遊戲狀態
        this.clearAllPools();
        this.resetGameState();
        
        this.initGame();
        this.showBuilderScreen();
    }
    
    // 清除所有物件池
    clearAllPools() {
        if (this.bulletPool) {
            this.bulletPool.getActiveObjects().forEach(obj => this.bulletPool.release(obj));
        }
        if (this.enemyPool) {
            this.enemyPool.getActiveObjects().forEach(obj => this.enemyPool.release(obj));
        }
        if (this.enemyBulletPool) {
            this.enemyBulletPool.getActiveObjects().forEach(obj => this.enemyBulletPool.release(obj));
        }
        if (this.particlePool) {
            this.particlePool.getActiveObjects().forEach(obj => this.particlePool.release(obj));
        }
    }
    
    // 重置遊戲狀態
    resetGameState() {
        // 清除陣列
        this.drones = [];
        this.powerUps = [];
        this.bosses = [];
        this.currentBoss = null;
        
        // 重置特效狀態
        this.slowMotion = false;
        this.slowTimer = 0;
        document.getElementById('slowmoOverlay').classList.remove('active');
        
        // 重置UI
        if (this.uiManager.bossHealthBar) {
            this.uiManager.bossHealthBar.style.display = 'none';
        }
    }

    backToMenu() {
        this.uiManager.gameOverScreen.style.display = 'none';
        this.uiManager.pauseScreen.style.display = 'none';
        
        // 完全清除所有物件池和遊戲狀態
        this.clearAllPools();
        this.resetGameState();
        
        this.initGame();
        this.uiManager.startScreen.style.display = 'flex';
    }

    // 主循環
    loop() {
        if (!this.paused) {
            this.update();
        }
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    // 為了相容性，保留 Drone 類別的引用
    get Drone() {
        return Drone;
    }
}

// 初始化遊戲
window.addEventListener('load', () => {
    new Game();
});