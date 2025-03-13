const { Markup } = require("telegraf");
const viewAllSchedule = require("../utils/viewAllSchedule");
const userSessions = require("../utils/userSessions");

module.exports = (bot) => {
  bot.command("createSchedule", (ctx) => {
    ctx.reply(
      "Выберите способ фильтрации событий:",
      Markup.inlineKeyboard([
        [Markup.button.callback("📋 Все события", "create_all")],
        [Markup.button.callback("🎭 По типу события", "create_by_type")],
        [Markup.button.callback("🔙 Отмена", "create_cancel")],
      ])
    );
  });

  // показать все события
  bot.action("create_all", async (ctx) => {
    await viewAllSchedule(ctx);
  });
};
