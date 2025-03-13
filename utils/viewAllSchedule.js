// показать все события

const { loadSchedule1 } = require("./loadSchedule1");

async function viewAllSchedule(ctx) {
  console.log("📌 Обработчик просмотра всех событий");

  const scheduleData = loadSchedule1().schedule1;
  if (!scheduleData) {
    return ctx.reply("❌ В файле расписания нет данных.");
  }

  return ctx.reply("📅 Все события:\n" + JSON.stringify(scheduleData, null, 2));
}

module.exports = viewAllSchedule;
