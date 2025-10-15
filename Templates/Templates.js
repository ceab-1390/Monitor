const Logger = require('../Logger/Logger');


Logger.debug('✅ Cargando templates');

const style = `<style>
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Open+Sans:wght@400;600&display=swap');
        
        body {
            font-family: 'Open Sans', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .container {
            max-width: 650px;
            margin: 0 auto;
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.2);
            animation: slideIn 0.6s ease-out;
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .banner {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            padding: 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .banner::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 1%, transparent 1%);
            background-size: 20px 20px;
            animation: pulse 3s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        
        .alert-icon {
            font-size: 80px;
            margin-bottom: 15px;
            display: block;
            animation: bounce 2s infinite;
        }
        
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
        }
        
        .banner h1 {
            color: white;
            font-family: 'Montserrat', sans-serif;
            font-size: 32px;
            font-weight: 700;
            margin: 0;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            letter-spacing: 1px;
        }
        
        .content {
            padding: 40px;
        }
        
        h2 {
            color: #e74c3c;
            font-family: 'Montserrat', sans-serif;
            font-size: 28px;
            margin-top: 0;
            margin-bottom: 20px;
            border-bottom: 3px solid #f1f1f1;
            padding-bottom: 15px;
            text-align: center;
        }
        
        .timestamp {
            background: #f8f9fa;
            padding: 12px 20px;
            border-radius: 50px;
            text-align: center;
            color: #7f8c8d;
            font-size: 14px;
            margin-bottom: 25px;
            border: 1px dashed #bdc3c7;
            font-weight: 600;
        }
        
        .alert-message {
            background: linear-gradient(135deg, #fff3f3 0%, #ffeaea 100%);
            padding: 25px;
            border-radius: 15px;
            margin: 25px 0;
            border-left: 6px solid #e74c3c;
            box-shadow: 0 5px 15px rgba(231, 76, 60, 0.1);
        }
        
        .metric-info {
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            color: white;
            padding: 25px;
            border-radius: 15px;
            margin: 30px 0;
            text-align: center;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            position: relative;
            overflow: hidden;
        }
        
        .metric-info::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #e74c3c, #f39c12, #e74c3c);
            background-size: 200% 100%;
            animation: shimmer 2s infinite;
        }
        
        @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
        
        .metric-name {
            font-family: 'Montserrat', sans-serif;
            font-size: 20px;
            font-weight: 600;
            color: #ecf0f1;
            margin-bottom: 10px;
            display: block;
        }
        
        .current-value {
            font-size: 42px;
            font-weight: 700;
            font-family: 'Montserrat', sans-serif;
            color: #e74c3c;
            margin: 15px 0;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .threshold {
            color: #bdc3c7;
            font-size: 16px;
            margin-top: 10px;
        }
        
        .recommendations {
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            padding: 25px;
            border-radius: 15px;
            margin: 30px 0;
            border-left: 6px solid #2196f3;
            box-shadow: 0 5px 15px rgba(33, 150, 243, 0.1);
        }
        
        .recommendations h3 {
            color: #1976d2;
            font-family: 'Montserrat', sans-serif;
            font-size: 20px;
            margin-top: 0;
            display: flex;
            align-items: center;
        }
        
        .recommendations h3::before {
            content: '💡';
            margin-right: 10px;
            font-size: 24px;
        }
        
        ul {
            padding-left: 25px;
            margin: 20px 0;
        }
        
        li {
            margin-bottom: 12px;
            line-height: 1.6;
            padding-left: 10px;
            position: relative;
        }
        
        li::before {
            content: '▶';
            color: #2196f3;
            font-size: 12px;
            position: absolute;
            left: -15px;
            top: 2px;
        }
        
        .footer {
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            padding: 30px;
            text-align: center;
            color: #ecf0f1;
            border-top: 1px solid rgba(255,255,255,0.1);
            position: relative;
        }
        
        .footer::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, transparent, #e74c3c, transparent);
        }
        
        .signature {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid rgba(255,255,255,0.1);
            font-style: italic;
            color: #bdc3c7;
            font-size: 14px;
        }
        
        .contact-info {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 10px;
            margin-top: 15px;
            display: inline-block;
        }
        
        .urgency-badge {
            background: #e74c3c;
            color: white;
            padding: 8px 20px;
            border-radius: 50px;
            text-align: center !important;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 20px;
            animation: blink 2s infinite;
        }
        
        @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0.7; }
        }
        
        .status-gauge {
            height: 8px;
            background: #ecf0f1;
            border-radius: 4px;
            margin: 15px 0;
            overflow: hidden;
        }
        
        .gauge-fill {
            height: 100%;
            background: linear-gradient(90deg, #e74c3c, #f39c12);
            border-radius: 4px;
            width: 85%;
            animation: fillGauge 2s ease-out;
        }
        
        @keyframes fillGauge {
            from { width: 0%; }
            to { width: 85%; }
        }
</style>`

