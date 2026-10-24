
"use strict";

// ========================================
// 1. CANVAS & HTML ELEMENTS
// ========================================

const canvas = document.getElementById("gameCanvas");

if (!canvas) {
    throw new Error('HTML mein id="gameCanvas" wala canvas nahi mila.');
}

const ctx = canvas.getContext("2d");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");

const healthText = document.getElementById("health");
const scoreText = document.getElementById("score");
const enemiesText = document.getElementById("enemies");

const W = 960;
const H = 540;
const WORLD_END = 3600;
const TARGET_KILLS = 100;

canvas.width = W;
canvas.height = H;

// ========================================
// 2. GAME STATE
// ========================================

let running = false;
let paused = false;
let frameId = null;
let lastTime = 0;

let score = 0;
let enemiesKilled = 0;
let cameraX = 0;

let player = null;
let enemies = [];
let bullets = [];
let enemyBullets = [];
let particles = [];

let nextEnemyId = 1;
let jumpRequested = false;

const keys = Object.create(null);

const controls = {
    left: false,
    right: false,
    fire: false
};

// ========================================
// 3. PLATFORMS
// ========================================

const platforms = [
    { x: 0, y: 450, w: 650, h: 90 },
    { x: 650, y: 450, w: 450, h: 90 },
    { x: 1100, y: 450, w: 500, h: 90 },
    { x: 1600, y: 450, w: 500, h: 90 },
    { x: 2100, y: 450, w: 500, h: 90 },
    { x: 2600, y: 450, w: 500, h: 90 },
    { x: 3100, y: 450, w: 500, h: 90 },

    { x: 300, y: 360, w: 150, h: 18 },
    { x: 820, y: 350, w: 160, h: 18 },
    { x: 1300, y: 355, w: 180, h: 18 },
    { x: 1850, y: 350, w: 160, h: 18 },
    { x: 2350, y: 355, w: 180, h: 18 },
    { x: 2850, y: 350, w: 160, h: 18 },
    { x: 3300, y: 355, w: 180, h: 18 }
];

// ========================================
// 4. PLAYER
// ========================================

function createPlayer() {
    return {
        x: 80,
        y: 402,
        w: 30,
        h: 48,
        vx: 0,
        vy: 0,
        speed: 250,
        jumpPower: 540,
        health: 100,
        facing: 1,
        onGround: true,
        fireCooldown: 0,
        invincible: 0
    };
}

// ========================================
// 5. ENEMY
// ========================================

function createEnemy(x) {
    return {
        id: nextEnemyId++,
        x: Math.max(0, Math.min(WORLD_END - 30, x)),
        y: 402,
        w: 30,
        h: 48,
        vx: 0,
        vy: 0,
        speed: 65,
        health: 1,
        facing: -1,
        onGround: true,
        fireCooldown: 1 + Math.random() * 2,
        alive: true
    };
}

function createWorld() {
    enemies = [];
    bullets = [];
    enemyBullets = [];
    particles = [];
    nextEnemyId = 1;

    // Initial enemies.
    for (let x = 420; x < WORLD_END - 100; x += 170) {
        enemies.push(createEnemy(x));
    }
}

// ========================================
// 6. HUD
// ========================================

function updateHUD() {
    if (healthText) {
        healthText.textContent = player ? player.health : 100;
    }

    if (scoreText) {
        scoreText.textContent = score;
    }

    if (enemiesText) {
        enemiesText.textContent =
            enemiesKilled + " / " + TARGET_KILLS;
    }
}

// ========================================
// 7. START / RESET
// ========================================

function resetGame() {
    score = 0;
    enemiesKilled = 0;
    cameraX = 0;
    paused = false;
    jumpRequested = false;

    for (const key in keys) {
        delete keys[key];
    }

    controls.left = false;
    controls.right = false;
    controls.fire = false;

    player = createPlayer();
    createWorld();
    updateHUD();

    if (pauseBtn) {
        pauseBtn.textContent = "Pause";
    }
}

