# Borrador de Especificaciones Técnicas: Área de Estudio

## 1. Definición Funcional

El módulo "Área de Estudio" es una sección centralizada (Single Page Dashboard) del asistente Cursus que integra el estudio cronometrado (Pomodoro) y la motivación comunitaria, además de proveer herramientas organizativas (Kanban y Marcadores).

### Layout del Dashboard

El diseño prioriza la herramienta principal de gestión académica, distribuyendo el espacio de la siguiente manera:

- **Área Central Principal:** Se divide en dos bloques apilados verticalmente: Tablero Kanban ocupando el ancho disponible en la parte superior, y la Bóveda de Marcadores como única sección en la parte inferior (ocupando todo el ancho inferior, sin pestañas compartidas).
- **Barra Lateral (Sidebar Derecha):** Temporizador Pomodoro en la parte superior (fijo) y panel de "Compañeros estudiando ahora" debajo.

### Temporizador Pomodoro Personalizado

El temporizador admite una configuración flexible basada en 5 parámetros clave para adaptarse al ritmo de estudio de cada alumno:

- **Tiempo de Enfoque (Trabajo):** Duración de la sesión de estudio activa.
- **Descanso Corto:** Pausa breve entre sesiones individuales.
- **Descanso Largo:** Pausa extendida al completar un ciclo de estudio.
- **Sesiones por Ciclo (Pomodoros):** Cantidad de intervalos de enfoque necesarios para activar el descanso largo.
- **Ciclos Totales (Opcional):** Cantidad de repeticiones completas del ciclo de estudio.

#### Modos Predefinidos (Presets)

Para agilizar la configuración inicial, se ofrecen los siguientes accesos rápidos (los ajustes personalizados se realizan vía Modal flotante en lugar de requerir una pestaña o página separada):

1. **Modo Clásico (25/5):** 25 min enfoque / 5 min descanso corto / 20 min descanso largo / 4 sesiones.
2. **Modo Profundo / Creativo (50/10):** 50 min enfoque / 10 min descanso corto / 30 min descanso largo / 4 sesiones.
3. **Modo Corto / Principiante (15/3):** 15 min enfoque / 3 min descanso corto / 15 min descanso largo / 4 sesiones.
4. **Modo Personalizado (Custom):** Abre controles interactivos para definir valores libres dentro de los límites del sistema.

## 2. Decisiones de Base de Datos

El diseño de la base de datos se distribuye en módulos lógicos para soportar las funcionalidades del Área de Estudio.

### Módulo Kanban

**Tabla `tareas_kanban`**
Almacena las tarjetas individuales del tablero para cada usuario.

| Campo          | Tipo de Dato    | Relaciones y Restricciones                     | Descripción                                                                                                                   |
| :------------- | :-------------- | :--------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------- |
| `id`           | BIGINT UNSIGNED | Clave Primaria (PK)                            | Identificador único de la tarea.                                                                                              |
| `usuario_id`   | BIGINT UNSIGNED | FK ref. usuarios(id)                           | Propietario de la tarea.                                                                                                      |
| `materia_id`   | BIGINT UNSIGNED | FK ref. materias(id) (NULLABLE)                | Materia a la que pertenece la tarea. Vinculado a `materias` para mantener el historial si el alumno recursa.                  |
| `titulo`       | VARCHAR(255)    | NOT NULL                                       | Título principal de la tarjeta.                                                                                               |
| `descripcion`  | TEXT            | NULLABLE                                       | Detalle extendido y opcional de la tarea.                                                                                     |
| `estado`       | ENUM            | Valores: 'pendiente', 'en_curso', 'finalizado' | Columna en la que se encuentra la tarea en el tablero. Se actualiza cada vez que el usuario mueve la tarjeta con Drag & Drop. |
| `fecha_limite` | DATETIME        | NULLABLE                                       | Fecha límite para finalizar. El frontend enviará por defecto las `23:59:00` si el usuario omite la hora.                      |
| `orden`        | INT             | NOT NULL                                       | Guarda la posición vertical de la tarjeta dentro de su columna. Se actualiza con el Drag & Drop.                              |

**Explicación del `NULLABLE` en `materia_id`:** Permite registrar tareas globales, administrativas o personales que no estén vinculadas a ninguna asignatura específica.

