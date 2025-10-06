const nodemailer = require('nodemailer');
const { config } = require('../Config/config');

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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new Error('❌ Email válido es requerido');
    }
    return true;
  }

  // Enviar mensaje por Gmail
  async send(message, email = config.gmail.email) {
    try {
      // Validar antes de enviar
      this.validateEmail(email);
      
      const mailOptions = {
        from: `Sistema de Notificaciones <${config.gmail.email}>`,
        to: email,
        subject: '🔔 Notificación del Sistema',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #333;">Notificación del Sistema</h2>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <p style="color: #666; margin-top: 20px;">
              Mensaje enviado automáticamente
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ Gmail enviado a: ${email}`);
      return { 
        success: true, 
        channel: 'gmail', 
        recipient: email 
      };
      
    } catch (error) {
      console.error('❌ Error enviando Gmail:', error.message);
      return { 
        success: false, 
        channel: 'gmail', 
        error: error.message 
      };
    }
  }
}

module.exports = { GmailSender };