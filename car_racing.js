
/* =========================
   CAR RACING GAME
========================= */

// Canvas and HTML elements
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreText = document.getElementById("score");
const coinsText = document.getElementById("coins");
const bestText = document.getElementById("best");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayMessage = document.getElementById("overlayMessage");
const startBtn = document.getElementById("startBtn");

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");

// Road settings
const roadLeft = 45;
const roadRight = 375;

const laneCenters = [100, 210, 320];

// Player car
const player = {
  x: laneCenters[1],
  y: 525,
  width: 42,
  height: 76,
  lane: 1
};

// Game variables
let traffic = [];
let coins = [];

let score = 0;
let coinCount = 0;
let bestScore = loadBestScore();

let speed = 4;
let roadOffset = 0;

let trafficTimer = 0;
let coinTimer = 0;

let running = false;
let lastTime = 0;

// Keyboard and touch controls
const keys = {
  left: false,
  right: false
};

bestText.textContent = bestScore;


// =========================
// Save and Load Best Score
// =========================

function loadBestScore() {
  try {
    return Number(localStorage.getItem("carRacingBest")) || 0;
  } catch (error) {
    return 0;
  }
}

function saveBestScore() {
  try {
    localStorage.setItem("carRacingBest", bestScore);
  } catch (error) {
    // Game still works if storage is unavailable.
  }
}


// =========================
// Draw Road
// =========================

function drawRoad() {
  // Grass
  ctx.fillStyle = "#236b38";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Road
  ctx.fillStyle = "#343a40";
  ctx.fillRect(
    roadLeft,
    0,
    roadRight - roadLeft,
    canvas.height
  );

  // Road side borders
  ctx.fillStyle = "#f5f5f5";
  ctx.fillRect(roadLeft, 0, 5, canvas.height);
  ctx.fillRect(roadRight - 5, 0, 5, canvas.height);

  // Red and white roadside markers
  const markerHeight = 35;

  for (let y = -markerHeight; y < canvas.height; y += 70) {
    const markerY = (y + roadOffset * 2) % 70;

    ctx.fillStyle = "#ff4545";
    ctx.fillRect(24, markerY, 13, 24);
    ctx.fillRect(383, markerY, 13, 24);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(24, markerY + 24, 13, 12);
    ctx.fillRect(383, markerY + 24, 13, 12);
  }

  // Lane divider markings
  ctx.fillStyle = "#e9e9e9";

  for (const lineX of [155, 265]) {
    for (let y = -60; y < canvas.height; y += 100) {
      const lineY = (y + roadOffset) % 100;

      ctx.fillRect(lineX - 2, lineY, 4, 48);
    }
  }

  // Speed strips at the top are intentionally avoided
  // so the road stays visually clean.
}


// =========================
// Draw a Car
// =========================

function drawCar(x, y, color, isPlayer = false) {
  const w = 42;
  const h = 76;

  ctx.save();
  ctx.translate(x, y);

  // Wheels
  ctx.fillStyle = "#101317";
  ctx.fillRect(-w / 2 - 3, 12, 7, 19);
  ctx.fillRect(w / 2 - 4, 12, 7, 19);
  ctx.fillRect(-w / 2 - 3, 49, 7, 19);
  ctx.fillRect(w / 2 - 4, 49, 7, 19);

  // Main body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-w / 2, 0, w, h, 9);
  ctx.fill();

  // Front and rear bumpers
  ctx.fillStyle = "#cbd5df";
  ctx.fillRect(-14, 3, 28, 4);
  ctx.fillRect(-14, h - 7, 28, 4);

  // Windows
  ctx.fillStyle = "#bde9ff";

  ctx.beginPath();
  ctx.roundRect(-14, 13, 28, 18, 4);
  ctx.fill();

  ctx.beginPath();
  ctx.roundRect(-14, 43, 28, 14, 4);
  ctx.fill();

  // Window divider
  ctx.fillStyle = "#263746";
  ctx.fillRect(-14, 34, 28, 4);

  // Headlights and tail lights
  if (isPlayer) {
    ctx.fillStyle = "#fff7a8";
    ctx.fillRect(-15, 2, 9, 5);
    ctx.fillRect(6, 2, 9, 5);
  } else {
    ctx.fillStyle = "#ff3030";
    ctx.fillRect(-15, h - 5, 9, 4);
    ctx.fillRect(6, h - 5, 9, 4);
  }

  ctx.restore();
}


