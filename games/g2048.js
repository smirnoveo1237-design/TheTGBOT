/* 🔢 2048 — плитки, сдвиги и склейки. */

import { arrowKeys, dpad, swipe } from "./ui.js";

const N = 4;
const GOAL = 2048;

export const g2048 = {
  id: "g2048",
  emoji: "🔢",
  title: "2048",
  desc: "Свайпай и складывай плитки, пока не соберёшь 2048.",
  hint: "Свайпы, крестовина или стрелки. Ходы — в сторону, куда сдвигаются плитки",

  mount({ area, actions }, api) {
    area.innerHTML = "";
    actions.innerHTML = "";

    const grid = api.h("div", "grid");
    grid.style.gridTemplateColumns = `repeat(${N}, 1fr)`;
    const tiles = [];
    for (let index = 0; index < N * N; index++) {
      const tile = api.h("div", "tile");
      tiles.push(tile);
      grid.append(tile);
    }
    area.append(grid);

    const result = api.h("div", "result");
    area.append(result);

    dpad(actions, api, move);
    swipe(grid, move);
    const offKeys = arrowKeys(move);

    const restart = api.h("button", "btn btn--ghost", "🔁 Заново");
    restart.addEventListener("click", start);
    actions.append(restart);

    let board = new Array(N * N).fill(0);
    let score = 0;
    let over = false;
    let won = false;

    function emptyCells() {
      return board.reduce((list, value, index) => (value ? list : [...list, index]), []);
    }

    function spawn() {
      const free = emptyCells();
      if (!free.length) return;
      const index = free[(Math.random() * free.length) | 0];
      board[index] = Math.random() < 0.9 ? 2 : 4;
    }

    function render() {
      board.forEach((value, index) => {
        const tile = tiles[index];
        tile.dataset.v = value ? String(value) : "";
        tile.textContent = value ? String(value) : "";
        tile.classList.toggle("tile--big", value > GOAL);
      });
      api.setScore(`🏆 ${score} · рекорд ${Math.max(score, api.best("g2048"))}`);
    }

    /** Сдвиг одной линии к её началу с склейкой одинаковых плиток. */
    function moveLine(indexes) {
      const values = indexes.map((index) => board[index]).filter(Boolean);
      const merged = [];
      for (let i = 0; i < values.length; i++) {
        if (values[i] === values[i + 1]) {
          merged.push(values[i] * 2);
          score += values[i] * 2;
          i += 1;
        } else {
          merged.push(values[i]);
        }
      }
      while (merged.length < indexes.length) merged.push(0);

      let changed = false;
      indexes.forEach((index, position) => {
        if (board[index] !== merged[position]) changed = true;
        board[index] = merged[position];
      });
      return changed;
    }

    function canMove() {
      if (emptyCells().length) return true;
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          const value = board[r * N + c];
          if (c + 1 < N && value === board[r * N + c + 1]) return true;
          if (r + 1 < N && value === board[(r + 1) * N + c]) return true;
        }
      }
      return false;
    }

    function checkEnd() {
      if (!won && board.some((value) => value >= GOAL)) {
        won = true;
        result.textContent = "🎉 2048 собрано! Можно играть дальше.";
        api.haptic("success");
      }
      if (canMove()) return;
      over = true;
      const record = api.saveBest("g2048", score);
      result.textContent = record
        ? `Рекорд! 🏆 Счёт ${score}`
        : `Ходов больше нет. Счёт ${score}, рекорд ${api.best("g2048")}`;
      restart.classList.remove("hidden");
      api.haptic("error");
    }

    function move(dir) {
      if (over) return;
      const rows = [];
      const cols = [];
      for (let r = 0; r < N; r++) {
        const line = [];
        for (let c = 0; c < N; c++) line.push(r * N + c);
        rows.push(line);
      }
      for (let c = 0; c < N; c++) {
        const line = [];
        for (let r = 0; r < N; r++) line.push(r * N + c);
        cols.push(line);
      }

      const lines = dir === "left" || dir === "right" ? rows : cols;
      let changed = false;
      for (const line of lines) {
        const ordered = dir === "left" || dir === "up" ? line : [...line].reverse();
        if (moveLine(ordered)) changed = true;
      }
      if (!changed) {
        api.haptic("error");
        return;
      }

      spawn();
      render();
      api.haptic("light");
      checkEnd();
    }

    function start() {
      board = new Array(N * N).fill(0);
      score = 0;
      over = false;
      won = false;
      result.textContent = "";
      restart.classList.add("hidden");
      spawn();
      spawn();
      render();
    }

    start();

    return { destroy: offKeys };
  },
};
