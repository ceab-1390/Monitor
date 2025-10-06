const { TelegramSender } = require('../Senders/telegramSender');
const { GmailSender } = require('../Senders/gmailSender');
const { validateConfig } = require('../Config/config');
const Logger = require('../Logger/Logger');

class NotificationService {
  constructor() {
    
    // Validar configuración
    if (validateConfig('telegram')){
        //initialize Telegram sender
        this.telegram = new TelegramSender();
         Logger.log(`🚀 Servicio de Notificaciones ${this.telegram.name}  iniciado`);
    }

    if (validateConfig('gmail')){
        //initialize Gmail sender
        this.gmail = new GmailSender();
        Logger.log(`🚀 Servicio de Notificaciones ${this.gmail.name}  iniciado`);
    }
    
   
  }

  // Enviar solo por Telegram
  async sendTelegram(message, chatId = '854982095') {
    return await this.telegram.send(message, chatId);
  }

  // Enviar solo por Gmail
  async sendGmail(message, email = null) {
    return await this.gmail.send(message, email);
  }

  // Enviar por ambos canales
  async sendBoth(message, options = {}) {
    const { telegramChatId = null, gmailEmail = null } = options;
    
    const results = [];

    // Enviar Telegram
    try {
      const telegramResult = await this.telegram.send(message, telegramChatId);
      results.push(telegramResult);
    } catch (error) {
      results.push({
        success: false,
        channel: 'telegram',
        error: error.message
      });
    }

    // Enviar Gmail
    try {
      const gmailResult = await this.gmail.send(message, gmailEmail);
      results.push(gmailResult);
    } catch (error) {
      results.push({
        success: false,
        channel: 'gmail',
        error: error.message
      });
    }

    // Resumen de resultados
    return {
      success: results.some(r => r.success),
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      details: results
    };
  }

  // Verificar estado de los servicios
  getStatus() {
    return {
      telegram: {
        configured: !!this.telegram,
        name: 'Telegram'
      },
      gmail: {
        configured: !!this.gmail,
        name: 'Gmail'
      }
    };
  }
}

module.exports = { NotificationService };