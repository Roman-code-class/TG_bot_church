const { Markup } = require("telegraf");
const eventNames = require("./eventNames"); // Подключаем список типов событий
const filterByEventType = require("./filterByEventType");
const { loadSchedule1 } = require("./loadSchedule1");

/**
 * Регистрация кнопок для фильтрации событий по типу
 * @param {Telegraf} bot - Экземпляр бота Telegraf
 * @param {string} actionName - Уникальное название действия, например: "мое_название_choose_schedule"
 */
function registerCustomEventButtons(bot, actionName) {
  // Кнопка выбора типа события
  bot.action(actionName, async (ctx) => {
    console.log(`📋 Выбор типа события (${actionName})`);

    const buttons = Object.entries(eventNames).map(([key, name]) =>
      Markup.button.callback(name, `${actionName}_${key}`)
    );

    await ctx.reply(
      "Выберите тип события:",
      Markup.inlineKeyboard(buttons, { columns: 2 })
    );
  });

  // Обработка нажатия на кнопку типа события
  Object.keys(eventNames).forEach((eventTypeKey) => {
    bot.action(`${actionName}_${eventTypeKey}`, async (ctx) => {
      console.log(`📩 Фильтрация событий по типу: ${eventTypeKey}`);

      const scheduleData = loadSchedule1().schedule1; // Загружаем данные расписания
      const filteredSchedule = filterByEventType(scheduleData, eventTypeKey);

      await ctx.reply(filteredSchedule || "❌ Нет данных.");
    });
  });
}

module.exports = registerCustomEventButtons;
