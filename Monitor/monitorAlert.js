const Logger = require('../Logger/Logger');
const {InfluxDB} = require('../influx');
const { NotificationService }   = require('../Services/notificationService');
const notifier = new NotificationService();
const {Templates} = require('../Templates/Templates');


module.exports.alertas = async () =>{

    let IntervalToResend = process.env.INTERVAL_TO_RESEND || 30; //minutos
    let isSentCpu = false;
    let isSentMem = false;
    let isSentElementor = false;
    let isSentDisk = false;
    let emailReciber = process.env.EMAIL_TO;
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
    let IntervalExpired = (new Date(Date.now() - (process.env.INTERVAL_TO_RESEND + 2) * 60000))
    const testConnection = await InfluxDB.testConnection();
    if (!testConnection) {
        Logger.error('No se pudo conectar a InfluxDB. Saliendo...');
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
                    isSentCpu = await InfluxDB.getSentNotifications(host,'cpu','topicCPU') || {time : new Date(IntervalExpired)};
                    Logger.debug(`Valores extraidos de influx para alertas enviadas de CPU ${isSentCpu.time}`)
                    const lastTime = new Date(isSentCpu.time);
                    const now = new Date();
                    const diffMinutes = Math.floor((now - lastTime) / 60000); // Diferencia en minutos
                    Logger.debug(`intervalo para reenvio ${IntervalToResend} e intervalo de influxdb ${diffMinutes}`)
                    if (IntervalToResend < diffMinutes || !isSentCpu){
                        mensajeTg = Templates.telegramAlertTemplate(alertParams);
                        let envioTG = await notifier.sendTelegram(chatId,mensajeTg);
                        messageEmail = Templates.mailAlertTemplate(alertParams);
                        let envioEmail = await notifier.sendGmail(messageEmail,emailReciber);
                        Logger.debug(envioEmail);
                        Logger.info(`Alerta de CPU enviada para el host ${host}`);
                        const saveAlertSent = await InfluxDB.saveSentNotification(host,'cpu','topicCPU');
                        Logger.debug(saveAlertSent)
                    }else{
                        Logger.info(`Se encontro una alerta no resuelta para el host ${host} en el topico CPU`)
                        Logger.info(`Alerta de CPU ya enviada para el host ${host}, esperando ${IntervalToResend - diffMinutes} Minutos para reenvío.`);
                    }
         
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
                    isSentMem = await InfluxDB.getSentNotifications(host,'memoria','topicoMEM') || {time : new Date(IntervalExpired)};
                    const lastTime = new Date(isSentMem.time);
                    const now = new Date();
                    const diffMinutes = Math.floor((now - lastTime) / 60000);
                    if (IntervalToResend < diffMinutes || !isSentMem){
                        mensajeTg = Templates.telegramAlertTemplate(alertParams);
                        await notifier.sendTelegram(chatId,mensajeTg)
                        messageEmail = Templates.mailAlertTemplate(alertParams);
                        let envioEmail = await notifier.sendGmail(messageEmail,emailReciber);
                        Logger.debug(envioEmail);
                        await InfluxDB.saveSentNotification(host,'memoria','topicoMEM');
                        Logger.info(`Alerta de Memoria enviada para el host ${host}`);
                    }else{
                        Logger.info(`Alerta de Memoria ya enviada para el host ${host}, esperando ${IntervalToResend - diffMinutes } para reenvío.`);
                    }
                }

                let pathToCheck = process.env.DISK_PATHS;
                let pathsArray = pathToCheck.split(',').map(path => path.trim());
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
                        isSentDisk = await InfluxDB.getSentNotifications(host,`disco_${path.replace(/\//g, '_')}`,'topicoDISK') || {time : new Date(IntervalExpired)};
                        const lastTime = new Date(isSentDisk.time);
                        const now = new Date();
                        const diffMinutes = Math.floor((now - lastTime) / 60000);
                        if (IntervalToResend < diffMinutes || !isSentDisk){
                            mensajeTg = Templates.telegramAlertTemplate(alertParams);
                            await notifier.sendTelegram(chatId,mensajeTg)
                            messageEmail = Templates.mailAlertTemplate(alertParams);
                            let envioEmail = await notifier.sendGmail(messageEmail,emailReciber)
                            Logger.debug(envioEmail);
                            await InfluxDB.saveSentNotification(host,`disco_${path.replace(/\//g, '_')}`,'topicoDISK');
                            Logger.info(`Alerta de Disco enviada para el host ${host} en el path ${path}`);
                        }else{
                            Logger.info(`Alerta de Disco ya enviada para el host ${host} en el path ${path}, esperando ${IntervalToResend - diffMinutes } para reenvío.`);
                        }
                    }
                });

                let alertElementor = await InfluxDB.getElementorErrors(host);
                umbralElementor = process.env.ELEMENTOR_ALERT_THRESHOLD;
                if (alertElementor.count !== 'N/A' && parseInt(alertElementor.count) > parseInt(umbralElementor)){
                        const alertParams = {
                            clase : 'elementor',
                            metrica : `Errores de estilos en Elementor del host ${host.toUpperCase()}`,
                            magnitud : alertElementor.count,
                            umbral : umbralElementor,
                            timestamp : date
                        };
                    isSentElementor = await InfluxDB.getSentNotifications(host,'elementor','topicoELEMENTOR') || {time : new Date(IntervalExpired)};
                    const lastTime = new Date(isSentElementor.time);
                    const now = new Date();
                    const diffMinutes = Math.floor((now - lastTime) / 60000);
                    if (IntervalToResend < diffMinutes || !isSentElementor){
                        mensajeTg = Templates.telegramAlertTemplate(alertParams);
                        await notifier.sendTelegram(chatId,mensajeTg)
                        messageEmail = Templates.mailAlertTemplate(alertParams);
                        let envioEmail = await notifier.sendGmail(messageEmail,emailReciber);
                        Logger.debug(envioEmail);
                        await InfluxDB.saveSentNotification(host,'elementor','topicoELEMENTOR');
                        Logger.info(`Alerta de Elementor enviada para el host ${host}`);
                    }else{
                        Logger.info(`Alerta de Elementor ya enviada para el host ${host}, esperando ${IntervalToResend - diffMinutes } para reenvío.`);
                    }
                };
            });
        }
    }
 
}
