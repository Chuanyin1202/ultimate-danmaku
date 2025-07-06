export default class UIManager {
    constructor(game) {
        this.game = game;
        this.cacheDOMElements();
        this.bindButtonEvents();
    }

    cacheDOMElements() {
        this.scoreEl = document.getElementById('score');
        this.levelEl = document.getElementById('level');
        this.livesEl = document.getElementById('lives');
        this.waveDisplayEl = document.getElementById('wave-display');
        this.healthFillEl = document.getElementById('healthFill');
        this.shieldFillEl = document.getElementById('shieldFill');
        this.specialFillEl = document.getElementById('specialFill');
        this.comboEl = document.getElementById('combo');
        this.multiplierEl = document.getElementById('multiplier');
        this.specialBtn = document.getElementById('specialBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.bossHealthBar = document.getElementById('bossHealth');
        this.bossHealthFill = document.getElementById('bossHealthFill');
        this.achievementPopup = document.getElementById('achievementPopup');
        this.startScreen = document.getElementById('startScreen');
        this.builderScreen = document.getElementById('builderScreen');
        this.gameOverScreen = document.getElementById('gameOver');
        this.pauseScreen = document.getElementById('pauseScreen');
        this.displayHighScore = document.getElementById('displayHighScore');
        this.displayTotalGames = document.getElementById('displayTotalGames');
        this.displayTotalKills = document.getElementById('displayTotalKills');
        this.displayAchievements = document.getElementById('displayAchievements');
        this.finalStatsEl = document.getElementById('finalStats');
        this.newAchievementsEl = document.getElementById('newAchievements');
    }

    bindButtonEvents() {
        const startBuildBtn = document.getElementById('startBuildBtn');
        const startCombatBtn = document.getElementById('startCombatBtn');
        const restartBtn = document.getElementById('restartBtn');
        const backToMenuBtn = document.getElementById('backToMenuBtn');
        const resumeBtn = document.getElementById('resumeBtn');
        const pauseBackToMenuBtn = document.getElementById('pauseBackToMenuBtn');

        if (startBuildBtn) startBuildBtn.addEventListener('click', () => this.game.showBuilderScreen());
        else console.error('startBuildBtn not found');
        if (startCombatBtn) startCombatBtn.addEventListener('click', () => this.game.confirmSelectionAndStart());
        else console.error('startCombatBtn not found');
        if (restartBtn) restartBtn.addEventListener('click', () => this.game.restart());
        else console.error('restartBtn not found');
        if (backToMenuBtn) backToMenuBtn.addEventListener('click', () => this.game.backToMenu());
        else console.error('backToMenuBtn not found');
        if (resumeBtn) resumeBtn.addEventListener('click', () => this.game.togglePause());
        else console.error('resumeBtn not found');
        if (pauseBackToMenuBtn) pauseBackToMenuBtn.addEventListener('click', () => this.game.backToMenu());
        else console.error('pauseBackToMenuBtn not found');
        if (this.specialBtn) this.specialBtn.addEventListener('click', () => this.game.useSpecial());
        else console.error('specialBtn not found');
        if (this.pauseBtn) this.pauseBtn.addEventListener('click', () => this.game.togglePause());
        else console.error('pauseBtn not found');
    }

    init() {
        if (this.pauseScreen) this.pauseScreen.style.display = 'none';
        if (this.builderScreen) this.builderScreen.style.display = 'none';
        if (this.startScreen) this.startScreen.style.display = 'flex';
        if (this.gameOverScreen) this.gameOverScreen.style.display = 'none';
        if (this.bossHealthBar) this.bossHealthBar.style.display = 'none';
    }
    
    updateStartScreen(data) { 
        if (this.displayHighScore) this.displayHighScore.textContent = data.highScore; 
        if (this.displayTotalGames) this.displayTotalGames.textContent = data.totalGames; 
        if (this.displayTotalKills) this.displayTotalKills.textContent = data.totalKills; 
        if (this.displayAchievements) this.displayAchievements.textContent = data.achievements.length; 
    }

    update(game) {
        if (this.scoreEl) this.scoreEl.textContent = game.score;
        if (this.levelEl) this.levelEl.textContent = game.level;
        if (this.livesEl) this.livesEl.textContent = game.lives;
        if (this.comboEl) this.comboEl.textContent = game.combo;
        if (this.multiplierEl) this.multiplierEl.textContent = game.multiplier;
        if (this.healthFillEl) this.healthFillEl.style.width = (game.player.hp / game.player.maxHp * 100) + '%';
        if (this.shieldFillEl) this.shieldFillEl.style.width = (game.player.shield / game.player.maxShield * 100) + '%';
        if (this.specialFillEl) this.specialFillEl.style.width = game.player.special + '%';
        if (this.specialBtn) {
            if (game.player.special >= 100 && !game.slowMotion) {
                this.specialBtn.classList.remove('disabled');
            } else {
                this.specialBtn.classList.add('disabled');
            }
        }
        if (this.bossHealthFill && game.currentBoss && game.bosses.includes(game.currentBoss)) {
            this.bossHealthFill.style.width = (game.currentBoss.hp / game.currentBoss.maxHp * 100) + '%';
        }
        
        if (game.started && !game.gameOver && this.waveDisplayEl) {
            const survivalTime = Math.floor((Date.now() - game.waveManager.startTime) / 1000);
            const minutes = Math.floor(survivalTime / 60).toString().padStart(2, '0');
            const seconds = (survivalTime % 60).toString().padStart(2, '0');
            this.waveDisplayEl.textContent = `生存時間: ${minutes}:${seconds}`;
        } else if (this.waveDisplayEl) {
            this.waveDisplayEl.textContent = '準備迎敵...';
        }
    }

    updateBuilderSummary(playerSelection) {
        const summaryEl = document.getElementById('builder-summary');
        if (summaryEl) {
            const { body, weapon, engine } = playerSelection;
            summaryEl.innerHTML = `<h2 style="font-weight: bold; font-size: 24px; margin-bottom: 15px;">⚡ 當前組合：</h2><ul style="list-style: none; padding: 0; line-height: 1.8;"><li style="margin: 8px 0; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 8px;">🔧 主體：${body ? body.name + ' (' + body.effect + ')' : '尚未選擇'}</li><li style="margin: 8px 0; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 8px;">🎯 武器：${weapon ? weapon.name + ' (' + weapon.effect + ')' : '尚未選擇'}</li><li style="margin: 8px 0; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 8px;">🚀 引擎：${engine ? engine.name + ' (' + engine.effect + ')' : '尚未選擇'}</li></ul>`;
        }
    }

    showBuilderScreen() {
        if (this.startScreen) this.startScreen.style.display = 'none';
        if (this.builderScreen) this.builderScreen.style.display = 'flex';
        document.body.classList.add('scrollable');
    }

    hideBuilderScreen() {
        if (this.builderScreen) this.builderScreen.style.display = 'none';
        document.body.classList.remove('scrollable');
    }

    showGameOver(game) {
        const survivalTimeText = this.waveDisplayEl ? this.waveDisplayEl.textContent.split(': ')[1] || '00:00' : '00:00';
        if (this.finalStatsEl) {
            this.finalStatsEl.innerHTML = `<div class="stats-grid"><div>最終分數: <strong>${game.score}</strong></div><div>最高分: <strong>${game.data.highScore}</strong></div><div>生存時間: <strong>${survivalTimeText}</strong></div><div>總擊殺: <strong>${game.kills}</strong></div><div>最高連擊: <strong>${game.combo}</strong></div></div>`;
        }
        const newAchievements = game.checkAchievements();
        if (this.newAchievementsEl) {
            if (newAchievements.length > 0) {
                this.newAchievementsEl.innerHTML = `<h3>🎉 新成就解鎖！</h3>${newAchievements.map(a => `<div>✨ ${a.name}: ${a.desc}</div>`).join('')}`;
            } else {
                this.newAchievementsEl.innerHTML = '';
            }
        }
        if (this.gameOverScreen) this.gameOverScreen.style.display = 'flex';
    }

    showAchievement(achievement) {
        if (this.achievementPopup) {
            this.achievementPopup.innerHTML = `🏆 ${achievement.name}<br><small>${achievement.desc}</small>`;
            this.achievementPopup.style.display = 'block';
            setTimeout(() => { this.achievementPopup.style.display = 'none'; }, 3000);
        }
    }

    togglePause(isPaused) {
        if (this.pauseScreen) this.pauseScreen.style.display = isPaused ? 'flex' : 'none';
        if (this.pauseBtn) this.pauseBtn.innerHTML = isPaused ? '▶' : '⏸';
    }
}