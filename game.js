/**
 * Shadow Blades - Multiplayer 1x1 Fighting Game
 * Logic and Game Engine
 */

// Configuration
const CONFIG = {
    canvasWidth: 1280,
    canvasHeight: 720,
    gravity: 0.8,
    friction: 0.9,
    jumpForce: 18,
    moveSpeed: 7,
    maxHealth: 100,
    roundTime: 90,
    swordRange: 80,
    swordWidth: 120,
    swordHeight: 40
};

// --- Player Class ---
class Player {
    constructor(id, x, y, color, side) {
        this.id = id;
        this.width = 50;
        this.height = 100;
        this.pos = { x, y };
        this.vel = { x: 0, y: 0 };
        this.color = color;
        this.side = side; // 'left' or 'right'
        this.health = CONFIG.maxHealth;
        this.isJumping = false;
        this.isAttacking = false;
        this.attackCooldown = false;
        this.facing = side === 'left' ? 1 : -1; // 1 for right, -1 for left
        this.roundsWon = 0;
        this.keys = { left: false, right: false, up: false, attack: false };
    }

    update(platforms) {
        // Horizontal Movement
        if (this.keys.left) this.vel.x = -CONFIG.moveSpeed;
        else if (this.keys.right) this.vel.x = CONFIG.moveSpeed;
        else this.vel.x *= CONFIG.friction;

        if (this.vel.x > 0.1) this.facing = 1;
        else if (this.vel.x < -0.1) this.facing = -1;

        // Gravity
        this.vel.y += CONFIG.gravity;

        // Apply Velocity
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;

        // Platform Collision
        this.checkCollisions(platforms);

        // Screen Bounds
        if (this.pos.x < 0) this.pos.x = 0;
        if (this.pos.x + this.width > CONFIG.canvasWidth) this.pos.x = CONFIG.canvasWidth - this.width;
        if (this.pos.y < 0) this.pos.y = 0;
        if (this.pos.y + this.height > CONFIG.canvasHeight) {
            this.pos.y = CONFIG.canvasHeight - this.height;
            this.vel.y = 0;
            this.isJumping = false;
        }
    }

    checkCollisions(platforms) {
        platforms.forEach(p => {
            // Collision detection (AABB)
            if (this.pos.x < p.x + p.w &&
                this.pos.x + this.width > p.x &&
                this.pos.y < p.y + p.h &&
                this.pos.y + this.height > p.y) {
                
                // Determine collision side (simplified)
                const overlapX = Math.min(this.pos.x + this.width - p.x, p.x + p.w - this.pos.x);
                const overlapY = Math.min(this.pos.y + this.height - p.y, p.y + p.h - this.pos.y);

                if (overlapX < overlapY) {
                    if (this.pos.x + this.width / 2 < p.x + p.w / 2) this.pos.x = p.x - this.width;
                    else this.pos.x = p.x + p.w;
                    this.vel.x = 0;
                } else {
                    if (this.pos.y + this.height / 2 < p.y + p.h / 2) {
                        this.pos.y = p.y - this.height;
                        this.vel.y = 0;
                        this.isJumping = false;
                    } else {
                        this.pos.y = p.y + p.h;
                        this.vel.y = 0;
                    }
                }
            }
        });
    }

    attack() {
        if (this.attackCooldown || this.isAttacking) return;
        this.isAttacking = true;
        this.attackCooldown = true;

        setTimeout(() => this.isAttacking = false, 200);
        setTimeout(() => this.attackCooldown = false, 600);
    }

    // Slots de Poder Especial (Futura Implementação)
    PoderEspecial1() { console.log(`${this.id} used Special Power 1`); }
    PoderEspecial2() { console.log(`${this.id} used Special Power 2`); }
    PoderEspecial3() { console.log(`${this.id} used Special Power 3`); }
    PoderEspecial4() { console.log(`${this.id} used Special Power 4`); }

    draw(ctx) {
        // Player Body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.pos.x, this.pos.y, this.width, this.height);
        
        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.pos.x, this.pos.y, this.width, this.height);
        ctx.shadowBlur = 0;

        // Sword / Attack Visual
        if (this.isAttacking) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            const swordX = this.facing === 1 ? this.pos.x + this.width : this.pos.x - CONFIG.swordRange;
            ctx.fillRect(swordX, this.pos.y + 30, CONFIG.swordRange, 20);
            
