// команда - просмотр собыйти
const { Markup } = require("telegraf");
const { viewAllSchedule } = require("../utils/viewAllSchedule");
const registerCustomEventButtons = require("../utils/registerCustomEventButtons");
const { getUserSchedule } = require("../utils/userSchedule");
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

  registerCustomEventButtons(bot, "view_choose_event");

  bot.action("view_user_schedule", async (ctx) => {
    const userId = ctx.from.id; // Получаем ID пользователя
    const response = getUserSchedule(userId);
    ctx.reply(response);
  });
};
