// [新功能] 波次系統的資料結構
const waveData = [
    { name: "第一波：前鋒部隊", enemies: [ { type: 'straight', count: 5, interval: 60 } ], nextWaveCondition: 'clear' },
    { name: "喘息時間", duration: 300 }, // 5 seconds breather
    { name: "第二波：交叉火力", enemies: [ { type: 'sine', count: 4, interval: 90 } ], nextWaveCondition: 'clear' },
    { name: "第三波：混合攻擊", enemies: [ { type: 'straight', count: 3, interval: 120 }, { type: 'sine', count: 3, interval: 120 } ], nextWaveCondition: 'clear' },
    { name: "喘息時間", duration: 420 }, // 7 seconds breather
    { name: "第四波：彈幕圓舞曲", enemies: [ { type: 'circle', count: 2, interval: 180 } ], nextWaveCondition: 'clear' },
    { name: "最終挑戰：Boss 來襲", boss: true, nextWaveCondition: 'clear' }
];

const fighterParts = {
    bodies: [ { id: 'body_kani', name: 'Kani 主體', effect: '中等耐久', color: '#fecdd3', stats: { maxHp: 100, agility: 0.15 } }, { id: 'body_metal', name: '金屬箱主體', effect: '高耐久', color: '#d1d5db', stats: { maxHp: 150, agility: 0.10 } }, { id: 'body_paper', name: '紙箱主體', effect: '低耐久・高機動', color: '#fde68a', stats: { maxHp: 70, agility: 0.25 } }, ],
    weapons: [ { id: 'weapon_bubble', name: '泡泡槍', effect: '散射', color: '#bfdbfe', shoot: 'shootBubble' }, { id: 'weapon_flame', name: '火焰槍', effect: '持續灼燒', color: '#fca5a5', shoot: 'shootFlame' }, { id: 'weapon_meow', name: '衝擊波', effect: '範圍傷害', color: '#e9d5ff', shoot: 'shootWave' }, ],
    engines: [ { id: 'engine_rocket', name: '火箭引擎', effect: '高速直線推進', color: '#fed7aa', stats: { thrusterColor: '#f97316' } }, { id: 'engine_fan', name: '電風扇引擎', effect: '緩慢穩定', color: '#99f6e4', stats: { thrusterColor: '#14b8a6' } }, { id: 'engine_fart', name: '脈衝引擎', effect: '短程衝刺', color: '#f9a8d4', stats: { thrusterColor: '#ec4899' } }, ]
};

class Game {
    constructor() {
        this.canvas = document.getElementById('canvas'); this.ctx = this.canvas.getContext('2d');
        this.setupCanvas(); this.loadData(); this.setupControls(); this.setupAudio();
        this.setupBackground(); this.setupBuilderScreen(); this.initGame(); this.loop();
    }
    
