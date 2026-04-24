/**
 * HeroRenderer.js - Renderização do Herói
 * 
 * Extraído do Hero.js para separar lógica de visual.
 * Lê a skin ativa do herói para decidir cores, ícone e efeitos.
 * 
 * Usa EffectRenderer para efeitos visuais compartilhados.
 */
const HeroRenderer = {

    /**
     * Desenha o herói completo no canvas
     * @param {CanvasRenderingContext2D} ctx
     * @param {Hero} hero
     */
    draw(ctx, hero) {
        if (!hero.isAlive()) {
            this._drawRespawnTimer(ctx, hero);
            return;
        }

        const skin = hero.activeSkin;

        // Efeitos especiais (partículas, projéteis, etc)
        EffectRenderer.drawAll(ctx, hero.specialEffects);

        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(hero.x, hero.y + hero.radius, hero.radius * 1.2, hero.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Indicador de alvo manual
        if (hero.manualTarget && hero.manualTarget.isAlive()) {
            this._drawTargetIndicator(ctx, hero, hero.manualTarget);
        }

        // Anel de mana
        const manaRatio = hero.mana / hero.maxMana;
        ctx.strokeStyle = manaRatio >= 1
            ? `rgba(59,130,246,0.9)`
            : `rgba(59,130,246,${0.3 + manaRatio * 0.4})`;
        ctx.lineWidth = manaRatio >= 1 ? 3 : 2;
        ctx.beginPath();
        ctx.arc(hero.x, hero.y, hero.radius + 4, -Math.PI / 2,
            -Math.PI / 2 + Math.PI * 2 * manaRatio);
        ctx.stroke();

        // Aura de cura
        // Aura de cura "Caprichada"
        if (hero.outOfCombatTimer >= 8 && hero.hp < hero.maxHp) {
            const pulse = 0.5 + Math.sin(hero.animTime * 6) * 0.2;
            const glowSize = hero.radius * (1.5 + pulse);
            
            // Brilho externo pulsante
            const healGrad = ctx.createRadialGradient(hero.x, hero.y, hero.radius * 0.8, hero.x, hero.y, glowSize);
            healGrad.addColorStop(0, `rgba(34, 197, 94, ${0.5 * pulse})`);
            healGrad.addColorStop(0.5, `rgba(74, 222, 128, ${0.2 * pulse})`);
            healGrad.addColorStop(1, 'rgba(34, 197, 94, 0)');
            
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = healGrad;
            ctx.beginPath();
            ctx.arc(hero.x, hero.y, glowSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // --- SISTEMA DE ANIMAÇÃO PROCEDURAL ---
        const isMoving = hero.moving || hero.wasdMoving; 
        const isAttacking = hero.attackFlash > 0;
        const attackProgress = isAttacking ? (1 - (hero.attackFlash / 0.1)) : 0;
        
        // Oscilações baseadas no tempo
        const breathe = Math.sin(hero.animTime * 4) * 1.5;
        const walkBob = isMoving ? Math.abs(Math.sin(hero.animTime * 15)) * 3 : 0;
        const handSwing = isMoving ? Math.sin(hero.animTime * 15) * 6 : 0;

        ctx.save();
        // Move para a posição do herói
        ctx.translate(hero.x, hero.y - walkBob);

        // Vira o herói para o alvo (se tiver) ou direção do movimento/WASD
        let angle = hero.facingAngle || 0;
        if (hero.target && hero.target.isAlive()) {
            angle = Math.atan2(hero.target.y - hero.y, hero.target.x - hero.x);
        } else if (hero.moving) {
            angle = Math.atan2(hero.targetY - hero.y, hero.targetX - hero.x);
        }
        
        ctx.rotate(angle);

        // --- MÃOS E ARMAS ---
        const handRadius = hero.radius * 0.4;
        const handColor = '#fcd34d'; // Cor de pele simples ou luva

        // Posições base das mãos (esquerda e direita relativas ao corpo)
        let leftHandX = 0, leftHandY = -hero.radius;
        let rightHandX = 0, rightHandY = hero.radius;

        // Animação de caminhada
        leftHandX += handSwing;
        rightHandX -= handSwing;

        // Ajustes por tipo de herói
        if (hero.heroId === 'knight') {
            // Segura uma espada na mão direita
            if (isAttacking) { rightHandX += Math.sin(attackProgress * Math.PI) * 15; }
            
            // Desenha a espada
            ctx.save();
            ctx.translate(rightHandX, rightHandY);
            ctx.rotate(Math.PI / 4); // Aponta pra frente
            ctx.fillStyle = '#94a3b8'; // Lâmina
            ctx.fillRect(0, -2, 20 + (isAttacking ? 5 : 0), 4);
            ctx.fillStyle = '#b45309'; // Cabo
            ctx.fillRect(-5, -3, 5, 6);
            ctx.restore();
            
        } else if (hero.heroId === 'mage') {
            // Segura um cajado com as duas mãos à frente
            leftHandX = 8; leftHandY = -8;
            rightHandX = 8; rightHandY = 8;
            
            if (isAttacking) {
                leftHandX += 5; rightHandX += 5;
            }

            // Cajado
            ctx.save();
            ctx.translate(leftHandX + 2, leftHandY);
            ctx.rotate(Math.PI / 8);
            ctx.fillStyle = '#78350f'; // Madeira
            ctx.fillRect(-10, -2, 25, 4);
            // Orbe do cajado
            ctx.fillStyle = skin.colors.primary;
            ctx.beginPath();
            ctx.arc(15, 0, 5 + (isAttacking ? 3 : 0), 0, Math.PI*2);
            ctx.fill();
            ctx.restore();

        } else if (hero.heroId === 'archer') {
            // Segura o arco na mão esquerda e puxa com a direita
            leftHandX = 10; leftHandY = 0;
            rightHandX = 0; rightHandY = 5;

            if (isAttacking) {
                // Puxa a corda para trás e solta
                if (attackProgress < 0.8) {
                    rightHandX -= attackProgress * 10; // Puxando
                } else {
                    rightHandX += 5; // Soltou
                }
            }

            // Arco
            ctx.save();
            ctx.translate(leftHandX, leftHandY);
            ctx.strokeStyle = '#92400e';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 12, -Math.PI/2, Math.PI/2);
            ctx.stroke();
            
            // Flecha (se estiver puxando)
            if (isAttacking && attackProgress < 0.8) {
                ctx.strokeStyle = '#cbd5e1';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(rightHandX - leftHandX, rightHandY - leftHandY);
                ctx.lineTo(12, 0);
                ctx.stroke();
            }
            ctx.restore();
        }

        // Desenha as mãos
        ctx.fillStyle = handColor;
        ctx.beginPath(); ctx.arc(leftHandX, leftHandY, handRadius, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(rightHandX, rightHandY, handRadius, 0, Math.PI*2); ctx.fill();

        // --- CORPO ---
        // Desenha o corpo do herói depois das mãos (fica por cima)
        const bodyGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, hero.radius);
        if (hero.flashTimer > 0) {
            bodyGrad.addColorStop(0, '#ffffff');
            bodyGrad.addColorStop(1, '#dddddd');
        } else if (isAttacking) {
            bodyGrad.addColorStop(0, skin.attackFlash || '#fef08a');
            bodyGrad.addColorStop(1, skin.colors.secondary);
        } else {
            bodyGrad.addColorStop(0, skin.colors.primary);
            bodyGrad.addColorStop(1, skin.colors.secondary);
        }
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        // O corpo incha ligeiramente com a respiração
        ctx.arc(0, 0, hero.radius + breathe * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Borda do corpo
        ctx.strokeStyle = skin.colors.border;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore(); // Retorna o canvas ao estado normal (sem rotação/translação)


        hero.drawHealthBar(ctx);
    },

    /** Cronômetro de renascimento */
    _drawRespawnTimer(ctx, hero) {
        const W = GameConfig.MAP_WIDTH;
        const H = GameConfig.MAP_HEIGHT;
        const yPos = hero.team === 'player' ? H - 100 : 100;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.roundRect(W / 2 - 60, yPos - 15, 120, 30, 15);
        ctx.fill();

        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`Renascendo: ${Math.ceil(hero.respawnTimer)}s`, W / 2, yPos);

        ctx.font = '20px serif';
        ctx.fillText(hero.activeSkin.icon, W / 2, yPos - 35);

        ctx.restore();
    },

    /** Indicador circular ao redor do alvo selecionado */
    _drawTargetIndicator(ctx, hero, target) {
        const pulse = 0.8 + Math.sin(hero.animTime * 10) * 0.2;
        ctx.save();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.radius + 10 * pulse, 0, Math.PI * 2);
        ctx.stroke();

        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i + hero.animTime * 2;
            const dist = target.radius + 15 * pulse;
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(target.x + Math.cos(angle) * dist, target.y + Math.sin(angle) * dist, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
};
