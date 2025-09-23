const extraerMetricasParaGrafica = require('./influx').extraerMetricasParaGrafica;
const Logguer = require('./Logger/Logger');
const { sendTelegramMessage } = require('./bot');

const chatId = process.env.CHAT_ID; // Asegúrate de tener CHAT_ID en tu .env

(async () => {
  try {
    const datos = await extraerMetricasParaGrafica();
    if (!datos.length) {
      Logguer.warn('No hay datos para mostrar.');
      return;
    }
    const nodos = [...new Set(datos.map(d => d.host))];
    for (const nodo of nodos) {
      const datosNodo = datos.filter(d => d.host === nodo);
      const ultimo = datosNodo[datosNodo.length - 1];
      if (!ultimo) continue;

      // Construir el mensaje para Telegram
      let mensaje = `Nodo: ${nodo}\n`;
      Object.entries(ultimo).forEach(([key, value]) => {
        if (typeof value === 'number') {
          mensaje += `  ${key}: ${value.toFixed(2)}\n`;
        } else {
          mensaje += `  ${key}: ${value}\n`;
        }
      });

      Logguer.info(mensaje); // También lo muestra en consola/log
      await sendTelegramMessage(chatId, mensaje); // Envía el mensaje por Telegram
    }
  } catch (err) {
    Logguer.error('Error mostrando métricas:', err);
  }
})();

