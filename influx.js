require('dotenv').config();
const Influx = require('influx');
const Logger = require('./Logger/Logger');
const { Log } = require('@influxdata/influxdb-client');

const influx = new Influx.InfluxDB({
  host: process.env.INFLUX_HOST,
  port: process.env.INFLUX_PORT,
  database: process.env.INFLUX_DB,
  username: process.env.INFLUX_USER,
  password: process.env.INFLUX_PASSWORD,
});


class InfluxDB {
  static async testConnection() {
    try {
      const names = await influx.getDatabaseNames();
      if (names.includes(process.env.INFLUX_DB)) {
        return true;
      } else {
        Logger.error(`❌ La base de datos ${process.env.INFLUX_DB} no existe`);
        return false;
      }
    } catch (error) {
      Logger.error('❌ Error conectando a InfluxDB:', error.message);
      return false;
    }
  };
  static async getHosts() {
    try {
      const hosts = await influx.query(`
        SHOW TAG VALUES FROM "cpu" WITH KEY = "host"
      `);
      return hosts.map(h => h.value);
    } catch (error) {
      Logger.error('❌ Error obteniendo hosts de InfluxDB:', error.message);
      return [];
    }   
  };
  static async getCpuUsage(host) {
    try {
      const rawData = await influx.query(`SELECT 
        last("usage_idle") as cpu_idle,
        last("usage_system") as cpu_system,
        last("usage_user") as cpu_user 
        FROM "cpu" 
        WHERE "host" = '${host}'`);
      let values = {};
      values.idle = formatPercent(rawData[0].cpu_idle);
      values.system = formatPercent(rawData[0].cpu_system);
      values.user = formatPercent(rawData[0].cpu_user);
      values.totalUsage = rawData[0].cpu_idle ? formatPercent(100 - rawData[0].cpu_idle) : 'N/A';
      return values;
    } catch (error) {
      Logger.error('❌ Error obteniendo datos de InfluxDB:', error.message);
      return [];
    }
  };
  static async getMemUsage(host) {
    try {
      const rawData = await influx.query(`SELECT 
        last("used") as mem_used,
        last("free") as mem_free,
        last("total") as mem_total 
        FROM "mem" 
        WHERE "host" = '${host}'`);
      let values = {};
      values.used = formatBytes(rawData[0].mem_used);
      values.free = formatBytes(rawData[0].mem_free);
      values.total = formatBytes(rawData[0].mem_total);
      values.usagePercent = rawData[0].mem_used && rawData[0].mem_total ? 
        formatPercent((rawData[0].mem_used / rawData[0].mem_total) * 100) : 'N/A';
      return values;
    } catch (error) {
      Logger.error('❌ Error obteniendo datos de InfluxDB:', error.message);
      return [];
    };
  }
  static async getDiskUsage(host, path) {
    try {
      const rawData = await influx.query(`SELECT
        last("used") as disk_used,
        last("free") as disk_free,
        last("total") as disk_total
        FROM "disk" 
        WHERE "host" = '${host}'
        AND path = '${path}'
      `);
      let values = {};
      values.used = formatBytes(rawData[0].disk_used);
      values.free = formatBytes(rawData[0].disk_free);
      values.total = formatBytes(rawData[0].disk_total);
      values.usagePercent = rawData[0].disk_used && rawData[0].disk_total ? 
        formatPercent((rawData[0].disk_used / rawData[0].disk_total) * 100) : 'N/A';
      return values;
    } catch (error) {
      Logger.error('❌ Error obteniendo datos de InfluxDB:', error.message);
      return [];
    };
  };
  static async getElementorErrors(host) {
    try {
      const rawData = await influx.query(`SELECT
        LAST(count) AS count,
        log_file AS log,
        host
        FROM elementor_errors
        WHERE host = '${host}'`
      );
      let values = {};
      values.count = rawData[0]?.count || 0;
      values.log = rawData[0]?.log || 'N/A';
      return values;
    } catch (error) {
      Logger.error('❌ Error obteniendo datos de InfluxDB:', error.message);
      return [];
    };
  };
  static async saveSentNotification(host, metric, channel) {
    try {
      let saveItem = await influx.writePoints([
        {
          measurement: 'notifications_sent',
          tags: { host, metric, channel },
          fields: { count: 1 },
          timestamp: new Date()
        }
      ]);
    return saveItem;
    } catch (error) {
      Logger.error('❌ Error guardando notificación en InfluxDB:', error.message);
    }
  };
  static async getSentNotifications(host, metric, channel) {
    try {
      const result = await influx.query(`SELECT
      LAST(count),
      "time",
      "metric",
      "channel",
      "host"
      FROM "notifications_sent"
      WHERE host = '${host}'
      AND metric = '${metric}'
      AND channel = '${channel}'
      `);
      return result[0];
    } catch (error) {
      Logger.error('❌ Error obteniendo notificaciones de InfluxDB:', error.message);
      return 0;
    }
  };
}


