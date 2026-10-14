/* 💣 Сапёр: поле на кнопках, мины появляются после первого хода. */

const LEVELS = [
  { name: "Новичок", size: 9, mines: 10 },
  { name: "Любитель", size: 12, mines: 25 },
];

export const minesweeper = {
  id: "minesweeper",
  emoji: "💣",
  title: "Сапёр",
  desc: "Открой все клетки, кроме мин. Первый ход всегда безопасен.",
  hint: "Тап — открыть клетку. Режим 🚩 — ставить флажки",

  mount({ area, actions }, api) {
    area.innerHTML = "";
    actions.innerHTML = "";

    const grid = api.h("div", "grid");
    area.append(grid);
    const result = api.h("div", "result");
    area.append(result);

    const levels = api.h("div", "row");
    const levelButtons = LEVELS.map((level) => {
      const button = api.h("button", "btn btn--ghost", `${level.name} ${level.size}×${level.size}`);
      button.addEventListener("click", () => start(level));
      levels.append(button);
      return button;
    });

    const modeButton = api.h("button", "btn btn--ghost", "🚩 Флажки");
    modeButton.addEventListener("click", () => {
      mode = mode === "open" ? "flag" : "open";
      modeButton.textContent = mode === "open" ? "🚩 Флажки" : "🕳 Копать";
      api.setHint(mode === "open" ? "Режим: открывать клетки" : "Режим: ставить флажки");
      api.haptic();
    });

    const restart = api.h("button", "btn btn--ghost", "🔁 Заново");
    restart.addEventListener("click", () => start(currentLevel));

    actions.append(levels, modeButton, restart);

    let size = 0;
    let mines = 0;
    let currentLevel = LEVELS[0];
    let mineSet = new Set();
    let opened = new Set();
    let flags = new Set();
    let cells = [];
    let mode = "open";
    let firstMove = true;
    let over = false;

    const key = (r, c) => `${r}:${c}`;

    function neighbors(r, c) {
      const list = [];
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const rr = r + dr;
          const cc = c + dc;
          if (rr >= 0 && cc >= 0 && rr < size && cc < size) list.push([rr, cc]);
        }
      }
      return list;
    }

    const countAt = (r, c) => neighbors(r, c).filter(([rr, cc]) => mineSet.has(key(rr, cc))).length;

    /** Мины ставим после первого хода, чтобы он был безопасным. */
    function placeMines(safeR, safeC) {
      const pool = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
          pool.push(key(r, c));
        }
      }
      mineSet = new Set();
      while (mineSet.size < mines && pool.length) {
        const index = (Math.random() * pool.length) | 0;
        mineSet.add(pool.splice(index, 1)[0]);
      }
    }

    function render() {
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const cell = cells[r][c];
          const cellKey = key(r, c);
          cell.className = "cell";
          if (over && mineSet.has(cellKey)) {
            cell.textContent = "💣";
            if (opened.has(cellKey)) cell.classList.add("cell--mine");
            continue;
          }
          if (opened.has(cellKey)) {
            const value = countAt(r, c);
            cell.textContent = value ? String(value) : "";
            cell.classList.add("cell--opened");
            if (value) cell.classList.add(`cell--n${value}`);
          } else if (flags.has(cellKey)) {
            cell.textContent = "🚩";
            cell.classList.add("cell--flag");
          } else {
            cell.textContent = "";
          }
        }
      }
      api.setScore(`🚩 ${flags.size} · открыто ${opened.size}/${size * size - mines}`);
    }

    function finish(win) {
      over = true;
      if (win) {
        const record = api.saveBest(`mines:${size}`, size * size - mines);
        result.textContent = record ? "🎉 Разминировано! Рекорд поля." : "🎉 Разминировано!";
        api.haptic("success");
      } else {
        result.textContent = "💥 Подрыв! Попробуй ещё раз.";
        api.haptic("error");
      }
      render();
    }

    function openCell(r, c) {
      const cellKey = key(r, c);
      if (over || flags.has(cellKey) || opened.has(cellKey)) return;
      if (firstMove) {
        placeMines(r, c);
        firstMove = false;
      }
      if (mineSet.has(cellKey)) {
        opened.add(cellKey);
        finish(false);
        return;
      }

      const stack = [[r, c]];
      while (stack.length) {
        const [cr, cc] = stack.pop();
        const current = key(cr, cc);
        if (opened.has(current) || flags.has(current) || mineSet.has(current)) continue;
        opened.add(current);
        if (countAt(cr, cc) === 0) stack.push(...neighbors(cr, cc));
      }

      if (opened.size === size * size - mines) finish(true);
      else render();
    }

    function toggleFlag(r, c) {
      const cellKey = key(r, c);
      if (over || opened.has(cellKey)) return;
      if (flags.has(cellKey)) flags.delete(cellKey);
      else flags.add(cellKey);
      api.haptic("light");
      render();
    }

    function start(level) {
      currentLevel = level;
      size = level.size;
      mines = level.mines;
      mineSet = new Set();
      opened = new Set();
      flags = new Set();
      firstMove = true;
      over = false;
      result.textContent = "";
      grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
      grid.innerHTML = "";
      cells = [];
      for (let r = 0; r < size; r++) {
        const row = [];
        for (let c = 0; c < size; c++) {
          const cell = api.h("button", "cell");
          cell.addEventListener("click", () => (mode === "open" ? openCell(r, c) : toggleFlag(r, c)));
          grid.append(cell);
          row.push(cell);
        }
        cells.push(row);
      }
      api.setHint(`Поле ${size}×${size}, мин ${mines}. Первый ход безопасен.`);
      render();
    }

    start(currentLevel);
    return {};
  },
};
