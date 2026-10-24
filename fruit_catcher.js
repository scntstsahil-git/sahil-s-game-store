
/* =========================
   Fruit Catcher 🍎
   Game Logic
========================= */

// Canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// HTML Elements
const scoreText = document.getElementById("score");
const bestText = document.getElementById("best");
const livesText = document.getElementById("lives");
const timerText = document.getElementById("timer");

const overlay = document.getElementById("overlay");
const overlayEmoji = document.getElementById("overlayEmoji");
const overlayTitle = document.getElementById("overlayTitle");
const overlayMessage = document.getElementById("overlayMessage");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");

// Game Settings
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GAME_TIME = 45;

const basket = {
  x: WIDTH / 2 - 45,
  y: HEIGHT - 75,
  width: 90,
  height: 55,
  speed: 380
};

// Game Variables
let score = 0;
let lives = 3;
let timeLeft = GAME_TIME;
let best = loadBest();

let objects = [];
let running = false;
let gameStarted = false;
let lastTime = 0;
let spawnTimer = 0;
let elapsedTime = 0;

// Movement Controls
const keys = {
  left: false,
  right: false
};

// Fruits and Bombs
const fruits = ["🍎", "🍊", "🍌", "🍇", "🍓", "🍉", "🍍", "🥝"];

// Load saved best score
function loadBest() {
  try {
    return Number(localStorage.getItem("fruitCatcherBest")) || 0;
  } catch (error) {
    return 0;
  }
}

// Save best score
function saveBest() {
  try {
    localStorage.setItem("fruitCatcherBest", best);
  } catch (error) {
    // Game still works if storage is unavailable.
  }
}

// Update score display
function updateStats() {
  scoreText.textContent = score;
  bestText.textContent = best;
  livesText.textContent = lives;
  timerText.textContent = timeLeft;
}

// Reset the game
function resetGame() {
  score = 0;
  lives = 3;
  timeLeft = GAME_TIME;

  objects = [];
  spawnTimer = 0;
  elapsedTime = 0;

  basket.x = WIDTH / 2 - basket.width / 2;

  keys.left = false;
  keys.right = false;

  updateStats();
  drawGame();
}

// Start the game
function startGame() {
  if (running) return;

  if (!gameStarted || timeLeft <= 0 || lives <= 0) {
    resetGame();
  }

  gameStarted = true;
  running = true;

  overlay.classList.add("hidden");

  lastTime = 0;
  requestAnimationFrame(gameLoop);
}

// Create a falling fruit or bomb
function createObject() {
  const isBomb = Math.random() < 0.16;

  const emoji = isBomb
    ? "💣"
    : fruits[Math.floor(Math.random() * fruits.length)];

  const speed = 150 + Math.random() * 100 + score * 0.25;

  objects.push({
    x: 30 + Math.random() * (WIDTH - 60),
    y: -35,
    size: 38,
    speed: Math.min(speed, 420),
    emoji: emoji,
    isBomb: isBomb
  });
}

// Move the basket
function moveBasket(deltaTime) {
  if (keys.left) {
    basket.x -= basket.speed * deltaTime;
  }

  if (keys.right) {
    basket.x += basket.speed * deltaTime;
  }

  // Keep the basket inside the canvas
  basket.x = Math.max(
    0,
    Math.min(WIDTH - basket.width, basket.x)
  );
}

// Check fruit and basket collision
function checkCollision(item) {
  const itemLeft = item.x - item.size / 2;
  const itemRight = item.x + item.size / 2;
  const itemTop = item.y - item.size / 2;
  const itemBottom = item.y + item.size / 2;

  const basketLeft = basket.x;
  const basketRight = basket.x + basket.width;

  // Catch fruits near the top of the basket
  const basketTop = basket.y + 12;
  const basketBottom = basket.y + basket.height;

  return (
    itemRight > basketLeft &&
    itemLeft < basketRight &&
    itemBottom > basketTop &&
    itemTop < basketBottom
  );
}

// Update falling objects
function updateObjects(deltaTime) {
  for (let i = objects.length - 1; i >= 0; i--) {
    const item = objects[i];

    item.y += item.speed * deltaTime;

    if (checkCollision(item)) {
      if (item.isBomb) {
        lives--;
      } else {
        score += 10;
      }

      objects.splice(i, 1);
      updateStats();

      if (score > best) {
        best = score;
        saveBest();
        bestText.textContent = best;
      }

      if (lives <= 0) {
        endGame(false);
        return;
      }

      continue;
    }

    // Remove objects that fall off screen
    if (item.y - item.size > HEIGHT) {
      objects.splice(i, 1);
    }
  }
}

// Draw the background
function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);

  sky.addColorStop(0, "#8DE5FF");
  sky.addColorStop(1, "#D9F8FF");

  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Sun
  ctx.beginPath();
  ctx.arc(710, 75, 38, 0, Math.PI * 2);
  ctx.fillStyle = "#FFE66D";
  ctx.fill();

  // Cartoon clouds
  drawCloud(100, 80);
  drawCloud(400, 120);
  drawCloud(600, 175);

  // Ground
  ctx.fillStyle = "#8DE39A";
  ctx.fillRect(0, HEIGHT - 24, WIDTH, 24);

  ctx.fillStyle = "#5CCB78";
  ctx.fillRect(0, HEIGHT - 24, WIDTH, 7);
}

