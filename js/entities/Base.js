/**
 * Base.js - Castelo principal de cada time
 * 
 * Defende seu território atacando inimigos no alcance.
 * Quando destruída, o jogo acaba.
 */
class Base extends Entity {
    constructor(x, y, team) {
        const cfg = GameConfig.BASE;
        super(x, y, {
            hp: cfg.hp,
            damage: cfg.damage,
            attackSpeed: cfg.attackSpeed,
            attackRange: cfg.attackRange,
            radius: cfg.radius,
            team: team
        });
        this.type = 'base';
        this.icon = cfg.icon;
        this.pulseTime = 0;
        this.target = null;
        this.beams = [];
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
        if (enemies) {
            for (const enemy of enemies) {
                if (!enemy.isAlive()) continue;
                const dist = this.distanceTo(enemy);
                if (dist <= this.attackRange && dist < minDist) {
                    minDist = dist;
                    this.target = enemy;
                }
            }
        }

        // Ataca
        if (this.target && this.tryAttack(dt)) {
            this.target.takeDamage(this.damage, this);
            this.beams.push({
                tx: this.target.x, ty: this.target.y,
                life: 0.2, maxLife: 0.2
            });
        }
    }

    draw(ctx) {
        if (!this.alive) return;
        const tc = this.getTeamColors();
        const pulse = Math.sin(this.pulseTime * 2) * 0.15 + 0.85;

        // Brilho externo
        const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2.5);
        glow.addColorStop(0, `rgba(${tc.glow},${0.2 * pulse})`);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Base escura
        ctx.fillStyle = '#1f2937';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
        ctx.fill();

        // Corpo
        const bodyGrad = ctx.createRadialGradient(
            this.x - 4, this.y - 4, 3, this.x, this.y, this.radius
        );
        if (this.flashTimer > 0) {
            bodyGrad.addColorStop(0, '#ffffff');
            bodyGrad.addColorStop(1, '#cccccc');
        } else {
            bodyGrad.addColorStop(0, tc.primary);
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
        ctx.font = `${this.radius * 0.9}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, this.x, this.y);

        // Indicador de alcance (quando atacando)
        if (this.target) {
            ctx.strokeStyle = `rgba(${tc.glow},0.08)`;
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 6]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.attackRange, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Lasers (mais grossos que os das torres)
        for (const beam of this.beams) {
            const alpha = beam.life / beam.maxLife;
            ctx.strokeStyle = `rgba(${tc.glow},${alpha})`;
            ctx.lineWidth = 3 + 3 * alpha;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(beam.tx, beam.ty);
            ctx.stroke();

            const ig = ctx.createRadialGradient(beam.tx, beam.ty, 0, beam.tx, beam.ty, 12 * alpha);
            ig.addColorStop(0, `rgba(255,255,255,${alpha * 0.7})`);
            ig.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = ig;
            ctx.beginPath();
            ctx.arc(beam.tx, beam.ty, 12 * alpha, 0, Math.PI * 2);
            ctx.fill();
        }

        this.drawHealthBar(ctx);
    }
}