    setupCanvas() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; this.w = this.canvas.width; this.h = this.canvas.height; }
    loadData() { this.data = { highScore: parseInt(localStorage.getItem('bhHighScore') || '0'), totalGames: parseInt(localStorage.getItem('bhTotalGames') || '0'), totalKills: parseInt(localStorage.getItem('bhTotalKills') || '0'), achievements: JSON.parse(localStorage.getItem('bhAchievements') || '[]') }; this.updateStartScreen(); }
    saveData() { localStorage.setItem('bhHighScore', this.data.highScore); localStorage.setItem('bhTotalGames', this.data.totalGames); localStorage.setItem('bhTotalKills', this.data.totalKills); localStorage.setItem('bhAchievements', JSON.stringify(this.data.achievements)); }
    updateStartScreen() { document.getElementById('displayHighScore').textContent = this.data.highScore; document.getElementById('displayTotalGames').textContent = this.data.totalGames; document.getElementById('displayTotalKills').textContent = this.data.totalKills; document.getElementById('displayAchievements').textContent = this.data.achievements.length; }
    setupAudio() { this.sfx = {}; }
    playSound(sound) { if (sound && sound.readyState >= 2) { sound.currentTime = 0; sound.play().catch(e => {}); } }

    setupBackground() { 
        this.bgStars = []; this.nebula = [];
        for(let i=0; i<150; i++) { const speed = Math.random() * 1 + 0.1; this.bgStars.push({ x: Math.random() * this.w, y: Math.random() * this.h, size: Math.random() * 3 + 1, speed: speed, alpha: 0.3 + speed * 0.7, twinkle: Math.random() * Math.PI * 2, twinkleSpeed: Math.random() * 0.02 + 0.01 }); }
        for(let i=0; i<5; i++) { this.nebula.push({ x: Math.random() * this.w, y: Math.random() * this.h, size: Math.random() * 200 + 100, color: Math.random() > 0.5 ? 'rgba(100,50,200,0.1)' : 'rgba(50,100,200,0.1)', speed: Math.random() * 0.2 + 0.1, drift: Math.random() * Math.PI * 2 }); }
    }

    setupBuilderScreen() {
        const populateSelector = (selectorId, items, type, title) => {
            const container = document.getElementById(selectorId); container.innerHTML = `<h3>${title}</h3>`;
            const itemContainer = document.createElement('div'); itemContainer.style.display = 'flex'; itemContainer.style.flexDirection = 'column'; itemContainer.style.gap = '12px';
            items.forEach(item => { const btn = document.createElement('button'); btn.className = 'part-btn'; btn.id = item.id; btn.style.backgroundColor = item.color; btn.innerHTML = `${item.name}<br><span class="effect">${item.effect}</span>`; btn.onclick = () => this.selectPart(type, item); itemContainer.appendChild(btn); });
            container.appendChild(itemContainer);
        };
        populateSelector('body-selector', fighterParts.bodies, 'body', '🔧 主體'); populateSelector('weapon-selector', fighterParts.weapons, 'weapon', '🎯 武器'); populateSelector('engine-selector', fighterParts.engines, 'engine', '🚀 引擎');
    }

    selectPart(type, selectedItem) { this.playerSelection[type] = selectedItem; const allButtons = document.querySelectorAll(`#${type}-selector .part-btn`); allButtons.forEach(btn => btn.classList.remove('selected')); document.getElementById(selectedItem.id).classList.add('selected'); this.updateBuilderSummary(); }
    updateBuilderSummary() { const summaryEl = document.getElementById('builder-summary'); const { body, weapon, engine } = this.playerSelection; summaryEl.innerHTML = `<h2 style="font-weight: bold; font-size: 24px; margin-bottom: 15px;">⚡ 當前組合：</h2><ul style="list-style: none; padding: 0; line-height: 1.8;"><li style="margin: 8px 0; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 8px;">🔧 主體：${body ? body.name + ' (' + body.effect + ')' : '尚未選擇'}</li><li style="margin: 8px 0; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 8px;">🎯 武器：${weapon ? weapon.name + ' (' + weapon.effect + ')' : '尚未選擇'}</li><li style="margin: 8px 0; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 8px;">🚀 引擎：${engine ? engine.name + ' (' + engine.effect + ')' : '尚未選擇'}</li></ul>`; }

    showBuilderScreen() {
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('builderScreen').style.display = 'flex';
        document.body.classList.add('scrollable');
        this.selectPart('body', fighterParts.bodies[0]);
        this.selectPart('weapon', fighterParts.weapons[0]);
        this.selectPart('engine', fighterParts.engines[0]);
    }

    confirmSelectionAndStart() {
        const { body, weapon, engine } = this.playerSelection;
        if (!body || !weapon || !engine) { alert('請選擇完整的戰機配件！'); return; }
        document.getElementById('builderScreen').style.display = 'none';
        document.body.classList.remove('scrollable');
        this.applyPlayerConfig();
        this.startGame();
    }

    applyPlayerConfig() {
        const { body, weapon, engine } = this.playerSelection;
        this.player.maxHp = body.stats.maxHp;
        this.player.hp = this.player.maxHp;
        this.player.agility = body.stats.agility;
        this.player.weaponMethod = weapon.shoot;
        this.player.engine = engine;
        this.player.body = body;
        this.player.weapon = weapon;
    }

    initGame() {
        this.started = false; this.gameOver = false; this.paused = false; this.score = 0; this.level = 1; this.lives = 3; this.kills = 0; this.combo = 0; this.comboTimer = 0; this.multiplier = 1;
        this.slowMotion = false; this.slowTimer = 0; this.grazeCount = 0; this.shakeDuration = 0; this.shakeMagnitude = 0;
        
        this.playerSelection = {};
        
        this.player = {
            x: this.w / 2, y: this.h - 100, w: 35, h: 35, hp: 100, maxHp: 100, shield: 0, maxShield: 100, special: 0, maxSpecial: 100, lastShot: 0, invulnerable: 0,
            agility: 0.15, weaponMethod: 'shootBubble', engine: fighterParts.engines[0], body: fighterParts.bodies[0], weapon: fighterParts.weapons[0], dashTimer: 0, dashCooldown: 0
        };
        
        this.touchPos = { x: this.w / 2, y: this.h - 100 };
        this.bullets = []; this.enemies = []; this.bosses = []; this.enemyBullets = [];
        this.particles = []; this.powerUps = []; this.drones = [];
        this.levelTimer = 0; this.currentBoss = null;
        
        // [新功能] 波次系統變數初始化
        this.waveData = waveData;
        this.currentWaveIndex = -1;
        this.waveState = 'intermission'; // 'spawning', 'waiting_for_clear', 'intermission'
        this.waveTimer = 180; // 初始 3 秒後出第一波
        this.enemiesToSpawn = [];
        this.spawnTimer = 0;

        this.achievementDefs = [ { id: 'first_kill', name: '初次擊殺', desc: '擊殺第一個敵人' }, { id: 'combo_10', name: '連擊高手', desc: '達成10連擊' }, { id: 'level_5', name: '生存專家', desc: '到達第5級' }, { id: 'score_5k', name: '得分王', desc: '單局得分5000' }, { id: 'boss_killer', name: 'Boss終結者', desc: '擊敗第一個Boss' }, { id: 'total_100', name: '屠殺機器', desc: '累計擊殺100敵人' } ];
        
        document.getElementById('pauseScreen').style.display = 'none';
        document.getElementById('builderScreen').style.display = 'none';
        document.getElementById('startScreen').style.display = 'flex';
        document.getElementById('gameOver').style.display = 'none';
    }
    
    setupControls() {
        const updateTouch = (e) => {
            if (!this.started || this.gameOver || this.paused) return;
            e.preventDefault(); const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches ? e.touches[0] : e;
            this.touchPos.x = (touch.clientX - rect.left) / rect.width * this.w; this.touchPos.y = (touch.clientY - rect.top) / rect.height * this.h;
        };
        this.canvas.addEventListener('touchstart', updateTouch); this.canvas.addEventListener('touchmove', updateTouch);
        this.canvas.addEventListener('mousedown', updateTouch); this.canvas.addEventListener('mousemove', updateTouch);
        this.lastTap = 0;
        this.canvas.addEventListener('pointerdown', () => { const now = Date.now(); if (now - this.lastTap < 300) { this.tryDash(); } this.lastTap = now; });
        document.getElementById('specialBtn').onclick = () => this.useSpecial();
        document.getElementById('pauseBtn').onclick = () => this.togglePause();
        window.addEventListener('keydown', (e) => { if (e.key.toLowerCase() === 'p') this.togglePause(); if (e.key === ' ') this.tryDash(); });
        document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    }

    tryDash() { if (this.player.engine.id === 'engine_fart' && this.player.dashCooldown <= 0) { this.player.dashTimer = 10; this.player.dashCooldown = 60; this.addParticles(this.player.x, this.player.y, this.player.engine.stats.thrusterColor, 30, 0.8); } }
    startGame() { this.started = true; this.data.totalGames++; this.startNextWave(); }
    togglePause() { if (this.gameOver || !this.started) return; this.paused = !this.paused; document.getElementById('pauseScreen').style.display = this.paused ? 'flex' : 'none'; document.getElementById('pauseBtn').innerHTML = this.paused ? '▶' : '⏸'; }
    useSpecial() { if (this.player.special >= 100 && !this.slowMotion) { this.player.special = 0; this.slowMotion = true; this.slowTimer = 300; document.getElementById('slowmoOverlay').classList.add('active'); } }
    
    // [新功能] 動態準星
    findClosestEnemy() {
        let closestEnemy = null;
        let minDistance = 500; // Only target enemies within this range
        this.enemies.forEach(enemy => {
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

    autoShoot() {
        const now = Date.now();
        if (now - this.player.lastShot < (this.player.weapon.id === 'weapon_flame' ? 40 : 150)) return;
        this.player.lastShot = now;
        const target = this.findClosestEnemy(); // [新功能] 動態準星
        this[this.player.weaponMethod](target); // [新功能] 動態準星
    }

    shootBubble(target) { // [新功能] 動態準星
        let angle;
        if (target) {
            angle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
        } else {
            angle = Math.atan2(this.touchPos.y - this.player.y, this.touchPos.x - this.player.x);
        }
        for (let i = -1; i <= 1; i++) {
            const bulletAngle = angle + i * 0.2;
            this.bullets.push({ x: this.player.x, y: this.player.y, w: 12, h: 12, damage: 20, type: 'bubble', life: 80, vx: Math.cos(bulletAngle) * 8, vy: Math.sin(bulletAngle) * 8 });
        }
    }
    shootFlame(target) { /* Flame thrower might not need auto-aim, keeps original logic */ for (let i = 0; i < 3; i++) { this.bullets.push({ x: this.player.x + (Math.random() - 0.5) * 10, y: this.player.y, w: 15, h: 15, damage: 3, type: 'flame', life: 30, vx: (Math.random() - 0.5) * 2, vy: -10 - Math.random() * 5 }); } }
    shootWave() { if (this.bullets.filter(b => b.type === 'wave').length > 0) return; this.bullets.push({ x: this.player.x, y: this.player.y, damage: 0.5, type: 'wave', life: 90, radius: 10 }); }
    
    // [新功能] 波次系統
    spawnEnemy(enemyType) {
        const types = {
            'straight': { w: 35, h: 35, hp: 80, speed: 2.5, color: '#ff4757', pattern: 'straight', points: 100 },
            'circle': { w: 45, h: 45, hp: 120, speed: 1.8, color: '#5f27cd', pattern: 'circle', points: 200 },
            'sine': { w: 30, h: 30, hp: 60, speed: 4, color: '#ff9ff3', pattern: 'sine', points: 150, movementTimer: Math.random() * 100 }
        };
        const type = types[enemyType];
        if (!type) return;
        this.enemies.push({ x: Math.random() * (this.w - type.w), y: -type.h, ...type, maxHp: type.hp, lastShot: Date.now(), angle: 0, hitTimer: 0 });
    }

    startNextWave() {
        this.currentWaveIndex++;
        if (this.currentWaveIndex >= this.waveData.length) {
            this.currentWaveIndex = 0; // Loop waves for now
        }
        const currentWave = this.waveData[this.currentWaveIndex];
        this.waveState = 'spawning';
        this.enemiesToSpawn = [];
        
        document.getElementById('wave-display').textContent = `WAVE: ${currentWave.name}`;

        if(currentWave.enemies) {
            currentWave.enemies.forEach(enemyGroup => {
                for (let i = 0; i < enemyGroup.count; i++) {
                    this.enemiesToSpawn.push({ type: enemyGroup.type, spawnTime: i * enemyGroup.interval });
                }
            });
            // Sort by spawn time
            this.enemiesToSpawn.sort((a,b) => a.spawnTime - b.spawnTime);
        } else if (currentWave.boss) {
            this.spawnBoss();
            this.waveState = 'waiting_for_clear';
        } else if (currentWave.duration) { // Breather wave
            this.waveState = 'intermission';
            this.waveTimer = currentWave.duration;
        }
    }

    updateWaves() {
        this.waveTimer--;
        if (this.waveTimer <= 0) {
            if (this.waveState === 'intermission') {
                this.startNextWave();
            } else if (this.waveState === 'spawning') {
                if (this.enemiesToSpawn.length > 0) {
                    this.spawnEnemy(this.enemiesToSpawn.shift().type);
                    if (this.enemiesToSpawn.length > 0) {
                        this.waveTimer = this.enemiesToSpawn[0].spawnTime;
                    } else {
                        this.waveState = 'waiting_for_clear';
                    }
                } else {
                    this.waveState = 'waiting_for_clear';
                }
            } else if (this.waveState === 'waiting_for_clear') {
                if(this.enemies.length === 0 && this.bosses.length === 0) {
                    this.waveState = 'intermission';
                    const nextWaveIndex = (this.currentWaveIndex + 1) % this.waveData.length;
                    this.waveTimer = this.waveData[nextWaveIndex].duration || 180; // Default 3s break
                    document.getElementById('wave-display').textContent = `WAVE CLEARED!`;
                }
            }
        }
    }
    
    // ... (All other methods like spawnBoss, powerups, collisions, drawing, etc. are restored here) ...
    spawnBoss() { this.currentBoss = { x: this.w / 2, y: -120, w: 120, h: 100, hp: 3000, maxHp: 3000, speed: 1, color: '#e74c3c', points: 5000, lastShot: 0, angle: 0, phase: 1, hitTimer: 0, phaseTimer: 0 }; this.bosses.push(this.currentBoss); document.getElementById('bossHealth').style.display = 'block'; }
    spawnPowerUp(x, y) { if (Math.random() < 0.25) { const types = [ { type: 'health', symbol: '❤️', rarity: 0.5 }, { type: 'shield', symbol: '🛡️', rarity: 0.35 }, { type: 'drone', symbol: '⚙️', rarity: 0.15 } ]; let selected = types[0]; const rand = Math.random(); let cum = 0; for (const type of types) { cum += type.rarity; if (rand <= cum) { selected = type; break; } } this.powerUps.push({ w: 25, h: 25, x: x, y: y, speed: 2, angle: Math.random() * Math.PI * 2, ...selected }); } }
    enemyShoot(enemy) { const now = Date.now(); if (now - enemy.lastShot < 2000) return; enemy.lastShot = now; const px = this.player.x; const py = this.player.y; if (enemy.pattern === 'straight') { const angle = Math.atan2(py - enemy.y, px - enemy.x); this.enemyBullets.push({ x: enemy.x + enemy.w / 2, y: enemy.y + enemy.h / 2, vx: Math.cos(angle) * 5, vy: Math.sin(angle) * 5, w: 8, h: 8, color: enemy.color }); } else if (enemy.pattern === 'circle') { for (let i = 0; i < 10; i++) { const angle = (Math.PI * 2 / 10) * i + enemy.angle; this.enemyBullets.push({ x: enemy.x + enemy.w / 2, y: enemy.y + enemy.h / 2, vx: Math.cos(angle) * 3, vy: Math.sin(angle) * 3, w: 6, h: 6, color: enemy.color }); } enemy.angle += 0.5; } }
    bossShoot(boss) { const now = Date.now(); if (now - boss.lastShot < 300) return; boss.lastShot = now; for (let i = 0; i < 2; i++) { const angle = (Math.PI * 2 / 8) * boss.phaseTimer + (i * Math.PI); this.enemyBullets.push({ x: boss.x, y: boss.y, vx: Math.cos(angle) * 4, vy: Math.sin(angle) * 4, w: 10, h: 10, color: boss.color }); } boss.phaseTimer++; }
    addParticles(x, y, color, count = 8, lifeMultiplier = 1) { for (let i = 0; i < count; i++) { const angle = Math.random() * Math.PI * 2; const speed = Math.random() * 5 + 2; this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: (Math.random() * 30 + 20) * lifeMultiplier, color, size: Math.random() * 3 + 2 }); } }
    addCombo() { this.combo++; this.comboTimer = 180; this.multiplier = Math.min(8, Math.floor(this.combo / 5) + 1); this.player.special = Math.min(100, this.player.special + 2); }
    resetCombo() { this.combo = 0; this.multiplier = 1; }
    checkAchievements() { const newAchievements = []; this.achievementDefs.forEach(aDef => { const check = () => { switch(aDef.id) { case 'first_kill': return this.kills >= 1; case 'combo_10': return this.combo >= 10; case 'level_5': return this.level >= 5; case 'score_5k': return this.score >= 5000; case 'boss_killer': return this.bosses.length === 0 && this.currentBoss; case 'total_100': return this.data.totalKills >= 100; default: return false; } }; if (!this.data.achievements.includes(aDef.id) && check()) { newAchievements.push(aDef); this.showAchievement(aDef); } }); return newAchievements; }
    showAchievement(achievement) { const popup = document.getElementById('achievementPopup'); popup.innerHTML = `🏆 ${achievement.name}<br><small>${achievement.desc}</small>`; popup.style.display = 'block'; setTimeout(() => { popup.style.display = 'none'; }, 3000); }
    triggerShake(duration, magnitude) { this.shakeDuration = duration; this.shakeMagnitude = magnitude; }
    update() {
        if (!this.started || this.gameOver || this.paused) return;
        if (this.shakeDuration > 0) this.shakeDuration--;
        if (this.slowMotion) { this.slowTimer--; if (this.slowTimer <= 0) { this.slowMotion = false; document.getElementById('slowmoOverlay').classList.remove('active'); } }
        if (this.player.dashCooldown > 0) this.player.dashCooldown--;
        let moveX = this.touchPos.x; let moveY = this.touchPos.y;
        if(this.player.dashTimer > 0) { const dashSpeed = 30; const angle = Math.atan2(this.touchPos.y - this.player.y, this.touchPos.x - this.player.x); moveX = this.player.x + Math.cos(angle) * dashSpeed; moveY = this.player.y + Math.sin(angle) * dashSpeed; this.player.invulnerable = 10; this.player.dashTimer--; }
        this.player.x += (moveX - this.player.x) * this.player.agility; this.player.y += (moveY - this.player.y) * this.player.agility;
        this.player.x = Math.max(this.player.w/2, Math.min(this.w - this.player.w/2, this.player.x)); this.player.y = Math.max(this.player.h/2, Math.min(this.h - this.player.h/2, this.player.y));
        this.autoShoot(); this.drones.forEach(d => d.update(this));
        if (this.player.invulnerable > 0) this.player.invulnerable--;
        if (this.comboTimer > 0) { this.comboTimer--; } else if (this.combo > 0) { this.resetCombo(); }
        if (this.player.special < 100 && !this.slowMotion) { this.player.special += 0.1; }
        this.bullets.forEach(b => { if (b.type === 'wave') { b.radius += 10; } else { b.x += b.vx; b.y += b.vy; } b.life--; });
        this.bullets = this.bullets.filter(b => b.life > 0 && b.x > -50 && b.x < this.w + 50 && b.y > -50 && b.y < this.h + 50);
        this.enemyBullets.forEach(b => { b.x += b.vx; b.y += b.vy; });
        this.enemyBullets = this.enemyBullets.filter(b => b.x > -50 && b.x < this.w + 50 && b.y > -50 && b.y < this.h + 50);
        this.enemies.forEach(e => { if (e.pattern === 'sine') { e.x += Math.sin(e.movementTimer) * 3; e.movementTimer += 0.05; } e.y += e.speed; this.enemyShoot(e); });
        this.enemies = this.enemies.filter(e => e.y < this.h + 60);
        this.bosses.forEach(boss => { if(boss.y < 100) boss.y += boss.speed; this.bossShoot(boss); });
        this.powerUps.forEach(p => { p.y += p.speed; }); this.powerUps = this.powerUps.filter(p => p.y < this.h + 50);
        this.particles = this.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.life--; return p.life > 0; });
        
        // [新功能] 波次系統
        this.updateWaves();
        this.levelTimer++; if (this.levelTimer > 2400) { this.level++; this.levelTimer = 0; }
        
        this.checkCollisions(); this.updateUI();
    }
    checkCollisions() { const checkHit = (obj1, obj2) => { if (obj1.type === 'wave') { return Math.sqrt(Math.pow(obj1.x - obj2.x, 2) + Math.pow(obj1.y - obj2.y, 2)) < obj1.radius; } const dx = obj1.x - obj2.x; const dy = obj1.y - obj2.y; return Math.sqrt(dx*dx + dy*dy) < (obj1.w/2 || 0) + (obj2.w/2 || 0); }; this.bullets.forEach((bullet) => { [...this.enemies, ...this.bosses].forEach((target) => { if (checkHit(bullet, target)) { target.hp -= bullet.damage; target.hitTimer = 5; if (bullet.type !== 'flame' && bullet.type !== 'wave') { bullet.life = 0; } if (target.hp <= 0) { this.score += target.points * this.multiplier; this.kills++; this.data.totalKills++; this.addCombo(); this.spawnPowerUp(target.x, target.y); this.addParticles(target.x, target.y, target.color, 30, 1.2); this.triggerShake(15, 5); if (this.bosses.includes(target)) { this.bosses.splice(this.bosses.indexOf(target), 1); document.getElementById('bossHealth').style.display = 'none'; this.triggerShake(50, 10); } else { this.enemies.splice(this.enemies.indexOf(target), 1); } } } }); }); [...this.enemyBullets, ...this.enemies, ...this.bosses].forEach((obj) => { if (this.player.invulnerable <= 0 && checkHit(obj, this.player)) { this.triggerShake(20, 5); let damage = obj.hasOwnProperty('hp') ? 30 : 20; if (this.player.shield > 0) { this.player.shield -= damage; if (this.player.shield < 0) { this.player.hp += this.player.shield; this.player.shield = 0; } } else { this.player.hp -= damage; } this.player.invulnerable = 60; this.addParticles(this.player.x, this.player.y, '#ff4757', 15); this.resetCombo(); if (this.player.hp <= 0) { this.lives--; if (this.lives > 0) { this.player.hp = this.player.maxHp; this.player.shield = 50; this.player.invulnerable = 180; } else { this.endGame(); } } } }); this.powerUps.forEach((powerUp, pi) => { if (checkHit(powerUp, this.player)) { this.collectPowerUp(powerUp); this.powerUps.splice(pi, 1); } }); }
    collectPowerUp(powerUp) { switch(powerUp.type) { case 'health': this.player.hp = Math.min(this.player.maxHp, this.player.hp + 50); break; case 'shield': this.player.shield = Math.min(this.player.maxShield, this.player.shield + 50); break; case 'drone': if (this.drones.length < 2) { this.drones.push(new Drone(this.drones.length, this)); } break; } this.addParticles(powerUp.x, powerUp.y, '#ffd700', 20); this.player.special = Math.min(100, this.player.special + 10); }
    updateUI() { document.getElementById('score').textContent = this.score; document.getElementById('level').textContent = this.level; document.getElementById('lives').textContent = this.lives; document.getElementById('combo').textContent = this.combo; document.getElementById('multiplier').textContent = this.multiplier; document.getElementById('healthFill').style.width = (this.player.hp / this.player.maxHp * 100) + '%'; document.getElementById('shieldFill').style.width = (this.player.shield / this.player.maxShield * 100) + '%'; document.getElementById('specialFill').style.width = this.player.special + '%'; const specialBtn = document.getElementById('specialBtn'); if (this.player.special >= 100 && !this.slowMotion) { specialBtn.classList.remove('disabled'); } else { specialBtn.classList.add('disabled'); } if (this.currentBoss && this.bosses.includes(this.currentBoss)) { document.getElementById('bossHealthFill').style.width = (this.currentBoss.hp / this.currentBoss.maxHp) * 100 + '%'; } }
    draw() { this.ctx.fillStyle = 'rgba(15, 20, 25, 0.2)'; this.ctx.fillRect(0, 0, this.w, this.h); this.ctx.save(); if (this.shakeDuration > 0) { const shakeX = (Math.random() - 0.5) * this.shakeMagnitude; const shakeY = (Math.random() - 0.5) * this.shakeMagnitude; this.ctx.translate(shakeX, shakeY); } this.drawBackground(); if (!this.started || this.paused) { this.ctx.restore(); return; } this.drawGameObjects(this.powerUps, this.drawPowerUp); this.drawGameObjects(this.particles, this.drawParticle); this.drawGameObjects(this.bullets, this.drawBullet); this.drawGameObjects(this.enemyBullets, this.drawEnemyBullet); this.drawGameObjects(this.enemies, this.drawEnemy); this.drawGameObjects(this.bosses, this.drawEnemy); this.drones.forEach(d => d.draw(this.ctx)); this.drawPlayer(); this.ctx.restore(); }
    drawBackground() { this.ctx.save(); this.nebula.forEach(n => { n.y += n.speed; n.x += Math.cos(n.drift); if(n.y > this.h + n.size) { n.y = -n.size; n.x = Math.random() * this.w; } const grad = this.ctx.createRadialGradient(n.x, n.y, n.size * 0.1, n.x, n.y, n.size); grad.addColorStop(0, n.color.replace('0.1', '0.3')); grad.addColorStop(1, n.color); this.ctx.fillStyle = grad; this.ctx.fillRect(0,0,this.w,this.h); }); this.bgStars.forEach(s => { s.y += s.speed * (this.slowMotion ? 0.3 : 1); s.twinkle += s.twinkleSpeed; if (s.y > this.h) { s.y = 0; s.x = Math.random() * this.w; } this.ctx.globalAlpha = 0.5 + Math.sin(s.twinkle) * 0.5; this.ctx.fillStyle = 'white'; this.ctx.fillRect(s.x, s.y, s.size, s.size); }); this.ctx.restore(); }
    drawGameObjects(objects, drawFunc) { objects.forEach(obj => drawFunc.call(this, obj)); }
    drawPlayer() { this.ctx.save(); if (this.player.invulnerable > 0) { this.ctx.globalAlpha = Math.abs(Math.sin(this.player.invulnerable * 0.5)); } const thrusterColor = this.player.engine.stats.thrusterColor; if (this.player.dashTimer > 0) { this.ctx.fillStyle = `rgba(${this.hexToRgb(thrusterColor)}, 0.5)`; this.ctx.beginPath(); this.ctx.arc(this.player.x, this.player.y, this.player.w * 1.5, 0, Math.PI * 2); this.ctx.fill(); } else { this.ctx.fillStyle = `rgba(${this.hexToRgb(thrusterColor)}, 0.8)`; this.ctx.shadowColor = thrusterColor; this.ctx.shadowBlur = 15; this.ctx.beginPath(); this.ctx.arc(this.player.x, this.player.y - this.player.h / 3, this.player.h / 3, 0, Math.PI * 2); this.ctx.fill(); } this.ctx.fillStyle = this.player.body.color; this.ctx.shadowColor = this.player.body.color; this.ctx.shadowBlur = 20; this.ctx.beginPath(); this.ctx.moveTo(this.player.x, this.player.y - this.player.h / 2); this.ctx.lineTo(this.player.x - this.player.w / 2, this.player.y + this.player.h / 2); this.ctx.lineTo(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2); this.ctx.closePath(); this.ctx.fill(); if (this.player.shield > 0) { this.ctx.strokeStyle = `rgba(0,212,255, ${0.5 + (this.player.shield / this.player.maxShield) * 0.5})`; this.ctx.lineWidth = 3 + (this.player.shield / this.player.maxShield) * 4; this.ctx.shadowColor = '#00d4ff'; this.ctx.shadowBlur = 25; this.ctx.beginPath(); this.ctx.arc(this.player.x, this.player.y, this.player.w, 0, Math.PI * 2); this.ctx.stroke(); } this.ctx.restore(); }
    drawBullet(b) { this.ctx.save(); if (b.type === 'wave') { this.ctx.strokeStyle = `rgba(233, 213, 255, ${b.life / 90 * 0.8})`; this.ctx.lineWidth = 10; this.ctx.shadowColor = '#e9d5ff'; this.ctx.shadowBlur = 30; this.ctx.beginPath(); this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); this.ctx.stroke(); } else if (b.type === 'flame') { const grad = this.ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.w); grad.addColorStop(0, `rgba(255, 200, 100, ${b.life / 30})`); grad.addColorStop(1, `rgba(255, 100, 50, 0)`); this.ctx.fillStyle = grad; this.ctx.beginPath(); this.ctx.arc(b.x, b.y, b.w, 0, Math.PI * 2); this.ctx.fill(); } else { this.ctx.fillStyle = this.player.weapon.color; this.ctx.shadowColor = this.player.weapon.color; this.ctx.shadowBlur = 15; this.ctx.beginPath(); this.ctx.arc(b.x, b.y, b.w/2, 0, Math.PI*2); this.ctx.fill(); } this.ctx.restore(); }
    drawEnemy(e) { this.ctx.save(); if(e.hitTimer > 0) { this.ctx.filter = 'brightness(2)'; } this.ctx.fillStyle = e.color; this.ctx.shadowColor = e.color; this.ctx.shadowBlur = 20; this.ctx.fillRect(e.x, e.y, e.w, e.h); this.ctx.restore(); const hpPercent = e.hp / e.maxHp; this.ctx.fillStyle = 'rgba(0,0,0,0.5)'; this.ctx.fillRect(e.x, e.y - 10, e.w, 5); this.ctx.fillStyle = hpPercent > 0.5 ? '#4CAF50' : hpPercent > 0.25 ? '#FFC107' : '#F44336'; this.ctx.fillRect(e.x, e.y - 10, e.w * hpPercent, 5); }
    drawEnemyBullet(b) { this.ctx.save(); this.ctx.fillStyle = b.color; this.ctx.shadowColor = b.color; this.ctx.shadowBlur = 15; this.ctx.beginPath(); this.ctx.arc(b.x, b.y, b.w/2, 0, Math.PI*2); this.ctx.fill(); this.ctx.restore(); }
    drawPowerUp(p) { this.ctx.save(); this.ctx.font = '24px Arial'; this.ctx.textAlign = 'center'; this.ctx.textBaseline = 'middle'; this.ctx.shadowColor = '#ffd700'; this.ctx.shadowBlur = 20; this.ctx.fillText(p.symbol, p.x, p.y); this.ctx.restore(); }
    drawParticle(p) { this.ctx.save(); this.ctx.globalAlpha = p.life / 50; this.ctx.fillStyle = p.color; this.ctx.beginPath(); this.ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); this.ctx.fill(); this.ctx.restore(); }
    hexToRgb(hex) { const r = parseInt(hex.slice(1, 3), 16); const g = parseInt(hex.slice(3, 5), 16); const b = parseInt(hex.slice(5, 7), 16); return `${r}, ${g}, ${b}`; }
    endGame() { this.gameOver = true; if (this.score > this.data.highScore) { this.data.highScore = this.score; } const newAchievements = this.checkAchievements(); this.saveData(); document.getElementById('finalStats').innerHTML = `<div class="stats-grid"><div>最終分數: <strong>${this.score}</strong></div><div>最高分: <strong>${this.data.highScore}</strong></div><div>到達等級: <strong>${this.level}</strong></div><div>總擊殺: <strong>${this.kills}</strong></div><div>最高連擊: <strong>${this.combo}</strong></div></div>`; if (newAchievements.length > 0) { document.getElementById('newAchievements').innerHTML = `<h3>🎉 新成就解鎖！</h3>${newAchievements.map(a => `<div>✨ ${a.name}: ${a.desc}</div>`).join('')}`; } else { document.getElementById('newAchievements').innerHTML = ''; } document.getElementById('gameOver').style.display = 'flex'; }
    restart() { document.getElementById('gameOver').style.display = 'none'; this.initGame(); this.showBuilderScreen(); }
    backToMenu() { document.getElementById('gameOver').style.display = 'none'; document.getElementById('pauseScreen').style.display = 'none'; this.initGame(); document.getElementById('startScreen').style.display = 'flex'; }
    loop() { if(!this.paused) { this.update(); } this.draw(); requestAnimationFrame(() => this.loop()); }
        }
        class Drone {
            constructor(index, game) { this.index = index; this.game = game; this.angle = index * Math.PI; this.lastShot = 0; this.dist = 60; }
            update() {
                this.angle += 0.05; this.x = this.game.player.x + Math.cos(this.angle) * this.dist; this.y = this.game.player.y + Math.sin(this.angle) * this.dist;
                const now = Date.now();
                if (now - this.lastShot > 500) {
                    this.lastShot = now; this.game.bullets.push({ x: this.x, y: this.y, w: 8, h: 8, damage: 10, type: 'bubble', life: 60, vx: 0, vy: -10 });
                }
            }
            draw(ctx) { ctx.save(); ctx.fillStyle = '#00d4ff'; ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 15; ctx.beginPath(); ctx.arc(this.x, this.y, 8, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
        }
        
        const game = new Game();