# 🎓 Cursus

> **Universidad:** UTN
> **Facultad/Escuela:** Regional Haedo
> **Asignatura:** Gestión de Desarrollo de Software
> **Año Académico:** 2026
> [![Estado del Proyecto](https://img.shields.io/badge/Estado-En%20Proceso-yellow)](#)
> [![Licencia](https://img.shields.io/badge/Licencia-MIT-blue)](#)

## 📖 Descripción

Muchos estudiantes universitarios enfrentan dificultades para sostener una rutina de estudio, priorizar materias, cumplir plazos y medir su desempeño de forma ordenada. En la práctica, suelen combinar varias herramientas separadas o depender solo de recordatorios informales, lo que aumenta la desorganización y reduce la constancia.
Como respuesta a esa situación, **Cursus** es un asistente estudiantil que centraliza funciones clave de planificación y seguimiento. El sistema está pensado para ofrecer una experiencia clara, enfocada en las necesidades reales del estudiante: saber qué estudiar, cuándo hacerlo, cuánto avanzó y qué decisiones debe tomar para mejorar su rendimiento académico.

## 📋 Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Arquitectura del Sistema](#-arquitectura-del-sistema)
- [Estructura del Proyecto](#-estructura-del-proyecto)

## ✨ Características Principales

- **Gestión de Materias y Correlativas:** Árbol interactivo para planificar la cursada (materias disponibles, en curso, regulares y aprobadas) validando automáticamente las correlatividades.
- **Área de Estudio (Pomodoro):** Herramienta integrada para organizar sesiones de estudio con temporizador Pomodoro y registro de horas invertidas por materia.
- **Seguimiento de Progreso:** Estadísticas detalladas de avance de la carrera, promedio general y cantidad de materias aprobadas.
- **Horarios y Calendario:** Planificador visual para organizar la semana de cursada y estudio.
- **Dashboard Personalizado:** Resumen interactivo con métricas, rachas de estudio y alertas de próximos parciales o entregas.

## 🛠 Tecnologías Utilizadas

- **Frontend:** HTML5, CSS3, JavaScript Vanilla (Interacción dinámica y asíncrona mediante Fetch API).
- **Backend:** PHP 8.x con framework Laravel 11.x (Arquitectura MVC y plantillas Blade).
- **Base de Datos:** MySQL.
- **Íconos:** Lucide Icons.

## 🏗 Arquitectura del Sistema

El proyecto utiliza una arquitectura **Monolítica basada en el patrón MVC (Modelo-Vista-Controlador)** provisto por Laravel, sin depender de microservicios externos.

```mermaid
graph TD;
    Cliente[Navegador Web / JS] -->|Peticiones HTTP / AJAX| Rutas[Laravel Router];
    Rutas --> Controladores[Controladores PHP];
    Controladores --> Modelos[Modelos Eloquent];
    Modelos <--> BD[(Base de Datos MySQL)];
    Controladores --> Vistas[Vistas Blade];
    Vistas --> Cliente;
```

## 📂 Estructura del Proyecto

El repositorio está organizado de la siguiente manera:

- `/backend/` - Contiene la aplicación web principal desarrollada en Laravel.
- `/prototypes/` - Archivos de diseño preliminar, mockups HTML/CSS puros o pruebas de concepto.
- `/personal/` - Entornos de prueba o notas de los desarrolladores.
  Para ver las instrucciones detalladas de instalación y cómo levantar el entorno de desarrollo, dirígete al [README del Backend](./backend/README.md).
