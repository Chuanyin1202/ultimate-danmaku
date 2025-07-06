// 📄 drone.js
export default class Drone {
    constructor(index, game) { 
        this.index = index; 
        this.game = game; 
        this.angle = index * Math.PI; 
        this.lastShot = 0; 
        this.dist = 60; 
    }
    
    update() {
        this.angle += 0.05; 
        this.x = this.game.player.x + Math.cos(this.angle) * this.dist; 
        this.y = this.game.player.y + Math.sin(this.angle) * this.dist;
        
        const now = Date.now();
        if (now - this.lastShot > 500) {
            this.lastShot = now; 
            const bullet = this.game.bulletPool.get();
            Object.assign(bullet, { 
                x: this.x, 
                y: this.y, 
                w: 8, 
                h: 8, 
                damage: 10, 
                type: 'bubble', 
                life: 60, 
                vx: 0, 
                vy: -10 
            });
        }
    }
    
    draw(ctx) { 
        ctx.save(); 
        ctx.fillStyle = '#00d4ff'; 
        ctx.shadowColor = '#00d4ff'; 
        ctx.shadowBlur = 15; 
        ctx.beginPath(); 
        ctx.arc(this.x, this.y, 8, 0, Math.PI * 2); 
        ctx.fill(); 
        ctx.restore(); 
    }
}