            // Sword highlight
            ctx.shadowBlur = 20;
            ctx.shadowColor = "white";
            ctx.strokeRect(swordX, this.pos.y + 30, CONFIG.swordRange, 20);
            ctx.shadowBlur = 0;
        }
    }
}

// --- Game Module ---
const Game = {
    canvas: null,
    ctx: null,
    platforms: [
        { x: 200, y: 500, w: 200, h: 40 },
        { x: 880, y: 500, w: 200, h: 40 },
        { x: 540, y: 350, w: 200, h: 40 },
        { x: 0, y: 680, w: 1280, h: 40 } // Floor
    ],
    p1: null,
    p2: null,
    isHost: false,
    timer: CONFIG.roundTime,
    timerInterval: null,
    roundActive: false,
    gameState: 'LOBBY', // LOBBY, COUNTDOWN, FIGHT, END

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CONFIG.canvasWidth;
        this.canvas.height = CONFIG.canvasHeight;

        this.p1 = new Player('P1', 100, 500, '#ff0055', 'left');
        this.p2 = new Player('P2', 1130, 500, '#00e5ff', 'right');

        this.setupControls();
        this.loop();
    },

    setupControls() {
        window.addEventListener('keydown', (e) => {
            const key = e.code;
            const target = this.isHost ? this.p1 : this.p2;

            if (key === 'KeyA') target.keys.left = true;
            if (key === 'KeyD') target.keys.right = true;
            if (key === 'KeyW' && !target.isJumping) {
                target.vel.y = -CONFIG.jumpForce;
                target.isJumping = true;
            }
            if (key === 'Space') target.attack();
            
            // Poderes Especiais
            if (key === 'Digit1') target.PoderEspecial1();
            if (key === 'Digit2') target.PoderEspecial2();
            if (key === 'Digit3') target.PoderEspecial3();
            if (key === 'Digit4') target.PoderEspecial4();
        });

        window.addEventListener('keyup', (e) => {
            const key = e.code;
            const target = this.isHost ? this.p1 : this.p2;

            if (key === 'KeyA') target.keys.left = false;
            if (key === 'KeyD') target.keys.right = false;
        });
    },

    startRound() {
        this.timer = CONFIG.roundTime;
        this.gameState = 'FIGHT';
        this.roundActive = true;
        
        // Reset positions
        this.p1.pos = { x: 100, y: 500 };
        this.p1.health = CONFIG.maxHealth;
        this.p2.pos = { x: 1130, y: 500 };
        this.p2.health = CONFIG.maxHealth;

        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (this.timer > 0) {
                this.timer--;
                this.updateUI();
            } else {
                this.endRound("TEMPO ESGOTADO!");
            }
        }, 1000);

        this.showStatus("LUTEM!");
        setTimeout(() => this.hideStatus(), 1500);
    },

    endRound(msg) {
        this.roundActive = false;
        clearInterval(this.timerInterval);

        let winner = null;
        if (this.p1.health > this.p2.health) {
            winner = this.p1;
            msg = "JOGADOR 1 VENCEU O ROUND!";
        } else if (this.p2.health > this.p1.health) {
            winner = this.p2;
            msg = "JOGADOR 2 VENCEU O ROUND!";
        } else {
            msg = "EMPATE!";
        }

        if (winner) winner.roundsWon++;
        this.updateUI();
        this.showStatus(msg);

        if (this.p1.roundsWon >= 2 || this.p2.roundsWon >= 2) {
            setTimeout(() => this.showStatus("FIM DE JOGO!"), 2000);
            // Full Reset could go here
        } else {
            setTimeout(() => this.startRound(), 3000);
        }
    },

    updateUI() {
        document.getElementById('timer').innerText = this.timer;
        document.getElementById('p1-health').style.width = `${this.p1.health}%`;
        document.getElementById('p2-health').style.width = `${this.p2.health}%`;
        
        // Rounds
        const p1Dots = document.querySelectorAll('#p1-rounds .round-dot');
        const p2Dots = document.querySelectorAll('#p2-rounds .round-dot');
        
        for(let i=0; i<this.p1.roundsWon; i++) p1Dots[i]?.classList.add('won');
        for(let i=0; i<this.p2.roundsWon; i++) p2Dots[i]?.classList.add('won');
    },

    showStatus(msg) {
        const el = document.getElementById('status-message');
        el.innerText = msg;
        el.classList.remove('hidden');
    },

    hideStatus() {
        document.getElementById('status-message').classList.add('hidden');
    },

    checkHit() {
        if (!this.roundActive) return;

        // P1 Hit P2
        if (this.p1.isAttacking) {
            const swordX = this.p1.facing === 1 ? this.p1.pos.x + this.p1.width : this.p1.pos.x - CONFIG.swordRange;
            if (this.rectIntersect(swordX, this.p1.pos.y + 30, CONFIG.swordRange, 20, this.p2.pos.x, this.p2.pos.y, this.p2.width, this.p2.height)) {
                this.p2.health -= 2; // Rapid damage while attacking
                if (this.p2.health <= 0) this.endRound();
            }
        }

        // P2 Hit P1
        if (this.p2.isAttacking) {
            const swordX = this.p2.facing === 1 ? this.p2.pos.x + this.p2.width : this.p2.pos.x - CONFIG.swordRange;
            if (this.rectIntersect(swordX, this.p2.pos.y + 30, CONFIG.swordRange, 20, this.p1.pos.x, this.p1.pos.y, this.p1.width, this.p1.height)) {
                this.p1.health -= 2;
                if (this.p1.health <= 0) this.endRound();
            }
        }
    },

    rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x2 < x1 + w1 && x2 + w2 > x1 && y2 < y1 + h1 && y2 + h2 > y1;
    },

    update() {
        if (this.gameState === 'LOBBY') return;
        
        this.p1.update(this.platforms);
        this.p2.update(this.platforms);
        this.checkHit();
        this.updateUI();
    },

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Platforms
        this.ctx.fillStyle = '#333';
        this.platforms.forEach(p => {
            // Gradient for platforms
            const grad = this.ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
            grad.addColorStop(0, '#444');
            grad.addColorStop(1, '#222');
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(p.x, p.y, p.w, p.h);
            
            // Neon edge
            this.ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(p.x, p.y, p.w, p.h);
        });

        this.p1.draw(this.ctx);
        this.p2.draw(this.ctx);
    },

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
};