**Tabla `tarea_subtareas`**
Maneja la arquitectura plana para subtareas dentro del modal de una tarjeta de Kanban.

| Campo         | Tipo de Dato    | Relaciones y Restricciones | Descripción                                                                                            |
| :------------ | :-------------- | :------------------------- | :----------------------------------------------------------------------------------------------------- |
| `id`          | BIGINT UNSIGNED | PK                         | Identificador único de la subtarea.                                                                    |
| `tarea_id`    | BIGINT UNSIGNED | FK ref. tareas_kanban(id)  | Tarjeta Kanban a la que pertenece.                                                                     |
| `descripcion` | VARCHAR(255)    | NOT NULL                   | Texto de la subtarea a realizar.                                                                       |
| `completado`  | BOOLEAN         | Default: false             | Estado de finalización. Se actualiza instantáneamente en la BD al hacer clic en el checkbox del modal. |

### Módulo Marcadores (Bóveda)

**Tabla `marcadores`**
Almacena los enlaces web útiles asociados a la sesión de estudio de cada usuario.

| Campo        | Tipo de Dato    | Relaciones y Restricciones                      | Descripción                                                                                                                                                                        |
| :----------- | :-------------- | :---------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`         | BIGINT UNSIGNED | PK                                              | Identificador único del marcador.                                                                                                                                                  |
| `usuario_id` | BIGINT UNSIGNED | FK ref. usuarios(id)                            | Propietario del marcador.                                                                                                                                                          |
| `materia_id` | BIGINT UNSIGNED | FK ref. materias(id) (NULLABLE) (DEFAULT: NULL) | Asigna el marcador a una materia específica. Si es NULL, es global.                                                                                                                |
| `url`        | VARCHAR(2048)   | NOT NULL                                        | Enlace web guardado.                                                                                                                                                               |
| `titulo`     | VARCHAR(255)    | NOT NULL                                        | Título para mostrar en la interfaz. Mantenido estricto para forzar al backend a generar un fallback (ej. dominio de la URL) si el scraping falla, garantizando consistencia en UI. |

### Módulo Pomodoro & Productividad

**Tabla `config_pomodoro`**
Guarda la configuración de tiempo personalizada o el preset seleccionado por el usuario. Se crea/actualiza únicamente en el momento exacto en el que el usuario hace clic en "Guardar" dentro del Modal de Configuración. Relación 1 a 1 estricta con el usuario.

| Campo                | Tipo de Dato    | Relaciones y Restricciones                | Descripción                                             |
| :------------------- | :-------------- | :---------------------------------------- | :------------------------------------------------------ |
| `usuario_id`         | BIGINT UNSIGNED | PK + FK ref. usuarios(id)                 | Identificador del usuario.                              |
| `tiempo_enfoque`     | INT             | Min: 1, Max: 90 (DEFAULT: 25)             | Duración en minutos de la sesión activa de estudio.     |
| `descanso_corto`     | INT             | Min: 1, Max: 30 (DEFAULT: 5)              | Pausa breve en minutos entre sesiones.                  |
| `descanso_largo`     | INT             | Min: 5, Max: 60 (DEFAULT: 20)             | Pausa extendida tras completar un ciclo.                |
| `sesiones_por_ciclo` | INT             | Min: 1, Max: 8 (DEFAULT: 4)               | Cantidad de enfoques seguidos antes del descanso largo. |
| `ciclos_totales`     | INT             | Min: 1, Max: 1 (NULLABLE) (DEFAULT: NULL) | Repeticiones del ciclo (NULL = Infinito).               |

**Tabla `sesiones_estudio`**
Registra históricamente el tiempo real de enfoque validado del alumno. Los tiempos de descanso NO se almacenan aquí, solo las sesiones de trabajo.

| Campo                     | Tipo de Dato    | Relaciones y Restricciones                                               | Descripción                                                                                                                             |
| :------------------------ | :-------------- | :----------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                      | BIGINT UNSIGNED | PK                                                                       | Identificador único de la sesión.                                                                                                       |
| `usuario_id`              | BIGINT UNSIGNED | FK ref. usuarios(id)                                                     | Estudiante realizando la sesión.                                                                                                        |
| `materia_id`              | BIGINT UNSIGNED | FK ref. materias(id) (NULLABLE)                                          | Materia estudiada durante la sesión (para estadísticas de tiempo invertido por asignatura).                                             |
| `inicio`                  | TIMESTAMP       | NOT NULL                                                                 | Generado y guardado por el servidor en el instante exacto en que el cliente envía `POST /api/sesiones/.../iniciar`.                     |
| `fin`                     | TIMESTAMP       | NULLABLE                                                                 | Generado y guardado por el servidor en el instante exacto en que el cliente envía `POST /api/sesiones/.../finalizar`.                   |
| `tiempo_pausado_segundos` | INT             | Default: 0                                                               | Acumula la inactividad. Se actualiza sumando la diferencia en el momento exacto en que el cliente invoca `/reanudar`.                   |
| `ultimo_inicio_pausa`     | TIMESTAMP       | NULLABLE                                                                 | Guardado por el servidor exactamente cuando el cliente invoca `POST /api/sesiones/.../pausar`.                                          |
| `duracion_real`           | INT             | NULLABLE                                                                 | Minutos de enfoque acreditados por el backend tras validar que el tiempo físico transcurrido menos la pausa cuadra con el pedido.       |
| `estado`                  | ENUM            | Valores: 'en_progreso', 'completada', 'completada_parcial', 'abandonada' | Indica la situación del registro. Cambia al finalizar (total o parcial), o a 'abandonada' si un Cron Job detecta > 4 hs de inactividad. |

**Explicación del `NULLABLE` en `materia_id`:** Permite contabilizar bloques de enfoque libre o estudio general no asociados a una materia concreta en las estadísticas.

### Módulo Comunidad (Tiempo Real)

**Tabla `presencia_activa`**
Tabla de alta volatilidad (idealmente manejada en memoria como Redis) para el panel de "Compañeros estudiando ahora".

| Campo              | Tipo de Dato    | Relaciones y Restricciones           | Descripción                                                                                                      |
| :----------------- | :-------------- | :----------------------------------- | :--------------------------------------------------------------------------------------------------------------- |
| `usuario_id`       | BIGINT UNSIGNED | PK + FK ref. usuarios(id)            | Identifica al usuario activo.                                                                                    |
| `materia_id`       | BIGINT UNSIGNED | FK ref. materias(id)                 | Materia en la que está conectado.                                                                                |
| `ultima_actividad` | TIMESTAMP       | NOT NULL                             | Hora del servidor del último ping. Se crea al entrar a la página y se actualiza periódicamente cada 60 segundos. |
| `estado`           | ENUM            | Valores: 'estudiando', 'descansando' | (Opcional) Indica visualmente al resto de la comunidad en qué fase está el alumno.                               |

## 3. Decisiones de Backend (Laravel)

### Flujo y API de Marcadores

- **Listado:** `GET /api/materias/{materia_id}/marcadores`. Devuelve la lista de marcadores vinculados a la sesión actual.
- **Creación:** `POST /api/marcadores`.
  - Body: `url` (requerido), `titulo` (opcional), `materia_id` (requerido).
  - **Captura Open Graph (Automática):** Si el `titulo` llega vacío, Laravel usará `Http::get($url)` sincrónicamente para extraer la etiqueta `<title>` o `<meta property="og:title">`. Si falla (timeout/bloqueo), usará el nombre de dominio como fallback.
  - **Validación (Prevención XSS):** El Form Request aplicará validación estricta de URL: `'url' => 'required|url:http,https|max:2048'`.
- **Edición Completa:** `PUT /api/marcadores/{id}`.
  - Body: `url` (opcional), `titulo` (opcional).
  - Reglas: Permite actualizar texto y enlace. Si se cambia la `url` sin especificar un nuevo `titulo`, el backend repetirá el Scraping Open Graph sobre el nuevo dominio.
- **Eliminación:** `DELETE /api/marcadores/{id}`.

### Flujo y API del Kanban (Optimistic UI parcial)

- **Creación de Tarea (Inline):** `POST /api/tareas`. Solo requiere el título y la columna de destino. Retorna la tarjeta creada con su `id` para futuras operaciones.
- **Edición de Tarea (Modal):** `PUT /api/tareas/{id}`. Actualiza Título, Descripción y Fecha. Se dispara con el botón "Guardar" del Modal.
- **Creación de Subtarea (Inline en Modal):** `POST /api/tareas/{id}/subtareas`. Se envía al presionar Enter en el input de nueva subtarea.
- **Actualización de Subtarea (Estado y Texto):** `PUT /api/subtareas/{id}`. El controlador de Laravel (Form Request) validará que `completado` sea booleano y/o `descripcion` sea un string (max 255). Permite actualización parcial (solo el checkbox o solo modificar el texto de la subtarea).
- **Eliminación de Subtarea:** `DELETE /api/subtareas/{id}`. Ejecución directa sin confirmación.
- **Mover Tarjeta (Drag & Drop):** `PUT /api/tareas/mover`. Recibe un array de IDs y posiciones para reordenar la columna y actualizar el estado.

#### Manejo de Errores y Rollback Visual (Optimistic UI)

Para mantener la integridad visual cuando una petición `Fetch` falla tras haber movido o editado una tarjeta de forma optimista:

1. **Frontend (Vanilla JS):**
   - _Captura de Estado:_ Antes de alterar el DOM (ej. en el evento `dragstart` o `focus`), se guardan en memoria las referencias clave (`originalParentNode`, `originalNextSibling` o el valor de texto original).
   - _Rollback:_ Si el `Fetch` atrapa un error (red) o recibe un _Status Code_ no exitoso, el JS invoca inmediatamente un `insertBefore` o restituye la variable original para devolver el elemento a su estado y posición exacta, evitando inconsistencias con la BD.
2. **Experiencia de Usuario (UX):**
   - _Animación de Falla:_ Al ejecutar el rollback, la tarjeta devuelta a su origen recibe la clase CSS temporal `.kb-error-shake` (vibración horizontal rápida de 300ms con borde rojo) para arrastrar la atención del usuario hacia la tarjeta.
   - _Toast Nativo:_ En simultáneo, emerge un _Toast_ en la esquina inferior (fondo rojo, ícono de advertencia) mostrando el `message` que retornó el backend. Desaparece a los 4 segundos.
3. **Backend (Contrato de Errores Laravel):**
   - Laravel devolverá los status estándar: `422` (Error de validación), `403` (No autorizado) o `500` (Fallo de servidor).
   - _Estructura JSON:_ Siempre retornará `{ "success": false, "message": "Mensaje legible para el Toast", "errors": {...} }`. El JS leerá el `message` para notificar al usuario.

### Flujo de Presencia Activa (Heartbeat)

Se descarta WebSockets por simplicidad, priorizando **HTTP Short-Polling**:

- **Ping de Cliente:** El navegador envía un `POST /api/presencia/ping` cada **60 segundos**, actualizando `ultima_actividad` con `NOW()` en la BD.
- **Recuperación de Activos:** El cliente hace `GET /api/presencia/compañeros`. El servidor devuelve la lista de usuarios. El **umbral de tolerancia definido es de 120 segundos**. Es decir, la consulta filtrará: `WHERE ultima_actividad >= NOW() - INTERVAL 2 MINUTE`.
- **Limpieza Automática:** Los usuarios que cierran la página dejan de enviar pings. A los 120 segundos exactos, automáticamente desaparecen de las consultas del panel social por sobrepasar el umbral de tolerancia.

### Flujo de Validación Anti-Trampas (Pomodoro)

La lógica de control de tiempo (Server-Side Pause Tracking) recae 100% en el servidor. El cliente no tiene autoridad sobre los minutos estudiados.

1.  **Inicio:** Al hacer click en _Iniciar_, `POST /api/sesiones/.../iniciar` registra la hora del reloj del servidor en `inicio`.
2.  **Pausa/Reanudación (Server-Side):**
    - Al hacer click en _Pausar_, `POST /api/sesiones/.../pausar` marca `ultimo_inicio_pausa = NOW()`.
    - Al hacer click en _Reanudar_, `POST /api/sesiones/.../reanudar` suma los segundos transcurridos (`NOW() - ultimo_inicio_pausa`) a la columna `tiempo_pausado_segundos`.

3.  **Finalización y Regla de Oro Matemática:** Al enviar el `POST` de finalización, se evalúa estrictamente el tiempo real transcurrido mediante la siguiente fórmula:

$$Tiempo\_Fisico\_Activo = (NOW() - inicio) - tiempo\_pausado\_segundos$$

Si el $Tiempo\_Fisico\_Activo$ difiere significativamente del tiempo que el usuario dice haber estudiado (excediendo un margen de latencia de red de unos 2 minutos), el backend rechaza la sesión o ajusta la columna `duracion_real` al tiempo físico real, impidiendo cualquier inyección de JavaScript (Spoofing) desde el cliente.

4. **Auto-Pausa de Protección acoplada al Heartbeat:** Dado que la tolerancia de presencia activa es de 120 segundos, si el servidor detecta que pasaron más de 120 segundos sin recibir el Ping y el usuario tenía un Pomodoro `en_progreso` (por ejemplo, el alumno cerró la pestaña por accidente sin pausar), un Job en segundo plano automáticamente invoca la lógica de pausa para ese usuario. Al volver a abrir la página horas después, el cliente calculará el tiempo en base a esa auto-pausa, salvando la sesión.

5. **Caducidad de Sesión Abandonada:** Un "Cron Job" en Laravel corre cada hora. Si encuentra una sesión `en_progreso` que fue iniciada o pausada hace más de **4 horas**, asume que el alumno nunca volvió y la marca como `abandonada`.

## 4. Decisiones de Frontend (Vanilla JS / UI)

### 4.1 Estructura y Componentes Clave

1. **Tablero Kanban:**
   - **Columnas Fijas:** Limitado a 3 columnas estáticas (Pendiente, En Curso, Finalizado). No se permite agregar nuevas.
   - **Navegación:** Ancho dinámico y alto máximo fijo (`max-height: 600px`). Utiliza scroll vertical nativo (`overflow-y: auto`). Sin zoom.
   - **Flujo de Creación de Tareas (Inline UX):** Al final de cada columna existe un botón "+ Agregar tarea". Al cliquearlo, se crea una tarjeta vacía al final con un `<textarea>` (o input) enfocado y el placeholder "Introduce el título de la tarea". El botón principal cambia a "Añadir tarea" y a su derecha se inyecta un botón secundario "X" (Cancelar).
     - _Guardado Automático:_ Se envía un `Fetch POST` si el usuario escribe al menos un carácter y presiona `Enter`, hace clic en "Añadir tarea", o si el input pierde el foco (evento `blur` en áreas fuera del botón X). Tras guardar, el botón "+ Agregar tarea" reaparece y el botón "X" desaparece.
     - _Cancelación Explícita e Implícita:_ Si el usuario hace clic en el botón "X", o si el input queda vacío y pierde el foco, se aborta el flujo. La tarjeta vacía se elimina del DOM y el botón principal vuelve a "+ Agregar tarea".
   - **Comportamiento de la Tarjeta (Card UI):**
     - Toda el área de la tarjeta es interactiva (`cursor: pointer`). Al hacer clic sobre ella, se abre el **Modal de Edición**.
     - _Hover:_ Al posicionar el mouse (`:hover`), aparece un botón con icono de tacho de basura en el extremo derecho. Al cliquearlo, se abre un modal genérico de confirmación antes del `Fetch DELETE`.
     - _Indicadores Visuales:_ La fecha de vencimiento solo se renderiza si existe ("Vence 5 jun", añadiendo el año si difiere del año actual). Las subtareas se indican con un icono de checkbox y el ratio de completadas ("1/2"). Si no hay fecha ni subtareas, el DOM permanece limpio sin texto residual como "Sin fecha".
   - **Modal de Edición de Tarea:**
     - _Estructura Superior:_ Header con el nombre de la columna en el extremo izquierdo y botón "X" para cerrar en el derecho. Separador visual inferior.
     - _Campos Base:_ Bloque para **Título** (editable al clic, por defecto "Título de la Tarea"), bloque para **Fecha de Vencimiento** (`<input type="datetime-local">` que permite seleccionar años futuros e inyecta dinámicamente las `23:59:00` vía JS si se omite la hora), y bloque para **Descripción** (con placeholder "Añadir una descripción más detallada...").
     - _Subtareas (Checklist):_ Botón "Añadir una subtarea" que despliega un input enfocado con botones "Añadir" y "Cancelar". El guardado (`Fetch POST`) se dispara al presionar `Enter` o "Añadir" si hay texto. Cada subtarea renderiza un _checkbox_ a la izquierda (que dispara `Fetch PUT` al instante al alternarlo) y un _tacho de basura_ a la derecha (dispara `Fetch DELETE` al instante y remueve el DOM sin confirmación).
     - _Edición de Subtareas Existentes:_ El bloque de texto de cada subtarea se vuelve editable al hacer clic sobre él (mediante `contenteditable="true"` o sustituyéndolo temporalmente por un `<input>`). Al presionar `Enter` o al perder el foco (evento `blur`), se dispara un `Fetch PUT` con el nuevo texto para actualizar la base de datos al instante.
     - _Footer:_ Extremo derecho un botón "Guardar" (dispara `Fetch PUT` exclusivamente para actualizar Título, Descripción y Fecha). Extremo izquierdo un botón "Eliminar" (abre el modal de confirmación general).

2. **Panel "Compañeros Estudiando":**
   - **Visualización:** Bloque delimitado para máximo 5 estudiantes (con scroll nativo si hay más). Muestra estado, Nombre e Iniciales.

3. **Registro Visual del Pomodoro (Dots):**
   - Fila de puntos que inician opacos y se iluminan al completar sesiones.
   - Si son de 1 a 4 puntos: Una fila centrada. 5 a 8 puntos: Dos filas distribuidas equitativamente centradas.

4. **Módulo Marcadores (UI, Componentes y Flujos):**
   - **Ubicación en Pantalla:** Parte inferior del Área Central. Ocupa de forma exclusiva todo el ancho disponible debajo del Kanban (se descarta el uso de pestañas).
   - **Estructura Layout:** Un área superior de formulario (toolbar) estática y una lista vertical desplazable (`overflow-y: auto`) con todas las tarjetas de marcadores.
   - **Flujo de Creación (Formulario):**
     - Consta de un `<input type="url">` (placeholder "https://...") y un `<input type="text">` para el Título opcional, más un botón primario "Guardar".
     - Al enviar (`Fetch POST`), el botón cambia a "Guardando..." (deshabilitado) a la espera de la resolución asíncrona del backend (Open Graph).
     - Si hay éxito, la nueva tarjeta se inyecta (`insertAdjacentHTML`) al principio de la lista. Si hay fallo, Vanilla JS muestra un _Toast_ de error nativo no intrusivo.
   - **Tarjeta de Marcador Individual (Card UI):**
     - _Contenedor:_ Bloque horizontal flexible (`display: flex`).
     - _Favicon Dinámico:_ A la izquierda extrema, una etiqueta `<img>` de 32x32px. Su `src` inyectará el logo oficial usando: `https://www.google.com/s2/favicons?domain=${new URL(marcador.url).hostname}&sz=64`.
     - _Metadatos:_ En el centro, el título arriba y la URL abajo (ambos truncados a una línea con `text-overflow: ellipsis`). Se evita inyección XSS construyendo el DOM de forma segura (asignación explícita de `href`).
     - _Acciones (Hover):_ Extremo derecho. Se revelan al hacer `:hover` en la tarjeta. **Exigencia técnica:** Todos los íconos deben ser vectores `.svg` in-line (o referenciados vía `<use>`) por rendimiento y escalabilidad, prohibiéndose los caracteres tipográficos:
       - _Abrir:_ Ícono `.svg` (flecha externa) en un `<a>` nativo con `target="_blank"`.
       - _Eliminar:_ Ícono `.svg` (papelera) que lanza directamente el `Fetch DELETE`.
       - _Editar:_ Ícono `.svg` (lápiz) para activar el modo de edición.
   - **Flujo de Edición Completa (In-Line):**
     - Al hacer clic en Editar, la interfaz de la tarjeta se altera _in situ_.
     - El Título y la URL desaparecen y son sustituidos dinámicamente por dos `<input>` rellenados con los valores vigentes.
     - Los controles derechos cambian a botones con íconos `.svg` de "Guardar" (check) y "Cancelar" (cruz).
     - Al confirmar, se dispara el `Fetch PUT`. En caso de éxito, los inputs vuelven a transformarse en texto puro y la imagen del favicon se actualiza si el dominio cambió. Si se cancela, se restauran los valores anteriores desde el estado en memoria de Vanilla JS.

