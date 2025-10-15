const { NotificationService }   = require('./Services/notificationService');
const notifier = NotificationService;
const {Templates} = require('./Templates/Templates');
const Logger = require('./Logger/Logger');
const Monitor = require('./Monitor/monitorAlert');

function enviarEmailTest(){
    const mensajeTest = Templates.mailAlertTemplate(
        metrica = 'CPU',
        magnitud = '95%',
        umbral = '90%'
);

    notifier.sendGmail(mensajeTest,'cesar.e.avila.b@gmail.com').then(() => {
    Logger.info('Email de prueba enviado');
    }).catch(error => {
    Logger.error('Error enviando email de prueba:', error);
    });
    notifier.sendTelegram(process.env.CHAT_ID, "Test").then(() => {
    Logger.info('Telegram de prueba enviado');
    }).catch(error => {
    Logger.error('Error enviando telegram de prueba:', error);
    });
}




async function iniciarMonitor() {
    const intervaloMinutos = process.env.MONITOR_INTERVAL || 20;
    const intervaloMs = intervaloMinutos * 60 * 1000; // X minutos en milisegundos
     // Programar ejecuciones periódicas cada X minutos
    intervalId = setInterval(Monitor.alertas, intervaloMs);
    Logger.info(`Iniciando monitor cada ${intervaloMinutos} minutos`);
    // Ejecutar inmediatamente la primera vez
    Monitor.alertas()
    cloudflareEvent = setInterval(Monitor.cloudFlare,(intervaloMs * 5));
    Monitor.cloudFlare()

}



iniciarMonitor();
//enviarEmailTest()
