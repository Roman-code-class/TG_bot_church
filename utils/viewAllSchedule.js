// просмотр всего расписания

const { loadSchedule1 } = require("../utils/loadSchedule1");
const formatSchedule = require("../utils/formatSchedule");

async function viewAllSchedule(ctx) {
  const scheduleData = loadSchedule1().schedule1;
  if (!scheduleData) return ctx.reply("❌ В файле расписания нет данных.");

  const formattedText = formatSchedule(scheduleData);
  return ctx.replyWithMarkdown(formattedText);
}

module.exports = { viewAllSchedule }; // <-- Убедись, что экспорт правильный
