/**
 * SpawnManager.js - Gerenciamento de Spawn de Minions
 * 
 * Responsabilidade única: criar minions em intervalos regulares.
 * Extraído do GameManager para manter o código modular.
 */
class SpawnManager {
    constructor() {
        this.spawnInterval = GameConfig.SPAWN_INTERVAL;
        this.spawnTimer = GameConfig.SPAWN_INITIAL_DELAY;
        this.particles = [];
        this.pendingSpawns = [];
        this.waveDelayTimer = 0;
    }

    /**
     * Define os waypoints das lanes
     * @param {object} waypoints - { leftPlayer, rightPlayer, leftEnemy, rightEnemy }
     */
    setWaypoints(waypoints) {
        this.waypoints = waypoints;
    }

    /**
     * Atualiza o timer e spawna minions quando pronto
     * @param {number} dt
     * @param {object} lists - { playerMinions: [], enemyMinions: [] }
     */
    update(dt, lists) {
        this.spawnTimer -= dt;

        // Processa fila de spawn sequencial
        if (this.pendingSpawns.length > 0) {
            this.waveDelayTimer -= dt;
            if (this.waveDelayTimer <= 0) {
                const next = this.pendingSpawns.shift();
                this._createMinion(next.team, next.type, lists);
                this.waveDelayTimer = 0.6; // 0.6s entre cada minion da sequência
            }
        }

        // Atualiza partículas de spawn
        this.particles = this.particles.filter(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            return p.life > 0;
        });

        if (this.spawnTimer <= 0) {
            this.spawnTimer = this.spawnInterval;
            this.spawnWave();
        }
    }

    /**
     * Adiciona minions à fila de spawn (2 Melee, 2 Ranged)
     */
    spawnWave() {
        const types = ['MELEE', 'RANGED'];
        
        for (const type of types) {
            this.pendingSpawns.push({ team: 'player', type });
            this.pendingSpawns.push({ team: 'enemy', type });
        }

        EventBus.emit('spawn:minions', {});
    }

    /** Cria o minion efetivamente e adiciona às listas */
    _createMinion(team, type, lists) {
        const W = GameConfig.MAP_WIDTH;
        const L = GameConfig.LAYOUT;

        if (team === 'player') {
            const spawnY = L.playerBaseY - 30; // Nasce na frente da base
            lists.playerMinions.push(
                new Minion(W / 2 - 30, spawnY, 'player', 'left', [...this.waypoints.leftPlayer], type),
                new Minion(W / 2 + 30, spawnY, 'player', 'right', [...this.waypoints.rightPlayer], type)
            );
            this._addSpawnParticles(W / 2, spawnY, 'player');
        } else {
            const spawnY = L.enemyBaseY + 30; // Nasce na frente da base
            lists.enemyMinions.push(
                new Minion(W / 2 - 30, spawnY, 'enemy', 'left', [...this.waypoints.leftEnemy], type),
                new Minion(W / 2 + 30, spawnY, 'enemy', 'right', [...this.waypoints.rightEnemy], type)
            );
            this._addSpawnParticles(W / 2, spawnY, 'enemy');
        }
    }

    /** Cria partículas decorativas no ponto de spawn */
    _addSpawnParticles(x, y, team) {
        const tc = GameConfig.TEAM_COLORS[team];
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 / 6) * i;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * 30,
                vy: Math.sin(angle) * 30,
                life: 0.6, maxLife: 0.6,
                color: tc.light,
                radius: 3
            });
        }
    }

    /** Desenha partículas de spawn */
    drawParticles(ctx) {
        for (const p of this.particles) {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    /** Reseta para novo jogo */
    reset() {
        this.spawnTimer = GameConfig.SPAWN_INITIAL_DELAY;
        this.particles = [];
    }
}
