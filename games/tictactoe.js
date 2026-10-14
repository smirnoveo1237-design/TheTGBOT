/* ❌⭕ Крестики-нолики: против бота (minimax) или вдвоём. */

const X = "❌";
const O = "⭕";
const COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function winner(board) {
  for (const [a, b, c] of COMBOS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

const freeCells = (board) => board.map((cell, index) => (cell ? -1 : index)).filter((i) => i >= 0);

/** Оценка позиции: 1 — победа `me`, 0 — ничья, -1 — поражение. */
function minimax(board, me, turn) {
  const win = winner(board);
  if (win === me) return 1;
  if (win) return -1;
  const free = freeCells(board);
  if (!free.length) return 0;

  const scores = free.map((cell) => {
    board[cell] = turn;
    const score = minimax(board, me, turn === X ? O : X);
    board[cell] = "";
    return score;
  });
  return turn === me ? Math.max(...scores) : Math.min(...scores);
}

function bestMove(board) {
  let bestScore = -2;
  let bestCell = freeCells(board)[0];
  for (const cell of freeCells(board)) {
    board[cell] = O;
    const score = minimax(board, O, X);
    board[cell] = "";
    if (score > bestScore) {
      bestScore = score;
      bestCell = cell;
    }
  }
  return bestCell;
}

export const tictactoe = {
  id: "tictactoe",
  emoji: "❌⭕",
  title: "Крестики-нолики",
  desc: "Три в ряд против бота или с другом на одном телефоне.",
  hint: "Тапай клетку. Бот играет за ⭕ и не проигрывает",

  mount({ area, actions }, api) {
    area.innerHTML = "";
    actions.innerHTML = "";

    const grid = api.h("div", "grid");
    grid.style.gridTemplateColumns = "repeat(3, 1fr)";
    area.append(grid);
    const result = api.h("div", "result");
    area.append(result);

    const modeRow = api.h("div", "row");
    const twoPlayers = api.h("button", "btn btn--ghost", "👥 Вдвоём");
    const vsBot = api.h("button", "btn btn--ghost", "🤖 С ботом");
    twoPlayers.addEventListener("click", () => start("two"));
    vsBot.addEventListener("click", () => start("ai"));
    modeRow.append(twoPlayers, vsBot);

    const restart = api.h("button", "btn btn--ghost", "🔁 Заново");
    restart.addEventListener("click", () => start(mode));

    actions.append(modeRow, restart);

    let board = new Array(9).fill("");
    let mode = "ai";
    let turn = X;
    let over = false;
    const cells = [];

    for (let index = 0; index < 9; index++) {
      const cell = api.h("button", "cell");
      cell.addEventListener("click", () => play(index));
      grid.append(cell);
      cells.push(cell);
    }

    function render() {
      board.forEach((value, index) => {
        const cell = cells[index];
        cell.className = "cell";
        cell.textContent = value || "";
        if (value === X) cell.classList.add("cell--x");
        if (value === O) cell.classList.add("cell--o");
      });
    }

    function finish(text, success) {
      over = true;
      result.textContent = text;
      api.haptic(success ? "success" : "error");
    }

    function check() {
      const win = winner(board);
      if (win) {
        if (mode === "two") finish(`🎉 Победили ${win === X ? "крестики" : "нолики"}!`, true);
        else if (win === X) finish("🎉 Ты победил бота!", true);
        else finish("🤖 Бот выиграл. Ещё раз?", false);
        return true;
      }
      if (!freeCells(board).length) {
        finish("🤝 Ничья.", false);
        return true;
      }
      return false;
    }

    function botTurn() {
      const cell = bestMove([...board]);
      board[cell] = O;
      render();
    }

    function play(index) {
      if (over || board[index]) return;
      board[index] = mode === "ai" ? X : turn;
      render();
      api.haptic("light");
      if (check()) return;

      if (mode === "ai") {
        botTurn();
        check();
      } else {
        turn = turn === X ? O : X;
      }
    }

    function start(nextMode) {
      mode = nextMode;
      board = new Array(9).fill("");
      turn = X;
      over = false;
      result.textContent =
        mode === "ai" ? "Ты — ❌, бот — ⭕. Твой ход." : "Играете вдвоём: ❌ ходит первым.";
      api.haptic();
      render();
    }

    start("ai");
    return {};
  },
};
