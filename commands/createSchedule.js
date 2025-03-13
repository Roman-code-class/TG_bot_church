const { Markup } = require("telegraf");
const { loadSchedule1 } = require("../utils/loadSchedule1");
const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config();

const eventNames = {
  Sobitie1: "Воскресенье",
  Sobitie2: "Четверг",
  Sobitie3: "Молодежка",
  Sobitie4: "Ночная",
  Sobitie5: "Другое",
};

const userSessions = {}; // Сессии пользователей

// 📌 Команда /createSchedule
module.exports.initCreateScheduleCommand = (bot) => {
  bot.command("createSchedule", async (ctx) => {
    console.log("✅ Команда /createSchedule вызвана");

    ctx.reply(
      "Выберите способ фильтрации событий:",
      Markup.inlineKeyboard([
        [Markup.button.callback("📋 Все события", "create_all")],
        [Markup.button.callback("🎭 По типу события", "create_by_type")],
        [Markup.button.callback("🔙 Отмена", "create_cancel")],
      ])
    );
  });

  // 📌 Обработка текстового ввода расписания
  bot.on("text", async (ctx) => {
    const userId = ctx.from.id;
    const session = userSessions[userId];

    if (!session) return;

    if (session.mode === "text") {
      session.textData = ctx.message.text;
      return confirmSchedule(ctx);
    } else if (session.mode === "step") {
      session.scheduleData[`Шаг ${session.step}`] = ctx.message.text;
      session.step++;

      if (session.step > 2) {
        return confirmSchedule(ctx);
      } else {
        return ctx.reply(`📝 Введите пункт ${session.step}:`);
      }
    }
  });
};
// 📌 Обработчик ввода расписания текстом
async function handleTextInput(ctx) {
  const userId = ctx.from.id;
  const session = userSessions[userId];

  if (!session) {
    return ctx.reply("❌ Ошибка: выберите событие сначала.");
  }

  session.mode = "text";
  return ctx.reply("✍️ Введите расписание одним сообщением.");
}

// 📌 Обработчик выбора события
module.exports.handleCreatingSchedule = async (ctx, data) => {
  console.log(`📝 Обработчик создания расписания: ${data}`);
  const scheduleData = loadSchedule1().schedule1;

  if (!scheduleData) return ctx.reply("❌ В файле расписания нет данных.");

  // 🔹 Выбор всех событий
  if (data === "create_all") {
    const buttons = generateEventButtons(scheduleData);
    return ctx.reply(
      "Выберите событие для создания расписания:",
      Markup.inlineKeyboard(buttons)
    );
  }

  // 🔹 Фильтрация по типу события
  if (data === "create_by_type") {
    const eventButtons = Object.keys(eventNames).map((key) =>
      Markup.button.callback(eventNames[key], `create_${key}`)
    );

    return ctx.reply(
      "Выберите тип события:",
      Markup.inlineKeyboard(eventButtons, { columns: 2 })
    );
  }

  // 🔹 Выбор события по типу
  if (data.startsWith("create_Sobitie")) {
    const eventType = data.replace("create_", "");
    console.log(`🔍 Фильтрация по типу события: ${eventType}`);

    const filteredEvents = Object.values(scheduleData).flatMap((events) =>
      events
        .filter((event) => event[eventType])
        .map((event) => ({
          indexId: event.indexId,
          label: `📆 ${event.day} - ${event[eventType]}`,
        }))
    );

    if (filteredEvents.length === 0) {
      return ctx.reply(
        `❌ Нет событий для ${eventNames[eventType] || eventType}.`
      );
    }

    const buttons = filteredEvents.map((ev) => [
      Markup.button.callback(ev.label, `create_event_${ev.indexId}`),
    ]);

    return ctx.reply(
      "Выберите событие для создания расписания:",
      Markup.inlineKeyboard(buttons)
    );
  }

  // 🔹 Выбор конкретного события
  if (data.startsWith("create_event_")) {
    const indexId = parseFloat(data.replace("create_event_", ""));
    console.log(`📅 Поиск события с indexId: ${indexId}`);

    const chosenEvent = Object.values(scheduleData)
      .flat()
      .find((event) => parseFloat(event.indexId) === indexId);

    if (!chosenEvent) {
      console.log(`❌ Ошибка: событие с indexId ${indexId} не найдено.`);
      return ctx.reply("❌ Ошибка: событие не найдено.");
    }

    // 🔹 Получаем ключ названия события (например, Sobitie1)
    const eventTypeKey = Object.keys(chosenEvent).find((k) =>
      k.startsWith("Sobitie")
    );
    const eventTypeName = eventTypeKey ? chosenEvent[eventTypeKey] : "Событие";

    // 🔹 Сохраняем ВСЮ информацию в userSessions (чтобы не терялись данные)
    userSessions[ctx.from.id] = {
      chosenEvent,
      indexId,
      eventTypeKey, // Сохраняем ключ события
      eventName: eventTypeName, // Сохраняем название события
    };

    console.log(
      `✅ Сохранено в session: ${JSON.stringify(userSessions[ctx.from.id])}`
    );

    return ctx.reply(
      `📝 Создание расписания для:\n📆 Дата: ${chosenEvent.day}, ${eventTypeName}`,
      Markup.inlineKeyboard([
        [Markup.button.callback("✍️ Ввести текстом", "create_text")],
        [Markup.button.callback("📝 Пошаговый ввод", "create_step")],
        [Markup.button.callback("🔙 Отмена", "create_cancel")],
      ])
    );
  }

  // 🔹 Ввод расписания текстом
  if (data === "create_text") {
    handleTextInput(ctx);
    return;
  }

  // 🔹 Пошаговый ввод
  if (data === "create_step") {
    handleTextInput(ctx);
    return;
  }

  // 🔹 Подтверждение
  if (data === "create_confirm") {
    return handleConfirmation(ctx);
  }
};

