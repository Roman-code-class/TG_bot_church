const fs = require("fs");
const { Markup } = require("telegraf");
const { loadRoles } = require("../utils/loadRoles");
const { loadSchedule1 } = require("../utils/loadSchedule1");

// Загружаем расписание и роли
const schedule = loadSchedule1();
const roles = loadRoles();

// Привязка типов событий к отображаемым названиям
const eventNames = {
  Событие1: "Воскресенье",
  Событие2: "Четверг",
  Событие3: "Молодежка",
  Событие4: "Ночная",
  Событие5: "Другое",
};

module.exports = (bot) => {
  bot.command("schedule1", (ctx) => {
    ctx.reply(
      "Выберите режим просмотра:",
      Markup.inlineKeyboard([
        [Markup.button.callback("📋 Все события", "view_all")],
        [Markup.button.callback("🎭 По типу события", "choose_event")],
        [Markup.button.callback("👤 Моё расписание", "user_schedule")],
      ])
    );
  });

  // Просмотр всех событий
  bot.action("view_all", (ctx) => {
    const response = formatSchedule(schedule.schedule1);
    ctx.reply(response || "❌ Расписание отсутствует.");
  });

  // Выбор типа события (например, Событие1, Событие2)
  bot.action("choose_event", (ctx) => {
    const eventTypes = [];
    Object.values(schedule.schedule1)
      .flat()
      .forEach((event) => {
        // Ищем только ключи, начинающиеся с "Событие"
        Object.keys(event).forEach((key) => {
          if (key.startsWith("Событие") && !eventTypes.includes(key)) {
            eventTypes.push(key);
          }
        });
      });

    // Создаем кнопки для каждого типа события
    const buttons = eventTypes.map((eventType) => {
      const eventName = eventNames[eventType] || eventType; // Используем название события
      return Markup.button.callback(eventName, `event_${eventType}`);
    });

    ctx.reply(
      "Выберите событие:",
      Markup.inlineKeyboard(buttons, { columns: 2 })
    );
  });

  // Отображение событий по выбранному типу события (например, Событие1)
  bot.action(/event_(.+)/, (ctx) => {
    const selectedEventType = ctx.match[1];
    const selectedEventName =
      eventNames[selectedEventType] || selectedEventType; // Получаем имя события
    // Фильтруем события по выбранному типу события (Событие1, Событие2 и т.д.)
    const filteredEvents = filterEvents(schedule.schedule1, (event) =>
      Object.hasOwn(event, selectedEventType)
    );
    ctx.reply(filteredEvents || `❌ Нет событий для типа ${selectedEventName}`);
  });

  // Фильтрация по пользователю

  bot.action("user_schedule", (ctx) => {
    const userId = ctx.from.id.toString();

    // Находим имя пользователя по его Telegram ID
    let userName = "";
    for (const role in roles) {
      const foundUser = roles[role].find(
        (user) => user.id.toString() === userId
      );
      if (foundUser) {
        userName = foundUser.name;
        break;
      }
    }

    if (!userName) {
      return ctx.reply("❌ Ваше имя не найдено в системе.");
    }

    // Фильтруем события, где указан этот пользователь
    const filteredEvents = filterEvents(
      schedule.schedule1,
      (event) =>
        userName === event["звук"] ||
        userName === event["свет"] ||
        userName === event["экран"] ||
        (event["группа"] && event["группа"].includes(userName))
    );

    ctx.reply(filteredEvents || "❌ У вас нет запланированных событий.");
  });
};

// Форматирование расписания
function formatSchedule(scheduleData) {
  let responseText = "";
  for (let month in scheduleData) {
    responseText += `\n📅 ${month}:\n`;
    scheduleData[month].forEach((event) => {
      responseText += `📆 Дата: ${event.day}\n👥 Группа: ${
        event["группа"] || "-"
      }\n📽 Экран: ${event["экран"] || "-"}\n💡 Свет: ${
        event["свет"] || "-"
      }\n🎶 Звук: ${event["звук"] || "-"}\n`;
      Object.entries(event).forEach(([key, value]) => {
        if (key.startsWith("Событие")) responseText += `📝 ${value}\n`;
      });
      responseText += "\n";
    });
  }
  return responseText;
}

// Фильтрация событий по типу события (например, Событие1, Событие2)
function filterEvents(scheduleData, filterFn) {
  let responseText = "";
  for (let month in scheduleData) {
    const filtered = scheduleData[month].filter(filterFn);
    if (filtered.length) {
      responseText += `\n📅 ${month}:\n`;
      filtered.forEach((event) => {
        responseText += `📆 Дата: ${event.day}\n👥 Группа: ${
          event["группа"] || "-"
        }\n📽 Экран: ${event["экран"] || "-"}\n💡 Свет: ${
          event["свет"] || "-"
        }\n🎶 Звук: ${event["звук"] || "-"}\n`;
        Object.entries(event).forEach(([key, value]) => {
          if (key.startsWith("Событие")) responseText += `📝 ${value}\n`;
        });
        responseText += "\n";
      });
    }
  }
  return responseText;
}
