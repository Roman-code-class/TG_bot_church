// commands/schedule2.js
const { Markup } = require("telegraf");
const fs = require("fs");
const { loadSchedule1 } = require("../utils/loadSchedule1");

const userSessions = {};

// Опционально, переименование типов для удобства (можно оставить ключи как есть)
const eventNames = {
  Событие1: "Воскресенье",
  Событие2: "Четверг",
  Событие3: "Молодежка",
  Событие4: "Ночная",
  Событие5: "Другое",
};

module.exports = (bot) => {
  // (1) Команда /schedule2 → показать список месяцев
  bot.command("schedule2", (ctx) => {
    const scheduleData = loadSchedule1().schedule1; // { "Апрель": [...], "Май": [...], ... }
    const months = Object.keys(scheduleData);
    if (!months.length) {
      return ctx.reply("Нет ни одного месяца в schedule1.json");
    }
    const monthButtons = months.map((m) =>
      Markup.button.callback(m, `s2_month_${m}`)
    );
    ctx.reply(
      "Выберите месяц, для которого хотите создать расписание2:",
      Markup.inlineKeyboard(monthButtons, { columns: 2 })
    );
  });

  // (2) Выбор месяца → собрать все типы событий (Событие1, Событие2, ...)
  bot.action(/s2_month_(.+)/, (ctx) => {
    const chosenMonth = ctx.match[1];
    const scheduleData = loadSchedule1().schedule1;
    const monthEvents = scheduleData[chosenMonth] || [];
    if (!monthEvents.length) {
      return ctx.reply(`В месяце ${chosenMonth} нет событий.`);
    }
    // Собираем уникальные ключи вида "Событие1", "Событие2", ...
    const eventTypesSet = new Set();
    monthEvents.forEach((ev) => {
      for (const key in ev) {
        if (key.startsWith("Событие")) {
          eventTypesSet.add(key);
        }
      }
    });
    if (!eventTypesSet.size) {
      return ctx.reply(`В месяце ${chosenMonth} нет типов событий (СобытиеX).`);
    }
    // Создаем кнопки для каждого типа (отображая человеко-понятное название)
    const buttons = [...eventTypesSet].map((typeKey) =>
      Markup.button.callback(
        eventNames[typeKey] || typeKey,
        `s2_type_${chosenMonth}_${typeKey}`
      )
    );
    ctx.reply(
      `Выберите тип события в месяце ${chosenMonth}:`,
      Markup.inlineKeyboard(buttons, { columns: 2 })
    );
  });

  // (3) Выбор типа события → показать список событий в формате "день - название"
  bot.action(/s2_type_(.+)_(.+)/, (ctx) => {
    const chosenMonth = ctx.match[1]; // например, "Апрель"
    const chosenType = ctx.match[2]; // например, "Событие1"
    const scheduleData = loadSchedule1().schedule1;
    const monthEvents = scheduleData[chosenMonth] || [];

    // Фильтруем события, где присутствует chosenType и есть indexId
    const filteredEvents = monthEvents.filter(
      (ev) => ev[chosenType] !== undefined && ev.indexId
    );

    if (!filteredEvents.length) {
      return ctx.reply(
        `Нет событий для типа ${
          eventNames[chosenType] || chosenType
        } в месяце ${chosenMonth}.`
      );
    }
    // Сохраняем отфильтрованный список в сессию
    const userId = ctx.from.id;
    userSessions[userId] = userSessions[userId] || {};
    userSessions[userId].filteredEvents = filteredEvents;
    userSessions[userId].chosenMonth = chosenMonth;
    userSessions[userId].chosenType = chosenType;

    // Создаем кнопки; в label выводим только день и название, а в callback data скрываем indexId
    const eventButtons = filteredEvents.map((ev) => {
      const day = ev.day;
      const eventName = ev[chosenType];
      const indexId = ev.indexId; // уникальный идентификатор
      const buttonLabel = `${day} - ${eventName}`;
      return Markup.button.callback(
        buttonLabel,
        `s2_event|${chosenMonth}|${chosenType}|${indexId}`
      );
    });
    ctx.reply(
      "Выберите конкретное событие:",
      Markup.inlineKeyboard(eventButtons, { columns: 1 })
    );
  });

  // (4) Обработка выбора конкретного события – используем vertical bar как разделитель
  bot.action(/^s2_event\|(.+)\|(.+)\|(.+)$/, (ctx) => {
    const chosenMonth = ctx.match[1];
    const chosenType = ctx.match[2];
    const chosenIndexId = ctx.match[3];
    const scheduleData = loadSchedule1().schedule1;
    const monthEvents = scheduleData[chosenMonth] || [];
    // Ищем событие с нужным indexId
    const chosenEvent = monthEvents.find((ev) => ev.indexId === chosenIndexId);
    if (!chosenEvent) {
      return ctx.reply("Не удалось найти выбранное событие по indexId.");
    }
    const userId = ctx.from.id;
    userSessions[userId] = {
      chosenMonth,
      chosenType,
      chosenEvent, // сохраняем весь объект события
    };
    ctx.reply(
      `Вы выбрали событие: ${chosenEvent.day} - ${chosenEvent[chosenType]}.\nДобавить расписание2 для этого события?`,
      Markup.inlineKeyboard([
        [Markup.button.callback("Добавить расписание2", "s2_add")],
      ])
    );
  });

  // (5) После выбора события – выбрать способ ввода расписания2
  bot.action("s2_add", (ctx) => {
    const userId = ctx.from.id;
    const session = userSessions[userId];
    if (!session)
      return ctx.reply("Ошибка: нет данных для добавления расписания2.");
    ctx.reply(
      "Как хотите ввести расписание2?",
      Markup.inlineKeyboard([
        [Markup.button.callback("Пошагово", "s2_mode_step")],
        [Markup.button.callback("Одной строкой", "s2_mode_text")],
      ])
    );
  });

  // (6) Пошаговый режим
  bot.action("s2_mode_step", (ctx) => {
    const userId = ctx.from.id;
    const session = userSessions[userId];
    if (!session) return ctx.reply("Нет сессии для пошагового режима.");
    session.mode = "step";
    session.step = 1;
    session.programData = {};
    ctx.reply("Пошаговый ввод. Шаг 1: введите текст первого пункта...");
  });

  // (7) Режим "одной строкой"
  bot.action("s2_mode_text", (ctx) => {
    const userId = ctx.from.id;
    const session = userSessions[userId];
    if (!session) return ctx.reply("Нет сессии для режима одной строки.");
    session.mode = "single_text";
    ctx.reply("Введите всё расписание одним сообщением:");
  });

  // (8) Обработка текстовых сообщений (в обоих режимах)
  bot.on("text", async (ctx, next) => {
    const userId = ctx.from.id;
    const session = userSessions[userId];

    // Если нет активной сессии для schedule2 – просто передаем дальше,
    // чтобы другие обработчики (команды) могли сработать
    if (!session) {
      return next();
    }

    // Режим "step"
    if (session.mode === "step") {
      if (session.step === 1) {
        session.programData.step1 = ctx.message.text;
        session.step = 2;
        return ctx.reply("Шаг 2: введите текст второго пункта.");
      }
      if (session.step === 2) {
        session.programData.step2 = ctx.message.text;
        session.step = 3;
        return ctx.reply("Шаг 3: введите текст третьего пункта.");
      }
      if (session.step === 3) {
        session.programData.step3 = ctx.message.text;
        session.step = 999;
        let preview = "Расписание2 (пошагово):\n";
        preview += `1) ${session.programData.step1}\n`;
        preview += `2) ${session.programData.step2}\n`;
        preview += `3) ${session.programData.step3}\n`;
        return ctx.reply(
          preview + "\nПодтвердить?",
          Markup.inlineKeyboard([
            [
              Markup.button.callback("✅ Подтвердить", "s2_confirm"),
              Markup.button.callback("❌ Отмена", "s2_cancel"),
            ],
          ])
        );
      }
      // Если session.step не 1/2/3, никаких действий не нужно: пропускаем дальше
      return next();
    }

    // Режим "single_text"
    if (session.mode === "single_text") {
      session.textData = ctx.message.text;
      return ctx.reply(
        `Вы ввели:\n${session.textData}\n\nПодтвердить?`,
        Markup.inlineKeyboard([
          [
            Markup.button.callback("✅ Подтвердить", "s2_confirm"),
            Markup.button.callback("❌ Отмена", "s2_cancel"),
          ],
        ])
      );
    }

    // Если session существует, но не подошло под step или single_text – пропускаем дальше
    return next();
  });

  // (9) Подтверждение – отправка расписания2 в тему "расписание2"
  bot.action("s2_confirm", async (ctx) => {
    const userId = ctx.from.id;
    const session = userSessions[userId];
    if (!session || !session.chosenEvent)
      return ctx.reply("Нет данных для подтверждения.");
    let finalText = "Расписание2 для выбранного события:\n\n";
    finalText += `Месяц: ${session.chosenMonth}\n`;
    finalText += `Тип: ${session.chosenType}\n`;
    finalText += `Событие: ${session.chosenEvent.day} - ${
      session.chosenEvent[session.chosenType]
    } (ID: ${session.chosenEvent.indexId})\n\n`;
    if (session.mode === "step") {
      finalText += `1) ${session.programData.step1}\n`;
      finalText += `2) ${session.programData.step2}\n`;
      finalText += `3) ${session.programData.step3}\n`;
    } else {
      finalText += session.textData;
    }
    const chatId = process.env.CHAT_ID;
    const topicId = process.env.SCHEDULE2_TOPIC_ID;
    let sentMsg;
    try {
      sentMsg = await ctx.telegram.sendMessage(chatId, finalText, {
        message_thread_id: topicId,
      });
    } catch (error) {
      console.error("Ошибка отправки расписания2:", error);
      return ctx.reply("Не удалось отправить сообщение в тему расписание2.");
    }
    // Если нужно, здесь можно сохранить sentMsg.message_id для последующего редактирования/удаления.
    delete userSessions[userId];
    ctx.reply("Расписание2 успешно создано и отправлено!");
  });

  // (10) Отмена
  bot.action("s2_cancel", (ctx) => {
    const userId = ctx.from.id;
    delete userSessions[userId];
    ctx.reply("Добавление расписания2 отменено.");
  });
};
