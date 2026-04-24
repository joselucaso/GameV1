/**
 * Entity.js - Classe base para todas as entidades do jogo
 * 
 * Contém apenas lógica genérica compartilhada por todas as unidades:
 * HP, dano, posição, distância, barra de vida, flash de dano.
 * 
 * Subclasses: Base, Tower, Minion, Hero (cada uma em seu arquivo).
 */
class Entity {
    /**
     * @param {number} x - Posição X inicial
     * @param {number} y - Posição Y inicial
     * @param {object} config - { hp, damage, attackSpeed, attackRange, radius, team }
     */
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.hp = config.hp;
        this.maxHp = config.hp;
        this.damage = config.damage || 0;
        this.attackSpeed = config.attackSpeed || 1;
        this.attackRange = config.attackRange || 0;
        this.radius = config.radius || 10;
        this.team = config.team;    // 'player' ou 'enemy'
        this.alive = true;
        this.attackTimer = 0;
        this.flashTimer = 0;
        this.type = 'entity';       // sobrescrito pelas subclasses
    }

    // ---- Dano e vida ----

    /**
     * Aplica dano à entidade. Emite evento 'entity:death' se morrer.
     * @param {number} amount
     * @param {Entity} source - Origem do dano
     */
    takeDamage(amount, source = null) {
        if (!this.alive) return;
        this.hp -= amount;
        this.flashTimer = 0.12;

        // Emite evento de dano para efeitos visuais e números flutuantes
        EventBus.emit('entity:damage', { entity: this, amount: Math.ceil(amount), source });

        if (this.hp <= 0) {
            this.hp = 0;
            this.alive = false;
            EventBus.emit('entity:death', { entity: this });
        }
    }

    isAlive() { return this.alive; }

    // ---- Geometria ----

    /** Distância até outra entidade */
    distanceTo(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /** Verifica se outra entidade está no alcance de ataque */
    isInRange(other) {
        return this.distanceTo(other) <= this.attackRange;
    }

    // ---- Combate ----

    /**
     * Atualiza o timer de ataque. Retorna true quando pronto para atacar.
     * @param {number} dt
     */
    tryAttack(dt) {
        this.attackTimer -= dt;
        if (this.attackTimer <= 0) {
            this.attackTimer = 1 / this.attackSpeed;
            return true;
        }
        return false;
    }

    /**
     * Encontra o inimigo mais próximo na lista
     * @param {Entity[]} enemies
     * @returns {Entity|null}
     */
    findNearestEnemy(enemies) {
        let nearest = null;
        let minDist = Infinity;
        for (const enemy of enemies) {
            if (!enemy.isAlive()) continue;
            const dist = this.distanceTo(enemy);
            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        }
        return nearest;
    }

    // ---- Visual ----

    /** Atualiza o flash de dano */
    updateFlash(dt) {
        if (this.flashTimer > 0) this.flashTimer -= dt;
    }

    /**
     * Desenha a barra de vida acima da entidade
     * @param {CanvasRenderingContext2D} ctx
     */
    drawHealthBar(ctx) {
        if (this.hp >= this.maxHp) return;

        const barWidth = this.radius * 2.5;
        const barHeight = 3;
        const x = this.x - barWidth / 2;
        const y = this.y - this.radius - 8;
        const hpRatio = this.hp / this.maxHp;

        // Fundo
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.beginPath();
        ctx.roundRect(x - 1, y - 1, barWidth + 2, barHeight + 2, 2);
        ctx.fill();

        // Cor dinâmica
        let c1, c2;
        if (hpRatio > 0.5)       { c1 = '#22c55e'; c2 = '#4ade80'; }
        else if (hpRatio > 0.25) { c1 = '#f59e0b'; c2 = '#fbbf24'; }
        else                     { c1 = '#ef4444'; c2 = '#f87171'; }

        const grad = ctx.createLinearGradient(x, y, x + barWidth * hpRatio, y);
        grad.addColorStop(0, c1);
        grad.addColorStop(1, c2);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth * hpRatio, barHeight, 2);
        ctx.fill();
    }

    /**
     * Retorna as cores do time para renderização
     * @returns {object} Cores do GameConfig.TEAM_COLORS
     */
    getTeamColors() {
        return GameConfig.TEAM_COLORS[this.team];
    }
}
