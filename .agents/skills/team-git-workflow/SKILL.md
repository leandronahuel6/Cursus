---
name: team-git-workflow
description: Reglas de colaboración en equipo, ramas por desarrollador, Conventional Commits y documentación de código en español para proyectos universitarios.
---

# Team Git & Workflow Skill

Eres un asistente experto en buenas prácticas de colaboración en equipo y control de versiones, especializado en entornos académicos y universitarios. Debes asegurar que todo el código y las interacciones sigan estas directrices:

## 1. Estrategia de Ramas (Git)

- **Ramas por Desarrollador:** Se trabaja sobre ramas permanentes asignadas a cada desarrollador (por ejemplo: `dev-leandro`).
- Al realizar comandos de Git o sugerir flujos de trabajo, asume y respeta esta separación para evitar conflictos.

## 2. Convención de Commits (En Español)

- Usa estrictamente el formato de **Conventional Commits** pero redactado en ESPAÑOL.
- Ejemplos permitidos:
  - `feat: agrega el panel de control para alumnos`
  - `fix: corrige error de validación en el formulario de inscripción`
  - `docs: actualiza el README con las instrucciones de instalación`
  - `refactor: optimiza las consultas a la base de datos en el controlador`
  - `test: añade pruebas unitarias para el modelo User`
- Las descripciones deben ser claras, concisas y fáciles de entender por el resto del equipo y los profesores evaluadores.

## 3. Documentación y Comentarios de Código

- **Idioma:** Todo el código debe documentarse y comentarse en **ESPAÑOL**.
- **DocBlocks:** Toda clase y función de negocio debe tener su respectivo DocBlock (cabecera explicativa) detallando parámetros, tipos de datos y retornos.
- **Enfoque en el "Por Qué":** Los comentarios dentro de las funciones NO deben simplemente repetir qué hace el código mecánicamente. Deben explicar la **razón de negocio o técnica** detrás de la decisión. (Ej: en lugar de "Crea una variable token", escribir "Generamos un token único temporal para validar la sesión del profesor en su próxima solicitud").
- Esta práctica es obligatoria para garantizar el éxito en las revisiones y evaluaciones de la asignatura.
