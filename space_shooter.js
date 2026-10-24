
/* =========================
   SPACE SHOOTER ARCADE
========================= */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreText = document.getElementById("score");
const bestText = document.getElementById("bestScore");
const livesText = document.getElementById("lives");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayMessage = document.getElementById("overlayMessage");
const startBtn = document.getElementById("startBtn");

const pauseBtn = document.getElementById("pauseBtn");
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const fireBtn = document.getElementById("fireBtn");

const W = canvas.width;
const H = canvas.height;

let score = 0;
let lives = 3;
let bestScore = 0;
let running = false;
let paused = false;
let lastTime = 0;
let enemyTimer = 0;
let shootTimer = 0;
let animationId = null;

try {
  bestScore =
    Number(localStorage.getItem("spaceShooterBest")) || 0;
} catch (error) {
  bestScore = 0;
}

const keys = {
  left: false,
  right: false,
  fire: false
};

const ship = {
  x: W / 2 - 20,
  y: H - 85,
  width: 40,
  height: 42,
  speed: 5
};

let bullets = [];
let enemies = [];
let stars = [];

// Create background stars
function createStars() {
  stars = [];

  for (let i = 0; i < 65; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 2 + 0.5
    });
  }
}

// Scoreboard
function updateStats() {
  scoreText.textContent = score;
  bestText.textContent = bestScore;
  livesText.textContent = lives;
}

// Start / restart
function startGame() {
  score = 0;
  lives = 3;
  bullets = [];
  enemies = [];

  ship.x = W / 2 - ship.width / 2;

  enemyTimer = 0;
  shootTimer = 0;
  lastTime = 0;
  paused = false;
  running = true;

  keys.left = false;
  keys.right = false;
  keys.fire = false;

  createStars();
  updateStats();

  overlay.classList.add("hidden");

  startBtn.textContent = "Play Again";
  pauseBtn.disabled = false;
  pauseBtn.textContent = "⏸ Pause";

  if (animationId !== null) {
    cancelAnimationFrame(animationId);
  }

  animationId = requestAnimationFrame(gameLoop);
}

// Game over
function gameOver() {
  running = false;
  paused = false;
  animationId = null;

  keys.left = false;
  keys.right = false;
  keys.fire = false;

  pauseBtn.disabled = true;

  overlayTitle.textContent = "🚀 Mission Over!";
  overlayMessage.textContent = "Your Score: " + score;
  startBtn.textContent = "🔄 Play Again";

  overlay.classList.remove("hidden");
}

// Pause / resume
function togglePause() {
  if (!running) return;

  paused = !paused;

  pauseBtn.textContent = paused
    ? "▶ Resume"
    : "⏸ Pause";

  if (!paused) {
    lastTime = 0;
    animationId = requestAnimationFrame(gameLoop);
  } else {
    keys.left = false;
    keys.right = false;
    keys.fire = false;

    drawGame();

    ctx.fillStyle = "#071020cc";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", W / 2, H / 2);
  }
}

// Background
function drawBackground(dt = 0) {
  ctx.fillStyle = "#050b20";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#ffffff";

  for (const star of stars) {
    star.y += star.speed * dt;

    if (star.y > H) {
      star.y = 0;
      star.x = Math.random() * W;
    }

    ctx.globalAlpha = 0.5 + star.size / 4;
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }

  ctx.globalAlpha = 1;
}

