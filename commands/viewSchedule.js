const { Markup } = require("telegraf");
const viewAllSchedule = require("../utils/viewAllSchedule");
const userSessions = require("../utils/userSessions");

module.exports = (bot) => {
  bot.command("viewSchedule", (ctx) => {
    ctx.reply(
      "Выберите способ просмотра расписания:",
      Markup.inlineKeyboard([
        [Markup.button.callback("📋 Все события", "view_all")],
        [Markup.button.callback("🎭 По типу события", "view_choose_event")],
        [Markup.button.callback("👤 Моё расписание", "view_user_schedule")],
      ])
    );
  });

  // показать все события
  bot.action("view_all", async (ctx) => {
    await viewAllSchedule(ctx);
  });
};
