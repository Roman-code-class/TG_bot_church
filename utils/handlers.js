module.exports = (bot) => {
  bot.action(/^view_/, async (ctx) => {
    console.log(`📩 Обработчик: просмотр расписания -> ${ctx.match[0]}`);
    await require("../commands/viewingSchedule").handleViewingSchedule(
      ctx,
      ctx.match[0]
    );
  });

  bot.action(/^create_/, async (ctx) => {
    console.log(`📝 Обработчик: создание расписания -> ${ctx.match[0]}`);
    await require("../commands/createSchedule").handleCreatingSchedule(
      ctx,
      ctx.match[0]
    );
  });

  bot.on("text", async (ctx) => {
    const userId = ctx.from.id;
    const session = require("../commands/createSchedule").userSessions[userId];

    if (!session) return;

    if (session.mode === "text") {
      session.textData = ctx.message.text;
      return require("../commands/createSchedule").confirmSchedule(ctx);
    } else if (session.mode === "step") {
      session.scheduleData[`Шаг ${session.step}`] = ctx.message.text;
      session.step++;

      if (session.step > 2) {
        return require("../commands/createSchedule").confirmSchedule(ctx);
      } else {
        return ctx.reply(`📝 Введите пункт ${session.step}:`);
      }
    }
  });
};
