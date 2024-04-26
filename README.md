# TP3_Daemon

**Integrantes: Franco Battista y Tobias Andrade**

El Daemon consta de una gestión de copias de seguridad de una base de datos, encriptación, envío del backup a un servidor remoto, almacenamiento y envío de mails a ciertos usuarios informando que una nueva copia de seguridad fue generada (o que hubo un error). Además, se borrará una copia de seguridad que exceda una cantidad de días. El Daemon deja un log de todas las copias que fue haciendo. Todo esto utilizando systemd.

REQUERIMIENTOS
-NodeJS
-Mysql (o un motor de base de datos, por default mysql)

Para ejecutar el Daemon, necesitamos primero pasar por el archivo de configuración. Su ubicación es por default la raiz del repositorio. Si este se modifica, se debe modificar el archivo ***ej_dameon.config.js***

Dentro del archivo "daemon.conf.txt" encontraremos las configuraciones para el daemon, junto con comentarios explicativos y las opciones que puede contener cada atributo de configuración.

## Configuración de la base de datos

Nos ubicamos en la sección "CONFIGURACIÓN BASE DE DATOS".

Aqui elegiremos el motor de la base de datos, nombre de la base de datos, usuario y contraseña de la misma.

Por el momento, solo se permite "mysql".

## Configuración de la encriptación

Primero nos ubicamos en la sección "CONFIGURACIÓN DE ENCRIPTACION".

Para la encriptación, se necesita que se ingresen las claves dependiendo del metodo usado. En este caso, para el metodo aes-256-cbc es necesario una clave y un vector de inicialización. La clave necesaria es una clave de 32 bytes hasheada con sha256 y puede generarse de la siguiente forma, desde  la libreria ***openssl*** (o la libreria que deseen, mientras mantegan el formato):

***echo -n "mi_clave_super_secreta:salt" | openssl sha256*** 

***mi_clave_super_secreta*** y ***salt*** pueden ser modificados a gusto por el usuario

Luego, es necesario el vector de inciación, que sera una clave de 16 bytes, tambien utilizada para el metodo aes-256-cbc, propuesto inicialmente para el daemon.

***openssl rand -hex 16***

Nos guardamos ambas claves y las ingresamos en el archivo de configuración, quedando de la siguiente forma:

encryptMethod=aes-256-cbc

secretKey=< ClaveGenerada >

IV=< VectorGenerado >


## Configuración del servidor remoto

Nos ubicamos en la sección "CONFIGURACIÓN SERVIDOR REMOTO".

Primero elegimos el servidor donde guardaremos los archivos, en este caso UTILIZAR "DROPBOX".
Luego, ingresamos el token de acceso generado en este caso en la consola de aplicación de dropbox, para poder acceder a su API.
Para finalizar, ingresamos la ubicación donde deseamos que se guarden los archivos en el servidor remoto, en la clave "remoteBackupDir"

Para crear el **accessToken** de dropbox, ingresar a:

***https://www.dropbox.com/developers/apps***

Si no se tiene una cuenta creada, crearla e ingresar nuevamente al link.

Presionar en "Create App", seleccionar las opciones "Full scoped" y "Full Dropbox", y elegimos un nombre para la aplicacion.

Se redigirá a las acciones de la aplicacion, ingresar en la seccion "Permissions" y tildar todos los checkboxes de las secciones "Account info" y "Files and folders"

Luego, volver a la seccions "Settings", scrollear hacia abajo y seleccionar la opcion "Generate" en "Generate access token". Con eso, se generara un accesToken que se utilizará en el archivo de configuración.


## Configuración del mail

Nos ubicamos en la sección "CONFIGURACIÓN DEL MAIL".

Aquí, se utiliza la libreria ***"nodemailer"*** para el envío de correos. Para usar su correo para el envío de los mismos, debe elegir su proveedor, usuario, contraseña para que se ingrese correctamente a la cuenta y se pueda enviar correos.

En la clave ***receptors*** se encontrarán los receptores de los mails. Puede ser uno o varios, separados con ",". La cantidad de mails debe ser mayor o igual a uno, sin necesidad de "," si es solo uno.

*Ejemplo: receptors=franco.battista99@outlook.com,tobiaseltoti5@gmail.com*

ACLARACION

Para loguearse con una cuenta de gmail, es necesario una contraseña de aplicacion. Para ello, seguimos los pasos especificados en el siguiente link:

https://support.google.com/accounts/answer/185833?hl=es

Cuando generamos la clave, la ingresamos en el archivo de configuración.


## Configuración final

Nos ubicamos en la sección "OTRA CONFIGURACIÓN".

Aquí se podra determinar la ubicación de los archivos de log, la ubicación que deseamos para el backup local, y la cantidad de días para ejecutar el daemon y su rotación de archivos.

La ubicación de los logs es:

***/var/log/daemonTP3*** 

y no pueden ser modificadas.

## Ejecución del daemon

Para la ejecución del daemon, se utilizó systemd.

Primero, clonamos el repositorio con ***git clone urlRepositorio***. Luego, ingresamos ***npm install*** para instalar las dependencias necesarias.

Luego, es necesario modificar el archivo ***ej_daemon.service***, cambiando la ubicacion del ***ExecStart***, a la ubicación donde fue clonado el repositorio. Quedando de la siguiente forma:

***ExecStart=/usr/bin/node /ruta/al/ejecutable.js***

En el caso que se uitlicen herramientas como nvm, ***/usr/bin/node*** debera ser modificada por el path al ejecutable de NodeJS.

Para la ejecución, se debe enviar el archivo ***ej_daemon.service*** a la carpeta ***/etc/systemd/system***. 

Luego se debe ejecutar el comando ***sudo systemctl start ej_daemon.service*** si se desea ejecutar el mismo, y ***sudo systemctl stop ej_daemon.service*** si se desea detenerlo. 

Si se desea cambiar configuración del ***ej_dameon.service*** , editar con un editor de texto, y luego ingresar ***sudo systemctl daemon reload***.

Para mas información, se pueden revisar los archivos de log, ubicados por el usuario.

