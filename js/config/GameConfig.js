/**
 * GameConfig.js - Configurações globais do jogo
 * 
 * Todas as constantes de balanceamento, dimensões do mapa e
 * parâmetros de spawn centralizados em um único lugar.
 * Para ajustar o jogo, basta alterar os valores aqui.
 */
const GameConfig = Object.freeze({

    // ---- Dimensões lógicas do mapa ----
    MAP_WIDTH: 400,
    MAP_HEIGHT: 720,

    // ---- Spawn de minions ----
    SPAWN_INTERVAL: 5,       // segundos entre ondas
    SPAWN_INITIAL_DELAY: 2,  // segundos antes do primeiro spawn

    // ---- Stats da Base (castelo) ----
    // DPS: 35 — mais forte que torres, protege o trono
    BASE: {
        hp: 1000,
        damage: 50,
        attackSpeed: 0.7,
        attackRange: 200,
        radius: 28,
        icon: '👑'
    },

    // ---- Stats da Torre ----
    // DPS: 28 — ameaça a qualquer herói que mergulhe sozinho
    TOWER: {
        hp: 500,
        damage: 35,
        attackSpeed: 0.8,
        attackRange: 110,
        radius: 20,
        icon: '🏰'
    },

    // ---- Stats do Minion ----
    MINION: {
        MELEE: {
            hp: 150,
            damage: 12,
            attackSpeed: 1.0,
            attackRange: 28,
            radius: 8,
            moveSpeed: 40,
            chaseRange: 100,
            icon: '🛡️'
        },
        RANGED: {
            hp: 90,
            damage: 8,
            attackSpeed: 1.4,
            attackRange: 110,
            radius: 7,
            moveSpeed: 35,
            chaseRange: 140,
            icon: '🏹'
        }
    },

    // ---- Posições do mapa ----
    LAYOUT: {
        // Bases
        playerBaseY: 660,
        enemyBaseY: 60,

        // Torres
        towerLeftX: 95,
        towerRightX: 305,
        playerTowerY: 560,
        enemyTowerY: 160,

        // Heróis
        playerHeroY: 500,
        enemyHeroY: 220,

        // Rio
        riverY: 335,        // H/2 - 25
        riverHeight: 50,

        // Pontes
        bridgeLeftX: 60,
        bridgeRightX: 270,  // W - 130
        bridgeWidth: 70
    },

    // ---- Cores dos times ----
    TEAM_COLORS: {
        player: {
            primary: '#3b82f6',
            secondary: '#1e40af',
            light: '#93c5fd',
            glow: '59,130,246',
            grassTop: '#16213e',
            grassBottom: '#0f3460'
        },
        enemy: {
            primary: '#ef4444',
            secondary: '#991b1b',
            light: '#fca5a5',
            glow: '239,68,68',
            grassTop: '#1a1a2e',
            grassBottom: '#16213e'
        }
    },

    // ---- IA ----
    AI: {
        decisionInterval: 1.2,  // Decisões um pouco mais rápidas
        chaseDistance: 220,     
        patrolCenterX: 200,
        patrolRangeX: 120,
        patrolMinY: 240,        // Patrulha começa no ponto de spawn
        patrolRangeY: 120       // Foca entre o spawn e o rio
    }
});
