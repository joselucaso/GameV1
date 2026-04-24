/**
 * Tower.js - Torres defensivas
 * 
 * Stats lidos de GameConfig.TOWER.
 * Cores lidas de GameConfig.TEAM_COLORS.
 * Ataca automaticamente o inimigo mais próximo dentro do alcance.
 */
class Tower extends Entity {
    constructor(x, y, team, lane) {
        const cfg = GameConfig.TOWER;
        super(x, y, {
            hp: cfg.hp,
            damage: cfg.damage,
            attackSpeed: cfg.attackSpeed,
            attackRange: cfg.attackRange,
            radius: cfg.radius,
            team: team
        });
        this.type = 'tower';
        this.lane = lane;
        this.icon = cfg.icon;
        this.target = null;
        this.beams = [];
        this.pulseTime = Math.random() * Math.PI * 2;
    }

    update(dt, enemies) {
        if (!this.alive) return;
        this.updateFlash(dt);
        this.pulseTime += dt;

        // Atualiza lasers
        this.beams = this.beams.filter(b => { b.life -= dt; return b.life > 0; });

        // Busca alvo no alcance
        this.target = null;
        let minDist = Infinity;
        for (const enemy of enemies) {
            if (!enemy.isAlive()) continue;
            const dist = this.distanceTo(enemy);
            if (dist <= this.attackRange && dist < minDist) {
                minDist = dist;
                this.target = enemy;
            }
        }

        // Ataca
        if (this.target && this.tryAttack(dt)) {
            this.target.takeDamage(this.damage, this);
            this.beams.push({
                tx: this.target.x, ty: this.target.y,
                life: 0.15, maxLife: 0.15
            });
        }
    }

    draw(ctx) {
        if (!this.alive) return;
        const tc = this.getTeamColors();
        const pulse = Math.sin(this.pulseTime * 3) * 0.1 + 0.9;

        // Glow
        const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2);
        glow.addColorStop(0, `rgba(${tc.glow},${0.25 * pulse})`);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Base escura
        ctx.fillStyle = '#374151';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 4, 0, Math.PI * 2);
        ctx.fill();

        // Corpo
        const bodyGrad = ctx.createRadialGradient(
            this.x - 3, this.y - 3, 2, this.x, this.y, this.radius
        );
        if (this.flashTimer > 0) {
            bodyGrad.addColorStop(0, '#ffffff');
            bodyGrad.addColorStop(1, '#dddddd');
        } else {
            bodyGrad.addColorStop(0, tc.light);
            bodyGrad.addColorStop(1, tc.secondary);
        }
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Borda
        ctx.strokeStyle = tc.light;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Ícone
        ctx.font = `${this.radius * 0.85}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, this.x, this.y + 1);

        // Indicador de alcance
        if (this.target) {
            ctx.strokeStyle = `rgba(${tc.glow},0.12)`;
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 5]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.attackRange, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Lasers
        for (const beam of this.beams) {
            const alpha = beam.life / beam.maxLife;
            ctx.strokeStyle = `rgba(${tc.glow},${alpha})`;
            ctx.lineWidth = 2 + 2 * alpha;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(beam.tx, beam.ty);
            ctx.stroke();

            const ig = ctx.createRadialGradient(beam.tx, beam.ty, 0, beam.tx, beam.ty, 8 * alpha);
            ig.addColorStop(0, `rgba(255,255,255,${alpha * 0.6})`);
            ig.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = ig;
            ctx.beginPath();
            ctx.arc(beam.tx, beam.ty, 8 * alpha, 0, Math.PI * 2);
            ctx.fill();
        }

        this.drawHealthBar(ctx);
    }
}
