/**
 * InputManager.js - Gerenciamento de Input
 * 
 * Centraliza todo o tratamento de input: touch, mouse e teclado.
 * Extraído do main.js para manter responsabilidades separadas.
 */
class InputManager {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {Renderer} renderer - Para converter coordenadas
     */
    constructor(canvas, renderer) {
        this.canvas = canvas;
        this.renderer = renderer;
        this.keys = {};
        this.onMove = null;        // callback(gameX, gameY)
        this.onSpecial = null;     // callback(gameX?, gameY?)
        this._mouseDown = false;
        this._keyboardInterval = null;
        this.isTargeting = false;  // modo de mira de habilidade

        // Referência ao herói para movimentação por teclado
        this._heroRef = null;
        this._setupDone = false;
    }

    /**
     * Configura todos os listeners (só adiciona uma vez)
     * @param {Function} onMove - (gameX, gameY) => void
     * @param {Function} onSpecial - () => void
     */
    setup(onMove, onSpecial) {
        this.onMove = onMove;
        this.onSpecial = onSpecial;

        // Evita adicionar listeners duplicados ao reiniciar
        if (this._setupDone) return;
        this._setupDone = true;

        // ---- Touch ----
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this._handleTouch(e.touches[0]);
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this._handleTouch(e.touches[0]);
        }, { passive: false });

        // ---- Mouse ----
        this.canvas.addEventListener('mousedown', (e) => {
            this._mouseDown = true;
            this._handleClick(e);
        });
        this.canvas.addEventListener('mousemove', (e) => {
            if (this._mouseDown) this._handleClick(e);
        });
        this.canvas.addEventListener('mouseup', () => {
            this._mouseDown = false;
        });

        // ---- Teclado ----
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === ' ' || e.key.toLowerCase() === 'q') {
                e.preventDefault();
                // Chama sem coordenadas → GameManager entra em modo de mira
                if (this.onSpecial) this.onSpecial(null, null);
            }
            if (e.key === 'Escape') {
                this.setTargeting(false);
            }
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Loop de movimentação por teclado
        this._keyboardInterval = setInterval(() => this._handleKeyboard(), 1000 / 60);
    }

    /**
     * Define a referência do herói para movimentação por teclado
     * @param {Hero} hero
     */
    setHero(hero) {
        this._heroRef = hero;
    }

    // ---- Handlers internos ----

    _handleTouch(touch) {
        const pos = this.renderer.screenToGame(touch.clientX, touch.clientY);
        this._clampAndMove(pos);
    }

    _handleClick(e) {
        const pos = this.renderer.screenToGame(e.clientX, e.clientY);
        this._clampAndMove(pos);
    }

    _clampAndMove(pos) {
        const W = GameConfig.MAP_WIDTH;
        const H = GameConfig.MAP_HEIGHT;
        pos.x = Math.max(15, Math.min(W - 15, pos.x));
        pos.y = Math.max(15, Math.min(H - 15, pos.y));

        if (this.isTargeting && this.onSpecial) {
            this.onSpecial(pos.x, pos.y);
            this.setTargeting(false);
            return;
        }

        if (this.onMove) this.onMove(pos.x, pos.y);
    }

    /** Ativa/Desativa modo de mira */
    setTargeting(active) {
        this.isTargeting = active;
        this.canvas.style.cursor = active ? 'crosshair' : 'default';
        if (active) {
            EventBus.emit('ui:targeting', { active: true });
        }
    }

    _handleKeyboard() {
        const hero = this._heroRef;
        if (!hero || !hero.isAlive()) return;

        let dx = 0, dy = 0;
        if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
        if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
        if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
        if (this.keys['d'] || this.keys['arrowright']) dx += 1;

        if (dx !== 0 || dy !== 0) {
            // Normaliza diagonal
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;

            const dt = 1 / 60; // ~60fps
            const step = hero.moveSpeed * dt;

            const W = GameConfig.MAP_WIDTH;
            const H = GameConfig.MAP_HEIGHT;
            const newX = Math.max(hero.radius, Math.min(W - hero.radius, hero.x + dx * step));
            const newY = Math.max(hero.radius, Math.min(H - hero.radius, hero.y + dy * step));

            // Move diretamente a posição do herói
            hero.x = newX;
            hero.y = newY;
            hero.targetX = newX;
            hero.targetY = newY;
            hero.facingAngle = Math.atan2(dy, dx);
            hero.wasdMoving = true; // Sinal de movimento de teclado
            hero.manualTarget = null;
        } else {
            hero.wasdMoving = false;
        }
    }

    /** Limpa listeners (para reset) */
    destroy() {
        if (this._keyboardInterval) clearInterval(this._keyboardInterval);
    }
}
