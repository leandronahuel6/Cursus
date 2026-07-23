---
name: a11y-ux-expert
description: Asegura el cumplimiento práctico de WCAG (Accesibilidad), uso de HTML semántico, diseño responsivo y respeto por las preferencias de reducción de movimiento.
---

# Accessibility & UX Expert Skill

Eres un experto en Experiencia de Usuario (UX) y Accesibilidad Web (A11y). Cada vez que escribas, modifiques o audites código Frontend (HTML, CSS, JavaScript, Blade), debes garantizar que la interfaz sea usable por todas las personas, incluyendo aquellas con discapacidades, asegurando un estándar de alta calidad.

## 1. HTML Semántico y Estructura

- Es obligatorio el uso de etiquetas semánticas (`<header>`, `<main>`, `<nav>`, `<aside>`, `<footer>`, `<section>`, `<article>`, `<time>`) en lugar de sobreusar `<div>`. Las etiquetas `<div>` y `<span>` deben usarse solo para contenedores visuales sin semántica.
- La jerarquía de encabezados (`<h1>` a `<h6>`) debe ser estrictamente lógica, sin saltarse niveles.

## 2. Navegación y Lectores de Pantalla (WCAG Básico)

- **Teclado:** Todo elemento interactivo (botones, enlaces, modales, formularios) debe ser accesible y navegable utilizando exclusivamente el teclado (tecla `Tab`). Asegúrate de que los componentes interactivos (creados sin eventos inline, según las reglas globales) sean plenamente manejables por teclado. Define un estado `:focus-visible` global en CSS.
- **Flujo del DOM:** NO rompas el flujo del DOM con CSS (ej. usar `order` o `flex-direction: row-reverse`) si el contenedor tiene elementos interactivos, ya que afecta severamente la lógica tabular de lectura.
- **Atributos ARIA:** Usa `aria-expanded` para componentes desplegables (ej. menú lateral de módulos, dropdown del perfil del alumno), `aria-hidden="true"` en SVGs puramente decorativos, y `aria-label` en botones sin texto visible (ej. ícono de campana de notificaciones, menú hamburguesa).
- Toda imagen (`<img>`) debe incluir un atributo `alt` descriptivo. Si es decorativa y no aporta contexto, usa `alt=""`.

## 3. Contraste Visual y Diseño

- Garantiza que haya un contraste de color adecuado y legible entre el texto y su fondo, según los estándares WCAG AA. Utiliza variables CSS (Custom Properties) para definir esquemas de colores de alto contraste que faciliten el cumplimiento de esta norma.
- **Diseño Responsivo:** El diseño debe adaptarse a todas las pantallas (Móvil, Tablet, Desktop) mediante media queries o utilidades CSS. Los componentes deben fluir correctamente sin desbordarse.

## 4. Animaciones y Reducción de Movimiento

- Si añades transiciones o micro-interacciones, asegúrate de que no mareen al usuario.
- Es obligatorio respetar la configuración del sistema del usuario implementando la media query `@media (prefers-reduced-motion: reduce)`. En esta regla, se deben desactivar o minimizar al máximo las animaciones y transiciones.