### 4.2 Almacenamiento Local (LocalStorage)

Toda la lógica efímera del temporizador (descansos, pausas cortas, conteos) reside en el LocalStorage para lograr velocidad y resiliencia offline.

**Objeto `pomodoro_estado`**
Mantiene el estado actual del reloj de la interfaz.

| Propiedad                 | Tipo de Dato | Restricciones / Uso                           | Descripción / Actualización                                                                                                                                                                                                                                                                                                            |
| :------------------------ | :----------- | :-------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fase_actual`             | STRING       | 'enfoque', 'descanso_corto', 'descanso_largo' | Define qué temporizador y qué color/interfaz renderiza el frontend. Cambia cuando el contador llega a 0 o el usuario presiona "Saltear".                                                                                                                                                                                               |
| `estado_reloj`            | STRING       | 'corriendo', 'pausado', 'detenido'            | Define si el JS activa o congela el ciclo de descuentos (setInterval). Cambia al presionar los botones (Play, Pausa, Reiniciar, Saltear) o por caducidad.                                                                                                                                                                              |
| `tiempo_restante`         | INT          | Segundos (>= 0)                               | Segundos restantes en el reloj. Disminuye segundo a segundo **solo en una variable en la memoria RAM** y se guarda en el `LocalStorage` cuando se presiona Pausar, Saltear o Reiniciar y de forma defensiva mediante el evento `beforeunload` de la ventana (cuando el usuario cierra o recarga la pestaña).                           |
| `timestamp_ultimo_cambio` | INT          | Date.now() en MS                              | "Ancla Temporal". Se actualiza cuando el reloj pasa de estar detenido/pausado a `'corriendo'` (momento exacto del Play/Reanudar) o cuando el reloj pasa de `'corriendo'` a `'pausado'` (momento exacto de la Pausa). Se usa al recargar la página para calcular tiempo "offline" si el usuario cambió de pestaña o cerró el navegador. |

**Objeto `pomodoro_ciclos`**
Lleva la cuenta de progreso visual del estudiante. Gamificación y control visual de los "Dots" (puntos de progreso).

| Propiedad                  | Tipo de Dato | Restricciones / Uso           | Descripción / Actualización                                                                                                                                                                                                                                          |
| :------------------------- | :----------- | :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ciclo_actual`             | INT          | Min: 1. Max: `ciclos_totales` | Número visual (Ej: "Sesión 3 de 4"). Se actualiza en el momento exacto en que una fase de `'enfoque'` finaliza legítimamente (llega a cero o se saltea sumando minutos parciales). Devolver a 1 cuando `ciclo_actual` alcance el máximo y el descanso largo termine. |
| `sesiones_completadas_hoy` | INT          | >= 0                          | Total diario acumulado. Se actualiza bajo la misma regla que el ciclo actual.                                                                                                                                                                                        |

