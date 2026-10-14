/* Хаб мини-приложения: список игр, тема Telegram, общий каркас экранов. */

import { snake } from "./games/snake.js";
import { g2048 } from "./games/g2048.js";
import { minesweeper } from "./games/minesweeper.js";
import { tictactoe } from "./games/tictactoe.js";

const GAMES = [snake, g2048, minesweeper, tictactoe];
const tg = window.Telegram?.WebApp ?? null;

const el = {
  hub: document.getElementById("hub"),
  screen: document.getElementById("screen"),
  area: document.getElementById("area"),
  actions: document.getElementById("actions"),
  back: document.getElementById("back"),
  title: document.getElementById("title"),
  subtitle: document.getElementById("subtitle"),
  score: document.getElementById("score"),
};

const HUB_TITLE = "🎮 Игровая";
const HUB_HINT = "Выбери игру — рекорды хранятся на устройстве";

let current = null;

function haptic(style = "light") {
  try {
    const haptics = tg?.HapticFeedback;
    if (!haptics) return;
    if (style === "success" || style === "error") haptics.notificationOccurred(style);
    else haptics.impactOccurred(style);
  } catch {
    /* в обычном браузере просто нет вибрации */
  }
}

/** Короткий конструктор элемента: h("div", "cell", "текст"). */
function h(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const api = {
  h,
  haptic,
  setScore(text) { el.score.textContent = text ?? ""; },
  setHint(text) { el.subtitle.textContent = text ?? HUB_HINT; },
  best(key) { return Number(localStorage.getItem(`best:${key}`) || 0); },
  saveBest(key, value) {
    if (value > api.best(key)) {
      localStorage.setItem(`best:${key}`, String(value));
      return true;
    }
    return false;
  },
};

// ── Хаб ─────────────────────────────────────────────────────────────────

function renderHub() {
  el.hub.innerHTML = "";
  for (const game of GAMES) {
    const best = api.best(game.id);
    const card = h("button", "card");
    card.append(
      h("span", "card__emoji", game.emoji),
      (() => {
        const body = h("span", "card__body");
        body.append(h("span", "card__title", game.title), h("span", "card__desc", game.desc));
        return body;
      })(),
    );
    if (best) card.append(h("span", "card__best", `рекорд ${best}`));
    card.addEventListener("click", () => openGame(game));
    el.hub.append(card);
  }
}

function openGame(game) {
  current?.destroy?.();
  current = game.mount({ area: el.area, actions: el.actions }, api) ?? null;
  el.hub.classList.add("hidden");
  el.screen.classList.remove("hidden");
  el.back.classList.remove("hidden");
  el.title.textContent = `${game.emoji} ${game.title}`;
  api.setScore("");
  api.setHint(game.hint ?? "");
  try { tg?.BackButton?.show?.(); } catch { /* не в Telegram */ }
  haptic();
}

function goHome() {
  current?.destroy?.();
  current = null;
  el.screen.classList.add("hidden");
  el.hub.classList.remove("hidden");
  el.back.classList.add("hidden");
  el.title.textContent = HUB_TITLE;
  api.setScore("");
  api.setHint(HUB_HINT);
  try { tg?.BackButton?.hide?.(); } catch { /* не в Telegram */ }
  renderHub();
}

// ── Запуск ──────────────────────────────────────────────────────────────

el.back.addEventListener("click", goHome);
try { tg?.BackButton?.onClick?.(goHome); } catch { /* не в Telegram */ }
window.addEventListener("popstate", goHome);

if (tg) {
  tg.ready();
  tg.expand?.();
  try { tg.setHeaderColor?.("secondary_bg_color"); } catch { /* старые клиенты */ }
  tg.onEvent?.("viewportChanged", () => {
    document.documentElement.style.setProperty("--viewport-height", `${tg.viewportHeight}px`);
  });
}

goHome();
