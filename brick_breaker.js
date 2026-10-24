
/* =========================
   BRICK BREAKER ARCADE
========================= */

// Canvas and HTML elements
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreText = document.getElementById("score");
const bestText = document.getElementById("bestScore");
const livesText = document.getElementById("lives");
const levelText = document.getElementById("level");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayMessage = document.getElementById("overlayMessage");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");

// Canvas dimensions
const W = canvas.width;
const H = canvas.height;

// Game state
let score = 0;
let lives = 3;
let level = 1;
let bestScore = loadBestScore();

let running = false;
let paused = false;
let gameEnded = false;
let lastTime = 0;
let serveDelay = 0;

// Controls
const keys = {
  left: false,
  right: false
};

// Paddle
const paddle = {
  x: W / 2 - 52,
  y: H - 42,
  width: 104,
  height: 13,
  speed: 7
};

// Ball
const ball = {
  x: W / 2,
  y: H - 65,
  radius: 8,
  dx: 3.2,
  dy: -4.2,
  speed: 5.3
};

// Bricks
let bricks = [];
let powerUps = [];

// Touch dragging
let dragging = false;

// Colours for brick rows
const brickColors = [
  "#ff5d73",
  "#ff9f43",
  "#ffe066",
  "#39d98a",
  "#38bdf8",
  "#a78bfa"
];

// Update scoreboard
bestText.textContent = bestScore;


// =========================
// Best Score Storage
// =========================

function loadBestScore() {
  try {
    return Number(localStorage.getItem("brickBreakerBest")) || 0;
  } catch (error) {
    return 0;
  }
}

function saveBestScore() {
  try {
    localStorage.setItem("brickBreakerBest", bestScore);
  } catch (error) {
    // Game can still run without storage.
  }
}


// =========================
// Update Scoreboard
// =========================

function updateScoreboard() {
  scoreText.textContent = score;
  bestText.textContent = bestScore;
  livesText.textContent = lives;
  levelText.textContent = level;
}

function addScore(points) {
  score += points;

  if (score > bestScore) {
    bestScore = score;
    saveBestScore();
  }

  updateScoreboard();
}


// =========================
// Create Bricks
// =========================

function createBricks() {
  bricks = [];

  const rows = Math.min(4 + level, 6);
  const cols = 7;

  const brickWidth = 56;
  const brickHeight = 20;
  const gap = 7;

  const totalWidth =
    cols * brickWidth + (cols - 1) * gap;

  const startX = (W - totalWidth) / 2;
  const startY = 75;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      bricks.push({
        x: startX + col * (brickWidth + gap),
        y: startY + row * (brickHeight + gap),
        width: brickWidth,
        height: brickHeight,
        color: brickColors[row % brickColors.length],
        alive: true
      });
    }
  }
}


// =========================
// Reset Ball and Paddle
// =========================

function resetBall() {
  paddle.width = 104;
  paddle.x = W / 2 - paddle.width / 2;

  ball.x = W / 2;
  ball.y = paddle.y - 18;

  ball.speed = Math.min(5.3 + (level - 1) * 0.35, 8);
  ball.dx = ball.speed * 0.6;
  ball.dy = -Math.sqrt(
    ball.speed * ball.speed - ball.dx * ball.dx
  );

  serveDelay = 45;
}


// =========================
// Start Game
// =========================

function startGame() {
  score = 0;
  lives = 3;
  level = 1;

  running = true;
  paused = false;
  gameEnded = false;

  powerUps = [];

  createBricks();
  resetBall();
  updateScoreboard();

  overlay.classList.add("hidden");
  pauseBtn.disabled = false;
  pauseBtn.textContent = "⏸ Pause";
}


// =========================
// Game Over / Win
// =========================

function showEndScreen(won) {
  running = false;
  paused = false;
  gameEnded = true;

  pauseBtn.disabled = true;

  overlayTitle.textContent = won
    ? "🏆 You Won!"
    : "💔 Game Over!";

  overlayMessage.textContent =
    "Final Score: " + score +
    " | Level: " + level;

  startBtn.textContent = "🔄 Play Again";
  overlay.classList.remove("hidden");
}

function loseLife() {
  lives--;
  updateScoreboard();

  if (lives <= 0) {
    showEndScreen(false);
    return;
  }

  // Give the player a moment before the next serve.
  resetBall();
}


// =========================
// Pause / Resume
// =========================

function togglePause() {
  if (!running || gameEnded) return;

  paused = !paused;

  pauseBtn.textContent = paused
    ? "▶ Resume"
    : "⏸ Pause";
}

startBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", togglePause);


// =========================
// Draw Background
// =========================

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, W, H);

  gradient.addColorStop(0, "#0b1530");
  gradient.addColorStop(1, "#111d3d");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  // Subtle decorative dots
  ctx.fillStyle = "#ffffff12";

  for (let x = 20; x < W; x += 40) {
    for (let y = 20; y < H; y += 40) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}


