/**
 * EffectRenderer.js - Renderizador centralizado de efeitos visuais
 * 
 * Desenha todos os tipos de efeitos: slash, projectile, heal, aoe wave.
 * Usado pelo HeroRenderer e potencialmente por Minions/Torres.
 * 
 * Cada efeito é um objeto com { type, life, maxLife, ... } específico.
 */
const EffectRenderer = {

    /**
     * Desenha um array de efeitos no canvas
     * @param {CanvasRenderingContext2D} ctx
     * @param {object[]} effects - Lista de efeitos ativos
     */
    drawAll(ctx, effects) {
        for (const effect of effects) {
            const alpha = effect.life / effect.maxLife;
            const progress = 1 - alpha;

            switch (effect.type) {
                case 'heal':
                    this._drawHeal(ctx, effect, alpha);
                    break;
                case 'slash':
                    this._drawSlash(ctx, effect, alpha);
                    break;
                case 'projectile':
                    this._drawProjectile(ctx, effect, alpha);
                    break;
                case 'aoe':
                    this._drawAOE(ctx, effect, alpha, progress);
                    break;
                case 'rain_area':
                    this._drawRainArea(ctx, effect, alpha, progress);
                    break;
                case 'fireball_travel':
                    this._drawFireballTravel(ctx, effect, alpha, progress);
                    break;
                case 'fireball_explosion':
                    this._drawFireballExplosion(ctx, effect, alpha, progress);
                    break;
                default:
                    // Efeito genérico de onda (fallback)
                    this._drawWave(ctx, effect, alpha, progress);
                    break;
            }
        }
    },

    /** Partícula de cura "+" ou texto numérico subindo */
    _drawHeal(ctx, effect, alpha) {
        effect.x += (effect.vx || 0) * 0.016;
        effect.y += (effect.vy || 0) * 0.016;
        
        ctx.save();
        ctx.textAlign = 'center';
        
        if (effect.isSmall) {
            // Cruzes clássicas pequenas, sem contorno
            ctx.font = '12px serif';
            ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
            ctx.fillText(effect.icon || '✚', effect.x, effect.y);
        } else {
            // Número gigante com contorno (+25)
            ctx.font = 'bold 18px Inter, sans-serif';
            ctx.lineWidth = 3;
            ctx.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.8})`;
            ctx.strokeText(effect.icon, effect.x, effect.y);
            ctx.fillStyle = `rgba(74, 222, 128, ${alpha})`;
            ctx.fillText(effect.icon, effect.x, effect.y);
        }
        
        ctx.restore();
    },

    /** Corte em arco (melee) */
    _drawSlash(ctx, effect, alpha) {
        ctx.save();
        ctx.translate(effect.x, effect.y);
        ctx.rotate(effect.angle);
        ctx.strokeStyle = `rgba(255,255,255, ${alpha})`;
        if (effect.color && effect.color !== '#ffffff') {
            // Cor customizada (para skins)
            const r = parseInt(effect.color.slice(1, 3), 16);
            const g = parseInt(effect.color.slice(3, 5), 16);
            const b = parseInt(effect.color.slice(5, 7), 16);
            ctx.strokeStyle = `rgba(${r},${g},${b}, ${alpha})`;
        }
        ctx.lineWidth = 4 * alpha;
        ctx.beginPath();
        ctx.arc(0, 0, 15, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();
        ctx.restore();
    },

    /** Projétil (flecha ou orbe mágico) */
    _drawProjectile(ctx, effect, alpha) {
        // Se o efeito tem posição dinâmica, usa ela; senão, interpola
        const p = (1 - effect.life / effect.maxLife) * 2;
        const curX = effect.x !== undefined ? effect.x : effect.startX + (effect.targetX - effect.startX) * Math.min(1, p);
        const curY = effect.y !== undefined ? effect.y : effect.startY + (effect.targetY - effect.startY) * Math.min(1, p);
        const angle = effect.angle !== undefined ? effect.angle : Math.atan2(effect.targetY - effect.startY, effect.targetX - effect.startX);

        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = effect.color;
        ctx.fillStyle = effect.color;

        if (effect.pType === 'archer') {
            // Flecha (linha fina)
            ctx.translate(curX, curY);
            ctx.rotate(angle);
            ctx.fillRect(-10, -1, 15, 2);
        } else {
            // Bola mágica
            ctx.beginPath();
            ctx.arc(curX, curY, 4, 0, Math.PI * 2);
            ctx.fill();
            // Rastro
            ctx.globalAlpha = alpha * 0.5;
            ctx.beginPath();
            ctx.arc(curX - 5, curY - 5, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    },

    /** Onda de área (habilidades) */
    _drawAOE(ctx, effect, alpha, progress) {
        const radius = (effect.maxRadius || 80) * progress;
        const ec = effect.color || '167,139,250';

        const wave = ctx.createRadialGradient(effect.x, effect.y, radius * 0.5, effect.x, effect.y, radius);
        wave.addColorStop(0, 'rgba(167,139,250,0)');
        wave.addColorStop(0.7, `rgba(${ec},${alpha * 0.3})`);
        wave.addColorStop(1, `rgba(255,255,255,${alpha * 0.1})`);
        ctx.fillStyle = wave;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(${ec},${alpha * 0.6})`;
        ctx.lineWidth = 3 * alpha;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
        ctx.stroke();
    },

    /** Chuva de flechas em área (Duração contínua) */
    _drawRainArea(ctx, effect, alpha, progress) {
        const radius = effect.maxRadius || 150;
        const ec = effect.color || '16, 185, 129';
        
        ctx.save();
        
        // Círculo no chão (pisca levemente com o tempo)
        const pulse = 0.8 + Math.sin(effect.life * 10) * 0.2;
        const groundAlpha = Math.min(alpha, 0.4) * pulse;

        ctx.fillStyle = `rgba(${ec}, ${groundAlpha * 0.3})`;
        ctx.strokeStyle = `rgba(${ec}, ${groundAlpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    },

    /** Onda genérica (fallback para efeitos sem tipo específico) */
    _drawWave(ctx, effect, alpha, progress) {
        if (!effect.maxRadius) return;
        this._drawAOE(ctx, effect, alpha, progress);
    },

    /**
     * Bola de fogo viajando do lançador ao alvo.
     * Interpola a posição e chama onImpact() ao chegar.
     */
    _drawFireballTravel(ctx, effect, alpha, progress) {
        const curX = effect.startX + (effect.targetX - effect.startX) * progress;
        const curY = effect.startY + (effect.targetY - effect.startY) * progress;

        ctx.save();

        // Rastro de fogo (partículas atrás)
        const trailCount = 8;
        for (let i = 1; i <= trailCount; i++) {
            const t = Math.max(0, progress - i * 0.04);
            const tx = effect.startX + (effect.targetX - effect.startX) * t;
            const ty = effect.startY + (effect.targetY - effect.startY) * t;
            const trailAlpha = (1 - i / trailCount) * 0.6;
            const trailRadius = 40 - i * 4; // Aumentado de 14 para 40

            ctx.globalAlpha = trailAlpha;
            ctx.fillStyle = i < 3 ? '#fbbf24' : '#ef4444';
            ctx.beginPath();
            ctx.arc(tx, ty, Math.max(2, trailRadius), 0, Math.PI * 2);
            ctx.fill();
        }

        // Núcleo da bola de fogo
        ctx.globalAlpha = 1;
        const radius = 50; // Aumentado de 18 para 50
        const grd = ctx.createRadialGradient(curX - 10, curY - 10, 5, curX, curY, radius);
        grd.addColorStop(0, '#ffffff');
        grd.addColorStop(0.3, '#fef08a');
        grd.addColorStop(0.6, '#f97316');
        grd.addColorStop(1, '#dc2626');
        ctx.fillStyle = grd;
        ctx.shadowBlur = 50;
        ctx.shadowColor = '#f97316';
        ctx.beginPath();
        ctx.arc(curX, curY, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    },

    /** Explosão ao impactar — múltiplos anéis de fogo */
    _drawFireballExplosion(ctx, effect, alpha, progress) {
        const { x, y, maxRadius } = effect;

        ctx.save();

        // Anel externo (expansão rápida)
        const r1 = maxRadius * progress;
        const grd1 = ctx.createRadialGradient(x, y, r1 * 0.4, x, y, r1);
        grd1.addColorStop(0, `rgba(255, 255, 200, ${alpha * 0.5})`);
        grd1.addColorStop(0.5, `rgba(249, 115, 22, ${alpha * 0.4})`);
        grd1.addColorStop(1, `rgba(220, 38, 38, 0)`);
        ctx.fillStyle = grd1;
        ctx.beginPath();
        ctx.arc(x, y, r1, 0, Math.PI * 2);
        ctx.fill();

        // Anel de borda (brasa)
        ctx.strokeStyle = `rgba(251, 191, 36, ${alpha * 0.8})`;
        ctx.lineWidth = 4 * alpha;
        ctx.beginPath();
        ctx.arc(x, y, r1, 0, Math.PI * 2);
        ctx.stroke();

        // Flash central (só no início)
        if (progress < 0.3) {
            const flashAlpha = (1 - progress / 0.3) * 0.9;
            const r2 = maxRadius * 0.4 * (progress / 0.3);
            const grd2 = ctx.createRadialGradient(x, y, 0, x, y, r2);
            grd2.addColorStop(0, `rgba(255,255,255,${flashAlpha})`);
            grd2.addColorStop(1, `rgba(255,200,0,0)`);
            ctx.fillStyle = grd2;
            ctx.beginPath();
            ctx.arc(x, y, r2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
};
