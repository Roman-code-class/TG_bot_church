// определение роли

const roles = require("../data/roles.json"); // Подключаем файл ролей

/**
 * Получает роль пользователя по его Telegram ID.
 * @param {number} userId - ID пользователя в Telegram
 * @returns {string | null} - Название роли или null, если не найден
 */
function getUserRole(userId) {
  userId = userId.toString(); // Приводим к строке для единообразия

  for (const [role, users] of Object.entries(roles)) {
    if (users.some((user) => user.id.toString() === userId)) {
      return role; // Возвращаем найденную роль
    }
  }
  return null; // Если роль не найдена
}

/**
 * Получает имя пользователя по его ID.
 * @param {number} userId - ID пользователя в Telegram
 * @returns {string | null} - Имя пользователя или null, если не найден
 */
function getUserName(userId) {
  userId = userId.toString();

  for (const users of Object.values(roles)) {
    const foundUser = users.find((user) => user.id.toString() === userId);
    if (foundUser) {
      return foundUser.name; // Возвращаем имя пользователя
    }
  }
  return null;
}

module.exports = { getUserRole, getUserName };

// Проверка роли пользователя

// const { getUserRole, getUserName } = require("./utils/userRoleManager");

// bot.command("whoami", async (ctx) => {
//   const userId = ctx.from.id;
//   const role = getUserRole(userId);
//   const name = getUserName(userId);

//   if (!role) {
//     return ctx.reply("❌ Вы не зарегистрированы в системе.");
//   }

//   return ctx.reply(`👤 Вы: ${name} | Ваша роль: ${role}`);
// });