function startGame() {
    if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
    }

    resetGame();

    running = true;
    paused = false;

    if (overlay) {
        overlay.classList.add("hidden");
    }

    lastTime = performance.now();
    drawGame();

    frameId = requestAnimationFrame(gameLoop);
}

// ========================================
// 8. END GAME
// ========================================

function endGame(isVictory = false) {
    if (!running) return;

    running = false;
    paused = false;

    if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
    }

    // Stop all held controls.
    controls.left = false;
    controls.right = false;
    controls.fire = false;
    jumpRequested = false;

    if (overlay) {
        overlay.classList.remove("hidden");
    }

    if (overlayTitle) {
        overlayTitle.textContent = isVictory
            ? "MISSION COMPLETED! 🏆"
            : "GAME OVER";
    }

    if (overlayText) {
        overlayText.textContent = isVictory
            ? "100 Enemies Defeated! Final Score: " + score
            : "Enemies Defeated: " + enemiesKilled +
              " | Final Score: " + score;
    }

    if (startBtn) {
        startBtn.textContent = isVictory
            ? "PLAY AGAIN"
            : "TRY AGAIN";
    }

    if (pauseBtn) {
        pauseBtn.textContent = "Pause";
    }

    drawGame();
}

// ========================================
// 9. PAUSE / RESUME
// ========================================

function togglePause() {
    if (!running) return;

    paused = !paused;

    if (paused) {
        if (frameId !== null) {
            cancelAnimationFrame(frameId);
            frameId = null;
        }

        if (pauseBtn) {
            pauseBtn.textContent = "Resume";
        }

        drawGame();
    } else {
        if (pauseBtn) {
            pauseBtn.textContent = "Pause";
        }

        lastTime = performance.now();
        frameId = requestAnimationFrame(gameLoop);
    }
}

// ========================================
// 10. KEYBOARD INPUT
// ========================================

document.addEventListener("keydown", function (e) {
    const key = e.key.toLowerCase();

    if (
        ["arrowleft", "arrowright", "arrowup", " "].includes(key)
    ) {
        e.preventDefault();
    }

    keys[key] = true;

    if (
        key === " " ||
        key === "arrowup" ||
        key === "w"
    ) {
        jumpRequested = true;
    }

    if (key === "p" && !e.repeat) {
        togglePause();
    }
});

document.addEventListener("keyup", function (e) {
    keys[e.key.toLowerCase()] = false;
});

window.addEventListener("blur", function () {
    controls.left = false;
    controls.right = false;
    controls.fire = false;

    for (const key in keys) {
        delete keys[key];
    }
});

// ========================================
// 11. MOBILE CONTROLS
// ========================================

function setupHoldButton(id, action) {
    const button = document.getElementById(id);

    if (!button) return;

    function press(e) {
        e.preventDefault();

        if (action === "jump") {
            jumpRequested = true;
        } else {
            controls[action] = true;
        }

        if (
            button.setPointerCapture &&
            e.pointerId !== undefined
        ) {
            try {
                button.setPointerCapture(e.pointerId);
            } catch (_) {}
        }
    }

    function release(e) {
        if (e) e.preventDefault();

        if (action !== "jump") {
            controls[action] = false;
        }
    }

    button.addEventListener("pointerdown", press);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
    button.addEventListener("contextmenu", e => e.preventDefault());
}

setupHoldButton("leftBtn", "left");
setupHoldButton("rightBtn", "right");
setupHoldButton("jumpBtn", "jump");
setupHoldButton("fireBtn", "fire");

// ========================================
// 12. COLLISION
// ========================================

function overlaps(a, b) {
    return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    );
}

// ========================================
// 13. MOVEMENT & PLATFORM COLLISION
// ========================================

