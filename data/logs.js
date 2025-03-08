const fs = require("fs");
const path = require("path");

const CHAT_ID = process.env.LOG_CHAT_ID; // ID чата BD_info_grace
const TOPIC_ID = process.env.LOG_TOPIC_ID; // ID темы "логи"

function logError(bot, error) {
  const timestamp = new Date().toISOString();
  const errorMessage = `[${timestamp}] ERROR: ${
    error.stack || error.message || error
  }`;

  // Записываем в файл
  const logFilePath = path.join(__dirname, "errors.log");
  fs.appendFileSync(logFilePath, errorMessage + "\n", "utf8");

  // Отправляем в чат BD_info_grace в тему "логи"
  bot.telegram
    .sendMessage(CHAT_ID, `#логи\n\`${errorMessage}\``, {
      parse_mode: "Markdown",
      message_thread_id: TOPIC_ID, // Указываем тему
    })
    .catch(console.error);
}

module.exports = { logError };
