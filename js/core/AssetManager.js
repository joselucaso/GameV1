/**
 * AssetManager.js - Gerenciador de Assets (Imagens/Sprites)
 * 
 * Carrega imagens assincronamente e as disponibiliza para o jogo.
 * Suporta recorte de regiões específicas (crop) para usar apenas
 * partes de uma imagem maior (como extrair o personagem frontal
 * de uma imagem de showcase).
 * 
 * ⭐ USO:
 *    AssetManager.register('knight_front', { src: 'path/to/img.png', crop: {x,y,w,h} });
 *    await AssetManager.loadAll();
 *    const img = AssetManager.get('knight_front');
 */
const AssetManager = {

    /** @type {Object<string, {src, crop, image, canvas}>} Assets registrados */
    _assets: {},

    /** @type {boolean} Se todos os assets foram carregados */
    ready: false,

    /**
     * Registra um asset para carregamento
     * @param {string} id - Identificador único
     * @param {object} config - { src: string, crop?: {x,y,w,h} }
     */
    register(id, config) {
        this._assets[id] = { ...config, image: null, canvas: null };
    },

    /**
     * Carrega todos os assets registrados
     * @returns {Promise} Resolve quando todos estão carregados
     */
    async loadAll() {
        const entries = Object.entries(this._assets);
        const promises = entries.map(([id, cfg]) => this._loadOne(id, cfg));
        await Promise.all(promises);
        this.ready = true;
        console.log(`[AssetManager] ${entries.length} assets carregados.`);
    },

    /**
     * Carrega um asset individual
     * @private
     */
    _loadOne(id, cfg) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                cfg.image = img;

                // Se tem crop, cria um canvas recortado
                if (cfg.crop) {
                    const c = cfg.crop;
                    const canvas = document.createElement('canvas');
                    canvas.width = c.w;
                    canvas.height = c.h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h);
                    cfg.canvas = canvas;
                }

                resolve();
            };
            img.onerror = () => {
                console.warn(`[AssetManager] Falha ao carregar '${id}': ${cfg.src}`);
                resolve(); // Não bloqueia o jogo se uma imagem falhar
            };
            img.src = cfg.src;
        });
    },

    /**
     * Obtém o asset (canvas recortado ou imagem original)
     * @param {string} id
     * @returns {HTMLCanvasElement|HTMLImageElement|null}
     */
    get(id) {
        const asset = this._assets[id];
        if (!asset) return null;
        return asset.canvas || asset.image || null;
    },

    /**
     * Verifica se um asset específico está disponível
     * @param {string} id
     * @returns {boolean}
     */
    has(id) {
        return this.get(id) !== null;
    }
};

// ============================================================
//  SPRITES PRÉ-REGISTRADOS
//  As imagens de Samples são showcases — recortamos a vista frontal
//  de cada personagem.
// ============================================================

// Knight: vista frontal (centro da imagem)
AssetManager.register('knight_default', {
    src: 'Sprits/Samples/knight.png',
    crop: { x: 360, y: 70, w: 310, h: 490 }
});

// Mage: vista frontal
AssetManager.register('mage_default', {
    src: 'Sprits/Samples/mage.png',
    crop: { x: 360, y: 70, w: 320, h: 490 }
});

// Ranger/Archer: vista frontal
AssetManager.register('archer_default', {
    src: 'Sprits/Samples/ranger.png',
    crop: { x: 330, y: 70, w: 330, h: 490 }
});
