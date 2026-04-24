/**
 * HeroAI.js - Inteligência Artificial dos Heróis
 * 
 * Extraído do Hero.js para manter responsabilidades separadas.
 * Controla o comportamento de heróis gerenciados pela IA.
 * 
 * ⭐ Para criar perfis de IA diferentes por herói, pode-se
 *    adicionar um campo 'aiProfile' no HeroRegistry e usar
 *    diferentes estratégias aqui.
 */
const HeroAI = {

    /**
     * Atualiza a IA de um herói
     * @param {Hero} hero - Herói controlado pela IA
     * @param {number} dt - Delta time
     * @param {Entity[]} enemies - Lista de inimigos
     */
    update(hero, dt, enemies) {
        hero.aiTimer -= dt;
        if (hero.aiTimer > 0) return;
        hero.aiTimer = hero.aiDecisionInterval;

        const ai = GameConfig.AI;
        const nearest = hero.findNearestEnemy(enemies);

        if (nearest) {
            const dist = hero.distanceTo(nearest);

            // Perseguir inimigo próximo
            if (dist < ai.chaseDistance) {
                hero.manualTarget = nearest;
            }

            // Usar habilidade especial quando possível e no alcance
            if (hero.mana >= hero.maxMana && dist < (hero.abilityCfg.range || 80) + 20) {
                hero.useSpecial(enemies);
            }
        } else {
            // Patrulhar quando não há inimigos
            hero.manualTarget = null;
            hero.targetX = ai.patrolCenterX + (Math.random() - 0.5) * ai.patrolRangeX;
            hero.targetY = ai.patrolMinY + Math.random() * ai.patrolRangeY;
        }

        // --- TRAVA DE SEGURANÇA (Anti-Stuck) ---
        // Impede que a IA tente ir para trás das bases
        const minY = 100; // Espaço seguro do topo
        const maxY = GameConfig.MAP_HEIGHT - 100; // Espaço seguro do fundo
        
        hero.targetY = Math.max(minY, Math.min(maxY, hero.targetY));
        hero.targetX = Math.max(20, Math.min(GameConfig.MAP_WIDTH - 20, hero.targetX));
    }
};
