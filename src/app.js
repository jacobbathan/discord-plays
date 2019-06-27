const Discord = require('Discord.js');
const token = process.env.TOKEN;
const bot = new Discord.Client();
const routes = require('./routes/routes');

bot.on('BOT ONLINE', () => {
  console.log('Bot working ya dig');
});

bot.on('message', msg => {
  if (msg.content === '!left') {
    msg.reply('left');
  } else if (msg.content === '!right') {
    msg.reply('right');
  } else if (msg.content === '!a') {
    msg.reply('a');
  }
});

bot.login(token);
