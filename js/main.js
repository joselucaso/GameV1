/**
 * main.js - Ponto de entrada do jogo (Refatorado)
 * 
 * Responsabilidades:
 *   - Inicializar o GameManager
 *   - Gerenciar telas (start, game, gameover)
 *   - Rodar o game loop
 *   - Conectar botões da UI às ações
 */

// ---- Estado Global ----
let game = null;
let lastTime = 0;
let selectedHeroId = 'knight'; // Herói selecionado pelo jogador

// =============================================
//  INICIALIZAÇÃO
// =============================================

function initGame() {
    const canvas = document.getElementById('gameCanvas');
    game = new GameManager(canvas);
    game.resize();

    window.addEventListener('resize', () => game.resize());

    // Popula o seletor de heróis na tela inicial
    const uiMgr = new UIManager();
    const heroSelector = document.getElementById('hero-selector');
    uiMgr.populateHeroSelector(heroSelector, (heroId) => {
        selectedHeroId = heroId;
    });
}

// =============================================
//  CONTROLE DE TELAS
// =============================================

/**
 * Inicia o jogo com o herói selecionado
 */
function startGame() {
    if (!game) initGame();

    game.selectedHeroId = selectedHeroId;
    game.init();

    // Alterna telas
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('gameover-screen').classList.add('hidden');
    document.getElementById('game-ui').classList.remove('hidden');

    // Game loop
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function restartGame() {
    startGame();
}

function useSpecial() {
    if (game && game.running) {
        game._handleSpecial();
    }
}

// =============================================
//  GAME LOOP
// =============================================

function gameLoop(timestamp) {
    if (!game || !game.running) return;

    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    game.update(dt);
    game.render();

    if (game.gameOver) {
        showGameOver();
        return;
    }

    requestAnimationFrame(gameLoop);
}

// =============================================
//  GAME OVER
// =============================================

function showGameOver() {
    game.running = false;

    const title = document.getElementById('gameover-title');
    const subtitle = document.getElementById('gameover-subtitle');

    if (game.winner === 'player') {
        title.textContent = '🏆 VITÓRIA! 🏆';
        title.style.background = 'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)';
        subtitle.textContent = 'Você destruiu a base inimiga!';
    } else {
        title.textContent = '💀 DERROTA 💀';
        title.style.background = 'linear-gradient(135deg, #ef4444, #dc2626, #991b1b)';
        subtitle.textContent = 'Sua base foi destruída...';
    }
    title.style.backgroundClip = 'text';
    title.style.webkitBackgroundClip = 'text';
    title.style.webkitTextFillColor = 'transparent';

    document.getElementById('game-ui').classList.add('hidden');
    document.getElementById('gameover-screen').classList.remove('hidden');
}

// ---- Inicializa quando DOM estiver pronto ----
window.addEventListener('DOMContentLoaded', initGame);
