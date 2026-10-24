
/* ===== Game Variables ===== */

const holes = document.querySelectorAll(".hole");
const scoreText = document.getElementById("score");
const bestText = document.getElementById("best");
const timeText = document.getElementById("time");
const timerBar = document.getElementById("timer-bar");
const message = document.getElementById("message");
const startBtn = document.getElementById("start-btn");

let score = 0;
let timeLeft = 30;
let bestScore = 0;
let gameRunning = false;
let currentMole = -1;

let gameTimer = null;
let moleTimer = null;
let hideTimer = null;

/* ===== Load Best Score ===== */

function loadBestScore() {
    try {
        bestScore = Number(localStorage.getItem("moleBestScore")) || 0;
    } catch (error) {
        bestScore = 0;
    }

    bestText.textContent = bestScore;
}

/* ===== Update Score ===== */

function updateScore() {
    scoreText.textContent = score;
    bestText.textContent = bestScore;
}

/* ===== Remove Active Mole ===== */

function hideMoles() {
    holes.forEach(function(hole) {
        hole.classList.remove("active");
    });

    currentMole = -1;

    clearTimeout(hideTimer);
}

/* ===== Show Random Mole ===== */

function showMole() {
    if (!gameRunning) return;

    hideMoles();

    let nextMole;

    do {
        nextMole = Math.floor(Math.random() * holes.length);
    } while (holes.length > 1 && nextMole === currentMole);

    currentMole = nextMole;

    holes[currentMole].classList.add("active");

    // Mole kuch samay baad chhup jayega.
    hideTimer = setTimeout(function() {
        if (gameRunning && currentMole === nextMole) {
            holes[nextMole].classList.remove("active");
            currentMole = -1;
        }
    }, 850);
}

/* ===== Catch Mole ===== */

function catchMole(index) {
    if (!gameRunning) return;
    if (index !== currentMole) return;

    // Ek mole ko sirf ek baar hit kar sakte hain.
    holes[index].classList.remove("active");
    holes[index].classList.add("hit");

    clearTimeout(hideTimer);
    currentMole = -1;

    score += 10;

    message.textContent = "🎉 Great Catch! +10 Points";

    if (score > bestScore) {
        bestScore = score;

        try {
            localStorage.setItem("moleBestScore", bestScore);
        } catch (error) {
            // Storage unavailable ho to bhi game chalega.
        }
    }

    updateScore();

    setTimeout(function() {
        holes[index].classList.remove("hit");
    }, 200);
}

/* ===== Start Game ===== */

function startGame() {
    clearInterval(gameTimer);
    clearInterval(moleTimer);
    clearTimeout(hideTimer);

    score = 0;
    timeLeft = 30;
    gameRunning = true;

    hideMoles();

    scoreText.textContent = score;
    timeText.textContent = timeLeft;
    timerBar.style.width = "100%";

    message.textContent = "🐹 Catch as many moles as you can!";
    startBtn.disabled = true;
    startBtn.textContent = "🎯 Game Running...";

    // Pehla mole turant dikhayein.
    showMole();

    // Har 750 milliseconds mein mole change hoga.
    moleTimer = setInterval(function() {
        showMole();
    }, 750);

    // Countdown timer.
    gameTimer = setInterval(function() {
        timeLeft--;

        timeText.textContent = timeLeft;
        timerBar.style.width = (timeLeft / 30 * 100) + "%";

        if (timeLeft <= 10) {
            timerBar.style.background = "#ff5964";
        }

        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

/* ===== End Game ===== */

function endGame() {
    gameRunning = false;

    clearInterval(gameTimer);
    clearInterval(moleTimer);
    clearTimeout(hideTimer);

    hideMoles();

    holes.forEach(function(hole) {
        hole.classList.remove("hit");
    });

    startBtn.disabled = false;
    startBtn.textContent = "🔄 Play Again";

    message.textContent = "🏁 Time Up! Your score: " + score;

    timerBar.style.width = "0%";
}

/* ===== Mole Click Events ===== */

holes.forEach(function(hole, index) {
    hole.addEventListener("click", function() {
        catchMole(index);
    });
});

/* ===== Start Button Event ===== */

startBtn.addEventListener("click", startGame);

/* ===== Initialize Game ===== */

loadBestScore();
updateScore();


