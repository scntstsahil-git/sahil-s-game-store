const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const EMPTY_SCORES = { X: 0, O: 0, draws: 0 };

/**
 * Return the winning trio for a finished board, or null if nobody has won.
 * Kept independent of the page so the game rules can be checked directly.
 */
export function findWinningCombination(board) {
  for (const combination of WINNING_COMBINATIONS) {
    const [first, second, third] = combination;
    if (
      board[first] &&
      board[first] === board[second] &&
      board[first] === board[third]
    ) {
      return [...combination];
    }
  }

  return null;
}

/** Describe whether a board is still being played, won, or drawn. */
export function getRoundOutcome(board) {
  const winningCells = findWinningCombination(board);

  if (winningCells) {
    return { type: "win", winner: board[winningCells[0]], winningCells };
  }

  if (board.length === 9 && board.every((cell) => cell !== null)) {
    return { type: "draw", winner: null, winningCells: [] };
  }

  return null;
}

/**
 * Make a friendly opponent move: take a win, block a one-move loss, or pick
 * any open square. The optional random source keeps fallback moves testable.
 */
export function chooseComputerMove(board, random = Math.random) {
  const openCells = board
    .map((cell, index) => (cell === null ? index : -1))
    .filter((index) => index !== -1);

  if (openCells.length === 0) return -1;

  for (const index of openCells) {
    const nextBoard = [...board];
    nextBoard[index] = "O";
    if (findWinningCombination(nextBoard)) return index;
  }

  for (const index of openCells) {
    const nextBoard = [...board];
    nextBoard[index] = "X";
    if (findWinningCombination(nextBoard)) return index;
  }

  const randomIndex = Math.min(
    openCells.length - 1,
    Math.max(0, Math.floor(random() * openCells.length)),
  );
  return openCells[randomIndex];
}

/**
 * Keep the rules in a small, testable game session separate from the page.
 * A completed round can only score once because later moves are rejected.
 */
export function createGameSession(startingScores = EMPTY_SCORES) {
  let board = Array(9).fill(null);
  let currentPlayer = "X";
  let roundOutcome = null;
  const scores = {
    X: Number.isInteger(startingScores.X) ? startingScores.X : 0,
    O: Number.isInteger(startingScores.O) ? startingScores.O : 0,
    draws: Number.isInteger(startingScores.draws) ? startingScores.draws : 0,
  };

  function getState() {
    return {
      board: [...board],
      currentPlayer,
      roundOutcome: roundOutcome
        ? {
            ...roundOutcome,
            winningCells: [...roundOutcome.winningCells],
          }
        : null,
      scores: { ...scores },
    };
  }

  function play(index) {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index > 8 ||
      board[index] !== null ||
      roundOutcome
    ) {
      return { accepted: false, state: getState() };
    }

    board[index] = currentPlayer;
    roundOutcome = getRoundOutcome(board);

    if (roundOutcome?.type === "win") {
      scores[roundOutcome.winner] += 1;
    } else if (roundOutcome?.type === "draw") {
      scores.draws += 1;
    } else {
      currentPlayer = currentPlayer === "X" ? "O" : "X";
    }

    return { accepted: true, state: getState() };
  }

  function newGame() {
    board = Array(9).fill(null);
    currentPlayer = "X";
    roundOutcome = null;
    return getState();
  }

  function resetScores() {
    scores.X = 0;
    scores.O = 0;
    scores.draws = 0;
    return getState();
  }

  return { getState, play, newGame, resetScores };
}

