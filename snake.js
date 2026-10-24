
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

const scoreText = document.getElementById("score");
const bestText = document.getElementById("best");
const overlay = document.getElementById("overlay");
const titleText = document.getElementById("overlay-title");
const messageText = document.getElementById("overlay-text");
const emojiText = document.getElementById("overlay-emoji");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const restartBtn = document.getElementById("restart-btn");

const CELL = 20;
const CELLS = canvas.width / CELL;
const SPEED = 300;

let snake = [];
let fruit = {};
let score = 0;
let best = loadBest();
let direction = "right";
let nextDirection = "right";

let running = false;
let paused = false;
let gameLoop = null;

// Load saved best score safely
function loadBest() {
  try {
    return Number(localStorage.getItem("snakeManiaBest")) || 0;
  } catch {
    return 0;
  }
}

// Save best score
function saveBest() {
  try {
    localStorage.setItem("snakeManiaBest", best);
  } catch {
    // The game still works without storage.
  }
}

bestText.textContent = best;

// Draw the game board
function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Checkerboard background
  for (let y = 0; y < CELLS; y++) {
    for (let x = 0; x < CELLS; x++) {
      ctx.fillStyle = (x + y) % 2 === 0
        ? "#dcf9df"
        : "#d2f2d8";

      ctx.fillRect(
        x * CELL, y * CELL, CELL, CELL
      );
    }
  }

  drawFruit();
  drawSnake();
}

// Draw the fruit
function drawFruit() {
  ctx.font = "18px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(
    fruit.emoji,
    fruit.x * CELL + CELL / 2,
    fruit.y * CELL + CELL / 2 + 1
  );
}

// Draw snake segments
function drawSnake() {
  snake.forEach((part, index) => {
    const padding = 2;

    ctx.fillStyle = index === 0
      ? "#20b879"
      : index % 2 === 0
        ? "#43d69a"
        : "#31c88a";

    ctx.beginPath();

    ctx.roundRect(
      part.x * CELL + padding,
      part.y * CELL + padding,
      CELL - padding * 2,
      CELL - padding * 2,
      6
    );

    ctx.fill();

    // Cute eyes on the snake's head
    if (index === 0) {
      ctx.fillStyle = "#ffffff";

      const eyePositions = {
        right: [[12, 6], [12, 14]],
        left: [[8, 6], [8, 14]],
        up: [[6, 8], [14, 8]],
        down: [[6, 12], [14, 12]]
      };

      eyePositions[direction].forEach(([ex, ey]) => {
        ctx.beginPath();
        ctx.arc(
          part.x * CELL + ex,
          part.y * CELL + ey,
          3,
          0,
          Math.PI * 2
        );
        ctx.fill();

        ctx.fillStyle = "#27425a";

        ctx.beginPath();
        ctx.arc(
          part.x * CELL + ex,
          part.y * CELL + ey,
          1.5,
          0,
          Math.PI * 2
        );
        ctx.fill();

        ctx.fillStyle = "#ffffff";
      });
    }
  });
}

// Place fruit somewhere the snake is not
function createFruit() {
  const emptyCells = [];

  for (let y = 0; y < CELLS; y++) {
    for (let x = 0; x < CELLS; x++) {
      const occupied = snake.some(
        part => part.x === x && part.y === y
      );

      if (!occupied) {
        emptyCells.push({ x, y });
      }
    }
  }

  if (emptyCells.length === 0) {
    winGame();
    return;
  }

  const position = emptyCells[
    Math.floor(Math.random() * emptyCells.length)
  ];

  const fruits = ["🍎", "🍓", "🍊", "🍇", "🍒"];

  fruit = {
    ...position,
    emoji: fruits[Math.floor(Math.random() * fruits.length)]
  };
}

// Start a new game
function startGame() {
  clearInterval(gameLoop);

  snake = [
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 }
  ];

  direction = "right";
  nextDirection = "right";
  score = 0;
  running = true;
  paused = false;

  scoreText.textContent = score;
  overlay.classList.add("hidden");
  pauseBtn.disabled = false;
  pauseBtn.textContent = "⏸ Pause";
  startBtn.textContent = "▶ Start Game";

  createFruit();
  drawBoard();

  gameLoop = setInterval(updateGame, SPEED);
}