// Función para formatear bytes
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0 || bytes === 'N/A' || bytes === null || bytes === undefined) return 'N/A';
    if (typeof bytes === 'string') return bytes;
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Función para formatear porcentajes
function formatPercent(value) {
    if (value === null || value === undefined || value === 'N/A') return 'N/A';
    if (typeof value === 'string') return value;
    
    return `${value.toFixed(1)}%`;
}

// async function obtenerDatosPorHost() {
//   try {
//     // Obtener la lista de hosts únicos
//     const hosts = await influx.query(`
//       SHOW TAG VALUES FROM "cpu" WITH KEY = "host"
//     `);

//     const resultados = [];

//     for (const hostObj of hosts) {
//       const host = hostObj.value;

//       // Obtener datos de memoria (usar nombres de alias seguros)
//       const memoriaRaw = await influx.query(`
//         SELECT last("used") as mem_used, last("free") as mem_free, last("total") as mem_total 
//         FROM "mem" 
//         WHERE "host" = '${host}'
//       `);

//       // Obtener datos de CPU (escapar "user" o usar alias diferente)
//       const cpuRaw = await influx.query(`
//         SELECT last("usage_idle") as cpu_idle, last("usage_system") as cpu_system, last("usage_user") as cpu_user 
//         FROM "cpu" 
//         WHERE "host" = '${host}'
//       `);

//       // Obtener datos de disco
//       const discoRaw = await influx.query(`
//         SELECT last("used") as disk_used, last("free") as disk_free, last("total") as disk_total FROM "disk" 
//         WHERE "host" = '${host}'
//       `);
      
//       //obtener datos de elementor css
//       const elementorRaw = await influx.query(
//         `SELECT LAST(count) AS count, log_file AS log, host FROM elementor_errors WHERE host = '${host}'`
//       );

//       const memoriaData = memoriaRaw[0] || {};
//       const cpuData = cpuRaw[0] || {};
//       const discoData = discoRaw[0] || {};
//       const elementorData = elementorRaw[0] || {};
//       Logger.debug(`Datos para ${host}`)
//       Logger.debug(elementorData)
//       Logger.debug(`Finalizado datos\n\n`)

//       // Calcular porcentajes usando los nuevos nombres de alias
//       const memUsedPercent = memoriaData.mem_used && memoriaData.mem_total ? 
//         (memoriaData.mem_used / memoriaData.mem_total) * 100 : null;
      
//       const diskUsedPercent = discoData.disk_used && discoData.disk_total ? 
//         ((discoData.disk_total - discoData.disk_free) * 100) / discoData.disk_total : null;

//       // Estructurar datos formateados
//       const memoria = {
//         used: {
//           raw: memoriaData.mem_used,
//           formatted: formatBytes(memoriaData.mem_used),
//           percent: memUsedPercent ? formatPercent(memUsedPercent) : 'N/A'
//         },
//         free: {
//           raw: memoriaData.mem_free,
//           formatted: formatBytes(memoriaData.mem_free),
//           percent: memUsedPercent ? formatPercent(100 - memUsedPercent) : 'N/A'
//         },
//         total: {
//           raw: memoriaData.mem_total,
//           formatted: formatBytes(memoriaData.mem_total)
//         },
//         usagePercent: memUsedPercent ? formatPercent(memUsedPercent) : 'N/A'
//       };

//       const cpu = {
//         idle: {
//           raw: cpuData.cpu_idle,
//           formatted: formatPercent(cpuData.cpu_idle)
//         },
//         system: {
//           raw: cpuData.cpu_system,
//           formatted: formatPercent(cpuData.cpu_system)
//         },
//         user: {
//           raw: cpuData.cpu_user,
//           formatted: formatPercent(cpuData.cpu_user)
//         },
//         totalUsage: cpuData.cpu_idle ? formatPercent(100 - cpuData.cpu_idle) : 'N/A'
//       };

//       const disco = {
//         used: {
//           raw: discoData.disk_used,
//           formatted: formatBytes(discoData.disk_used),
//           percent: diskUsedPercent ? formatPercent(diskUsedPercent) : 'N/A'
//         },
//         free: {
//           raw: discoData.disk_free,
//           formatted: formatBytes(discoData.disk_free),
//           percent: diskUsedPercent ? formatPercent(100 - diskUsedPercent) : 'N/A'
//         },
//         total: {
//           raw: discoData.disk_total,
//           formatted: formatBytes(discoData.disk_total)
//         },
//         usagePercent: diskUsedPercent ? formatPercent(diskUsedPercent) : 'N/A'
//       };

//       const elementor = {
//         count: elementorData.count || 0,
//         log: elementorData.log || 'N/A'
//       }

//       resultados.push({ 
//         host, 
//         memoria,
//         cpu, 
//         disco,
//         elementor
//       });
//     }

//     return resultados;
//   } catch (error) {
//     Logger.error('Error al obtener datos de InfluxDB:', error);
//     return [];
//   }
// }

module.exports = {InfluxDB };