**🛑 Nota Arquitectónica sobre los Ciclos:** Toda la lógica de "Sesión 3 de 4" o "Cantidad de Pomodoros Completados Hoy" se maneja estrictamente en el LocalStorage para efectos de Gamificación en la UI. Al backend (tabla `sesiones_estudio`) no se le envía el número de iteración. El servidor solo registra bloques de tiempo de estudio validados aislados, evitando el problema de desincronización de ciclos si el alumno abandona o saltea sesiones.

### 4.3 Comportamiento Específico de Botones y Flujos (Pomodoro)

1. **Botón Pausar:**
   - Al clickear, el cliente JS congela el temporizador visual, guarda el `tiempo_restante` exacto y el `timestamp_ultimo_cambio` en LocalStorage (modificando `estado_reloj` a `'pausado'`). Simultáneamente, realiza la petición `/pausar` al backend.
2. **Botón Reanudar:**
   - Cambia `estado_reloj` a `'corriendo'` en LocalStorage, guarda el nuevo timestamp y notifica al servidor (`/reanudar`).
   - **Atención (Al volver a la página):** Si un usuario cierra la página y vuelve (habiendo pausado manual o automáticamente por inactividad), **el reloj NO corre instantáneamente**. JS lee el LocalStorage, detecta `'pausado'` y renderiza el reloj estático mostrando el `tiempo_restante`. El usuario debe presionar físicamente "Reanudar".
