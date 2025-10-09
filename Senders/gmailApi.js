const { google } = require('googleapis');
const { config } = require('../Config/config');
const Logger = require('../Logger/Logger')

class GmailSender {
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
      const messageBody = [
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `To: ${email}`,
        `From: Sistema de Notificaciones <${config.gmail.email}>`,
        'Subject: 🔔 Notificación del Sistema',
        '',
        message
      ].join('\n');

      const encodedMessage = Buffer.from(messageBody)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });

      Logger.info(`✅ Gmail enviado a: ${email}`);
      return { success: true, channel: 'gmail', recipient: email };
      
    } catch (error) {
      Logger.error('❌ Error enviando Gmail:', error.message);
      return { success: false, channel: 'gmail', error: error.message };
    }
  }
}

const mail = new GmailSender();

mail.send('Hola','ceavila.90@gmail.com')