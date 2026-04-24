/**
 * Renderer.js - Renderização do Mapa
 * 
 * Responsabilidade única: desenhar o fundo do mapa (grama, rio, pontes).
 * Extraído do GameManager para manter o código limpo.
 */
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    /**
     * Inicia o frame: limpa canvas, aplica escala e translação
     * @returns {{ ctx, scale }} Contexto e escala calculada
     */
    beginFrame() {
        const W = GameConfig.MAP_WIDTH;
        const H = GameConfig.MAP_HEIGHT;
        const ctx = this.ctx;

        ctx.save();
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const scaleX = this.canvas.width / W;
        const scaleY = this.canvas.height / H;
        const scale = Math.min(scaleX, scaleY);
        const offsetX = (this.canvas.width - W * scale) / 2;
        const offsetY = (this.canvas.height - H * scale) / 2;

        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);

        return { ctx, scale };
    }

    /** Finaliza o frame */
    endFrame() {
        this.ctx.restore();
    }

    /**
     * Desenha o fundo do mapa
     * @param {number} gameTime - Tempo de jogo (para animar o rio)
     */
    drawMap(gameTime) {
        const ctx = this.ctx;
        const W = GameConfig.MAP_WIDTH;
        const H = GameConfig.MAP_HEIGHT;
        const layout = GameConfig.LAYOUT;
        const pColors = GameConfig.TEAM_COLORS.player;
        const eColors = GameConfig.TEAM_COLORS.enemy;

        // ---- Grama ----
        const enemyGrass = ctx.createLinearGradient(0, 0, 0, H / 2);
        enemyGrass.addColorStop(0, eColors.grassTop);
        enemyGrass.addColorStop(1, eColors.grassBottom);
        ctx.fillStyle = enemyGrass;
        ctx.fillRect(0, 0, W, H / 2);

        const playerGrass = ctx.createLinearGradient(0, H / 2, 0, H);
        playerGrass.addColorStop(0, pColors.grassTop);
        playerGrass.addColorStop(1, pColors.grassBottom);
        ctx.fillStyle = playerGrass;
        ctx.fillRect(0, H / 2, W, H / 2);

        // ---- Linhas de lane ----
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 40;
        ctx.beginPath();
        ctx.moveTo(layout.towerLeftX, 70);
        ctx.lineTo(layout.towerLeftX, H - 70);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(layout.towerRightX, 70);
        ctx.lineTo(layout.towerRightX, H - 70);
        ctx.stroke();

        // ---- Rio ----
        const rY = layout.riverY;
        const rH = layout.riverHeight;
        const riverGrad = ctx.createLinearGradient(0, rY, 0, rY + rH);
        riverGrad.addColorStop(0, '#0c4a6e');
        riverGrad.addColorStop(0.3, '#0369a1');
        riverGrad.addColorStop(0.5, '#0ea5e9');
        riverGrad.addColorStop(0.7, '#0369a1');
        riverGrad.addColorStop(1, '#0c4a6e');
        ctx.fillStyle = riverGrad;
        ctx.fillRect(0, rY, W, rH);

        // Ondulações animadas
        ctx.strokeStyle = 'rgba(186,230,253,0.15)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            for (let x = 0; x < W; x += 3) {
                const y = rY + 10 + i * 8 + Math.sin(x * 0.03 + gameTime * 2 + i) * 3;
                if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // ---- Pontes ----
        this._drawBridge(ctx, layout.bridgeLeftX, rY - 5, layout.bridgeWidth, rH + 10);
        this._drawBridge(ctx, layout.bridgeRightX, rY - 5, layout.bridgeWidth, rH + 10);

        // ---- Bordas decorativas ----
        ctx.strokeStyle = `rgba(${eColors.glow},0.15)`;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(20, 80);
        ctx.lineTo(W - 20, 80);
        ctx.stroke();

        ctx.strokeStyle = `rgba(${pColors.glow},0.15)`;
        ctx.beginPath();
        ctx.moveTo(20, H - 80);
        ctx.lineTo(W - 20, H - 80);
        ctx.stroke();
        ctx.setLineDash([]);

        // ---- Labels de zona ----
        ctx.font = '10px Outfit';
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(${eColors.glow},0.2)`;
        ctx.fillText('⚔ ZONA INIMIGA ⚔', W / 2, 20);
        ctx.fillStyle = `rgba(${pColors.glow},0.2)`;
        ctx.fillText('🛡 ZONA ALIADA 🛡', W / 2, H - 10);
    }

    /** Desenha uma ponte */
    _drawBridge(ctx, x, y, w, h) {
        const grad = ctx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0, '#78716c');
        grad.addColorStop(0.5, '#a8a29e');
        grad.addColorStop(1, '#78716c');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 4);
        ctx.fill();

        ctx.strokeStyle = '#57534e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 4);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(87,83,78,0.4)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const lineY = y + 5 + i * (h / 4);
            ctx.beginPath();
            ctx.moveTo(x + 4, lineY);
            ctx.lineTo(x + w - 4, lineY);
            ctx.stroke();
        }
    }

    /**
     * Converte coordenadas de tela para coordenadas do jogo
     */
    screenToGame(screenX, screenY) {
        const W = GameConfig.MAP_WIDTH;
        const H = GameConfig.MAP_HEIGHT;
        const scaleX = this.canvas.width / W;
        const scaleY = this.canvas.height / H;
        const scale = Math.min(scaleX, scaleY);
        const offsetX = (this.canvas.width - W * scale) / 2;
        const offsetY = (this.canvas.height - H * scale) / 2;
        return { x: (screenX - offsetX) / scale, y: (screenY - offsetY) / scale };
    }

    /** Redimensiona o canvas */
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
}
