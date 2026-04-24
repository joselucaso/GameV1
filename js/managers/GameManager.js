/**
 * GameManager.js - Orquestrador Principal (Refatorado)
 * 
 * Versão enxuta: apenas orquestra os sub-managers.
 * Toda lógica específica foi extraída para:
 *   - SpawnManager (spawn de minions)
 *   - Renderer (renderização do mapa)
 *   - UIManager (atualização da UI)
 *   - InputManager (input do jogador)
 *   - AbilitySystem (habilidades dos heróis)
 */
class GameManager {
    /**
     * @param {HTMLCanvasElement} canvas
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.running = false;
        this.gameOver = false;
        this.winner = null;
        this.gameTime = 0;

        // Sub-managers
        this.renderer = new Renderer(canvas);
        this.spawnManager = new SpawnManager();
        this.uiManager = new UIManager();
        this.inputManager = new InputManager(canvas, this.renderer);

        // Entidades do jogo
        this.playerBase = null;
        this.enemyBase = null;
        this.playerTowers = [];
        this.enemyTowers = [];
        this.playerMinions = [];
        this.enemyMinions = [];
        this.playerHero = null;
        this.enemyHero = null;

        // Herói selecionado pelo jogador (default: knight)
        this.selectedHeroId = 'knight';
        // Herói da IA (default: mage)
        this.enemyHeroId = 'mage';

        // Textos flutuantes (dano, cura, etc)
        this.floatingTexts = [];

        // Mapa ativo
        this.mapId = 'arena_classic';
        this.mapObstacles = [];
    }

    /**
     * Inicializa uma nova partida
     */
    init() {
        EventBus.clear();
        const W = GameConfig.MAP_WIDTH;
        const H = GameConfig.MAP_HEIGHT;
        const L = GameConfig.LAYOUT;

        // ---- Bases ----
        this.playerBase = new Base(W / 2, L.playerBaseY, 'player');
        this.enemyBase = new Base(W / 2, L.enemyBaseY, 'enemy');

        // ---- Torres ----
        this.playerTowers = [
            new Tower(L.towerLeftX, L.playerTowerY, 'player', 'left'),
            new Tower(L.towerRightX, L.playerTowerY, 'player', 'right')
        ];
        this.enemyTowers = [
            new Tower(L.towerLeftX, L.enemyTowerY, 'enemy', 'left'),
            new Tower(L.towerRightX, L.enemyTowerY, 'enemy', 'right')
        ];

        // ---- Heróis (criados a partir do HeroRegistry) ----
        // Escolhe oponente aleatório
        const allHeroes = HeroRegistry.list();
        this.enemyHeroId = allHeroes[Math.floor(Math.random() * allHeroes.length)];

        this.playerHero = new Hero(W / 2, L.playerHeroY, 'player', this.selectedHeroId, false);
        this.enemyHero = new Hero(W / 2, L.enemyHeroY, 'enemy', this.enemyHeroId, true);

        // ---- Waypoints das lanes (do MapRegistry) ----
        const mapCfg = MapRegistry.get(this.mapId);
        this.mapObstacles = mapCfg ? mapCfg.obstacles : [];
        const waypoints = mapCfg ? mapCfg.getWaypoints() : {};
        this.spawnManager.setWaypoints(waypoints);

        // ---- Reset de estado ----
        this.playerMinions = [];
        this.enemyMinions = [];
        this.floatingTexts = [];
        this.gameOver = false;
        this.winner = null;
        this.gameTime = 0;
        this.running = true;

        this.spawnManager.reset();
        this.uiManager.init();
        this.uiManager.setHeroInfo(this.playerHero);
        this.uiManager.setEnemyInfo(this.enemyHero);

        // ---- Input ----
        this.inputManager.setHero(this.playerHero);
        this.inputManager.setup(
            (x, y) => this._handleMove(x, y),
            (x, y) => this._handleSpecial(x, y)
        );

        // ---- Eventos ----
        EventBus.on('entity:death', (data) => this._onEntityDeath(data));
        EventBus.on('entity:damage', (data) => this._onEntityDamage(data));
        
        EventBus.on('fireball:impact', (data) => {
            const { x, y, damage, range, team, source } = data;
            const enemyTeam = team === 'player' ? 'enemy' : 'player';
            const targets = this._getTeamUnits(enemyTeam);
            
            for (const target of targets) {
                if (!target.isAlive()) continue;
                if (target.type !== 'hero' && target.type !== 'minion') continue; // IMUNIDADE
                
                const dx = target.x - x;
                const dy = target.y - y;
                if (Math.sqrt(dx * dx + dy * dy) <= range) {
                    target.takeDamage(damage, source);
                }
            }
        });
    }

