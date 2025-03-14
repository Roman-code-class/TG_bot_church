// форматирование - вид событий в распиании

function formatSchedule(scheduleData) {
  if (!scheduleData || Object.keys(scheduleData).length === 0) {
    return "❌ Расписание отсутствует.";
  }

  let formattedText = "📅 Расписание событий:\n\n";

  Object.entries(scheduleData).forEach(([month, events]) => {
    formattedText += `📆 *${month}*\n\n`; // Заголовок месяца

    events.forEach((event) => {
      // Определяем название события
      let eventTypeKey = Object.keys(event).find((k) =>
        k.startsWith("Sobitie")
      );
      let eventName = eventTypeKey ? event[eventTypeKey] : "Без названия";

      formattedText += `📍 *${event.day} число* - ${eventName}\n`;
      formattedText += `👥 Группа: ${event.group || "-"}\n`;
      formattedText += `🎤 Звук: ${event.zvuk || "-"}\n`;
      formattedText += `💡 Свет: ${event.svet || "-"}\n`;
      formattedText += `📽 Экран: ${event.screen || "-"}\n`;
      formattedText += "--------------------\n";
    });
  });

  return formattedText;
}

module.exports = formatSchedule;
