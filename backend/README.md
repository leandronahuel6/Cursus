# ⚙️ Cursus - Backend (Laravel)

Este directorio contiene la aplicación principal del proyecto **Cursus**, desarrollada utilizando el framework Laravel.

## 🛠 Requisitos Previos

- PHP >= 8.2
- Composer
- MySQL o MariaDB
- Node.js y npm (Opcional, para empaquetado de assets de Vite si se usa)

## 🚀 Instalación y Configuración

1. **Clonar el repositorio y acceder al directorio backend:**

    ```bash
    cd backend
    ```

2. **Instalar las dependencias de PHP:**

    ```bash
    composer install
    ```

3. **Configurar las variables de entorno:**
   Copia el archivo de ejemplo para crear tu `.env` local.

    ```bash
    cp .env.example .env
    ```

    Abre el archivo `.env` y configura los datos de acceso a tu base de datos local (principalmente `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`).

4. **Generar la clave de la aplicación:**

    ```bash
    php artisan key:generate
    ```

5. **Ejecutar las migraciones y seeders:**
   _(Para crear la estructura de la base de datos y cargar datos iniciales)_

    ```bash
    php artisan migrate --seed
    ```

6. **Levantar el servidor de desarrollo:**
    ```bash
    php artisan serve
    ```
    El sitio estará disponible en `http://localhost:8000`.

## 📁 Estructura Principal del Framework

- `app/` - Contiene la lógica central (Modelos, Controladores).
- `routes/` - Definición de rutas (`web.php`, `api.php`).
- `resources/views/` - Vistas construidas con el motor de plantillas Blade.
- `public/` - Archivos accesibles por el navegador. Particularmente `public/js/` contiene los scripts Javascript Vanilla que otorgan la interactividad al frontend.
- `database/` - Definiciones de base de datos (Migraciones, Seeders y Factories).

## 🔗 Relación Frontend/Backend

La aplicación renderiza las vistas iniciales de manera tradicional mediante **Blade**. Sin embargo, para brindar una experiencia fluida, modular y sin recargas de página constantes, el cliente web utiliza **JavaScript Vanilla** para actualizar el DOM localmente y realizar peticiones asíncronas (`fetch`) a las rutas de Laravel (tanto web como API).
