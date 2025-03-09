const CHAT_ID = process.env.CHAT_ID;
const TOPIC_ID_2 = process.env.SCHEDULE2_TOPIC_ID;

bot.action(/s2_confirm_(.+)_(.+)/, async (ctx) => {
  const chosenMonth = ctx.match[1];
  const eventIndex = parseInt(ctx.match[2]);
  const userId = ctx.from.id;
  const session = userSessions[userId];

  if (!session) {
    return ctx.reply("Нет данных для подтверждения.");
  }

  // Сформируем финальный текст
  let finalText = `Расписание2 для события в месяце: ${chosenMonth}\n`;
  finalText += `Событие #${eventIndex + 1}\n\n`;

  if (session.mode === "step") {
    // Соберём все пункты
    const { firstPoint, secondPoint, thirdPoint } = session.programData;
    finalText += `1. ${firstPoint}\n`;
    finalText += `2. ${secondPoint}\n`;
    finalText += `3. ${thirdPoint}\n`;
    // ... или более гибко
  } else if (session.mode === "single_text") {
    finalText += session.textData;
  }

  // Отправим сообщение в тему "расписание2"
  let sentMessage;
  try {
    sentMessage = await ctx.telegram.sendMessage(CHAT_ID, finalText, {
      message_thread_id: TOPIC_ID_2,
    });
  } catch (error) {
    console.error("Ошибка при отправке сообщения в тему расписание2", error);
    return ctx.reply("Не удалось отправить расписание2. Попробуйте позже.");
  }

  // Теперь у нас есть sentMessage.message_id
  const newMessageId = sentMessage.message_id;

  // Сохраним этот message_id в schedule1.json
  // Для выбранного месяца -> index -> добавляем поле "id": newMessageId
  const scheduleFile = require("../utils/loadSchedule1");
  const scheduleData = scheduleFile.loadSchedule1();

  if (!scheduleData.schedule1[chosenMonth]) {
    return ctx.reply("Ошибка: не найден месяц в schedule1.json");
  }

  // Обновим конкретное событие
  const eventObj = scheduleData.schedule1[chosenMonth][eventIndex];
  eventObj.id = newMessageId; // или "schedule2_id" — на твой выбор

  // Перезапишем файл
  scheduleData.schedule1[chosenMonth][eventIndex] = eventObj;
  fs.writeFileSync(
    "./data/schedule1.json",
    JSON.stringify(scheduleData, null, 2),
    "utf8"
  );

  // Очистим сессию
  delete userSessions[userId];

  // Ответ пользователю
  return ctx.reply("Расписание2 успешно создано и сохранено!");
});

bot.action("s2_cancel", (ctx) => {
  const userId = ctx.from.id;
  if (userSessions[userId]) delete userSessions[userId];
  ctx.reply("Создание расписания2 отменено.");
});
