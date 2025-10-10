const { google } = require('googleapis');
const { config } = require('../Config/config');
const Logger = require('../Logger/Logger');

class GmailClass {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      config.gmailApi.clientId,
      config.gmailApi.secret,
      config.gmailApi.r_uri
    );
    
    this.oauth2Client.setCredentials({
      refresh_token: config.gmailApi.refreshToken
    });
    
    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    this.name = 'Gmail';
  }

  async send(message, email) {
    try {
      // Validar email
      this.validateEmail(email);
      
      // Crear el mensaje en formato MIME
      const messageBody = [
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `To: ${email}`,
        `From: Sistema de Notificaciones <${config.gmail.email}>`,
        'Subject: Notificacion del Sistema',
        '',
        message
      ].join('\n');

      // Codificar en base64 URL-safe
      const encodedMessage = Buffer.from(messageBody)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Enviar usando Gmail API
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });

      Logger.info(`✅ Gmail enviado a: ${email} - Message ID: ${response.data.id}`);
      return { 
        success: true, 
        channel: 'gmail', 
        recipient: email,
        messageId: response.data.id
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
      // Verificar que podemos obtener un token y hacer una operación simple
      const { token } = await this.oauth2Client.getAccessToken();
      
      // Verificar permisos listando labels (operación simple)
      const response = await this.gmail.users.labels.list({
        userId: 'me'
      });

      Logger.info('✅ Conexión Gmail API verificada');
      return {
        authenticated: true,
        labels: response.data.labels ? response.data.labels.length : 0
      };
    } catch (error) {
      Logger.error('❌ Error verificando Gmail API:', error.message);
      throw error;
    }
  }
}

let GmailSender = new GmailClass()
module.exports = { GmailSender };