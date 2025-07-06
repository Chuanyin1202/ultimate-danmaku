import Player from './player.js';
import UIManager from './uiManager.js';
import WaveManager from './waveManager.js';
import Drone from './drone.js';

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

const fighterParts = {
    bodies: [
        { id: 'body_kani', name: 'Kani 主體', effect: '中等耐久', color: '#fecdd3', stats: { maxHp: 100, agility: 0.15 } },
        { id: 'body_metal', name: '金屬箱主體', effect: '高耐久', color: '#d1d5db', stats: { maxHp: 150, agility: 0.10 } },
        { id: 'body_paper', name: '紙箱主體', effect: '低耐久・高機動', color: '#fde68a', stats: { maxHp: 70, agility: 0.25 } },
    ],
    weapons: [
        { 
            id: 'weapon_bubble', 
            name: '泡泡槍', 
            effect: '散射', 
            color: '#bfdbfe', 
            shoot: (player, target, bulletPool) => {
                const bullet = bulletPool.get();
                Object.assign(bullet, {
                    x: player.x, 
                    y: player.y - player.h / 2, 
                    w: 8, 
                    h: 8, 
                    damage: 10, 
                    type: 'bubble', 
                    life: 60, 
                    vx: 0, 
                    vy: -10
                });
            } 
        },
        { 
            id: 'weapon_flame', 
            name: '火焰槍', 
            effect: '持續灼燒', 
            color: '#fca5a5', 
            shoot: (player, target, bulletPool) => {
                const bullet = bulletPool.get();
                Object.assign(bullet, {
                    x: player.x, 
                    y: player.y - player.h / 2, 
                    w: 12, 
                    h: 12, 
                    damage: 5, 
                    type: 'flame', 
                    life: 30, 
                    vx: 0, 
                    vy: -8
                });
            } 
        },
        { 
            id: 'weapon_meow', 
            name: '衝擊波', 
            effect: '範圍傷害', 
            color: '#e9d5ff', 
            shoot: (player, target, bulletPool) => {
                const bullet = bulletPool.get();
                Object.assign(bullet, {
                    x: player.x, 
                    y: player.y, 
                    w: 0, 
                    h: 0, 
                    damage: 20, 
                    type: 'wave', 
                    life: 90, 
                    vx: 0, 
                    vy: 0, 
                    radius: 10
                });
            } 
        },
    ],
    engines: [
        { id: 'engine_rocket', name: '火箭引擎', effect: '高速直線推進', color: '#fed7aa', stats: { thrusterColor: '#f97316' } },
        { id: 'engine_fan', name: '電風扇引擎', effect: '緩慢穩定', color: '#99f6e4', stats: { thrusterColor: '#14b8a6' } },
        { id: 'engine_fart', name: '脈衝引擎', effect: '短程衝刺', color: '#f9a8d4', stats: { thrusterColor: '#ec4899' } },
    ]
};

