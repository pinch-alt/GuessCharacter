/**
 * Earth Guard: Gravity Control
 * Core Game Engine
 */

class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const mag = this.magnitude();
        if (mag > 0) {
            this.x /= mag;
            this.y /= mag;
        }
        return this;
    }

    copy() {
        return new Vector2(this.x, this.y);
    }

    static distance(v1, v2) {
        const dx = v1.x - v2.x;
        const dy = v1.y - v2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

class Entity {
    constructor(pos, vel, radius, color) {
        this.pos = pos;
        this.vel = vel;
        this.radius = radius;
        this.color = color;
        this.destroyed = false;
    }

    update(friction = 1) {
        this.vel.multiply(friction);
        this.pos.add(this.vel);
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}

class Earth extends Entity {
    constructor(x, y) {
        super(new Vector2(x, y), new Vector2(0, 0), 38, '#00d2ff');
        this.pulse = 0;
    }

    draw(ctx) {
        this.pulse += 0.05;
        const pulseRadius = this.radius + Math.sin(this.pulse) * 3;

        // Outer Glow
        const gradient = ctx.createRadialGradient(
            this.pos.x, this.pos.y, this.radius * 0.8,
            this.pos.x, this.pos.y, this.radius * 2.5
        );
        gradient.addColorStop(0, 'rgba(0, 210, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 210, 255, 0)');

        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Main Body
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, pulseRadius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.closePath();
    }
}

class Asteroid extends Entity {
    constructor(pos, vel) {
        const radius = 10 + Math.random() * 15;
        super(pos, vel, radius, '#888');
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    }

    draw(ctx) {
        this.rotation += this.rotationSpeed;
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.rotation);
        
        ctx.beginPath();
        ctx.moveTo(this.radius, 0);
        for (let i = 1; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const r = this.radius * (0.8 + Math.random() * 0.4);
            ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.fillStyle = '#4a4a4a';
        ctx.strokeStyle = '#777';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
}

class Item extends Entity {
    constructor(pos, vel, type) {
        const types = {
            blue: { color: '#00f2ff', score: 30, radius: 8 },
            green: { color: '#00ff88', score: 50, radius: 10 },
            yellow: { color: '#ffff00', score: 70, radius: 12 }
        };
        const config = types[type];
        super(pos, vel, config.radius, config.color);
        this.type = type;
        this.scoreValue = config.score;
        this.glow = 0;
    }

    draw(ctx) {
        this.glow += 0.1;
        const glowSize = this.radius * (1.2 + Math.sin(this.glow) * 0.3);

        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = this.color + '44'; // Transparent glow
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

class Particle extends Entity {
    constructor(pos, vel, color) {
        super(pos, vel, Math.random() * 3, color);
        this.life = 1.0;
        this.decay = 0.02 + Math.random() * 0.02;
    }

    update() {
        super.update();
        this.life -= this.decay;
        if (this.life <= 0) this.destroyed = true;
    }

    draw(ctx) {
        ctx.globalAlpha = this.life;
        super.draw(ctx);
        ctx.globalAlpha = 1.0;
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.modeElement = document.getElementById('gravity-mode');
        this.gameOverScreen = document.getElementById('game-over');
        this.finalScoreElement = document.getElementById('final-score-value');
        this.modeSelectBtns = document.querySelectorAll('.mode-select-btn');

        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.currentMode = 'original'; // original, change, two-earth
        this.earths = [];
        this.entities = [];
        this.particles = [];
        this.score = 0;
        this.isGameOver = false;
        this.isAttracting = true;
        this.mousePos = new Vector2(this.width / 2, this.height / 2);

        this.spawnTimer = 0;
        this.spawnInterval = 700; // ms
        this.survivalTimer = 0;
        this.modeTimer = 0; // For 'change' mode
        this.startTime = Date.now();

        this.setupMode('original');
        this.initEventListeners();
        this.animate();
    }

    initEventListeners() {
        window.addEventListener('resize', () => {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.setupMode(this.currentMode); // Recalculate earth positions
        });

        window.addEventListener('mousemove', (e) => {
            this.mousePos.x = e.clientX;
            this.mousePos.y = e.clientY;
        });

        window.addEventListener('mousedown', () => {
            if (this.currentMode !== 'original') {
                this.toggleGravity();
            }
        });

        this.modeSelectBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.getAttribute('data-mode');
                this.reset(mode);
            });
        });
    }

    setupMode(mode) {
        this.currentMode = mode;
        this.earths = [];
        if (mode === 'two-earth') {
            this.earths.push(new Earth(this.width * 0.25, this.height / 2));
            this.earths.push(new Earth(this.width * 0.75, this.height / 2));
        } else {
            this.earths.push(new Earth(this.width / 2, this.height / 2));
        }

        if (mode === 'original') {
            this.isAttracting = true;
            this.modeElement.textContent = 'ORIGINAL (ATTRACT ONLY)';
            this.modeElement.className = 'mode-attract';
        } else {
            this.modeElement.textContent = this.isAttracting ? 'ATTRACT' : 'REPEL';
            this.modeElement.className = this.isAttracting ? 'mode-attract' : 'mode-repel';
        }
    }

    toggleGravity() {
        if (this.currentMode === 'original') return;
        this.isAttracting = !this.isAttracting;
        this.modeElement.textContent = this.isAttracting ? 'ATTRACT' : 'REPEL';
        this.modeElement.className = this.isAttracting ? 'mode-attract' : 'mode-repel';
    }

    reset(mode = 'original') {
        this.score = 0;
        this.entities = [];
        this.particles = [];
        this.isGameOver = false;
        this.spawnInterval = 700;
        this.modeTimer = 0;
        this.startTime = Date.now();
        this.scoreElement.textContent = '0';
        this.gameOverScreen.classList.add('hidden');
        this.isAttracting = true;
        this.setupMode(mode);
    }

    spawnEntity() {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        if (side === 0) { x = Math.random() * this.width; y = -50; }
        else if (side === 1) { x = this.width + 50; y = Math.random() * this.height; }
        else if (side === 2) { x = Math.random() * this.width; y = this.height + 50; }
        else { x = -50; y = Math.random() * this.height; }

        const pos = new Vector2(x, y);
        // Target a random Earth
        const targetEarth = this.earths[Math.floor(Math.random() * this.earths.length)];
        const toTarget = targetEarth.pos.copy().sub(pos).normalize();
        const speed = 2.5 + Math.random() * 2.5;
        const vel = toTarget.multiply(speed);

        if (Math.random() < 0.2) {
            // Spawn Item
            const rand = Math.random();
            let type = 'blue';
            if (rand > 0.8) type = 'yellow';
            else if (rand > 0.5) type = 'green';
            this.entities.push(new Item(pos, vel, type));
        } else {
            // Spawn Asteroid
            this.entities.push(new Asteroid(pos, vel));
        }
    }

    createExplosion(pos, color, count = 10) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4;
            const vel = new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed);
            this.particles.push(new Particle(pos.copy(), vel, color));
        }
    }

    update(deltaTime) {
        if (this.isGameOver) return;

        // Survival Score (+10 per sec)
        this.survivalTimer += deltaTime;
        if (this.survivalTimer >= 1000) {
            this.score += 10;
            this.survivalTimer = 0;
            this.scoreElement.textContent = Math.floor(this.score);
        }

        // Mode Specific Logic: Change Mode (Auto toggle every 5s)
        if (this.currentMode === 'change') {
            this.modeTimer += deltaTime;
            if (this.modeTimer >= 5000) {
                this.toggleGravity();
                this.modeTimer = 0;
            }
        }

        // Spawn Logic
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnEntity();
            this.spawnTimer = 0;
            // Scale difficulty
            this.spawnInterval = Math.max(400, this.spawnInterval * 0.98);
        }

        // Update Particles
        this.particles.forEach((p, i) => {
            p.update();
            if (p.destroyed) this.particles.splice(i, 1);
        });

        // Update Entities
        this.entities.forEach((ent, i) => {
            // Apply Gravity Force from Mouse (Now even softer)
            const distToMouse = Vector2.distance(ent.pos, this.mousePos);
            if (distToMouse < 600) {
                const forceDir = this.mousePos.copy().sub(ent.pos).normalize();
                const forceMag = (600 - distToMouse) / 7500;
                const force = forceDir.multiply(this.isAttracting ? forceMag : -forceMag);
                ent.vel.add(force);
            }

            // Apply Natural Gravity from Earths (Always Attract)
            this.earths.forEach(earth => {
                const distToEarth = Vector2.distance(ent.pos, earth.pos);
                // Stronger pull when closer to Earth
                const gravityMag = 0.05 * (earth.radius / Math.max(distToEarth, 20));
                const gravityDir = earth.pos.copy().sub(ent.pos).normalize();
                ent.vel.add(gravityDir.multiply(gravityMag));
            });

            ent.update(1.0); // No friction

            // Check Collision with Earths
            this.earths.forEach(earth => {
                const distToEarth = Vector2.distance(ent.pos, earth.pos);
                if (distToEarth < ent.radius + earth.radius) {
                    if (ent instanceof Asteroid) {
                        this.endGame();
                    } else if (ent instanceof Item) {
                        this.score += ent.scoreValue;
                        this.scoreElement.textContent = Math.floor(this.score);
                        this.createExplosion(ent.pos, ent.color, 15);
                        this.entities.splice(i, 1);
                    }
                }
            });

            // Remove off-screen entities (far away)
            if (ent.pos.x < -200 || ent.pos.x > this.width + 200 || ent.pos.y < -200 || ent.pos.y > this.height + 200) {
                this.entities.splice(i, 1);
            }
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw Gravity Field Visual
        const fieldGlow = this.ctx.createRadialGradient(
            this.mousePos.x, this.mousePos.y, 0,
            this.mousePos.x, this.mousePos.y, 250
        );
        const fieldColor = this.isAttracting ? '0, 242, 255' : '255, 0, 85';
        fieldGlow.addColorStop(0, `rgba(${fieldColor}, 0.15)`);
        fieldGlow.addColorStop(1, `rgba(${fieldColor}, 0)`);
        
        this.ctx.fillStyle = fieldGlow;
        this.ctx.beginPath();
        this.ctx.arc(this.mousePos.x, this.mousePos.y, 250, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw Entities
        this.particles.forEach(p => p.draw(this.ctx));
        this.entities.forEach(ent => ent.draw(this.ctx));
        this.earths.forEach(earth => earth.draw(this.ctx));
    }

    endGame() {
        this.isGameOver = true;
        this.finalScoreElement.textContent = Math.floor(this.score);
        this.gameOverScreen.classList.remove('hidden');
        this.earths.forEach(earth => {
            this.createExplosion(earth.pos, '#00d2ff', 50);
            this.createExplosion(earth.pos, '#ff4444', 30);
        });
    }

    animate() {
        const now = Date.now();
        const deltaTime = now - (this.lastTime || now);
        this.lastTime = now;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame(() => this.animate());
    }
}

// Start Game
window.onload = () => {
    new Game();
};
