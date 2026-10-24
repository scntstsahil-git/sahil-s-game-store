
const playArea = document.getElementById("play-area");
const scoreText = document.getElementById("score");
const bestText = document.getElementById("best");
const timeText = document.getElementById("time");
const timeBar = document.getElementById("time-bar");
const message = document.getElementById("message");

const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const restartBtn = document.getElementById("restart-btn");
const soundBtn = document.getElementById("sound-btn");

const colors = [
  "#ff75ad",
  "#8e7bff",
  "#55dcb1",
  "#ffcc59",
  "#55c8ff",
  "#ff9275",
  "#cf88ff"
];

const GAME_DURATION = 30;

let score = 0;
let best = loadBestScore();
let timeLeft = GAME_DURATION;

let running = false;
let paused = false;
let soundEnabled = false;
let audioContext = null;

let spawnInterval = null;
let timerInterval = null;
let roundId = 0;

bestText.textContent = best;

// Safe best-score loading
function loadBestScore() {
  try {
    return Number(localStorage.getItem("bubblePopBest")) || 0;
  } catch {
    return 0;
  }
}

// Save best score when possible
function saveBestScore() {
  try {
    localStorage.setItem("bubblePopBest", String(best));
  } catch {
    // Game remains playable without storage.
  }
}

// Sound effects using Web Audio API
function playSound(frequency = 500, duration = 0.09) {
  if (!soundEnabled) return;

  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    if (!audioContext) {
      audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(
      0.12,
      audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch {
    // Audio errors must not interrupt gameplay.
  }
}

// Update score display
function updateScore() {
  scoreText.textContent = score;

  if (score > best) {
    best = score;
    bestText.textContent = best;
    saveBestScore();
  }
}

// Update timer and progress bar
function updateTimerDisplay() {
  timeText.textContent = timeLeft;

  const percentage = (timeLeft / GAME_DURATION) * 100;
  timeBar.style.width = percentage + "%";
}

// Create one bubble
function createBubble() {
  if (!running || paused) return;

  const areaWidth = playArea.clientWidth;
  const areaHeight = playArea.clientHeight;

  const size = 45 + Math.random() * 40;
  const maxX = Math.max(0, areaWidth - size);
  const maxY = Math.max(0, areaHeight - size);

  const bubble = document.createElement("button");

  bubble.type = "button";
  bubble.className = "bubble";
  bubble.style.width = size + "px";
  bubble.style.height = size + "px";

  bubble.style.left = Math.random() * maxX + "px";
  bubble.style.top = Math.random() * maxY + "px";

  bubble.style.background =
    colors[Math.floor(Math.random() * colors.length)];

  bubble.setAttribute(
    "aria-label",
    "Pop bubble for " + Math.round(size) + " points"
  );

  // Smaller bubbles award more points.
  const points = Math.round(135 - size);

  bubble.addEventListener("click", () => {
    if (!running || paused || bubble.classList.contains("popping")) {
      return;
    }

    bubble.classList.add("popping");
    bubble.disabled = true;

    score += points;
    updateScore();

    playSound(400 + Math.random() * 500);

    const popText = document.createElement("span");
    popText.className = "pop-text";
    popText.textContent = "+" + points;

    popText.style.left = bubble.style.left;
    popText.style.top = bubble.style.top;

    playArea.appendChild(popText);

    setTimeout(() => popText.remove(), 600);
    setTimeout(() => bubble.remove(), 250);
  });

  playArea.appendChild(bubble);
}

// Start spawning bubbles
function startSpawning() {
  clearInterval(spawnInterval);

  spawnInterval = setInterval(() => {
    if (!running || paused) return;

    createBubble();

    // Gradually increase the challenge.
    if (timeLeft <= 15) {
      createBubble();
    }
  }, 650);
}

// Start the countdown
function startTimer() {
  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    if (!running || paused) return;

    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

// Remove all bubbles and temporary score labels
function clearBubbles() {
  playArea.querySelectorAll(".bubble, .pop-text").forEach(
    element => element.remove()
  );
}

// Start or restart a round
function startGame() {
  roundId++;

  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  clearBubbles();

  score = 0;
  timeLeft = GAME_DURATION;
  running = true;
  paused = false;

  updateScore();
  updateTimerDisplay();

  message.hidden = true;
  pauseBtn.disabled = false;
  pauseBtn.textContent = "⏸ Pause";
  startBtn.textContent = "▶ Play Again";

  startSpawning();
  startTimer();

  createBubble();
  createBubble();
}

// Pause or resume gameplay
function togglePause() {
  if (!running) return;

  paused = !paused;

  if (paused) {
    clearInterval(spawnInterval);
    clearInterval(timerInterval);

    pauseBtn.textContent = "▶ Resume";

    message.innerHTML = `
      <div class="message-emoji">⏸️</div>
      <h2>Game Paused</h2>
      <p>Take a little break!</p>
      <button id="resume-btn" class="main-btn">
        ▶ Resume Game
      </button>
    `;

    message.hidden = false;

    document.getElementById("resume-btn").addEventListener(
      "click",
      togglePause
    );
  } else {
    message.hidden = true;
    pauseBtn.textContent = "⏸ Pause";

    startSpawning();
    startTimer();
  }
}

// Finish the round
function endGame() {
  if (!running) return;

  running = false;
  paused = false;

  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  clearBubbles();

  timeLeft = 0;
  updateTimerDisplay();

  pauseBtn.disabled = true;

  playSound(700, 0.25);

  message.innerHTML = `
    <div class="message-emoji">🎉</div>
    <h2>Awesome Popping!</h2>
    <p>Your score: <strong>${score}</strong></p>
    <p>Best score: <strong>${best}</strong></p>
    <button id="play-again-btn" class="main-btn">
      🔄 Play Again
    </button>
  `;

  message.hidden = false;

  document.getElementById("play-again-btn").addEventListener(
    "click",
    startGame
  );
}

// Sound toggle
soundBtn.addEventListener("click", () => {
  soundEnabled = !soundEnabled;

  soundBtn.textContent = soundEnabled
    ? "🔊 Sound On"
    : "🔇 Sound Off";

  soundBtn.setAttribute(
    "aria-pressed",
    String(soundEnabled)
  );

  if (soundEnabled) {
    playSound(600);
  }
});

// Buttons
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", togglePause);

// Initial display
updateScore();
updateTimerDisplay();


