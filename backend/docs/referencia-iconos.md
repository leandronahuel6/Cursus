# Documentación de Uso de Iconos SVG (Sprite)

Este documento contiene la especificación clara, mejorada y ordenada de dónde y para qué se utilizará cada icono incluido en el sprite SVG de la aplicación. Se estructuran agrupados lógicamente para mantener una referencia clara.

## Iconos de Navegación y Acciones Universales

- `chevron-right.svg`: Reemplaza el caracter "›" en los breadcrumbs: "Inicio › Mis Materias" (`/materias`), "Inicio › Área de Estudio › [materia]" (`/area-estudio`), "Inicio › Simulador de Horarios" (`/horarios`), "Inicio › Alertas" (`/alertas`), y "Inicio › Mi Progreso" (`/progreso`). También se usa en el botón siguiente mes del Calendario Mensual (`/alertas`).
- `chevron-left.svg`: Se usa en el botón anterior mes en el Calendario Mensual (`/alertas`).
- `chevron-up.svg`: Utilizado en la esquina derecha del bloque de perfil dentro del Sidebar.
- `chevron-down.svg`: Sin uso definido actualmente (mantener disponible por si acaso).
- `move-right.svg`: Se utiliza en los enlaces de navegación de bloques en `/dashboard`: "Materias este cuatrimestre", "Ver todas", "Ver Kanban", y en los bloques de "Estudiar otra Materia". _(Nota: Ha sido quitado del botón "Continuar estudiando" en /dashboard)_.
- `x.svg`: Botón de cerrar en el menú/modal de perfil móvil en la cabecera. Esquina derecha en "Alerta próxima" (`/dashboard`). Esquina derecha en el Bloque superior en el Modal de tarea, botón Esquina Derecha al cliquear "Añadir una subtarea" en Modal de tarea, esquina derecha en Bloque superior en Modal de Ajustes Pomodoro Personalizado (`/area-estudio`). Esquina superior derecha en bloques de la grilla del simulador y en el bloque superior del Modal "Agregar a la grilla" (`/horarios`), y como el 2do botón en el extremo derecho en el Bloque de Aviso (`/alertas`). Se utiliza también para el estado de las sesiones 'Abandonada' en 'Sesiones Completadas Hoy' (`/area-estudio`).
- `plus.svg`: Utilizado en el botón "Agregar tarea" en las Columnas del Tablero Kanban, y "Añadir una subtarea" en el Modal de tarea (`/area-estudio`). También en el botón "Agregar actividad" debajo de todas las tarjetas de Actividades Personales (`/horarios`). Reemplaza el caracter "+" en los botones de cada materia para sumar nota y en el botón derecho de aprobadas por cuatrimestre (`/progreso`).
- `minus.svg`: Reemplaza el caracter "-" en los botones de cada materia para restar nota y en el botón izquierdo de aprobadas por cuatrimestre (`/progreso`).
- `check.svg`: Utilizado para indicar Materias Aprobadas (`/materias`), como el 1er botón en el extremo derecho en el Bloque de Aviso (`/alertas`), y para el estado de las sesiones 'Parcial' en 'Sesiones Completadas Hoy' (`/area-estudio`).
- `check-check.svg`: Utilizado para el estado de las sesiones 'Completada' en 'Sesiones Completadas Hoy' (`/area-estudio`).
- `cloud-alert.svg`: Utilizado como indicador de sesiones no sincronizadas con el servidor ('Offline') en 'Sesiones Completadas Hoy' y en el header del Área de Estudio cuando hay sincronización pendiente (`/area-estudio`).
- `trash-2.svg`: Icono de eliminación. Se muestra en la esquina superior derecha al hacer `:hover` sobre una tarjeta de tarea, en la esquina derecha en cada subtarea en "Subtareas (Checklist)" en el Modal de tarea, y al hacer `:hover` en la tarjeta de Marcador (en la esquina derecha, siendo el 3er botón de izquierda a derecha) (`/area-estudio`). Además, aparece en el extremo derecho al hacer `:hover` sobre los Bloques de Mis Actividades Personales, y en el botón "Eliminar" en el bloque que aparece al cliquear una tarjeta en la grilla (`/horarios`).
- `pen.svg`: Icono de edición. Al hacer `:hover` en una tarjeta de Marcador, se ubica en la esquina derecha como el 2do botón de izquierda a derecha (`/area-estudio`).
- `settings.svg`: Botón de Ajustes para Pomodoro Personalizado, ubicado en la esquina derecha del bloque superior del Temporizador pomodoro (`/area-estudio`).
- `sun.svg`: Botón de cambio de tema (modo claro) en la cabecera superior (escritorio y móvil).
- `moon.svg`: Botón de cambio de tema (modo oscuro) en la cabecera superior (escritorio y móvil).

## Iconos de Sidebar y Menú Principal