// =========================
// Draw Coin
// =========================

function drawCoin(coin) {
  ctx.save();

  // Coin glow
  ctx.shadowColor = "#ffdf38";
  ctx.shadowBlur = 12;

  ctx.beginPath();
  ctx.arc(coin.x, coin.y, 13, 0, Math.PI * 2);
  ctx.fillStyle = "#ffc928";
  ctx.fill();

  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.arc(coin.x, coin.y, 8, 0, Math.PI * 2);
  ctx.strokeStyle = "#fff4a3";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#7c4a00";
  ctx.font = "bold 12px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("$", coin.x, coin.y + 1);

  ctx.restore();
}


// =========================
// Spawn Traffic
// =========================

function spawnTraffic() {
  let lane = Math.floor(Math.random() * laneCenters.length);

  // Try to avoid spawning directly beside
  // another car at almost the same height.
  const blocked = traffic.some(car =>
    car.lane === lane && car.y < 145
  );

  if (blocked) return;

  const colors = [
    "#ff4545",
    "#38a4ff",
    "#d46bff",
    "#ff9d2e",
    "#e8edf3"
  ];

  traffic.push({
    x: laneCenters[lane],
    y: -90,
    width: 42,
    height: 76,
    lane: lane,
    color: colors[
      Math.floor(Math.random() * colors.length)
    ]
  });
}


// =========================
// Spawn Coins
// =========================

function spawnCoin() {
  const lane = Math.floor(Math.random() * laneCenters.length);

  coins.push({
    x: laneCenters[lane],
    y: -25,
    radius: 13
  });
}


// =========================
// Collision Detection
// =========================

