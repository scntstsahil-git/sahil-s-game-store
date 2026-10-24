
/* ===== Canvas Setup ===== */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreText = document.getElementById("score");
const coinsText = document.getElementById("coins");
const bestText = document.getElementById("best");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayMessage = document.getElementById("overlay-message");

const startBtn = document.getElementById("startBtn");
const jumpBtn = document.getElementById("jumpBtn");

/* ===== Game Variables ===== */

const groundY = 330;

const player = {
    x: 115,
    y: groundY - 62,
    width: 48,
    height: 62,
    velocityY: 0,
    jumping: false
};

const gravity = 0.65;
const jumpPower = -13.5;

let obstacles = [];
let coins = [];

let score = 0;
let coinCount = 0;
let bestScore = 0;

let speed = 5;
let distance = 0;

let obstacleTimer = 0;
let coinTimer = 0;

let running = false;
let animationId = null;
let previousTime = 0;

/* ===== Load Best Score ===== */

function loadBestScore() {
    try {
        bestScore = Number(
            localStorage.getItem("pikachuRunBest")
        ) || 0;
    } catch (error) {
        bestScore = 0;
    }

    bestText.textContent = bestScore;
}

/* ===== Update Score Display ===== */

function updateStats() {
    scoreText.textContent = score;
    coinsText.textContent = coinCount;
    bestText.textContent = bestScore;
}

/* ===== Draw Background ===== */

function drawBackground() {
    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, groundY);

    sky.addColorStop(0, "#83dcff");
    sky.addColorStop(1, "#e0f9ff");

    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sun
    ctx.fillStyle = "#ffdf68";
    ctx.beginPath();
    ctx.arc(690, 65, 32, 0, Math.PI * 2);
    ctx.fill();

    // Clouds
    drawCloud(100 - (distance * 0.15) % 900, 75);
    drawCloud(390 - (distance * 0.1) % 900, 125);
    drawCloud(760 - (distance * 0.12) % 900, 65);

    // Distant hills
    ctx.fillStyle = "#8ddc9b";
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.quadraticCurveTo(150, 230, 300, groundY);
    ctx.quadraticCurveTo(480, 235, 650, groundY);
    ctx.quadraticCurveTo(730, 265, 800, groundY);
    ctx.closePath();
    ctx.fill();

    // Ground
    ctx.fillStyle = "#56bd60";
    ctx.fillRect(0, groundY, canvas.width, 70);

    // Ground top
    ctx.fillStyle = "#309c49";
    ctx.fillRect(0, groundY, canvas.width, 8);

    // Moving ground marks
    ctx.fillStyle = "#8cda72";

    for (let i = 0; i < 18; i++) {
        let x = (
            i * 65 - distance * 1.5
        ) % 900;

        if (x < 0) x += 900;

        ctx.fillRect(x, groundY + 25, 22, 4);
    }
}

/* ===== Draw Cloud ===== */

function drawCloud(x, y) {
    ctx.fillStyle = "#ffffff";

    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.arc(x + 22, y - 10, 23, 0, Math.PI * 2);
    ctx.arc(x + 45, y, 18, 0, Math.PI * 2);
    ctx.fillRect(x - 1, y, 47, 15);

    ctx.fill();
}

/* ===== Draw Original Electric Mouse ===== */

