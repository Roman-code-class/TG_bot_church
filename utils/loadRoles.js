const fs = require("fs");

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