    // =============================================
    //  LOOP DE ATUALIZAÇÃO
    // =============================================

    update(dt) {
        if (!this.running || this.gameOver) return;
        this.gameTime += dt;

        // Spawn
        const lists = { playerMinions: this.playerMinions, enemyMinions: this.enemyMinions };
        this.spawnManager.update(dt, lists);

        // Coleta alvos
        const playerTargets = this._getTeamUnits('player');
        const enemyTargets = this._getTeamUnits('enemy');

        // Torres
        for (const t of this.playerTowers) t.update(dt, enemyTargets);
        for (const t of this.enemyTowers) t.update(dt, playerTargets);

        // Minions
        for (const m of this.playerMinions) m.update(dt, enemyTargets);
        for (const m of this.enemyMinions) m.update(dt, playerTargets);

        // Heróis
        this.playerHero.update(dt, enemyTargets);
        this.enemyHero.update(dt, playerTargets);

        // Bases
        this.playerBase.update(dt, enemyTargets);
        this.enemyBase.update(dt, playerTargets);

        // Resolução de Colisões (delegada ao CollisionManager)
        const mobile = [this.playerHero, this.enemyHero, ...this.playerMinions, ...this.enemyMinions]
            .filter(u => u && u.isAlive());
        const staticUnits = [this.playerBase, this.enemyBase, ...this.playerTowers, ...this.enemyTowers]
            .filter(u => u && u.isAlive());
        CollisionManager.resolve(mobile, staticUnits, this.mapObstacles);

        // Limpeza e Textos Flutuantes
        this.playerMinions = this.playerMinions.filter(m => m.isAlive());
        this.enemyMinions = this.enemyMinions.filter(m => m.isAlive());
        this.playerTowers = this.playerTowers.filter(t => t.isAlive());
        this.enemyTowers = this.enemyTowers.filter(t => t.isAlive());

        // Atualiza textos flutuantes
        this.floatingTexts = this.floatingTexts.filter(t => {
            t.y += t.vy * dt;
            t.life -= dt;
            return t.life > 0;
        });

        // Game over
        if (!this.playerBase.isAlive()) { this.gameOver = true; this.winner = 'enemy'; }
        else if (!this.enemyBase.isAlive()) { this.gameOver = true; this.winner = 'player'; }

        // UI
        this.uiManager.update(this.playerHero);
    }

    // =============================================
    //  RENDERIZAÇÃO (delegada ao Renderer)
    // =============================================

    render() {
        const { ctx } = this.renderer.beginFrame();

        // Mapa
        this.renderer.drawMap(this.gameTime);

        // Entidades
        this.playerBase.draw(ctx);
        this.enemyBase.draw(ctx);
        for (const t of this.playerTowers) t.draw(ctx);
        for (const t of this.enemyTowers) t.draw(ctx);
        for (const m of this.playerMinions) m.draw(ctx);
        for (const m of this.enemyMinions) m.draw(ctx);
        this.enemyHero.draw(ctx);
        this.playerHero.draw(ctx);

        // Partículas
        this.spawnManager.drawParticles(ctx);

        // Textos Flutuantes
        this._drawFloatingTexts(ctx);

        // Overlay de modo de mira
        if (this.inputManager.isTargeting) {
            const W = GameConfig.MAP_WIDTH;
            const abilityName = this.playerHero.abilityCfg.name || 'Habilidade';
            const pulse = 0.7 + Math.sin(this.gameTime * 8) * 0.3;
            ctx.save();
            ctx.fillStyle = `rgba(245, 158, 11, ${pulse})`;
            ctx.strokeStyle = 'rgba(0,0,0,0.6)';
            ctx.lineWidth = 3;
            ctx.font = 'bold 18px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const msg = `⚡ ${abilityName.toUpperCase()} — Clique no local alvo  [Esc para cancelar]`;
            ctx.strokeText(msg, W / 2, 24);
            ctx.fillText(msg, W / 2, 24);
            ctx.restore();
        }

        this.renderer.endFrame();
    }

