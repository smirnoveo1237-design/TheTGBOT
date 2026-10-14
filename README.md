# 🎮 Игровая — Telegram Mini App

Мини-приложение с играми для Telegram: канвас, свайпы, тема клиента, рекорды.
Чистая статика, без сборки и зависимостей — открывается просто как веб-страница
и подходит для GitHub Pages.

## Игры

| Игра | Файл |
|---|---|
| 🐍 Змейка | [games/snake.js](games/snake.js) |
| 🔢 2048 | [games/g2048.js](games/g2048.js) |
| 💣 Сапёр | [games/minesweeper.js](games/minesweeper.js) |
| ❌⭕ Крестики-нолики | [games/tictactoe.js](games/tictactoe.js) |

## Локально

```bash
python -m http.server 8000
# открыть http://localhost:8000
```

## В Telegram

Приложение открывается по https-ссылке — например, адресу этого репозитория,
если включён GitHub Pages (Settings → Pages → Source: main / root).
В боте адрес прописывается в переменную `WEBAPP_URL`.

## Как добавить игру

Модуль в `games/` с одним интерфейсом:

```js
export const myGame = {
  id: "mygame",
  emoji: "🙂",
  title: "Моя игра",
  desc: "Одна строка для карточки в хабе.",
  hint: "Подсказка в шапке",
  mount({ area, actions }, api) {
    // рисуем в area, кнопки — в actions
    // api: h(), setScore(), setHint(), haptic(), best(), saveBest()
    return { destroy() { /* отписки и таймеры */ } };
  },
};
```

и одна строка в списке `GAMES` в [app.js](app.js).
