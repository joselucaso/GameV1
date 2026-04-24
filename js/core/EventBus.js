/**
 * EventBus.js - Sistema de Eventos Pub/Sub
 * 
 * Permite comunicação desacoplada entre módulos.
 * Exemplo: quando um minion morre, o SpawnManager pode ouvir
 * sem precisar de referência direta ao GameManager.
 * 
 * Eventos disponíveis:
 *   'entity:death'     - { entity }
 *   'hero:special'     - { hero, hits }
 *   'game:over'        - { winner }
 *   'spawn:minions'    - { team }
 *   'tower:destroyed'  - { tower }
 */
const EventBus = {

    /** @type {Object<string, Function[]>} Listeners por evento */
    _listeners: {},

    /**
     * Registra um listener para um evento
     * @param {string} event - Nome do evento
     * @param {Function} callback - Função a ser chamada
     */
    on(event, callback) {
        if (!this._listeners[event]) {
            this._listeners[event] = [];
        }
        this._listeners[event].push(callback);
    },

    /**
     * Remove um listener específico
     * @param {string} event
     * @param {Function} callback
     */
    off(event, callback) {
        if (!this._listeners[event]) return;
        this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
    },

    /**
     * Emite um evento para todos os listeners
     * @param {string} event - Nome do evento
     * @param {object} data - Dados do evento
     */
    emit(event, data = {}) {
        if (!this._listeners[event]) return;
        for (const callback of this._listeners[event]) {
            callback(data);
        }
    },

    /**
     * Remove todos os listeners (para reset do jogo)
     */
    clear() {
        this._listeners = {};
    }
};