    // =============================================
    //  HANDLERS INTERNOS
    // =============================================

    _handleMove(x, y) {
        if (!this.running || this.gameOver) return;
        if (!this.playerHero.isAlive()) return;

        // Verifica se clicou em algum inimigo
        const enemies = this._getTeamUnits('enemy');
        let clickedEnemy = null;
        for (const enemy of enemies) {
            const dx = x - enemy.x;
            const dy = y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // Tolerância de clique um pouco maior que o raio para facilitar no mobile
            if (dist < enemy.radius + 15) {
                clickedEnemy = enemy;
                break;
            }
        }

        if (clickedEnemy) {
            this.playerHero.manualTarget = clickedEnemy;
        } else {
            this.playerHero.manualTarget = null;
            this.playerHero.moveTo(x, y);
        }
    }

    /** Aciona habilidade especial do herói do jogador */
    _handleSpecial(targetX = null, targetY = null) {
        if (!this.playerHero || !this.playerHero.isAlive()) return;

        const ability = this.playerHero.abilityCfg;

        // Se a habilidade precisa de alvo e não foi passado um ainda
        if (ability.needsTarget && (targetX === null || targetY === null)) {
            if (this.playerHero.mana >= this.playerHero.maxMana) {
                this.inputManager.setTargeting(true);
            }
            return;
        }

        // Executa a habilidade (com ou sem alvo)
        const enemies = this._getTeamUnits('enemy');
        const targetPos = targetX !== null ? { x: targetX, y: targetY } : null;

        const result = this.playerHero.useSpecial(enemies, targetPos);

        if (result.used) {
            console.log(`[GameManager] Especial usado! Hits: ${result.hits}`);
        }
    }

    _onEntityDeath(data) {
        if (data.entity.type === 'tower') {
            EventBus.emit('tower:destroyed', { tower: data.entity });
        }
    }

    _onEntityDamage(data) {
        const { entity, amount, source } = data;
        
        // Exibe números de dano para qualquer interação envolvendo um herói (evita poluição de Tropa vs Tropa)
        const isHeroTakingDamage = (entity.type === 'hero');
        const isHeroDealingDamage = (source && source.type === 'hero');

        if (!isHeroTakingDamage && !isHeroDealingDamage) return;

        let color = '#ffffff'; // Padrão: branco
        if (entity.team === 'player') {
            color = '#ef4444'; // Dano recebido pelo jogador ou suas tropas aliadas (Vermelho)
        } else if (source && source.team === 'player') {
            color = amount > 25 ? '#f59e0b' : '#ffffff'; // Dano causado pelo jogador: Laranja para habilidades fortes, Branco para o resto
        }
        
        this.floatingTexts.push({
            x: entity.x + (Math.random() - 0.5) * 20,
            y: entity.y - 10,
            vy: -40,
            text: amount,
            life: 0.8,
            maxLife: 0.8,
            color: color,
            size: entity.type === 'hero' ? 18 : 14
        });
    }

    _drawFloatingTexts(ctx) {
        ctx.save();
        ctx.textAlign = 'center';
        for (const t of this.floatingTexts) {
            const alpha = t.life / t.maxLife;
            ctx.globalAlpha = alpha;
            ctx.font = `bold ${t.size}px Outfit, sans-serif`;
            
            // Sombra
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillText(t.text, t.x + 1, t.y + 1);
            
            // Texto principal
            ctx.fillStyle = t.color;
            ctx.fillText(t.text, t.x, t.y);
        }
        ctx.restore();
    }

    /** Retorna todas as unidades vivas de um time */
    _getTeamUnits(team) {
        const units = [];
        if (team === 'player') {
            units.push(this.playerBase, ...this.playerTowers, ...this.playerMinions, this.playerHero);
        } else {
            units.push(this.enemyBase, ...this.enemyTowers, ...this.enemyMinions, this.enemyHero);
        }
        return units.filter(u => u && u.isAlive());
    }

    /** Redimensiona o canvas */
    resize() {
        this.renderer.resize();
    }
}
