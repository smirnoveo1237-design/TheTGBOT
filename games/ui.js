/* Общие мелочи для игр: крестовина, свайпы, клавиатура. */

export function dpad(parent, api, onDir) {
  const pad = api.h("div", "dpad");
  const layout = [
    ["up", "▲", "1 / 2"], ["left", "◀", "2 / 1"],
    ["down", "▼", "2 / 2"], ["right", "▶", "2 / 3"],
  ];
  for (const [name, label, spot] of layout) {
    const button = api.h("button", "dpad__btn", label);
    button.style.gridArea = spot;
    button.addEventListener("click", () => onDir(name));
    pad.append(button);
  }
  parent.append(pad);
  return pad;
}

/** Свайпы по элементу: вызывает onDir("up" | "down" | "left" | "right"). */
export function swipe(element, onDir) {
  let start = null;
  element.addEventListener("touchstart", (event) => {
    start = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }, { passive: true });

  element.addEventListener("touchend", (event) => {
    if (!start) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    start = null;
    if (Math.hypot(dx, dy) < 24) return;
    onDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
  });
}

/** Стрелки и WASD. Возвращает функцию отписки. */
export function arrowKeys(onDir) {
  const MAP = {
    arrowup: "up", arrowdown: "down", arrowleft: "left", arrowright: "right",
    w: "up", s: "down", a: "left", d: "right",
    ц: "up", ы: "down", ф: "left", в: "right",
  };
  const handler = (event) => {
    const name = MAP[String(event.key || "").toLowerCase()];
    if (!name) return;
    event.preventDefault();
    onDir(name);
  };
  document.addEventListener("keydown", handler);
  return () => document.removeEventListener("keydown", handler);
}