// =========================
// Draw Bricks
// =========================

function drawBricks() {
  for (const brick of bricks) {
    if (!brick.alive) continue;

    ctx.save();

    ctx.shadowColor = brick.color;
    ctx.shadowBlur = 8;

    ctx.fillStyle = brick.color;

    ctx.beginPath();
    ctx.roundRect(
      brick.x,
      brick.y,
      brick.width,
      brick.height,
      5
    );
    ctx.fill();

    // Highlight on top of each brick
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff55";

    ctx.fillRect(
      brick.x + 5,
      brick.y + 3,
      brick.width - 10,
      3
    );

    ctx.restore();
  }
}


// =========================
// Draw Paddle
// =========================

function drawPaddle() {
  const gradient = ctx.createLinearGradient(
    paddle.x,
    paddle.y,
    paddle.x + paddle.width,
    paddle.y
  );

  gradient.addColorStop(0, "#4de4ff");
  gradient.addColorStop(0.5, "#ffffff");
  gradient.addColorStop(1, "#7088ff");

  ctx.save();

  ctx.shadowColor = "#4de4ff";
  ctx.shadowBlur = 16;

  ctx.fillStyle = gradient;

  ctx.beginPath();
  ctx.roundRect(
    paddle.x,
    paddle.y,
    paddle.width,
    paddle.height,
    7
  );
  ctx.fill();

  ctx.restore();
}


// =========================
// Draw Ball
// =========================

function drawBall() {
  ctx.save();

  ctx.shadowColor = "#ffffff";
  ctx.shadowBlur = 18;

  const gradient = ctx.createRadialGradient(
    ball.x - 3,
    ball.y - 3,
    1,
    ball.x,
    ball.y,
    ball.radius
  );

  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(1, "#6fe8ff");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}


// =========================
// Power-up Drawing
// =========================

function drawPowerUps() {
  for (const item of powerUps) {
    ctx.save();

    ctx.shadowColor = "#ffe16a";
    ctx.shadowBlur = 12;

    ctx.fillStyle = "#ffe16a";
    ctx.beginPath();
    ctx.arc(item.x, item.y, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#30244b";
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("+", item.x, item.y);

    ctx.restore();
  }
}


// =========================
// Paddle Movement
// =========================

function movePaddle(dt) {
  if (keys.left) {
    paddle.x -= paddle.speed * dt;
  }

  if (keys.right) {
    paddle.x += paddle.speed * dt;
  }

  // Keep paddle inside the canvas
  paddle.x = Math.max(
    0,
    Math.min(W - paddle.width, paddle.x)
  );
}


// =========================
// Ball and Wall Collision
// =========================

function checkWallCollision() {
  if (ball.x - ball.radius <= 0) {
    ball.x = ball.radius;
    ball.dx = Math.abs(ball.dx);
  }

  if (ball.x + ball.radius >= W) {
    ball.x = W - ball.radius;
    ball.dx = -Math.abs(ball.dx);
  }

  if (ball.y - ball.radius <= 0) {
    ball.y = ball.radius;
    ball.dy = Math.abs(ball.dy);
  }
}


// =========================
// Paddle Collision
// =========================

function checkPaddleCollision() {
  const touchingPaddle =
    ball.dy > 0 &&
    ball.y + ball.radius >= paddle.y &&
    ball.y - ball.radius <= paddle.y + paddle.height &&
    ball.x + ball.radius >= paddle.x &&
    ball.x - ball.radius <= paddle.x + paddle.width;

  if (!touchingPaddle) return;

  ball.y = paddle.y - ball.radius;

  // Bounce angle depends on where the ball hits.
  const hitPosition =
    (ball.x - (paddle.x + paddle.width / 2)) /
    (paddle.width / 2);

  const angle = hitPosition * (Math.PI / 3);

  ball.dx = ball.speed * Math.sin(angle);
  ball.dy = -Math.abs(ball.speed * Math.cos(angle));
}


// =========================
// Brick Collision
// =========================

function checkBrickCollision() {
  for (const brick of bricks) {
    if (!brick.alive) continue;

    const hit =
      ball.x + ball.radius > brick.x &&
      ball.x - ball.radius < brick.x + brick.width &&
      ball.y + ball.radius > brick.y &&
      ball.y - ball.radius < brick.y + brick.height;

    if (!hit) continue;

    brick.alive = false;
    addScore(10);

    // Determine the side of collision.
    const previousX = ball.x - ball.dx;
    const previousY = ball.y - ball.dy;

    const cameFromSide =
      previousX + ball.radius <= brick.x ||
      previousX - ball.radius >= brick.x + brick.width;

    if (cameFromSide) {
      ball.dx *= -1;
    } else {
      ball.dy *= -1;
    }

    // Some bricks release a paddle power-up.
    if (Math.random() < 0.13) {
      powerUps.push({
        x: brick.x + brick.width / 2,
        y: brick.y + brick.height / 2,
        speed: 2
      });
    }

    // Only one brick is hit per frame.
    break;
  }
}


// =========================
// Update Power-ups
// =========================

function updatePowerUps(dt) {
  for (let i = powerUps.length - 1; i >= 0; i--) {
    const item = powerUps[i];

    item.y += item.speed * dt;

    const caught =
      item.y + 10 >= paddle.y &&
      item.y - 10 <= paddle.y + paddle.height &&
      item.x >= paddle.x &&
      item.x <= paddle.x + paddle.width;

    if (caught) {
      paddle.width = 145;

      // Keep the wider paddle inside the canvas.
      paddle.x = Math.min(
        paddle.x,
        W - paddle.width
      );

      addScore(25);
      powerUps.splice(i, 1);
      continue;
    }

    if (item.y > H + 20) {
      powerUps.splice(i, 1);
    }
  }
}


// =========================
// Level Progression
// =========================

function checkLevelComplete() {
  const remaining = bricks.some(brick => brick.alive);

  if (remaining) return;

  level++;

  if (level > 5) {
    showEndScreen(true);
    return;
  }

  createBricks();
  powerUps = [];
  resetBall();
  updateScoreboard();
}


// =========================
// Update Game
// =========================

function updateGame(dt) {
  if (!running || paused) return;

  movePaddle(dt);

  // Wait briefly after a life is lost.
  if (serveDelay > 0) {
    serveDelay -= dt;
    ball.x = paddle.x + paddle.width / 2;
    ball.y = paddle.y - 18;
    return;
  }

  // Move ball
  ball.x += ball.dx * dt;
  ball.y += ball.dy * dt;

  checkWallCollision();
  checkPaddleCollision();
  checkBrickCollision();
  updatePowerUps(dt);

  // Ball falls below the paddle
  if (ball.y - ball.radius > H) {
    loseLife();
    return;
  }

  checkLevelComplete();
}


// =========================
// Draw Everything
// =========================

function drawGame() {
  drawBackground();
  drawBricks();
  drawPowerUps();
  drawPaddle();
  drawBall();

  if (paused && running) {
    ctx.fillStyle = "#071020bb";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 30px Arial";
    ctx.fillText("PAUSED", W / 2, H / 2);
  }
}


// =========================
// Keyboard Controls
// =========================

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

  if (
    (key === "p" || key === "escape") &&
    running
  ) {
    togglePause();
  }

  if (
    (key === "enter" || key === " ") &&
    !running &&
    !gameEnded
  ) {
    startGame();
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
});


