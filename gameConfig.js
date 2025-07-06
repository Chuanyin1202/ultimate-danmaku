// 遊戲配置模組 - 統一管理遊戲配置數據
export const GameConfig = {
    // 戰機配件配置
    fighterParts: {
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
                        life: 60, 
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
    },

    // 遊戲設定
    gameSettings: {
        initialLives: 3,
        maxSpecial: 100,
        maxShield: 100,
        comboResetTime: 180,
        maxComboMultiplier: 8,
        specialChargeRate: 0.1,
        specialComboBonus: 2,
        invulnerabilityTime: 60,
        dashTime: 10,
        dashCooldown: 60,
        levelUpTime: 2400,
        bossSpawnTime: 120000 // 2 minutes
    },

    // 敵人配置
    enemyTypes: {
        'straight': { w: 35, h: 35, hp: 60, speed: 1.5, color: '#ff4757', pattern: 'straight', points: 100, chaseSpeed: 1.5 },
        'circle': { w: 45, h: 45, hp: 100, speed: 1.0, color: '#5f27cd', pattern: 'circle', points: 200, chaseSpeed: 1.0 },
        'sine': { w: 30, h: 30, hp: 40, speed: 2.0, color: '#ff9ff3', pattern: 'sine', points: 150, movementTimer: Math.random() * 100, chaseSpeed: 2.0 }
    },

    // Boss 配置
    bossConfig: {
        w: 120,
        h: 100,
        hp: 1500,
        speed: 1,
        color: '#e74c3c',
        points: 5000,
        chaseSpeed: 0.8
    },

    // 道具配置
    powerUpTypes: [
        { type: 'health', symbol: '❤️', rarity: 0.5 },
        { type: 'shield', symbol: '🛡️', rarity: 0.35 },
        { type: 'drone', symbol: '⚙️', rarity: 0.15 }
    ],

    // 成就定義
    achievementDefs: [
        { id: 'first_kill', name: '初次擊殺', desc: '擊殺第一個敵人' },
        { id: 'combo_10', name: '連擊高手', desc: '達成10連擊' },
        { id: 'level_5', name: '生存專家', desc: '到達第5級' },
        { id: 'score_5k', name: '得分王', desc: '單局得分5000' },
        { id: 'boss_killer', name: 'Boss終結者', desc: '擊敗第一個Boss' },
        { id: 'total_100', name: '屠殺機器', desc: '累計擊殺100敵人' }
    ],

    // 背景配置
    backgroundConfig: {
        starCount: 150,
        nebulaCount: 5,
        starSizes: { min: 1, max: 4 },
        starSpeeds: { min: 0.1, max: 1.1 },
        nebulaSizes: { min: 100, max: 300 },
        nebulaSpeeds: { min: 0.1, max: 0.3 }
    },

    // 物件池配置
    poolSizes: {
        bullets: 200,
        enemies: 100,
        enemyBullets: 300,
        particles: 400
    },

    // 射擊設定
    shootingConfig: {
        weapon_bubble: { cooldown: 150 },
        weapon_flame: { cooldown: 40 },
        weapon_meow: { cooldown: 150 },
        enemy_straight: { cooldown: 2500 },
        enemy_circle: { cooldown: 2500 },
        boss: { cooldown: 300 }
    }
};

// 輔助函數
export class GameUtils {
    static calculateDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static calculateAngle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }

    static normalizeVector(dx, dy, speed) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance === 0) return { x: 0, y: 0 };
        return {
            x: (dx / distance) * speed,
            y: (dy / distance) * speed
        };
    }

    static hexToRgb(hex) {
        if (!hex) return '255,255,255';
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `${r}, ${g}, ${b}`;
    }

    static isOutOfBounds(obj, gameWidth, gameHeight, margin = 50) {
        return obj.x < -margin || obj.x > gameWidth + margin || 
               obj.y < -margin || obj.y > gameHeight + margin;
    }

    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
}