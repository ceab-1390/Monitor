require('dotenv').config();
const { extraerMetricasParaGrafica } = require('./influx');
const Logguer = require('./Logger/Logger');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const fs = require('fs');
const path = require('path');

/**
 * Genera una gráfica tipo doughnut para una métrica y la guarda como imagen en la carpeta img.
 * @param {Number} valor Valor de la métrica.
 * @param {String} medida Nombre de la métrica (CPU, Memoria, Disco).
 * @param {String} nodo Nombre del nodo (host).
 * @returns {Promise<String>} Ruta de la imagen generada.
 */
async function generarGraficaDoughnut(valor, medida, nodo = 'Nodo') {
  const width = 400;
  const height = 400;
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

  const configuration = {
    type: 'doughnut',
    data: {
      labels: [medida, 'Libre'],
      datasets: [
        {
          data: [valor, 100 - valor],
          backgroundColor: [
            'rgba(54, 162, 235, 0.7)',
            'rgba(200, 200, 200, 0.3)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(200, 200, 200, 0.5)'
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: `${medida} usada - ${nodo}`,
        },
      },
      cutout: '70%',
    },
  };

  // Guarda la imagen en la carpeta img
  const imgDir = path.join(__dirname, 'img');
  if (!fs.existsSync(imgDir)) {
    fs.mkdirSync(imgDir);
  }
  // Elimina caracteres problemáticos en el nombre del archivo
  const safeNodo = String(nodo).replace(/[^\w.-]/g, '_');
  const safeMedida = String(medida).replace(/[^\w.-]/g, '_');
  const imagePath = path.join(imgDir, `doughnut_${safeNodo}_${safeMedida}.png`);
  const buffer = await chartJSNodeCanvas.renderToBuffer(configuration);
  fs.writeFileSync(imagePath, buffer);
  return imagePath;
}

/**
 * Obtiene los datos y genera gráficas doughnut por cada nodo y cada métrica.
 * Devuelve un array de objetos { nodo, medida, imagePath }
 */
async function generarGraficasDoughnutPorNodo() {
  try {
    const datos = await extraerMetricasParaGrafica();
    if (!datos.length) {
      Logguer.warn('No hay datos para graficar.');
      return [];
    }
    const nodos = [...new Set(datos.map(d => d.host))];
    const resultados = [];
    for (const nodo of nodos) {
      const datosNodo = datos.filter(d => d.host === nodo);
      // Tomamos el último valor disponible para cada métrica
      const ultimo = datosNodo[datosNodo.length - 1];
      if (!ultimo) continue;

      console.log('DEBUG ultimo:', ultimo);

      // CPU
      if (typeof ultimo.cpu_usage === 'number') {
        const imgCPU = await generarGraficaDoughnut(ultimo.cpu_usage, 'CPU', nodo);
        resultados.push({ nodo, medida: 'CPU', imagePath: imgCPU });
      }
      // Memoria
      if (typeof ultimo.mem_usage === 'number') {
        const imgMem = await generarGraficaDoughnut(ultimo.mem_usage, 'Memoria', nodo);
        resultados.push({ nodo, medida: 'Memoria', imagePath: imgMem });
      }
      // Disco
      if (typeof ultimo.disk_usage === 'number') {
        const imgDisk = await generarGraficaDoughnut(ultimo.disk_usage, 'Disco', nodo);
        resultados.push({ nodo, medida: 'Disco', imagePath: imgDisk });
      }
    }
    return resultados;
  } catch (err) {
    Logguer.error('Error generando gráficas doughnut por nodo', err);
    return [];
  }
}

// Si quieres probar desde línea de comandos:
if (require.main === module) {
  generarGraficasDoughnutPorNodo().then(resultados => {
    Logguer.info('Gráficas doughnut generadas:', resultados);
  });
}

module.exports = {
  generarGraficaDoughnut,
  generarGraficasDoughnutPorNodo,
};