function moveAndCollide(entity, dt) {
    const oldBottom = entity.y + entity.h;

    entity.x += entity.vx * dt;

    entity.x = Math.max(
        0,
        Math.min(WORLD_END - entity.w, entity.x)
    );

    entity.y += entity.vy * dt;
    entity.onGround = false;

    for (const p of platforms) {
        const horizontalOverlap =
            entity.x + entity.w > p.x &&
            entity.x < p.x + p.w;

        const newBottom = entity.y + entity.h;

        if (
            horizontalOverlap &&
            entity.vy >= 0 &&
            oldBottom <= p.y + 2 &&
            newBottom >= p.y
        ) {
            entity.y = p.y - entity.h;
            entity.vy = 0;
            entity.onGround = true;
        }
    }

    // Safety recovery if entity falls off the world.
    if (entity.y + entity.h > H + 150) {
        if (entity === player) {
            damagePlayer(25);

            if (running) {
                entity.x = Math.max(20, entity.x - 100);
                entity.y = 402;
                entity.vy = 0;
            }
        } else {
            entity.y = 402;
            entity.vy = 0;
        }
    }
}

// ========================================
// 14. PLAYER SHOOTING
// ========================================

function shootPlayerBullet() {
    const direction = player.facing;

    bullets.push({
        x: player.x + (direction > 0 ? player.w : -12),
        y: player.y + 20,
        w: 12,
        h: 5,
        vx: direction * 620,
        alive: true
    });
}

function updatePlayer(dt) {
    const left =
        keys["arrowleft"] || keys["a"] || controls.left;

    const right =
        keys["arrowright"] || keys["d"] || controls.right;

    const fire =
        keys["f"] ||
        keys["x"] ||
        keys["enter"] ||
        controls.fire;

    player.vx = 0;

    if (left) {
        player.vx = -player.speed;
        player.facing = -1;
    }

    if (right) {
        player.vx = player.speed;
        player.facing = 1;
    }

    if (jumpRequested && player.onGround) {
        player.vy = -player.jumpPower;
        player.onGround = false;
    }

    jumpRequested = false;

    player.vy += 1450 * dt;
    player.fireCooldown -= dt;
    player.invincible = Math.max(0, player.invincible - dt);

    if (fire && player.fireCooldown <= 0) {
        shootPlayerBullet();
        player.fireCooldown = 0.22;
    }

    moveAndCollide(player, dt);
}

// ========================================
// 15. ENEMY SHOOTING
// ========================================

function shootEnemyBullet(enemy) {
    const direction = player.x < enemy.x ? -1 : 1;

    enemyBullets.push({
        x: enemy.x + enemy.w / 2,
        y: enemy.y + 22,
        w: 10,
        h: 5,
        vx: direction * 260,
        alive: true
    });
}

// ========================================
// 16. ENEMY AI
// ========================================

function updateEnemies(dt) {
    for (const enemy of enemies) {
        if (!enemy.alive) continue;

        const distance = player.x - enemy.x;

        enemy.facing = distance < 0 ? -1 : 1;

        enemy.vx = Math.abs(distance) > 65
            ? enemy.facing * enemy.speed
            : 0;

        enemy.vy += 1450 * dt;

        moveAndCollide(enemy, dt);

        if (!running) return;

        enemy.fireCooldown -= dt;

        if (
            Math.abs(distance) < 600 &&
            enemy.fireCooldown <= 0
        ) {
            shootEnemyBullet(enemy);

            enemy.fireCooldown =
                1.5 + Math.random() * 1.5;
        }

        if (overlaps(player, enemy)) {
            damagePlayer(10);

            if (!running) return;
        }
    }
}

// ========================================
// 17. ENEMY DEFEATED / KILL COUNTER
// ========================================

function defeatEnemy(enemy) {
    if (!running || !enemy || !enemy.alive) return;

    // Prevent counting the same enemy twice.
    enemy.alive = false;

    enemiesKilled++;
    score += 100;

    createParticles(
        enemy.x + enemy.w / 2,
        enemy.y + enemy.h / 2
    );

    // Update count before checking victory.
    updateHUD();

    if (enemiesKilled >= TARGET_KILLS) {
        enemiesKilled = TARGET_KILLS;
        updateHUD();
        endGame(true);
        return;
    }

    // Spawn replacement enemies throughout the level.
    let spawnX;

    if (player.x < WORLD_END - 500) {
        spawnX = Math.min(
            WORLD_END - 100,
            player.x + 450 + Math.random() * 250
        );
    } else {
        spawnX = Math.max(
            50,
            player.x - 450 - Math.random() * 250
        );
    }

    enemies.push(createEnemy(spawnX));
}

