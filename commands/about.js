// about.js — обработчик команды /about
module.exports = (bot) => {
  bot.command("about", (ctx) => {
    ctx.reply(
      "📄 Этот бот был создан для удобного управления ролями и командами в группе."
    );
  });
};
