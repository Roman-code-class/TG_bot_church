// 📌 Функция для экранирования спецсимволов в MarkdownV2
function escapeMarkdown(text) {
  return text
    .replace(/([_*[\]()~`>#+\-=|{}.!])/g, "\\$1") // Экранируем спецсимволы
    .replace(/-/g, "\\-"); // Экранируем дефис
}

module.exports = { escapeMarkdown };
