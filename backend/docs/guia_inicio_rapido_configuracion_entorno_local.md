# Guía de Inicio Rápido: Configuración del Entorno Local

Esta guía detalla los pasos exactos para configurar tu computadora, clonar el repositorio y levantar el proyecto correctamente por primera vez. Sigue los pasos en orden.

---

## 1. Entorno Local (Laragon)

Para este proyecto utilizamos **Laragon** como nuestro entorno de desarrollo local.

**¿Por qué Laragon?**
A diferencia de usar `php artisan serve`, Laragon nos provee un entorno web real utilizando Apache y MySQL. Su mayor ventaja es la función de _Auto Virtual Hosts_: detecta automáticamente nuestro proyecto de Laravel y genera una URL local limpia (por ejemplo, `http://cursus.test`), permitiéndonos trabajar en múltiples proyectos simultáneamente sin conflictos de puertos.

**Paso a paso: Añadir Laragon al PATH**
Para poder usar comandos como `php` o `composer` desde cualquier terminal, necesitas agregar Laragon a las variables de entorno de tu sistema. Laragon lo hace automáticamente:

1. Abre la interfaz principal de Laragon y enciéndelo.
2. Haz clic derecho en cualquier espacio en blanco del fondo de la ventana para abrir el menú.
3. Ve a **Tools** > **Path**.
4. Haz clic en **Add Laragon to Path**.
5. _Importante:_ Cierra cualquier terminal que tengas abierta y vuelve a abrirla para que los cambios surtan efecto.

**Cómo servir y visualizar el proyecto**

1. Asegúrate de que la carpeta raíz del proyecto esté ubicada estrictamente dentro del directorio de Laragon: `C:\laragon\www\`. (Ejemplo: `C:\laragon\www\cursus\`).
2. En la interfaz de Laragon, presiona **Iniciar Todo** (Start All) para encender Apache y MySQL.
3. Abre tu navegador e ingresa el nombre exacto de la carpeta seguido de `.test` (ej. `http://cursus.test`).

---

## 2. Base de Datos

El proyecto requiere PHP 8.3, por lo que utilizaremos **phpMyAdmin 6** (o al menos la versión 5.2.3) para evitar problemas de compatibilidad con código obsoleto.

**Integración de phpMyAdmin en Laragon:**

1. Si Laragon no lo incluye por defecto, descarga phpMyAdmin y extrae la carpeta en `C:\laragon\etc\apps\phpMyAdmin`.
2. Reinicia Laragon. Podrás acceder haciendo clic derecho en Laragon > **MySQL** > **phpMyAdmin**.

**Acceso y creación de la Base de Datos:**

1. En la pantalla de inicio de sesión de phpMyAdmin, ingresa exactamente estos datos:

- **Usuario:** `root`
- **Contraseña:** _(Deja este campo completamente vacío)_

2. Una vez dentro, ve a la pestaña **Bases de datos**.
3. En "Nombre de la base de datos", escribe **`cursus`** (o el nombre que figure en el `.env`).
4. En el menú desplegable de "Cotejamiento" (Collation), selecciona **`utf8mb4_unicode_ci`**.
5. Haz clic en **Crear**. _(No es necesario crear ninguna tabla manualmente)._

---

## 3. Puesta en Marcha del Proyecto

Asumiendo que ya hiciste `git clone` o `git pull` del repositorio dentro de `C:\laragon\www\`, hay archivos vitales que Git ignora por seguridad. Ejecuta los siguientes comandos **en orden** dentro de la terminal en la raíz del proyecto:

**1. Instalar dependencias de PHP:**

```bash
composer install

```

**2. Configurar variables de entorno:**
Crea tu archivo `.env` local copiando la plantilla.

```bash
# En Windows (CMD)
copy .env.example .env

```

**3. Generar la clave de seguridad:**

```bash
php artisan key:generate

```

**4. Configurar conexión a la base de datos:**
Abre el nuevo archivo `.env` en tu editor y asegúrate de que estas líneas reflejen tu entorno local:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cursus
DB_USERNAME=root
DB_PASSWORD=

```

**5. Construir la estructura de la base de datos:**

```bash
php artisan migrate

```

**6. Instalar y compilar el Frontend (Vite):**

```bash
npm install
npm run dev

```

_(Deja la terminal con `npm run dev` abierta en segundo plano para habilitar la actualización automática del navegador al modificar CSS/JS/Blade)._

---

## 4. Troubleshooting (Errores comunes)

**Error de Sesiones al iniciar la aplicación**
Un error muy común en versiones recientes de Laravel al clonar un proyecto es recibir un pantallazo de error relacionado con las sesiones o tablas inexistentes antes de poder hacer la migración.

Esto ocurre porque el sistema intenta guardar la sesión del usuario en la base de datos, pero la tabla `sessions` aún no ha sido creada.

**Solución:**
Abre tu archivo `.env`, busca la variable `SESSION_DRIVER` y asegúrate de configurarla correctamente:

- **Para evitar el error temporalmente (o si no usas base de datos para sesiones):** Cambia el valor a `file`.

```env
SESSION_DRIVER=file

```

- **Si debe ser `database`:** Asegúrate de ejecutar `php artisan migrate` **antes** de intentar abrir el proyecto en el navegador. Si el error persiste, borra la caché con `php artisan optimize:clear`.

---

## 5. Referencia Rápida de Comandos (Cheatsheet)

### Composer (Backend / PHP)

- `composer install`: Instala las versiones exactas del `composer.lock` tras clonar el proyecto.
- `composer require [paquete]`: Añade una nueva librería al proyecto.
- `composer dump-autoload -o`: Regenera el mapa de clases de PHP. Útil si Laravel no encuentra una clase recién creada.

### NPM (Frontend / Vite)

- `npm install`: Descarga las dependencias de `package.json` (Node modules).
- `npm run dev`: Inicia el servidor de desarrollo de Vite (Auto-refresh al guardar archivos).
- `npm run build`: Compila, minifica y optimiza los assets dentro de la carpeta `public/build/` para producción.

### Artisan (Automatización y Base de Datos)

- `php artisan make:model Nombre -mcr`: Crea un Modelo, una Migración (`-m`), un Controlador (`-c`) y los asocia como Recurso (`-r`).
- `php artisan route:list`: Imprime una tabla con todas las URLs/Rutas disponibles en la aplicación.
- `php artisan optimize:clear`: Limpia toda la caché (vistas, rutas, configuración). **Comando salvavidas ante comportamientos erráticos.**

**Comandos de Migración (Detalle):**
Las migraciones son el control de versiones de nuestra base de datos.

- `php artisan migrate`: Ejecuta todas las migraciones nuevas que aún no han sido procesadas en tu base de datos local. Crea tablas y columnas.
- `php artisan migrate:status`: Muestra una tabla detallada indicando qué migraciones ya se ejecutaron (`Ran`) y cuáles están pendientes (`Pending`). Ideal para verificar en qué estado está tu entorno local respecto al repositorio.
- `php artisan migrate:rollback`: Deshace el último "lote" de migraciones. Útil si acabas de hacer un `migrate` y te diste cuenta de un error en el código.
- `php artisan migrate:fresh`: **Destruye** por completo la base de datos (borra todas las tablas) y vuelve a ejecutar todas las migraciones desde cero. Muy común en desarrollo para reiniciar el entorno. Se puede combinar con `--seed` para rellenar la base de datos con datos de prueba automáticamente.
