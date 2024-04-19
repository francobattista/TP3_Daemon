const daemonConfig = require('./daemon.config')
const fs = require('fs')
const { exec } = require('child_process')
const { Dropbox } = require('dropbox')
const nodemailer = require('nodemailer')

let dbx;

//Configuration of the Daemon
let config = {
    currentDate: new Date()
};

const initDrive = async () => {
    try {
        dbx = new Dropbox({
            accessToken: config.accessToken,
            fetch:fetch
        })
    } catch (error) {
        throw error;
    }
}

// Read daemon settings
const readConf = () => {
    try {
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
    } catch (error) {
        console.error(config.currentDate.toISOString() + "ERROR: " + error)
        throw new Error("Ha ocurrido un error leyendo la configuracion. Revisela.");
    }
}

// GENERA EL BACKUP PARA BASE DE DATOS SQLSERVER

const sqlServerBackup = () => {

}


// GENERA EL BACKUP PARA BASE DE DATOS MYSQL

const mysqlBackup = () => {

    return new Promise(async (resolve, reject) => {
        try {
            const command = `mysqldump -u ${config.databaseUser} -p${config.databasePassword} ${config.databaseName} > ${config.backupDir}/${config.currentDate.toISOString()}.sql`;
            
            exec(command,(error, stdout, stderror) => {
                try {
                    if(error){
                        throw error;
                    }
                
                    resolve();       
                } catch (error) {
                    console.error(config.currentDate.toISOString() + " ERROR: " + error)
                    reject(new Error("Ha ocurrido un error generando el backup. Chequee los archivos de log para mas informacion"))                }    
            });
        } catch (error) {
            console.error(config.currentDate.toISOString() + " ERROR: " + error)
            reject(new Error("Ha ocurrido un error generando el backup. Chequee los archivos de log para mas informacion"))
        }      
   
    })
}

// ELIJE LA BASE DE DATOS

const makeBackup = () => {
    return new Promise(async (resolve,reject) => {
        try {
            switch(config.engineDb){
                case 'mysql': {
                    await mysqlBackup()
                    break;
                }
                case 'sqlserver': {
                    await sqlServerBackup();
                    break;
                }
            }    
            resolve()

            } catch (error) {
                console.error(config.currentDate.toISOString() + "ERROR: " + error)
                reject(new Error("Ha ocurrido un error generando el backup. Chequee los archivos de log para mas informacion"))            }
        })
}

// ENCRIPTA LA COPIA DE SEGURIDAD

const encryptData = () =>  {

    return new Promise(async (resolve, reject) =>{
        try {
            const command = `openssl enc -${config.encryptMethod} -k ${config.secretKey} -salt -in ${config.backupDir}/${config.currentDate.toISOString()}.sql -out ${config.backupDir}/${config.currentDate.toISOString()}-encrypted.sql`;
            
            exec(command, (error, stdout, stderror) => {
                if(error){
                    reject(error)
                }
                    
                resolve(`${config.currentDate.toISOString()}-encrypted.sql`);
            });                
        } catch (error) {
            console.error(config.currentDate.toISOString() + " ERROR: " + error)
            reject(new Error("Ha ocurrido un error encriptando el backup. Chequee los archivos de log para mas informacion"))        }

    })

}
  

// SUBE LA COPIA DE SEGURIDAD ENCRIPTADA A DROPBOX
const uploadFile = async (fileName) => {
    
    return new Promise(async (resolve, reject) => {
        const fileContent = fs.readFileSync(`${config.backupDir}/${fileName}`, 'utf-8')
        try {
            const fileUpload = await dbx.filesUpload({path:`${config.remoteBackupDir}/${fileName}`, contents: fileContent})
            resolve(fileUpload)
        } catch (error) {
            console.error(config.currentDate.toISOString() + " ERROR: " + error)
            reject(new Error("Ha ocurrido un error en la subida del backup. Éste no se ha completado. Chequee los archivos de log para mas informacion"))
        }
    })
}

// SUBE LA COPIA DE SEGURIDAD ACTUAL SIN ECRIPTAR

const deleteCurrentNotEncrypted =  () => {
       
    return new Promise(async (resolve, reject) => {
        try {
            const deleted = fs.unlinkSync(`${config.backupDir}/${config.currentDate.toISOString()}.sql`);
            resolve(deleted)
        } catch (error) {
            console.log(config.currentDate.toISOString() + "INFO: Copia de seguridad completada correctamente y enviada al servidor, pero chequear errores en el log")
            console.error(config.currentDate.toISOString() + "ERROR: " + error)
            reject(new Error("Ha ocurrido un error eliminando el backup no encriptado. Chequee los archivos de log para mas informacion"))        }
    })
}

