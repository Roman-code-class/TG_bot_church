// help.js — обработчик команды /help
module.exports = (bot) => {
  bot.command("help", (ctx) => {
    ctx.reply(
      "⚙️ Это твой помощник-бот. Вот список команд:\n\n" +
        "/start - Запуск бота\n" +
        "/help - Помощь по использованию бота\n" +
        "/about - О боте\n" +
        "/schedule1 - расписание мероприятий"
    );
  });
};