3. **Botón Saltear (Skip):**
   - _Si estaba en Enfoque:_ JS envía el `POST /finalizar` informando los minutos parciales logrados. El backend los guarda en `duracion_real` y marca la sesión con el estado `'completada_parcial'`. Inmediatamente, JS cambia el `fase_actual` en el LocalStorage para iniciar el temporizador del descanso correspondiente.
   - _Si estaba en Descanso:_ Acción puramente local. Se modifica el LocalStorage para avanzar al siguiente ciclo de enfoque sin enviar ninguna petición al servidor, manteniendo la base de datos limpia de "minutos de descanso".
4. **Botón Reiniciar (Restart):**
   - JS envía un `POST /finalizar` guardando el tiempo de esfuerzo parcial obtenido hasta ese momento bajo el estado `'completada_parcial'` (para no perder métricas de estudio). Instantáneamente, JS invoca un nuevo `POST /iniciar` para comenzar una sesión de Enfoque desde cero, reseteando el reloj en la interfaz.
5. **Recarga y Cierre de Página (Sincronización con Auto-Pausa):**

- **Al recargar/reabrir (Reloj Corriendo):** Si el usuario cerró o recargó la pestaña sin pausar manualmente, al volver, el JS calculará los segundos transcurridos desde la desconexión: `Segundos_Ausente = (Date.now() - timestamp_ultimo_cambio) / 1000`. Se evaluarán dos escenarios basados en el umbral de la auto-pausa del servidor (120 segundos):