// ========================================
// 18. BULLET COLLISIONS
// ========================================

function updateBullets(dt) {
    for (const bullet of bullets) {
        if (!bullet.alive) continue;

        bullet.x += bullet.vx * dt;

        for (const enemy of enemies) {
            if (!enemy.alive) continue;

            if (overlaps(bullet, enemy)) {
                bullet.alive = false;
                enemy.health--;

                if (enemy.health <= 0) {
                    defeatEnemy(enemy);
                }

                if (!running) return;

                break;
            }
        }
    }

    for (const bullet of enemyBullets) {
        if (!bullet.alive) continue;

        bullet.x += bullet.vx * dt;

        if (
            player.invincible <= 0 &&
            overlaps(bullet, player)
        ) {
            bullet.alive = false;
            damagePlayer(10);

            if (!running) return;
        }
    }

    bullets = bullets.filter(
        b => b.alive &&
             b.x > cameraX - 100 &&
             b.x < cameraX + W + 100
    );

    enemyBullets = enemyBullets.filter(
        b => b.alive &&
             b.x > cameraX - 100 &&
             b.x < cameraX + W + 100
    );

    enemies = enemies.filter(enemy => enemy.alive);
}

// ========================================
// 19. PLAYER DAMAGE
// ========================================

function damagePlayer(amount) {
    if (!running || player.invincible > 0) return;

    player.health = Math.max(0, player.health - amount);
    player.invincible = 0.7;

    updateHUD();

    if (player.health <= 0) {
        endGame(false);
    }
}

// ========================================
// 20. PARTICLES
// ========================================

function createParticles(x, y) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 180,
            vy: (Math.random() - 0.5) * 180,
            life: 0.35 + Math.random() * 0.25
        });
    }
}

function updateParticles(dt) {
    for (const p of particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
    }

    particles = particles.filter(p => p.life > 0);
}

// ========================================
// 21. UPDATE GAME
// ========================================

function updateGame(dt) {
    updatePlayer(dt);

    if (!running) return;

    updateEnemies(dt);

    if (!running) return;

    updateBullets(dt);

    if (!running) return;

    updateParticles(dt);

    cameraX = Math.max(
        0,
        Math.min(WORLD_END - W, player.x - W * 0.35)
    );

    updateHUD();
}

// ========================================
// 22. BACKGROUND
// ========================================

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, H);

    gradient.addColorStop(0, "#101a35");
    gradient.addColorStop(1, "#b34b2b");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#263047";

    for (let i = 0; i < 18; i++) {
        const bx = i * 100 - (cameraX * 0.2) % 100;
        const bh = 70 + (i % 4) * 25;

        ctx.fillRect(bx, 330 - bh, 65, bh + 120);
        ctx.fillRect(bx + 12, 330 - bh - 12, 12, 12);
        ctx.fillRect(bx + 38, 330 - bh - 20, 10, 20);
    }

    ctx.fillStyle = "rgba(255, 100, 20, 0.12)";
    ctx.fillRect(0, 380, W, 70);
}

// ========================================
// 23. DRAW PLATFORMS
// ========================================

function drawPlatforms() {
    for (const p of platforms) {
        const sx = p.x - cameraX;

        if (sx + p.w < 0 || sx > W) continue;

        ctx.fillStyle = "#242b35";
        ctx.fillRect(sx, p.y, p.w, p.h);

        ctx.fillStyle = "#e17a36";
        ctx.fillRect(sx, p.y, p.w, 5);

        ctx.fillStyle = "#424b55";

        for (let x = sx; x < sx + p.w; x += 32) {
            ctx.fillRect(x, p.y + 15, 18, 4);
        }
    }
}

// ========================================
// 24. DRAW PLAYER & ENEMIES
// ========================================