class Templates {
    static mailAlertTemplate(alertMessage) {
let notification = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><h1>🚨 Alerta del Sistema</h1></title>
    ${style}
</head>
<body>
    <div class="container">
        <div class="banner">
            <span class="alert-icon"><h1>🚨</h1></span>
            <h1>ALERTA DEL SISTEMA</h1>
        </div>
        
        <div class="content">
            <h2 class="urgency-badge">🚨ALTA PRIORIDAD - ACCIÓN REQUERIDA</h2>
            
            <h2>Recurso del Sistema Sobre el Umbral</h2>
            
            <div class="timestamp" id="timestamp">${alertMessage.timestamp}</div>
            
            <div class="alert-message">
                <p>El sistema de monitoreo ha detectado que un recurso crítico ha excedido el umbral establecido. Esto requiere atención inmediata.</p>
            </div>
            
            <div class="metric-info">
                <span class="metric-name" id="metricName">${alertMessage.metrica}</span>
                <p class="current-value" id="currentValue">${alertMessage.magnitud}</p>
                <div class="status-gauge">
                    <div class="gauge-fill"></div>
                </div>
                <p class="threshold">Umbral establecido: <span id="thresholdValue">${alertMessage.umbral}</span></p>
            </div>
            
            <p style="text-align: center; color: #7f8c8d; font-style: italic;">Este nivel puede afectar el rendimiento del sistema y la experiencia del usuario.</p>
            
            <div class="recommendations">
                <h3>Acciones Recomendadas:</h3>
                <ul>
                    <li>Verificar los procesos que consumen más recursos en el sistema</li>
                    <li>Reiniciar servicios críticos si es necesario</li>
                    <li>Considerar escalar recursos si el problema persiste</li>
                    <li>Revisar logs del sistema para identificar posibles causas</li>
                    <li>Notificar al equipo de operaciones sobre la situación</li>
                    <li>Monitorear la tendencia del recurso afectado</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; border: 2px dashed #bdc3c7;">
                    <p style="margin: 0; color: #2c3e50; font-weight: 600;">⚠️ Este es un mensaje automático del sistema de monitoreo. Por favor, tome las acciones necesarias.</p>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Equipo de Monitoreo del Sistema</strong></p>
            <p>Si considera que esta alerta es incorrecta, contacte al administrador del sistema inmediatamente.</p>
            
            <div class="contact-info">
                <p style="margin: 0;">📧 Soporte Técnico | 📞 Extensión 1234</p>
            </div>
            
            <div class="signature">
                <p>Desarrollado por Cesar E. Avila B. | cesar.e.avila.b@gmail.com</p>
            </div>
        </div>
    </div>
</body>
</html>`
    return notification;
    };
    static telegramAlertTemplate(alertMessage) {
        let notification = '';
        switch (alertMessage.clase) {
            case 'cpu':
notification = `🚨 *ALERTA DE CPU* 💻

⚠️ ${alertMessage.metrica}

‼️ Esta actualmente en : ${alertMessage.magnitud} ‼️

🔴 El umbral establecido es: ${alertMessage.umbral}

Esto podria afectar el rendimiento del sistema y la experiencia del usuario.

⏰ *Alerta encontrada:* ${alertMessage.timestamp}
`;
            break;
            case 'memoria':
notification = `🚨 *ALERTA DE MEMORIA* 🧠

⚠️ ${alertMessage.metrica}

‼️ Esta actualmente en : ${alertMessage.magnitud} ‼️

🔴 El umbral establecido es: ${alertMessage.umbral}

Esto podria afectar el rendimiento del sistema y la experiencia del usuario.

⏰ *Alerta encontrada:* ${alertMessage.timestamp}
`;
            break;
            case 'disco':
notification = `🚨 *ALERTA DE DISCO* 💾

⚠️ ${alertMessage.metrica}

‼️ Esta actualmente en : ${alertMessage.magnitud} ‼️

🔴 El umbral establecido es: ${alertMessage.umbral}

Esto podria afectar el rendimiento del sistema y la experiencia del usuario.

⏰ *Alerta encontrada:* ${alertMessage.timestamp}
`;
            break;
            default:
notification = `🚨 *ALERTA DEL SISTEMA* 

⚠️ ${alertMessage.metrica}

‼️ Esta actualmente en : ${alertMessage.magnitud} ‼️

🔴 El umbral establecido es: ${alertMessage.umbral}

Esto podria afectar el rendimiento del sistema y la experiencia del usuario.

⏰ *Alerta encontrada:* ${alertMessage.timestamp}
`;
            break;
        }
        return notification;
    };
    static eventosCloudflareTelegram(messageBody){
       const notification = `⚠️ Se han detectado posibles ataques ⚠️
🔵 Lista Actual de IPs Encontradas 🔵

${messageBody}

‼️Esto es un mensaje de pruebas‼️`
        return notification;
    };

    
    static shellAlertTemplate(alertMessage) {
        let icon1 = ''
        let icon2 = ''
        let info = ''
        let statusAlert = alertMessage.status
        if (statusAlert){
            icon1 = '🆗'
            info = '✅ Se ejecuto con exito la tarea'
            icon2 = '🟢'
        }else{
            icon1 = '🆘'
            info = '❌ La tarea fallo por algun motivo'
            icon2 = '🔴'

        }
        let notification = '';
        notification = `📢 NOTIFICACION DE SERVICIO ${icon2}

${icon1} ${alertMessage.tipo}

${info}

Nota: ${alertMessage.observaciones}

⏰ *Notificacion encontrada:* ${alertMessage.timestamp}` 

        return notification;
    };
}

module.exports = { Templates };