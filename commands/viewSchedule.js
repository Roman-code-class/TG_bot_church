// commands/viewSchedule.js
const { Markup } = require("telegraf");
const { loadSchedule1 } = require("../utils/loadSchedule1");

module.exports = (bot) => {
  // Команда для просмотра основного расписания (schedule1)
  bot.command("viewSchedule", (ctx) => {
    const scheduleData = loadSchedule1().schedule1; // структура: { "Апрель": [...], "Май": [...] }
    let message = "";
    for (const month in scheduleData) {
      message += `📅 <b>${month}:</b>\n`;
      const events = scheduleData[month];
      events.forEach((ev) => {
        // Определяем, какой тип события использовать – например, берем первый найденный ключ вида "СобытиеX"
        let eventType = "";
        let eventName = "";
        for (const key in ev) {
          if (key.startsWith("Событие")) {
            eventType = key;
            eventName = ev[key];
            break;
          }
        }
        message += `📆 <b>Дата:</b> ${ev.day}\n`;
        if (ev.indexId) {
          // Команда для вывода расписания2 для этого события – ID скрывается в параметре
          message += `/расписание2 ${ev.indexId}\n`;
        } else {
          message += `Расписание2: не создано\n`;
        }
        message += `👥 <b>Группа:</b> ${ev["группа"] || "-"}\n`;
        message += `📽 <b>Экран:</b> ${ev["экран"] || "-"}\n`;
        message += `💡 <b>Свет:</b> ${ev["свет"] || "-"}\n`;
        message += `🎶 <b>Звук:</b> ${ev["звук"] || "-"}\n`;
        if (eventName) {
          message += `📝 <b>${eventName}</b>\n`;
        }
        message += `\n`;
      });
    }
    ctx.reply(message, { parse_mode: "HTML" });
  });

  // Команда для просмотра расписания2 по ID события
  bot.command("расписание2", async (ctx) => {
    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
      return ctx.reply("Укажите ID события, например: /расписание2 1.1");
    }
    const targetId = args[1];
    const scheduleData = loadSchedule1().schedule1;
    let targetEvent = null;
    // Ищем событие по targetId в любом месяце
    for (const month in scheduleData) {
      const events = scheduleData[month];
      targetEvent = events.find((ev) => ev.indexId === targetId);
      if (targetEvent) break;
    }
    if (!targetEvent) {
      return ctx.reply(`Событие с ID ${targetId} не найдено.`);
    }
    // Проверяем, создано ли расписание2 для этого события
    if (!targetEvent.schedule2_id) {
      return ctx.reply("Расписание2 для этого события еще не создано.");
    }
    try {
      // Пересылаем сообщение с расписанием2 пользователю
      await ctx.telegram.forwardMessage(
        ctx.from.id,
        process.env.CHAT_ID, // ID чата BD_info_grace
        targetEvent.schedule2_id,
        { message_thread_id: process.env.SCHEDULE2_TOPIC_ID }
      );
    } catch (error) {
      console.error("Ошибка при пересылке расписания2:", error);
      return ctx.reply("Не удалось получить расписание2 для этого события.");
    }
  });
};
