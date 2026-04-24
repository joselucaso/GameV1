/**
 * AttackVisualRegistry.js - Registro de Visuais de Ataque
 * 
 * Cada herói registra como seu auto-ataque é visualizado.
 * Isso desacopla a lógica de ataque do visual, permitindo
 * que skins alterem os efeitos sem tocar na lógica.
 * 
 * ⭐ PARA ADICIONAR UM VISUAL DE ATAQUE:
 *    AttackVisualRegistry.register('meu_visual', (hero, target) => effectObject);
 */
const AttackVisualRegistry = {

    /** @type {Object<string, Function>} Handlers por tipo */
    _visuals: {},

    /**
     * Registra um visual de ataque
     * @param {string} type - Tipo do visual (ex: 'slash', 'arrow', 'magic_orb')
     * @param {Function} factory - (hero, target) => effect object
     */
    register(type, factory) {
        this._visuals[type] = factory;
    },

    /**
     * Cria o efeito visual de ataque
     * @param {string} type - Tipo registrado
     * @param {Hero} hero - Herói que ataca
     * @param {Entity} target - Alvo do ataque
     * @returns {object|null} Objeto de efeito visual
     */
    create(type, hero, target) {
        const factory = this._visuals[type];
        if (!factory) {
            console.warn(`[AttackVisualRegistry] Visual '${type}' não encontrado.`);
            return null;
        }
        return factory(hero, target);
    }
};

// ============================================================
//  VISUAIS DE ATAQUE PRÉ-REGISTRADOS
// ============================================================

/** Corte corpo-a-corpo (Cavaleiro) */
AttackVisualRegistry.register('slash', (hero, target) => ({
    type: 'slash',
    x: (hero.x + target.x) / 2,
    y: (hero.y + target.y) / 2,
    angle: Math.atan2(target.y - hero.y, target.x - hero.x),
    life: 0.2,
    maxLife: 0.2,
    color: '#ffffff'
}));

/** Corte dourado (skin futura) */
AttackVisualRegistry.register('golden_slash', (hero, target) => ({
    type: 'slash',
    x: (hero.x + target.x) / 2,
    y: (hero.y + target.y) / 2,
    angle: Math.atan2(target.y - hero.y, target.x - hero.x),
    life: 0.25,
    maxLife: 0.25,
    color: '#fbbf24'
}));

/** Flecha (Arqueira) */
AttackVisualRegistry.register('arrow', (hero, target) => ({
    type: 'projectile',
    pType: 'archer',
    startX: hero.x,
    startY: hero.y,
    x: hero.x,
    y: hero.y,
    targetX: target.x,
    targetY: target.y,
    speed: 500,
    color: hero.activeSkin.colors.primary,
    life: 0.5,
    maxLife: 0.5
}));

/** Orbe mágico (Mago) */
AttackVisualRegistry.register('magic_orb', (hero, target) => ({
    type: 'projectile',
    pType: 'mage',
    startX: hero.x,
    startY: hero.y,
    x: hero.x,
    y: hero.y,
    targetX: target.x,
    targetY: target.y,
    speed: 300,
    color: hero.activeSkin.colors.primary,
    life: 0.5,
    maxLife: 0.5
}));