// --- Connection / Networking Module ---
const Networking = {
    peer: null,
    conn: null,
    myId: null,

    init() {
        this.peer = new Peer();
        
        this.peer.on('open', (id) => {
            this.myId = id;
            document.getElementById('my-id-display').innerText = `SEU ID: ${id}`;
        });

        this.peer.on('connection', (conn) => {
            if (this.conn) return; // Only 1 opponent
            this.conn = conn;
            Game.isHost = true;
            this.setupConnection();
        });

        document.getElementById('connect-btn').addEventListener('click', () => {
            const peerId = document.getElementById('peer-id-input').value;
            if (peerId) {
                this.conn = this.peer.connect(peerId);
                Game.isHost = false;
                this.setupConnection();
            }
        });

        document.getElementById('copy-id-btn').addEventListener('click', () => {
            navigator.clipboard.writeText(this.myId);
            alert("ID Copiado!");
        });
    },

    setupConnection() {
        this.conn.on('open', () => {
            document.getElementById('lobby').classList.add('hidden');
            Game.gameState = 'FIGHT';
            if (Game.isHost) Game.startRound();
            
            // Sync Loop
            setInterval(() => {
                const me = Game.isHost ? Game.p1 : Game.p2;
                this.conn.send({
                    type: 'sync',
                    pos: me.pos,
                    health: me.health,
                    isAttacking: me.isAttacking,
                    facing: me.facing,
                    roundsWon: me.roundsWon,
                    timer: Game.timer
                });
            }, 16); // ~60fps sync
        });

        this.conn.on('data', (data) => {
            if (data.type === 'sync') {
                const other = Game.isHost ? Game.p2 : Game.p1;
                other.pos = data.pos;
                other.health = data.health;
                other.isAttacking = data.isAttacking;
                other.facing = data.facing;
                other.roundsWon = data.roundsWon;
                if (!Game.isHost) Game.timer = data.timer;
            }
        });
    }
};

// Start
Game.init();
Networking.init();
