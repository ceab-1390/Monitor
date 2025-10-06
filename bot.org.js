require('dotenv').config();
const Logger = require('./Logger/Logger');
const {Telegraf} = require('telegraf');
const fs = require('fs');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Función para enviar mensajes a un chat específico
async function sendTelegramMessage(chatId, message) {
  try {
    await bot.telegram.sendMessage(chatId, message);
  } catch (error) {
    Logger.error('Error enviando mensaje:', error);
  }
}

/**
 * Envía una imagen a un chat de Telegram.
 * @param {String} imagePath Ruta de la imagen.
 * @param {String} caption Texto opcional para la imagen.
 * @param {String} chatId Opcional, si no se pasa usa process.env.CHAT_ID.
 */
async function enviarImagenTelegram(imagePath, caption = '', chatId = process.env.CHAT_ID) {
  try {
    await bot.telegram.sendPhoto(chatId, { source: fs.createReadStream(imagePath) }, { caption });
    Logger.info(`Imagen enviada a Telegram: ${imagePath}`);
  } catch (error) {
    Logger.error('Error enviando imagen:', error);
  }
}

module.exports = { bot, sendTelegramMessage, enviarImagenTelegram };

bot.start((ctx) => ctx.reply('¡Hola! Soy tu bot de Monitor.' + ctx.from.id));



bot.launch();

Logger.log('Bot de Telegram iniciado.');

// Manejo de cierre seguro
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));