1. _Si `Segundos_Ausente` es MENOR o IGUAL a 120 segundos:_ Significa que el usuario recargó rápido o fue un pestañeo de conexión. El servidor no llegó a pausar la sesión. JS resta los `Segundos_Ausente` al `tiempo_restante` y **reanuda el reloj automáticamente** en estado `'corriendo'`.
2. _Si `Segundos_Ausente` es MAYOR a 120 segundos:_ Significa que el umbral de presencia se superó y el backend ya aplicó la _Auto-Pausa de Protección_. Por lo tanto, el frontend debe emular exactamente ese estado: **restará únicamente 120 segundos** (el tiempo de tolerancia que el servidor le otorgó antes de congelarlo) al `tiempo_restante`, cambiará el `estado_reloj` a `'pausado'` en el LocalStorage y **renderizará el temporizador completamente estático (congelado)**. El alumno verá que su sesión se salvó pero quedó en pausa, requiriendo que presione físicamente "Reanudar" (lo que disparará la petición `/reanudar` al backend) para continuar.

- **Caducidad Local (Frontend):** Si el temporizador quedó pausado (ya sea de forma manual o por la auto-pausa de arriba), transcurridas las **4 horas** de inactividad total evaluadas mediante el `timestamp_ultimo_cambio`, el JS descartará por completo el objeto del LocalStorage y limpiará la interfaz a cero, en perfecta sincronía con el Cron Job del servidor que habrá marcado la sesión como `'abandonada'`.

