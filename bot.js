const { Telegraf } = require("telegraf");
const dotenv = require("dotenv");
dotenv.config();

// Импортируем модули
const start = require("./commands/start");
const initCreateSchedule = require("./commands/createSchedule");
const initViewSchedule = require("./commands/viewSchedule");

// Создаем бота
const bot = new Telegraf(process.env.BOT_TOKEN);

// Подключаем модули
start(bot);
initCreateSchedule(bot);
initViewSchedule(bot);

// Запускаем бота
bot.launch();
console.log("🤖 Бот запущен!");
