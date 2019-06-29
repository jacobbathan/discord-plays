const Discord = require('Discord.js');
const token = process.env.TOKEN;
const bot = new Discord.Client();
const routes = require('./routes/routes');

bot.on('BOT ONLINE', () => {
  console.log('Bot working ya dig');
});

bot.on('message', msg => {
  if (msg.content === '!left') {
    routes.pressLeft();
  } else if (msg.content === '!right') {
    routes.pressRight();
  } else if (msg.content === '!up') {
    routes.pressUp();
  } else if (msg.content === '!down') {
    routes.pressDown();
  } else if (msg.content === '!a') {
    routes.pressA();
  } else if (msg.content === '!b') {
    routes.pressB();
  } else if (msg.content === '!start') {
    routes.pressStart();
  } else if (msg.content === '!select') {
    routes.pressSelect();
  }
});

bot.login(token);
