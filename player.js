export default class Player {
    constructor(game) {
        this.game = game;
        this.w = 35;
        this.h = 35;
        this.reset();
    }

    reset() {
        const playerSelection = this.game.playerSelection || {};
        const body = playerSelection.body || { stats: { maxHp: 100, agility: 0.15 }, color: '#fecdd3' };
        const weapon = playerSelection.weapon || { id: 'weapon_bubble', shoot: (player, target, bulletPool) => {
            const bullet = bulletPool.get();
            Object.assign(bullet, {
                x: player.x, y: player.y - player.h / 2, w: 8, h: 8, damage: 10, type: 'bubble', life: 60, vx: 0, vy: -10
            });
        }, color: '#bfdbfe' };
        const engine = playerSelection.engine || { stats: { thrusterColor: '#f97316' } };

        this.x = this.game.w / 2;
        this.y = this.game.h - 100;
        this.maxHp = body.stats.maxHp;
        this.hp = this.maxHp;
        this.shield = 0;
        this.maxShield = 100;
        this.special = 0;
        this.maxSpecial = 100;
        this.agility = body.stats.agility;
        this.weaponMethod = weapon.shoot;
        this.weapon = weapon;
        this.engine = engine;
        this.body = body;
        this.lastShot = 0;
        this.invulnerable = 0;
        this.dashTimer = 0;
        this.dashCooldown = 0;
        
        // 清除所有玩家子彈以防止武器切換後的殘留效果
        if (this.game.bulletPool) {
            this.game.bulletPool.getActiveObjects().forEach(bullet => {
                this.game.bulletPool.release(bullet);
            });
        }

        console.log('Player reset:', {
            weaponId: this.weapon.id,
            weaponMethod: this.weaponMethod ? 'defined' : 'undefined',
            bodyColor: this.body.color,
            engineThruster: this.engine.stats.thrusterColor
        });
    }

    update(delta, touchPos) {
        if (this.invulnerable > 0) this.invulnerable--;
        if (this.dashCooldown > 0) this.dashCooldown--;
        if (this.special < this.maxSpecial && !this.game.slowMotion) {
            this.special += 0.1;
        }

        if (this.dashTimer > 0) {
            const dashSpeed = 35;
            const angle = Math.atan2(touchPos.y - this.y, touchPos.x - this.x);
            this.x += Math.cos(angle) * dashSpeed;
            this.y += Math.sin(angle) * dashSpeed;
            this.invulnerable = 10;
            this.dashTimer--;
            this.game.addParticles(this.x, this.y, this.body.color, 3, 0.5);
        } else {
            this.x += (touchPos.x - this.x) * this.agility;
            this.y += (touchPos.y - this.y) * this.agility;
        }

        this.x = Math.max(this.w / 2, Math.min(this.game.w - this.w / 2, this.x));
        this.y = Math.max(this.h / 2, Math.min(this.game.h - this.h / 2, this.y));
    }

    draw(ctx) {
        ctx.save();
        if (this.invulnerable > 0) {
            ctx.globalAlpha = Math.abs(Math.sin(this.invulnerable * 0.5));
        }
        
        const thrusterColor = this.engine.stats.thrusterColor;
        if (this.dashTimer > 0) {
            ctx.fillStyle = `rgba(${this.game.hexToRgb(thrusterColor)}, 0.5)`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.w * 1.5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = `rgba(${this.game.hexToRgb(thrusterColor)}, 0.8)`;
            ctx.shadowColor = thrusterColor;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(this.x, this.y - this.h / 3, this.h / 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = this.body.color;
        ctx.shadowColor = this.body.color;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.h / 2);
        ctx.lineTo(this.x - this.w / 2, this.y + this.h / 2);
        ctx.lineTo(this.x + this.w / 2, this.y + this.h / 2);
        ctx.closePath();
        ctx.fill();
        
        if (this.shield > 0) {
            ctx.strokeStyle = `rgba(0,212,255, ${0.5 + (this.shield / this.maxShield) * 0.5})`;
            ctx.lineWidth = 3 + (this.shield / this.maxShield) * 4;
            ctx.shadowColor = '#00d4ff';
            ctx.shadowBlur = 25;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.w, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }

    tryDash() {
        if (this.engine.id === 'engine_fart' && this.dashCooldown <= 0) {
            this.dashTimer = 10;
            this.dashCooldown = 60;
            this.game.addParticles(this.x, this.y, this.engine.stats.thrusterColor, 30, 0.8);
        }
    }

    takeDamage(amount) {
        if (this.shield > 0) {
            this.shield -= amount;
            if (this.shield < 0) {
                this.hp += this.shield;
                this.shield = 0;
            }
        } else {
            this.hp -= amount;
        }
        this.invulnerable = 60;
    }
}