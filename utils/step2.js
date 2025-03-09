bot.action(/s2_mode_text_(.+)_(.+)/, (ctx) => {
  const chosenMonth = ctx.match[1];
  const eventIndex = parseInt(ctx.match[2]);
  const userId = ctx.from.id;

  userSessions[userId] = {
    mode: "single_text",
    chosenMonth,
    eventIndex,
  };

  return ctx.reply("Ок, введите всё расписание одним сообщением:");
});

bot.on("text", (ctx) => {
  const userId = ctx.from.id;
  const session = userSessions[userId];
  if (!session || session.mode !== "single_text") return;

  session.textData = ctx.message.text;

  // Показываем превью и спрашиваем подтверждение
  ctx.reply(
    `Вот что вы ввели:\n\n${session.textData}\n\nПодтвердить?`,
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "✅ Подтвердить",
          `s2_confirm_${session.chosenMonth}_${session.eventIndex}`
        ),
      ],
      [Markup.button.callback("❌ Отменить", `s2_cancel`)],
    ])
  );
});
