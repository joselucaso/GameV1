/**
 * MapRegistry.js - Registro de Mapas (Data-Driven)
 * 
 * Cada mapa define: dimensões, layout de estruturas, waypoints,
 * tema visual e obstáculos de colisão.
 * 
 * ⭐ PARA ADICIONAR UM NOVO MAPA:
 *    MapRegistry.register('meu_mapa', { ... });
 */
const MapRegistry = {

    /** @type {Object<string, object>} Mapas registrados */
    _maps: {},

    /**
     * Registra um novo mapa
     * @param {string} id - Identificador único
     * @param {object} config - Configuração completa do mapa
     */
    register(id, config) {
        this._maps[id] = { id, ...config };
    },

    /**
     * Obtém a configuração de um mapa pelo ID
     * @param {string} id
     * @returns {object|null}
     */
    get(id) {
        return this._maps[id] || null;
    },

    /**
     * Retorna todos os IDs de mapas registrados
     * @returns {string[]}
     */
    list() {
        return Object.keys(this._maps);
    }
};

// ============================================================
//  MAPAS PRÉ-REGISTRADOS
// ============================================================

/**
 * Arena Clássica — O mapa padrão do jogo
 */
MapRegistry.register('arena_classic', {
    name: 'Arena Clássica',
    width: 400,
    height: 720,

    layout: {
        playerBaseY: 660,
        enemyBaseY: 60,
        towerLeftX: 95,
        towerRightX: 305,
        playerTowerY: 560,
        enemyTowerY: 160,
        playerHeroY: 500,
        enemyHeroY: 220,
        riverY: 335,
        riverHeight: 50,
        bridgeLeftX: 60,
        bridgeRightX: 270,
        bridgeWidth: 70
    },

    /** Obstáculos de colisão (Rio que bloqueia passagem exceto nas pontes) */
    obstacles: [
        // Margem esquerda até a 1ª ponte
        { type: 'rect', x: 0, y: 335, width: 60, height: 50 },
        // Entre a 1ª e a 2ª ponte
        { type: 'rect', x: 130, y: 335, width: 140, height: 50 },
        // Margem direita após a 2ª ponte
        { type: 'rect', x: 340, y: 335, width: 60, height: 50 }
    ],

    /** Waypoints das lanes (gerados a partir do layout) */
    getWaypoints() {
        const L = this.layout;
        const W = this.width;
        const H = this.height;

        return {
            leftPlayer: [
                { x: L.towerLeftX, y: L.playerTowerY },
                { x: 95, y: L.riverY + L.riverHeight + 20 },
                { x: 95, y: L.riverY - 20 },
                { x: L.towerLeftX, y: L.enemyTowerY },
                { x: W / 2, y: L.enemyBaseY }
            ],
            rightPlayer: [
                { x: L.towerRightX, y: L.playerTowerY },
                { x: 305, y: L.riverY + L.riverHeight + 20 },
                { x: 305, y: L.riverY - 20 },
                { x: L.towerRightX, y: L.enemyTowerY },
                { x: W / 2, y: L.enemyBaseY }
            ],
            leftEnemy: [
                { x: L.towerLeftX, y: L.enemyTowerY },
                { x: 95, y: L.riverY - 20 },
                { x: 95, y: L.riverY + L.riverHeight + 20 },
                { x: L.towerLeftX, y: L.playerTowerY },
                { x: W / 2, y: L.playerBaseY }
            ],
            rightEnemy: [
                { x: L.towerRightX, y: L.enemyTowerY },
                { x: 305, y: L.riverY - 20 },
                { x: 305, y: L.riverY + L.riverHeight + 20 },
                { x: L.towerRightX, y: L.playerTowerY },
                { x: W / 2, y: L.playerBaseY }
            ]
        };
    },

    /** Tema visual */
    theme: {
        grassTop: { player: '#16213e', enemy: '#1a1a2e' },
        grassBottom: { player: '#0f3460', enemy: '#16213e' },
        river: ['#0c4a6e', '#0369a1', '#0ea5e9', '#0369a1', '#0c4a6e'],
        bridge: { top: '#78716c', middle: '#a8a29e', border: '#57534e' }
    }
});