// 📌 Генерация кнопок событий
function generateEventButtons(scheduleData) {
  return Object.values(scheduleData).flatMap((events) =>
    events.map((event) => {
      const eventType = Object.keys(event).find((key) =>
        key.startsWith("Sobitie")
      );
      return Markup.button.callback(
        `📆 ${event.day} - ${event[eventType]}`,
        `create_event_${event.indexId}`
      );
    })
  );
}

// 📌 Подтверждение расписания
async function confirmSchedule(ctx) {
  const userId = ctx.from.id;
  const session = userSessions[userId];

  if (!session) return ctx.reply("❌ Ошибка: нет данных для подтверждения.");

  // 🔹 Получаем название события ИЗ session
  let eventName = session.eventName || "Неизвестное событие";

  console.log(`🎯 Подтверждение события: ${eventName}`);

  let finalText = `📌 Расписание для события:\n📆 Дата: ${session.chosenEvent.day}, ${eventName}\n`;

  if (session.mode === "text") {
    finalText += session.textData;
  } else {
    finalText += Object.values(session.scheduleData)
      .map((text, i) => `${i + 1}) ${text}`)
      .join("\n");
  }

  ctx.reply(
    `✅ Подтвердите сохранение:\n\n${finalText}`,
    Markup.inlineKeyboard([
      [Markup.button.callback("✅ Сохранить", "create_confirm")],
      [Markup.button.callback("❌ Отмена", "create_cancel")],
    ])
  );
}

// 📌 Обработчик подтверждения сохранения
async function handleConfirmation(ctx) {
  const userId = ctx.from.id;
  const session = userSessions[userId];

  if (!session) return ctx.reply("❌ Ошибка: нет данных для сохранения.");

  const chatId = process.env.CHAT_ID;
  const topicId = process.env.SCHEDULE2_TOPIC_ID;

  // 🔹 Берём название события из session
  let eventName = session.eventName || "Неизвестное событие";

  console.log(`🎯 Подтверждение события: ${eventName}`);

  // 🔹 Формируем текст для отправки
  let finalText = `📌 Расписание для события:\n📆 Дата: ${session.chosenEvent.day}, ${eventName}\n`;

  if (session.mode === "text") {
    finalText += `\n📝 Расписание:\n${session.textData}`;
  } else {
    finalText += `\n📝 Расписание:\n`;
    finalText += Object.values(session.scheduleData)
      .map((text, i) => `${i + 1}) ${text}`)
      .join("\n");
  }

  try {
    const sentMessage = await ctx.telegram.sendMessage(chatId, finalText, {
      message_thread_id: topicId,
    });

    // 🔹 Обновляем ID в JSON
    const scheduleData = loadSchedule1(); // Загружаем данные
    const eventToUpdate = Object.values(scheduleData.schedule1)
      .flat()
      .find((event) => parseFloat(event.indexId) === session.indexId);

    if (eventToUpdate) {
      eventToUpdate.id = sentMessage.message_id; // Записываем message_id
      fs.writeFileSync(
        "./data/schedule1.json",
        JSON.stringify(scheduleData, null, 2) // Красиво форматируем JSON
      );
      console.log(`✅ Записан message_id: ${sentMessage.message_id}`);
    } else {
      console.log("❌ Ошибка: не найдено событие для обновления ID.");
    }

    delete userSessions[userId];
    ctx.reply("✅ Расписание успешно сохранено!");
  } catch (error) {
    console.error("❌ Ошибка отправки расписания:", error);
    ctx.reply("❌ Не удалось сохранить расписание.");
  }
}
