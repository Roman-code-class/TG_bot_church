// roles.js — обработчик команды /roles
const { loadRoles } = require("../utils/loadRoles");
const { escapeMarkdown } = require("../utils/escapeMarkdown");

module.exports = (bot) => {
  bot.command("roles", (ctx) => {
    const roles = loadRoles(); // Загрузка ролей из файла
    const userId = ctx.from.id;

    if (!roles.admin.some((user) => user.id === userId)) {
      return ctx.reply(
        "❌ У вас недостаточно прав для использования этой команды."
      );
    }

    let responseText = "📜 <b>Список ролей и пользователей:</b>\n\n";

    for (const [role, users] of Object.entries(roles)) {
      let roleName = "";

      switch (role) {
        case "admin":
          roleName = "👑 <b>Администраторы</b>";
          break;
        case "organizer_1":
          roleName = "📌 <b>Организаторы 1 уровня</b>";
          break;
        case "organizer_2":
          roleName = "📌 <b>Организаторы 2 уровня</b>";
          break;
        case "organizer_3":
          roleName = "📌 <b>Организаторы 3 уровня</b>";
          break;
        case "guest":
          roleName = "🧑‍💼 <b>Гости</b>";
          break;
      }

      responseText += `${roleName}:\n`;
      if (users.length === 0) {
        responseText += "<i>Нет пользователей</i>\n";
      } else {
        users.forEach((user) => {
          responseText += `- <i>${escapeMarkdown(user.name)}</i> (ID: <code>${
            user.id
          }</code>)\n`;
        });
      }
      responseText += "\n";
    }

    ctx.replyWithHTML(responseText);
  });
};
