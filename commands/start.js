const { Markup } = require("telegraf"); // Импортируем Markup
// start.js — обработчик команды /start
module.exports = (bot) => {
  bot.start((ctx) => {
    const welcomeMessage = `
        👋 Привет, <b>${ctx.from.first_name}!</b>
        Я — <b>твой умный Telegram-бот</b>!

        🌟 Я помогу тебе с задачами и обеспечу удобный доступ ко всем нужным функциям.

        Вот что ты можешь сделать:
        📝 <b>/start</b> — запустить меня снова.
        🗂️ <b>/createSchedule</b> — меню пользователя.
        🗂️ <b>/viewSchedule</b> — меню пользователя.
      `;
    const menuKeyboard = Markup.keyboard([["📜 Меню"]]).resize();
    ctx.reply(welcomeMessage, {
      parse_mode: "HTML",
      reply_markup: menuKeyboard,
    });
  });
};