function drawSoldier(entity, isPlayer) {
    const sx = entity.x - cameraX;
    const sy = entity.y;

    if (sx + entity.w < -40 || sx > W + 40) return;

    if (
        isPlayer &&
        entity.invincible > 0 &&
        Math.floor(performance.now() / 80) % 2 === 0
    ) {
        return;
    }

    ctx.save();
    ctx.translate(sx + entity.w / 2, 0);
    ctx.scale(entity.facing, 1);

    ctx.fillStyle = "#202936";
    ctx.fillRect(-10, sy + 32, 8, 16);
    ctx.fillRect(2, sy + 32, 8, 16);

    ctx.fillStyle = isPlayer ? "#43c8ff" : "#e74a4a";
    ctx.fillRect(-12, sy + 16, 24, 19);

    ctx.fillStyle = "#e9b68b";
    ctx.fillRect(-8, sy + 3, 16, 14);

    ctx.fillStyle = isPlayer ? "#e6edf4" : "#552929";
    ctx.fillRect(-10, sy, 20, 7);

    ctx.fillStyle = "#242424";
    ctx.fillRect(5, sy + 20, 18, 5);

    ctx.restore();
}

// ========================================
// 25. DRAW BULLETS & PARTICLES
// ========================================

function drawBullets() {
    ctx.fillStyle = "#ffe66d";

    for (const b of bullets) {
        ctx.fillRect(b.x - cameraX, b.y, b.w, b.h);
    }

    ctx.fillStyle = "#ff5555";

    for (const b of enemyBullets) {
        ctx.fillRect(b.x - cameraX, b.y, b.w, b.h);
    }

    for (const p of particles) {
        ctx.fillStyle = "#ffb347";
        ctx.fillRect(p.x - cameraX, p.y, 4, 4);
    }
}

// ========================================
// 26. DRAW GAME & KILL PROGRESS
// ========================================

function drawGame() {
    ctx.clearRect(0, 0, W, H);

    drawBackground();
    drawPlatforms();

    for (const enemy of enemies) {
        if (enemy.alive) {
            drawSoldier(enemy, false);
        }
    }

    if (player) {
        drawSoldier(player, true);
    }

    drawBullets();

    const barW = 220;
    const barH = 10;
    const progress = Math.min(
        1,
        enemiesKilled / TARGET_KILLS
    );

    ctx.fillStyle = "#171717";
    ctx.fillRect(20, 18, barW, barH);

    ctx.fillStyle = "#ffc247";
    ctx.fillRect(20, 18, barW * progress, barH);

    ctx.strokeStyle = "#ffffff";
    ctx.strokeRect(20, 18, barW, barH);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px Arial";
    ctx.fillText(
        "KILLS: " + enemiesKilled + " / " + TARGET_KILLS,
        20,
        46
    );
}

// ========================================
// 27. MAIN GAME LOOP
// ========================================

function gameLoop(timestamp) {
    frameId = null;

    if (!running || paused) return;

    const dt = Math.min(
        Math.max((timestamp - lastTime) / 1000, 0),
        0.033
    );

    lastTime = timestamp;

    updateGame(dt);
    drawGame();

    if (running && !paused) {
        frameId = requestAnimationFrame(gameLoop);
    }
}

// ========================================
// 28. INITIALIZE & CONNECT BUTTONS
// ========================================

function initializeGame() {
    player = createPlayer();
    createWorld();
    updateHUD();
    drawGame();

    if (overlay) {
        overlay.classList.remove("hidden");
    }

    if (overlayTitle) {
        overlayTitle.textContent = "2D SHOOTER";
    }

    if (overlayText) {
        overlayText.textContent =
            "Defeat 100 enemies to complete the mission!";
    }

    if (startBtn) {
        startBtn.textContent = "START MISSION";
        startBtn.addEventListener("click", startGame);
    } else {
        console.error('HTML mein id="startBtn" nahi mila.');
    }

    if (pauseBtn) {
        pauseBtn.textContent = "Pause";
        pauseBtn.addEventListener("click", togglePause);
    }
}

// ========================================
// 29. RUN INITIALIZATION
// ========================================

initializeGame();
