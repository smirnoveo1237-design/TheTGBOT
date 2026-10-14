/* 🐍 Змейка на canvas: свайпы, стрелки, экранная крестовина. */

const SIZE = 16;            // клеток по стороне
const CELL = 22;            // пикселей на клетку
const STEP_BASE = 135;      // мс на шаг в начале
const STEP_MIN = 65;

const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function cssVar(name, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/** Скруглённый прямоугольник — с запасным вариантом для старых WebView. */
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, height, radius);
    return;
  }
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

export const snake = {
  id: "snake",
  emoji: "🐍",
  title: "Змейка",
  desc: "Собирай яблоки, расти и не кусай себя.",
  hint: "Свайпы по полю, стрелки на клавиатуре или крестовина снизу",

  mount({ area, actions }, api) {
    area.innerHTML = "";
    actions.innerHTML = "";

    const canvas = document.createElement("canvas");
    canvas.className = "canvas";
    canvas.width = canvas.height = SIZE * CELL;
    area.append(canvas);
    const ctx = canvas.getContext("2d");

    const result = api.h("div", "result");
    area.append(result);

    const dpad = api.h("div", "dpad");
    const layout = [
      ["up", "▲", "1 / 2"], ["left", "◀", "2 / 1"],
      ["down", "▼", "2 / 2"], ["right", "▶", "2 / 3"],
    ];
    for (const [name, label, spot] of layout) {
      const button = api.h("button", "dpad__btn", label);
      button.style.gridArea = spot;
      button.addEventListener("click", () => turn(name));
      dpad.append(button);
    }
    actions.append(dpad);

    const restart = api.h("button", "btn btn--ghost", "🔁 Заново");
    restart.classList.add("hidden");
    restart.addEventListener("click", start);
    actions.append(restart);

    let cells = [];
    let dir = DIRS.right;
    let queue = [];
    let food = { x: 0, y: 0 };
    let score = 0;
    let stepMs = STEP_BASE;
    let timer = null;
    let over = false;
    let touchStart = null;

    function freeCell() {
      for (let attempt = 0; attempt < 999; attempt++) {
        const cell = { x: (Math.random() * SIZE) | 0, y: (Math.random() * SIZE) | 0 };
        if (!cells.some((part) => part.x === cell.x && part.y === cell.y)) return cell;
      }
      return { x: 0, y: 0 };
    }

    function turn(name) {
      const next = DIRS[name];
      const last = queue.length ? queue[queue.length - 1] : dir;
      if (next.x === -last.x && next.y === -last.y) return;   // разворот на 180° нельзя
      if (next.x === last.x && next.y === last.y) return;     // и повтор направления тоже
      if (queue.length < 2) queue.push(next);
      api.haptic("light");
    }

    function draw() {
      ctx.fillStyle = cssVar("--card", "#f2f3f7");
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#e0574a";
      ctx.beginPath();
      ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL * 0.32, 0, Math.PI * 2);
      ctx.fill();

      const head = cssVar("--button", "#2f8ce0");
      cells.forEach((part, index) => {
        ctx.globalAlpha = index === 0 ? 1 : Math.max(0.45, 1 - index / (cells.length + 6));
        ctx.fillStyle = head;
        const pad = index === 0 ? 1.5 : 2.5;
        roundRect(ctx, part.x * CELL + pad, part.y * CELL + pad, CELL - pad * 2, CELL - pad * 2, 6);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    function end() {
      over = true;
      clearInterval(timer);
      timer = null;
      const record = api.saveBest("snake", score);
      result.textContent = record
        ? `Рекорд! 🏆 Длина ${cells.length}, счёт ${score}`
        : `Игра окончена. Счёт ${score}, рекорд ${api.best("snake")}`;
      restart.classList.remove("hidden");
      api.haptic("error");
    }

    function step() {
      if (over) return;
      if (queue.length) dir = queue.shift();

      const next = { x: cells[0].x + dir.x, y: cells[0].y + dir.y };
      if (next.x < 0 || next.y < 0 || next.x >= SIZE || next.y >= SIZE) return end();

      // хвост уползёт на этом же шаге, поэтому его клетка свободна
      const tail = cells[cells.length - 1];
      const bite = cells.some(
        (part) => part.x === next.x && part.y === next.y && !(part.x === tail.x && part.y === tail.y),
      );
      if (bite) return end();

      cells.unshift(next);
      if (next.x === food.x && next.y === food.y) {
        score += 1;
        api.setScore(`🍎 ${score} · рекорд ${Math.max(score, api.best("snake"))}`);
        api.haptic("light");
        food = freeCell();
        if (stepMs > STEP_MIN) {
          stepMs -= 5;
          clearInterval(timer);
          timer = setInterval(step, stepMs);
        }
      } else {
        cells.pop();
      }
      draw();
    }

    function start() {
      clearInterval(timer);
      cells = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }];
      dir = DIRS.right;
      queue = [];
      score = 0;
      stepMs = STEP_BASE;
      over = false;
      food = freeCell();
      result.textContent = "";
      restart.classList.add("hidden");
      api.setScore(`🍎 0 · рекорд ${api.best("snake")}`);
      draw();
      timer = setInterval(step, stepMs);
    }

    // ── управление ────────────────────────────────────────────────────
    const KEYS = {
      arrowup: "up", arrowdown: "down", arrowleft: "left", arrowright: "right",
      w: "up", s: "down", a: "left", d: "right",
      ц: "up", ы: "down", ф: "left", в: "right",
    };
    function onKey(event) {
      const name = KEYS[String(event.key || "").toLowerCase()];
      if (!name) return;
      event.preventDefault();
      turn(name);
    }
    document.addEventListener("keydown", onKey);

    canvas.addEventListener("touchstart", (event) => {
      touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }, { passive: true });

    canvas.addEventListener("touchend", (event) => {
      if (!touchStart) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - touchStart.x;
      const dy = touch.clientY - touchStart.y;
      touchStart = null;
      if (Math.hypot(dx, dy) < 24) return;
      turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
    });

    start();

    return {
      destroy() {
        clearInterval(timer);
        document.removeEventListener("keydown", onKey);
      },
    };
  },
};
