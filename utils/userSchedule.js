// события по пользователю

const { loadSchedule1 } = require("../utils/loadSchedule1");
const { getUserName } = require("./userRoleManager");
const formatSchedule = require("./formatSchedule");

/**
 * Фильтрует и возвращает расписание событий для пользователя.
 * @param {number} userId - ID пользователя Telegram
 * @returns {string} - Отформатированный список событий
 */
function getUserSchedule(userId) {
  const scheduleData = loadSchedule1().schedule1;
  if (!scheduleData) return "❌ В файле расписания нет данных.";

  const userName = getUserName(userId);
  if (!userName) return "❌ Ваше имя не найдено в системе.";

  // Фильтрация событий, где участвует пользователь
  const filteredEvents = Object.fromEntries(
    Object.entries(scheduleData)
      .map(([month, events]) => {
        const filtered = events.filter((event) =>
          [event.zvuk, event.svet, event.screen, event.group]
            .filter(Boolean)
            .some((field) => field.includes(userName))
        );
        return filtered.length ? [month, filtered] : null;
      })
      .filter(Boolean) // Убираем пустые месяцы
  );

  if (Object.keys(filteredEvents).length === 0) {
    return "❌ У вас нет запланированных событий.";
  }

  return formatSchedule(filteredEvents); // Форматируем и возвращаем отфильтрованный список
}

module.exports = { getUserSchedule };

//  примеры использования
// const { getUserSchedule } = require("./utils/userSchedule");

// bot.command("mySchedule", async (ctx) => {
//   const userId = ctx.from.id;
//   const response = getUserSchedule(userId);
//   ctx.reply(response);
// });

// bot.action("view_user_schedule", async (ctx) => {
//     const userId = ctx.from.id; // Получаем ID пользователя
//     const response = getUserSchedule(userId);
//     ctx.reply(response);
//   });
