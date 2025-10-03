const PDFDocument = require('pdfkit');
const fs = require('fs');

function generateReportPDF(data) {
    const doc = new PDFDocument({
        size: 'A4', // Tamaño de página
        margins: { top: 50, bottom: 50, left: 50, right: 50 } // Márgenes
    });

    // Tubería para escribir el PDF en un archivo
    doc.pipe(fs.createWriteStream('reporte_soytechno.pdf'));

    // --- LOGO (Parte Superior Izquierda) ---
    const logoPath = 'logo.png'; // Asegúrate de que este archivo exista en la misma carpeta
    const logoWidth = 100; // Ancho del logo
    const logoHeight = 50; // Alto del logo (se ajustará automáticamente si solo das ancho)
    const logoX = doc.page.margins.left; // Posición X
    const logoY = doc.page.margins.top;  // Posición Y

    // Verifica si el archivo del logo existe antes de intentarlo agregar
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, logoX, logoY, { width: logoWidth, height: logoHeight });
    } else {
        console.warn(`Advertencia: El archivo del logo '${logoPath}' no fue encontrado.`);
    }

    // --- TÍTULO PRINCIPAL (Centrado, debajo del logo o en el área de contenido) ---
    // Mueve el cursor un poco más abajo que el logo para el título si el logo es grande
    // o simplemente para centrarlo visualmente en el área de contenido
    doc.y = Math.max(doc.y, logoY + logoHeight + 20); // Asegura que el título empiece debajo del logo + un espacio

    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('Reporte de soytecho.com', { align: 'center' }); // Título centrado

    doc.moveDown(2); // Espacio después del título principal

    // --- Contenido del Reporte ---

    // Título de la sección del host, debajo del título principal
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text(`*Host:* ${data.host}`, { align: 'left' });

    doc.moveDown(1);

    // --- SECCIÓN 1: MEMORIA / SESIONES ---
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('🧠 *Sesiones* 🟢');

    doc.moveDown(0.5);

    doc.font('Helvetica')
       .list([
           `Total: ${data.sesiones.total}`,
           `Últimos 7 días: ${data.sesiones.ultimos7dias}`,
           `Últimos 30 días: ${data.sesiones.ultimos30dias}`
       ], {
           listType: 'bullet',
           bulletRadius: 1.5,
           lineGap: 4
       });

    doc.moveDown(0.5);

    doc.font('Helvetica-Bold')
       .text(`**Tasa de rebote: ${data.sesiones.tasaRebote}**`);

    doc.moveDown(1.5); // Espaciado entre secciones

    // --- SECCIÓN 2: CPU / USUARIOS ---
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('💻 *Usuarios* 🟢');

    doc.moveDown(0.5);

    doc.font('Helvetica')
       .list([
           `Nuevos: ${data.usuarios.nuevos}`,
           `Recurrentes: ${data.usuarios.recurrentes}`,
       ], {
           listType: 'bullet',
           bulletRadius: 1.5,
           lineGap: 4
       });

    doc.moveDown(0.5);

    doc.font('Helvetica-Bold')
       .text(`**Usuarios totales: ${data.usuarios.total}**`);

    doc.moveDown(1.5); // Espaciado entre secciones

    // --- SECCIÓN 3: DISCO / ENGAGEMENT ---
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('💾 *Engagement (Compromiso)* 🟢');

    doc.moveDown(0.5);

    doc.font('Helvetica')
       .list([
           `Tasa de engagement: ${data.engagement.tasa}`,
           `Sesiones con engagement: ${data.engagement.sesiones}`,
           `Duración media: ${data.engagement.duracionMedia}`
       ], {
           listType: 'bullet',
           bulletRadius: 1.5,
           lineGap: 4
       });

    doc.moveDown(0.5);

    doc.font('Helvetica-Bold')
       .text(`**Eventos por sesión: ${data.engagement.eventosPorSesion}**`);

    doc.moveDown(1.5); // Espaciado entre secciones

    // --- SECCIÓN 4: ERRORES CSS ELEMENTOR / CONVERSIONES ---
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('📄 *Conversiones (Objetivos)* 🟢');

    doc.moveDown(0.5);

    doc.font('Helvetica')
       .list([
           `Cantidad total: ${data.conversiones.total}`,
           `Tipo: ${data.conversiones.tipo}`,
           `Log: ${data.conversiones.log}`
       ], {
           listType: 'bullet',
           bulletRadius: 1.5,
           lineGap: 4
       });

    // Finalizar el documento
    doc.end();
    console.log('PDF generado exitosamente: reporte_soytechno.pdf');
}

// Datos de ejemplo para generar el reporte
const reportData = {
    host: 'soytechno.com (Analytics)',
    sesiones: {
        total: '15,245',
        ultimos7dias: '3,210 (21.0%)',
        ultimos30dias: '15,245 (100%)',
        tasaRebote: '28.5%'
    },
    usuarios: {
        total: '15,245',
        nuevos: '7,500 (49.2%)',
        recurrentes: '7,745 (50.8%)'
    },
    engagement: {
        tasa: '71.5%',
        sesiones: '10,890',
        duracionMedia: '1:45',
        eventosPorSesion: '1.8'
    },
    conversiones: {
        total: '(125)',
        tipo: 'Clics de Afiliados / Suscripción',
        log: 'google.com/analytics/reports/soytecho'
    }
};

//generateReportPDF(reportData);

module.exports = {generateReportPDF};