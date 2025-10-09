const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const { config } = require('../Config/config');
const Logger = require('../Logger/Logger');

class GmailSender {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      config.gmailApi.clientId,
      config.gmailApi.secret,
      config.gmailApi.r_uri
    );
    
    this.oauth2Client.setCredentials({
      refresh_token: config.gmailApi.refreshToken,
      tls: {
        rejectUnauthorized: false
      }
    });
    this.name = 'Gmail';
  }
  
  async send(message, email) {
  try {
    //this.validateEmail(email);
    Logger.info('##################################################')
    const { token } = await this.oauth2Client.getAccessToken();
    Logger.info(`El nuevo token es: ${token}`)

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: config.gmailApi.email,
        clientId: config.gmailApi.clientId,
        clientSecret: config.gmailApi.secret, // ← ¡CORREGIDO!
        accessToken: token,
      }
    });

    const mailOptions = {
      from: `Sistema de Notificaciones <${config.gmail.email}>`,
      to: email,
      subject: '🔔 Notificación del Sistema',
      html: message
    };

    await transporter.sendMail(mailOptions);
    
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

  // Validar formato de email
  validateEmail(email) {
    Logger.debug(`Validando email: ${email}`);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new Error('❌ Email válido es requerido');
    }
    return true;
  }

   async verify() {
     try {
       // Obtener access token fresco
       const { token } = await this.oauth2Client.getAccessToken();
      
       // Crear transporter para verificar
       const transporter = nodemailer.createTransport({
         service: 'gmail',
         auth: {
           type: 'OAuth2',
           user: config.gmail.email,
           clientId: config.gmailApi.clientId,
           clientSecret: config.gmail.secret,
           accessToken: token
         }
       });

       const verify = await transporter.verify();
       Logger.info('✅ Conexión Gmail verificada');
       return verify;
     } catch (error) {
       Logger.error('❌ Error verificando Gmail:', error.message);
       throw error;
     }
   }
}

module.exports = { GmailSender };