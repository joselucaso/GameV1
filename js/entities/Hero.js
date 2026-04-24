/**
 * Hero.js - Classe Genérica de Herói (Refatorado)
 * 
 * APENAS LÓGICA. Visual delegado ao HeroRenderer.
 * IA delegada ao HeroAI. Visuais de ataque delegados ao AttackVisualRegistry.
 * 
 * Recebe sua configuração do HeroRegistry.
 * A habilidade especial é delegada ao AbilitySystem.
 */
class Hero extends Entity {
    /**
     * Cria um herói a partir de um ID do HeroRegistry
     * @param {number} x - Posição X
     * @param {number} y - Posição Y
     * @param {string} team - 'player' ou 'enemy'
     * @param {string} heroId - ID do herói no HeroRegistry
     * @param {boolean} isAI - Se true, controlado por IA
     * @param {string} skinId - ID da skin (opcional, usa default)
     */
    constructor(x, y, team, heroId, isAI = false, skinId = null) {
        const heroCfg = HeroRegistry.get(heroId);
        if (!heroCfg) {
            throw new Error(`[Hero] Herói '${heroId}' não encontrado no HeroRegistry.`);
        }

        super(x, y, {
            hp: heroCfg.hp,
            damage: heroCfg.damage,
            attackSpeed: heroCfg.attackSpeed,
            attackRange: heroCfg.attackRange,
            radius: heroCfg.radius,
            team: team
        });

        this.type = 'hero';
        this.heroId = heroId;
        this.heroCfg = heroCfg;
        this.isAI = isAI;

        // Skin ativa
        this.skinId = skinId || heroCfg.defaultSkin;
        this.activeSkin = HeroRegistry.getSkin(heroId, this.skinId);

        // Propriedades do herói
        this.heroName = heroCfg.name;
        this.icon = this.activeSkin.icon;
        this.colors = this.activeSkin.colors;
        this.abilityCfg = heroCfg.ability;

        // Movimento
        this.moveSpeed = heroCfg.moveSpeed;
        this.targetX = x;
        this.targetY = y;
        this.moving = false;

        // Mana
        this.mana = 0;
        this.maxMana = heroCfg.maxMana;
        this.manaRegen = heroCfg.manaRegen;
        this.specialCooldown = 0;

        // Visual
        this.target = null;
        this.animTime = 0;
        this.attackFlash = 0;
        this.specialEffects = [];

        // IA
        this.aiTimer = 0;
        this.aiDecisionInterval = GameConfig.AI.decisionInterval;

        // Respawn
        this.deathCount = 0;
        this.respawnTimer = 0;
        this.facingAngle = Math.PI / 2; // Começa olhando para baixo
        this.wasdMoving = false;

        // Alvo manual
        this.manualTarget = null;

        // Regeneração fora de combate e Aggro
        this.outOfCombatTimer = 10;
        this.recentlyHitTimer = 0;
    }

    // ---- Update (apenas lógica) ----