function drawPlayer() {
    ctx.save();

    const centerX = player.x + player.width / 2;
    const bottomY = player.y + player.height;

    // Shadow
    ctx.fillStyle = "#245a3550";
    ctx.beginPath();
    ctx.ellipse(
        centerX,
        groundY + 2,
        player.jumping ? 17 : 25,
        5,
        0,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // Tail
    ctx.fillStyle = "#d99318";
    ctx.beginPath();
    ctx.moveTo(centerX + 13, player.y + 39);
    ctx.lineTo(centerX + 30, player.y + 30);
    ctx.lineTo(centerX + 25, player.y + 18);
    ctx.lineTo(centerX + 42, player.y + 18);
    ctx.lineTo(centerX + 33, player.y + 39);
    ctx.lineTo(centerX + 20, player.y + 48);
    ctx.closePath();
    ctx.fill();

    // Ears
    ctx.fillStyle = "#fbdc45";

    ctx.beginPath();
    ctx.moveTo(centerX - 15, player.y + 19);
    ctx.lineTo(centerX - 24, player.y - 5);
    ctx.lineTo(centerX - 5, player.y + 7);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(centerX + 8, player.y + 8);
    ctx.lineTo(centerX + 23, player.y - 8);
    ctx.lineTo(centerX + 25, player.y + 19);
    ctx.closePath();
    ctx.fill();

    // Dark ear tips
    ctx.fillStyle = "#473b35";

    ctx.beginPath();
    ctx.moveTo(centerX - 24, player.y - 5);
    ctx.lineTo(centerX - 17, player.y - 1);
    ctx.lineTo(centerX - 21, player.y + 3);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(centerX + 23, player.y - 8);
    ctx.lineTo(centerX + 24, player.y + 2);
    ctx.lineTo(centerX + 18, player.y - 1);
    ctx.closePath();
    ctx.fill();

    // Body
    ctx.fillStyle = "#ffdf4f";
    ctx.beginPath();
    ctx.ellipse(
        centerX,
        player.y + 43,
        21,
        21,
        0,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.ellipse(
        centerX,
        player.y + 20,
        23,
        21,
        0,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // Eyes
    ctx.fillStyle = "#382c28";

    ctx.beginPath();
    ctx.arc(centerX - 9, player.y + 17, 3, 0, Math.PI * 2);
    ctx.arc(centerX + 9, player.y + 17, 3, 0, Math.PI * 2);
    ctx.fill();

    // Cheeks
    ctx.fillStyle = "#f45b52";

    ctx.beginPath();
    ctx.arc(centerX - 17, player.y + 27, 5, 0, Math.PI * 2);
    ctx.arc(centerX + 17, player.y + 27, 5, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = "#5c3927";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(centerX, player.y + 24, 6, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Feet
    ctx.fillStyle = "#d99318";

    ctx.beginPath();
    ctx.ellipse(
        centerX - 11,
        bottomY - 1,
        10,
        5,
        0,
        0,
        Math.PI * 2
    );

    ctx.ellipse(
        centerX + 11,
        bottomY - 1,
        10,
        5,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
}

/* ===== Draw Obstacles ===== */

function drawObstacles() {
    obstacles.forEach(function(obstacle) {
        ctx.fillStyle = "#8d6345";

        // Rock
        ctx.beginPath();
        ctx.moveTo(obstacle.x, groundY);
        ctx.lineTo(obstacle.x + 5, groundY - obstacle.height + 12);
        ctx.lineTo(obstacle.x + 18, groundY - obstacle.height);
        ctx.lineTo(obstacle.x + obstacle.width - 4,
                   groundY - obstacle.height + 9);
        ctx.lineTo(obstacle.x + obstacle.width, groundY);
        ctx.closePath();
        ctx.fill();

        // Highlight
        ctx.fillStyle = "#b68a64";
        ctx.fillRect(
            obstacle.x + 7,
            groundY - obstacle.height + 15,
            6,
            9
        );
    });
}

/* ===== Draw Coins ===== */

function drawCoins() {
    coins.forEach(function(coin) {
        if (coin.collected) return;

        ctx.fillStyle = "#ffbf27";
        ctx.strokeStyle = "#e18a00";
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.arc(coin.x, coin.y, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#fff1a1";
        ctx.font = "bold 13px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("$", coin.x, coin.y + 1);
    });
}

/* ===== Create Obstacle ===== */

function createObstacle() {
    const height = 30 + Math.random() * 25;

    obstacles.push({
        x: canvas.width + 20,
        width: 28 + Math.random() * 12,
        height: height
    });
}

/* ===== Create Coins ===== */

function createCoins() {
    const baseY = groundY - 65 - Math.random() * 45;

    for (let i = 0; i < 4; i++) {
        coins.push({
            x: canvas.width + 30 + i * 35,
            y: baseY,
            collected: false
        });
    }
}

/* ===== Jump Function ===== */

function jump() {
    if (!running) return;

    if (!player.jumping) {
        player.velocityY = jumpPower;
        player.jumping = true;
    }
}

/* ===== Collision Detection ===== */

function isColliding(a, b) {
    return (
        a.x + a.width - 8 > b.x &&
        a.x + 8 < b.x + b.width &&
        a.y + a.height - 5 > groundY - b.height
    );
}

/* ===== Check Coin Collection ===== */

function collectCoins() {
    const playerBox = {
        x: player.x,
        y: player.y,
        width: player.width,
        height: player.height
    };

    coins.forEach(function(coin) {
        if (coin.collected) return;

        const dx = playerBox.x + playerBox.width / 2 - coin.x;
        const dy = playerBox.y + playerBox.height / 2 - coin.y;

        if (Math.sqrt(dx * dx + dy * dy) < 35) {
            coin.collected = true;
            coinCount++;

            score += 5;

            updateStats();
        }
    });
}

/* ===== Update Game ===== */

function updateGame(delta) {
    const step = Math.min(delta / 16.67, 2);

    // Gradually increase running speed.
    speed = Math.min(5 + score / 100, 11);

    distance += speed * step;

    // Gravity and jumping.
    player.velocityY += gravity * step;
    player.y += player.velocityY * step;

    if (player.y + player.height >= groundY) {
        player.y = groundY - player.height;
        player.velocityY = 0;
        player.jumping = false;
    }

    // Spawn obstacles.
    obstacleTimer += delta;

    if (obstacleTimer > Math.max(650, 1400 - speed * 65)) {
        createObstacle();
        obstacleTimer = 0;
    }

    // Spawn coins.
    coinTimer += delta;

    if (coinTimer > 1800) {
        createCoins();
        coinTimer = 0;
    }

    // Move obstacles.
    obstacles.forEach(function(obstacle) {
        obstacle.x -= speed * step;
    });

    obstacles = obstacles.filter(function(obstacle) {
        return obstacle.x + obstacle.width > -10;
    });

    // Move coins.
    coins.forEach(function(coin) {
        coin.x -= speed * step;
    });

    coins = coins.filter(function(coin) {
        return coin.x > -20 && !coin.collected;
    });

    // Check collisions.
    for (const obstacle of obstacles) {
        if (isColliding(player, obstacle)) {
            endGame();
            return;
        }
    }

    collectCoins();

    // One point per distance interval.
    score += Math.floor(speed * step / 20);

    if (score > bestScore) {
        bestScore = score;

        try {
            localStorage.setItem("pikachuRunBest", bestScore);
        } catch (error) {
            // Game storage is optional.
        }
    }

    updateStats();
}

/* ===== Draw Everything ===== */

function drawGame() {
    drawBackground();
    drawCoins();
    drawObstacles();
    drawPlayer();
}

/* ===== Main Game Loop ===== */

function gameLoop(timestamp) {
    if (!running) return;

    const delta = previousTime
        ? Math.min(timestamp - previousTime, 40)
        : 16.67;

    previousTime = timestamp;

    updateGame(delta);
    drawGame();

    if (running) {
        animationId = requestAnimationFrame(gameLoop);
    }
}

/* ===== Start Game ===== */

function startGame() {
    if (animationId !== null) {
        cancelAnimationFrame(animationId);
    }

    score = 0;
    coinCount = 0;
    speed = 5;
    distance = 0;

    obstacles = [];
    coins = [];

    obstacleTimer = 0;
    coinTimer = 0;

    player.y = groundY - player.height;
    player.velocityY = 0;
    player.jumping = false;

    previousTime = 0;
    running = true;

    updateStats();

    overlay.classList.add("hidden");

    animationId = requestAnimationFrame(gameLoop);
}

/* ===== End Game ===== */

function endGame() {
    if (!running) return;

    running = false;

    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    drawGame();

    overlayTitle.textContent = "Game Over! 💥";

    overlayMessage.textContent =
        "Score: " + score +
        " | Coins: " + coinCount +
        " — Try again and beat your best!";

    startBtn.textContent = "🔄 Play Again";

    overlay.classList.remove("hidden");

    updateStats();
}

/* ===== Controls ===== */

startBtn.addEventListener("click", startGame);

jumpBtn.addEventListener("pointerdown", function(event) {
    event.preventDefault();
    jump();
});

canvas.addEventListener("pointerdown", function() {
    jump();
});

document.addEventListener("keydown", function(event) {
    if (
        event.code === "Space" ||
        event.code === "ArrowUp"
    ) {
        event.preventDefault();

        // Space/Up starts the game on the opening screen.
        if (!running) {
            startGame();
        } else {
            jump();
        }
    }
});

/* ===== Initial Screen ===== */

loadBestScore();
updateStats();
drawGame();


