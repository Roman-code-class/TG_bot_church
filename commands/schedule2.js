const { Markup } = require("telegraf");
const { loadSchedule1 } = require("../utils/loadSchedule1");
const fs = require("fs");

module.exports = (bot) => {
  bot.command("schedule2", (ctx) => {
    // Загружаем расписание (schedule1.json)
    const scheduleData = loadSchedule1().schedule1;
    const months = Object.keys(scheduleData); // ["Апрель", "Май", ...]

    // Создаём кнопки для каждого месяца
    const buttons = months.map((month) =>
      Markup.button.callback(month, `s2_month_${month}`)
    );

    ctx.reply(
      "Выберите месяц, для которого хотите создать расписание2:",
      Markup.inlineKeyboard(buttons, { columns: 2 })
    );
  });

  // Обработчик нажатия на месяц
  bot.action(/s2_month_(.+)/, (ctx) => {
    const chosenMonth = ctx.match[1]; // Например, "Апрель"

    // Загружаем список событий за этот месяц
    const scheduleData = loadSchedule1().schedule1;
    const events = scheduleData[chosenMonth] || [];

    if (!events.length) {
      return ctx.reply("Нет событий в этом месяце.");
    }

    // Для каждого события сделаем кнопку
    // Напр., назовём её "3 Воскресенье" или "day 3: Событие1" и т.д.
    // В callback зашьём что-то вроде s2_event_Апрель_индексСобытия
    const eventButtons = events.map((event, index) => {
      const day = event.day;
      // Можно собрать понятный заголовок
      let title = `День ${day}`;
      // Если есть ключ "Событие1", "Событие2" и т.д., можно добавить в title
      Object.entries(event).forEach(([key, value]) => {
        if (key.startsWith("Событие")) {
          title += ` | ${value}`;
        }
      });
      return Markup.button.callback(title, `s2_event_${chosenMonth}_${index}`);
    });

    ctx.reply(
      `События за месяц: ${chosenMonth}`,
      Markup.inlineKeyboard(eventButtons, { columns: 1 })
    );
  });

  // Обработчик выбора конкретного события
  bot.action(/s2_event_(.+)_(.+)/, (ctx) => {
    const chosenMonth = ctx.match[1]; // "Апрель"
    const eventIndex = parseInt(ctx.match[2]); // индекс события

    // Подтверждаем выбор события
    ctx.reply(
      `Добавить расписание2 для события №${
        eventIndex + 1
      } в месяце ${chosenMonth}?`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            "Добавить расписание2",
            `s2_add_${chosenMonth}_${eventIndex}`
          ),
        ],
      ])
    );
  });

  // Обработчик "Добавить расписание2"
  bot.action(/s2_add_(.+)_(.+)/, (ctx) => {
    const chosenMonth = ctx.match[1];
    const eventIndex = parseInt(ctx.match[2]);

    // Спрашиваем: пошагово или одной строкой
    ctx.reply(
      "Как хотите создать расписание2?",
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            "Пошагово",
            `s2_mode_step_${chosenMonth}_${eventIndex}`
          ),
        ],
        [
          Markup.button.callback(
            "Одной строкой",
            `s2_mode_text_${chosenMonth}_${eventIndex}`
          ),
        ],
      ])
    );
  });

  // Тут дальше реализуем логику пошагового/текстового ввода.
};
