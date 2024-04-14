const daemonConfig = require('./daemon.config')
const http = require('http')
const fs = require('fs')
const crypto = require('crypto');
const { exec } = require('child_process')


//Configuration of the Daemon
let config = {};


// Read daemon settings
const readConf = async () => {

    const lines = fs.readFileSync(daemonConfig.config.configDir, 'utf-8').split('\n');

    lines.forEach((line) => {
        
        if (line.trim() === '' || line.trim().startsWith('#')) {
            return;
        }
    
    
        // Separe the comments
        const [keyValue, comments] = line.split('#');

        //Take the key and the value
        const [key, value] = keyValue.trim().split('=');
    
    
        // Almacena el campo y el valor en el objeto de configuración
        config[key.trim()] = value.trim();

        // También puedes manejar los comentarios si los necesitas
        if (comments && comments.length > 0) {
        // Haz algo con los comentarios si es necesario
        }
    
    })

    console.log(config);



}


const sqlServerBackup = () => {

}


const mysqlBackup = () => {

    // Comando mysqldump para realizar la copia de seguridad
    const command = `mysqldump -u ${config.databaseUser} -p ${config.databasePassword} ${config.databaseName} > ${config.backupDir}`;
    
    // Ejecuta el comando mysqldump, la salida recordar que tiene que ir al log
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error al ejecutar el comando: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Error en la salida estándar: ${stderr}`);
        return;
      }
      console.log(`Copia de seguridad exitosa. Salida estándar: ${stdout}`);
    });
}


const makeBackup = () => {

    switch(config.engineDb){
        case 'mysql': {
            mysqlBackup()
            break;
        }
        case 'sqlserver': {
            sqlServerBackup();
            break;
        }
    }

}


const encryptData = () => {

}



const uploadData = () => {

}


const sendMail = () => {

}



const deleteOldCopy = () => {

}



const writeLog = () => {

}

readConf();
makeBackup()