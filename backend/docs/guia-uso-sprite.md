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
<button class="btn-notification">
    <svg
        class="icon-bell"
        width="24"
        height="24"
        fill="none"
        stroke="currentColor"
    >
        <use href="{{ asset('assets/icons/sprite.svg#bell') }}"></use>
    </svg>
</button>
```

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