### Parámetros, Valores por Defecto y Límites (Pomodoro)

La interfaz y la lógica de validación del cliente deben ajustarse a la siguiente tabla:

| Parámetro          | Valor por Defecto | Límite Mínimo | Límite Máximo | Razón del Límite                                                           |
| :----------------- | :---------------- | :------------ | :------------ | :------------------------------------------------------------------------- |
| Tiempo de Enfoque  | 25 min            | 1 min         | 90 min        | Más de 90 min agota la capacidad de atención humana                        |
| Descanso Corto     | 5 min             | 1 min         | 30 min        | No debe ser mayor que el tiempo de enfoque                                 |
| Descanso Largo     | 20 min            | 5 min         | 60 min        | Más de una hora rompe el ritmo y el impulso de trabajo                     |
| Sesiones por Ciclo | 4                 | 1 sesión      | 8 sesiones    | Menos de 1 no activa el descanso largo; más de 8 es excesivo               |
| Ciclos Totales     | Infinito (bucle)  | 1 ciclo       | 10 ciclos     | Permite que el temporizador corra libremente o se detenga al final del día |

### Reglas de Validación de Código (Restricciones Lógicas)

1. **Validación de Dependencia:** El Descanso Corto siempre debe ser estrictamente menor que el Tiempo de Enfoque.
2. **Validación de Proporción:** El Descanso Largo siempre debe ser mayor o igual que el Descanso Corto.
3. **Bloqueo de Números Primos/Decimales:** Los inputs de tiempo numéricos en el HTML/JS deben restringirse exclusivamente a números enteros utilizando la propiedad `step="1"`.