// Spaceship
function drawShip() {
  ctx.save();
  ctx.translate(ship.x, ship.y);

  ctx.fillStyle = "#ff8c42";
  ctx.beginPath();
  ctx.moveTo(12, 34);
  ctx.lineTo(20, 48 + Math.random() * 7);
  ctx.lineTo(28, 34);
  ctx.fill();

  ctx.fillStyle = "#48e5ff";
  ctx.beginPath();
  ctx.moveTo(20, 0);
  ctx.lineTo(40, 38);
  ctx.lineTo(25, 32);
  ctx.lineTo(20, 38);
  ctx.lineTo(15, 32);
  ctx.lineTo(0, 38);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(20, 23, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Bullets
function drawBullets() {
  ctx.fillStyle = "#ffe66d";
  ctx.shadowColor = "#ffe66d";
  ctx.shadowBlur = 10;

  for (const bullet of bullets) {
    ctx.fillRect(bullet.x, bullet.y, 4, 14);
  }

  ctx.shadowBlur = 0;
}

// Enemies
function drawEnemies() {
  for (const enemy of enemies) {
    ctx.fillStyle = "#ff4d6d";
    ctx.shadowColor = "#ff4d6d";
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.moveTo(enemy.x + 20, enemy.y + 32);
    ctx.lineTo(enemy.x, enemy.y + 8);
    ctx.lineTo(enemy.x + 10, enemy.y);
    ctx.lineTo(enemy.x + 30, enemy.y);
    ctx.lineTo(enemy.x + 40, enemy.y + 8);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(enemy.x + 9, enemy.y + 10, 6, 5);
    ctx.fillRect(enemy.x + 25, enemy.y + 10, 6, 5);
  }
}

// Fire weapon
function shoot() {
  bullets.push({
    x: ship.x + ship.width / 2 - 2,
    y: ship.y,
    speed: 8
  });
}

// Spawn enemy
function spawnEnemy() {
  enemies.push({
    x: Math.random() * (W - 40),
    y: -40,
    width: 40,
    height: 32,
    speed: 2 + Math.random() * 1.5
  });
}

// Collision helper
function isColliding(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// Update game
function updateGame(dt) {
  if (!running || paused) return;

  if (keys.left) ship.x -= ship.speed * dt;
  if (keys.right) ship.x += ship.speed * dt;

  ship.x = Math.max(
    0,
    Math.min(W - ship.width, ship.x)
  );

  shootTimer -= dt;

  if (keys.fire && shootTimer <= 0) {
    shoot();
    shootTimer = 12;
  }

  for (const bullet of bullets) {
    bullet.y -= bullet.speed * dt;
  }

  bullets = bullets.filter(bullet => bullet.y > -20);

  enemyTimer += dt;

  if (enemyTimer >= 45) {
    spawnEnemy();
    enemyTimer = 0;
  }

  for (const enemy of enemies) {
    enemy.y += enemy.speed * dt;
  }

  // Bullet-enemy collision
  for (const enemy of enemies) {
    if (enemy.dead) continue;

    for (const bullet of bullets) {
      if (bullet.dead) continue;

      if (isColliding({
        x: bullet.x,
        y: bullet.y,
        width: 4,
        height: 14
      }, enemy)) {
        enemy.dead = true;
        bullet.dead = true;

        score += 10;

        if (score > bestScore) {
          bestScore = score;

          try {
            localStorage.setItem(
              "spaceShooterBest",
              bestScore
            );
          } catch (error) {}
        }

        updateStats();
        break;
      }
    }
  }

  bullets = bullets.filter(bullet => !bullet.dead);

  // Enemy collision with ship / bottom edge
  for (const enemy of enemies) {
    if (enemy.dead) continue;

    if (isColliding(ship, enemy) || enemy.y > H) {
      enemy.dead = true;
      lives--;
      updateStats();
    }
  }

  enemies = enemies.filter(enemy => !enemy.dead);

  if (lives <= 0) {
    gameOver();
  }
}

// Draw all
function drawGame(dt = 0) {
  drawBackground(dt);
  drawBullets();
  drawEnemies();
  drawShip();
}

// Animation loop
function gameLoop(timestamp) {
  if (!running || paused) {
    animationId = null;
    return;
  }

  const dt = lastTime
    ? Math.min((timestamp - lastTime) / 16.67, 2)
    : 1;

  lastTime = timestamp;

  updateGame(dt);

  if (running && !paused) {
    drawGame(dt);
    animationId = requestAnimationFrame(gameLoop);
  } else {
    animationId = null;
  }
}

// Button events
startBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", togglePause);

// Keyboard
document.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();

  if (["arrowleft", "arrowright", " "].includes(key)) {
    event.preventDefault();
  }

  if (key === "arrowleft" || key === "a") {
    keys.left = true;
  }

  if (key === "arrowright" || key === "d") {
    keys.right = true;
  }

  if (key === " ") {
    keys.fire = true;

    if (!running) startGame();
  }

  if (key === "p" || key === "escape") {
    togglePause();
  }
});

document.addEventListener("keyup", event => {
  const key = event.key.toLowerCase();

  if (key === "arrowleft" || key === "a") {
    keys.left = false;
  }

  if (key === "arrowright" || key === "d") {
    keys.right = false;
  }

  if (key === " ") {
    keys.fire = false;
  }
});

// Mobile hold buttons
function setupHoldButton(button, direction) {
  button.addEventListener("pointerdown", event => {
    event.preventDefault();

    if (!running || paused) return;

    keys[direction] = true;

    if (button.setPointerCapture) {
      button.setPointerCapture(event.pointerId);
    }
  });

  const release = () => {
    keys[direction] = false;
  };

  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
  button.addEventListener("pointerleave", release);
}

setupHoldButton(leftBtn, "left");
setupHoldButton(rightBtn, "right");
setupHoldButton(fireBtn, "fire");

// Initial screen
createStars();
updateStats();
drawGame();

pauseBtn.disabled = true;