// Change direction without allowing reverse moves
function changeDirection(newDirection) {
  if (!running || paused) return;

  const opposites = {
    up: "down",
    down: "up",
    left: "right",
    right: "left"
  };

  if (opposites[newDirection] === direction) {
    return;
  }

  nextDirection = newDirection;
}

// Move the snake and check collisions
function updateGame() {
  if (!running || paused) return;

  direction = nextDirection;

  const head = { ...snake[0] };

  if (direction === "up") head.y--;
  if (direction === "down") head.y++;
  if (direction === "left") head.x--;
  if (direction === "right") head.x++;

  // Wall collision
  if (
    head.x < 0 ||
    head.x >= CELLS ||
    head.y < 0 ||
    head.y >= CELLS
  ) {
    endGame();
    return;
  }

  const eating = head.x === fruit.x && head.y === fruit.y;

  // The tail moves away unless a fruit is eaten.
  const bodyToCheck = eating ? snake : snake.slice(0, -1);

  const hitBody = bodyToCheck.some(
    part => part.x === head.x && part.y === head.y
  );

  if (hitBody) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (eating) {
    score += 10;
    scoreText.textContent = score;

    if (score > best) {
      best = score;
      bestText.textContent = best;
      saveBest();
    }

    createFruit();

    if (!running) return;
  } else {
    snake.pop();
  }

  drawBoard();
}

// Pause or resume the game
function togglePause() {
  if (!running) return;

  paused = !paused;

  if (paused) {
    clearInterval(gameLoop);

    pauseBtn.textContent = "▶ Resume";
    titleText.textContent = "Game Paused!";
    emojiText.textContent = "⏸️";
    messageText.textContent = "Ready when you are!";
    startBtn.textContent = "▶ Resume Game";

    overlay.classList.remove("hidden");
  } else {
    overlay.classList.add("hidden");
    pauseBtn.textContent = "⏸ Pause";

    gameLoop = setInterval(updateGame, SPEED);
  }
}

// Game over
function endGame() {
  if (!running) return;

  running = false;
  paused = false;

  clearInterval(gameLoop);
  pauseBtn.disabled = true;

  titleText.textContent = "Game Over!";
  emojiText.textContent = "🐍";
  messageText.textContent = `Your final score: ${score}`;
  startBtn.textContent = "🔄 Play Again";

  overlay.classList.remove("hidden");
}

// Win if the entire board is filled
function winGame() {
  running = false;
  clearInterval(gameLoop);
  pauseBtn.disabled = true;

  titleText.textContent = "Amazing! You Won! 🎉";
  emojiText.textContent = "🏆";
  messageText.textContent = `Final score: ${score}`;
  startBtn.textContent = "🔄 Play Again";

  overlay.classList.remove("hidden");
}

// Keyboard controls
document.addEventListener("keydown", event => {
  const keys = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    W: "up",
    s: "down",
    S: "down",
    a: "left",
    A: "left",
    d: "right",
    D: "right"
  };

  if (keys[event.key]) {
    event.preventDefault();
    changeDirection(keys[event.key]);
  }

  if (event.code === "Space") {
    event.preventDefault();

    if (running) {
      togglePause();
    } else if (!paused) {
      startGame();
    }
  }
});

// Mobile direction buttons
document.querySelectorAll(".direction").forEach(button => {
  button.addEventListener("pointerdown", event => {
    event.preventDefault();
    changeDirection(button.dataset.dir);
  });
});

// Game buttons
startBtn.addEventListener("click", () => {
  if (paused && running) {
    togglePause();
  } else {
    startGame();
  }
});

pauseBtn.addEventListener("click", togglePause);
restartBtn.addEventListener("click", startGame);

// Draw the initial board
snake = [
  { x: 8, y: 10 },
  { x: 7, y: 10 },
  { x: 6, y: 10 }
];

fruit = { x: 14, y: 10, emoji: "🍎" };

drawBoard();