// =========================
// Mobile Arrow Buttons
// =========================

function setupControl(button, direction) {
  button.addEventListener("pointerdown", event => {
    event.preventDefault();

    if (paused || !running) return;

    keys[direction] = true;

    // Allow holding a button to keep moving.
    if (button.setPointerCapture) {
      button.setPointerCapture(event.pointerId);
    }
  });

  function stopMoving() {
    keys[direction] = false;
  }

  button.addEventListener("pointerup", stopMoving);
  button.addEventListener("pointercancel", stopMoving);
  button.addEventListener("lostpointercapture", stopMoving);
  button.addEventListener("pointerleave", stopMoving);
}

setupControl(leftBtn, "left");
setupControl(rightBtn, "right");


// =========================
// Drag Paddle on Canvas
// =========================

function movePaddleToPointer(event) {
  const rect = canvas.getBoundingClientRect();

  const scaleX = W / rect.width;
  const pointerX = (event.clientX - rect.left) * scaleX;

  paddle.x = pointerX - paddle.width / 2;

  paddle.x = Math.max(
    0,
    Math.min(W - paddle.width, paddle.x)
  );
}

canvas.addEventListener("pointerdown", event => {
  if (!running || paused) return;

  dragging = true;
  movePaddleToPointer(event);

  if (canvas.setPointerCapture) {
    canvas.setPointerCapture(event.pointerId);
  }
});

canvas.addEventListener("pointermove", event => {
  if (!dragging || paused) return;

  movePaddleToPointer(event);
});

function stopDragging() {
  dragging = false;
}

canvas.addEventListener("pointerup", stopDragging);
canvas.addEventListener("pointercancel", stopDragging);


// =========================
// Main Animation Loop
// =========================

function gameLoop(timestamp) {
  const dt = lastTime
    ? Math.min((timestamp - lastTime) / 16.67, 2)
    : 1;

  lastTime = timestamp;

  updateGame(dt);
  drawGame();

  requestAnimationFrame(gameLoop);
}


// =========================
// Initial Screen
// =========================

createBricks();
resetBall();
updateScoreboard();
drawGame();

requestAnimationFrame(gameLoop);


