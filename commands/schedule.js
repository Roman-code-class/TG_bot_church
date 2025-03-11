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
      return Markup.button.callback(eventName, `s1_event_${eventType}`);
    });

    ctx.reply(
      "Выберите событие:",
      Markup.inlineKeyboard(buttons, { columns: 2 })
    );
  });

  // Отображение событий по выбранному типу события (например, Событие1)
  bot.action(/s1_event_(.+)/, (ctx) => {
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

// commands/schedule2.js
const userSessions = {};

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
    if (!session) return ctx.reply("❌ Нет данных для подтверждения.");

    let finalText = `📌 Расписание2 для события:\n\n`;
    finalText += `📆 Дата: ${session.chosenMonth}, день ${
      session.chosenEvent.day
    } (${session.chosenEvent[session.chosenType]})\n\n`;

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
        message_thread_id: topicId, // ID темы "Расписание2"
      });

      console.log(
        `✅ Расписание2 отправлено, message_id: ${sentMsg.message_id}, thread_id: ${topicId}`
      );
    } catch (error) {
      console.error("❌ Ошибка отправки расписания2:", error);
      return ctx.reply("❌ Не удалось отправить расписание2.");
    }

    // **СОХРАНЯЕМ message_id и thread_id В schedule1.json**
    const scheduleData = loadSchedule1().schedule1;
    const events = scheduleData[session.chosenMonth] || [];
    const eventObj = events[session.eventIndex];

    if (!eventObj) {
      return ctx.reply("❌ Ошибка: событие не найдено в JSON.");
    }

    // Записываем `id` (message_id) и `thread_id` (message_thread_id)
    eventObj.id = sentMsg.message_id;
    eventObj.thread_id = topicId; // Сохраняем ID темы

    events[session.eventIndex] = eventObj;
    scheduleData[session.chosenMonth] = events;

    // Перезаписываем `schedule1.json`
    fs.writeFileSync(
      "./data/schedule1.json",
      JSON.stringify(scheduleData, null, 2),
      "utf8"
    );

    console.log(
      `✅ message_id (${sentMsg.message_id}) и thread_id (${topicId}) сохранены в schedule1.json`
    );
    delete userSessions[userId];
    ctx.reply("✅ Расписание2 успешно создано и сохранено!");
  });

  // (10) Отмена
  bot.action("s2_cancel", (ctx) => {
    const userId = ctx.from.id;
    delete userSessions[userId];
    ctx.reply("Добавление расписания2 отменено.");
  });
};

