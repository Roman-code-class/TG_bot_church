require("dotenv").config();
const fs = require("fs"); // Подключаем файловую систему
const { Telegraf, Markup } = require("telegraf"); // Импортируем Telegraf и Markup
const { loadRoles } = require("./utils/loadRoles");
const { logError } = require("./data/logs"); // Импортируем функцию logError

const bot = new Telegraf(process.env.BOT_TOKEN); // Создаем бота

// 📌 Функция для проверки доступа пользователя
// function hasAccess(userId) {
//   const roles = loadRoles(); // Загружаем роли из файла
//   const allUsers = Object.values(roles).flat(); // Объединяем всех пользователей по ролям
//   return allUsers.some((user) => user.id === userId); // Проверяем, есть ли пользователь в списке
// }

// 📌 Middleware для проверки прав перед выполнением команд
// bot.use((ctx, next) => {
//   console.log("Middleware: получено сообщение", ctx.message);
//   const userId = ctx.from.id; // Получаем ID пользователя

// Проверяем, есть ли пользователь в списке разрешенных
//   if (!hasAccess(userId)) {
//     return ctx.reply(
//       "❌ Доступ закрыт. Вы не имеете прав для использования бота."
//     );
//   }

//   return next(); // Если доступ есть, продолжаем выполнение команды
// });

// Загружаем и регистрируем все команды
const commandFiles = [
  "start",
  "menu",
  "help",
  "about",
  "roles",
  "schedule1",
  "schedule2",
  "viewSchedule",
];
commandFiles.forEach((file) => {
  require(`./commands/${file}`)(bot); // Подключаем и передаем bot
});

// Команда для тестирования ошибки
// bot.command("test_error", (ctx) => {
//   try {
//     throw new Error("Это тестовая ошибка для логов");
//   } catch (error) {
//     logError(bot, error); // Логируем ошибку
//     ctx.reply("Ошибка сгенерирована и отправлена в логи.");
//   }
// });

// Запускаем бота
bot.launch().then(() => {
  console.log("Бот успешно запущен!");
});

// bot.on("text", (ctx) => {
//   console.log("Поступило текстовое сообщение:", ctx.message.text);
// });

// 📌 Корректное завершение работы бота
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
