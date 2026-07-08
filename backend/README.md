# ⚙️ Cursus - Backend (Laravel)

Este directorio contiene la aplicación principal del proyecto **Cursus**, desarrollada utilizando el framework Laravel.

## 🚀 Instalación y Configuración

Para configurar tu entorno de desarrollo y levantar el proyecto por primera vez, hemos preparado una guía paso a paso sumamente detallada que incluye los requisitos previos, la conexión a la base de datos, Mailpit, la API de IA y las variables de entorno.

👉 **[Ver la Guía de Inicio Rápido y Configuración Local](docs/guia_inicio_rapido_configuracion_entorno_local.md)**

## 📁 Estructura Principal del Framework

- `app/` - Contiene la lógica central (Modelos, Controladores).
- `routes/` - Definición de rutas (`web.php`, `api.php`).
- `resources/views/` - Vistas construidas con el motor de plantillas Blade.
- `public/` - Archivos accesibles por el navegador. Particularmente `public/js/` contiene los scripts Javascript Vanilla que otorgan la interactividad al frontend.
- `database/` - Definiciones de base de datos (Migraciones, Seeders y Factories).

## 🔗 Relación Frontend/Backend

La aplicación renderiza las vistas iniciales de manera tradicional mediante **Blade**. Sin embargo, para brindar una experiencia fluida, modular y sin recargas de página constantes, el cliente web utiliza **JavaScript Vanilla** para actualizar el DOM localmente y realizar peticiones asíncronas (`fetch`) a las rutas de Laravel (tanto web como API).
