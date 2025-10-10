const path = require('path');
require('dotenv').config({ 
  path: path.join(__dirname, '../', '.env') 
});
const Logger = require('../Logger/Logger');
const { NotificationService } = require('./notificationService');
const notifier = NotificationService;
const { Templates } = require('../Templates/Templates');

let date = new Date().toLocaleString('es-VE', { 
    timeZone: 'America/Caracas',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
});

// Procesar argumentos del shell
const args = process.argv.slice(2);
let tipo = args[1];
let sta = args[3];
let estatus = Boolean( sta === "true");
let observaciones = args[5];
let data = {
    tipo : tipo || 'No se especifico el origen',
    status : estatus || false,
    observaciones : observaciones || 'No se enviaron datos adicionales',
    timestamp : date
}

let mensaje = Templates.shellAlertTemplate(data);
notifier.sendTelegram(process.env.CHAT_ID,mensaje).then((res)=>{
    Logger.debug(res)
}).catch(err =>{
    Logger.error(err)
})

Logger.info(`Datos obtenidos ${tipo},  ${estatus},  ${observaciones}`)
