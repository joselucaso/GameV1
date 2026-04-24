/**
 * HeroRegistry.js - Registro de Heróis (Data-Driven)
 * 
 * ⭐ PARA ADICIONAR UM NOVO HERÓI:
 *    Basta chamar HeroRegistry.register('id', { ... }) com os stats.
 *    O sistema de habilidades é plugável — use um 'type' existente
 *    ou registre um novo handler em AbilitySystem.js.
 * 
 * ⭐ PARA ADICIONAR UMA NOVA SKIN:
 *    Adicione uma entrada no campo 'skins' do herói.
 *    Skins mudam APENAS o visual (cores, ícone, efeito de ataque).
 * 
 * Campos obrigatórios de cada herói:
 *   name, hp, damage, attackSpeed, attackRange, radius,
 *   moveSpeed, maxMana, manaRegen, skins, defaultSkin, ability
 */
const HeroRegistry = {

    /** @type {Object<string, object>} Todos os heróis registrados */
    _heroes: {},

    /**
     * Registra um novo tipo de herói
     * @param {string} id - Identificador único (ex: 'knight', 'mage')
     * @param {object} config - Configuração completa do herói
     */
    register(id, config) {
        if (this._heroes[id]) {
            console.warn(`[HeroRegistry] Herói '${id}' já registrado. Sobrescrevendo.`);
        }
        const required = ['name', 'hp', 'damage', 'attackSpeed',
            'attackRange', 'radius', 'moveSpeed', 'maxMana', 'manaRegen',
            'skins', 'defaultSkin', 'ability'];
        for (const field of required) {
            if (config[field] === undefined) {
                console.error(`[HeroRegistry] Campo obrigatório '${field}' ausente no herói '${id}'.`);
            }
        }
        this._heroes[id] = { id, ...config };
    },

    get(id) {
        return this._heroes[id] || null;
    },

    getSkin(heroId, skinId) {
        const hero = this._heroes[heroId];
        if (!hero) return null;
        return hero.skins[skinId] || hero.skins[hero.defaultSkin] || null;
    },

    list() {
        return Object.keys(this._heroes);
    },

    getAll() {
        return Object.values(this._heroes);
    }
};

// ============================================================
//  HERÓIS PRÉ-REGISTRADOS (BALANCEADOS)
//
//  Comparativo de DPS e EHP:
//  ┌───────────┬─────┬─────┬──────┬───────┬───────┬──────────┐
//  │ Herói     │ HP  │ DMG │ AS   │ DPS   │ Range │ Speed    │
//  ├───────────┼─────┼─────┼──────┼───────┼───────┼──────────┤
//  │ Cavaleiro │ 400 │  30 │ 1.0  │ 30.0  │   40  │   85     │
//  │ Mago      │ 230 │  45 │ 0.7  │ 31.5  │  150  │   75     │
//  │ Arqueira  │ 250 │  15 │ 2.5  │ 37.5  │  120  │  105     │
//  └───────────┴─────┴─────┴──────┴───────┴───────┴──────────┘
//
//  Torres: 500 HP, 35 dmg, 0.8 AS (DPS 28), Range 110
//  Base:   1000 HP, 50 dmg, 0.7 AS (DPS 35), Range 200
// ============================================================

/**
 * 🛡️ CAVALEIRO — Tanque corpo-a-corpo
 * Alto HP, DPS moderado. Precisa chegar perto mas aguenta muito.
 */
HeroRegistry.register('knight', {
    name: 'Cavaleiro',
    hp: 400,
    damage: 30,
    attackSpeed: 1.0,
    attackRange: 40,
    radius: 12,
    moveSpeed: 85,
    maxMana: 100,
    manaRegen: 5,
    skins: {
        default: {
            id: 'default',
            name: 'Cavaleiro Clássico',
            icon: '🛡️',
            colors: {
                primary: '#818cf8',
                secondary: '#4338ca',
                border: '#a5b4fc',
            },
            glow: '99,102,241',
            attackFlash: '#fef08a',
            attackVisual: 'slash'
        },
        golden: {
            id: 'golden',
            name: 'Cavaleiro Dourado',
            icon: '⚜️',
            colors: {
                primary: '#fbbf24',
                secondary: '#b45309',
                border: '#fde68a',
            },
            glow: '251,191,36',
            attackFlash: '#ffffff',
            attackVisual: 'golden_slash'
        }
    },
    defaultSkin: 'default',
    ability: {
        type: 'leap',
        name: 'Salto Devastador',
        damage: 250,
        range: 100,
        needsTarget: true,
        effectDuration: 0.6,
        effectColor: '245, 158, 11'
    }
});

/**
 * 🔮 MAGO — Burst de longo alcance
 * Cada auto-ataque dói MUITO, mas é lento. Melhor habilidade especial.
 */
HeroRegistry.register('mage', {
    name: 'Mago',
    hp: 230,
    damage: 45,
    attackSpeed: 0.7,
    attackRange: 150,
    radius: 11,
    moveSpeed: 75,
    maxMana: 100,
    manaRegen: 8,
    skins: {
        default: {
            id: 'default',
            name: 'Mago Arcano',
            icon: '🔮',
            colors: {
                primary: '#c084fc',
                secondary: '#7c3aed',
                border: '#d8b4fe',
            },
            glow: '168,85,247',
            attackFlash: '#e9d5ff',
            attackVisual: 'magic_orb'
        }
    },
    defaultSkin: 'default',
    ability: {
        type: 'fireball',
        name: 'Bola de Fogo',
        damage: 180,
        range: 180,
        needsTarget: true,
        effectDuration: 0.8,
    }
});

/**
 * 🏹 ARQUEIRA — DPS sustentado
 * Ataque rápido e consistente. Mais ágil, boa para kiting.
 */
HeroRegistry.register('archer', {
    name: 'Arqueira',
    hp: 250,
    damage: 15,
    attackSpeed: 2.5,
    attackRange: 120,
    radius: 10,
    moveSpeed: 105,
    maxMana: 100,
    manaRegen: 7,
    skins: {
        default: {
            id: 'default',
            name: 'Arqueira Élfica',
            icon: '🏹',
            colors: {
                primary: '#34d399',
                secondary: '#059669',
                border: '#6ee7b7',
            },
            glow: '52,211,153',
            attackFlash: '#d1fae5',
            attackVisual: 'arrow'
        }
    },
    defaultSkin: 'default',
    ability: {
        type: 'arrow_volley',
        name: 'Chuva de Flechas',
        damage: 15, // Dano a cada 0.2 segundos (15 * 5 = 75 dps)
        range: 90, // Raio do círculo no chão
        needsTarget: true,
        effectDuration: 5.0, // Duração de 5s
    }
});
