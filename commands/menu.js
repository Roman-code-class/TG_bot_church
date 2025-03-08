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
