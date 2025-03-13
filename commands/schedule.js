const fs = require("fs");
const { Markup } = require("telegraf");
const { loadRoles } = require("../utils/loadRoles");
const { loadSchedule1 } = require("../utils/loadSchedule1");
require("dotenv").config();

// Загружаем расписание и роли пользователей
const schedule = loadSchedule1();
const roles = loadRoles();

// Определение названий типов событий
const eventNames = {
  Sobitie1: "Воскресенье",
  Sobitie2: "Четверг",
  Sobitie3: "Молодежка",
  Sobitie4: "Ночная",
  Sobitie5: "Другое",
};

module.exports = (bot) => {
  // Основная команда для выбора фильтрации
  bot.command("schedule", (ctx) => {
    ctx.reply(
      "Выберите способ фильтрации:",
      Markup.inlineKeyboard([
        [Markup.button.callback("📋 Все события", "view_all")],
        [Markup.button.callback("🎭 По типу события", "choose_event")],
        [Markup.button.callback("👤 Моё расписание", "user_schedule")],
      ])
    );
  });

  // Обработчик для просмотра всех событий
  bot.action("view_all", (ctx) => {
    const response = formatSchedule(schedule.schedule1);
    ctx.reply(response || "❌ Расписание отсутствует.");
  });

  // Обработчик для выбора типа события
  bot.action("choose_event", (ctx) => {
    const eventTypes = Object.keys(eventNames).map((eventType) =>
      Markup.button.callback(eventNames[eventType], `event_type_${eventType}`)
    );
    ctx.reply(
      "Выберите событие:",
      Markup.inlineKeyboard(eventTypes, { columns: 2 })
    );
  });

  // Обработчик для фильтрации событий по типу
  bot.action(/event_type_(.+)/, (ctx) => {
    const selectedEventType = ctx.match[1];
    const selectedEventKey = Object.keys(eventNames).find(
      (key) => key === selectedEventType
    );
    const filteredEvents = formatSchedule(
      filterSchedule(schedule.schedule1, (event) => event[selectedEventKey])
    );
    ctx.reply(
      filteredEvents ||
        `❌ Нет событий для типа ${eventNames[selectedEventType]}`
    );
  });

  // Обработчик для просмотра расписания пользователя
  bot.action("user_schedule", (ctx) => {
    const userId = ctx.from.id.toString();
    const userName = Object.values(roles)
      .flat()
      .find((user) => user.id.toString() === userId)?.name;

    if (!userName) return ctx.reply("❌ Ваше имя не найдено в системе.");

    const filteredEvents = formatSchedule(
      filterSchedule(schedule.schedule1, (event) =>
        [event["zvuk"], event["svet"], event["screen"], event["group"]]
          .filter(Boolean)
          .some((field) => field.includes(userName))
      )
    );

    ctx.reply(filteredEvents || "❌ У вас нет запланированных событий.");
  });
};

// Функция форматирования расписания
function formatSchedule(scheduleData) {
  return Object.entries(scheduleData)
    .map(
      ([month, events]) =>
        `📅 ${month}:
` +
        events
          .map((event) => {
            let eventType = Object.entries(event)
              .filter(([key]) => key.startsWith("Sobitie"))
              .map(([_, value]) => `📝 ${value}`)
              .join("\n");
            return `📆 Дата: ${event.day}\n👥 Группа: ${
              event["group"] || "-"
            }\n📽 Экран: ${event["screen"] || "-"}\n💡 Свет: ${
              event["svet"] || "-"
            }\n🎶 Звук: ${event["zvuk"] || "-"}\n${eventType}\n`;
          })
          .join("\n")
    )
    .join("\n");
}

// Функция фильтрации расписания по заданному критерию
function filterSchedule(scheduleData, filterFn) {
  return Object.entries(scheduleData).reduce((acc, [month, events]) => {
    const filtered = events.filter(filterFn);
    if (filtered.length) acc[month] = filtered;
    return acc;
  }, {});
}
