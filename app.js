const obtenerDatosPorHost = require('./influx').obtenerDatosPorHost;
const { Log } = require('@influxdata/influxdb-client');
const {InfluxDB} = require('./influx');
const Logguer = require('./Logger/Logger');
//const notifier.sendTelegram = require('./bot').sendTelegramMessage;
const { NotificationService }   = require('./Services/notificationService');
const notifier = new NotificationService();
const {Templates} = require('./Templates/Templates');
const Logger = require('./Logger/Logger');






// Función para crear mensajes con emojis de alerta
function getUsageEmoji(percent) {
    if (percent === 'N/A') return '⚪';
    
    const numericPercent = parseFloat(percent);
    if (numericPercent >= 90) return '🔴';
    if (numericPercent >= 80) return '🟠';
    if (numericPercent >= 70) return '🟡';
    return '🟢';
}

function getUsageEmojiElementor(count) {
    if (count == 0 ) return '🟢';
    
    if (count >= 300) return '🔴';
    if (count >= 100) return '🟠';
    return '🟡';
}

// Función principal que obtiene y envía las métricas
// async function ejecutarMonitor() {
//     try {
//         Logguer.info('Ejecutando monitoreo de métricas...');
        
//         const data = await obtenerDatosPorHost();
        
//         if (data.length === 0) {
//             Logguer.warn('No se obtuvieron datos de los hosts');
//             return;
//         }

//         const promises = data.map(element => {
            
//             const { host, memoria, cpu, disco } = element;

// //             const mensaje = `
// // 📡 *Host:* ${host}

// // 🧠 *Memoria* ${getUsageEmoji(memoria.usagePercent)}
// // • Usada: ${memoria.used.formatted} (${memoria.used.percent})
// // • Libre: ${memoria.free.formatted} (${memoria.free.percent})
// // • Total: ${memoria.total.formatted}
// // • **Uso total: ${memoria.usagePercent}**

// // 💻 *CPU* ${getUsageEmoji(cpu.totalUsage)}
// // • Idle: ${cpu.idle.formatted}
// // • System: ${cpu.system.formatted}
// // • User: ${cpu.user.formatted}
// // • **Total uso: ${cpu.totalUsage}**

// // 💾 *Disco* ${getUsageEmoji(disco.usagePercent)}
// // • Usado: ${disco.used.formatted} (${disco.used.percent})
// // • Libre: ${disco.free.formatted} (${disco.free.percent})
// // • Total: ${disco.total.formatted}
// // • **Uso total: ${disco.usagePercent}**

// // 📁 *Errores de estilos en elementor* ${getUsageEmojiElementor(element.elementor.count)}
// // • Cantidad encontrada: ${element.elementor.count}
// // • Log: ${element.elementor.log}

// // ⏰ *Actualizado:* ${new Date().toLocaleString('es-VE', { 
// //     timeZone: 'America/Caracas',
// //     hour12: false,
// //     year: 'numeric',
// //     month: '2-digit',
// //     day: '2-digit',
// //     hour: '2-digit',
// //     minute: '2-digit',
// //     second: '2-digit'
// // })}
// //             `;

//             return notifier.sendTelegram(chatId, mensaje, { parse_mode: 'Markdown' })
//                 .then(() => {
//                     Logguer.info(`Mensaje enviado para el host: ${host}`);
//                 })
//                 .catch(error => {
//                     Logguer.error(`Error enviando mensaje para ${host}:`, error);
//                 });
//         });

//         await Promise.all(promises);
//         Logguer.info('Monitoreo completado exitosamente');
        
//     } catch (error) {
//         Logguer.error('Error en el monitoreo:', error);
//     }
// }

// Función para iniciar el monitor periódico
// function iniciarMonitor() {
//     const intervaloMinutos = 20;
//     const intervaloMs = intervaloMinutos * 60 * 1000; // X minutos en milisegundos
    
//     Logguer.info(`Iniciando monitor cada ${intervaloMinutos} minutos`);
    
//     // Ejecutar inmediatamente la primera vez
//     ejecutarMonitor();
    
//     // Programar ejecuciones periódicas cada 5 minutos
//     intervalId = setInterval(ejecutarMonitor, intervaloMs);
    
//     // Mensaje de inicio a Telegram
//     const mensajeInicio = `🟢 *Monitor iniciado*\n⏰ Frecuencia: Cada ${intervaloMinutos} minutos\n📊 Monitoreo activo`;
    
