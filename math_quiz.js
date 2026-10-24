
/* =========================
   Math Quest 🧠
   Game Logic
========================= */

// ===== HTML Elements =====
const scoreText = document.getElementById("score");
const levelText = document.getElementById("level");
const bestText = document.getElementById("best");
const timerText = document.getElementById("timer");
const timerBar = document.getElementById("timerBar");

const questionLabel = document.getElementById("questionLabel");
const questionText = document.getElementById("question");
const message = document.getElementById("message");
const optionsBox = document.getElementById("options");

const startBtn = document.getElementById("startBtn");
const answeredText = document.getElementById("answered");
const progressBar = document.getElementById("progressBar");

// ===== Game Settings =====
const GAME_DURATION = 60;
const LEVEL_STEP = 5;

// ===== Game Variables =====
let score = 0;
let best = loadBest();
let level = 1;
let answered = 0;
let correctAnswers = 0;
let timeLeft = GAME_DURATION;

let correctAnswer = 0;
let running = false;
let answerLocked = false;
let timerInterval = null;
let nextQuestionTimeout = null;

// ===== Load Best Score =====
function loadBest() {
  try {
    return Number(localStorage.getItem("mathQuestBest")) || 0;
  } catch (error) {
    return 0;
  }
}

// ===== Save Best Score =====
function saveBest() {
  try {
    localStorage.setItem("mathQuestBest", best);
  } catch (error) {
    // Game can continue if storage is unavailable.
  }
}

// ===== Update Scoreboard =====
function updateStats() {
  scoreText.textContent = score;
  levelText.textContent = level;
  bestText.textContent = best;
  timerText.textContent = timeLeft + "s";
  answeredText.textContent = answered;

  const timePercentage = (timeLeft / GAME_DURATION) * 100;
  timerBar.style.width = timePercentage + "%";

  timerBar.classList.toggle("warning", timeLeft <= 10);

  // Progress towards the next level
  const levelProgress = (correctAnswers % LEVEL_STEP) * 20;
  progressBar.style.width = levelProgress + "%";
}

// ===== Generate Random Integer =====
function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ===== Generate a Question =====
function generateQuestion() {
  let a;
  let b;
  let answer;
  let operator;

  const operations = level < 3
    ? ["+", "-"]
    : level < 5
      ? ["+", "-", "×"]
      : ["+", "-", "×", "÷"];

  operator = operations[
    randomNumber(0, operations.length - 1)
  ];

  if (operator === "+") {
    a = randomNumber(1, 10 + level * 5);
    b = randomNumber(1, 10 + level * 5);
    answer = a + b;
  }

  else if (operator === "-") {
    a = randomNumber(1, 10 + level * 5);
    b = randomNumber(1, 10 + level * 5);

    // Keep the answer non-negative
    if (b > a) {
      [a, b] = [b, a];
    }

    answer = a - b;
  }

  else if (operator === "×") {
    const maxFactor = Math.min(5 + level, 15);
    a = randomNumber(2, maxFactor);
    b = randomNumber(2, maxFactor);
    answer = a * b;
  }

  else {
    // Multiplication ke through exact division banate hain
    b = randomNumber(2, Math.min(10, level + 3));
    answer = randomNumber(2, Math.min(12, level + 4));
    a = b * answer;
  }

  return {
    text: `${a} ${operator} ${b} = ?`,
    answer: answer
  };
}

// ===== Create Four Answer Options =====
function generateOptions(answer) {
  const choices = new Set([answer]);

  while (choices.size < 4) {
    let wrongAnswer;

    // Nearby values create useful distractors
    const offset = randomNumber(1, Math.max(5, level * 3));
    wrongAnswer = Math.random() < 0.5
      ? answer + offset
      : answer - offset;

    if (wrongAnswer >= 0 && wrongAnswer !== answer) {
      choices.add(wrongAnswer);
    }
  }

  // Shuffle the choices
  const shuffled = Array.from(choices);

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomNumber(0, i);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

// ===== Show a New Question =====
function showQuestion() {
  if (!running) return;

  answerLocked = false;

  const newQuestion = generateQuestion();
  correctAnswer = newQuestion.answer;

  questionLabel.textContent = `QUESTION ${answered + 1}`;
  questionText.textContent = newQuestion.text;
  message.textContent = "Choose the correct answer! 🎯";

  const choices = generateOptions(correctAnswer);
  const labels = ["A", "B", "C", "D"];

  optionsBox.innerHTML = "";

  choices.forEach(function (choice, index) {
    const button = document.createElement("button");

    button.className = "option-btn";
    button.type = "button";
    button.textContent = `${labels[index]}. ${choice}`;
    button.dataset.answer = choice;

    button.addEventListener("click", function () {
      checkAnswer(button, choice);
    });

    optionsBox.appendChild(button);
  });
}

// ===== Check the Selected Answer =====
function checkAnswer(button, selectedAnswer) {
  if (!running || answerLocked) return;

  answerLocked = true;
  answered++;

  const buttons = optionsBox.querySelectorAll(".option-btn");

  buttons.forEach(function (option) {
    option.disabled = true;

    if (Number(option.dataset.answer) === correctAnswer) {
      option.classList.add("correct");
    }
  });

  if (selectedAnswer === correctAnswer) {
    score += 10;
    correctAnswers++;

    message.textContent = "Amazing! Correct answer! 🎉";

    // Increase level after every five correct answers
    const newLevel = Math.floor(
      correctAnswers / LEVEL_STEP
    ) + 1;

    if (newLevel > level) {
      level = newLevel;
      message.textContent = `🚀 Level ${level} unlocked!`;
    }

    if (score > best) {
      best = score;
      saveBest();
    }
  } else {
    button.classList.add("wrong");
    message.textContent =
      `Almost! Correct answer: ${correctAnswer} 💪`;
  }

  updateStats();

  nextQuestionTimeout = setTimeout(function () {
    if (running) {
      showQuestion();
    }
  }, 850);
}

// ===== Countdown Timer =====
function startTimer() {
  clearInterval(timerInterval);

  timerInterval = setInterval(function () {
    if (!running) return;

    timeLeft--;

    if (timeLeft <= 0) {
      timeLeft = 0;
      updateStats();
      endGame();
      return;
    }

    updateStats();
  }, 1000);
}

// ===== Start the Game =====
function startGame() {
  if (running) return;

  clearInterval(timerInterval);
  clearTimeout(nextQuestionTimeout);

  score = 0;
  level = 1;
  answered = 0;
  correctAnswers = 0;
  timeLeft = GAME_DURATION;

  running = true;
  answerLocked = false;

  startBtn.textContent = "🎮 Playing...";
  startBtn.disabled = true;

  updateStats();
  showQuestion();
  startTimer();
}

// ===== End the Game =====
function endGame() {
  running = false;
  answerLocked = true;

  clearInterval(timerInterval);
  clearTimeout(nextQuestionTimeout);

  const buttons = optionsBox.querySelectorAll(".option-btn");

  buttons.forEach(function (button) {
    button.disabled = true;
  });

  questionLabel.textContent = "QUIZ COMPLETED";
  questionText.textContent = "🎉 Time's Up!";
  message.textContent =
    `You scored ${score} points and reached Level ${level}!`;

  startBtn.textContent = "🔄 Play Again";
  startBtn.disabled = false;
}

// ===== Button Event =====
startBtn.addEventListener("click", startGame);

// ===== Initial Screen =====
bestText.textContent = best;
updateStats();

questionText.textContent = "Ready for a challenge?";
message.textContent = "Press Start Quiz to begin! 🚀";


