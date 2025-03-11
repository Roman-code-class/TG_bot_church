const { isAdmin } = require("../utils/isAdmin"); // Импортируем функцию isAdmin
const { Markup } = require("telegraf"); // Импортируем Markup для клавиатуры

module.exports = (bot) => {
  // Обработчик для команды /menu
  bot.command("menu", (ctx) => {
    const userId = ctx.from.id; // Получаем ID пользователя
    let menuText =
      "📜 <b>Список доступных команд:</b>\n\n" +
      "/start - Запуск бота\n" +
      "/help - Помощь\n" +
      "/about - О боте\n" +
      "/schedule1 - расписание мероприятий";

    // Если пользователь администратор, добавляем команду /roles в меню
    if (isAdmin(userId)) {
      menuText += "\n/roles - Список ролей";
    }

    ctx.replyWithHTML(menuText); // Отправляем сообщение в HTML-формате
  });
};

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

// about.js — обработчик команды /about
module.exports = (bot) => {
  bot.command("about", (ctx) => {
    ctx.reply(
      "📄 Этот бот был создан для удобного управления ролями и командами в группе."
    );
  });
};
