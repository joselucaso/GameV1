/**
 * AbilitySystem.js - Sistema de Habilidades Plugável
 * 
 * Registra handlers de habilidades por tipo.
 * Cada herói no HeroRegistry define um ability.type (ex: 'aoe').
 * O AbilitySystem executa o handler correspondente.
 * 
 * ⭐ PARA ADICIONAR UM NOVO TIPO DE HABILIDADE:
 *    AbilitySystem.registerHandler('meu_tipo', (hero, enemies, abilityCfg) => { ... });
 */
const AbilitySystem = {

    /** @type {Object<string, Function>} Handlers por tipo de habilidade */
    _handlers: {},

    /**
     * Registra um handler de habilidade
     * @param {string} type - Tipo da habilidade (ex: 'aoe', 'heal', 'summon')
     * @param {Function} handler - (hero, enemies, abilityCfg) => { hits: number }
     */
    registerHandler(type, handler) {
        this._handlers[type] = handler;
    },

    /**
     * Executa a habilidade especial de um herói
     * @param {Hero} hero - O herói que usa a habilidade
     * @param {Entity[]} enemies - Lista de inimigos
     * @param {object} abilityCfg - Config da habilidade (do HeroRegistry)
     * @param {object} targetPos - Posição de alvo opcional {x, y}
     * @returns {{ used: boolean, hits: number }}
     */
    execute(hero, enemies, abilityCfg, targetPos = null) {
        if (hero.mana < hero.maxMana) {
            return { used: false, hits: 0 };
        }

        const handler = this._handlers[abilityCfg.type];
        if (!handler) {
            console.warn(`[AbilitySystem] Handler não encontrado: '${abilityCfg.type}'`);
            return { used: false, hits: 0 };
        }

        // Gasta toda a mana
        hero.mana = 0;
        hero.specialCooldown = 0.5;

        // Executa o handler
        const result = handler(hero, enemies, abilityCfg, targetPos);

        // Emite evento
        EventBus.emit('hero:special', { hero, hits: result.hits || 0 });

        return { used: true, hits: result.hits || 0 };
    }
};

// ============================================================
//  HANDLERS DE HABILIDADE PRÉ-REGISTRADOS
// ============================================================

/**
 * LEAP - O herói salta para um local e causa dano em área ao pousar
 * Usado por: Knight (Salto Devastador)
 */
AbilitySystem.registerHandler('leap', (hero, enemies, cfg, targetPos) => {
    if (!targetPos) return { hits: 0 };

    const oldX = hero.x;
    const oldY = hero.y;

    // Move o herói instantaneamente para o local (o visual pode ser suavizado depois)
    hero.x = targetPos.x;
    hero.y = targetPos.y;
    hero.targetX = targetPos.x;
    hero.targetY = targetPos.y;

    // Efeito visual no local de saída (poeira)
    hero.specialEffects.push({
        x: oldX, y: oldY,
        life: 0.3, maxLife: 0.3,
        maxRadius: hero.radius * 2,
        color: '200, 200, 200'
    });

    // Efeito visual no local de pouso (impacto)
    hero.specialEffects.push({
        x: hero.x,
        y: hero.y,
        life: cfg.effectDuration || 0.6,
        maxLife: cfg.effectDuration || 0.6,
        maxRadius: cfg.range,
        color: cfg.effectColor || '245, 158, 11' // Âmbar/Laranja
    });

    // Causa dano em área no pouso (Apenas Heróis e Minions)
    let hits = 0;
    for (const enemy of enemies) {
        if (!enemy.isAlive()) continue;
        if (enemy.type !== 'hero' && enemy.type !== 'minion') continue; // IMUNIDADE
        
        if (hero.distanceTo(enemy) <= cfg.range) {
            enemy.takeDamage(cfg.damage, hero);
            hits++;
        }
    }
    return { hits };
});

/**
 * AOE (Area of Effect) - Dano em área ao redor do herói
 * Usado por: Knight, Necromancer, Mage, Archer
 */
AbilitySystem.registerHandler('aoe', (hero, enemies, cfg) => {
    // Efeito visual
    hero.specialEffects.push({
        x: hero.x,
        y: hero.y,
        life: cfg.effectDuration || 0.5,
        maxLife: cfg.effectDuration || 0.5,
        maxRadius: cfg.range,
        color: cfg.effectColor || '167,139,250'
    });

    // Causa dano em área (Apenas Heróis e Minions)
    let hits = 0;
    for (const enemy of enemies) {
        if (!enemy.isAlive()) continue;
        if (enemy.type !== 'hero' && enemy.type !== 'minion') continue; // IMUNIDADE
        
        if (hero.distanceTo(enemy) <= cfg.range) {
            enemy.takeDamage(cfg.damage, hero);
            hits++;
        }
    }
    return { hits };
});

/**
 * HEAL - Cura o herói e aliados próximos
 * (Exemplo de handler futuro - já registrado para uso)
 */
AbilitySystem.registerHandler('heal', (hero, _enemies, cfg) => {
    const healAmount = cfg.healAmount || 100;
    hero.hp = Math.min(hero.maxHp, hero.hp + healAmount);

    hero.specialEffects.push({
        x: hero.x,
        y: hero.y,
        life: cfg.effectDuration || 0.4,
        maxLife: cfg.effectDuration || 0.4,
        maxRadius: cfg.range || 50,
        color: cfg.effectColor || '74,222,128'
    });

    return { hits: 0, healed: healAmount };
});

