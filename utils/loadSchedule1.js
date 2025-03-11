const fs = require("fs");

// 📌 Функция для загрузки ролей из JSON-файла
function loadSchedule1() {
  try {
    const data = fs.readFileSync("./data/schedule1.json", "utf8"); // Читаем файл
    return JSON.parse(data); // Парсим JSON
  } catch (error) {
    console.error("Ошибка загрузки schedule1.json:", error);
    return {}; // Возвращаем пустой объект в случае ошибки
  }
}

module.exports = { loadSchedule1 };

// const fs = require("fs");

// function loadSchedule1() {
//   try {
//     const data = fs.readFileSync("./data/schedule1.json", "utf8");
//     console.log("✅ Загруженные данные из schedule1.json:", data);
//     return JSON.parse(data);
//   } catch (error) {
//     console.error("❌ Ошибка загрузки schedule1.json:", error);
//     return {}; // Возвращаем пустой объект при ошибке
//   }
// }

// module.exports = { loadSchedule1 };