class Game {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        this.playerSelection = {};
        this.uiManager = new UIManager(this);
        this.player = new Player(this);
        this.waveManager = new WaveManager(this);
        this.loadData();
        this.setupControls();
        this.setupAudio();
        this.setupBackground();
        this.setupBuilderScreen();
        this.initGame();
        this.loop();
    }

    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.w = this.canvas.width;
        this.h = this.canvas.height;
    }

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

    setupAudio() {
        this.sfx = {};
    }

    playSound(sound) {
        if (sound && sound.readyState >= 2) {
            sound.currentTime = 0;
            sound.play().catch(e => {});
        }
    }

    setupBackground() {
        this.bgStars = [];
        this.nebula = [];
        for (let i = 0; i < 150; i++) {
            const speed = Math.random() * 1 + 0.1;
            this.bgStars.push({
                x: Math.random() * this.w,
                y: Math.random() * this.h,
                size: Math.random() * 3 + 1,
                speed: speed,
                alpha: 0.3 + speed * 0.7,
                twinkle: Math.random() * Math.PI * 2,
                twinkleSpeed: Math.random() * 0.02 + 0.01
            });
        }
        for (let i = 0; i < 5; i++) {
            this.nebula.push({
                x: Math.random() * this.w,
                y: Math.random() * this.h,
                size: Math.random() * 200 + 100,
                color: Math.random() > 0.5 ? 'rgba(100,50,200,0.1)' : 'rgba(50,100,200,0.1)',
                speed: Math.random() * 0.2 + 0.1,
                drift: Math.random() * Math.PI * 2
            });
        }
    }

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
        populateSelector('body-selector', fighterParts.bodies, 'body', '🔧 主體');
        populateSelector('weapon-selector', fighterParts.weapons, 'weapon', '🎯 武器');
        populateSelector('engine-selector', fighterParts.engines, 'engine', '🚀 引擎');
    }

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

    initGame() {
        this.started = false;
        this.gameOver = false;
        this.paused = false;
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.kills = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.multiplier = 1;
        this.slowMotion = false;
        this.slowTimer = 0;
        this.grazeCount = 0;
        this.shakeDuration = 0;
        this.shakeMagnitude = 0;
        if (!this.playerSelection) {
            this.playerSelection = {};
        }
        this.touchPos = { x: this.w / 2, y: this.h - 100 };
        this.drones = [];
        this.powerUps = [];
        this.bosses = [];
        this.levelTimer = 0;
        this.currentBoss = null;
        if (this.player) this.player.reset();
        if (this.waveManager) this.waveManager.reset();
        this.bulletPool = new ObjectPool(() => ({ active: false }), 200);
        this.enemyPool = new ObjectPool(() => ({ active: false }), 100);
        this.enemyBulletPool = new ObjectPool(() => ({ active: false }), 300);
        this.particlePool = new ObjectPool(() => ({ active: false }), 400);
        this.achievementDefs = [
            { id: 'first_kill', name: '初次擊殺', desc: '擊殺第一個敵人' },
            { id: 'combo_10', name: '連擊高手', desc: '達成10連擊' },
            { id: 'level_5', name: '生存專家', desc: '到達第5級' },
            { id: 'score_5k', name: '得分王', desc: '單局得分5000' },
            { id: 'boss_killer', name: 'Boss終結者', desc: '擊敗第一個Boss' },
            { id: 'total_100', name: '屠殺機器', desc: '累計擊殺100敵人' }
        ];
        this.uiManager.init();
    }

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

    showBuilderScreen() {
        this.uiManager.showBuilderScreen();
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

    autoShoot() {
        const now = Date.now();
        if (now - this.player.lastShot < (this.player.weapon.id === 'weapon_flame' ? 40 : 150)) return;
        this.player.lastShot = now;
        const target = this.findClosestEnemy();
        console.log('autoShoot triggered:', {
            weapon: this.player.weapon.id,
            bulletPool: this.bulletPool ? 'valid' : 'undefined',
            weaponMethod: this.player.weaponMethod ? 'defined' : 'undefined',
            target: target ? 'found' : 'none'
        });
        if (this.player.weaponMethod && this.bulletPool) {
            this.player.weaponMethod(this.player, target, this.bulletPool);
        } else {
            console.warn('Cannot shoot: weaponMethod or bulletPool is missing');
        }
    }

    findClosestEnemy() {
        let closestEnemy = null;
        let minDistance = 500;
        this.enemyPool.getActiveObjects().forEach(enemy => {
            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < minDistance) {
                minDistance = distance;
                closestEnemy = enemy;
            }
        });
        return closestEnemy;
    }

    spawnEnemyAtPosition(x, y, enemyType) {
        const types = {
            'straight': { w: 35, h: 35, hp: 60, speed: 1.5, color: '#ff4757', pattern: 'straight', points: 100, chaseSpeed: 1.5 },
            'circle': { w: 45, h: 45, hp: 100, speed: 1.0, color: '#5f27cd', pattern: 'circle', points: 200, chaseSpeed: 1.0 },
            'sine': { w: 30, h: 30, hp: 40, speed: 2.0, color: '#ff9ff3', pattern: 'sine', points: 150, movementTimer: Math.random() * 100, chaseSpeed: 2.0 }
        };
        const type = types[enemyType];
        if (!type) return;
        const enemy = this.enemyPool.get();
        Object.assign(enemy, {
            x, y, targetX: this.player.x, targetY: this.player.y, chaseUpdateTimer: 0,
            ...type, maxHp: type.hp, hp: type.hp, lastShot: Date.now(), angle: 0, hitTimer: 0
        });
    }

    spawnBoss() {
        this.currentBoss = {
            x: this.w / 2, y: -120, w: 120, h: 100, hp: 1500, maxHp: 1500, speed: 1,
            color: '#e74c3c', points: 5000, lastShot: 0, angle: 0, phase: 1, hitTimer: 0,
            phaseTimer: 0, targetX: this.player.x, targetY: this.player.y, chaseUpdateTimer: 0, chaseSpeed: 0.8
        };
        this.bosses.push(this.currentBoss);
        this.uiManager.bossHealthBar.style.display = 'block';
    }

    spawnPowerUp(x, y) {
        if (Math.random() < 0.3) {
            const types = [
                { type: 'health', symbol: '❤️', rarity: 0.5 },
                { type: 'shield', symbol: '🛡️', rarity: 0.35 },
                { type: 'drone', symbol: '⚙️', rarity: 0.15 }
            ];
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
            this.powerUps.push({ w: 25, h: 25, x, y, speed: 2, angle: Math.random() * Math.PI * 2, ...selected });
        }
    }

    enemyShoot(enemy) {
        const now = Date.now();
        if (now - enemy.lastShot < 2500) return;
        enemy.lastShot = now;
        if (enemy.pattern === 'straight') {
            const angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
            const bullet = this.enemyBulletPool.get();
            Object.assign(bullet, {
                x: enemy.x + enemy.w / 2, y: enemy.y + enemy.h / 2,
                vx: Math.cos(angle) * 5, vy: Math.sin(angle) * 5,
                w: 8, h: 8, color: enemy.color, life: 300
            });
        } else if (enemy.pattern === 'circle') {
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i + enemy.angle;
                const bullet = this.enemyBulletPool.get();
                Object.assign(bullet, {
                    x: enemy.x + enemy.w / 2, y: enemy.y + enemy.h / 2,
                    vx: Math.cos(angle) * 3, vy: Math.sin(angle) * 3,
                    w: 6, h: 6, color: enemy.color, life: 300
                });
            }
            enemy.angle += 0.5;
        }
    }

    bossShoot(boss) {
        const now = Date.now();
        if (now - boss.lastShot < 300) return;
        boss.lastShot = now;
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 12) * boss.phaseTimer + (i * Math.PI * 0.5);
            const bullet = this.enemyBulletPool.get();
            Object.assign(bullet, {
                x: boss.x + boss.w / 2, y: boss.y + boss.h / 2,
                vx: Math.cos(angle) * 4, vy: Math.sin(angle) * 4,
                w: 10, h: 10, color: boss.color, life: 400
            });
        }
        boss.phaseTimer++;
    }

    addParticles(x, y, color, count = 8, lifeMultiplier = 1) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            const p = this.particlePool.get();
            Object.assign(p, {
                x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                life: (Math.random() * 30 + 20) * lifeMultiplier, color, size: Math.random() * 3 + 2
            });
        }
    }

    addCombo() {
        this.combo++;
        this.comboTimer = 180;
        this.multiplier = Math.min(8, Math.floor(this.combo / 5) + 1);
        this.player.special = Math.min(100, this.player.special + 2);
    }

    resetCombo() {
        this.combo = 0;
        this.multiplier = 1;
    }

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

    triggerShake(duration, magnitude) {
        this.shakeDuration = duration;
        this.shakeMagnitude = magnitude;
    }

    update() {
        if (!this.started || this.gameOver || this.paused) return;
        const delta = 1;
        if (this.shakeDuration > 0) this.shakeDuration--;
        if (this.slowMotion) {
            this.slowTimer--;
            if (this.slowTimer <= 0) {
                this.slowMotion = false;
                document.getElementById('slowmoOverlay').classList.remove('active');
            }
        }
        this.player.update(delta, this.touchPos);
        this.autoShoot();
        this.waveManager.update();
        this.drones.forEach(d => d.update());
        if (this.comboTimer > 0) {
            this.comboTimer--;
        } else if (this.combo > 0) {
            this.resetCombo();
        }
        const objectsToRelease = { bullets: [], enemyBullets: [], particles: [], enemies: [] };
        this.bulletPool.getActiveObjects().forEach(b => {
            if (b.type === 'wave') {
                b.radius += 10;
            } else {
                b.x += b.vx;
                b.y += b.vy;
            }
            b.life--;
            if (b.life <= 0 || b.x < -50 || b.x > this.w + 50 || b.y < -50 || b.y > this.h + 50) {
                objectsToRelease.bullets.push(b);
            }
        });
        this.enemyBulletPool.getActiveObjects().forEach(b => {
            b.x += b.vx;
            b.y += b.vy;
            b.life--;
            if (b.life <= 0 || b.x < -50 || b.x > this.w + 50 || b.y < -50 || b.y > this.h + 50) {
                objectsToRelease.enemyBullets.push(b);
            }
        });
        this.enemyPool.getActiveObjects().forEach(enemy => {
            this.updateEnemyMovement(enemy);
            const margin = 200;
            if (enemy.x < -margin || enemy.x > this.w + margin || enemy.y < -margin || enemy.y > this.h + margin) {
                objectsToRelease.enemies.push(enemy);
            }
        });
        this.bosses.forEach(boss => {
            this.updateBossMovement(boss);
            this.bossShoot(boss);
        });
        this.powerUps.forEach(p => {
            p.y += p.speed;
        });
        this.powerUps = this.powerUps.filter(p => p.y < this.h + 50);
        this.particlePool.getActiveObjects().forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) {
                objectsToRelease.particles.push(p);
            }
        });
        this.bulletPool.releaseAll(objectsToRelease.bullets);
        this.enemyBulletPool.releaseAll(objectsToRelease.enemyBullets);
        this.particlePool.releaseAll(objectsToRelease.particles);
        this.enemyPool.releaseAll(objectsToRelease.enemies);
        this.levelTimer++;
        if (this.levelTimer > 2400) {
            this.level++;
            this.levelTimer = 0;
        }
        this.checkCollisions();
        this.uiManager.update(this);
    }

    updateEnemyMovement(enemy) {
        enemy.chaseUpdateTimer++;
        if (enemy.chaseUpdateTimer >= 60) {
            enemy.chaseUpdateTimer = 0;
            enemy.targetX = this.player.x;
            enemy.targetY = this.player.y;
        }
        switch (enemy.pattern) {
            case 'straight':
            case 'circle':
                this.moveEnemyTowardsTarget(enemy);
                break;
            case 'sine':
                this.moveEnemySineWave(enemy);
                break;
        }
        if (Math.random() < 0.02) {
            this.enemyShoot(enemy);
        }
    }

    updateBossMovement(boss) {
        if (boss.y < 100) {
            boss.y += boss.speed;
        } else {
            boss.chaseUpdateTimer++;
            if (boss.chaseUpdateTimer >= 60) {
                boss.chaseUpdateTimer = 0;
                boss.targetX = this.player.x;
                boss.targetY = this.player.y;
            }
            this.moveEnemyTowardsTarget(boss);
        }
    }

    moveEnemyTowardsTarget(enemy) {
        const dx = enemy.targetX - enemy.x;
        const dy = enemy.targetY - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
            enemy.x += (dx / distance) * enemy.chaseSpeed;
            enemy.y += (dy / distance) * enemy.chaseSpeed;
        }
    }

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

    checkCollisions() {
        const checkHit = (obj1, obj2) => {
            if (!obj1 || !obj2) return false;
            if (obj1.type === 'wave') {
                return Math.sqrt(Math.pow(obj1.x - obj2.x, 2) + Math.pow(obj1.y - obj2.y, 2)) < obj1.radius;
            }
            const dx = obj1.x - obj2.x;
            const dy = obj1.y - obj2.y;
            return Math.sqrt(dx * dx + dy * dy) < (obj1.w / 2 || 0) + (obj2.w / 2 || 0);
        };
        const bulletsToRelease = [];
        this.bulletPool.getActiveObjects().forEach((bullet) => {
            [...this.enemyPool.getActiveObjects(), ...this.bosses].forEach((target) => {
                if (checkHit(bullet, target)) {
                    target.hp -= bullet.damage;
                    target.hitTimer = 5;
                    if (bullet.type !== 'flame' && bullet.type !== 'wave') {
                        bulletsToRelease.push(bullet);
                    }
                    if (target.hp <= 0) {
                        this.score += target.points * this.multiplier;
                        this.kills++;
                        this.data.totalKills++;
                        this.addCombo();
                        this.spawnPowerUp(target.x, target.y);
                        this.addParticles(target.x, target.y, target.color, 15, 1.2);
                        this.triggerShake(15, 5);
                        if (this.bosses.includes(target)) {
                            this.bosses.splice(this.bosses.indexOf(target), 1);
                            this.uiManager.bossHealthBar.style.display = 'none';
                            this.triggerShake(50, 10);
                        } else {
                            this.enemyPool.release(target);
                        }
                    }
                }
            });
        });
        this.bulletPool.releaseAll(bulletsToRelease);
        const activeEnemiesAndBullets = [...this.enemyBulletPool.getActiveObjects(), ...this.enemyPool.getActiveObjects(), ...this.bosses];
        activeEnemiesAndBullets.forEach((obj) => {
            if (this.player.invulnerable <= 0 && checkHit(obj, this.player)) {
                this.triggerShake(20, 5);
                let damage = obj.hasOwnProperty('hp') ? 30 : 20;
                this.player.takeDamage(damage);
                this.addParticles(this.player.x, this.player.y, '#ff4757', 10);
                this.resetCombo();
                if (this.player.hp <= 0) {
                    this.lives--;
                    if (this.lives > 0) {
                        this.player.hp = this.player.maxHp;
                        this.player.shield = 50;
                        this.player.invulnerable = 180;
                    } else {
                        this.endGame();
                    }
                }
            }
        });
        this.powerUps.forEach((powerUp, pi) => {
            if (checkHit(powerUp, this.player)) {
                this.collectPowerUp(powerUp);
                this.powerUps.splice(pi, 1);
            }
        });
    }

    collectPowerUp(powerUp) {
        switch (powerUp.type) {
            case 'health':
                this.player.hp = Math.min(this.player.maxHp, this.player.hp + 50);
                break;
            case 'shield':
                this.player.shield = Math.min(this.player.maxShield, this.player.shield + 50);
                break;
            case 'drone':
                if (this.drones.length < 2) {
                    this.drones.push(new Drone(this.drones.length, this));
                }
                break;
        }
        this.addParticles(powerUp.x, powerUp.y, '#ffd700', 10);
        this.player.special = Math.min(100, this.player.special + 10);
    }

    draw() {
        this.ctx.fillStyle = 'rgba(15, 20, 25, 0.3)';
        this.ctx.fillRect(0, 0, this.w, this.h);
        this.ctx.save();
        if (this.shakeDuration > 0) {
            const shakeX = (Math.random() - 0.5) * this.shakeMagnitude;
            const shakeY = (Math.random() - 0.5) * this.shakeMagnitude;
            this.ctx.translate(shakeX, shakeY);
        }
        this.drawBackground();
        if (!this.started || this.paused) {
            this.ctx.restore();
            return;
        }
        this.powerUps.forEach(p => this.drawPowerUp(p));
        this.particlePool.getActiveObjects().forEach(p => this.drawParticle(p));
        this.bulletPool.getActiveObjects().forEach(b => this.drawBullet(b));
        this.enemyBulletPool.getActiveObjects().forEach(b => this.drawEnemyBullet(b));
        this.enemyPool.getActiveObjects().forEach(e => this.drawEnemy(e));
        this.bosses.forEach(b => this.drawEnemy(b));
        this.drones.forEach(d => d.draw(this.ctx));
        this.player.draw(this.ctx);
        this.ctx.restore();
    }

    drawBackground() {
        this.ctx.save();
        this.nebula.forEach(n => {
            n.y += n.speed;
            n.x += Math.cos(n.drift);
            if (n.y > this.h + n.size) {
                n.y = -n.size;
                n.x = Math.random() * this.w;
            }
            const grad = this.ctx.createRadialGradient(n.x, n.y, n.size * 0.1, n.x, n.y, n.size);
            grad.addColorStop(0, n.color.replace('0.1', '0.3'));
            grad.addColorStop(1, n.color);
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(0, 0, this.w, this.h);
        });
        this.bgStars.forEach(s => {
            s.y += s.speed * (this.slowMotion ? 0.3 : 1);
            s.twinkle += s.twinkleSpeed;
            if (s.y > this.h) {
                s.y = 0;
                s.x = Math.random() * this.w;
            }
            this.ctx.globalAlpha = 0.5 + Math.sin(s.twinkle) * 0.5;
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(s.x, s.y, s.size, s.size);
        });
        this.ctx.restore();
    }

    drawBullet(b) {
        this.ctx.save();
        if (b.type === 'wave') {
            this.ctx.strokeStyle = `rgba(233, 213, 255, ${b.life / 90 * 0.8})`;
            this.ctx.lineWidth = 10;
            this.ctx.shadowColor = '#e9d5ff';
            this.ctx.shadowBlur = 30;
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            this.ctx.stroke();
        } else if (b.type === 'flame') {
            const grad = this.ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.w);
            grad.addColorStop(0, `rgba(255, 200, 100, ${b.life / 30})`);
            grad.addColorStop(1, `rgba(255, 100, 50, 0)`);
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.w, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            this.ctx.fillStyle = this.player.weapon.color;
            this.ctx.shadowColor = this.player.weapon.color;
            this.ctx.shadowBlur = 15;
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.w / 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
    }

    drawEnemy(e) {
        this.ctx.save();
        if (e.hitTimer > 0) {
            this.ctx.filter = 'brightness(2)';
        }
        this.ctx.fillStyle = e.color;
        this.ctx.shadowColor = e.color;
        this.ctx.shadowBlur = 20;
        this.ctx.fillRect(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h);
        this.ctx.restore();
        const hpPercent = e.hp / e.maxHp;
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(e.x - e.w / 2, e.y - e.h / 2 - 10, e.w, 5);
        this.ctx.fillStyle = hpPercent > 0.5 ? '#4CAF50' : hpPercent > 0.25 ? '#FFC107' : '#F44336';
        this.ctx.fillRect(e.x - e.w / 2, e.y - e.h / 2 - 10, e.w * hpPercent, 5);
    }

    drawEnemyBullet(b) {
        this.ctx.save();
        this.ctx.fillStyle = b.color;
        this.ctx.shadowColor = b.color;
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.arc(b.x, b.y, b.w / 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    drawPowerUp(p) {
        this.ctx.save();
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = '#ffd700';
        this.ctx.shadowBlur = 20;
        this.ctx.fillText(p.symbol, p.x, p.y);
        this.ctx.restore();
    }

    drawParticle(p) {
        this.ctx.save();
        this.ctx.globalAlpha = p.life / 50;
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    hexToRgb(hex) {
        if (!hex) return '255,255,255';
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `${r}, ${g}, ${b}`;
    }

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
        this.initGame();
        this.showBuilderScreen();
    }

    backToMenu() {
        this.uiManager.gameOverScreen.style.display = 'none';
        this.uiManager.pauseScreen.style.display = 'none';
        this.initGame();
        this.uiManager.startScreen.style.display = 'flex';
    }

    loop() {
        if (!this.paused) {
            this.update();
        }
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}

window.addEventListener('load', () => {
    new Game();
});