const { Markup } = require("telegraf");
const { loadSchedule1 } = require("../utils/loadSchedule1");
const { loadRoles } = require("../utils/loadRoles"); // Загружаем роли пользователей

const eventNames = {
  Sobitie1: "Воскресенье",
  Sobitie2: "Четверг",
  Sobitie3: "Молодежка",
  Sobitie4: "Ночная",
  Sobitie5: "Другое",
};

// 📌 Функция обработки просмотра расписания конкретного события
async function handleViewEventSchedule(ctx, data) {
  console.log(`📩 Обработчик: просмотр расписания события -> ${data}`);

  // Извлекаем indexId из callback или команды
  const indexId = parseFloat(data.replace("view_event_schedule_", ""));
  console.log(`🔍 Поиск события с indexId: ${indexId}`);

  // Загружаем расписание
  const scheduleData = loadSchedule1().schedule1;

  // Ищем событие по indexId
  const chosenEvent = Object.values(scheduleData)
    .flat()
    .find((event) => parseFloat(event.indexId) === indexId);

  if (!chosenEvent) {
    console.log(`❌ Ошибка: событие с indexId ${indexId} не найдено.`);
    return ctx.reply(`❌ Ошибка: событие с indexId ${indexId} не найдено.`);
  }

  // Проверяем, есть ли сохраненное сообщение с расписанием
  if (!chosenEvent.id) {
    console.log(`❌ Расписание для события ${indexId} отсутствует.`);
    return ctx.reply("❌ Расписание для этого события пока нет.");
  }

  try {
    // Пересылаем сохраненное сообщение с расписанием
    await ctx.telegram.forwardMessage(
      ctx.chat.id, // ID текущего чата
      process.env.CHAT_ID, // ID чата, где хранятся расписания
      chosenEvent.id // ID сообщения с расписанием
    );

    console.log(`✅ Расписание события ${indexId} успешно переслано.`);
  } catch (error) {
    console.error("❌ Ошибка при пересылке сообщения:", error);
    return ctx.reply("❌ Ошибка: не удалось получить расписание.");
  }
}

// Основная команда для просмотра расписания
// 📌 Обработчик просмотра расписания
module.exports.handleViewingSchedule = async (ctx, data) => {
  console.log(`📌 Обработчик просмотра расписания: ${data}`);

  const scheduleData = loadSchedule1().schedule1;
  if (!scheduleData) {
    console.log("❌ Расписание отсутствует.");
    return ctx.reply("❌ В файле расписания нет данных.");
  }

  // 🔹 Фильтрация по типу событий
  if (data.startsWith("view_Sobitie")) {
    const eventType = data.replace("view_", "");
    console.log(`🔍 Фильтрация по типу: ${eventType}`);

    const filteredEvents = Object.entries(scheduleData).flatMap(
      ([month, events]) =>
        events
          .filter((event) => event[eventType])
          .map((event) => ({
            indexId: event.indexId,
            label: `📆 ${event.day} - ${event[eventType]}`,
          }))
    );

    if (filteredEvents.length === 0) {
      return ctx.reply(
        `❌ Нет событий для ${eventNames[eventType] || eventType}`
      );
    }

    // 🔹 Создаем кнопки "📖 Посмотреть расписание"
    const buttons = filteredEvents.map((ev) => [
      Markup.button.callback(
        "📖 Посмотреть расписание",
        `view_event_schedule_${ev.indexId}`
      ),
    ]);

    // 🔹 Отправляем список событий + кнопки
    return ctx.reply(
      "Выберите событие для просмотра расписания:",
      Markup.inlineKeyboard(buttons)
    );
  }
};

// Команда /viewSchedule, вызывающая просмотр расписания
module.exports.initViewingSchedule = (bot) => {
  bot.command("viewSchedule", (ctx) => {
    console.log("✅ Команда /viewSchedule вызвана");
    ctx.reply(
      "Выберите способ просмотра расписания:",
      Markup.inlineKeyboard([
        [Markup.button.callback("📋 Все события", "view_all")],
        [Markup.button.callback("🎭 По типу события", "view_choose_event")],
        [Markup.button.callback("👤 Моё расписание", "view_user_schedule")],
      ])
    );
  });

  bot.command(/view_event_schedule_\d+(\.\d+)?/, async (ctx) => {
    const data = ctx.message.text;
    await handleViewEventSchedule(ctx, data);
  });

  // 📌 Обработчик выбора типа события
  // bot.action("view_choose_event", async (ctx) => {
  //   console.log("📋 Выбор типа события");

  //   const buttons = Object.entries(eventNames).map(
  //     ([key, name]) => Markup.button.callback(name, `view_${key}`) // ⬅️ Здесь была ошибка!
  //   );

  //   await ctx.reply(
  //     "Выберите тип события:",
  //     Markup.inlineKeyboard(buttons, { columns: 2 })
  //   );
  // });

  // bot.action(/^view_event_schedule_(\d+(\.\d+)?)$/, async (ctx) => {
  //   console.log(`📩 Просмотр расписания события -> ${ctx.match[1]}`);
  //   await require("../commands/viewingSchedule").handleViewEventSchedule(
  //     ctx,
  //     `view_event_schedule_${ctx.match[1]}`
  //   );
  // });

  bot.action("view_choose_event", async (ctx) => {
    console.log("📋 Выбор типа события");

    const buttons = Object.entries(eventNames).map(([key, name]) =>
      Markup.button.callback(name, `view_${key}`)
    );
    console.log("🔹 Кнопки типов событий:", buttons);

    await ctx.reply(
      "Выберите тип события:",
      Markup.inlineKeyboard(buttons, { columns: 2 })
    );
  });

  bot.action(/^view_Sobitie\d+$/, async (ctx) => {
    console.log(`📩 Фильтрация событий по типу -> ${ctx.match[0]}`);
    await require("../commands/viewingSchedule").handleViewingSchedule(
      ctx,
      ctx.match[0]
    );
  });
};

// Функция форматирования расписания
function formatSchedule(scheduleData) {
  if (!Object.keys(scheduleData).length) return null;

  return Object.entries(scheduleData)
    .map(
      ([month, events]) =>
        `📅 ${month}:\n` +
        events
          .map((event) => {
            let eventType = Object.entries(event)
              .filter(([key]) => key.startsWith("Sobitie"))
              .map(([_, value]) => `📝 ${value}`)
              .join("\n");
            return `📆 Дата: ${event.day}\n👥 Группа: ${
              event.group || "-"
            }\n📽 Экран: ${event.screen || "-"}\n💡 Свет: ${
              event.svet || "-"
            }\n🎶 Звук: ${event.zvuk || "-"}\n${eventType}\n`;
          })
          .join("\n")
    )
    .join("\n");
}

// Функция фильтрации расписания
function filterSchedule(scheduleData, filterFn) {
  return Object.fromEntries(
    Object.entries(scheduleData)
      .map(([month, events]) => {
        const filtered = events.filter(filterFn);
        return filtered.length ? [month, filtered] : null;
      })
      .filter(Boolean) // Убираем пустые месяцы
  );
}
