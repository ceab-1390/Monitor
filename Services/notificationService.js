const { TelegramSender } = require('../Senders/telegramSender');
const { GmailSender } = require('../Senders/gmailSender');
const { validateConfig } = require('../Config/config');
const Logger = require('../Logger/Logger');

class Notifier {
  constructor() {
    
    // Validar configuración
    if (validateConfig('telegram')){
        //initialize Telegram sender
        this.telegram = TelegramSender;
         Logger.log(`🚀 Servicio de Notificaciones ${this.telegram.name}  iniciado`);
    }

    if (validateConfig('gmail')){
        //initialize Gmail sender
        this.gmail = GmailSender;
        Logger.log(`🚀 Servicio de Notificaciones ${this.gmail.name}  iniciado`);
    }
    
   
  }

  // Enviar solo por Telegram
  async sendTelegram(chatId, message) {
    return await this.telegram.send(chatId, message);
  }

  // Enviar solo por Gmail
  async sendGmail(message, email = null) {
    await this.gmail.verify().then((verify) =>{
      Logger.debug(`Verificando el transporter de gmail`)
    })
    return await this.gmail.send(message, email);
  }

  // Verificar estado de los serviciosconst { Log } = require('@influxdata/influxdb-client');

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

let NotificationService = new Notifier()

module.exports = { NotificationService };