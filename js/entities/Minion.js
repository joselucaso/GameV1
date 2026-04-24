/**
 * Minion.js - Tropas automáticas
 * 
 * Stats lidos de GameConfig.MINION.
 * Cores lidas de GameConfig.TEAM_COLORS.
 * Segue waypoints pela lane e ataca inimigos próximos.
 */
class Minion extends Entity {
    constructor(x, y, team, lane, waypoints, minionType = 'MELEE') {
        const cfg = GameConfig.MINION[minionType];
        super(x, y, {
            hp: cfg.hp,
            damage: cfg.damage,
            attackSpeed: cfg.attackSpeed,
            attackRange: cfg.attackRange,
            radius: cfg.radius,
            team: team
        });
        this.type = 'minion';
        this.minionType = minionType;
        this.lane = lane;
        this.icon = cfg.icon;
        this.waypoints = waypoints;
        this.currentWaypoint = 0;
        this.moveSpeed = cfg.moveSpeed;
        this.chaseRange = cfg.chaseRange;
        this.target = null;
        this.animTime = Math.random() * 10;
        this.attackFlash = 0;
        this.specialEffects = [];
    }

    update(dt, enemies) {
        if (!this.alive) return;
        this.updateFlash(dt);
        this.animTime += dt;
        if (this.attackFlash > 0) this.attackFlash -= dt;

        // Atualiza efeitos visuais (projéteis)
        this.specialEffects = this.specialEffects.filter(e => { e.life -= dt; return e.life > 0; });

        // Busca inimigo mais próximo
        this.target = null;
        let minDist = Infinity;
        for (const enemy of enemies) {
            if (!enemy.isAlive()) continue;
            const dist = this.distanceTo(enemy);
            if (dist < minDist) { minDist = dist; this.target = enemy; }
        }

        // Atacar
        if (this.target && minDist <= this.attackRange) {
            if (this.tryAttack(dt)) {
                this.target.takeDamage(this.damage, this);
                this.attackFlash = 0.1;

                if (this.minionType === 'RANGED') {
                    this.createAttackVisual(this.target);
                }
            }
        }
        // Perseguir (para no alcance de ataque)
        else if (this.target && minDist <= this.chaseRange) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d > this.attackRange * 0.9) {
                this.x += (dx / d) * this.moveSpeed * dt;
                this.y += (dy / d) * this.moveSpeed * dt;
            }
        }
        // Seguir waypoints
        else {
            if (this.currentWaypoint < this.waypoints.length) {
                const wp = this.waypoints[this.currentWaypoint];
                const dx = wp.x - this.x;
                const dy = wp.y - this.y;
                const d = Math.sqrt(dx * dx + dy * dy);
                // Tolerância maior (35) permite contornar a torre e já seguir para o próximo ponto
                if (d < 35) this.currentWaypoint++;
                else {
                    this.x += (dx / d) * this.moveSpeed * dt;
                    this.y += (dy / d) * this.moveSpeed * dt;
                }
            }
        }
    }

    draw(ctx) {
        if (!this.alive) return;
        const tc = this.getTeamColors();
        const breathe = Math.sin(this.animTime * 4) * 0.8;

        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + this.radius * 0.5, this.radius * 0.8, this.radius * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Corpo
        const r = this.radius + breathe;
        const bodyGrad = ctx.createRadialGradient(this.x - 1, this.y - 1, 1, this.x, this.y, r);
        if (this.flashTimer > 0) {
            bodyGrad.addColorStop(0, '#ffffff');
            bodyGrad.addColorStop(1, '#cccccc');
        } else if (this.attackFlash > 0) {
            bodyGrad.addColorStop(0, '#fef08a');
            bodyGrad.addColorStop(1, tc.secondary);
        } else {
            bodyGrad.addColorStop(0, tc.light);
            bodyGrad.addColorStop(1, tc.primary);
        }
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Borda
        ctx.strokeStyle = `rgba(${tc.glow},0.6)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.stroke();

        // Ícone
        ctx.font = `${this.radius * 1.1}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, this.x, this.y);

        this.drawHealthBar(ctx);

        // Desenha efeitos visuais (projéteis)
        for (const effect of this.specialEffects) {
            if (effect.type === 'projectile') {
                const alpha = effect.life / effect.maxLife;
                const p = (1 - alpha) * 2;
                const curX = effect.startX + (effect.targetX - effect.startX) * Math.min(1, p);
                const curY = effect.startY + (effect.targetY - effect.startY) * Math.min(1, p);
                
                ctx.save();
                ctx.fillStyle = tc.light;
                ctx.beginPath();
                ctx.arc(curX, curY, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
    }

    /** Cria visual do ataque à distância */
    createAttackVisual(target) {
        this.specialEffects.push({
            type: 'projectile',
            startX: this.x,
            startY: this.y,
            targetX: target.x,
            targetY: target.y,
            life: 0.4,
            maxLife: 0.4
        });
    }
}
