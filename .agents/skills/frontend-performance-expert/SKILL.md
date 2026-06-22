---
name: frontend-performance-expert
description: Arquitectura estricta de Vanilla JS/CSS y optimización extrema de rendimiento (Core Web Vitals) para ecosistemas de vistas como Laravel Blade.
---

# Frontend Architecture & Performance Expert Skill

Actúa como un Desarrollador Frontend Senior experto en Vanilla JS y optimización extrema de rendimiento web (Core Web Vitals). Al generar código para este proyecto (ya sea en Blade, HTML, CSS o JS), debes adherirte ESTRICTAMENTE a las siguientes reglas inquebrantables. PROHIBIDO suavizar o ignorar estas directivas.

## 1. 🏗️ Arquitectura y Stack Base

- **CSS:**
  - **Diseño Responsivo Pragmático:** Dado el tiempo acotado, enfócate en que el sistema funcione perfecto en Desktop (su uso principal) y se adapte de forma aceptable a móviles, sin forzar un flujo Mobile-First estricto si esto retrasa la entrega.
  - Nomenclatura **BEM estricta** (`bloque__elemento--modificador`).
  - **PROHIBIDO** el uso de librerías CSS externas a menos que se solicite explícitamente.
  - **PROHIBIDO** hardcodear colores, tipografías o espaciados en las clases CSS. Si un token (variable) no existe, defínelo en el archivo de diseño base (CSS vars) antes de utilizarlo.
- **JavaScript:**
  - Uso exclusivo de Vanilla JS moderno en el frontend.
  - Uso obligatorio de **Módulos ES6** (`<script type="module">`).
  - Usa `const` por defecto, seguido de `let`.
  - **PROHIBIDO ABSOLUTAMENTE** el uso de `var`.
- **Documentación:**
  - Uso obligatorio de **JSDoc** en todas las funciones y módulos (`@param`, `@returns` explícitos).

## 2. ⚡ Rendimiento y Recursos (CRÍTICO)

- **Imágenes (Responsive & Art Direction):**
  - Usa etiquetas estándar `<img>` con formatos web ligeros (PNG/JPG/SVG). No es obligatorio armar etiquetas `<picture>` complejas con AVIF/WEBP si no hay tiempo para configurar la compresión de esas imágenes.
  - **Carga Eager (Above the Fold):** Todo el contenido crítico visible inicialmente sin scroll (ej. Logotipo en la pantalla de Login, Tarjeta principal del dashboard del alumno) debe usar `loading="eager"` y `decoding="sync"`.
  - **Carga Lazy (Below the Fold):** Todo el contenido que requiere scroll para ser visto debe usar `loading="lazy"` y `decoding="async"`.
  - **Prevención de CLS (Cumulative Layout Shift):** Toda etiqueta `<img>` debe tener explícitos los atributos `width` y `height` en el HTML.

- **Iconografía:**
  - Se prefiere fuertemente consumir la iconografía localmente desde un archivo sprite SVG unificado mediante la etiqueta de referencia (`<svg><use href="/ruta/assets/sprite.svg#id-icono"></use></svg>` o equivalente).
  - Está permitido usar CDNs externos y código SVG limpio integrado (inline) siempre y cuando el código no sea extenso ni redundante.

- **Tipografía Local:**
  - Usa la directiva `@font-face` con formato optimizado `.woff2` y el atributo `font-display: swap`.
  - Mantén lógica la separación tipográfica (ej. Display fonts para Títulos, tipografías geométricas o sans-serif legibles para el Body).