function isColliding(a, b) {
  return (
    a.x - a.width / 2 < b.x + b.width / 2 &&
    a.x + a.width / 2 > b.x - b.width / 2 &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function collectCoin(coin) {
  const dx = player.x - coin.x;
  const dy = player.y + player.height / 2 - coin.y;

  return Math.sqrt(dx * dx + dy * dy) < 35;
}


// =========================
// Move Player
// =========================

function movePlayer() {
  if (keys.left) {
    player.lane = Math.max(0, player.lane - 1);
    keys.left = false;
  }

  if (keys.right) {
    player.lane = Math.min(
      laneCenters.length - 1,
      player.lane + 1
    );
    keys.right = false;
  }

  // Smooth movement between lanes
  const targetX = laneCenters[player.lane];
  player.x += (targetX - player.x) * 0.24;
}


// =========================
// Update Game
// =========================

function updateGame(dt) {
  if (!running) return;

  // Speed gradually increases
  speed = Math.min(10, 4 + score / 250);

  // Scroll the road
  roadOffset = (roadOffset + speed * dt) % 100;

  // Score increases with distance
  score += speed * dt * 0.025;
  scoreText.textContent = Math.floor(score);

  movePlayer();

  // Traffic spawning
  trafficTimer += dt;

  const trafficInterval = Math.max(
    38,
    78 - speed * 3
  );

  if (trafficTimer >= trafficInterval) {
    spawnTraffic();
    trafficTimer = 0;
  }

  // Coin spawning
  coinTimer += dt;

  if (coinTimer >= 90) {
    spawnCoin();
    coinTimer = 0;
  }

  // Move traffic
  for (let i = traffic.length - 1; i >= 0; i--) {
    const car = traffic[i];

    car.y += speed * dt;

    if (isColliding(player, car)) {
      endGame();
      return;
    }

    if (car.y > canvas.height + 100) {
      traffic.splice(i, 1);
    }
  }

  // Move and collect coins
  for (let i = coins.length - 1; i >= 0; i--) {
    const coin = coins[i];

    coin.y += speed * dt;

    if (collectCoin(coin)) {
      coinCount++;
      score += 25;

      coinsText.textContent = coinCount;
      scoreText.textContent = Math.floor(score);

      coins.splice(i, 1);
      continue;
    }

    if (coin.y > canvas.height + 30) {
      coins.splice(i, 1);
    }
  }

  // Update best score while playing
  const currentScore = Math.floor(score);

  if (currentScore > bestScore) {
    bestScore = currentScore;
    bestText.textContent = bestScore;
    saveBestScore();
  }
}


// =========================
// Draw Game
// =========================

function drawGame() {
  drawRoad();

  // Coins behind cars
  for (const coin of coins) {
    drawCoin(coin);
  }

  // Traffic
  for (const car of traffic) {
    drawCar(car.x, car.y, car.color);
  }

  // Player car
  drawCar(player.x, player.y, "#20d6a1", true);

  // Speed display
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "left";
  ctx.fillText(
    "SPEED: " + Math.round(speed * 20) + " km/h",
    12,
    25
  );
}


// =========================
// Game Over
// =========================

function endGame() {
  running = false;

  const finalScore = Math.floor(score);

  overlayTitle.textContent = "💥 Game Over!";
  overlayMessage.textContent =
    "Score: " + finalScore +
    " | Coins: " + coinCount;

  startBtn.textContent = "🔄 Play Again";
  overlay.classList.remove("hidden");
}


// =========================
// Start / Restart Game
// =========================

function startGame() {
  score = 0;
  coinCount = 0;
  speed = 4;
  roadOffset = 0;

  trafficTimer = 0;
  coinTimer = 0;

  traffic = [];
  coins = [];

  player.lane = 1;
  player.x = laneCenters[1];

  keys.left = false;
  keys.right = false;

  scoreText.textContent = "0";
  coinsText.textContent = "0";
  bestText.textContent = bestScore;

  overlay.classList.add("hidden");

  running = true;
}

startBtn.addEventListener("click", startGame);


// =========================
// Keyboard Controls
// =========================

document.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();

  if (
    ["arrowleft", "arrowright", " "].includes(key)
  ) {
    event.preventDefault();
  }

  if (!running) {
    if (key === "enter" || key === " ") {
      startGame();
    }
    return;
  }

  if (
    key === "arrowleft" ||
    key === "a"
  ) {
    if (!event.repeat) keys.left = true;
  }

  if (
    key === "arrowright" ||
    key === "d"
  ) {
    if (!event.repeat) keys.right = true;
  }
});


// =========================
// Mobile Touch Controls
// =========================

function setupTouchButton(button, direction) {
  button.addEventListener("pointerdown", event => {
    event.preventDefault();

    if (!running) return;

    if (direction === "left") {
      keys.left = true;
    } else {
      keys.right = true;
    }
  });

  // Avoid unwanted movement after the touch ends
  button.addEventListener("pointerup", () => {
    keys.left = false;
    keys.right = false;
  });

  button.addEventListener("pointercancel", () => {
    keys.left = false;
    keys.right = false;
  });

  button.addEventListener("pointerleave", () => {
    keys.left = false;
    keys.right = false;
  });
}

setupTouchButton(leftBtn, "left");
setupTouchButton(rightBtn, "right");


// =========================
// Main Game Loop
// =========================

function gameLoop(timestamp) {
  const delta = lastTime
    ? Math.min((timestamp - lastTime) / 16.67, 2)
    : 1;

  lastTime = timestamp;

  updateGame(delta);
  drawGame();

  requestAnimationFrame(gameLoop);
}

// Initial screen
drawGame();
requestAnimationFrame(gameLoop);


