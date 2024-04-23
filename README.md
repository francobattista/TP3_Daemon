# TP3_Daemon

**Integrantes: Franco Battista y Tobias Andrade**

El Daemon consta de una gestión de copias de seguridad de una base de datos, encriptacion, envío del backup a un servidor remoto, almacenamiento y envio de mails a ciertos usuarios informando que una nueva copia de seguridad fue generada (o que hubo un error). Además, se borrará una copia de seguridad que exceda una cantidad de días. El Daemon deja un log de todas las copias que fue haciendo. Todo esto utilizando systemd.

REQUERIMIENTOS
-NodeJS
-Mysql (o un motor de base de datos, por default mysql)

Para ejecutar el Daemon, necesitamos primero pasar por el archivo de configuracion. Su ubicacion es por default la raiz del repositorio. Si este se modifica, se debe modificar el archivo ***ej_dameon.config.js***

Dentro del archivo "daemon.conf.txt" encontraremos las configuraciones para el daemon, junto con comentarios explicativos y las opciones que puede contener cada atributo de configuracion.

## Configuracion de la base de datos

Nos ubicamos en la seccion "CONFIGURACION BASE DE DATOS".

Aqui elegiremos el motor de la base de datos, nombre de la base de datos, usuario y contraseña de la misma.

## Configuracion de la encriptacion

Primero nos ubicamos en la seccion "CONFIGURACION DE ENCRIPTACION".

Para la encriptacion, se necesita que se ingresen las claves dependiendo el metodo usado. En este caso, para el metodo aes-256-cbc es necesario una clave y un vector de inicializacion. La clave necesaria es una clave de 32 bytes hasheada con sha256 y puede generarse de la siguiente forma, desde  la libreria ***openssl*** (o la libreria que se deseen, mientras mantegan el formato):

***echo -n "mi_clave_super_secreta:salt" | openssl sha256*** 

***mi_clave_super_secreta*** y ***salt*** pueden ser modificados a gusto por el usuario

Luego, es necesario el vector de inciacion, que sera una clave de 16 bytes, tambien utilizada para el metodo aes-256-cbc, propuesto inicialmente para el daemon.

***openssl rand -hex 16***

Nos guardamos ambas claves y las ingresamos en el archivo de configuracion, quedando de la siguiente forma:

encryptMethod=aes-256-cbc

secretKey=< ClaveGenerada >

IV=< VectorGenerado >


## Configuracion del servidor remoto

Nos ubicamos en la seccion "CONFIGURACION SERVIDOR REMOTO".

Primero elegimos el servidor donde guardaremos los archivos, en este caso se propone dropbox.
Luego, ingresamos el token de acceso generado en este caso en la consola de aplicacion de dropbox, para poder acceder a su API.
Para finalizar, ingresamos la ubicacion donde deseamos que se guarden los archivos en el servidor remoto, en la clave "remoteBackupDir"


## Configuracion del mail

Nos ubicamos en la seccion "CONFIGURACION DEL MAIL".

Aqui, se utiliza la libreria "nodemailer" para el envio de correos. Para usar su correo para el envio de los mismos, debe elegir su proveedor, usuario, contraseña para que se ingrese correctamente a la cuenta y se puede enviar correos.

En la clave ***receptors*** se enconrtaran los receptores de los mails. Puede ser uno o varios, se separados con ",". La cantidad de mails debe ser mayor o igual a uno, sin necesidad de "," si es solo uno.

*Ejemplo: receptors=franco.battista99@outlook.com,tobiaseltoti5@gmail.com*


## Configuracion final

Nos ubicamos en la seccion "OTRA CONFIGURACION".

Aqui se podra determinar la ubicacion de los archivos de log, la ubicacion que deseamos para el backup local, y la cantidad de dias para ejecutar el daemon y su rotacion de archivos.

La ubicacion de los logs es:

***/var/log/daemonTP3*** 

y no pueden ser modificadas.

## Ejecucion del daemon

Para la ejecucion del daemon, se utilizó systemd.

Primero, es necesario modificar el archivo ***ej_daemon.service***, cambiando la ubicacion del ***ExecStart***, a la ubicacion donde fue clonado el repositorio. Quedando de la siguiente forma:

***ExecStart=/usr/bin/node /ruta/al/ejecutable.js***

En el caso que se uitlicen herramientas como nvm, ***/usr/bin/node*** debera ser modificada por el path al ejecutable de NodeJS.

Para la ejecución, se debe enviar el archivo ***ej_daemon.service*** a la carpeta ***/etc/systemd/system***. 

Luego se debe ejecutar el comando ***sudo systemctl start ej_daemon.service*** si se desea ejecutar el mismo, y ***sudo systemctl stop ej_daemon.service*** si se desea detenerlo. 

Si se desea cambiar configuracion del ***ej_dameon.service*** , editar con un editor de texto, y luego ingresar ***sudo systemctl daemon reload***.

Para mas informacion, se pueden revisar los archivos de log, ubicados por el usuario.

