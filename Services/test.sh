#!/bin/bash
TIPO="Backup de base de datos"
ARCHIVO=archivo.txt
FS_USE=`df -h /d 2>/dev/null |awk '{print $5}' |grep -v "Uso" `
if [ $? -ne 0 ]; then
    USO_DISK="No se logro verificar el estado del FileSystem"
else
    USO_DISK="Uso del FileSystem en: $FS_USE"
fi


cp $ARCHIVO /tmp 2>/dev/null
if [ $? -eq 0 ]; then
    ESTATUS="true"
    node notificationFromShell.js --tipo "$TIPO" --sta "$ESTATUS" --observaciones "$USO_DISK"
else
    ESTATUS="false"
    node notificationFromShell.js --tipo "$TIPO" --sta "$ESTATUS" --observaciones "$USO_DISK"
fi