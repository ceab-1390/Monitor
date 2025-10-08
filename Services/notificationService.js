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
  async sendTelegram(chatId, message) {
    return await this.telegram.send(chatId, message);
  }

  // Enviar solo por Gmail
  async sendGmail(message, email = null) {
    return await this.gmail.send(message, email);
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