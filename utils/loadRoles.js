const fs = require("fs");

// // 📌 Функция для загрузки ролей из JSON-файла
// function loadRoles() {
//   try {
//     const data = fs.readFileSync("./data/roles.json", "utf8"); // Читаем файл
//     return JSON.parse(data); // Парсим JSON
//   } catch (error) {
//     console.error("Ошибка загрузки roles.json:", error);
//     return {}; // Возвращаем пустой объект в случае ошибки
//   }
// }

// module.exports = { loadRoles };

let cachedRoles = null;

function loadRoles() {
  if (!cachedRoles) {
    try {
      const data = fs.readFileSync("./data/roles.json", "utf8");
      cachedRoles = JSON.parse(data);
    } catch (error) {
      console.error("Ошибка загрузки roles.json:", error);
      cachedRoles = {};
    }
  }
  return cachedRoles;
}

module.exports = { loadRoles };
