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
  } else if (msg.content === '!a') {
    routes.pressA();
  } else if (msg.content === '!up') {
    routes.pressUp();
  }
});

bot.login(token);
