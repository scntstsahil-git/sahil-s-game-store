(() => {
  "use strict";

  const produce = [
    { name: "Apple", emoji: "🍎" },
    { name: "Banana", emoji: "🍌" },
    { name: "Carrot", emoji: "🥕" },
    { name: "Strawberry", emoji: "🍓" },
  ];
  const board = document.querySelector("#board");
  const movesOutput = document.querySelector("#moves");
  const pairsOutput = document.querySelector("#pairs");
  const scoreOutput = document.querySelector("#score");
  const bestOutput = document.querySelector("#best-score");
  const hintButton = document.querySelector("#hint-button");
  const restartButton = document.querySelector("#restart-button");
  const soundButton = document.querySelector("#sound-toggle");
  const soundLabel = document.querySelector("#sound-label");
  const liveStatus = document.querySelector("#live-status");
  const winOverlay = document.querySelector("#win-overlay");
  const finalScore = document.querySelector("#final-score");
  const playAgain = document.querySelector("#play-again");

  let cards = [];
  let selected = [];
  let moves = 0;
  let matchedPairs = 0;
  let score = 0;
  let locked = false;
  let soundEnabled = false;
  let audioContext;
  let mismatchTimer;
  let hintTimer;
  let announceTimer;
  let winTimer;
  let turnNumber = 0;

  function getBestScore() {
    try {
      return Number(window.localStorage.getItem("little-garden-best") || 0);
    } catch {
      return 0;
    }
  }

  function saveBestScore(value) {
    try {
      window.localStorage.setItem("little-garden-best", String(value));
    } catch {
      // The game remains playable when browser storage is unavailable.
    }
  }

  function shuffle(items) {
    const shuffled = [...items];
    // Fisher–Yates ensures each restart gets a fresh, unbiased arrangement.
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  function speak(message) {
    liveStatus.textContent = "";
    window.clearTimeout(announceTimer);
    announceTimer = window.setTimeout(() => {
      liveStatus.textContent = message;
    }, 35);
  }

  function playTone(frequency, duration = 0.12, wave = "sine") {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      audioContext ||= new AudioContextClass();
      if (audioContext.state === "suspended") audioContext.resume();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = wave;
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      gain.gain.setValueAtTime(0.045, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
    } catch {
      // Sound is an optional enhancement; it must never interrupt a turn.
    }
  }

  function refreshCounters() {
    movesOutput.textContent = String(moves);
    pairsOutput.textContent = String(matchedPairs);
    scoreOutput.textContent = String(score);
    const best = getBestScore();
    bestOutput.textContent = best ? String(best) : "—";
  }

  function describeCard(card) {
    if (card.matched) return `${card.name}, matched`;
    if (card.flipped || card.hinted) return `${card.name}, face up`;
    return `Hidden card ${card.position + 1} of 8`;
  }

  function renderBoard() {
    board.replaceChildren();
    cards.forEach((card) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "memory-card";
      button.dataset.cardId = card.id;
      button.setAttribute("aria-label", describeCard(card));
      button.setAttribute("aria-pressed", String(card.flipped || card.matched || card.hinted));
      if (card.flipped) button.classList.add("is-flipped");
      if (card.matched) button.classList.add("is-matched");
      if (card.hinted) button.classList.add("is-hint");
      if (card.matched || locked) button.disabled = true;

      const inner = document.createElement("span");
      inner.className = "card-inner";
      inner.setAttribute("aria-hidden", "true");
      const back = document.createElement("span");
      back.className = "card-face card-back";
      const front = document.createElement("span");
      front.className = "card-face card-front";
      const art = document.createElement("span");
      art.className = "card-emoji";
      art.textContent = card.emoji;
      front.append(art);
      inner.append(back, front);
      button.append(inner);
      button.addEventListener("click", () => turnCard(card.id));
      board.append(button);
    });
  }

  function clearHint() {
    window.clearTimeout(hintTimer);
    cards.forEach((card) => { card.hinted = false; });
  }

  function turnCard(id) {
    if (locked || winOverlay.hidden === false) return;
    const card = cards.find((item) => item.id === id);
    if (!card || card.matched || card.flipped || card.hinted) return;
    clearHint();
    card.flipped = true;
    selected.push(card);
    playTone(420 + (card.position % 4) * 45, 0.08);
    renderBoard();

    if (selected.length === 2) {
      moves += 1;
      refreshCounters();
      const [first, second] = selected;
      if (first.kind === second.kind) {
        first.matched = true;
        second.matched = true;
        matchedPairs += 1;
        score += 100;
        selected = [];
        refreshCounters();
        renderBoard();
        playTone(660, 0.13);
        window.setTimeout(() => playTone(880, 0.16), 90);
        speak(`A match! ${first.name} pair found. ${matchedPairs} of 4 pairs. 100 points earned.`);
        if (matchedPairs === 4) finishGame();
      } else {
        locked = true;
        renderBoard();
        speak("Not a pair yet. Take another look and try again.");
        mismatchTimer = window.setTimeout(() => {
          first.flipped = false;
          second.flipped = false;
          selected = [];
          locked = false;
          renderBoard();
        }, 850);
      }
    } else {
      speak(`${card.name} turned over. Find its friend.`);
    }
  }

  function showHint() {
    if (locked || winOverlay.hidden === false) return;
    window.clearTimeout(mismatchTimer);
    selected.forEach((card) => { card.flipped = false; });
    selected = [];
    locked = false;
    clearHint();
    const firstUnmatched = cards.find((card) => !card.matched);
    if (!firstUnmatched) return;
    const pair = cards.filter((card) => card.kind === firstUnmatched.kind && !card.matched);
    pair.forEach((card) => { card.hinted = true; });
    renderBoard();
    playTone(590, 0.12);
    speak(`Here is a pair of ${firstUnmatched.name}.`);
    hintTimer = window.setTimeout(() => {
      pair.forEach((card) => { card.hinted = false; });
      renderBoard();
    }, 1350);
  }

  function finishGame() {
    locked = true;
    const best = Math.max(score, getBestScore());
    saveBestScore(best);
    refreshCounters();
    finalScore.textContent = String(score);
    const message = moves === 4
      ? "Four perfect turns. Your garden is in full bloom!"
      : `You found all four pairs in ${moves} ${moves === 1 ? "move" : "moves"}. What a lovely little win.`;
    document.querySelector("#win-message").textContent = message;
    winTimer = window.setTimeout(() => {
      winOverlay.hidden = false;
      playAgain.focus();
      speak(`Garden complete! You scored ${score} points in ${moves} moves.`);
    }, 420);
  }

  function startGame(returnFocus = false) {
    window.clearTimeout(mismatchTimer);
    window.clearTimeout(hintTimer);
    window.clearTimeout(announceTimer);
    window.clearTimeout(winTimer);
    turnNumber += 1;
    const deck = shuffle([...produce, ...produce]);
    cards = deck.map((item, position) => ({
      ...item,
      kind: item.name,
      id: `${turnNumber}-${position}`,
      position,
      flipped: false,
      hinted: false,
      matched: false,
    }));
    selected = [];
    moves = 0;
    matchedPairs = 0;
    score = 0;
    locked = false;
    winOverlay.hidden = true;
    refreshCounters();
    renderBoard();
    speak("A fresh garden is ready. Find four pairs.");
    if (returnFocus) restartButton.focus();
  }

  soundButton.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    soundButton.setAttribute("aria-pressed", String(soundEnabled));
    soundButton.setAttribute("aria-label", soundEnabled ? "Turn sound off" : "Turn sound on");
    soundLabel.textContent = soundEnabled ? "Sound on" : "Sound off";
    if (soundEnabled) playTone(580, 0.11);
  });
  hintButton.addEventListener("click", showHint);
  restartButton.addEventListener("click", () => startGame());
  playAgain.addEventListener("click", () => startGame(true));
  document.addEventListener("keydown", (event) => {
    if (!winOverlay.hidden) {
      if (event.key === "Escape") {
        winOverlay.hidden = true;
        restartButton.focus();
      } else if (event.key === "Tab") {
        // Keep keyboard focus inside the completion dialog until it is dismissed.
        event.preventDefault();
        playAgain.focus();
      }
    }
  });

  refreshCounters();
  startGame();
})();

