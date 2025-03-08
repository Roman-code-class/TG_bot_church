const { loadRoles } = require("../utils/loadRoles");

// 📌 Функция для проверки, является ли пользователь администратором
function isAdmin(userId) {
  const roles = loadRoles();
  return roles.admin && roles.admin.some((user) => user.id === userId);
}

module.exports = { isAdmin };
