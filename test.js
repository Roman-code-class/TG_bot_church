require("dotenv").config();
const { Telegraf } = require("telegraf");

//сброс
// bot.on("message", (ctx) => {
//   console.log("Group ID: ", ctx.chat.id); // Выведет ID группы
//   ctx.reply(`Ваш group_id: ${ctx.chat.id}`);
// });

const bot = new Telegraf(process.env.BOT_TOKEN);
// Обработчик всех входящих сообщений
bot.on("message", (ctx) => {
  // Выводим информацию о чате (группе)
  console.log("Chat info:", ctx.chat);
  // Выводим информацию о сообщении (и теме, если она есть)
  console.log("Message info:", ctx.message);

  // Отправляем ответ с ID чата и ID темы (если оно есть)
  ctx.reply(
    `Группа ID: ${ctx.chat.id}\nТема ID: ${
      ctx.message.message_thread_id || "Нет темы"
    }`
  );
});

// Запуск бота
bot.launch();
console.log(
  "Бот запущен! Отправь сообщение в нужную тему группы, чтобы узнать её ID."
);