function startGame() {
  const boardElement = document.querySelector("#game-board");
  const statusMessage = document.querySelector("#status-message");
  const playerXCard = document.querySelector("#player-x-card");
  const playerOCard = document.querySelector("#player-o-card");
  const scoreX = document.querySelector("#score-x");
  const scoreO = document.querySelector("#score-o");
  const scoreDraws = document.querySelector("#score-draws");
  const newGameButton = document.querySelector("#new-game");
  const resetScoreButton = document.querySelector("#reset-score");
  const resultPanel = document.querySelector("#result-panel");
  const resultMessage = document.querySelector("#result-message");
  const replayButton = document.querySelector("#replay-button");
  const twoPlayerButton = document.querySelector("#mode-two-player");
  const singlePlayerButton = document.querySelector("#mode-single-player");
  const playerXName = playerXCard?.querySelector(".player-name");
  const playerOName = playerOCard?.querySelector(".player-name");
  const playerXScoreLabel = playerXCard?.querySelector(".player-symbol-label");
  const playerOScoreLabel = playerOCard?.querySelector(".player-symbol-label");

  if (
    !boardElement ||
    !statusMessage ||
    !playerXCard ||
    !playerOCard ||
    !scoreX ||
    !scoreO ||
    !scoreDraws ||
    !newGameButton ||
    !resetScoreButton ||
    !resultPanel ||
    !resultMessage ||
    !replayButton ||
    !twoPlayerButton ||
    !singlePlayerButton ||
    !playerXName ||
    !playerOName ||
    !playerXScoreLabel ||
    !playerOScoreLabel
  ) {
    return;
  }

  statusMessage.setAttribute("role", "status");
  statusMessage.setAttribute("aria-live", "polite");
  resultPanel.setAttribute("aria-live", "polite");
  resultPanel.setAttribute("aria-atomic", "true");

  const cells = [...boardElement.querySelectorAll("[data-cell]")];
  if (cells.length !== 9) {
    statusMessage.textContent = "The game board could not be loaded.";
    return;
  }

  const scoresByMode = {
    "two-player": { ...EMPTY_SCORES },
    "single-player": { ...EMPTY_SCORES },
  };
  let playMode = "two-player";
  let game = createGameSession(scoresByMode[playMode]);
  let isComputerThinking = false;
  let computerTimer = null;

  function getPlayerName(mark) {
    if (playMode === "single-player") return mark === "X" ? "You" : "Computer";
    return mark === "X" ? "Player 1" : "Player 2";
  }

  function cancelComputerMove() {
    if (computerTimer !== null) {
      window.clearTimeout(computerTimer);
      computerTimer = null;
    }
    isComputerThinking = false;
  }

  function render() {
    const state = game.getState();
    const computerHasTurn =
      playMode === "single-player" &&
      state.currentPlayer === "O" &&
      !state.roundOutcome;
    scoresByMode[playMode] = state.scores;

    cells.forEach((cell, index) => {
      const mark = state.board[index];
      const row = Math.floor(index / 3) + 1;
      const column = (index % 3) + 1;

      cell.textContent = mark ?? "";
      cell.classList.toggle("mark-x", mark === "X");
      cell.classList.toggle("mark-o", mark === "O");
      cell.classList.toggle(
        "is-winning",
        Boolean(state.roundOutcome?.winningCells.includes(index)),
      );
      cell.disabled =
        mark !== null || state.roundOutcome !== null || computerHasTurn;

      if (mark) {
        cell.setAttribute(
          "aria-label",
          `Row ${row}, column ${column}. ${mark}, played by ${getPlayerName(mark)}.`,
        );
      } else if (state.roundOutcome) {
        cell.setAttribute(
          "aria-label",
          `Row ${row}, column ${column}. Empty. Round finished.`,
        );
      } else {
        cell.setAttribute(
          "aria-label",
          `Row ${row}, column ${column}. Empty. ${
            computerHasTurn ? "The computer's turn" : `${getPlayerName(state.currentPlayer)}'s turn`
          }.`,
        );
      }
    });

    scoreX.textContent = String(state.scores.X);
    scoreO.textContent = String(state.scores.O);
    scoreDraws.textContent = String(state.scores.draws);
    playerXName.textContent = playMode === "single-player" ? "You" : "Player 1";
    playerOName.textContent =
      playMode === "single-player" ? "Computer" : "Player 2";
    playerXScoreLabel.textContent =
      playMode === "single-player" ? "Your wins" : "Player X wins";
    playerOScoreLabel.textContent =
      playMode === "single-player" ? "Computer wins" : "Player O wins";
    playerXCard.setAttribute(
      "aria-label",
      playMode === "single-player" ? "You, X wins" : "Player 1, X wins",
    );
    playerOCard.setAttribute(
      "aria-label",
      playMode === "single-player" ? "Computer, O wins" : "Player 2, O wins",
    );

    twoPlayerButton.classList.toggle("is-active", playMode === "two-player");
    singlePlayerButton.classList.toggle("is-active", playMode === "single-player");
    twoPlayerButton.setAttribute(
      "aria-pressed",
      String(playMode === "two-player"),
    );
    singlePlayerButton.setAttribute(
      "aria-pressed",
      String(playMode === "single-player"),
    );

    const xIsActive = !state.roundOutcome && state.currentPlayer === "X";
    const oIsActive = !state.roundOutcome && state.currentPlayer === "O";
    playerXCard.classList.toggle("is-active", xIsActive);
    playerOCard.classList.toggle("is-active", oIsActive);

    if (xIsActive) {
      playerXCard.setAttribute("aria-current", "step");
      playerOCard.removeAttribute("aria-current");
    } else if (oIsActive) {
      playerOCard.setAttribute("aria-current", "step");
      playerXCard.removeAttribute("aria-current");
    } else {
      playerXCard.removeAttribute("aria-current");
      playerOCard.removeAttribute("aria-current");
    }

    if (state.roundOutcome?.type === "win") {
      const winner = state.roundOutcome.winner;
      if (playMode === "single-player") {
        const playerWon = winner === "X";
        statusMessage.textContent = playerWon
          ? "You win! Great moves!"
          : "The computer wins this round. Try again!";
        resultMessage.textContent = playerWon
          ? "You got three in a row! Fantastic job."
          : "The computer got three in a row. Ready for a rematch?";
      } else {
        statusMessage.textContent = `${getPlayerName(winner)} wins! Great game!`;
        resultMessage.textContent = `${getPlayerName(winner)} wins! You make a great team.`;
      }
      resultPanel.hidden = false;
      replayButton.hidden = false;
    } else if (state.roundOutcome?.type === "draw") {
      statusMessage.textContent = "It's a draw! You both played brilliantly.";
      resultMessage.textContent = "It's a draw! Ready for a rematch?";
      resultPanel.hidden = false;
      replayButton.hidden = false;
    } else {
      if (computerHasTurn) {
        statusMessage.textContent = isComputerThinking
          ? "Computer is thinking…"
          : "Computer is choosing a move.";
      } else if (playMode === "single-player") {
        statusMessage.textContent = "Your turn — place your X!";
      } else {
        statusMessage.textContent = `${getPlayerName(state.currentPlayer)}'s turn — place your ${state.currentPlayer}!`;
      }
      resultPanel.hidden = true;
      replayButton.hidden = true;
    }
  }

  function maybeScheduleComputerMove() {
    const state = game.getState();
    if (
      playMode !== "single-player" ||
      state.currentPlayer !== "O" ||
      state.roundOutcome
    ) {
      return;
    }

    isComputerThinking = true;
    render();
    computerTimer = window.setTimeout(() => {
      computerTimer = null;
      const latestState = game.getState();

      if (
        playMode !== "single-player" ||
        latestState.currentPlayer !== "O" ||
        latestState.roundOutcome
      ) {
        isComputerThinking = false;
        render();
        return;
      }

      const computerMove = chooseComputerMove(latestState.board);
      isComputerThinking = false;
      if (computerMove !== -1) game.play(computerMove);
      render();
    }, 420);
  }

  function playCell(cell) {
    const state = game.getState();
    if (
      isComputerThinking ||
      (playMode === "single-player" && state.currentPlayer !== "X")
    ) {
      return;
    }

    const index = cells.indexOf(cell);
    const move = game.play(index);
    if (move.accepted) {
      render();
      maybeScheduleComputerMove();
    }
  }

  function startNextRound() {
    cancelComputerMove();
    game.newGame();
    render();
    cells[0].focus();
  }

  function changeMode(nextMode) {
    if (nextMode === playMode) return;

    cancelComputerMove();
    scoresByMode[playMode] = game.getState().scores;
    playMode = nextMode;
    game = createGameSession(scoresByMode[playMode]);
    render();
    cells[0].focus();
  }

  cells.forEach((cell) => {
    cell.type = "button";
    cell.addEventListener("click", () => playCell(cell));
    cell.addEventListener("keydown", (event) => {
      const index = cells.indexOf(cell);
      if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        const orderedCells = event.key === "Home" ? cells : [...cells].reverse();
        orderedCells.find((candidate) => !candidate.disabled)?.focus();
        return;
      }

      if (!event.key.startsWith("Arrow")) return;

      event.preventDefault();
      let row = Math.floor(index / 3);
      let column = index % 3;
      const rowStep = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
      const columnStep =
        event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;

      // Continue along the row or column, skipping occupied cells.
      while (true) {
        row += rowStep;
        column += columnStep;
        if (row < 0 || row > 2 || column < 0 || column > 2) return;

        const target = cells[row * 3 + column];
        if (!target.disabled) {
          target.focus();
          return;
        }
      }
    });
  });

  newGameButton.addEventListener("click", startNextRound);
  replayButton.addEventListener("click", startNextRound);
  twoPlayerButton.addEventListener("click", () => changeMode("two-player"));
  singlePlayerButton.addEventListener("click", () => changeMode("single-player"));
  resetScoreButton.addEventListener("click", () => {
    if (!window.confirm("Reset all scores? This cannot be undone.")) return;

    game.resetScores();
    render();
    const state = game.getState();
    statusMessage.textContent = state.roundOutcome
      ? "Scores reset. Choose Play Again when you're ready."
      : "Scores reset. Your current game continues.";
  });

  render();
}

if (typeof document !== "undefined") {
  startGame();
}

