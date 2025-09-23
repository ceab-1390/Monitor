require('dotenv').config();
const Influx = require('influx');
const Logguer = require('./Logger/Logger');

// Configuración para InfluxDB 1.6 local
const influx = new Influx.InfluxDB({
  host: process.env.INFLUX_HOST,
  port: process.env.INFLUX_PORT,
  database: process.env.INFLUX_DB,
  username: process.env.INFLUX_USER,
  password: process.env.INFLUX_PASSWORD,
});

/**
 * Extrae las métricas históricas de CPU, memoria y disco por nodo para graficar.
 * @param {String} host Opcional. Si se especifica, filtra por ese nodo.
 * @param {String} range Rango de tiempo InfluxQL (por defecto: '1h').
 * @param {String} interval Intervalo de agrupación temporal (por defecto: '10m').
 * @returns {Promise<Array>} Arreglo de objetos con host, time, cpu_usage, mem_usage, disk_usage.
 */
async function extraerMetricasParaGrafica({ host, range = '1h', interval = '10m' } = {}) {
  let where = `time > now() - ${range}`;
  if (host) where += ` AND "host" = '${host}'`;

  // Cambia los campos para traer los valores correctos:
  // CPU: usage_user
  // Memoria: used_percent
  // Disco: used_percent

  const cpuQuery = `
    SELECT mean("usage_user") AS cpu_usage FROM "cpu" WHERE ${where} GROUP BY time(${interval}), "host" fill(null)
  `;
  const memQuery = `
    SELECT mean("used_percent") AS mem_usage FROM "mem" WHERE ${where} GROUP BY time(${interval}), "host" fill(null)
  `;
  const diskQuery = `
    SELECT mean("used_percent") AS disk_usage FROM "disk" WHERE ${where} GROUP BY time(${interval}), "host" fill(null)
  `;

  try {
    // Ejecuta las tres consultas por separado
    const cpuResults = await influx.query(cpuQuery);
    const memResults = await influx.query(memQuery);
    const diskResults = await influx.query(diskQuery);

    // Unifica los resultados por host y tiempo
    const combined = {};

    function addToCombined(arr, field) {
      arr.forEach(row => {
        const { host, time } = row;
        if (!host || !time) return;
        const id = `${host}_${time}`;
        if (!combined[id]) {
          combined[id] = { host, time };
        }
        combined[id][field] = row[field];
      });
    }

    addToCombined(cpuResults, 'cpu_usage');
    addToCombined(memResults, 'mem_usage');
    addToCombined(diskResults, 'disk_usage');

    const final = Object.values(combined);
    Logguer.info(`Métricas extraídas para gráfica (${final.length} puntos).`);
    return final;
  } catch (err) {
    Logguer.error('Error al extraer métricas para gráfica', err);
    throw err;
  }
}

// Ejemplo de uso (puedes comentar esto si solo quieres exportar la función)
if (require.main === module) {
  extraerMetricasParaGrafica()
    .then(data => {
      Logguer.info('Datos para gráfica:', data.slice(0, 5)); // Muestra solo los primeros 5 para no saturar el log
    })
    .catch(() => {});
}

module.exports = {
  extraerMetricasParaGrafica,
};