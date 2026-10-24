
"use strict";

// =====================================
// 1. HTML ELEMENTS & CANVAS
// =====================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreText = document.getElementById("score");
const healthText = document.getElementById("health");
const bestText = document.getElementById("best");

const overlay = document.getElementById("overlay");
const overlayIcon = document.getElementById("overlayIcon");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const startBtn = document.getElementById("startBtn");

const W = canvas.width;
const H = canvas.height;

// =====================================
// 2. GAME VARIABLES
// =====================================

let running = false;
let score = 0;
let health = 3;
let best = loadBest();

let lastTime = 0;
let meteorTimer = 0;
let crystalTimer = 0;
let hitCooldown = 0;

const keys = new Set();

const player = {
  x: 90,
  y: H / 2,
  size: 22,
  speed: 250
};

let crystals = [];
let meteors = [];

// =====================================
// 3. HIGH SCORE
// =====================================

function loadBest() {
  try {
    return Number(localStorage.getItem("crystalDashBest")) || 0;
  } catch {
    return 0;
  }
}

function saveBest() {
  try {
    localStorage.setItem("crystalDashBest", best);
  } catch {
    // Game still works if storage is unavailable.
  }
}

// =====================================
// 4. UPDATE SCORE & HEALTH
// =====================================

function updateHUD() {
  scoreText.textContent = score;
  healthText.textContent = health;
  bestText.textContent = best;
}

// =====================================
// 5. START OR RESTART GAME
// =====================================

function startGame() {
  score = 0;
  health = 3;

  player.x = 90;
  player.y = H / 2;

  crystals = [];
  meteors = [];

  meteorTimer = 0.8;
  crystalTimer = 0.3;
  hitCooldown = 0;

  keys.clear();
  running = true;
  lastTime = 0;

  overlay.classList.add("hidden");
  updateHUD();
}

startBtn.addEventListener("click", startGame);

// =====================================
// 6. RANDOM NUMBER HELPER
// =====================================

function random(min, max) {
  return Math.random() * (max - min) + min;
}

// =====================================
// 7. CREATE CRYSTALS
// =====================================

function createCrystal() {
  crystals.push({
    x: random(W * 0.40, W - 35),
    y: random(35, H - 35),
    size: 12,
    pulse: random(0, Math.PI * 2)
  });
}

// =====================================
// 8. CREATE METEORS
// =====================================

function createMeteor() {
  const size = random(15, 26);

  meteors.push({
    x: W + size,
    y: random(30, H - 30),
    size: size,
    speed: random(130, 210) + score * 0.15,
    rotation: random(0, Math.PI * 2)
  });
}

// =====================================
// 9. KEYBOARD CONTROLS
// =====================================

function normalizeKey(key) {
  const k = key.toLowerCase();

  if (k === "arrowleft" || k === "a") {
    return "ArrowLeft";
  }

  if (k === "arrowright" || k === "d") {
    return "ArrowRight";
  }

  if (k === "arrowup" || k === "w") {
    return "ArrowUp";
  }

  if (k === "arrowdown" || k === "s") {
    return "ArrowDown";
  }

  return null;
}

window.addEventListener("keydown", (event) => {
  const key = normalizeKey(event.key);

  if (key) {
    event.preventDefault();
    keys.add(key);
  }

  if (
    event.code === "Space" &&
    !running
  ) {
    event.preventDefault();
    startGame();
  }
});

window.addEventListener("keyup", (event) => {
  const key = normalizeKey(event.key);

  if (key) keys.delete(key);
});

window.addEventListener("blur", () => {
  keys.clear();
  document.querySelectorAll(".control-btn")
    .forEach(button => button.classList.remove("pressed"));
});

// =====================================
// 10. MOBILE TOUCH CONTROLS
// =====================================

document.querySelectorAll(".control-btn").forEach(button => {
  const key = button.dataset.key;

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    keys.add(key);
    button.classList.add("pressed");

    try {
      button.setPointerCapture(event.pointerId);
    } catch {}
  });

  function releaseKey() {
    keys.delete(key);
    button.classList.remove("pressed");
  }

  button.addEventListener("pointerup", releaseKey);
  button.addEventListener("pointercancel", releaseKey);
  button.addEventListener("lostpointercapture", releaseKey);
});

// =====================================
// 11. PLAYER MOVEMENT
// =====================================

function movePlayer(dt) {
  let dx = 0;
  let dy = 0;

  if (keys.has("ArrowLeft")) dx--;
  if (keys.has("ArrowRight")) dx++;
  if (keys.has("ArrowUp")) dy--;
  if (keys.has("ArrowDown")) dy++;

  // Diagonal movement ko normal speed par rakho.
  if (dx !== 0 && dy !== 0) {
    dx *= Math.SQRT1_2;
    dy *= Math.SQRT1_2;
  }

  player.x += dx * player.speed * dt;
  player.y += dy * player.speed * dt;

  // Player ko canvas ke andar rakho.
  player.x = Math.max(
    player.size,
    Math.min(W - player.size, player.x)
  );

  player.y = Math.max(
    player.size,
    Math.min(H - player.size, player.y)
  );
}

// =====================================
// 12. COLLISION DETECTION
// =====================================

function isColliding(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance < a.size + b.size;
}

// =====================================
// 13. COLLECT CRYSTALS
// =====================================

function collectCrystals() {
  for (let i = crystals.length - 1; i >= 0; i--) {
    if (isColliding(player, crystals[i])) {
      crystals.splice(i, 1);

      score += 10;

      if (score > best) {
        best = score;
        saveBest();
      }

      updateHUD();
    }
  }
}

// =====================================
// 14. METEOR COLLISIONS
// =====================================

