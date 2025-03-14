// фильтрация по типу

const eventNames = require("./eventNames");
const formatSchedule = require("./formatSchedule");

// Функция для фильтрации событий по типу
function filterByEventType(scheduleData, eventTypeKey) {
  if (!scheduleData || Object.keys(scheduleData).length === 0) {
    return "❌ В файле расписания нет данных.";
  }

  // Фильтруем события по заданному типу
  const filteredEvents = Object.fromEntries(
    Object.entries(scheduleData)
      .map(([month, events]) => {
        const filtered = events.filter((event) => event[eventTypeKey]);
        return filtered.length ? [month, filtered] : null;
      })
      .filter(Boolean) // Убираем пустые результаты
  );

  if (Object.keys(filteredEvents).length === 0) {
    return `❌ Нет событий для типа ${
      eventNames[eventTypeKey] || eventTypeKey
    }`;
  }

  return formatSchedule(filteredEvents); // Форматируем и возвращаем отфильтрованный список
}

module.exports = filterByEventType;