/**
 * FIREBALL - Lança uma grande bola de fogo em um local escolhido
 * A bola viaja visualmente e aplica dano ao chegar.
 * Usado por: Mage (Bola de Fogo)
 */
AbilitySystem.registerHandler('fireball', (hero, enemies, cfg, targetPos) => {
    if (!targetPos) return { hits: 0 };

    const travelTime = 0.7; // segundos para chegar ao destino

    // Cria o projétil viajando
    hero.specialEffects.push({
        type: 'fireball_travel',
        startX: hero.x,
        startY: hero.y,
        targetX: targetPos.x,
        targetY: targetPos.y,
        life: travelTime,
        maxLife: travelTime,
        _impacted: false,
        onImpact: (ix, iy) => {
            // Explosão visual no impacto
            hero.specialEffects.push({
                type: 'fireball_explosion',
                x: ix, y: iy,
                life: cfg.effectDuration || 0.7,
                maxLife: cfg.effectDuration || 0.7,
                maxRadius: cfg.range,
                color: '249,115,22'
            });

            // Avisa o GameManager para aplicar o dano nos inimigos ATUAIS
            EventBus.emit('fireball:impact', { 
                x: ix, 
                y: iy, 
                damage: cfg.damage, 
                range: cfg.range,
                team: hero.team,
                source: hero
            });
        }
    });

    return { hits: 0 }; // hits serão contados no impacto
});

/**
 * ARROW VOLLEY (Chuva de Flechas) - Arqueira faz chover flechas em uma área
 * Cria uma zona no mapa que dá dano contínuo e empurra para trás.
 */
AbilitySystem.registerHandler('arrow_volley', (hero, enemies, cfg, targetPos) => {
    if (!targetPos) return { hits: 0 };

    const duration = 5.0; // 5 segundos
    const tickRate = 0.2; // Dano a cada 0.2s (5x por segundo)

    // Vira a arqueira
    hero.targetX = hero.x; // Permanece onde está
    hero.targetY = hero.y;

    // Efeito de Área Contínuo
    hero.specialEffects.push({
        type: 'rain_area',
        x: targetPos.x,
        y: targetPos.y,
        life: duration,
        maxLife: duration,
        maxRadius: cfg.range,
        color: '16, 185, 129',
        tickTimer: 0,
        onUpdate: function(dt, currentEnemies) {
            this.tickTimer -= dt;
            hero.attackFlash = 0.1; // Heroi pisca como se estivesse canalizando
            
            // Efeitos visuais de flechas caindo
            if (Math.random() < 0.6) { 
                const spreadX = (Math.random() - 0.5) * this.maxRadius * 2;
                const spreadY = (Math.random() - 0.5) * this.maxRadius * 2;
                // Só cria a flechinha se estiver dentro do raio da área
                if (spreadX*spreadX + spreadY*spreadY <= this.maxRadius*this.maxRadius) {
                    hero.specialEffects.push({
                        type: 'projectile', pType: 'archer', color: '#10b981',
                        x: this.x + spreadX - 50, // Começa de cima e de lado
                        y: this.y + spreadY - 150, 
                        vx: 300, vy: 900, // Cai muito rápido na diagonal
                        angle: Math.atan2(900, 300),
                        life: 0.16, maxLife: 0.16
                    });
                }
            }

            // Aplica dano e empurrão a todos na área
            if (this.tickTimer <= 0) {
                this.tickTimer = tickRate;
                
                for (const enemy of currentEnemies) {
                    if (!enemy.isAlive()) continue;
                    const dx = enemy.x - this.x;
                    const dy = enemy.y - this.y;
                    if (dx*dx + dy*dy <= this.maxRadius * this.maxRadius) {
                        // Só afeta Heróis e Minions
                        if (enemy.type === 'hero' || enemy.type === 'minion') {
                            enemy.takeDamage(cfg.damage, hero);
                            
                            const angle = Math.atan2(dy, dx);
                            enemy.x += Math.cos(angle) * 8;
                            enemy.y += Math.sin(angle) * 8;
                            enemy.targetX = enemy.x; 
                            enemy.targetY = enemy.y;
                        }
                    }
                }
            }
        }
    });

    return { hits: 0 };
});


/**
 * PROJECTILE - Dispara um projétil de longa distância
 * (Exemplo de handler futuro - placeholder)
 */
AbilitySystem.registerHandler('projectile', (hero, enemies, cfg) => {
    // Encontra o inimigo mais próximo e causa dano direto
    const nearest = hero.findNearestEnemy(enemies);
    let hits = 0;
    if (nearest && hero.distanceTo(nearest) <= (cfg.range || 150)) {
        nearest.takeDamage(cfg.damage);
        hits = 1;
    }

    hero.specialEffects.push({
        x: hero.x,
        y: hero.y,
        life: cfg.effectDuration || 0.3,
        maxLife: cfg.effectDuration || 0.3,
        maxRadius: cfg.range || 60,
        color: cfg.effectColor || '250,204,21'
    });

    return { hits };
});
