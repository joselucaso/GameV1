/**
 * UIManager.js - Gerenciamento da Interface do Usuário
 * 
 * Responsabilidade única: atualizar barras de HP, mana, 
 * placar de torres e estado do botão especial.
 * Também gerencia a seleção de herói na tela inicial.
 */
class UIManager {
    constructor() {
        // Cache de elementos DOM para performance
        this.els = {};
    }

    /** Inicializa referências aos elementos DOM */
    init() {
        this.els = {
            hpFill: document.getElementById('hp-fill'),
            hpText: document.getElementById('hp-text'),
            manaFill: document.getElementById('mana-fill'),
            manaText: document.getElementById('mana-text'),
            btnSpecial: document.getElementById('btn-special'),
            specialIcon: document.querySelector('#btn-special .special-icon'),
            heroNameLabel: document.getElementById('hero-name-label'),
            enemyNameLabel: document.getElementById('enemy-name-label')
        };
    }

    /**
     * @param {Hero} hero - Herói do jogador
     */
    update(hero) {
        if (!this.els.hpFill) return;

        // ---- Barra de HP ----
        const hpRatio = hero.isAlive() ? (hero.hp / hero.maxHp) * 100 : 0;
        this.els.hpFill.style.width = hpRatio + '%';
        this.els.hpText.textContent = `${Math.ceil(hero.hp)}/${hero.maxHp}`;

        if (hpRatio > 50) {
            this.els.hpFill.style.background = 'linear-gradient(90deg, #22c55e, #4ade80)';
        } else if (hpRatio > 25) {
            this.els.hpFill.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
        } else {
            this.els.hpFill.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
        }

        // Feedback de regeneração
        if (hero.outOfCombatTimer >= 8 && hero.hp < hero.maxHp && hero.isAlive()) {
            this.els.hpFill.classList.add('regenerating');
        } else {
            this.els.hpFill.classList.remove('regenerating');
        }

        // ---- Barra de Mana ----
        const manaRatio = (hero.mana / hero.maxMana) * 100;
        this.els.manaFill.style.width = manaRatio + '%';
        this.els.manaText.textContent = `${Math.floor(hero.mana)}/${hero.maxMana}`;

        // ---- Botão especial ----
        if (hero.mana >= hero.maxMana) {
            this.els.btnSpecial.classList.add('ready');
        } else {
            this.els.btnSpecial.classList.remove('ready');
        }
    }

    /**
     * Configura o ícone do botão especial com base no herói
     * @param {Hero} hero
     */
    setHeroInfo(hero) {
        if (this.els.specialIcon) {
            this.els.specialIcon.textContent = '⚡';
        }
        if (this.els.heroNameLabel) {
            this.els.heroNameLabel.textContent = `Aliado: ${hero.heroName}`;
        }
    }

    /**
     * Configura o nome do herói inimigo na UI
     * @param {Hero} hero
     */
    setEnemyInfo(hero) {
        if (this.els.enemyNameLabel) {
            this.els.enemyNameLabel.textContent = `Inimigo: ${hero.heroName}`;
        }
    }

    /**
     * Popula o seletor de heróis na tela inicial
     * @param {HTMLElement} container - Elemento que conterá os cards
     * @param {Function} onSelect - Callback quando um herói é selecionado
     */
    populateHeroSelector(container, onSelect) {
        if (!container) return;
        container.innerHTML = '';

        const heroes = HeroRegistry.getAll();
        heroes.forEach((heroCfg, index) => {
            const defaultSkin = heroCfg.skins[heroCfg.defaultSkin];
            const card = document.createElement('button');
            card.className = 'hero-card' + (index === 0 ? ' selected' : '');
            card.dataset.heroId = heroCfg.id;
            card.innerHTML = `
                <span class="hero-card-icon">${defaultSkin.icon}</span>
                <span class="hero-card-name">${heroCfg.name}</span>
            `;
            card.style.borderColor = defaultSkin.colors.border;

            card.addEventListener('click', () => {
                container.querySelectorAll('.hero-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                onSelect(heroCfg.id);
            });

            container.appendChild(card);
        });
    }

    /** Mostra a UI do jogo */
    show() {
        document.getElementById('game-ui').classList.remove('hidden');
    }

    /** Esconde a UI do jogo */
    hide() {
        document.getElementById('game-ui').classList.add('hidden');
    }
}
