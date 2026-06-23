# **Especificación Técnica: Plan de Estudios y Simulador de Horarios**

Para ver las materias de cada carrera/tecnicatura, su nivel y correlatividades: [https://frh.utn.edu.ar/repositorio/](https://frh.utn.edu.ar/repositorio/) (faltan las del plan 2024 de la TUP y las demás tecnicaturas).

## **FASE 1: Arquitectura de Base de Datos (Prioridad Alta)**

_Esta fase debe completarse primero para que el Backend tenga un esquema sobre el cual operar y el Frontend sepa qué estructura de datos va a recibir._  
Para soportar múltiples planes de estudio (carreras/tecnicaturas) por usuario simultáneamente, es necesario agregar una tabla pivote carrera_usuario que vincule al usuario con las carreras a las que está suscripto.

### **Diagrama de Tablas y Relaciones**

| Tabla                 | Campos               | Tipo de Dato    | Relaciones y Restricciones              | Descripción                                                           |
| :-------------------- | :------------------- | :-------------- | :-------------------------------------- | :-------------------------------------------------------------------- |
| **usuarios**          | id                   | BIGINT UNSIGNED | Clave Primaria (PK)                     | Almacena identidad y credenciales.                                    |
|                       | nombre               | VARCHAR(255)    |                                         | Nombre completo del usuario.                                          |
|                       | email                | VARCHAR(255)    | Único                                   | Correo electrónico.                                                   |
|                       | password             | VARCHAR(255)    |                                         | Contraseña encriptada.                                                |
|                       | rol                  | ENUM            | Valores: 'admin', 'general'             | Categoría del usuario                                                 |
| **carreras**          | id                   | BIGINT UNSIGNED | PK                                      | Listado de propuestas formativas.                                     |
|                       | nombre               | VARCHAR(255)    |                                         | Nombre oficial de la carrera.                                         |
| **carrera_usuario**   | usuario_id           | BIGINT UNSIGNED | PK Compuesta + FK ref. usuarios(id)     | Relación muchos a muchos.                                             |
| _(Pivote)_            | carrera_id           | BIGINT UNSIGNED | PK Compuesta + FK ref. carreras(id)     | Relación muchos a muchos.                                             |
| **materias**          | id                   | BIGINT UNSIGNED | PK                                      | Componentes del plan de estudios.                                     |
|                       | carrera_id           | BIGINT UNSIGNED | FK ref. carreras(id)                    | Aísla contenidos por carrera.                                         |
|                       | nombre               | VARCHAR(255)    |                                         | Denominación de la asignatura.                                        |
|                       | nivel                | INT             |                                         | Año o cuatrimestre (Ej: 1 = 1er Cuatrimestre).                        |
| **materia_usuario**   | usuario_id           | BIGINT UNSIGNED | PK Compuesta + FK ref. usuarios(id)     | Asocia estudiante con estado de materias.                             |
| _(Pivote)_            | materia_id           | BIGINT UNSIGNED | PK Compuesta + FK ref. materias(id)     | Asocia estudiante con estado de materias.                             |
|                       | estado_historico     | ENUM            | Valores: 'libre', 'regular', 'aprobada' | Condición académica (Por defecto: 'libre').                           |
|                       | cursando_actualmente | BOOLEAN         |                                         | Bandera activa en ciclo vigente (Por defecto: false).                 |
| **correlatividades**  | materia_id           | BIGINT UNSIGNED | PK Compuesta + FK ref. materias(id)     | Asignatura a destrabar.                                               |
| _(Auto-referencial)_  | requisito_id         | BIGINT UNSIGNED | PK Compuesta + FK ref. materias(id)     | Asignatura previa obligatoria.                                        |
|                       | condicion_requerida  | ENUM            | Valores: 'regular', 'aprobada'          | Nivel de aprobación exigido.                                          |
| **horarios_usuarios** | id                   | BIGINT UNSIGNED | PK                                      | Bloques de tiempo reservados.                                         |
|                       | usuario_id           | BIGINT UNSIGNED | FK ref. usuarios(id)                    |                                                                       |
|                       | tipo                 | ENUM            | Valores: 'materia', 'actividad'         | Define si es académico o personal.                                    |
|                       | materia_id           | BIGINT UNSIGNED | FK ref. materias(id) (Puede ser NULL)   | Relación si el tipo es 'materia'. Admite múltiples filas por materia. |
|                       | titulo_actividad     | VARCHAR(255)    | Puede ser NULL                          | Nombre de la actividad si el tipo es 'actividad'.                     |
|                       | dia_semana           | INT             | 1 = Lunes, 7 = Domingo                  | Día de la semana asignado numéricamente.                              |
|                       | hora_inicio          | TIME            |                                         | Horario de entrada.                                                   |
|                       | hora_fin             | TIME            |                                         | Horario de salida.                                                    |

## **FASE 2: Backend - Laravel & Lógica de Negocio (Prioridad Media)**

Para garantizar un código limpio, modular y fácil de mantener, la capa lógica implementada en Laravel (PHP) se apoyará en los siguientes conceptos:

### **Conceptos Clave de Implementación**

- **Eager Loading (Carga Ansiosa):** Cuando el usuario entra al Plan de Estudios, no se debe consultar a la base de datos por cada materia individualmente para ver sus correlativas (esto genera el problema de rendimiento conocido como "N+1 queries"). Se debe utilizar Eager Loading mediante with() (ej: Materia::with('requisitos')->where('carrera_id', $id)->get();). Esto empaqueta todo en 2 consultas eficientes.
- **Form Requests (Validación Desacoplada):** En lugar de validar que los datos enviados desde el Frontend sean correctos dentro del Controlador (ensuciando el código), Laravel permite crear clases separadas llamadas FormRequests. Aquí se escriben las reglas (ej: "el usuario solo puede enviar ids de materias que existan" o "no se puede marcar como Aprobada si las previas no lo están"). Si la validación falla, el Controlador nunca se entera y Laravel devuelve automáticamente un error 422.
- **Transacciones de Base de Datos (DB::transaction):** Al guardar los estados de las materias o los bloques del horario masivamente, se debe envolver el código en una transacción. Esto asegura que si ocurre un error a la mitad del proceso (ej. se guardan 5 materias pero la sexta falla), la base de datos deshace _todos_ los cambios, evitando que queden datos corruptos o a medias.

### **Endpoints (Rutas) Principales**

- **GET /api/planes-estudio:** Detecta al usuario autenticado y devuelve sus carreras activas. Retorna las materias agrupadas por nivel, con sus relaciones de correlatividad (cargadas ansiosamente), su estado_historico y cursando_actualmente.
- **POST /api/planes-estudio/sincronizar:** Recibe un JSON con los cambios de estado (Libre/Regular/Aprobada y Cursando) del Mapa Interactivo. Implementa Form Requests para validación y envuelve la actualización masiva (sincronización) de la tabla materia_usuario en una DB::transaction.
- **POST /api/horarios/guardar**: Recibe la grilla armada desde el simulador. El controlador procesa el JSON a través de un Form Request que ejecuta una validación estricta de segundo nivel para asegurar que ningún bloque de tiempo se superponga con otro en el mismo día. Si se detecta un solapamiento enviado de forma maliciosa o por error, el backend aborta la operación, no toca la base de datos y retorna un código de error HTTP 422 con los detalles de las materias o actividades en conflicto. Si la validación es exitosa, elimina los registros previos en horarios_usuarios para ese usuario e inserta los nuevos bloques en una operación limpia protegida por una DB::transaction.

## **FASE 3: Frontend - UI/UX y Comportamiento (Prioridad Media)**

Interfaz dinámica construida en HTML5, CSS3 (Flexbox) y Vanilla JavaScript.

### **3.1. Página: Plan de Estudios**

- **Navegación de Múltiples Planes (Layout General)**
  - **Ubicación:** Parte superior del área principal.
  - **Estética:** Un sistema de pestañas horizontales (Tabs). La pestaña seleccionada se resalta con el color principal de la marca y un borde inferior grueso; las pestañas inactivas muestran un color gris neutro. Un botón final con un ícono de "+" estilizado discretamente seguido de "Añadir Plan" permite suscribirse a un nuevo plan, abriendo una ventana modal con el listado de carreras de la UTN Haedo disponibles.
  - **Comportamiento:** Al hacer clic en una pestaña de carrera, JavaScript lee el identificador del plan de estudios asignado, limpia el contenedor del mapa dinámico del DOM inferior y vuelve a poblar la currícula renderizando exclusivamente las asignaturas asociadas a dicha opción a través de Flexbox, sin recargar la página web.
- **Mapa Interactivo (Grilla de Materias)**
  - **Ubicación:** Área central. Dividido en filas o contenedores titulados y claramente rotulados por "Nivel" (ej. "Primer Nivel", "Segundo Nivel").
  - **Estética:** Layout adaptativo implementado en un contenedor con distribución display: flex; flex-wrap: wrap; gap: 20px; para acomodar las tarjetas fluidamente según el tamaño de la pantalla.
  - **Comportamiento:** Al cargar la página o cambiar de pestaña, se dispara una rutina de JavaScript nativo que inspecciona los atributos de datos de cada tarjeta para evaluar los requisitos y habilitar o bloquear la interacción con los componentes según las dependencias calculadas (las tarjetas bloqueadas se deshabilitan).
- **Tarjeta de Materia (El Componente Principal)**
  - **Ubicación:** Elemento modular ubicado dentro de los bloques de nivel del mapa interactivo.
  - **Estética:**
  - **Estado Bloqueada:** Tarjeta con fondo gris claro, opacidad reducida al 70%, textos atenuados, cursor en modo not-allowed y presenta un ícono decorativo de un candado cerrado al lado del nombre.
  - **Estado Libre:** Fondo blanco tradicional, borde izquierdo de color gris medio y badge de texto con la palabra "Libre".
  - **Estado Regular:** Fondo blanco, borde izquierdo azul brillante y un badge destacado con el texto "Regular".
  - **Estado Aprobada:** Fondo blanco, borde izquierdo verde esmeralda y un badge con el texto "Aprobada" acompañado de un tilde de verificación.
  - **Zona de Cursada:** Franja inferior de la tarjeta separada por una sutil línea divisoria que aloja una etiqueta "Cursando actualmente" y un interruptor deslizable (Toggle Switch) de estilo iOS. Cuando está activo, toda la tarjeta adquiere un contorno exterior azul de 2 píxeles con un efecto de brillo (box-shadow).
  - **Tooltip Informativo:** Bloque emergente de color negro translúcido con texto blanco de fuente reducida (un pequeño globo oscuro flotante con el texto explicativo de la correlativa faltante), posicionado de forma flotante por encima de la tarjeta. Es invisible por defecto; se muestra mediante CSS con la pseudo-clase :hover exclusivamente cuando la tarjeta está bloqueada.
  - **Comportamiento:**
    - **Clic en la Zona Superior (Historial Académico):** Si la materia está bloqueada por correlativas, JavaScript intercepta el evento, frena la ejecución y añade una clase de CSS para reproducir un efecto de vibración horizontal (shake animation) indicando el error. Si está desbloqueada, el clic cicla la condición del alumno de forma secuencial: Libre → Regular → Aprobada → Libre. Cada modificación visual actualiza los atributos data-estado en el DOM y ejecuta automáticamente la función global de recalculado del árbol de correlativas.
    - **Validación Estricta de Aprobación:** Teniendo en cuenta que en la UTN se puede cursar una materia teniendo las previas regulares, pero no se puede rendir el final sin tenerlas aprobadas, se añade una validación en este ciclo. Si el usuario intenta ciclar la materia al estado Aprobada, JavaScript debe verificar el árbol de correlativas. Si las previas exigidas no están en estado Aprobada, se bloquea el paso a dicho estado, se ejecuta la animación de sacudida (shake) y el Tooltip Informativo se muestra indicando: _"Aprueba las correlativas pendientes para habilitar final o promoción"_.
    - **Regla de Negocio Automatizada:** Si el estado histórico se establece en Aprobada (habiendo pasado la validación estricta), un evento interno desactiva el interruptor de cursada actual, quita el borde de selección y deshabilita su interacción (disabled), dado que no se puede cursar una asignatura ya rendida y aprobada con examen final.
    - **Acción del Switch de Cursada:** Modifica la propiedad booleana de cursada en la memoria temporal del script para alimentar de forma directa a los módulos externos del Área de Estudio y Mis Materias.
- **Botón Flotante "Guardar Progreso"**
  - **Ubicación:** Esquina inferior derecha de la ventana del navegador con posición fija (position: fixed; z-index: 999;).
  - **Estética:** Botón circular de dimensiones amplias, color primario llamativo, sombra proyectada pronunciada y tipografía en negrita.
  - **Comportamiento:** Permanece completamente oculto para no entorpecer la lectura. Se muestra mediante una transición fluida de opacidad (fade-in) únicamente cuando JavaScript detecta el primer cambio realizado por el alumno en cualquier tarjeta de la grilla. Al ser presionado, recolecta la totalidad de los datos de estados modificados en un único objeto JSON, los despacha hacia el endpoint del backend vía Fetch API, procesa la respuesta exitosa del servidor mostrando un mensaje de "Guardado con éxito" y vuelve a ocultarse de la vista.

### **3.2. Página: Simulador de Horarios**

#### **1. Navegación de Días (Área Superior)**

- **Ubicación:** Franja horizontal superior, justo debajo del encabezado de la página.
- **Estética:** Sistema de pestañas (Tabs) que abarcan los 7 días de la semana (de Lunes a Domingo). La pestaña del día activo resalta con el color principal.
- **Comportamiento:** Cada pestaña aísla la vista. Al hacer clic en "Martes", la grilla central muestra exclusivamente los bloques horarios correspondientes a ese día, permitiendo al usuario focalizarse sin abrumarse visualmente.

#### **2. Editor de Línea de Tiempo (Área Central)**

- **Ubicación:** Ocupa el espacio central predominante de la pantalla.
- **Estética:** Un lienzo dividido en dos filas o "Tracks" horizontales (Opción C):
  - **Track Académico:** Destinado exclusivamente a las materias de la UTN.
  - **Track Personal:** Destinado a actividades extracurriculares (Deporte, Trabajo, etc.).
  - Ambos tracks comparten una regla superior (Eje X) que representa las 24 horas del día (00:00 a 23:59), con marcas divisorias cada hora y media hora.
- **Comportamiento de los Bloques (Estilo Editor de Video):**
  - **Creación:** Las pistas operan como zonas de recepción de soltado (Drag over y Drop). Al soltar una tarjeta desde el panel inferior en un track, se crea un bloque de color translúcido representando la actividad.
  - **Posicionamiento:** Manteniendo pulsado el centro de un bloque, el usuario puede arrastrarlo libremente a lo largo de la línea de tiempo para cambiar su hora de inicio de forma rápida.
  - **Redimensionamiento:** Los bordes izquierdo y derecho de cada bloque tienen "manijas" invisibles (cursor: ew-resize). Al arrastrarlas, el bloque se alarga o se acorta, modificando visualmente su duración.
  - **Selección:** Al hacer clic simple sobre un bloque, este recibe un borde de color brillante indicando que está activo, y sus datos se reflejan en el Editor Manual (detallado abajo). El bloque incluye un ícono de cesto de basura en su esquina para eliminarlo de la pista.

#### **3. Panel de Elementos Disponibles (Área Inferior)**

- **Ubicación:** Franja horizontal en la parte inferior de la pantalla, fijada o con scroll horizontal.
- **Estética:** Un contenedor dividido en dos secciones visuales: "Materias en Curso" y "Mis Actividades". Los elementos se renderizan como tarjetas pequeñas y arrastrables (draggable="true").
- **Comportamiento:**
  - **Materias UTN:** Se nutre filtrando la base de datos local: solo expone las asignaturas del plan activo con la bandera cursando_actualmente encendida (para evitar saturar la interfaz con materias simplemente "habilitadas").
  - **Actividades Personales:** Incluye un botón permanente con la etiqueta "+ Nueva Actividad". Al pulsarlo, crea una tarjeta genérica en el panel con el texto por defecto "Nueva Actividad". Haciendo doble clic sobre esta tarjeta, el texto se vuelve editable (contenteditable="true") para que el usuario la renombre (ej. "Gimnasio", "Trabajo"). Esta tarjeta generada se arrastra al "Track Personal".
  - **Momento de Persistencia (Regla de Guardado):** Las tarjetas de actividades personales creadas en este panel inferior son moldes temporales y efímeros en la memoria del cliente (JS). **No se guardan en la base de datos** al crearse, ni al renombrarse, ni al quedarse en este panel. Solo se consolidarán en la base de datos si el usuario las arrastra hacia la línea de tiempo de algún día y presiona el botón "Guardar Horario". Esto mantiene limpia la tabla horarios_usuarios y evita tener que permitir campos NULL en las columnas de tiempo (hora_inicio, hora_fin, dia_semana), las cuales se mantendrán siempre como campos obligatorios (NOT NULL).

#### **4. Editor Manual de Horarios (Barra Contextual Flotante)**

- **Ubicación:** Barra que aparece en la base de la Línea de Tiempo al seleccionar un bloque.
- **Estética:** Contiene inputs numéricos tipo time para "Hora Inicio" y "Hora Fin". En el extremo derecho, alberga una zona dinámica de notificaciones destinada a los banners de alerta.
- **Comportamiento Manual:** Si el usuario desea precisión que el redimensionamiento con el mouse no le otorga, puede tipear los horarios exactos aquí. Al presionar Enter, el bloque seleccionado actualiza automáticamente su tamaño y posición en el Track.

#### **5. Motor Anti-Superposición (Validación en Dos Tiempos)**

- **Ubicación:** Componente lógico que se ejecuta en segundo plano en el cliente JS.
- **Comportamiento en Tiempo de Edición (Fluido y No Bloqueante):** Mientras el usuario arrastra, posiciona o estira los bloques en los Tracks del calendario semanal, el script JS recorre y compara de forma constante el vector de coordenadas de tiempo del día activo. Si detecta que dos o más bloques (ya sea en el Track Académico o Personal) se solapan total o parcialmente en sus minutos, el sistema **no cancela la acción del usuario** para no interrumpir el flujo de edición del alumno. En su lugar, **permite la acción visual**, pinta inmediatamente los bloques superpuestos e involucrados con un fondo rojo brillante de advertencia (activando un indicador visual de conflicto) y despliega un cartel persistente (Banner) en la zona de notificaciones inferior con la leyenda: _"Superposición horaria detectada: Revisa tus bloques rojos"_. Esto permite al usuario acomodar libremente las piezas antes de resolver el conflicto.
- **Comportamiento en Tiempo de Guardado (Estricto y Bloqueante):** Al momento de presionar el botón "Guardar Horario", la flexibilidad se termina. El motor realiza un escaneo de validación final. Si existen bloques pintados de rojo (superpuestos) en cualquier día de la semana, **se interrumpe inmediatamente el envío de datos al backend (se bloquea el Fetch API)**. El sistema despliega un bloque de alerta destacado y fijo en la barra contextual inferior con tipografía roja y fondo rosado de error, detallando el conflicto de forma explícita.
  - _Ejemplo de mensaje descriptivo:_ "No se puede guardar el horario. Superposición horaria detectada el día Martes: 'Programación II' se cruza con 'Trabajo' entre las 18:00 hs y las 20:00 hs."
  - Para desbloquear el botón de guardado, el usuario debe arrastrar, redimensionar o eliminar uno de los bloques en conflicto hasta que desaparezca el color rojo de advertencia.

#### **6. Barra Superior de Acciones**

- **Ubicación:** Alineada en la cabecera del módulo del simulador, posicionando dos botones sobre el extremo derecho.
- **Componentes y Estética:** Incluye el botón "Limpiar Grilla" (que utiliza un estilo de texto secundario outline sin fondo) y el botón "Guardar Horario" (que cuenta con el color sólido principal de la aplicación).
- **Comportamiento:**
  - Al pulsar "Limpiar Grilla", se vacía por completo el array temporal de horarios y se remueven instantáneamente todos los bloques renderizados en los Tracks del día activo en el DOM.
  - Al pulsar "Guardar Horario", la aplicación ejecuta primero el **Motor Anti-Superposición**. Si se encuentra un solapamiento, frena el flujo y muestra el bloque de error detallado en la sección anterior. Si no hay superposiciones, el script verifica si quedaron tarjetas de actividades personales creadas en el panel inferior que nunca fueron arrastradas a ninguna pista. De ser así, lanza un mensaje de advertencia estilo confirmación (pop-up/toast no bloqueante) que dice: _"Atención: Tienes actividades en el panel inferior que no fueron ubicadas en ninguna pista. No se guardarán en tu cronograma. ¿Deseas continuar?"_. Si el usuario acepta, la aplicación recolecta los horarios vigentes únicamente situados en las pistas (tanto materias como actividades personales a lo largo de las 7 pestañas de días), estructura los bloques de tiempo, diferencia el campo tipo ('materia' o 'actividad') y despacha los cambios al servidor web a través de una única petición asíncrona (fetch) para consolidar la información en la tabla horarios_usuarios. Estos horarios no alteran el estado "Cursando" del Plan de Estudios, respetando la descentralización de la información.
