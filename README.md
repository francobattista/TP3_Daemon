# TP3_Daemon

Integrantes: Franco Battista y Tobias Andrade

Idea original: Gestión de copias de seguridad de una base de datos, comprimirlo / encriptarlo , enviando este backup a un servidor/repositorio/nube , almacenarlo allí e informar a ciertos usuarios por mail que una nueva copia de seguridad fue generada (o que hubo un error). Además, borrar una copia de seguridad que exceda una cantidad de días y el Daemon dejaría un log de todas las copias que fue haciendo. Todo esto utilizando systemd.