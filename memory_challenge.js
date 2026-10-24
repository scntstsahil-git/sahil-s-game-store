
/* ===== Game Elements ===== */

const colorButtons = document.querySelectorAll(".color-btn");

const scoreText = document.getElementById("score");
const levelText = document.getElementById("level");
const bestText = document.getElementById("best");
const statusText = document.getElementById("status");

const startBtn = document.getElementById("start-btn");
const soundBtn = document.getElementById("sound-btn");

/* ===== Game Variables ===== */

let sequence = [];
let playerSequence = [];

let score = 0;
let level = 0;
let bestScore = 0;

let gameRunning = false;
let acceptingInput = false;
let soundEnabled = true;

let playbackToken = 0;
let audioContext = null;

/* ===== Load Best Score ===== */

function loadBestScore() {
    try {
        bestScore = Number(
            localStorage.getItem("simonBestScore")
        ) || 0;
    } catch (error) {
        bestScore = 0;
    }

    bestText.textContent = bestScore;
}

/* ===== Update Stats ===== */

function updateStats() {
    scoreText.textContent = score;
    levelText.textContent = level;
    bestText.textContent = bestScore;
}

/* ===== Sound System ===== */

function playSound(colorIndex) {
    if (!soundEnabled) return;

    try {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return;

        if (!audioContext) {
            audioContext = new AudioContextClass();
        }

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        const frequencies = [329.63, 261.63, 220, 164.81];

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = frequencies[colorIndex];

        gain.gain.setValueAtTime(
            0.0001,
            audioContext.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.2,
            audioContext.currentTime + 0.02
        );

        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            audioContext.currentTime + 0.22
        );

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.23);

    } catch (error) {
        // Sound unavailable ho to game phir bhi chalega.
    }
}

/* ===== Flash a Color ===== */

function flashColor(colorIndex, duration = 350) {
    const button = colorButtons[colorIndex];

    button.classList.add("active");
    playSound(colorIndex);

    setTimeout(function() {
        button.classList.remove("active");
    }, duration);
}

/* ===== Wait Function ===== */

function wait(ms) {
    return new Promise(function(resolve) {
        setTimeout(resolve, ms);
    });
}

/* ===== Play the Sequence ===== */

async function playSequence() {
    acceptingInput = false;

    // Purane playback ko cancel karne ke liye token.
    const token = ++playbackToken;

    statusText.textContent = "👀 Watch the color sequence!";

    await wait(600);

    for (let i = 0; i < sequence.length; i++) {
        if (!gameRunning || token !== playbackToken) {
            return;
        }

        flashColor(sequence[i]);

        await wait(500);
    }

    if (!gameRunning || token !== playbackToken) {
        return;
    }

    statusText.textContent = "👉 Your turn! Repeat the sequence.";
    acceptingInput = true;
}

/* ===== Start a New Round ===== */

function nextRound() {
    if (!gameRunning) return;

    playerSequence = [];

    const randomColor = Math.floor(
        Math.random() * colorButtons.length
    );

    sequence.push(randomColor);

    level = sequence.length;

    updateStats();
    playSequence();
}

/* ===== Start Game ===== */

function startGame() {
    // Playback ko reset karo.
    playbackToken++;

    sequence = [];
    playerSequence = [];

    score = 0;
    level = 0;

    gameRunning = true;
    acceptingInput = false;

    updateStats();

    startBtn.textContent = "🔄 Restart Game";

    statusText.textContent = "🚀 Get ready!";

    nextRound();
}

/* ===== Handle Player Input ===== */

function handleColorClick(colorIndex) {
    if (!gameRunning || !acceptingInput) {
        return;
    }

    flashColor(colorIndex, 180);

    const expectedColor = sequence[playerSequence.length];

    // Galat color press hua.
    if (colorIndex !== expectedColor) {
        gameOver();
        return;
    }

    playerSequence.push(colorIndex);

    // Pura sequence sahi repeat ho gaya.
    if (playerSequence.length === sequence.length) {
        acceptingInput = false;

        score += 10;

        if (score > bestScore) {
            bestScore = score;

            try {
                localStorage.setItem(
                    "simonBestScore",
                    bestScore
                );
            } catch (error) {
                // Storage unavailable hone par ignore karo.
            }
        }

        updateStats();

        statusText.textContent = "🎉 Perfect! Next level...";

        setTimeout(function() {
            if (gameRunning) {
                nextRound();
            }
        }, 800);
    }
}

/* ===== Game Over ===== */

function gameOver() {
    gameRunning = false;
    acceptingInput = false;

    // Sequence playback ko cancel karo.
    playbackToken++;

    statusText.textContent =
        "❌ Game Over! Final score: " + score;

    startBtn.textContent = "▶ Play Again";

    updateStats();
}

/* ===== Button Events ===== */

colorButtons.forEach(function(button, index) {
    button.addEventListener("click", function() {
        handleColorClick(index);
    });
});

startBtn.addEventListener("click", startGame);

/* ===== Toggle Sound ===== */

soundBtn.addEventListener("click", function() {
    soundEnabled = !soundEnabled;

    soundBtn.textContent = soundEnabled
        ? "🔊 Sound: ON"
        : "🔇 Sound: OFF";
});

/* ===== Initialize ===== */

loadBestScore();
updateStats();