module.exports = (bot) => {
  // 1️⃣ Команда /viewSchedule → показывает список месяцев
  bot.command("viewSchedule", (ctx) => {
    console.log("✅ Команда /viewSchedule вызвана");

    let scheduleData;
    try {
      scheduleData = loadSchedule1();
      console.log("🛠 Структура загруженных данных:", scheduleData);
    } catch (error) {
      console.error("❌ Ошибка загрузки schedule1.json:", error);
      return ctx.reply("❌ Произошла ошибка при загрузке расписания.");
    }

    if (!scheduleData || !scheduleData.schedule1) {
      return ctx.reply("❌ В файле schedule1.json нет событий.");
    }

    const months = Object.keys(scheduleData.schedule1);
    if (!months.length) {
      return ctx.reply("❌ В файле schedule1.json нет событий.");
    }

    const buttons = months.map((month) =>
      Markup.button.callback(month, `vs_month_${month}`)
    );

    ctx.reply(
      "📅 Выберите месяц для просмотра расписания:",
      Markup.inlineKeyboard(buttons, { columns: 2 })
    );
  });

  // 2️⃣ Выбор месяца → показывает список событий (кнопки)
  bot.action(/vs_month_(.+)/, (ctx) => {
    const chosenMonth = ctx.match[1];
    console.log(`✅ Выбран месяц: ${chosenMonth}`);

    let scheduleData;
    try {
      scheduleData = loadSchedule1();
    } catch (error) {
      console.error("❌ Ошибка загрузки schedule1.json:", error);
      return ctx.reply("❌ Произошла ошибка при загрузке расписания.");
    }

    if (!scheduleData.schedule1[chosenMonth]) {
      return ctx.reply(`❌ В месяце ${chosenMonth} нет событий.`);
    }

    const eventsArray = scheduleData.schedule1[chosenMonth];

    if (!eventsArray.length) {
      return ctx.reply(`❌ В месяце ${chosenMonth} нет событий.`);
    }

    const eventButtons = eventsArray.map((ev) => {
      const day = ev.day;
      let eventTypeName = "";

      for (const key in ev) {
        if (key.startsWith("Событие")) {
          eventTypeName = eventNames[key] || ev[key];
          break;
        }
      }

      const label = `${day} – ${eventTypeName || "Событие"}`;
      return Markup.button.callback(
        label,
        `vs_event_${chosenMonth}_${ev.indexId}`
      );
    });

    ctx.reply(
      `📆 События за месяц ${chosenMonth}:`,
      Markup.inlineKeyboard(eventButtons, { columns: 1 })
    );
  });

  // 3️⃣ Нажатие на событие → показывает подробную информацию + кнопку "📋 Посмотреть расписание"
  bot.action(/vs_event_(.+)_(.+)/, (ctx) => {
    const chosenMonth = ctx.match[1];
    const targetId = ctx.match[2];

    console.log(`✅ Выбрано событие: ${chosenMonth}, indexId: ${targetId}`);

    let scheduleData;
    try {
      scheduleData = loadSchedule1();
    } catch (error) {
      console.error("❌ Ошибка загрузки schedule1.json:", error);
      return ctx.reply("❌ Произошла ошибка при загрузке расписания.");
    }

    const eventsArray = scheduleData.schedule1[chosenMonth] || [];
    const event = eventsArray.find((ev) => ev.indexId === targetId);

    if (!event) {
      return ctx.reply("❌ Ошибка: событие не найдено.");
    }

    let eventTypeName = "";
    for (const key in event) {
      if (key.startsWith("Событие")) {
        eventTypeName = eventNames[key] || event[key];
        break;
      }
    }

    let info = `📅 <b>${chosenMonth}:</b>\n`;
    info += `📆 <b>Дата:</b> ${event.day}\n`;
    info += `👥 <b>Группа:</b> ${event["группа"] || "-"}\n`;
    info += `📽 <b>Экран:</b> ${event["экран"] || "-"}\n`;
    info += `💡 <b>Свет:</b> ${event["свет"] || "-"}\n`;
    info += `🎶 <b>Звук:</b> ${event["звук"] || "-"}\n`;
    info += `📝 <b>${eventTypeName}</b>\n`;

    if (event.id) {
      info += `<b>Расписание2:</b>\n`;
      info += `🔹 Введите команду: <code>/расписание2 ${event.indexId}</code>\n\n`;

      ctx.replyWithHTML(
        info,
        Markup.inlineKeyboard([
          Markup.button.callback(
            "📋 Посмотреть расписание",
            `get_schedule_${event.indexId}`
          ),
        ])
      );
    } else {
      info += `❌ <b>Расписание2 не создано</b>\n`;
      ctx.replyWithHTML(info);
    }
  });

  // 4️⃣ Обработчик кнопки "📋 Посмотреть расписание"
  bot.action(/get_schedule_(.+)/, async (ctx) => {
    const targetId = ctx.match[1];
    const scheduleData = loadSchedule1().schedule1;
    let targetEvent = null;

    for (const month in scheduleData) {
      const events = scheduleData[month];
      targetEvent = events.find((ev) => ev.indexId === targetId);
      if (targetEvent) break;
    }

    if (!targetEvent) {
      return ctx.reply(`❌ Событие с ID ${targetId} не найдено.`);
    }

    if (!targetEvent.id || !targetEvent.thread_id) {
      return ctx.reply(
        "❌ Расписание2 для этого события ещё не создано или не содержит тему."
      );
    }

    try {
      console.log(
        `📩 Пересылаем сообщение с message_id: ${targetEvent.id}, thread_id: ${targetEvent.thread_id}`
      );

      await ctx.telegram.forwardMessage(
        ctx.chat.id,
        process.env.CHAT_ID,
        targetEvent.id,
        { message_thread_id: targetEvent.thread_id }
      );

      console.log(
        `✅ Успешно переслал расписание2 (message_id: ${targetEvent.id})`
      );
    } catch (error) {
      console.error("❌ Ошибка пересылки расписания2:", error);
      return ctx.reply("❌ Не удалось получить расписание2.");
    }
  });

  // 5️⃣ Команда /расписание2 → пересылает расписание2 по `id`
  bot.command("расписание2", async (ctx) => {
    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
      return ctx.reply(
        "❗ Используйте команду так: /расписание2 ID_события\n\nПример: `/расписание2 1.1`",
        { parse_mode: "Markdown" }
      );
    }

    const targetId = args[1];
    console.log(`✅ Введена команда /расписание2 для ID: ${targetId}`);

    // Передаём выполнение обработчику кнопки
    ctx.match = [`get_schedule_${targetId}`];
    bot.handleUpdate({
      callback_query: {
        id: ctx.update.message.message_id,
        from: ctx.from,
        data: `get_schedule_${targetId}`,
      },
    });
  });
};
