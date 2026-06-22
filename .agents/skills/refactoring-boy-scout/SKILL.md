---
name: refactoring-boy-scout
description: Enforces Zero Technical Debt and Continuous Refactoring (Boy Scout Rule) according to the new modular architecture.
---

# Regla del Boy Scout y Cero Deuda Técnica

Esta SKILL formaliza nuestra estrategia de "Cero Deuda Técnica" y "Refactorización Continua (Regla del Boy Scout)". Deben seguirse estrictamente estas reglas al crear o modificar código (Blade, CSS, JS).

## 1. Política de Nuevo Código (Cero Deuda)

Toda funcionalidad o archivo completamente nuevo **DEBE** nacer respetando la estructura modular documentada en `backend/docs/nueva-arquitectura.md`.
Queda **ESTRICTAMENTE PROHIBIDO** añadir nuevas líneas de código a los monolitos heredados (ej. `main.css`, `welcome.blade.php` o scripts globales).

## 2. Mandato Boy Scout (Refactorización Oportunista)

Cada vez que modifiques código preexistente en un archivo monolítico, **ESTÁS OBLIGADO** a extraer el bloque de código que tocaste hacia la nueva estructura modular especificada en la arquitectura. Deja el archivo más limpio de lo que lo encontraste.

## 3. Integridad de Referencias

Siempre que extraigas o crees un nuevo archivo, **DEBES** vincularlo correctamente en el sistema:

- Si extraes un partial de Blade, debes agregar el `@include('...')` correspondiente.
- Si extraes CSS o JS, debes inyectarlo en la vista correspondiente usando las directivas `@push('styles')` o `@push('scripts')`.
  Bajo ninguna circunstancia puedes dejar código extraído sin referenciar en la aplicación.

## 4. Documentación Viva

Si durante una tarea creas un nuevo archivo o directorio que no existía, **DEBES** actualizar inmediatamente el árbol de directorios dentro de `backend/docs/nueva-arquitectura.md` para mantenerlo sincronizado.

## 5. Reglas de Oro Post-Refactorización (Inquebrantables)

Estas normativas deben cumplirse obligatoriamente al interactuar con el código:

1. **PROHIBIDO el CSS Monolítico:** No agregues clases indiscriminadamente a `main.css`. Busca la capa correspondiente (`components/`, `layout/` o `views/`).
2. **Carga Bajo Demanda:** Las hojas de estilo de las vistas (`views/*.css`) y los scripts específicos (`views/*.js`) **SOLO** deben cargarse en el Blade de esa vista usando las directivas `@push('styles')` y `@push('scripts')`. No las coloques globalmente en el layout `app.blade.php`.
3. **JS Desacoplado:** Si un script supera las 200-300 líneas, probablemente mezcla responsabilidades. Separa la obtención de datos (API/Mocks), la manipulación del DOM (Render) y la inicialización (Main).
4. **Vistas Ligeras:** Ningún archivo `.blade.php` debe superar las 300 líneas. Si una vista tiene una sección muy larga, extráela a un componente o partial usando `@include('partials.nombre')`.
5. **Cero Lógica en Plantillas:** Evita incrustar `<style>` o `<script>` directamente dentro de un archivo `.blade.php`. Esto impide el cacheo y fomenta el código espagueti.
