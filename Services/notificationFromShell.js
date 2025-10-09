const Logger = require('../Logger/Logger');
const { NotificationService }   = require('../Services/notificationService');
const notifier = new NotificationService();

const args = process.argv.slice(3);

let estatus = JSON.parse(args[0]);
console.log(estatus)