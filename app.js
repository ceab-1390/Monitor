const obtenerDatosPorHost = require('./influx').obtenerDatosPorHost;
const Logguer = require('./Logger/Logger');
const sendMessageTelegram = require('./bot').sendTelegramMessage;

const chatId = process.env.CHAT_ID;

// Variable para controlar la ejecución
let isShuttingDown = false;
let intervalId = null;

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
    if (percent == 0 ) return '🟢';
    
    if (count >= 100) return '🔴';
    if (count >= 80) return '🟠';
    if (count >= 70) return '🟡';
    return '⚪';
}

// Función principal que obtiene y envía las métricas
async function ejecutarMonitor() {
    try {
        Logguer.info('Ejecutando monitoreo de métricas...');
        
        const data = await obtenerDatosPorHost();
        
        if (data.length === 0) {
            Logguer.warn('No se obtuvieron datos de los hosts');
            return;
        }

        const promises = data.map(element => {
            if (isShuttingDown) {
                Logguer.info('Proceso en cierre, omitiendo envío de mensajes');
                return Promise.resolve();
            }
            
            const { host, memoria, cpu, disco } = element;

            const mensaje = `
📡 *Host:* ${host}

🧠 *Memoria* ${getUsageEmoji(memoria.usagePercent)}
• Usada: ${memoria.used.formatted} (${memoria.used.percent})
• Libre: ${memoria.free.formatted} (${memoria.free.percent})
• Total: ${memoria.total.formatted}
• **Uso total: ${memoria.usagePercent}**

💻 *CPU* ${getUsageEmoji(cpu.totalUsage)}
• Idle: ${cpu.idle.formatted}
• System: ${cpu.system.formatted}
• User: ${cpu.user.formatted}
• **Total uso: ${cpu.totalUsage}**

💾 *Disco* ${getUsageEmoji(disco.usagePercent)}
• Usado: ${disco.used.formatted} (${disco.used.percent})
• Libre: ${disco.free.formatted} (${disco.free.percent})
• Total: ${disco.total.formatted}
• **Uso total: ${disco.usagePercent}**

📁 *Errores de estilos en elementor* ${getUsageEmojiElementor(element.elementor.count)}
• Cantidad encontrada: ${element.elementor.count}
• Log: ${element.elementor.log}

⏰ *Actualizado:* ${new Date().toLocaleString('es-ES', { 
    timeZone: 'America/Lima',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
})}
            `;

            return sendMessageTelegram(chatId, mensaje, { parse_mode: 'Markdown' })
                .then(() => {
                    Logguer.info(`Mensaje enviado para el host: ${host}`);
                })
                .catch(error => {
                    Logguer.error(`Error enviando mensaje para ${host}:`, error);
                });
        });

        await Promise.all(promises);
        Logguer.info('Monitoreo completado exitosamente');
        
    } catch (error) {
        Logguer.error('Error en el monitoreo:', error);
    }
}

// Función de limpieza y cierre graceful
function gracefulShutdown(reason) {
    if (isShuttingDown) return;
    
    isShuttingDown = true;
    Logguer.info(`Iniciando cierre graceful: ${reason}`);
    
    // Limpiar el intervalo
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        Logguer.info('Intervalo de monitoreo detenido');
    }
    
    // Opcional: enviar mensaje de despedida a Telegram
    const despedida = `🔴 *Monitor finalizado*\n⏰ ${new Date().toLocaleString('es-ES')}\nRazón: ${reason}`;
    
    sendMessageTelegram(chatId, despedida, { parse_mode: 'Markdown' })
        .catch(error => Logguer.error('Error enviando mensaje de cierre:', error))
        .finally(() => {
            Logguer.info('Proceso finalizado correctamente');
            process.exit(0);
        });
    
    // Timeout de seguridad para forzar cierre después de 5 segundos
    setTimeout(() => {
        Logguer.warn('Forzando cierre después de timeout');
        process.exit(1);
    }, 5000);
}

// Manejadores de señales para cierre graceful
process.on('SIGINT', () => gracefulShutdown('Señal SIGINT (Ctrl+C)'));
process.on('SIGTERM', () => gracefulShutdown('Señal SIGTERM'));
process.on('SIGHUP', () => gracefulShutdown('Señal SIGHUP'));

// Manejador de errores no capturados
process.on('uncaughtException', (error) => {
    Logguer.error('Error no capturado:', error);
    gracefulShutdown('Error no capturado');
});

process.on('unhandledRejection', (reason, promise) => {
    Logguer.error('Promise rechazada no manejada:', reason);
    gracefulShutdown('Promise rechazada');
});

// Función para iniciar el monitor periódico
function iniciarMonitor() {
    const intervaloMinutos = 5;
    const intervaloMs = intervaloMinutos * 60 * 1000; // 5 minutos en milisegundos
    
    Logguer.info(`Iniciando monitor cada ${intervaloMinutos} minutos`);
    
    // Ejecutar inmediatamente la primera vez
    ejecutarMonitor();
    
    // Programar ejecuciones periódicas cada 5 minutos
    intervalId = setInterval(ejecutarMonitor, intervaloMs);
    
    // Mensaje de inicio a Telegram
    const mensajeInicio = `🟢 *Monitor iniciado*\n⏰ Frecuencia: Cada ${intervaloMinutos} minutos\n📊 Monitoreo activo`;
    
    sendMessageTelegram(chatId, mensajeInicio, { parse_mode: 'Markdown' })
        .then(() => Logguer.info('Mensaje de inicio enviado'))
        .catch(error => Logguer.error('Error enviando mensaje de inicio:', error));
}

// Iniciar la aplicación
iniciarMonitor();