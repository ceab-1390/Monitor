const { Telegraf } = require('telegraf');
const Logger = require('../Logger/Logger');
const { config } = require('../Config/config');

class TelegramSender {
  constructor() {
    this.bot = new Telegraf(config.telegram.token) || null;
    this.name = 'Telegram';
  }

  // Validar que el chatId tenga formato correcto
  validateChatId(chatId) {
    if (!chatId || typeof chatId !== 'string') {
      throw new Error('❌ Chat ID de Telegram es requerido y debe ser texto');
    }
    if (!/^-?\d+$/.test(chatId)) {
      throw new Error('❌ Formato de Chat ID inválido');
    }
    return true;
  }

  // Enviar mensaje por Telegram
  async send(chatId, message) {
    try {
      // Validar antes de enviar
      //this.validateChatId(chatId);
      
      await this.bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      
      Logger.log(`✅ Telegram enviado a: ${chatId}`);
      return { 
        success: true, 
        channel: 'telegram', 
        recipient: chatId 
      };
      
    } catch (error) {
      Logger.error('❌ Error enviando Telegram:', error.message);
      return { 
        success: false, 
        channel: 'telegram', 
        error: error.message 
      };
    }
  }
}

module.exports = { TelegramSender };