function checkMeteors(dt) {
  hitCooldown = Math.max(0, hitCooldown - dt);

  for (let i = meteors.length - 1; i >= 0; i--) {
    const meteor = meteors[i];

    meteor.x -= meteor.speed * dt;
    meteor.rotation += dt;

    // Screen se bahar gaya meteor hata do.
    if (meteor.x < -meteor.size - 10) {
      meteors.splice(i, 1);
      continue;
    }

    if (
      hitCooldown <= 0 &&
      isColliding(player, meteor)
    ) {
      meteors.splice(i, 1);
      health--;
      hitCooldown = 1;
      updateHUD();

      if (health <= 0) {
        endGame();
        return;
      }
    }
  }
}

// =====================================
// 15. UPDATE GAME WORLD
// =====================================

function updateGame(dt) {
  movePlayer(dt);

  meteorTimer -= dt;
  crystalTimer -= dt;

  if (meteorTimer <= 0) {
    createMeteor();

    // Score badhne par game thoda difficult hoga.
    meteorTimer = Math.max(
      0.38,
      random(0.8, 1.3) - score * 0.0008
    );
  }

  if (crystalTimer <= 0) {
    createCrystal();
    crystalTimer = random(0.65, 1.1);
  }

  for (const crystal of crystals) {
    crystal.pulse += dt * 4;
  }

  collectCrystals();
  checkMeteors(dt);
}

// =====================================
// 16. DRAW GALAXY BACKGROUND
// =====================================

const stars = Array.from({ length: 90 }, () => ({
  x: random(0, W),
  y: random(0, H),
  size: random(1, 2.5),
  speed: random(10, 35)
}));

function drawBackground(dt) {
  const gradient = ctx.createLinearGradient(0, 0, W, H);

  gradient.addColorStop(0, "#090d2a");
  gradient.addColorStop(0.5, "#171344");
  gradient.addColorStop(1, "#090d20");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  for (const star of stars) {
    if (running) {
      star.x -= star.speed * dt;

      if (star.x < 0) {
        star.x = W;
        star.y = random(0, H);
      }
    }

    ctx.fillStyle = "#c8d9ff";
    ctx.globalAlpha = 0.45 + Math.random() * 0.55;

    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

// =====================================
// 17. DRAW PLAYER
// =====================================

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);

  // Temporary glow during meteor protection.
  if (hitCooldown > 0) {
    ctx.globalAlpha =
      Math.floor(hitCooldown * 10) % 2 ? 0.45 : 1;
  }

  // Jetpack
  ctx.fillStyle = "#ff985f";
  ctx.fillRect(-19, -8, 8, 19);

  // Astronaut body
  ctx.fillStyle = "#f2f4ff";
  ctx.beginPath();
  ctx.roundRect(-13, -17, 26, 34, 9);
  ctx.fill();

  // Blue helmet
  ctx.fillStyle = "#55dfff";
  ctx.beginPath();
  ctx.arc(0, -5, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#182456";
  ctx.beginPath();
  ctx.ellipse(2, -5, 6, 7, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Suit details
  ctx.fillStyle = "#776aff";
  ctx.fillRect(-7, 9, 14, 4);

  ctx.restore();
  ctx.globalAlpha = 1;
}

// =====================================
// 18. DRAW CRYSTALS
// =====================================

function drawCrystals() {
  for (const crystal of crystals) {
    const glow = 0.6 + Math.sin(crystal.pulse) * 0.4;

    ctx.save();
    ctx.translate(crystal.x, crystal.y);

    ctx.shadowColor = "#44f6ff";
    ctx.shadowBlur = 10 + glow * 12;

    ctx.fillStyle = "#65f7ff";
    ctx.beginPath();
    ctx.moveTo(0, -crystal.size);
    ctx.lineTo(crystal.size * 0.75, 0);
    ctx.lineTo(0, crystal.size);
    ctx.lineTo(-crystal.size * 0.75, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

// =====================================
// 19. DRAW METEORS
// =====================================

function drawMeteors() {
  for (const meteor of meteors) {
    ctx.save();
    ctx.translate(meteor.x, meteor.y);
    ctx.rotate(meteor.rotation);

    // Meteor trail
    ctx.strokeStyle = "#ff855f";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-meteor.size * 1.8, 0);
    ctx.lineTo(-meteor.size * 0.4, 0);
    ctx.stroke();

    // Meteor body
    ctx.fillStyle = "#c56b52";
    ctx.beginPath();

    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      const radius = meteor.size *
        (i % 2 === 0 ? 1 : 0.78);

      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#75483e";
    ctx.beginPath();
    ctx.arc(3, -3, meteor.size * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// =====================================
// 20. DRAW EVERYTHING
// =====================================

function drawGame(dt) {
  drawBackground(dt);
  drawCrystals();
  drawMeteors();
  drawPlayer();
}

// =====================================
// 21. GAME OVER
// =====================================

function endGame() {
  running = false;
  keys.clear();

  overlayIcon.textContent = "🌌";
  overlayTitle.textContent = "Mission Over!";
  overlayText.textContent =
    `You collected ${score} points! Ready for another mission?`;

  startBtn.textContent = "🔄 Play Again";
  overlay.classList.remove("hidden");
}

// =====================================
// 22. MAIN GAME LOOP
// =====================================

function gameLoop(timestamp) {
  const dt = lastTime === 0
    ? 0
    : Math.min((timestamp - lastTime) / 1000, 0.033);

  lastTime = timestamp;

  if (running) {
    updateGame(dt);
  }

  drawGame(dt);

  requestAnimationFrame(gameLoop);
}

// =====================================
// 23. INITIALIZE GAME
// =====================================

updateHUD();
drawGame(0);
requestAnimationFrame(gameLoop);


