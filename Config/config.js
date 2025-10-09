require('dotenv').config();
const Logger = require('../Logger/Logger');


const config = {
  telegram: {
    token: process.env.BOT_TOKEN,
    defaultChatId: process.env.CHAT_ID
  },
  gmail: {
    email: process.env.G_EMAIL,
    password: process.env.G_PASSWD
  },
  gmailApi: {
    email: process.env.G_EMAIL,
    clientId : process.env.GOOGLE_CLIENT_ID,
    secret : process.env.GOOGLE_CLIENT_SECRET,
    r_uri : process.env.GOOGLE_REDIRECT_URI,
    refreshToken : process.env.GOOGLE_REFRESH_TOKEN
  }
};

// Validación básica de configuración
function validateConfig(Service) {

  switch (Service) {
    case 'telegram':
      if (!config.telegram.token) {
        Logger.warn('⚠️  TELEGRAM_BOT_TOKEN no configurado');
        return false;
      }else{
        return true;
      }
      break;
    case 'gmail':
      if (!config.gmail.email) {
        Logger.warn('⚠️  GMAIL_EMAIL no configurado');
        return false;
      }else{
        return true;
      }
      break;
    default: false;
      break;
  }
}

Logger.log(process.env.CHAT_ID);

module.exports = { config, validateConfig };