//     notifier.sendTelegram(chatId, mensajeInicio, { parse_mode: 'Markdown' })
//         .then(() => Logguer.info('Mensaje de inicio enviado'))
//         .catch(error => Logguer.error('Error enviando mensaje de inicio:', error));
// }

function enviarEmailTest(){
    const mensajeTest = Templates.mailAlertTemplate(
        metrica = 'CPU',
        magnitud = '95%',
        umbral = '90%'
    );

    notifier.sendGmail(mensajeTest,emailReciber).then(() => {
    Logguer.info('Email de prueba enviado');
}).catch(error => {
    Logguer.error('Error enviando email de prueba:', error);
});
}

// Enviar email de prueba al iniciar
//nviarEmailTest();

// Iniciar la aplicación
//iniciarMonitor();

async function monitor(){
    let emailReciber = process.env.EMAIL_TO;
    let mensaje = '';
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
    const testConnection = await InfluxDB.testConnection();
    if (!testConnection) {
        Logguer.error('No se pudo conectar a InfluxDB. Saliendo...');
        return;
    }else{
        const hosts = await InfluxDB.getHosts();
        const chatId = process.env.CHAT_ID;
        let mensajeTg = '';
        let messageEmail = '';
        if (hosts.length !== 0) {
            hosts.forEach(async (host,index) => {

                let alertCpu = await InfluxDB.getCpuUsage(host);
                let umbralCpu = process.env.CPU_ALERT_THRESHOLD;
                if (alertCpu.totalUsage !== 'N/A' && parseFloat(alertCpu.totalUsage) > parseFloat(umbralCpu)){
                        const alertParams = {
                            clase : 'cpu',
                            metrica : `CPU del host ${host.toUpperCase()}`,
                            magnitud : alertCpu.totalUsage,
                            umbral : umbralCpu,
                            timestamp : date
                        };
                    mensajeTg = Templates.telegramAlertTemplate(alertParams);
                    await notifier.sendTelegram(chatId,mensajeTg);
                    messageEmail = Templates.mailAlertTemplate(alertParams);
                    await notifier.sendGmail(messageEmail,emailReciber);
                }

                let alertMem = await InfluxDB.getMemUsage(host);
                umbralMem = process.env.MEMORY_ALERT_THRESHOLD;
                if (alertMem.usagePercent !== 'N/A' && parseFloat(alertMem.usagePercent) > parseFloat(umbralMem)){
                        const alertParams = {
                            clase : 'memoria',
                            metrica : `Memoria del host ${host.toUpperCase()}`,
                            magnitud : alertMem.usagePercent,
                            umbral : umbralMem,
                            timestamp : date
                        };
                    mensajeTg = Templates.telegramAlertTemplate(alertParams);
                    await notifier.sendTelegram(chatId,mensajeTg)
                    messageEmail = Templates.mailAlertTemplate(alertParams);
                    await notifier.sendGmail(messageEmail,emailReciber);
                }

                let pathToCheck = process.env.DISK_PATHS;
                let pathsArray = pathToCheck.split(',').map(path => path.trim());
                Logger.debug(pathsArray);
                pathsArray.forEach(async (path,index) => {
                    Logger.debug(`Revisando path: ${path} del host ${host}`);
                    let alertDisk = await InfluxDB.getDiskUsage(host,path);
                    umbralDisk = process.env.DISK_ALERT_THRESHOLD;
                    if (alertDisk.usagePercent !== 'N/A' && parseFloat(alertDisk.usagePercent) > parseFloat(umbralDisk)){
                            const alertParams = {
                                clase : 'disco',
                                metrica : `Disco ${path} del host ${host.toUpperCase()}`,
                                magnitud : alertDisk.usagePercent,
                                umbral : umbralDisk,
                                timestamp : date
                            };
                        Logger.warn(alertDisk);
                        mensajeTg = Templates.telegramAlertTemplate(alertParams);
                        await notifier.sendTelegram(chatId,mensajeTg)
                        messageEmail = Templates.mailAlertTemplate(alertParams);
                        await notifier.sendGmail(messageEmail,emailReciber)
                    }
                });
            });
        }
    }
 
}

function iniciarMonitor() {
     const intervaloMinutos = 1;
     const intervaloMs = intervaloMinutos * 60 * 1000; // X minutos en milisegundos

     // Programar ejecuciones periódicas cada 5 minutos
    intervalId = setInterval(monitor, intervaloMs);
    Logguer.info(`Iniciando monitor cada ${intervaloMinutos} minutos`);
    // Ejecutar inmediatamente la primera vez
    monitor();
}

iniciarMonitor();