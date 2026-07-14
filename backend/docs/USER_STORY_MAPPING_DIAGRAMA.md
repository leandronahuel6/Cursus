# 🗺️ Diagrama Técnico: User Story Mapping

A continuación, se presenta el User Story Mapping estructurado y visualizado como una matriz técnica.

Este diagrama está organizado jerárquicamente:

- **Nivel Superior (Fondo Oscuro):** Las 5 Épicas principales del sistema.
- **Nivel Medio (Verde):** Historias de usuario ya implementadas correspondientes al **MVP (Release 1.0)**.
- **Nivel Inferior (Naranja):** Historias planificadas a corto/mediano plazo para el **Release 2.0**.
- **Fondo (Gris):** Requerimientos de alta complejidad reservados para el **Backlog Futuro**.

```mermaid
%%{init: {"flowchart": {"subGraphTitleMargin": {"top": 12, "bottom": 18}}}}%%
flowchart TB
    %% ============ ESTILOS ============
    classDef epic fill:#1b2838,color:#ffffff,stroke:#3498db,stroke-width:2px,font-weight:bold,rx:10,ry:10
    classDef mvp fill:#1e8449,color:#ffffff,stroke:#58d68d,stroke-width:1.5px,rx:6,ry:6
    classDef v2 fill:#ca6f1e,color:#ffffff,stroke:#f8c471,stroke-width:1.5px,rx:6,ry:6
    classDef backlog fill:#5d6d7e,color:#ffffff,stroke:#aeb6bf,stroke-width:1.5px,stroke-dasharray:4 3,rx:6,ry:6

    %% ============ ÉPICAS ============
    subgraph EPICAS["🧭 Épicas del producto"]
        E1(["🔐 Autenticación y Perfil"]):::epic
        E2(["🎓 Gestión Académica"]):::epic
        E3(["📌 Área de Productividad"]):::epic
        E4(["🧠 Aprendizaje Activo"]):::epic
        E5(["💰 Finanzas y Admin"]):::epic
    end

    %% ============ MVP / Release 1.0 ============
    subgraph MVP["🚀 MVP · Release 1.0 — Funcionalidad Core"]
        E1 --> MVP_A1["Login &amp; Registro"]:::mvp
        MVP_A1 --> MVP_A2["Avatar &amp; fondo personalizado"]:::mvp

        E2 --> MVP_G1["Lista de materias"]:::mvp
        MVP_G1 --> MVP_G2["Visualizar horarios"]:::mvp
        MVP_G2 --> MVP_G3["Gestión de vencimientos"]:::mvp
        MVP_G3 --> MVP_G4["Progreso básico"]:::mvp

        E3 --> MVP_P1["Temporizador Pomodoro"]:::mvp
        MVP_P1 --> MVP_P2["Kanban de tareas"]:::mvp
        MVP_P2 --> MVP_P3["Marcadores de estudio"]:::mvp

        E4 --> MVP_AA1["Crear / generar flashcards"]:::mvp
        MVP_AA1 --> MVP_AA2["Sesiones de repaso"]:::mvp

        E5 --> MVP_F1["Estado de cuotas"]:::mvp
        MVP_F1 --> MVP_F2["Beneficios y contacto"]:::mvp
        MVP_F2 --> MVP_F3["Admin: lista de alumnos"]:::mvp
    end

    %% ============ Release 2.0 ============
    subgraph R2["⭐ Release 2.0 — Retención, social y UX"]
        MVP_A2 -.-> R2_A1["Versión mobile pulida"]:::v2

        MVP_G4 -.-> R2_G1["Horarios compartidos"]:::v2
        R2_G1 --> R2_G2["Ranking y gamificación"]:::v2

        MVP_P3 -.-> R2_P1["Presencia activa de usuarios"]:::v2

        MVP_F3 -.-> R2_F1["Sistema de notificaciones"]:::v2
        R2_F1 --> R2_F2["Admin: filtros avanzados"]:::v2
    end

    %% ============ Backlog Futuro ============
    subgraph BKL["🗂️ Backlog futuro — Integraciones e interoperabilidad"]
        R2_G2 -.-> BKL_G1["Integrar otras carreras UTN"]:::backlog
        R2_F2 -.-> BKL_F1["Pasarela de pagos real"]:::backlog
        BKL_F1 --> BKL_F2["Panel de soporte y tickets"]:::backlog
    end

    %% ============ ESTILOS DE CONTENEDORES ============
    style EPICAS fill:#f4f6f7,stroke:#2c3e50,stroke-width:1.5px,rx:12,ry:12
    style MVP fill:#eafaf1,stroke:#1e8449,stroke-width:1.5px,rx:12,ry:12
    style R2 fill:#fdf2e3,stroke:#ca6f1e,stroke-width:1.5px,rx:12,ry:12
    style BKL fill:#f2f3f4,stroke:#5d6d7e,stroke-width:1.5px,stroke-dasharray:4 3,rx:12,ry:12
```

_Nota: La lectura del mapa es descendente, trazando la evolución y priorización en el tiempo de cada módulo del proyecto Cursus._
