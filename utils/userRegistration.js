// регистрация поьзователя

const fs = require("fs");
const path = require("path");
const rolesFilePath = path.join(__dirname, "../data/roles.json"); // Путь к файлу ролей
const roles = require(rolesFilePath);

/**
 * Регистрирует нового пользователя в системе
 * @param {number} userId - Telegram ID пользователя
 * @param {string} userName - Имя пользователя
 * @param {string} role - Роль пользователя (например, "guest", "admin")
 * @returns {string} - Сообщение о результате операции
 */
function registerUser(userId, userName, role) {
  userId = userId.toString();

  if (!roles[role]) {
    return `❌ Ошибка: Роль "${role}" не существует.`;
  }

  if (roles[role].some((user) => user.id.toString() === userId)) {
    return `✅ Пользователь уже зарегистрирован как ${role}.`;
  }

  // Добавляем пользователя в нужную роль
  roles[role].push({ id: Number(userId), name: userName });

  // Записываем обновленные данные обратно в файл
  fs.writeFileSync(rolesFilePath, JSON.stringify(roles, null, 2));

  return `✅ Пользователь ${userName} успешно зарегистрирован как ${role}.`;
}

module.exports = { registerUser };

// Регистрация нового пользователя

// const { registerUser } = require("./utils/userRegistration");

// bot.command("register", async (ctx) => {
//   const args = ctx.message.text.split(" ");
//   if (args.length < 3) {
//     return ctx.reply("❌ Используйте команду в формате: /register [имя] [роль]");
//   }

//   const userId = ctx.from.id;
//   const userName = args[1];
//   const role = args[2];

//   const response = registerUser(userId, userName, role);
//   return ctx.reply(response);
// });
