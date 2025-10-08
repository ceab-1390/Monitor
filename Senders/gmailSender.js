const nodemailer = require('nodemailer');
const { config } = require('../Config/config');
const Logger = require('../Logger/Logger');

class GmailSender {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.gmail.email || null,
        pass: config.gmail.password || null
      }
    });
    this.name = 'Gmail';
  }


  // Validar formato de email
  validateEmail(email) {
    Logger.debug(`Validando email: ${email}`);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new Error('❌ Email válido es requerido');
    }
    return true;
  }

  async verify(){
    let verify = await this.transporter.verify()
    return verify;
  }

  // Enviar mensaje por Gmail
  async send(message, email) {
    try {
      // Validar antes de enviar
      this.validateEmail(email);
      
      const mailOptions = {
        from: `Sistema de Notificaciones <${config.gmail.email}>`,
        to: email,
        subject: '🔔 Notificación del Sistema',
        html: message
      };

      await this.transporter.sendMail(mailOptions);
      
      Logger.info(`✅ Gmail enviado a: ${email}`);
      return { 
        success: true, 
        channel: 'gmail', 
        recipient: email 
      };
      
    } catch (error) {
      Logger.error('❌ Error enviando Gmail:', error.message);
      return { 
        success: false, 
        channel: 'gmail', 
        error: error.message 
      };
    }
  }
}

module.exports = { GmailSender };