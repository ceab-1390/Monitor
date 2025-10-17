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
        "usage_idle" as cpu_idle,
        "usage_system" as cpu_system,
        "usage_user" as cpu_user,
        time
        FROM "cpu"
        WHERE "host" = '${host}'
        AND time > now() - 1m ORDER BY time DESC LIMIT 50;`
      );
      //Logger.debug(rawData)
      let data_promedio = {};
      data_promedio.cpu_idle = 0;
      data_promedio.cpu_system = 0;
      data_promedio.cpu_user = 0;
      data_promedio.index = 0;
      rawData.forEach((data,index)=>{
         data_promedio.cpu_idle = Number(data.cpu_idle) + Number(data_promedio.cpu_idle);
         data_promedio.cpu_system = Number(data.cpu_system) + Number(data_promedio.cpu_system);
         data_promedio.cpu_user = Number(data.cpu_user) + Number(data_promedio.cpu_user);
         data_promedio.index = index + 1;
      })
      //Logger.debug(data_promedio)
      data_promedio.cpu_idle = data_promedio.cpu_idle / data_promedio.index;
      data_promedio.cpu_system = data_promedio.cpu_system / data_promedio.index;
      data_promedio.cpu_user = data_promedio.cpu_user / data_promedio.index;
      let values = {};
      values.idle = formatPercent(data_promedio.cpu_idle);
      values.system = formatPercent(data_promedio.cpu_system);
      values.user = formatPercent(data_promedio.cpu_user);
      values.totalUsage = data_promedio.cpu_idle ? formatPercent(100 - data_promedio.cpu_idle) : 'N/A';
      return values;
    } catch (error) {
      Logger.error('❌ Error obteniendo datos de InfluxDB:', error.message);
      return [];
    }
  };
  static async getMemUsage(host) {
    try {
      const rawData = await influx.query(`SELECT 
        "used" as mem_used,
        "free" as mem_free,
        "total" as mem_total 
        FROM "mem" 
        WHERE "host" = '${host}'
        AND time > now() - 1m ORDER BY time DESC LIMIT 50;`);

      let data_promedio = {};
      data_promedio.mem_used = 0;
      data_promedio.mem_free = 0;
      data_promedio.mem_total = 0;
      data_promedio.index = 0;
      rawData.forEach((data,index)=>{
         data_promedio.mem_used = Number(data.mem_used) + Number(data_promedio.mem_used);
         data_promedio.mem_free = Number(data.mem_free) + Number(data_promedio.mem_free);
         data_promedio.mem_total = Number(data.mem_total) + Number(data_promedio.mem_total);
         data_promedio.index = index + 1;
      })
      //Logger.debug(data_promedio)
      data_promedio.mem_used = data_promedio.mem_used / data_promedio.index;
      data_promedio.mem_free = data_promedio.mem_free / data_promedio.index;
      data_promedio.mem_total = data_promedio.mem_total / data_promedio.index;
      let values = {};
      values.used = formatBytes(data_promedio.mem_used);
      values.free = formatBytes(data_promedio.mem_free);
      values.total = formatBytes(data_promedio.mem_total);
      values.usagePercent = data_promedio.mem_used && data_promedio.mem_total ? 
        formatPercent((data_promedio.mem_used / data_promedio.mem_total) * 100) : 'N/A';
      return values;
    } catch (error) {
      Logger.error('❌ Error obteniendo datos de InfluxDB:', error.message);
      return [];
    };
  }
  static async getDiskUsage(host, path) {
    try {
      const rawData = await influx.query(`SELECT
        LAST("used") as disk_used,
        "free" as disk_free,
        "total" as disk_total
        FROM "disk" 
        WHERE "host" = '${host}'
        AND path = '${path}'
        AND time > now() - 1m ORDER BY time DESC LIMIT 50;
      `);
      //Logger.debug(data_promedio)
      let values = {};
      if (rawData.length === 0){
        return values = {
          used : 'N/A',
          free : 'N/A',
          total: 'N/A',
          usagePercent: 'N/A'
        };
      }else{
        values.used = formatBytes(rawData[0].disk_used);
        values.free = formatBytes(rawData[0].disk_free);
        values.total = formatBytes(rawData[0].disk_total);
        values.usagePercent = rawData[0].disk_used && rawData[0].disk_total ? 
        formatPercent((rawData[0].disk_used / rawData[0].disk_total) * 100) : 'N/A';
        return values;
      }
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
        WHERE host = '${host}'
        AND time > now() - 5m ORDER BY time DESC;`
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
  static async saveSentNotification(host, metric, topic) {
    try {
      let saveItem = await influx.writePoints([
        {
          measurement: 'notifications_sent',
          tags: { host, metric, topic },
          fields: { count: 1 },
          timestamp: new Date()
        }
      ]);
    return saveItem;
    } catch (error) {
      Logger.error('❌ Error guardando notificación en InfluxDB:', error.message);
    }
  };
  static async getSentNotifications(host, metric, topic) {
    try {
      const result = await influx.query(`SELECT
      LAST(count),
      "time",
      "metric",
      "topic",
      "host"
      FROM "notifications_sent"
      WHERE host = '${host}'
      AND metric = '${metric}'
      AND topic = '${topic}'
      `);
      return result[0];
    } catch (error) {
      Logger.error('❌ Error obteniendo notificaciones de InfluxDB:', error.message);
      return 0;
    }
  };
  static async getSuspiciousIPs(time){
    try {
      const result = await influx.query(`SELECT
        SUM(count) as total_count 
        FROM ip_sospechosa 
        WHERE time > now() - ${time} GROUP BY ip;
        `);
      return result
    } catch (error) {
        Logger.error('❌ Error obteniendo notificaciones de InfluxDB:', error.message);
        return false;
    }
  }
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


//       resultados.push({ 
//         host, 
//         memoria,
//         cpu, 
//         disco,
//         elementor
//       });


module.exports = {InfluxDB };