// Draw a cloud
function drawCloud(x, y) {
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";

  ctx.beginPath();
  ctx.arc(x, y, 24, 0, Math.PI * 2);
  ctx.arc(x + 27, y - 12, 30, 0, Math.PI * 2);
  ctx.arc(x + 58, y, 23, 0, Math.PI * 2);
  ctx.fill();
}

// Draw the basket
function drawBasket() {
  const x = basket.x;
  const y = basket.y;
  const w = basket.width;
  const h = basket.height;

  // Basket body
  ctx.fillStyle = "#FF9F43";
  ctx.beginPath();
  ctx.moveTo(x + 8, y + 8);
  ctx.lineTo(x + w - 8, y + 8);
  ctx.lineTo(x + w - 20, y + h);
  ctx.lineTo(x + 20, y + h);
  ctx.closePath();
  ctx.fill();

  // Basket outline
  ctx.strokeStyle = "#D96C28";
  ctx.lineWidth = 5;
  ctx.lineJoin = "round";
  ctx.stroke();

  // Basket rim
  ctx.fillStyle = "#FFD166";
  ctx.fillRect(x, y, w, 15);

  ctx.strokeStyle = "#D96C28";
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, 15);

  // Basket weave
  ctx.strokeStyle = "#F27D32";
  ctx.lineWidth = 3;

  for (let i = 1; i <= 3; i++) {
    const lineY = y + 15 + i * 9;

    ctx.beginPath();
    ctx.moveTo(x + 15, lineY);
    ctx.lineTo(x + w - 15, lineY);
    ctx.stroke();
  }

  // Happy face
  ctx.fillStyle = "#5B351C";

  ctx.beginPath();
  ctx.arc(x + 37, y + 29, 3, 0, Math.PI * 2);
  ctx.arc(x + 53, y + 29, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#5B351C";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(x + 45, y + 31, 9, 0.2, Math.PI - 0.2);
  ctx.stroke();
}

// Draw fruits and bombs
function drawObjects() {
  objects.forEach(function (item) {
    ctx.font = item.size + "px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(item.emoji, item.x, item.y);
  });
}

// Draw everything
function drawGame() {
  drawBackground();
  drawObjects();
  drawBasket();
}

// Main game loop
function gameLoop(timestamp) {
  if (!running) return;

  if (!lastTime) {
    lastTime = timestamp;
  }

  // Prevent large movement jumps after interruptions
  const deltaTime = Math.min(
    (timestamp - lastTime) / 1000,
    0.04
  );

  lastTime = timestamp;

  elapsedTime += deltaTime;
  spawnTimer += deltaTime;

  // Countdown timer
  if (elapsedTime >= 1) {
    const seconds = Math.floor(elapsedTime);

    timeLeft -= seconds;
    elapsedTime -= seconds;

    if (timeLeft < 0) {
      timeLeft = 0;
    }

    updateStats();

    if (timeLeft <= 0) {
      endGame(true);
      return;
    }
  }

  // Spawn fruits faster as score increases
  const spawnDelay = Math.max(
    0.32,
    0.8 - score / 1500
  );

  if (spawnTimer >= spawnDelay) {
    createObject();
    spawnTimer = 0;
  }

  moveBasket(deltaTime);
  updateObjects(deltaTime);

  if (!running) return;

  drawGame();

  requestAnimationFrame(gameLoop);
}

// End the game
function endGame(timeFinished) {
  running = false;
  gameStarted = false;

  keys.left = false;
  keys.right = false;

  overlay.classList.remove("hidden");

  overlayEmoji.textContent = timeFinished ? "🏆" : "💥";
  overlayTitle.textContent = timeFinished
    ? "Time's Up!"
    : "Game Over!";

  overlayMessage.textContent =
    "Your score: " + score +
    ". Best score: " + best + ". Keep playing!";

  startBtn.textContent = "🔄 Play Again";

  drawGame();
}

// Keyboard controls
document.addEventListener("keydown", function (event) {
  const key = event.key.toLowerCase();

  if (
    key === "arrowleft" ||
    key === "arrowright" ||
    key === "a" ||
    key === "d"
  ) {
    event.preventDefault();
  }

  if (key === "arrowleft" || key === "a") {
    keys.left = true;
  }

  if (key === "arrowright" || key === "d") {
    keys.right = true;
  }
});

document.addEventListener("keyup", function (event) {
  const key = event.key.toLowerCase();

  if (key === "arrowleft" || key === "a") {
    keys.left = false;
  }

  if (key === "arrowright" || key === "d") {
    keys.right = false;
  }
});

// Mobile button controls
function holdButton(button, direction) {
  button.addEventListener("pointerdown", function (event) {
    event.preventDefault();
    keys[direction] = true;
  });

  button.addEventListener("pointerup", function () {
    keys[direction] = false;
  });

  button.addEventListener("pointerleave", function () {
    keys[direction] = false;
  });

  button.addEventListener("pointercancel", function () {
    keys[direction] = false;
  });
}

holdButton(leftBtn, "left");
holdButton(rightBtn, "right");

// Stop movement when the pointer is released elsewhere
document.addEventListener("pointerup", function () {
  keys.left = false;
  keys.right = false;
});

// Button events
startBtn.addEventListener("click", startGame);

restartBtn.addEventListener("click", function () {
  running = false;
  gameStarted = false;

  resetGame();

  overlay.classList.remove("hidden");
  overlayEmoji.textContent = "🍎";
  overlayTitle.textContent = "Ready to Play?";
  overlayMessage.textContent =
    "Catch the fruits and avoid the bombs!";

  startBtn.textContent = "▶ Start Game";
});

// Initial screen
bestText.textContent = best;
resetGame();


