const daemonConfig = require('./daemon.config')
const fs = require('fs')
const { exec } = require('child_process')

//Configuration of the Daemon
let config = {
    currentDate: new Date().toISOString()
};


// Read daemon settings
const readConf = () => {

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

    return new Promise(async (resolve, reject) => {
        
        const command = `mysqldump -u ${config.databaseUser} -p${config.databasePassword} ${config.databaseName} > ${config.backupDir}/${config.currentDate}.sql`;
        
        exec(command,(error, stdout, stderror) => {
            if(error){
                reject(error)
            }
            
            resolve(stdout);        
        });
        
    })

}


const makeBackup = () => {

    return new Promise(async (resolve,reject) => {
        switch(config.engineDb){
            case 'mysql': {
                await mysqlBackup()
                console.log("break");
                break;
            }
            case 'sqlserver': {
                await sqlServerBackup();
                break;
            }
        }    
        resolve()
    })
    
}


const encryptData = () =>  {
    //Ejecuta en consola el comando para encriptar
    return new Promise(async (resolve, reject) =>{
        
        const command = `openssl enc -${config.encryptMethod} -k ${config.secretKey} -salt -in ${config.backupDir}/${config.currentDate}.sql -out ${config.backupDir}/${config.currentDate}-encrypted.sql`;
        console.log("Encriptando");
        exec(command, (error, stdout, stderror) => {
            if(error){
                reject(error)
            }
            
            resolve(stdout);
        });
        
    })

}
  


const uploadData = () => {

}


const sendMail = () => {

}


const deleteCurrentNotEncrypted =  () => {

return new Promise(async (resolve, reject) => {
    console.log("Borrando");
    const deleted = await fs.unlinkSync(`${config.backupDir}/${config.currentDate}.sql`);
    console.log("Borrado");
    resolve(deleted)
})

}

const deleteOldCopy = () => {

}



const writeLog = () => {

}


const initDaemon = async () => {
    try {
        readConf();
        await makeBackup().catch((e) => {throw e});
        await encryptData().catch((e) => {throw e});
        await deleteCurrentNotEncrypted().catch((e) => {throw e});
        console.log(config.currentDate + " Copia de seguridad completada correctamente y enviada al servidor")
    } catch (error) {
        console.error(config.currentDate + error)
    }
}

initDaemon();