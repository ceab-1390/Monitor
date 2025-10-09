#!/bin/bash

ARCHIVO=archivo.txt
FS_USE=`df -h / 2>/dev/null |awk '{print $5}' |grep -v "Uso" `
if [ $? -ne 0 ]; then
    FS_USE=null
fi


cp $ARCHIVO /tmp 2>/dev/null
if [ $? -eq 0 ]; then
    BK_STA='{"Backup":"success","timestamp":"'`date +%H-%M-%S`'","file":"'$ARCHIVO'","volume_usage":"'$FS_USE'"}'
    node notificationFromShell.js --json $BK_STA
else
    BK_STA='{"Backup":"fail","timestamp":"'`date +%H-%M-%S`'","file":"'$ARCHIVO'","volume_usage":"'$FS_USE'"}'
    node notificationFromShell.js --json $BK_STA
fi