    update(dt, enemies) {
        if (!this.alive) {
            this.respawnTimer -= dt;
            if (this.respawnTimer <= 0) {
                this.respawn();
            }
            return;
        }

        this.updateFlash(dt);
        this.animTime += dt;
        if (this.attackFlash > 0) this.attackFlash -= dt;
        if (this.specialCooldown > 0) this.specialCooldown -= dt;

        // Regenera mana
        if (this.mana < this.maxMana) {
            this.mana = Math.min(this.maxMana, this.mana + this.manaRegen * dt);
        }

        // Atualiza efeitos visuais e lógicas (projéteis)
        this.specialEffects = this.specialEffects.filter(e => {
            const oldLife = e.life;
            e.life -= dt;
            
            // Executa lógica de atualização contínua (ex: voo da flecha e colisão)
            if (e.onUpdate) {
                e.onUpdate(dt, enemies);
            }

            // Se o tempo acabou neste frame, dispara o impacto
            if (oldLife > 0 && e.life <= 0) {
                if (e.onImpact) e.onImpact(e.targetX || e.x, e.targetY || e.y);
            }
            
            return e.life > 0;
        });

        // Regeneração fora de combate (8s fora de combate = +25 HP/s)
        this.outOfCombatTimer += dt;
        if (this.outOfCombatTimer >= 8 && this.hp < this.maxHp) {
            this.hp = Math.min(this.maxHp, this.hp + 25 * dt);

            // Efeito visual 1: Pequenas cruzes aleatórias contínuas (O clássico)
            if (Math.random() < 5 * dt) {
                this.specialEffects.push({
                    x: this.x + (Math.random() - 0.5) * this.radius * 2,
                    y: this.y,
                    vx: (Math.random() - 0.5) * 10,
                    vy: -30 - Math.random() * 20,
                    life: 1.0,
                    maxLife: 1.0,
                    type: 'heal',
                    icon: '✚',
                    isSmall: true // Usado no renderer para desenhar menor
                });
            }

            // Efeito visual 2: Texto numérico "+25" subindo a cada 1 segundo exato
            if (Math.floor(this.outOfCombatTimer) > Math.floor(this.outOfCombatTimer - dt)) {
                this.specialEffects.push({
                    x: this.x,
                    y: this.y - this.radius, // Nasce um pouco acima do herói
                    vx: 0,
                    vy: -40, // Sobe reto
                    life: 1.5,
                    maxLife: 1.5,
                    type: 'heal',
                    icon: '+25',
                    isSmall: false
                });
            }
        }

        // IA (delegada ao HeroAI)
        if (this.isAI) HeroAI.update(this, dt, enemies);

        // Movimento
        if (this.manualTarget && this.manualTarget.isAlive() && this.distanceTo(this.manualTarget) > this.attackRange * 0.9) {
            this.targetX = this.manualTarget.x;
            this.targetY = this.manualTarget.y;
        }

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const isChasing = this.manualTarget && this.manualTarget.isAlive();
        const stopDist = isChasing ? this.attackRange * 0.9 : 3;

        if (dist > stopDist) {
            this.moving = true;
            this.x += (dx / dist) * this.moveSpeed * dt;
            this.y += (dy / dist) * this.moveSpeed * dt;
        } else {
            this.moving = false;
        }

        // --- Lógica de Auto-Ataque ---
        this.target = null;

        // 1. Valida alvo manual
        if (this.manualTarget && (!this.manualTarget.isAlive() || this.distanceTo(this.manualTarget) > 400)) {
            if (!this.manualTarget.isAlive()) {
                this.targetX = this.x;
                this.targetY = this.y;
                this.moving = false;
            }
            this.manualTarget = null;
        }

        // 2. Determina se deve atacar
        const isManuallyMoving = this.moving && !isChasing;

        if (!isManuallyMoving) {
            if (this.manualTarget && this.distanceTo(this.manualTarget) <= this.attackRange) {
                this.target = this.manualTarget;
            } else {
                const isAggressive = this.moving || this.manualTarget || (this.recentlyHitTimer > 0);

                if (isAggressive) {
                    let minDist = Infinity;
                    for (const enemy of enemies) {
                        if (!enemy.isAlive()) continue;
                        const d = this.distanceTo(enemy);
                        if (d < minDist) { minDist = d; this.target = enemy; }
                    }
                }
            }
        }

        // 3. Executa o ataque
        if (this.target && this.distanceTo(this.target) <= this.attackRange) {
            if (this.tryAttack(dt)) {
                this.target.takeDamage(this.damage, this);
                this.attackFlash = 0.1;
                this.outOfCombatTimer = 0;
                this.createAttackVisual(this.target);
            }
        }

        // Timer de dano recebido
        if (this.recentlyHitTimer > 0) this.recentlyHitTimer -= dt;
    }

    // ---- Controle do jogador ----

    moveTo(x, y) {
        this.targetX = x;
        this.targetY = y;
    }

    // ---- Habilidade especial (delegada ao AbilitySystem) ----

    useSpecial(enemies, targetPos = null) {
        return AbilitySystem.execute(this, enemies, this.abilityCfg, targetPos);
    }

    /** Sobrescreve takeDamage para aggro e respawn */
    takeDamage(amount, source = null) {
        if (!this.alive) return;
        super.takeDamage(amount, source);
        this.outOfCombatTimer = 0;
        this.recentlyHitTimer = 4;

        if (!this.alive) {
            this.deathCount++;
            this.respawnTimer = 3 * Math.pow(2, this.deathCount - 1);
        }
    }

    /** Teleporta o herói de volta para a base */
    respawn() {
        this.alive = true;
        this.hp = this.maxHp;
        this.mana = 0;

        const W = GameConfig.MAP_WIDTH;

        if (this.team === 'player') {
            this.x = W / 2;
            this.y = GameConfig.LAYOUT.playerHeroY; // Renasce no ponto correto do herói
        } else {
            this.x = W / 2;
            this.y = GameConfig.LAYOUT.enemyHeroY;  // Renasce no ponto correto do herói
        }

        this.targetX = this.x;
        this.targetY = this.y;
        this.moving = false;
        this.flashTimer = 0;
    }

    /** Cria visual de ataque (delegado ao AttackVisualRegistry) */
    createAttackVisual(target) {
        const visualType = this.activeSkin.attackVisual;
        const effect = AttackVisualRegistry.create(visualType, this, target);
        if (effect) {
            this.specialEffects.push(effect);
        }
    }

    // ---- Renderização (delegada ao HeroRenderer) ----

    draw(ctx) {
        HeroRenderer.draw(ctx, this);
    }

    /** Troca a skin ativa do herói */
    setSkin(skinId) {
        const skin = HeroRegistry.getSkin(this.heroId, skinId);
        if (skin) {
            this.skinId = skinId;
            this.activeSkin = skin;
            this.icon = skin.icon;
            this.colors = skin.colors;
        }
    }
}