// ROTACION DE BACKUPS LOCAL

const deleteOldFileLocal = async () => {
    try {

        const currentFiles = fs.readdirSync("./backups")

        if(currentFiles && currentFiles.length){
            currentFiles.forEach((fileName) => {
                const creationDate = fs.statSync(`${config.backupDir}/${fileName}`).birthtime;
    
                const daysTranscurred = (config.currentDate - creationDate) / (1000 * 3600 * 24);
    
                if(daysTranscurred > config.daysToDeleteCopy){
                    const deleted = fs.unlinkSync(`${config.backupDir}/${fileName}`);
                }
            })
        }
    } catch (error) {
        console.log(config.currentDate.toISOString() + "INFO: Copia de seguridad completada correctamente y enviada al servidor, pero chequear errores en el log")
        console.error(config.currentDate.toISOString() + "ERROR: " + error)
        throw new Error("Ha ocurrido un error eliminando una copia antigua localmente.");
    }

}

// ROTACION DE BACKUPS REMOTO

const deleteOldFileRemote = async () => {
    try {

        const files = (await dbx.filesListFolder({path: config.remoteBackupDir})).result
    
        if(files && files.entries && files.entries.length){
            files.entries.forEach((file) => {
                //POr mas que el currentDate sea la fecha de cuando se creo archivo, es lo mismo porque el utlimo archivo nunca lo borra
                const daysTranscurred = (config.currentDate - new Date(file.client_modified)) / (1000 * 3600 * 24);
                if(daysTranscurred > config.daysToDeleteCopy){
                    dbx.filesDeleteV2({path: `${config.remoteBackupDir}/${file.name}`})
                }
            })
        }
    } catch (error) {
        console.log(config.currentDate.toISOString() + "INFO: Copia de seguridad completada correctamente y enviada al servidor, pero chequear errores en el log")
        console.error(config.currentDate.toISOString() + "ERROR: " + error)
        throw new Error("Ha ocurrido un error eliminando una copia antigua localmente.");
    }
}


// ENVIO DE MAILS

const sendMail = (iserror) => {
    return new Promise(async (resolve, reject) => {
        try {

            //Puesto aca para que actualice cada ves que manda un mail, por si cambian las config.
            const transporter = nodemailer.createTransport({
                service: config.mailService,
                auth: {
                    user: config.mailUser,
                    pass: config.mailPassword
                }
            })

            const receptores = config.receptors.split(',');

            if(receptores && receptores.length){

                let mailOptions = {
                    from: config.mailUser
                }
                receptores.forEach((receptor) => {


                    if(!receptor) throw new Error("Ocurrio un error con el envío de correos");

                    if(!iserror){
                        console.log("NO error");
                        mailOptions.to = receptor;
                        mailOptions.subject = "Copia de seguridad";
                        mailOptions.text = "La copia de seguridad ha sido guardada con éxito";

                                    
                        // Enviar el correo electrónico
                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) {
                                throw error
                            } else {
                                resolve()
                                console.log('Correo electrónico enviado: ' + info.response);
                            }
                        });
        
                    }else{
                        
                        mailOptions.to = receptor;
                        mailOptions.subject = "Error en copia de seguridad";
                        mailOptions.text = iserror;
                        
                        // Enviar el correo electrónico
                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) {
                                console.log("EL error es: " + error);
                            } else {
                                resolve()
                                console.log('Correo electrónico enviado: ' + info.response);
                            }
                        });
                    }
                })
            }

            
        
        } catch (error) {
            console.error(config.currentDate.toISOString() + "ERROR: " + error)
            //reject(new Error("Ha ocurrido un error en el envío del mail. Chequee los archivos de log para mas informacion"))
        }
    })
}


// INICIO DEL DAEMON

const initDaemon = async () => {
    try {
        while(true){
            setTimeout(async() => {
                console.log("Ejecutando");
                readConf();
                await initDrive();
                await makeBackup();
                const fileName = await encryptData();
                await uploadFile(fileName);
                await deleteCurrentNotEncrypted();
    
                //Mejor que sean al final por si hay algun error que no se haya eliminado
                await deleteOldFileLocal();
                await deleteOldFileRemote();
    
                await sendMail();
                console.log(config.currentDate.toISOString() + "INFO: Copia de seguridad completada correctamente y enviada al servidor")
                
            }, 2000);
               
        }
    } catch (error) {
        console.log("Cazando el error: " + error);
        //Cambiar para ver porque da error
        await sendMail(error);
        //console.error(config.currentDate.toISOString() + error)
        
    }
}

//Si cambiamos la configuracion, debemos darle a restart al servicio. Para asi entiende los cambios
initDaemon();