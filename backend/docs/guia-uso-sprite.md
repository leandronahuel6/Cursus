# Uso del Sprite de Iconos en Laravel (Blade)

Este directorio contiene múltiples iconos SVG. Para mejorar el rendimiento y reducir las peticiones HTTP, se han agrupado todos en un único archivo llamado `sprite.svg` (excluyendo el logo principal).

## ¿Cómo usar un icono del sprite en tus archivos `.blade.php`?

En lugar de cargar cada icono mediante la etiqueta `<img>` o pegando todo el código SVG en tu HTML, puedes usar la etiqueta `<use>` de SVG. Esto referencia al ID del icono guardado en el sprite.

### Sintaxis básica

```html
<svg class="icon" width="24" height="24">
    <use href="{{ asset('assets/icons/sprite.svg#nombre-del-icono') }}"></use>
</svg>
```

### Ejemplo Práctico

Si quieres usar el icono de la campana (`bell.svg`), su ID dentro del sprite es `bell`. Así lo usarías en Blade:

```html
<!-- Ejemplo en un botón sin texto (requiere aria-label en el botón y aria-hidden en el icono) -->
<button class="btn-notification" aria-label="Notificaciones">
    <svg class="icon-bell" width="24" height="24" aria-hidden="true">
        <use href="{{ asset('assets/icons/sprite.svg#bell') }}"></use>
    </svg>
</button>

<!-- Ejemplo decorativo con texto (requiere aria-hidden en el icono) -->
<a href="/perfil" class="link-perfil">
    <svg class="icon-user" width="24" height="24" aria-hidden="true">
        <use href="{{ asset('assets/icons/sprite.svg#user') }}"></use>
    </svg>
    Mi Perfil
</a>
```

### Accesibilidad (a11y)

Como buena práctica, siempre debes tener en cuenta cómo leerán los lectores de pantalla tus iconos:

- **`aria-hidden="true"`**: Se añade en la etiqueta `<svg>` instanciada cuando el icono es puramente **decorativo** o está acompañado de un texto que ya describe la acción (como el enlace "Mi Perfil" superior).
- **`aria-label="Descripción"`**: Se utiliza en el elemento contenedor (como un `<button>` o `<a>`) cuando el icono es el **único contenido visual**, para que el lector de pantalla sepa para qué sirve (como el botón de "Notificaciones" superior).

> [!TIP]
> **Atributos predeterminados:** Los atributos visuales básicos (`fill="none"`, `stroke="currentColor"`, `stroke-width="2"`, etc.) ya vienen incluidos por defecto en cada símbolo del sprite. Por esto no necesitas declararlos en la etiqueta `<svg>` de uso, manteniendo tu código más limpio.


### Personalizando colores y tamaños

Una de las grandes ventajas de usar SVG Sprites es que puedes aplicar estilos CSS directamente al icono:

```css
/* Ejemplo en tu CSS */
.icon-bell {
    width: 32px;
    height: 32px;
    stroke: #4f46e5; /* Cambia el color del trazo (stroke) */
    fill: transparent; /* O cambia el color de relleno (fill) si el icono lo soporta */
    transition: stroke 0.3s ease;
}

.icon-bell:hover {
    stroke: #ff5722;
}
```

### Nomenclatura de los iconos

El `id` de cada icono dentro del sprite corresponde **exactamente** al nombre del archivo original sin la extensión `.svg`.
Por ejemplo:

- `trash-2.svg` -> `#trash-2`
- `layout-dashboard.svg` -> `#layout-dashboard`
- `calendar-days.svg` -> `#calendar-days`

¡Disfruta usando iconos optimizados!
