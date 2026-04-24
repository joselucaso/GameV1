/**
 * CollisionManager.js - Sistema de Colisão e Separação
 * 
 * Extraído do GameManager para manter responsabilidades separadas.
 * Gerencia colisões entre unidades móveis, estruturas estáticas
 * e limites do mapa.
 * 
 * Preparado para suportar obstáculos adicionais no futuro.
 */
const CollisionManager = {

    /**
     * Resolve todas as colisões do frame atual
     * @param {Entity[]} mobileUnits - Unidades que se movem (heróis, tropas)
     * @param {Entity[]} staticUnits - Estruturas fixas (torres, bases)
     * @param {object[]} obstacles - Obstáculos adicionais do mapa [{x, y, radius}]
     */
    resolve(mobileUnits, staticUnits, obstacles = []) {
        // 1. Colisões entre unidades móveis (repulsão mútua)
        for (let i = 0; i < mobileUnits.length; i++) {
            for (let j = i + 1; j < mobileUnits.length; j++) {
                this._separatePair(mobileUnits[i], mobileUnits[j], 0.5);
            }
        }

        // 2. Colisões contra estruturas estáticas (só o móvel é empurrado)
        for (const m of mobileUnits) {
            for (const s of staticUnits) {
                this._separateFromStatic(m, s);
            }

            // 3. Colisões contra obstáculos do mapa
            for (const obs of obstacles) {
                if (obs.type === 'rect') {
                    this._separateFromRect(m, obs);
                } else {
                    this._separateFromObstacle(m, obs);
                }
            }

            // 4. Limites do mapa
            this._clampToMap(m);
        }
    },

    /**
     * Empurra uma unidade para fora de um retângulo
     * @param {Entity} mobile 
     * @param {object} rect { x, y, width, height }
     */
    _separateFromRect(mobile, rect) {
        // Encontra o ponto mais próximo do círculo dentro do retângulo
        const closestX = Math.max(rect.x, Math.min(mobile.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(mobile.y, rect.y + rect.height));

        const dx = mobile.x - closestX;
        const dy = mobile.y - closestY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mobile.radius && dist > 0) {
            const overlap = mobile.radius - dist;
            mobile.x += (dx / dist) * overlap;
            mobile.y += (dy / dist) * overlap;
        } else if (dist === 0) {
            // Se estiver EXATAMENTE dentro (caso raro), empurra para fora pela menor distância
            const midX = rect.x + rect.width / 2;
            const midY = rect.y + rect.height / 2;
            if (mobile.x < midX) mobile.x = rect.x - mobile.radius;
            else mobile.x = rect.x + rect.width + mobile.radius;
        }
    },

    /**
     * Separa duas unidades móveis (empurra ambas igualmente)
     * @param {Entity} u1
     * @param {Entity} u2
     * @param {number} ratio - 0.5 = empurra igualmente
     */
    _separatePair(u1, u2, ratio) {
        const dx = u2.x - u1.x;
        const dy = u2.y - u1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = u1.radius + u2.radius;

        if (dist < minDist) {
            const overlap = minDist - dist;
            const angle = dist > 0 ? Math.atan2(dy, dx) : Math.random() * Math.PI * 2;
            const force = overlap * ratio;

            u1.x -= Math.cos(angle) * force;
            u1.y -= Math.sin(angle) * force;
            u2.x += Math.cos(angle) * force;
            u2.y += Math.sin(angle) * force;
        }
    },

    /**
     * Empurra uma unidade móvel para fora de uma estrutura estática
     * @param {Entity} mobile
     * @param {Entity} staticUnit
     */
    _separateFromStatic(mobile, staticUnit) {
        const dx = mobile.x - staticUnit.x;
        const dy = mobile.y - staticUnit.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = mobile.radius + staticUnit.radius;

        if (dist < minDist) {
            const overlap = minDist - dist;
            const angle = dist > 0 ? Math.atan2(dy, dx) : Math.random() * Math.PI * 2;
            mobile.x += Math.cos(angle) * overlap;
            mobile.y += Math.sin(angle) * overlap;
        }
    },

    /**
     * Empurra uma unidade móvel para fora de um obstáculo
     * @param {Entity} mobile
     * @param {object} obstacle - { x, y, radius }
     */
    _separateFromObstacle(mobile, obstacle) {
        const dx = mobile.x - obstacle.x;
        const dy = mobile.y - obstacle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = mobile.radius + obstacle.radius;

        if (dist < minDist) {
            const overlap = minDist - dist;
            const angle = dist > 0 ? Math.atan2(dy, dx) : Math.random() * Math.PI * 2;
            mobile.x += Math.cos(angle) * overlap;
            mobile.y += Math.sin(angle) * overlap;
        }
    },

    /** Mantém a unidade dentro dos limites do mapa */
    _clampToMap(unit) {
        const W = GameConfig.MAP_WIDTH;
        const H = GameConfig.MAP_HEIGHT;
        unit.x = Math.max(unit.radius, Math.min(W - unit.radius, unit.x));
        unit.y = Math.max(unit.radius, Math.min(H - unit.radius, unit.y));
    }
};