- `cursus-logo.svg`: Logo principal del sitio web. Se ubica en la esquina izquierda del bloque superior en el Sidebar.
- `panel-left.svg`: Ubicado en la esquina derecha del bloque superior en el Sidebar.
- `panel-left-close.svg`: Al hacer `:hover` sobre el botón con `panel-left.svg` cuando el sidebar está abierto.
- `panel-left-open.svg`: Al hacer `:hover` sobre el botón con `cursus-logo.svg` cuando el sidebar está cerrado.
- `layout-dashboard.svg`: Icono para enlace "Inicio" (Sidebar).
- `library.svg`: Icono para enlace "Mis Materias" (Sidebar).
- `clock.svg`: Icono para enlace "Área de Estudio" (Sidebar) y para el "Historial de Pagos" (`/alertas`).
- `calendar.svg`: Icono para enlace "Simulador de Horarios" (Sidebar) y para indicador "Vence [fecha]" (`/area-estudio`).
- `gift.svg`: Icono para enlace "Beneficios" (Sidebar).
- `bell.svg`: Icono para enlace "Alertas" (Sidebar) y en el título "Alertas y Vencimientos" (`/alertas`).
- `trending-up.svg`: Icono para enlace "Mi Progreso" (Sidebar).
- `user.svg`: Icono para enlace "Perfil" (se muestra al cliquear el bloque de perfil en el Sidebar), y en Alerta categoría "Personal" (`/alertas`).
- `message-square.svg`: Icono para enlace "Contacto" (se muestra al cliquear el bloque de perfil en el Sidebar).
- `log-out.svg`: Icono para "Cerrar Sesión" (se muestra al cliquear el bloque de perfil en el Sidebar).

## Iconos de Productividad, Estudio y Gamificación

- `timer.svg`: Indicador de "Horas esta semana" (`/dashboard`), y "En [n] días ([d]/[m]/[a])" (`/alertas`).
- `flame.svg`: Indicador de "[n] días de racha", "Racha actual" y "[n] días" en Grilla de "Actividad" (`/dashboard`).
- `book-copy.svg`: "Materias activas" (`/dashboard`) y título "Mis Materias" (`/materias`).
- `book-alert.svg`: "Tareas pendientes" y "Entregas próximas" (`/dashboard`).
- `play.svg`: Botón de acción principal: "Empezar sesión" (`/dashboard`). Botón central del Temporizador pomodoro que aparece por defecto (`/area-estudio`).
- `pause.svg`: Botón central del Temporizador pomodoro, se reemplaza por el Botón `play.svg` al ser cliqueado (`/area-estudio`).
- `skip-forward.svg`: Botón Skip ubicado a la derecha del Temporizador pomodoro (`/area-estudio`).
- `rotate-cw.svg`: Botón Reiniciar ubicado a la izquierda del Temporizador pomodoro (`/area-estudio`).
- `cherry.svg`: Aparece en bloques de "Sesiones de Hoy" (`/dashboard`). En el bloque "sesiones totales" en la parte superior de Materia, y en los bloques de Estudiantes en "Estudiando ahora" si `estado` = 'estudiando' en la tabla `presencia_activa` (`/area-estudio`).
- `calendar-days.svg`: Grilla de "Actividad" (`/dashboard`) y "Egreso Proyectado" (`/progreso`).
- `kanban.svg`: Título del "Tablero Kanban" (`/area-estudio`).
- `square-check.svg`: Utilizado en las "Subtareas" dentro de las tarjetas (`/area-estudio`).
- `link.svg`: Título de la sección "Bóveda de Marcadores" (`/area-estudio`).
- `external-link.svg`: Al hacer `:hover` en una tarjeta de Marcador, en la esquina derecha como el 1er botón de izquierda a derecha (`/area-estudio`).
- `coffee.svg`: Utilizado en los bloques de Estudiantes en "Estudiando ahora" si `estado` = 'descansando' en la tabla `presencia_activa` (`/area-estudio`).
- `brush-cleaning.svg`: Utilizado en el botón "Limpiar Grilla" (`/horarios`).
- `circle-alert.svg`: En alerta "Superposición horaria" (`/horarios`). Nueva Alerta / Vencimiento (`/alertas`).

## Iconos Analíticos y de Gestión Académica

- `chart-line.svg`: "Avance de Carrera" (`/materias`).
- `graduation-cap.svg`: "Promedio General" (`/materias`). Alerta categoría "Académica" (`/alertas`). "Promedio Real" y "Rendimiento Académico" (`/progreso`).
- `notebook-pen.svg`: Título de sección "Gestión de Cursada" (`/materias`).
- `map.svg`: "Plan de Estudios" (`/materias`).
- `chart-column.svg`: "Promedio Proyectado" (`/progreso`).
- `zap.svg`: "Productividad de Estudio" (`/progreso`).
- `wallet.svg`: Icono específico para Alerta categoría "Pago" (`/alertas`).
- `briefcase-business.svg`: Icono específico para Alerta categoría "Administrativa" (`/alertas`).
