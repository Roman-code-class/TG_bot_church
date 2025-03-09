// где-то наверху
const userSessions = {}; // { [userId]: { step: 0, chosenMonth: null, eventIndex: null, programData: {} } }

bot.action(/s2_mode_step_(.+)_(.+)/, async (ctx) => {
  const chosenMonth = ctx.match[1];
  const eventIndex = parseInt(ctx.match[2]);

  const userId = ctx.from.id;
  userSessions[userId] = {
    mode: "step",
    step: 1,
    chosenMonth,
    eventIndex,
    programData: {},
  };

  await ctx.reply(
    "Пошаговый режим создания расписания2.\nШаг 1: введите название первого пункта (например, 'Молитва')."
  );
});

// Затем в bot.on("text"), если у userSessions[userId].mode === "step" – обрабатываем ответ

bot.on("text", (ctx) => {
  const userId = ctx.from.id;
  if (!userSessions[userId] || userSessions[userId].mode !== "step") {
    return; // не в режиме пошагового ввода
  }

  const session = userSessions[userId];

  if (session.step === 1) {
    session.programData.firstPoint = ctx.message.text;
    session.step++;
    return ctx.reply(
      "Шаг 2: введите название второго пункта (например, 'Проповедь')."
    );
  }
  if (session.step === 2) {
    session.programData.secondPoint = ctx.message.text;
    session.step++;
    return ctx.reply(
      "Шаг 3: введите название третьего пункта (например, 'Пение')."
    );
  }
  // И так далее, пока не соберём всю программу.
  // В реальности, лучше спрашивать, сколько пунктов нужно, а не жёстко 3.

  if (session.step === 3) {
    session.programData.thirdPoint = ctx.message.text;
    session.step = 999; // условно «готово»

    // Сформируем превью
    let preview = "📋 Расписание2:\n";
    preview += `1. ${session.programData.firstPoint}\n`;
    preview += `2. ${session.programData.secondPoint}\n`;
    preview += `3. ${session.programData.thirdPoint}\n`;
    // ...

    return ctx.reply(
      `Проверьте:\n\n${preview}\n\nПодтвердить?`,
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
  }
});
