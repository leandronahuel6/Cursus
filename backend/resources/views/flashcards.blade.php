@extends('layouts.app')

@section('title', 'Cursus - Flashcards de Estudio')

@push('styles')
<!-- KaTeX stylesheet para renderizado de ecuaciones matemáticas -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
<style>
    /* ==========================================================================
       VARIABLES Y TEMA OSCURO LOCAL (FLASHCARDS)
       ========================================================================== */
    body.dark-mode {
        --bg: #070a13;
        --border: rgba(255, 255, 255, 0.08);
        --border-light: rgba(255, 255, 255, 0.04);
        --surface: rgba(17, 24, 39, 0.6);
        --t1: #f3f4f6;
        --t2: #cbd5e1;
        --t3: #94a3b8;
    }

    body {
        background-image: none;
        background-color: var(--bg);
    }

    /* Fondo Aurora Mesh Gradient Animado en Modo Oscuro */
    body.dark-mode {
        background-image: 
            radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.12) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(6, 182, 212, 0.08) 0px, transparent 50%);
        background-size: 100% 100%, 100% 100%;
        background-attachment: fixed;
        animation: aurora-bg 20s infinite alternate ease-in-out;
    }

    @keyframes aurora-bg {
        0% { background-position: 0% 0%, 100% 100%; }
        50% { background-position: 50% 50%, 50% 50%; }
        100% { background-position: 100% 100%, 0% 0%; }
    }

    /* ==========================================================================
       DISEÑO DE LA INTERFAZ DE FLASHCARDS
       ========================================================================== */
    .fc-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1.5rem 0.5rem;
    }

    .fc-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }

    .fc-title-group h1 {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--t1);
        margin: 0 0 0.25rem 0;
    }

    .fc-title-group p {
        color: var(--t3);
        font-size: 0.95rem;
        margin: 0;
    }

    .fc-header-actions {
        display: flex;
        gap: 0.75rem;
    }

    .btn-create-deck {
        background: var(--brand);
        color: #ffffff;
        border: none;
        border-radius: var(--r);
        padding: 0.75rem 1.25rem;
        font-family: var(--font-display);
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
    }

    .btn-create-deck:hover {
        background: var(--brand-hover);
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3);
    }

    /* Grilla de mazos */
    .decks-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1.5rem;
        margin-top: 1rem;
    }

    /* Tarjetas de Mazos (Decks) */
    .deck-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--r-lg);
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        position: relative;
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        min-height: 200px;
        box-shadow: var(--sh);
    }

    .deck-card:hover {
        transform: translateY(-5px);
        box-shadow: var(--sh-md);
        border-color: var(--brand-dim);
    }

    /* Efecto Cursor Glow en las Tarjetas */
    .deck-card::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: radial-gradient(800px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(99, 102, 241, 0.08), transparent 40%);
        z-index: 1;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.5s;
    }

    .deck-card:hover::before {
        opacity: 1;
    }

    /* Decoración de gradiente superior */
    .deck-card-glow {
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 6px;
        z-index: 2;
    }

    /* Gradientes dinámicos del mazo */
    .deck-color-indigo { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); }
    .deck-color-emerald { background: linear-gradient(135deg, #34d399 0%, #059669 100%); }
    .deck-color-rose { background: linear-gradient(135deg, #fb7185 0%, #e11d48 100%); }
    .deck-color-amber { background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%); }
    .deck-color-violet { background: linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%); }
    .deck-color-cyan { background: linear-gradient(135deg, #22d3ee 0%, #0891b2 100%); }

    .deck-info {
        position: relative;
        z-index: 2;
    }

    .deck-title {
        font-size: 1.2rem;
        font-weight: 700;
        color: var(--t1);
        margin: 0 0 0.5rem 0;
        line-height: 1.3;
    }

    .deck-desc {
        font-size: 0.88rem;
        color: var(--t3);
        margin: 0 0 1.25rem 0;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .deck-stats-row {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.25rem;
        font-size: 0.82rem;
        color: var(--t2);
    }

    .deck-stat-item {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .deck-stat-icon {
        width: 14px;
        height: 14px;
        opacity: 0.7;
    }

    /* Insignia de porcentaje de acierto */
    .accuracy-badge {
        font-size: 0.78rem;
        font-weight: 600;
        padding: 0.15rem 0.5rem;
        border-radius: 9999px;
        display: inline-flex;
        align-items: center;
        gap: 0.2rem;
    }
    .accuracy-high { background: rgba(5, 150, 105, 0.1); color: var(--green); }
    .accuracy-medium { background: rgba(217, 119, 6, 0.1); color: var(--yellow); }
    .accuracy-low { background: rgba(220, 38, 38, 0.1); color: var(--red); }
    .accuracy-none { background: var(--border-light); color: var(--t3); }

    .deck-actions {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        position: relative;
        z-index: 2;
    }

    .btn-study {
        flex: 1;
        background: var(--brand-light);
        color: var(--brand);
        border: 1px solid var(--brand-dim);
        border-radius: var(--r-sm);
        padding: 0.5rem;
        font-family: var(--font-display);
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;
        transition: all 0.2s ease;
    }

    .btn-study:hover:not(:disabled) {
        background: var(--brand);
        color: #ffffff;
        border-color: var(--brand);
    }

    .btn-study:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .btn-deck-icon {
        background: transparent;
        color: var(--t3);
        border: 1px solid var(--border);
        border-radius: var(--r-sm);
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .btn-deck-icon:hover {
        background: var(--border-light);
        color: var(--t1);
        border-color: var(--t3);
    }

    .btn-deck-icon.delete-btn:hover {
        background: rgba(220, 38, 38, 0.08);
        color: var(--red);
        border-color: rgba(220, 38, 38, 0.3);
    }

    /* ==========================================================================
       SECCIÓN DE ESTUDIO ACTIVO (3D FLIP CARD CAROUSEL & MÚLTIPLE OPCIÓN)
       ========================================================================== */
    .study-layout {
        max-width: 600px;
        margin: 0 auto;
        padding: 1rem 0;
    }

    .study-bar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    .btn-back-link {
        background: transparent;
        border: none;
        color: var(--t2);
        font-family: var(--font-display);
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        transition: color 0.2s;
    }

    .btn-back-link:hover {
        color: var(--brand);
    }

    .study-progress-info {
        font-size: 0.85rem;
        color: var(--t3);
        font-weight: 500;
    }

    /* Barra de progreso animada */
    .study-progress-container {
        height: 6px;
        background: var(--border-light);
        border-radius: 999px;
        margin-bottom: 2.5rem;
        overflow: hidden;
        border: 1px solid var(--border);
    }

    .study-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, var(--brand), #06b6d4);
        border-radius: 999px;
        width: 0%;
        transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Envoltura de tarjeta 3D */
    .study-card-wrapper {
        perspective: 1200px;
        width: 100%;
        height: 360px;
        margin-bottom: 2rem;
    }

    .flip-card {
        width: 100%;
        height: 100%;
        cursor: pointer;
    }

    .flip-card-inner {
        position: relative;
        width: 100%;
        height: 100%;
        text-align: center;
        transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        transform-style: preserve-3d;
    }

    .flip-card.flipped .flip-card-inner {
        transform: rotateY(180deg);
    }

    /* Animación de Sacudida (Shake) para tarjetas incorrectas */
    @keyframes card-shake {
        0%, 100% { transform: rotateY(180deg) translateX(0); }
        20%, 60% { transform: rotateY(180deg) translateX(-10px); }
        40%, 80% { transform: rotateY(180deg) translateX(10px); }
    }

    .flip-card.shake-incorrect .flip-card-inner {
        animation: card-shake 0.4s ease;
    }

    .flip-card-front, .flip-card-back {
        position: absolute;
        width: 100%;
        height: 100%;
        backface-visibility: hidden;
        border-radius: 16px;
        padding: 3rem 2.5rem 3.5rem 3.5rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
        border: 1px solid var(--border);
        /* Lined index card effect (Ruled paper theme) */
        background-color: #fcfcfc;
        background-image: 
            /* Red left vertical line */
            linear-gradient(90deg, transparent 2.75rem, rgba(239, 68, 68, 0.35) 2.75rem, rgba(239, 68, 68, 0.35) 2.85rem, transparent 2.85rem),
            /* Light blue horizontal lines */
            linear-gradient(rgba(59, 130, 246, 0.12) 1px, transparent 1px);
        background-size: 100% 100%, 100% 2.2rem;
        background-position: 0 0, 0 1.2rem;
        color: #1e293b; /* Premium slate color for text */
        transition: box-shadow 0.3s ease, border-color 0.3s ease;
    }

    body.dark-mode .flip-card-front, body.dark-mode .flip-card-back {
        background-color: #1e293b; /* Slate background for dark mode index cards */
        background-image: 
            /* Subtle red left vertical line */
            linear-gradient(90deg, transparent 2.75rem, rgba(239, 68, 68, 0.25) 2.75rem, rgba(239, 68, 68, 0.25) 2.85rem, transparent 2.85rem),
            /* Subtle white horizontal lines */
            linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px);
        background-size: 100% 100%, 100% 2.2rem;
        background-position: 0 0, 0 1.2rem;
        color: #f8fafc;
        border-color: rgba(255, 255, 255, 0.06);
        box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
    }

    .flip-card-front {
        /* standard front side */
    }

    .flip-card-back {
        transform: rotateY(180deg);
    }

    .flip-card-front:hover, .flip-card-back:hover {
        box-shadow: 0 20px 40px -10px rgba(99, 102, 241, 0.12);
        border-color: var(--brand-dim);
    }

    /* Decorativos de tarjetas */
    .card-side-tag {
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        padding: 0.2rem 0.6rem;
        border-radius: var(--r-sm);
        background: var(--border-light);
        color: var(--t3);
        border: 1px solid var(--border);
    }

    .card-text {
        font-size: 1.45rem;
        font-weight: 500;
        line-height: 1.6;
        text-align: center;
        max-height: 220px;
        overflow-y: auto;
        padding: 0 0.5rem;
        margin: auto 0; /* Vertically center in the flexbox */
        word-break: break-word;
        width: 100%;
        font-family: var(--font-display);
    }

    /* Teclas de atajos estilizadas (Keycaps) */
    .key-hint {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.06);
        border: 1px solid rgba(0, 0, 0, 0.12);
        border-radius: 4px;
        padding: 0.15rem 0.35rem;
        font-size: 0.72rem;
        font-family: var(--font-display), monospace;
        margin-left: 0.25rem;
        color: rgba(0, 0, 0, 0.5);
        font-weight: 700;
        box-shadow: 0 1.5px 0 rgba(0, 0, 0, 0.08);
    }

    body.dark-mode .key-hint {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.15);
        color: rgba(255, 255, 255, 0.7);
        box-shadow: 0 1.5px 0 rgba(0, 0, 0, 0.3);
    }

    .btn-outcome .key-hint {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.3);
        color: #ffffff;
        box-shadow: 0 1.5px 0 rgba(0, 0, 0, 0.15);
    }

    .card-study-stats {
        margin-top: 1rem;
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--t3);
        background: var(--border-light);
        padding: 0.35rem 0.75rem;
        border-radius: var(--r-sm);
        border: 1px solid var(--border);
    }

    .card-action-hint {
        position: absolute;
        bottom: 1.25rem;
        font-size: 0.78rem;
        color: var(--t3);
        display: flex;
        align-items: center;
        gap: 0.3rem;
        opacity: 0.8;
    }

    /* Controles de estudio (Botones) */
    .study-controls {
        display: flex;
        gap: 1rem;
        justify-content: center;
        opacity: 0;
        transform: translateY(10px);
        pointer-events: none;
        transition: all 0.3s ease;
    }

    .study-controls.visible {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
    }

    .btn-outcome {
        flex: 1;
        max-width: 220px;
        border: none;
        border-radius: var(--r);
        padding: 0.85rem;
        font-family: var(--font-display);
        font-weight: 600;
        font-size: 0.95rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        color: #ffffff;
        transition: all 0.2s ease;
        box-shadow: var(--sh);
    }

    .btn-outcome-incorrect {
        background: var(--red);
        box-shadow: 0 4px 10px rgba(220, 38, 38, 0.15);
    }

    .btn-outcome-incorrect:hover {
        background: #b91c1c;
        transform: translateY(-2px);
        box-shadow: 0 6px 14px rgba(220, 38, 38, 0.25);
    }

    .btn-outcome-correct {
        background: var(--green);
        box-shadow: 0 4px 10px rgba(5, 150, 105, 0.15);
    }

    .btn-outcome-correct:hover {
        background: #047857;
        transform: translateY(-2px);
        box-shadow: 0 6px 14px rgba(5, 150, 105, 0.25);
    }

    /* Hint inicial para voltear */
    .flip-instruction-hint {
        text-align: center;
        color: var(--brand);
        font-size: 0.88rem;
        font-weight: 600;
        margin: 1.5rem 0;
        transition: opacity 0.3s;
    }

    .flip-instruction-hint.hidden {
        opacity: 0;
        pointer-events: none;
    }

    /* Estilos para el Modo Examen (Opción Múltiple estilo Quizlet) */
    .btn-exam-option {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--r);
        padding: 1.1rem;
        font-family: var(--font-body);
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--t1);
        text-align: left;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: var(--sh);
        outline: none;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
    }

    .btn-exam-option:hover:not(:disabled) {
        border-color: var(--brand);
        background: var(--border-light);
        transform: translateY(-2px);
        box-shadow: var(--sh-md);
    }

    .btn-exam-option.option-correct {
        background: rgba(5, 150, 105, 0.15) !important;
        border-color: var(--green) !important;
        color: var(--green) !important;
        font-weight: 600;
    }

    .btn-exam-option.option-incorrect {
        background: rgba(220, 38, 38, 0.15) !important;
        border-color: var(--red) !important;
        color: var(--red) !important;
        font-weight: 600;
    }

    .btn-exam-option:disabled {
        cursor: default;
        opacity: 0.85;
    }

    #exam-options-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
    }


    /* ==========================================================================
       SECCIÓN DE RESUMEN FINAL
       ========================================================================== */
    .summary-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--r-lg);
        padding: 3rem 2rem;
        text-align: center;
        box-shadow: var(--sh-md);
    }

    .summary-icon-celebrate {
        font-size: 3rem;
        margin-bottom: 1rem;
        display: inline-block;
        animation: pulse-bounce 1.5s infinite alternate ease-in-out;
    }

    @keyframes pulse-bounce {
        0% { transform: scale(1) translateY(0); }
        100% { transform: scale(1.1) translateY(-6px); }
    }

    .summary-card h2 {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--t1);
        margin: 0 0 0.5rem 0;
    }

    .summary-card p {
        color: var(--t3);
        font-size: 0.95rem;
        margin: 0 0 2rem 0;
    }

    /* Widget circular de progreso */
    .circular-progress-wrapper {
        position: relative;
        width: 150px;
        height: 150px;
        margin: 0 auto 2rem auto;
    }

    .circular-progress {
        transform: rotate(-90deg);
        width: 100%;
        height: 100%;
    }

    .circular-progress .bg-circle {
        fill: none;
        stroke: var(--border-light);
        stroke-width: 10;
    }

    .circular-progress .fg-circle {
        fill: none;
        stroke: var(--brand);
        stroke-width: 10;
        stroke-dasharray: 377;
        stroke-dashoffset: 377;
        transition: stroke-dashoffset 1s ease-out;
    }

    .circular-progress-wrapper .percentage {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--t1);
    }

    /* Stats del resumen */
    .summary-stats-grid {
        display: flex;
        justify-content: center;
        gap: 2rem;
        margin-bottom: 2.5rem;
    }

    .summary-stat-box {
        background: var(--border-light);
        border: 1px solid var(--border);
        border-radius: var(--r);
        padding: 0.75rem 1.25rem;
        min-width: 110px;
    }

    .summary-stat-val {
        font-size: 1.25rem;
        font-weight: 700;
        margin-bottom: 0.15rem;
    }

    .val-correct { color: var(--green); }
    .val-incorrect { color: var(--red); }
    .val-total { color: var(--t1); }

    .summary-stat-lbl {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--t3);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    /* Recomendaciones de estudio */
    .summary-feedback-box {
        background: var(--brand-light);
        border: 1px solid var(--brand-dim);
        border-radius: var(--r);
        padding: 1rem;
        font-size: 0.88rem;
        color: var(--t2);
        margin-bottom: 2.5rem;
        line-height: 1.5;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        text-align: left;
    }

    .summary-feedback-box svg {
        flex-shrink: 0;
        color: var(--brand);
    }

    .summary-actions {
        display: flex;
        justify-content: center;
        gap: 1rem;
    }

    .btn-summary-restart {
        background: var(--brand);
        color: #ffffff;
        border: none;
        border-radius: var(--r);
        padding: 0.75rem 1.5rem;
        font-family: var(--font-display);
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 4px 10px rgba(79, 70, 229, 0.2);
    }

    .btn-summary-restart:hover {
        background: var(--brand-hover);
        transform: translateY(-2px);
    }

    .btn-summary-back {
        background: transparent;
        color: var(--t2);
        border: 1px solid var(--border);
        border-radius: var(--r);
        padding: 0.75rem 1.5rem;
        font-family: var(--font-display);
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-summary-back:hover {
        background: var(--border-light);
        color: var(--t1);
    }

    /* ==========================================================================
       SECCIÓN DE GESTIÓN DE TARJETAS (MANAGE DECK)
       ========================================================================== */
    .manage-layout {
        max-width: 900px;
        margin: 0 auto;
    }

    .manage-grid {
        display: grid;
        grid-template-columns: 320px 1fr;
        gap: 2rem;
        margin-top: 1rem;
    }

    .distractors-header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    /* ==========================================================================
       ESTILOS RESPONSIVOS PARA DISPOSITIVOS MÓVILES
       ========================================================================== */
    @media (max-width: 768px) {
        .fc-header {
            flex-direction: column;
            align-items: stretch;
            gap: 1.25rem;
            margin-bottom: 1.5rem;
        }

        .fc-title-group {
            text-align: center;
        }

        .fc-header-actions {
            flex-direction: column;
            gap: 0.5rem;
            width: 100%;
        }

        .btn-create-deck {
            width: 100%;
            justify-content: center;
        }

        .manage-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
        }

        .cards-list-container {
            max-height: 400px;
        }
    }

    @media (max-width: 576px) {
        .fc-container {
            padding: 1rem 0.75rem;
        }

        /* Ajustes de estudio activo */
        .study-layout {
            padding: 0.5rem 0;
        }

        .study-card-wrapper {
            height: 280px;
            margin-bottom: 1.5rem;
        }

        .flip-card-front, .flip-card-back {
            padding: 2rem 1.5rem 2.5rem 1.5rem;
        }

        .card-text {
            font-size: 1.15rem;
        }

        .card-action-hint {
            font-size: 0.72rem;
            bottom: 1rem;
        }

        .btn-outcome .key-hint {
            display: none;
        }

        .btn-outcome {
            padding: 0.75rem;
            font-size: 0.9rem;
        }

        /* Ajustes de examen */
        .exam-card-wrapper {
            min-height: auto;
        }

        .exam-card-wrapper .summary-card {
            padding: 1.5rem;
            min-height: auto;
        }

        .exam-card-wrapper #exam-options-grid {
            grid-template-columns: 1fr;
            gap: 0.5rem;
        }

        /* Ajustes de resumen final */
        .summary-card {
            padding: 2rem 1rem;
        }

        .summary-stats-grid {
            gap: 0.75rem;
            flex-wrap: wrap;
        }

        .summary-stat-box {
            flex: 1;
            min-width: 80px;
            padding: 0.6rem 0.5rem;
        }

        .summary-actions {
            flex-direction: column;
            gap: 0.75rem;
            width: 100%;
        }

        .btn-summary-restart, .btn-summary-back {
            width: 100%;
            max-width: none;
            justify-content: center;
        }

        /* Modales */
        .fc-overlay {
            padding: 1rem;
        }

        .fc-modal-box {
            width: 100%;
            max-width: 100%;
        }

        .fc-modal-body {
            padding: 1.25rem;
        }

        .fc-modal-footer {
            padding: 0.85rem 1.25rem;
        }
    }

    @media (max-width: 480px) {
        .deck-actions {
            flex-wrap: wrap;
            gap: 0.5rem;
        }

        .btn-study {
            width: 100%;
            flex: none;
        }

        .btn-deck-icon {
            flex: 1;
            justify-content: center;
        }

        /* Formulario de añadir tarjeta */
        .distractors-header-row {
            flex-direction: column;
            align-items: stretch;
            gap: 0.5rem;
        }

        #btn-suggest-distractors {
            width: 100%;
            justify-content: center;
        }
    }


    .manage-form-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--r-lg);
        padding: 1.5rem;
        box-shadow: var(--sh);
        align-self: start;
    }

    .manage-form-card h3 {
        font-size: 1.1rem;
        font-weight: 700;
        margin: 0 0 1.25rem 0;
        color: var(--t1);
    }

    .form-group {
        margin-bottom: 1.25rem;
    }

    .form-group label {
        display: block;
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--t3);
        margin-bottom: 0.4rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .fc-input {
        width: 100%;
        background: var(--bg);
        border: 1px solid var(--border);
        border-radius: var(--r-sm);
        padding: 0.6rem 0.8rem;
        font-family: var(--font-body);
        font-size: 0.9rem;
        color: var(--t1);
        outline: none;
        transition: all 0.2s;
    }

    .fc-input:focus {
        border-color: var(--brand);
        background: var(--surface);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }

    .fc-select {
        width: 100%;
        padding: 0.6rem 0.8rem;
        border: 1px solid var(--border);
        border-radius: var(--r-sm);
        background: var(--surface);
        color: var(--t1);
        font-size: 0.85rem;
        outline: none;
        cursor: pointer;
        font-family: var(--font-body);
        transition: all 0.2s;
    }

    .fc-select:focus {
        border-color: var(--brand);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }

    /* Adaptación de menús desplegables al modo oscuro */
    body.dark-mode select.fc-input,
    body.dark-mode select.fc-select {
        background-color: #1f2937;
        color: #f3f4f6;
        border-color: rgba(255, 255, 255, 0.12);
    }
    
    body.dark-mode select option,
    body.dark-mode select optgroup {
        background-color: #111827;
        color: #f3f4f6;
    }

    .fc-textarea {
        resize: vertical;
        min-height: 80px;
    }

    .btn-add-card {
        width: 100%;
        background: var(--brand);
        color: #ffffff;
        border: none;
        border-radius: var(--r-sm);
        padding: 0.65rem;
        font-family: var(--font-display);
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        transition: background 0.2s;
    }

    .btn-add-card:hover {
        background: var(--brand-hover);
    }

    /* Listado de tarjetas existentes */
    .cards-list-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        max-height: 520px;
        overflow-y: auto;
        padding-right: 0.5rem;
    }

    .card-list-item {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--r);
        padding: 1.25rem;
        position: relative;
        box-shadow: var(--sh);
        transition: border-color 0.2s;
    }

    .card-list-item:hover {
        border-color: var(--t3);
    }

    .card-item-qa {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding-right: 2.5rem;
    }

    .qa-block {
        font-size: 0.9rem;
    }

    .qa-label {
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--t3);
        margin-bottom: 0.15rem;
    }

    .qa-content {
        color: var(--t1);
        font-weight: 500;
        line-height: 1.4;
    }

    .card-item-actions {
        position: absolute;
        top: 1rem;
        right: 1rem;
        display: flex;
        gap: 0.25rem;
    }

    /* Edición inline de tarjetas */
    .card-edit-form {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        width: 100%;
    }

    .card-edit-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
        margin-top: 0.25rem;
    }

    .btn-card-save {
        background: var(--green);
        color: #ffffff;
        border: none;
        border-radius: var(--r-sm);
        padding: 0.4rem 0.8rem;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
    }

    .btn-card-cancel {
        background: transparent;
        color: var(--t2);
        border: 1px solid var(--border);
        border-radius: var(--r-sm);
        padding: 0.4rem 0.8rem;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
    }

    /* ==========================================================================
       MODALES PERSONALIZADOS
       ========================================================================== */
    .fc-overlay {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(7, 10, 19, 0.4);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.25s ease;
    }

    .fc-overlay.open {
        opacity: 1;
        pointer-events: auto;
    }

    .fc-modal-box {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--r-lg);
        width: 100%;
        max-width: 460px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        transform: scale(0.95);
        transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        overflow: hidden;
    }

    body.dark-mode .fc-modal-box {
        background: #111827; /* Fondo completamente sólido en modo oscuro para legibilidad total */
        border-color: rgba(255, 255, 255, 0.12);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3);
    }

    .category-header:hover {
        background: var(--border) !important;
        border-color: var(--brand-dim) !important;
    }

    .fc-overlay.open .fc-modal-box {
        transform: scale(1);
    }

    .fc-modal-header {
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid var(--border-light);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .fc-modal-title {
        font-size: 1.15rem;
        font-weight: 700;
        color: var(--t1);
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .fc-modal-close {
        background: transparent;
        border: none;
        color: var(--t3);
        font-size: 1.25rem;
        cursor: pointer;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s;
    }

    .fc-modal-close:hover {
        background: var(--border-light);
        color: var(--t1);
    }

    .fc-modal-body {
        padding: 1.5rem;
    }

    /* Selector de color */
    .color-picker-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 0.5rem;
        margin-top: 0.5rem;
    }

    .color-option {
        position: relative;
        height: 38px;
        border-radius: var(--r-sm);
        cursor: pointer;
        transition: transform 0.15s;
        border: 2px solid transparent;
    }

    .color-option:hover {
        transform: scale(1.1);
    }

    .color-option.selected {
        border-color: var(--t1);
        box-shadow: 0 0 0 2px var(--bg);
    }

    .fc-modal-footer {
        padding: 1rem 1.5rem;
        background: var(--border-light);
        border-top: 1px solid var(--border-light);
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
    }

    .btn-modal-cancel {
        background: transparent;
        color: var(--t2);
        border: 1px solid var(--border);
        border-radius: var(--r-sm);
        padding: 0.55rem 1rem;
        font-family: var(--font-display);
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-modal-cancel:hover {
        background: var(--surface);
        color: var(--t1);
    }

    .btn-modal-save {
        background: var(--brand);
        color: #ffffff;
        border: none;
        border-radius: var(--r-sm);
        padding: 0.55rem 1.25rem;
        font-family: var(--font-display);
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        transition: background 0.2s;
    }

    .btn-modal-save:hover {
        background: var(--brand-hover);
    }

    /* Estado vacío */
    .empty-state {
        grid-column: 1 / -1;
        background: var(--surface);
        border: 2px dashed var(--border);
        border-radius: var(--r-lg);
        padding: 4rem 2rem;
        text-align: center;
        color: var(--t3);
    }

    .empty-state-icon {
        margin: 0 auto 1rem auto;
        color: var(--brand-dim);
    }

    .empty-state-title {
        font-size: 1.15rem;
        font-weight: 700;
        color: var(--t2);
        margin: 0 0 0.5rem 0;
    }

    .empty-state-desc {
        font-size: 0.9rem;
        max-width: 320px;
        margin: 0 auto 1.5rem auto;
        line-height: 1.4;
    }

    /* Animaciones Generales */
    .fade-in {
        animation: fadeInEffect 0.3s ease-out forwards;
    }

    @keyframes fadeInEffect {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
    }
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    .ai-loader-spinner {
        box-sizing: border-box;
    }

    /* Estilos Premium para Text-To-Speech (TTS) */
    .btn-card-tts {
        position: absolute;
        top: 1.15rem;
        right: 1.25rem;
        background: transparent;
        border: none;
        color: var(--t3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.4rem;
        border-radius: var(--r-sm);
        transition: all 0.2s ease;
        border: 1px solid transparent;
        z-index: 10;
    }
    
    .btn-card-tts:hover {
        color: var(--brand);
        background: var(--border-light);
        border-color: var(--border);
        transform: scale(1.08);
    }
    
    .btn-card-tts:active {
        transform: scale(0.95);
    }

    /* Estilos de Carpetas/Contenedores de Mazos */
    .category-group {
        margin-top: 2.5rem;
        margin-bottom: 1.5rem;
    }

    .category-header {
        position: relative;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.85rem 1.5rem;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 0 12px 12px 12px;
        cursor: pointer;
        user-select: none;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: var(--sh);
    }

    /* Pestaña superior del archivador físico */
    .category-header::before {
        content: '';
        position: absolute;
        bottom: 100%;
        left: -1px;
        width: 140px;
        height: 20px;
        background: var(--surface);
        border: 1px solid var(--border);
        border-bottom: none;
        border-radius: 8px 12px 0 0;
        z-index: 1;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Ocultar borde superior del cuerpo de la carpeta debajo de la pestaña */
    .category-header::after {
        content: '';
        position: absolute;
        bottom: 100%;
        left: 0;
        width: 138px;
        height: 4px;
        background: var(--surface);
        z-index: 2;
        margin-bottom: -2px;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .category-header:hover {
        background: var(--border-light);
        border-color: var(--brand-dim);
        transform: translateY(-2px);
        box-shadow: var(--sh-md);
    }
    
    .category-header:hover::before {
        background: var(--border-light);
        border-color: var(--brand-dim);
    }
    
    .category-header:hover::after {
        background: var(--border-light);
    }

    /* Ajustes para el Modo Carpeta colapsada */
    .category-group.collapsed .category-header {
        border-radius: 12px;
    }
</style>
@endpush

@section('mobile-header')
<div class="mob-hdr">
  <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
    <div style="display: flex; flex-direction: column;">
      <div class="mob-greet">Flashcards de Estudio 🧠</div>
      <div class="mob-sub">Mis mazos y repaso</div>
    </div>
  </div>
</div>
@endsection

@section('topbar-content')
    <div class="topbar-title">Flashcards de Estudio</div>
@endsection

@section('content')
<div class="fc-container">

    <!-- ==================== SECCIÓN 1: VISTA DE MAZOS (DECKS) ==================== -->
    <div id="section-decks" class="fade-in">
        <div class="fc-header">
            <div class="fc-title-group">
                <h1>Tus Mazos de Estudio</h1>
                <p>Crea paquetes de preguntas y respuestas para entrenar tu memoria activa.</p>
            </div>
            <div class="fc-header-actions">
                <button class="btn-create-deck" style="background: var(--surface); color: var(--t1); border: 1px solid var(--border); box-shadow: var(--sh);" onclick="triggerImportSelector()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M14 12l-4 4-4-4M10 4v12"/></svg>
                    Importar (.json)
                </button>
                <input type="file" id="import-deck-file-input" style="display: none;" accept=".json" onchange="handleImportDeckFile(event)">
                
                <button class="btn-create-deck" style="background: linear-gradient(135deg, #4f46e5, #06b6d4); color: white; border: none; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);" onclick="openAIDeckModal()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                    Crear con IA ✨
                </button>

                <button class="btn-create-deck" onclick="openCreateDeckModal()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5v14"/></svg>
                    Nuevo Mazo
                </button>
            </div>
        </div>

        <div id="decks-container">
            <!-- Cargado de mazos dinámicamente agrupados por categoría -->
            <div style="text-align: center; padding: 3rem; color: var(--t3);" id="decks-loader">
                Cargando tus mazos...
            </div>
        </div>
    </div>


    <!-- ==================== SECCIÓN 2: ESTUDIO ACTIVO (CARRUSEL 3D & EXAMEN) ==================== -->
    <div id="section-study" class="fade-in" style="display: none;">
        <div class="study-layout">
            <div class="study-bar-header">
                <button class="btn-back-link" onclick="exitStudySession()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    Volver a mazos
                </button>
                <div class="study-progress-info" id="study-progress-text">Tarjeta 0 de 0</div>
            </div>

            <div class="study-progress-container">
                <div class="study-progress-bar" id="study-progress-bar"></div>
            </div>

            <!-- Modo Tarjeta (3D Flip) -->
            <div class="study-card-wrapper" id="card-mode-wrapper">
                <div class="flip-card" id="flip-card" onclick="flipStudyCard()">
                    <div class="flip-card-inner">
                        <div class="flip-card-front">
                            <div style="position: absolute; top: 1.25rem; left: 1.5rem; display: flex; gap: 0.5rem; align-items: center;">
                                <span class="card-side-tag" style="position:static;">Pregunta</span>
                            </div>
                            <button class="btn-card-tts" onclick="speakCardText(event, 'card-question-text')" title="Escuchar pregunta">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                            </button>
                            <div class="card-text" id="card-question-text">¿Cargando pregunta?</div>
                            <div class="card-action-hint">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                                Clic para ver la respuesta (o pulsa [Espacio])
                            </div>
                        </div>
                        <div class="flip-card-back">
                            <div style="position: absolute; top: 1.25rem; left: 1.5rem; display: flex; gap: 0.5rem; align-items: center;">
                                <span class="card-side-tag" style="position:static;">Respuesta</span>
                            </div>
                            <button class="btn-card-tts" onclick="speakCardText(event, 'card-answer-text')" title="Escuchar respuesta">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                            </button>
                            <div class="card-text" id="card-answer-text">¿Cargando respuesta?</div>
                            <div class="card-study-stats" id="card-study-stats">Sin repaso previo</div>
                            <div class="card-action-hint">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                                Clic para ver la pregunta
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modo Examen (Múltiple Opción estilo Quizlet) -->
            <div class="exam-card-wrapper" id="exam-mode-wrapper" style="display: none; width: 100%; min-height: 380px; margin-bottom: 2rem;">
                <div class="summary-card" style="padding: 2.25rem; text-align: left; box-shadow: var(--sh-md); display: flex; flex-direction: column; justify-content: space-between; min-height: 380px; border-radius: var(--r-lg);">
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                            <span class="card-side-tag" style="position:static; background: var(--brand-light); color: var(--brand); border-color: var(--brand-dim);">Examen</span>
                        </div>
                        <div class="card-text" id="exam-question-text" style="font-size: 1.25rem; margin-bottom: 1.5rem; max-height: 120px; overflow-y: auto; width: 100%; padding: 0;">¿Cargando pregunta?</div>
                    </div>
                    
                    <div id="exam-options-grid">
                        <!-- Botones inyectados dinámicamente -->
                    </div>
                    
                    <div style="display: none; justify-content: flex-end; margin-top: 1.5rem;" id="exam-next-action-wrapper">
                        <button class="btn-create-deck" style="padding: 0.65rem 1.25rem; font-size: 0.85rem;" onclick="proceedToNextExamCard()">
                            Continuar
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </button>
                    </div>
                </div>
            </div>

            <div class="flip-instruction-hint" id="flip-hint-message">
                💡 Haz clic o pulsa [Espacio] para revelarla antes de calificar.
            </div>

            <div class="study-controls" id="study-controls">
                <button class="btn-outcome btn-outcome-incorrect" onclick="submitCardResult('incorrecto')">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>
                    <span>No lo sé</span>
                    <kbd class="key-hint">1</kbd>
                    <kbd class="key-hint">←</kbd>
                </button>
                <button class="btn-outcome btn-outcome-correct" onclick="submitCardResult('correcto')">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>
                    <span>Lo sé</span>
                    <kbd class="key-hint">2</kbd>
                    <kbd class="key-hint">→</kbd>
                </button>
            </div>
        </div>
    </div>


    <!-- ==================== SECCIÓN 3: RESUMEN DE SESIÓN ==================== -->
    <div id="section-summary" class="fade-in" style="display: none;">
        <div class="study-layout">
            <div class="summary-card">
                <div class="summary-icon-celebrate">🎉</div>
                <h2 id="summary-title">¡Mazo Completado!</h2>
                <p>Has repasado todas las tarjetas disponibles en este mazo.</p>

                <div class="circular-progress-wrapper">
                    <svg class="circular-progress">
                        <circle cx="75" cy="75" r="60" class="bg-circle"></circle>
                        <circle cx="75" cy="75" r="60" class="fg-circle" id="summary-circle-progress"></circle>
                    </svg>
                    <div class="percentage" id="summary-percentage-text">0%</div>
                </div>

                <div class="summary-stats-grid">
                    <div class="summary-stat-box">
                        <div class="summary-stat-val val-correct" id="summary-stat-correct">0</div>
                        <div class="summary-stat-lbl">Correctas</div>
                    </div>
                    <div class="summary-stat-box">
                        <div class="summary-stat-val val-incorrect" id="summary-stat-incorrect">0</div>
                        <div class="summary-stat-lbl">Incorrectas</div>
                    </div>
                    <div class="summary-stat-box">
                        <div class="summary-stat-val val-total" id="summary-stat-total">0</div>
                        <div class="summary-stat-lbl">Repasadas</div>
                    </div>
                </div>

                <div class="summary-feedback-box" id="summary-feedback-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                    <span id="summary-feedback-text">¡Buen trabajo! Sigue practicando para consolidar tus conocimientos en este tema.</span>
                </div>

                <div class="summary-actions">
                    <button class="btn-summary-restart" onclick="restartStudySession()">
                        Estudiar de nuevo
                    </button>
                    <button class="btn-summary-back" onclick="exitSummaryToDecks()">
                        Volver a mis mazos
                    </button>
                </div>
            </div>
        </div>
    </div>


    <!-- ==================== SECCIÓN 4: GESTIÓN DE TARJETAS ==================== -->
    <div id="section-manage" class="fade-in" style="display: none;">
        <div class="manage-layout">
            <div class="fc-header" style="margin-bottom: 1.5rem;">
                <div class="fc-title-group">
                    <button class="btn-back-link" onclick="exitManageSection()" style="margin-bottom: 0.5rem;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                        Volver a mazos
                    </button>
                    <h1 id="manage-deck-name">Gestionar Mazo</h1>
                    <p>Agrega o elimina preguntas y respuestas rápidas. Soporta Markdown y fórmulas KaTeX con `$E=mc^2$` o `$$x^2$$`.</p>
                </div>
            </div>

            <div class="manage-grid">
                <!-- Formulario -->
                <div class="manage-form-card">
                    <h3>Añadir Tarjeta</h3>
                    <form id="add-card-form" onsubmit="handleCreateCard(event)">
                        <div class="form-group">
                            <label for="card-input-question">Pregunta (Frente)</label>
                            <textarea id="card-input-question" class="fc-input fc-textarea" placeholder="Escribe la pregunta... Usa $x^2$ para fórmulas." required></textarea>
                        </div>
                        <div class="form-group">
                            <label for="card-input-answer">Respuesta (Reverso)</label>
                            <textarea id="card-input-answer" class="fc-input fc-textarea" placeholder="Escribe la respuesta... Usa `código` para resaltar." required></textarea>
                        </div>
                        <div style="margin-top: 1rem; border-top: 1px solid var(--border); padding-top: 1rem; margin-bottom: 1.25rem;">
                            <div class="distractors-header-row">
                                <span style="font-size:0.85rem; font-weight:600; color:var(--t2);">Opciones incorrectas (Opcional)</span>
                                <button type="button" id="btn-suggest-distractors" onclick="handleSuggestDistractors()" style="background:var(--border-light); border:1px solid var(--border); border-radius:var(--r-sm); padding:0.25rem 0.6rem; font-size:0.75rem; font-weight:600; color:var(--brand); cursor:pointer; display:flex; align-items:center; gap:0.25rem; transition:all 0.2s;">
                                    <span>Sugerir con IA ✨</span>
                                </button>
                            </div>
                            <div class="form-group" style="margin-bottom:0.5rem;">
                                <input type="text" id="card-input-d1" class="fc-input" placeholder="Opción incorrecta 1" style="font-size:0.8rem; padding:0.5rem;">
                            </div>
                            <div class="form-group" style="margin-bottom:0.5rem;">
                                <input type="text" id="card-input-d2" class="fc-input" placeholder="Opción incorrecta 2" style="font-size:0.8rem; padding:0.5rem;">
                            </div>
                            <div class="form-group" style="margin-bottom:0.5rem;">
                                <input type="text" id="card-input-d3" class="fc-input" placeholder="Opción incorrecta 3" style="font-size:0.8rem; padding:0.5rem;">
                            </div>
                        </div>
                        <button type="submit" class="btn-add-card">Guardar Tarjeta</button>
                    </form>
                </div>

                <!-- Lista de tarjetas -->
                <div>
                    <h3 style="font-size: 1.1rem; font-weight: 700; margin: 0 0 1rem 0; color: var(--t1);">
                        Tarjetas del Mazo (<span id="manage-cards-count">0</span>)
                    </h3>
                    <div class="cards-list-container" id="manage-cards-list">
                        <!-- Carga dinámica con AJAX -->
                        <div style="text-align: center; padding: 2rem; color: var(--t3);">
                            Cargando tarjetas...
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

</div>

<!-- ==================== OVERLAY MODAL: NUEVO/EDITAR MAZO ==================== -->
<div class="fc-overlay" id="create-deck-modal" onclick="closeCreateDeckModalOnOverlay(event)">
    <div class="fc-modal-box">
        <div class="fc-modal-header">
            <div class="fc-modal-title" id="deck-modal-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10"/></svg>
                <span id="deck-modal-title-text">Nuevo Mazo de Estudio</span>
            </div>
            <button class="fc-modal-close" onclick="closeCreateDeckModal()">✕</button>
        </div>
        <form id="create-deck-form" onsubmit="handleCreateDeck(event)">
            <input type="hidden" id="deck-edit-id" value="">
            <div class="fc-modal-body">
                <div class="form-group">
                    <label for="deck-input-name">Nombre del Mazo</label>
                    <input type="text" id="deck-input-name" class="fc-input" placeholder="Ej: Anatomía I, SQL Joins, Historia..." required autocomplete="off">
                </div>
                <div class="form-group">
                    <label for="deck-input-desc">Descripción (Opcional)</label>
                    <input type="text" id="deck-input-desc" class="fc-input" placeholder="Ej: Repaso examen segundo parcial..." autocomplete="off">
                </div>
                <div class="form-group">
                    <label for="deck-select-category">Contenedor / Carpeta</label>
                    <select id="deck-select-category" class="fc-input" onchange="handleDeckSelectCategoryChange()">
                        <option value="General">General (Sin contenedor)</option>
                        <option value="__NEW__">+ Crear nuevo contenedor...</option>
                    </select>
                    <div id="new-category-input-wrapper" style="display: none; margin-top: 0.75rem;">
                        <label for="deck-input-category" style="font-size: 0.8rem; opacity: 0.85; margin-bottom: 0.25rem; display: block;">Nombre del nuevo contenedor</label>
                        <input type="text" id="deck-input-category" class="fc-input" placeholder="Ej: Programación, Matemáticas, Legislación..." autocomplete="off">
                    </div>
                </div>
                <div class="form-group">
                    <label>Estilo / Color de Mazo</label>
                    <div class="color-picker-grid" id="color-picker-grid">
                        <div class="color-option deck-color-indigo selected" data-color="indigo"></div>
                        <div class="color-option deck-color-emerald" data-color="emerald"></div>
                        <div class="color-option deck-color-rose" data-color="rose"></div>
                        <div class="color-option deck-color-amber" data-color="amber"></div>
                        <div class="color-option deck-color-violet" data-color="violet"></div>
                        <div class="color-option deck-color-cyan" data-color="cyan"></div>
                    </div>
                </div>
            </div>
            <div class="fc-modal-footer">
                <button type="button" class="btn-modal-cancel" onclick="closeCreateDeckModal()">Cancelar</button>
                <button type="submit" class="btn-modal-save" id="btn-deck-submit">Crear Mazo</button>
            </div>
        </form>
    </div>
</div>

<!-- ==================== OVERLAY MODAL: CREAR MAZO CON IA ==================== -->
<div class="fc-overlay" id="ai-deck-modal" onclick="closeAIDeckModalOnOverlay(event)">
    <div class="fc-modal-box" style="max-width: 440px;">
        <div class="fc-modal-header">
            <div class="fc-modal-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                <span>Generar Mazo con IA ✨</span>
            </div>
            <button class="fc-modal-close" onclick="closeAIDeckModal()">✕</button>
        </div>
        <form id="ai-deck-form" onsubmit="handleAICreateDeck(event)" enctype="multipart/form-data">
            <div class="fc-modal-body">
                <p style="font-size: 0.85rem; color: var(--t3); margin: 0 0 1.2rem 0; line-height: 1.45;">
                    Sube un archivo de estudio (**PDF, Word, PowerPoint, Texto, Markdown o Imagen**) y nuestra IA analizará el contenido para extraer y generar automáticamente un mazo completo de preguntas y respuestas.
                </p>
                <div class="form-group">
                    <label for="ai-deck-file" style="font-size: 0.85rem; font-weight: 600; color: var(--t2); display: block; margin-bottom: 0.4rem;">Seleccionar documento o imagen (.pdf, .docx, .pptx, .txt, .md, .jpg, .png)</label>
                    <input type="file" id="ai-deck-file" name="file" accept=".pdf,.docx,.pptx,.txt,.md,.jpg,.jpeg,.png" required style="width: 100%; padding: 0.6rem; border: 2px dashed var(--border); border-radius: var(--r-sm); background: var(--border-light); font-size: 0.85rem; outline: none; cursor: pointer;">
                </div>
                <div class="form-group" style="margin-top: 1.25rem;">
                    <label for="ai-deck-cards-count" style="font-size: 0.85rem; font-weight: 600; color: var(--t2); display: block; margin-bottom: 0.4rem;">Cantidad de flashcards a generar</label>
                    <select id="ai-deck-cards-count" name="cantidad" class="fc-select">
                        <option value="5">5 tarjetas (Rápido)</option>
                        <option value="10" selected>10 tarjetas (Recomendado)</option>
                        <option value="15">15 tarjetas (Completo)</option>
                        <option value="20">20 tarjetas (Extenso)</option>
                    </select>
                </div>
                <div class="form-group" style="margin-top: 1.25rem;">
                    <label for="ai-deck-select-category" style="font-size: 0.85rem; font-weight: 600; color: var(--t2); display: block; margin-bottom: 0.4rem;">Contenedor / Carpeta de destino</label>
                    <select id="ai-deck-select-category" class="fc-input" onchange="handleAIDeckSelectCategoryChange()" style="font-size: 0.85rem;">
                        <option value="__AUTO__">Auto-detectar con IA ✨</option>
                        <option value="General">General (Sin contenedor)</option>
                    </select>
                    <div id="ai-new-category-input-wrapper" style="display: none; margin-top: 0.75rem;">
                        <label for="ai-deck-input-category" style="font-size: 0.8rem; opacity: 0.85; margin-bottom: 0.25rem; display: block;">Nombre del nuevo contenedor</label>
                        <input type="text" id="ai-deck-input-category" class="fc-input" placeholder="Ej: Programación, Anatomía..." autocomplete="off">
                    </div>
                </div>
            </div>
            <div class="fc-modal-footer" style="display: flex; justify-content: flex-end; gap: 0.5rem; padding: 1rem 1.5rem; background: var(--border-light);">
                <button type="button" class="btn-modal-cancel" onclick="closeAIDeckModal()">Cancelar</button>
                <button type="submit" class="btn-modal-save" id="btn-ai-submit" style="background: linear-gradient(135deg, #4f46e5, #06b6d4);">Generar Mazo</button>
            </div>
        </form>
    </div>
</div>

<!-- ==================== OVERLAY: CARGANDO GENERACIÓN IA ==================== -->
<div class="fc-overlay" id="ai-loading-overlay" style="display: none; align-items: center; justify-content: center; z-index: 2000; background: rgba(11, 15, 25, 0.85); backdrop-filter: blur(8px);">
    <div style="text-align: center; color: white; max-width: 320px; padding: 2rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: var(--r-lg); box-shadow: var(--sh-md);">
        <div class="ai-loader-spinner" style="width: 50px; height: 50px; border: 4px solid rgba(255,255,255,0.1); border-top-color: #06b6d4; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1.5rem;"></div>
        <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 0.5rem;" id="ai-loading-title">Procesando archivo...</h3>
        <p style="font-size: 13px; color: var(--tm); line-height: 1.45;" id="ai-loading-text">La IA de Cursus está analizando tu documento para generar las flashcards.</p>
    </div>
</div>

<!-- ==================== OVERLAY MODAL: CONFIRMACIÓN PERSONALIZADA ==================== -->
<div class="fc-overlay" id="custom-confirm-modal" style="display: none; align-items: center; justify-content: center; z-index: 3000;">
    <div class="fc-modal-box" style="max-width: 400px; transform: scale(0.9); opacity: 0; transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);">
        <div class="fc-modal-header" style="border-bottom: none; padding: 1.5rem 1.5rem 0.5rem 1.5rem;">
            <div class="fc-modal-title" style="font-size: 1.2rem; font-weight: 700; color: var(--t1); display: flex; align-items: center; gap: 0.6rem;">
                <span id="confirm-modal-icon-container"></span>
                <span id="confirm-modal-title-text">Confirmar acción</span>
            </div>
        </div>
        <div class="fc-modal-body" style="padding: 0.5rem 1.5rem 1.2rem 1.5rem;">
            <p id="confirm-modal-body-text" style="font-size: 0.88rem; color: var(--t3); margin: 0; line-height: 1.5;"></p>
        </div>
        <div class="fc-modal-footer" style="background: var(--border-light); padding: 1rem 1.5rem; display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid var(--border-light);">
            <button type="button" class="btn-modal-cancel" id="btn-confirm-cancel" style="padding: 0.55rem 1.25rem; font-size: 0.85rem; font-weight: 600;">Cancelar</button>
            <button type="button" class="btn-modal-save" id="btn-confirm-accept" style="padding: 0.55rem 1.25rem; font-size: 0.85rem; font-weight: 600; border: none; border-radius: var(--r-sm); cursor: pointer; transition: all 0.2s;">Aceptar</button>
        </div>
    </div>
</div>

<!-- ==================== OVERLAY MODAL: SELECCIONAR MODO DE ESTUDIO ==================== -->
<div class="fc-overlay" id="study-mode-modal" onclick="closeStudyModeModalOnOverlay(event)">
    <div class="fc-modal-box" style="max-width: 420px;">
        <div class="fc-modal-header">
            <div class="fc-modal-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                Modo de Estudio
            </div>
            <button class="fc-modal-close" onclick="closeStudyModeModal()">✕</button>
        </div>
        <div class="fc-modal-body">
            <p style="font-size: 0.9rem; color: var(--t3); margin: 0 0 1.25rem 0;">Elige cómo quieres repasar las tarjetas de este mazo.</p>
            
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <label style="display: flex; gap: 0.75rem; align-items: flex-start; padding: 0.85rem; border: 1px solid var(--brand); border-radius: var(--r); cursor: pointer; background: var(--border-light); transition: all 0.2s;" id="label-mode-all">
                    <input type="radio" name="study-mode-choice" value="all" checked style="margin-top: 0.25rem;">
                    <div>
                        <strong style="display: block; font-size: 0.9rem; color: var(--t1); margin-bottom: 0.15rem;">Estudiar Todo</strong>
                        <span style="font-size: 0.8rem; color: var(--t3);">Repasa todas las tarjetas del mazo mezcladas aleatoriamente.</span>
                    </div>
                </label>


                <label style="display: flex; gap: 0.75rem; align-items: flex-start; padding: 0.85rem; border: 1px solid var(--border); border-radius: var(--r); cursor: pointer; transition: all 0.2s;" id="label-mode-exam">
                    <input type="radio" name="study-mode-choice" value="exam" style="margin-top: 0.25rem;">
                    <div>
                        <strong style="display: block; font-size: 0.9rem; color: var(--t1); margin-bottom: 0.15rem;">Modo Examen (Quizlet-style)</strong>
                        <span style="font-size: 0.8rem; color: var(--t3);">Cuestionario de opción múltiple de 4 opciones generado automáticamente.</span>
                    </div>
                </label>
            </div>

            <!-- Configuración de preguntas para Modo Examen -->
            <div id="exam-quantity-wrapper" style="display: none; margin-top: 1.25rem; padding: 0.85rem; border: 1px solid var(--border); border-radius: var(--r); background: var(--border-light);">
                <label for="exam-question-count" style="font-size: 0.85rem; font-weight: 600; color: var(--t2); display: block; margin-bottom: 0.4rem;">Cantidad de preguntas en el cuestionario</label>
                <select id="exam-question-count" class="fc-select">
                    <option value="all" selected>Todas las tarjetas del mazo</option>
                    <option value="5">5 preguntas</option>
                    <option value="10">10 preguntas</option>
                    <option value="15">15 preguntas</option>
                    <option value="20">20 preguntas</option>
                </select>
            </div>
        </div>
        <div class="fc-modal-footer">
            <button type="button" class="btn-modal-cancel" onclick="closeStudyModeModal()">Cancelar</button>
            <button type="button" class="btn-modal-save" onclick="confirmStudySessionStart()">Iniciar Estudio</button>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<!-- KaTeX JavaScript para compilar fórmulas matemáticas en el cliente -->
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
<!-- Canvas Confetti para celebrar al terminar el mazo -->
<script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
<script>
    // Variables de estado
    let activeToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    let currentDecks = [];
    let currentStudyDeck = null;
    let currentStudyCards = [];
    let masterSessionCards = []; // Todos los del mazo para distractores
    let currentStudyIndex = 0;
    let currentSessionCorrect = 0;
    let currentSessionIncorrect = 0;
    let keyboardListener = null;
    let editingCardId = null;
    let selectedDeckIdForStudy = null;
    let currentStudyMode = 'all';
    let confirmPromiseResolve = null;

    function showCustomConfirm({ title, message, acceptText = 'Confirmar', cancelText = 'Cancelar', isDestructive = false }) {
        return new Promise((resolve) => {
            const modal = document.getElementById('custom-confirm-modal');
            const modalBox = modal.querySelector('.fc-modal-box');
            const titleEl = document.getElementById('confirm-modal-title-text');
            const bodyEl = document.getElementById('confirm-modal-body-text');
            const btnCancel = document.getElementById('btn-confirm-cancel');
            const btnAccept = document.getElementById('btn-confirm-accept');
            const iconContainer = document.getElementById('confirm-modal-icon-container');

            titleEl.textContent = title;
            bodyEl.textContent = message;
            btnCancel.textContent = cancelText;
            btnAccept.textContent = acceptText;

            if (isDestructive) {
                btnAccept.style.background = '#dc2626';
                btnAccept.style.color = '#ffffff';
                btnAccept.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.2)';
                iconContainer.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>`;
            } else {
                btnAccept.style.background = 'linear-gradient(135deg, #4f46e5, #06b6d4)';
                btnAccept.style.color = '#ffffff';
                btnAccept.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.2)';
                iconContainer.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>`;
            }

            modal.style.display = 'flex';
            setTimeout(() => {
                modal.classList.add('open');
                modalBox.style.transform = 'scale(1)';
                modalBox.style.opacity = '1';
            }, 10);

            confirmPromiseResolve = resolve;
        });
    }

    function closeCustomConfirm(result) {
        const modal = document.getElementById('custom-confirm-modal');
        const modalBox = modal.querySelector('.fc-modal-box');
        modal.classList.remove('open');
        modalBox.style.transform = 'scale(0.9)';
        modalBox.style.opacity = '0';
        setTimeout(() => {
            modal.style.display = 'none';
            if (confirmPromiseResolve) {
                confirmPromiseResolve(result);
                confirmPromiseResolve = null;
            }
        }, 250);
    }

    // Elementos DOM de secciones
    const sectionDecks = document.getElementById('section-decks');
    const sectionStudy = document.getElementById('section-study');
    const sectionSummary = document.getElementById('section-summary');
    const sectionManage = document.getElementById('section-manage');

    // Carga inicial
    document.addEventListener('DOMContentLoaded', async () => {
        if (!activeToken) {
            window.location.replace('/login');
            return;
        }

        await loadMateriasCursandoFlashcards();
        loadDecks();
        initColorPicker();
        initStudyModeSelector();

        // Listeners confirm modal
        document.getElementById('btn-confirm-cancel').addEventListener('click', () => closeCustomConfirm(false));
        document.getElementById('btn-confirm-accept').addEventListener('click', () => closeCustomConfirm(true));
        document.getElementById('custom-confirm-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('custom-confirm-modal')) {
                closeCustomConfirm(false);
            }
        });
    });

    // Configuración headers de la API
    function getApiHeaders() {
        return {
            'Authorization': 'Bearer ' + activeToken,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': '{{ csrf_token() }}'
        };
    }

    // Atajos de teclado para la sesión de estudio
    function enableKeyboardShortcuts() {
        if (keyboardListener) return;
        keyboardListener = function (e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
                return;
            }

            if (sectionStudy.style.display === 'none') return;
            if (currentStudyMode === 'exam') return; // En modo examen desactivamos atajos para no colisionar

            if (e.code === 'Space') {
                e.preventDefault();
                flipStudyCard();
            } else if (e.code === 'Digit1' || e.code === 'ArrowLeft') {
                const flipCard = document.getElementById('flip-card');
                if (flipCard.classList.contains('flipped')) {
                    submitCardResult('incorrecto');
                }
            } else if (e.code === 'Digit2' || e.code === 'ArrowRight') {
                const flipCard = document.getElementById('flip-card');
                if (flipCard.classList.contains('flipped')) {
                    submitCardResult('correcto');
                }
            }
        };
        document.addEventListener('keydown', keyboardListener);
    }

    function disableKeyboardShortcuts() {
        if (keyboardListener) {
            document.removeEventListener('keydown', keyboardListener);
            keyboardListener = null;
        }
    }

    // ==========================================================================
    // LÓGICA DE MAZOS (DECKS)
    // ==========================================================================
    let materiasCursandoFlashcards = [];

    async function loadMateriasCursandoFlashcards() {
        try {
            const response = await fetch('/api/mis-materias', { headers: getApiHeaders() });
            if (!response.ok) throw new Error('No se pudieron cargar las materias');
            const data = await response.json();
            materiasCursandoFlashcards = data.filter(m => m.estado === 'cursando');
        } catch (err) {
            materiasCursandoFlashcards = [];
        }
    }

    async function loadDecks() {
        const container = document.getElementById('decks-container');
        try {
            const response = await fetch('/api/flashcards/decks', {
                method: 'GET',
                headers: getApiHeaders()
            });

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.replace('/login');
                    return;
                }
                throw new Error('Error al cargar mazos');
            }

            currentDecks = await response.json();
            renderDecks(currentDecks);
        } catch (error) {
            console.error(error);
            container.innerHTML = `
                <div style="text-align:center; padding:3rem; color:var(--red);">
                    ⚠️ Ocurrió un error al cargar tus mazos de estudio. Intenta recargar la página.
                </div>
            `;
        }
    }

    function toggleCategoryGroup(catId) {
        const grid = document.getElementById('grid-' + catId);
        const group = document.getElementById('group-' + catId);
        const header = document.querySelector(`#group-${catId} .category-header`);
        const chevron = header.querySelector('.category-chevron');
        
        if (grid.style.display === 'none') {
            grid.style.display = 'grid';
            if (group) group.classList.remove('collapsed');
            chevron.style.transform = 'rotate(0deg)';
            localStorage.setItem('collapsed_cat_' + catId, 'false');
        } else {
            grid.style.display = 'none';
            if (group) group.classList.add('collapsed');
            chevron.style.transform = 'rotate(-90deg)';
            localStorage.setItem('collapsed_cat_' + catId, 'true');
        }
    }

    function renderDecks(decks) {
        const container = document.getElementById('decks-container');
        if (decks.length === 0 && materiasCursandoFlashcards.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg class="empty-state-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10"/></svg>
                    <h3 class="empty-state-title">No tienes mazos aún</h3>
                    <p class="empty-state-desc">Crea tu primer mazo para agregar tarjetas de estudio y comenzar a repasar.</p>
                    <button class="btn-create-deck" style="margin: 0 auto;" onclick="openCreateDeckModal()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5v14"/></svg>
                        Crear Primer Mazo
                    </button>
                </div>
            `;
            return;
        }

        // Agrupar mazos por categoría
        const groups = {};
        decks.forEach(deck => {
            const cat = deck.categoria ? deck.categoria.trim() : 'General';
            if (!groups[cat]) {
                groups[cat] = [];
            }
            groups[cat].push(deck);
        });



        // Materias que el alumno está cursando ahora mismo (vienen de la base de datos vía /api/mis-materias)
        const materiaNombres = materiasCursandoFlashcards.map(m => m.nombre);
        let materiasOptionsHtml = '';
        if (materiaNombres.length > 0) {
            materiasOptionsHtml += `<optgroup label="Mis materias en curso">`;
            materiaNombres.forEach(nombre => {
                materiasOptionsHtml += `<option value="${escapeHtml(nombre)}">${escapeHtml(nombre)}</option>`;
            });
            materiasOptionsHtml += `</optgroup>`;
        }

        // Poblar el selector de carpetas del modal de creación
        const selectCategory = document.getElementById('deck-select-category');
        if (selectCategory) {
            const distinctCategories = Object.keys(groups).filter(cat => cat !== 'General' && !materiaNombres.includes(cat));
            const currentValue = selectCategory.value;

            let selectHtml = `<option value="General">General (Sin contenedor)</option>`;
            selectHtml += materiasOptionsHtml;
            if (distinctCategories.length > 0) {
                selectHtml += `<optgroup label="Otros contenedores">`;
                distinctCategories.forEach(cat => {
                    selectHtml += `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`;
                });
                selectHtml += `</optgroup>`;
            }
            selectHtml += `<option value="__NEW__">+ Crear nuevo contenedor...</option>`;

            selectCategory.innerHTML = selectHtml;

            if (currentValue && selectCategory.querySelector(`option[value="${currentValue}"]`)) {
                selectCategory.value = currentValue;
            }
        }

        // Poblar el selector de carpetas del modal de IA
        const aiSelectCategory = document.getElementById('ai-deck-select-category');
        if (aiSelectCategory) {
            const distinctCategories = Object.keys(groups).filter(cat => cat !== 'General' && !materiaNombres.includes(cat));
            const currentValue = aiSelectCategory.value;

            let selectHtml = `
                <option value="__AUTO__">Auto-detectar con IA ✨</option>
                <option value="General">General (Sin contenedor)</option>
            `;
            selectHtml += materiasOptionsHtml;
            if (distinctCategories.length > 0) {
                selectHtml += `<optgroup label="Otros contenedores">`;
                distinctCategories.forEach(cat => {
                    selectHtml += `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`;
                });
                selectHtml += `</optgroup>`;
            }
            selectHtml += `<option value="__NEW__">+ Crear nuevo contenedor...</option>`;

            aiSelectCategory.innerHTML = selectHtml;

            if (currentValue && aiSelectCategory.querySelector(`option[value="${currentValue}"]`)) {
                aiSelectCategory.value = currentValue;
            }
        }

        // Renderizar cada grupo de categoría colapsable
        let html = '';
        Object.keys(groups).sort((a, b) => {
            if (a === 'General') return -1;
            if (b === 'General') return 1;
            return a.localeCompare(b);
        }).forEach(cat => {
            const catDecks = groups[cat];
            const catId = 'cat-' + cat.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const isCollapsed = localStorage.getItem('collapsed_cat_' + catId) === 'true';

            html += `
                <div class="category-group ${isCollapsed ? 'collapsed' : ''}" id="group-${catId}">
                    <div class="category-header" onclick="toggleCategoryGroup('${catId}')">
                        <div style="display:flex; align-items:center; gap:0.6rem;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.85;">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                            </svg>
                            <span style="font-weight:700; font-size:1.02rem; color:var(--t1);">${escapeHtml(cat)}</span>
                            <span style="font-size:0.75rem; font-weight:600; padding:0.15rem 0.5rem; background:var(--border); border-radius:9999px; color:var(--t3);">${catDecks.length}</span>
                        </div>
                        <svg class="category-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transition:transform 0.25s ease; ${isCollapsed ? 'transform:rotate(-90deg);' : ''}">
                            <path d="m6 9 6 6 6-6"/>
                        </svg>
                    </div>
                    <div class="decks-grid" id="grid-${catId}" style="display:${isCollapsed ? 'none' : 'grid'}; transition:all 0.3s ease;">
            `;

            if (catDecks.length === 0) {
                html += `
                    <div class="empty-state" style="grid-column: 1 / -1; padding: 1.5rem;">
                        <p class="empty-state-desc" style="margin: 0 0 0.8rem 0;">Todavía no tienes mazos para esta materia.</p>
                        <button class="btn-create-deck" style="margin: 0 auto;" onclick="openCreateDeckModalForMateria('${escapeJs(cat)}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5v14"/></svg>
                            Crear Mazo
                        </button>
                    </div>
                `;
            }

            catDecks.forEach(deck => {
                const hasCards = deck.cards_count > 0;
                const accuracy = deck.porcentaje_acierto;
                
                let accuracyClass = 'accuracy-none';
                let accuracyText = 'Sin datos';
                if (accuracy !== null) {
                    accuracyText = `${accuracy}% aciertos`;
                    if (accuracy >= 80) accuracyClass = 'accuracy-high';
                    else if (accuracy >= 50) accuracyClass = 'accuracy-medium';
                    else accuracyClass = 'accuracy-low';
                }

                html += `
                    <div class="deck-card" id="deck-card-${deck.id}" style="--mouse-x: 0px; --mouse-y: 0px;">
                        <div class="deck-card-glow deck-color-${deck.color || 'indigo'}"></div>
                        <div class="deck-info">
                            <h3 class="deck-title">${escapeHtml(deck.nombre)}</h3>
                            <p class="deck-desc">${deck.descripcion ? escapeHtml(deck.descripcion) : 'Sin descripción.'}</p>
                            
                            <div class="deck-stats-row">
                                <div class="deck-stat-item" title="Cantidad de tarjetas">
                                    <svg class="deck-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10"/></svg>
                                    <span>${deck.cards_count} ${deck.cards_count === 1 ? 'tarjeta' : 'tarjetas'}</span>
                                </div>
                                <span class="accuracy-badge ${accuracyClass}">
                                    ${accuracyText}
                                </span>
                            </div>
                        </div>

                        <div class="deck-actions">
                            <button class="btn-study" onclick="startStudySession(${deck.id})" ${!hasCards ? 'disabled' : ''} title="${hasCards ? 'Comenzar a estudiar' : 'Agrega tarjetas primero para estudiar'}">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                                Estudiar
                            </button>
                            <button class="btn-deck-icon" onclick="openEditDeckModal(${deck.id}, event)" title="Editar mazo">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                            </button>
                            <button class="btn-deck-icon" onclick="handleExportDeck(${deck.id}, event)" title="Exportar mazo (JSON)">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M10 16l4-4-4-4M14 16V4"/></svg>
                            </button>
                            <button class="btn-deck-icon" onclick="openManageSection(${deck.id}, '${escapeJs(deck.nombre)}')" title="Gestionar tarjetas">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10"/></svg>
                            </button>
                            <button class="btn-deck-icon delete-btn" onclick="handleDeleteDeck(${deck.id})" title="Eliminar mazo">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/></svg>
                            </button>
                        </div>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;

        // Añadir efecto de brillo en movimiento del ratón
        const cards = container.querySelectorAll('.deck-card');
        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            });
        });
    }

    function handleDeckSelectCategoryChange() {
        const select = document.getElementById('deck-select-category');
        const wrapper = document.getElementById('new-category-input-wrapper');
        const input = document.getElementById('deck-input-category');
        if (select && wrapper && input) {
            if (select.value === '__NEW__') {
                wrapper.style.display = 'block';
                input.focus();
            } else {
                wrapper.style.display = 'none';
                input.value = '';
            }
        }
    }

    // Modal de mazo
    function openCreateDeckModal() {
        document.getElementById('deck-edit-id').value = '';
        document.getElementById('deck-input-name').value = '';
        document.getElementById('deck-input-desc').value = '';
        document.getElementById('deck-input-category').value = '';
        
        const select = document.getElementById('deck-select-category');
        if (select) select.value = 'General';
        const wrapper = document.getElementById('new-category-input-wrapper');
        if (wrapper) wrapper.style.display = 'none';

        document.getElementById('deck-modal-title-text').innerText = 'Nuevo Mazo de Estudio';
        document.getElementById('btn-deck-submit').innerText = 'Crear Mazo';
        document.getElementById('create-deck-modal').classList.add('open');
    }

    function openCreateDeckModalForMateria(materiaNombre) {
        openCreateDeckModal();
        const select = document.getElementById('deck-select-category');
        if (select && select.querySelector(`option[value="${CSS.escape(materiaNombre)}"]`)) {
            select.value = materiaNombre;
            handleDeckSelectCategoryChange();
        }
    }

    function openEditDeckModal(deckId, event) {
        event.stopPropagation();
        const deck = currentDecks.find(d => d.id === deckId);
        if (!deck) return;

        document.getElementById('deck-edit-id').value = deckId;
        document.getElementById('deck-input-name').value = deck.nombre;
        document.getElementById('deck-input-desc').value = deck.descripcion || '';
        
        const select = document.getElementById('deck-select-category');
        const wrapper = document.getElementById('new-category-input-wrapper');
        
        if (select) {
            const cat = deck.categoria || 'General';
            const hasOption = Array.from(select.options).some(opt => opt.value === cat);
            if (hasOption) {
                select.value = cat;
                if (wrapper) wrapper.style.display = 'none';
            } else {
                const opt = document.createElement('option');
                opt.value = cat;
                opt.innerText = cat;
                select.insertBefore(opt, select.querySelector('option[value="__NEW__"]'));
                select.value = cat;
                if (wrapper) wrapper.style.display = 'none';
            }
        }
        document.getElementById('deck-input-category').value = '';
        
        document.getElementById('deck-modal-title-text').innerText = 'Editar Mazo de Estudio';
        document.getElementById('btn-deck-submit').innerText = 'Guardar Cambios';

        // Seleccionar color
        const picker = document.getElementById('color-picker-grid');
        picker.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
        const colorOpt = picker.querySelector(`.color-option[data-color="${deck.color || 'indigo'}"]`);
        if (colorOpt) colorOpt.classList.add('selected');

        document.getElementById('create-deck-modal').classList.add('open');
    }

    function closeCreateDeckModal() {
        document.getElementById('create-deck-modal').classList.remove('open');
        document.getElementById('create-deck-form').reset();
        document.getElementById('deck-input-category').value = '';
        const select = document.getElementById('deck-select-category');
        if (select) select.value = 'General';
        const wrapper = document.getElementById('new-category-input-wrapper');
        if (wrapper) wrapper.style.display = 'none';
        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
        document.querySelector('.color-option[data-color="indigo"]').classList.add('selected');
    }

    function closeCreateDeckModalOnOverlay(event) {
        if (event.target === document.getElementById('create-deck-modal')) {
            closeCreateDeckModal();
        }
    }

    function initColorPicker() {
        const picker = document.getElementById('color-picker-grid');
        picker.addEventListener('click', (e) => {
            const option = e.target.closest('.color-option');
            if (!option) return;
            picker.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
        });
    }

    async function handleCreateDeck(event) {
        event.preventDefault();
        const deckId = document.getElementById('deck-edit-id').value;
        const nombreInput = document.getElementById('deck-input-name');
        const descInput = document.getElementById('deck-input-desc');
        const selectVal = document.getElementById('deck-select-category').value;
        const categoriaInput = document.getElementById('deck-input-category');
        let category = null;
        if (selectVal === '__NEW__') {
            category = categoriaInput.value.trim() || null;
        } else if (selectVal !== 'General') {
            category = selectVal;
        }

        const selectedColorOpt = document.querySelector('.color-option.selected');
        const color = selectedColorOpt ? selectedColorOpt.getAttribute('data-color') : 'indigo';

        const saveBtn = document.getElementById('btn-deck-submit');
        const originalText = saveBtn.innerText;
        saveBtn.disabled = true;
        saveBtn.innerText = deckId ? 'Guardando...' : 'Creando...';

        const url = deckId ? `/api/flashcards/decks/${deckId}` : '/api/flashcards/decks';
        const method = deckId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: getApiHeaders(),
                body: JSON.stringify({
                    nombre: nombreInput.value.trim(),
                    descripcion: descInput.value.trim() || null,
                    color: color,
                    categoria: category
                })
            });

            if (!response.ok) throw new Error('Error al procesar mazo');

            const createdOrUpdatedDeck = await response.json();

            closeCreateDeckModal();
            await loadDecks();

            // Si es la creación de un nuevo mazo, redirigir directamente a la pantalla de gestión de tarjetas
            if (method === 'POST') {
                openManageSection(createdOrUpdatedDeck.id, createdOrUpdatedDeck.nombre);
            }
        } catch (error) {
            console.error(error);
            showToast('No se pudo procesar el mazo. Intente de nuevo.', 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerText = originalText;
        }
    }

    async function handleDeleteDeck(deckId) {
        const confirmed = await showCustomConfirm({
            title: '¿Eliminar mazo?',
            message: '¿Estás seguro de que quieres eliminar este mazo? Se eliminarán también todas sus tarjetas asociadas. Esta acción no se puede deshacer.',
            acceptText: 'Eliminar',
            cancelText: 'Cancelar',
            isDestructive: true
        });
        if (!confirmed) return;

        try {
            const response = await fetch(`/api/flashcards/decks/${deckId}`, {
                method: 'DELETE',
                headers: getApiHeaders()
            });

            if (!response.ok) throw new Error('Error al eliminar mazo');
            await loadDecks();
            showToast('Mazo eliminado con éxito.', 'success');
        } catch (error) {
            console.error(error);
            showToast('No se pudo eliminar el mazo. Intente de nuevo.', 'error');
        }
    }

    // ==========================================================================
    // LÓGICA DE ESTUDIO ACTIVO (3D FLIP CARD CAROUSEL & EXAMEN)
    // ==========================================================================
    function startStudySession(deckId) {
        selectedDeckIdForStudy = deckId;
        
        // Restablecer la selección del modo de estudio a "all" al abrir el modal
        const rAll = document.querySelector('input[name="study-mode-choice"][value="all"]');
        if (rAll) {
            rAll.checked = true;
            // Disparar el evento change manualmente para actualizar la UI y ocultar el selector de cantidad
            rAll.dispatchEvent(new Event('change'));
        }
        
        document.getElementById('study-mode-modal').classList.add('open');
    }

    function closeStudyModeModal() {
        document.getElementById('study-mode-modal').classList.remove('open');
    }

    function closeStudyModeModalOnOverlay(event) {
        if (event.target === document.getElementById('study-mode-modal')) {
            closeStudyModeModal();
        }
    }

    function initStudyModeSelector() {
        const rAll = document.querySelector('input[name="study-mode-choice"][value="all"]');
        const rExam = document.querySelector('input[name="study-mode-choice"][value="exam"]');
        const lblAll = document.getElementById('label-mode-all');
        const lblExam = document.getElementById('label-mode-exam');

        const updateUI = (selected, mode) => {
            [lblAll, lblExam].forEach(lbl => {
                if (lbl) {
                    lbl.style.background = 'transparent';
                    lbl.style.borderColor = 'var(--border)';
                }
            });
            if (selected) {
                selected.style.background = 'var(--border-light)';
                selected.style.borderColor = 'var(--brand)';
            }
            
            const examQtyWrapper = document.getElementById('exam-quantity-wrapper');
            if (examQtyWrapper) {
                if (mode === 'exam') {
                    examQtyWrapper.style.display = 'block';
                } else {
                    examQtyWrapper.style.display = 'none';
                }
            }
        };

        if(rAll) rAll.addEventListener('change', () => updateUI(lblAll, 'all'));
        if(rExam) rExam.addEventListener('change', () => updateUI(lblExam, 'exam'));
    }

    async function confirmStudySessionStart() {
        const choice = document.querySelector('input[name="study-mode-choice"]:checked').value;
        currentStudyMode = choice;
        closeStudyModeModal();
        
        const deckId = selectedDeckIdForStudy;

        try {
            const response = await fetch(`/api/flashcards/decks/${deckId}/cards`, {
                method: 'GET',
                headers: getApiHeaders()
            });

            if (!response.ok) throw new Error('No se pudieron obtener las tarjetas del mazo');

            let cards = await response.json();
            if (cards.length === 0) {
                showToast('Este mazo no tiene tarjetas para estudiar.', 'error');
                return;
            }

            currentStudyDeck = currentDecks.find(d => d.id === deckId);
            masterSessionCards = cards; // Guardar copia maestra para distractores
            
            if (currentStudyMode === 'exam') {
                cards = shuffleArray(cards);
                const limitSelect = document.getElementById('exam-question-count');
                if (limitSelect && limitSelect.value !== 'all') {
                    const limit = parseInt(limitSelect.value, 10);
                    if (!isNaN(limit)) {
                        cards = cards.slice(0, limit);
                    }
                }
            } else {
                cards = shuffleArray(cards);
            }

            currentStudyCards = cards;
            currentStudyIndex = 0;
            currentSessionCorrect = 0;
            currentSessionIncorrect = 0;

            showStudyCard(currentStudyIndex);
            
            // Transición visual
            sectionDecks.style.display = 'none';
            sectionStudy.style.display = 'block';

            if (currentStudyMode !== 'exam') {
                enableKeyboardShortcuts();
            } else {
                disableKeyboardShortcuts();
            }
        } catch (error) {
            console.error(error);
            showToast('Error al iniciar sesión de estudio.', 'error');
        }
    }

    function showStudyCard(index) {
        const card = currentStudyCards[index];
        
        if (currentStudyMode === 'exam') {
            // Modo Examen
            document.getElementById('card-mode-wrapper').style.display = 'none';
            document.getElementById('exam-mode-wrapper').style.display = 'block';
            document.getElementById('study-controls').style.display = 'none';
            document.getElementById('flip-hint-message').style.display = 'none';

            // Cargar datos del examen
            const qExamText = document.getElementById('exam-question-text');
            qExamText.innerHTML = parseCardText(card.pregunta);

            if (window.renderMathInElement) {
                window.renderMathInElement(qExamText, {
                    delimiters: [
                        {left: "$$", right: "$$", display: true},
                        {left: "$", right: "$", display: false}
                    ],
                    throwOnError: false
                });
            }

            // Ocultar botón continuar
            document.getElementById('exam-next-action-wrapper').style.display = 'none';

            // Construir opciones de respuesta (Correcta + distractores)
            const correctAnswer = card.respuesta;
            let options = [];

            if (card.distractor_1) {
                // Usar distractores de alta calidad generados por la IA y guardados en la DB
                options = [
                    correctAnswer,
                    card.distractor_1,
                    card.distractor_2,
                    card.distractor_3
                ];
            } else {
                // Fallback: extraer distractores al azar de otras tarjetas del mismo mazo (mazos manuales o antiguos)
                const distractors = masterSessionCards
                    .filter(c => c.id !== card.id)
                    .map(c => c.respuesta);
                
                const shuffledDistractors = shuffleArray(distractors).slice(0, 3);
                options = [correctAnswer, ...shuffledDistractors];
            }
            
            // Barajar todas las opciones finales
            options = shuffleArray(options);

            // Pintar botones de opciones
            const grid = document.getElementById('exam-options-grid');
            grid.innerHTML = '';

            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'btn-exam-option';
                btn.innerHTML = parseCardText(opt);
                
                if (window.renderMathInElement) {
                    window.renderMathInElement(btn, {
                        delimiters: [
                            {left: "$$", right: "$$", display: true},
                            {left: "$", right: "$", display: false}
                        ],
                        throwOnError: false
                    });
                }

                btn.onclick = () => selectExamOption(btn, opt, correctAnswer, card.id);
                grid.appendChild(btn);
            });

        } else {
            // Modo Tarjetas 3D
            document.getElementById('card-mode-wrapper').style.display = 'block';
            document.getElementById('exam-mode-wrapper').style.display = 'none';
            document.getElementById('study-controls').style.display = 'flex';
            document.getElementById('flip-hint-message').style.display = 'block';

            const flipCard = document.getElementById('flip-card');
            flipCard.classList.remove('flipped');
            flipCard.classList.remove('shake-incorrect');

            const qTextEl = document.getElementById('card-question-text');
            const aTextEl = document.getElementById('card-answer-text');

            qTextEl.innerHTML = parseCardText(card.pregunta);
            aTextEl.innerHTML = parseCardText(card.respuesta);

            if (window.renderMathInElement) {
                window.renderMathInElement(qTextEl, {
                    delimiters: [
                        {left: "$$", right: "$$", display: true},
                        {left: "$", right: "$", display: false}
                    ],
                    throwOnError: false
                });
                window.renderMathInElement(aTextEl, {
                    delimiters: [
                        {left: "$$", right: "$$", display: true},
                        {left: "$", right: "$", display: false}
                    ],
                    throwOnError: false
                });
            }


            const totalAttempts = (card.correctas || 0) + (card.incorrectas || 0);
            const accuracy = totalAttempts > 0 ? Math.round((card.correctas / totalAttempts) * 100) : null;
            let cardStatsText = 'Sin repaso previo';
            if (accuracy !== null) {
                cardStatsText = `Historial: 🟢 ${card.correctas} | 🔴 ${card.incorrectas} (${accuracy}% aciertos)`;
            }
            document.getElementById('card-study-stats').innerText = cardStatsText;

            document.getElementById('study-controls').classList.remove('visible');
            document.getElementById('flip-hint-message').classList.remove('hidden');
        }

        // Actualizar barra de progreso superior
        const progressPercent = (index / currentStudyCards.length) * 100;
        document.getElementById('study-progress-bar').style.width = `${progressPercent}%`;
        document.getElementById('study-progress-text').innerText = `Tarjeta ${index + 1} de ${currentStudyCards.length}`;
    }

    function flipStudyCard() {
        if (currentStudyMode === 'exam') return;
        const flipCard = document.getElementById('flip-card');
        flipCard.classList.toggle('flipped');

        const flipped = flipCard.classList.contains('flipped');
        if (flipped) {
            document.getElementById('study-controls').classList.add('visible');
            document.getElementById('flip-hint-message').classList.add('hidden');
        } else {
            document.getElementById('study-controls').classList.remove('visible');
            document.getElementById('flip-hint-message').classList.remove('hidden');
        }
    }

    // Selección en Modo Examen (Múltiple Opción)
    function selectExamOption(selectedBtn, chosenAnswer, correctAnswer, cardId) {
        const grid = document.getElementById('exam-options-grid');
        const buttons = grid.querySelectorAll('.btn-exam-option');
        
        // Desactivar todos los botones de opciones
        buttons.forEach(btn => btn.disabled = true);

        if (chosenAnswer === correctAnswer) {
            selectedBtn.classList.add('option-correct');
            currentSessionCorrect++;
            submitCardResultBackground(cardId, 'correcto');
        } else {
            selectedBtn.classList.add('option-incorrect');
            currentSessionIncorrect++;
            submitCardResultBackground(cardId, 'incorrecto');

            // Resaltar la opción correcta en verde
            buttons.forEach(btn => {
                // Comparamos el contenido de texto ignorando KaTeX markup
                if (btn.innerText.trim() === correctAnswer.trim() || btn.textContent.trim() === correctAnswer.trim()) {
                    btn.classList.add('option-correct');
                }
            });
        }

        // Mostrar botón de continuar
        document.getElementById('exam-next-action-wrapper').style.display = 'flex';
    }

    function submitCardResultBackground(cardId, outcome) {
        try {
            fetch(`/api/flashcards/cards/${cardId}/resultado`, {
                method: 'POST',
                headers: getApiHeaders(),
                body: JSON.stringify({ resultado: outcome })
            });
        } catch (err) {
            console.error('Error al reportar resultado:', err);
        }
    }

    function proceedToNextExamCard() {
        currentStudyIndex++;
        if (currentStudyIndex < currentStudyCards.length) {
            showStudyCard(currentStudyIndex);
        } else {
            document.getElementById('study-progress-bar').style.width = '100%';
            showSummarySession();
        }
    }

    async function submitCardResult(outcome) {
        const card = currentStudyCards[currentStudyIndex];
        
        if (outcome === 'correcto') {
            currentSessionCorrect++;
        } else {
            currentSessionIncorrect++;
            const flipCard = document.getElementById('flip-card');
            flipCard.classList.add('shake-incorrect');
            setTimeout(() => {
                flipCard.classList.remove('shake-incorrect');
            }, 400);
        }

        // Guardar resultado
        try {
            fetch(`/api/flashcards/cards/${card.id}/resultado`, {
                method: 'POST',
                headers: getApiHeaders(),
                body: JSON.stringify({ resultado: outcome })
            });
        } catch (err) {
            console.error('Error al guardar:', err);
        }

        const nextIndex = currentStudyIndex + 1;
        const delay = outcome === 'incorrecto' ? 400 : 0;

        setTimeout(() => {
            if (nextIndex < currentStudyCards.length) {
                currentStudyIndex = nextIndex;
                showStudyCard(currentStudyIndex);
            } else {
                document.getElementById('study-progress-bar').style.width = '100%';
                showSummarySession();
            }
        }, delay + 100);
    }

    function triggerConfettiCelebration() {
        if (typeof window.animacionesHabilitadas === 'function' && !window.animacionesHabilitadas()) {
            return;
        }
        if (typeof confetti === 'undefined') return;

        const duration = 3.5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1100 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            // Efecto fuegos artificiales cruzados
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    }

    function showSummarySession() {
        disableKeyboardShortcuts();
        sectionStudy.style.display = 'none';
        sectionSummary.style.display = 'block';

        document.getElementById('summary-stat-correct').innerText = currentSessionCorrect;
        document.getElementById('summary-stat-incorrect').innerText = currentSessionIncorrect;
        document.getElementById('summary-stat-total').innerText = currentStudyCards.length;

        const total = currentStudyCards.length;
        const accuracyPercent = Math.round((currentSessionCorrect / total) * 100);
        document.getElementById('summary-percentage-text').innerText = `${accuracyPercent}%`;

        const radius = 60;
        const circumference = 2 * Math.PI * radius; // 377
        const offset = circumference - (accuracyPercent / 100) * circumference;
        const fgCircle = document.getElementById('summary-circle-progress');
        fgCircle.style.strokeDashoffset = offset;

        const feedbackText = document.getElementById('summary-feedback-text');
        const feedbackBox = document.getElementById('summary-feedback-box');
        if (accuracyPercent === 100) {
            feedbackText.innerText = '¡Increíble! Has dominado el 100% de este mazo. ¡Excelente retención!';
            feedbackBox.style.background = 'rgba(5, 150, 105, 0.1)';
            feedbackBox.style.borderColor = 'rgba(5, 150, 105, 0.3)';
        } else if (accuracyPercent >= 70) {
            feedbackText.innerText = '¡Muy buen rendimiento! Tienes claros la mayoría de los conceptos. Dale un repaso extra para la perfección.';
            feedbackBox.style.background = 'rgba(99, 102, 241, 0.1)';
            feedbackBox.style.borderColor = 'rgba(99, 102, 241, 0.3)';
        } else {
            feedbackText.innerText = 'Sigue repasando este mazo. La repetición espaciada te ayudará a consolidar estos temas complejos.';
            feedbackBox.style.background = 'rgba(217, 119, 6, 0.1)';
            feedbackBox.style.borderColor = 'rgba(217, 119, 6, 0.3)';
        }
        
        // Lanzar confeti si el resultado es alto
        if (accuracyPercent >= 75) {
            triggerConfettiCelebration();
        }
    }

    function restartStudySession() {
        sectionSummary.style.display = 'none';
        
        currentStudyCards = shuffleArray(currentStudyCards);

        currentStudyIndex = 0;
        currentSessionCorrect = 0;
        currentSessionIncorrect = 0;

        showStudyCard(currentStudyIndex);
        sectionStudy.style.display = 'block';
        
        if (currentStudyMode !== 'exam') {
            enableKeyboardShortcuts();
        }
    }

    async function exitStudySession() {
        const confirmed = await showCustomConfirm({
            title: '¿Salir del estudio?',
            message: '¿Estás seguro de que deseas salir del estudio activo? El progreso no guardado de esta sesión se perderá.',
            acceptText: 'Salir',
            cancelText: 'Cancelar',
            isDestructive: true
        });
        if (confirmed) {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            disableKeyboardShortcuts();
            sectionStudy.style.display = 'none';
            sectionDecks.style.display = 'block';
            loadDecks();
        }
    }

    function exitSummaryToDecks() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        sectionSummary.style.display = 'none';
        sectionDecks.style.display = 'block';
        loadDecks();
    }

    // ==========================================================================
    // LÓGICA DE IMPORTACIÓN Y EXPORTACIÓN JSON
    // ==========================================================================
    function triggerImportSelector() {
        document.getElementById('import-deck-file-input').click();
    }

    async function handleImportDeckFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const data = JSON.parse(e.target.result);
                if (!data.nombre || !data.cards || !Array.isArray(data.cards)) {
                    showToast('El archivo JSON no tiene el formato de mazo compatible con Cursus.', 'error');
                    return;
                }

                const response = await fetch('/api/flashcards/decks/import', {
                    method: 'POST',
                    headers: getApiHeaders(),
                    body: JSON.stringify(data)
                });

                if (!response.ok) throw new Error('Error al importar');

                showToast('Mazo importado con éxito. ✨', 'success');
                loadDecks();
            } catch (err) {
                console.error(err);
                showToast('No se pudo leer o importar el archivo JSON. Verifica su estructura.', 'error');
            } finally {
                event.target.value = '';
            }
        };
        reader.readAsText(file);
    }

    async function handleExportDeck(deckId, event) {
        event.stopPropagation();
        const deck = currentDecks.find(d => d.id === deckId);
        if (!deck) return;

        try {
            const response = await fetch(`/api/flashcards/decks/${deckId}/cards`, {
                method: 'GET',
                headers: getApiHeaders()
            });

            if (!response.ok) throw new Error('Error al obtener tarjetas');

            const cards = await response.json();
            const exportData = {
                nombre: deck.nombre,
                descripcion: deck.descripcion,
                color: deck.color,
                categoria: deck.categoria,
                cards: cards.map(c => ({
                    pregunta: c.pregunta,
                    respuesta: c.respuesta,
                    distractor_1: c.distractor_1,
                    distractor_2: c.distractor_2,
                    distractor_3: c.distractor_3
                }))
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mazo-${deck.nombre.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Mazo exportado con éxito. ✨', 'success');
        } catch (err) {
            console.error(err);
            showToast('Error al exportar el mazo.', 'error');
        }
    }

    // ==========================================================================
    // LÓGICA DE GESTIÓN DE TARJETAS (MANAGE DECK)
    // ==========================================================================
    let manageDeckId = null;

    async function openManageSection(deckId, deckName) {
        manageDeckId = deckId;
        document.getElementById('manage-deck-name').innerText = `Gestionar Mazo: ${deckName}`;
        
        sectionDecks.style.display = 'none';
        sectionManage.style.display = 'block';

        await loadManageCards();
    }

    async function loadManageCards() {
        const container = document.getElementById('manage-cards-list');
        container.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--t3);">Cargando tarjetas del mazo...</div>';

        try {
            const response = await fetch(`/api/flashcards/decks/${manageDeckId}/cards`, {
                method: 'GET',
                headers: getApiHeaders()
            });

            if (!response.ok) throw new Error('Error al obtener tarjetas');

            const cards = await response.json();
            document.getElementById('manage-cards-count').innerText = cards.length;
            renderManageCards(cards);
        } catch (error) {
            console.error(error);
            container.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--red);">Error al cargar tarjetas.</div>';
        }
    }

    function renderManageCards(cards) {
        const container = document.getElementById('manage-cards-list');
        if (cards.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--t3); border: 2px dashed var(--border); border-radius: var(--r);">
                    Este mazo no tiene tarjetas añadidas aún. ¡Crea una en el formulario de la izquierda!
                </div>
            `;
            return;
        }

        let html = '';
        cards.forEach(card => {
            const totalAttempts = card.correctas + card.incorrectas;
            const accuracy = totalAttempts > 0 ? Math.round((card.correctas / totalAttempts) * 100) : null;
            let statsHtml = `<span style="font-size:0.75rem; color:var(--t3);">Sin repasos aún</span>`;
            if (accuracy !== null) {
                statsHtml = `<span style="font-size:0.75rem; font-weight:600; color:${accuracy >= 75 ? 'var(--green)' : accuracy >= 50 ? 'var(--yellow)' : 'var(--red)'};">
                    Acierto: ${accuracy}% (🟢 ${card.correctas} | 🔴 ${card.incorrectas}) • Caja: ${card.caja || 1}
                </span>`;
            }

            html += `
                <div class="card-list-item" id="card-item-${card.id}">
                    <div class="card-item-qa" id="card-display-${card.id}">
                        <div class="qa-block">
                            <div class="qa-label">Pregunta (Frente)</div>
                            <div class="qa-content">${escapeHtml(card.pregunta)}</div>
                        </div>
                        <div class="qa-block">
                            <div class="qa-label">Respuesta (Reverso)</div>
                            <div class="qa-content">${escapeHtml(card.respuesta)}</div>
                        </div>
                        <div style="margin-top:0.4rem; display:flex; align-items:center; gap:0.5rem;">
                            ${statsHtml}
                        </div>
                        <div class="card-item-actions">
                            <button class="btn-deck-icon" onclick="startEditCard(${card.id})" title="Editar tarjeta">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                            </button>
                            <button class="btn-deck-icon delete-btn" onclick="handleDeleteCard(${card.id})" title="Eliminar tarjeta">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/></svg>
                            </button>
                        </div>
                    </div>
                    <div class="card-edit-form" id="card-edit-form-${card.id}" style="display:none;">
                        <div class="form-group" style="margin-bottom: 0.5rem;">
                            <label>Pregunta (Frente)</label>
                            <textarea id="edit-textarea-q-${card.id}" class="fc-input fc-textarea" style="min-height:50px;" required>${escapeHtml(card.pregunta)}</textarea>
                        </div>
                        <div class="form-group" style="margin-bottom: 0.5rem;">
                            <label>Respuesta (Reverso)</label>
                            <textarea id="edit-textarea-a-${card.id}" class="fc-input fc-textarea" style="min-height:50px;" required>${escapeHtml(card.respuesta)}</textarea>
                        </div>
                        <div style="margin-top: 0.75rem; border-top: 1px solid var(--border); padding-top: 0.75rem;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
                                <span style="font-size:0.8rem; font-weight:600; color:var(--t2);">Opciones incorrectas (Opcional)</span>
                                <button type="button" id="btn-edit-suggest-${card.id}" onclick="handleEditSuggestDistractors(${card.id})" style="background:var(--border-light); border:1px solid var(--border); border-radius:4px; padding:0.15rem 0.4rem; font-size:0.7rem; font-weight:600; color:var(--brand); cursor:pointer; display:flex; align-items:center; gap:0.2rem; transition:all 0.2s;">
                                    <span>Sugerir con IA ✨</span>
                                </button>
                            </div>
                            <input type="text" id="edit-input-d1-${card.id}" class="fc-input" placeholder="Opción incorrecta 1" value="${escapeHtml(card.distractor_1 || '')}" style="font-size:0.75rem; padding:0.4rem; margin-bottom:0.4rem; width:100%;">
                            <input type="text" id="edit-input-d2-${card.id}" class="fc-input" placeholder="Opción incorrecta 2" value="${escapeHtml(card.distractor_2 || '')}" style="font-size:0.75rem; padding:0.4rem; margin-bottom:0.4rem; width:100%;">
                            <input type="text" id="edit-input-d3-${card.id}" class="fc-input" placeholder="Opción incorrecta 3" value="${escapeHtml(card.distractor_3 || '')}" style="font-size:0.75rem; padding:0.4rem; width:100%;">
                        </div>
                        <div class="card-edit-actions" style="margin-top: 0.75rem;">
                            <button class="btn-card-cancel" onclick="cancelEditCard(${card.id})">Cancelar</button>
                            <button class="btn-card-save" onclick="saveEditCard(${card.id})">Guardar</button>
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;

        // Renderizar ecuaciones KaTeX sobre la lista de gestión
        if (window.renderMathInElement) {
            window.renderMathInElement(container, {
                delimiters: [
                    {left: "$$", right: "$$", display: true},
                    {left: "$", right: "$", display: false}
                ],
                throwOnError: false
            });
        }
    }

    function startEditCard(cardId) {
        if (editingCardId !== null) {
            cancelEditCard(editingCardId);
        }
        editingCardId = cardId;
        document.getElementById(`card-display-${cardId}`).style.display = 'none';
        document.getElementById(`card-edit-form-${cardId}`).style.display = 'block';
    }

    function cancelEditCard(cardId) {
        editingCardId = null;
        document.getElementById(`card-display-${cardId}`).style.display = 'block';
        document.getElementById(`card-edit-form-${cardId}`).style.display = 'none';
    }

    async function handleSuggestDistractors() {
        const qVal = document.getElementById('card-input-question').value.trim();
        const aVal = document.getElementById('card-input-answer').value.trim();
        
        if (!qVal || !aVal) {
            showToast('Por favor, escribe la Pregunta y la Respuesta primero.', 'error');
            return;
        }

        const btn = document.getElementById('btn-suggest-distractors');
        const originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span>Generando... ⏳</span>';

        try {
            const currentDeck = currentDecks.find(d => d.id === manageDeckId);
            const category = currentDeck ? currentDeck.categoria : 'General';

            const response = await fetch('/api/flashcards/cards/generate-distractors', {
                method: 'POST',
                headers: getApiHeaders(),
                body: JSON.stringify({
                    pregunta: qVal,
                    respuesta: aVal,
                    categoria: category
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Error al generar distractores.');
            }

            const data = await response.json();
            document.getElementById('card-input-d1').value = data.distractor_1 || '';
            document.getElementById('card-input-d2').value = data.distractor_2 || '';
            document.getElementById('card-input-d3').value = data.distractor_3 || '';
            showToast('¡Opciones incorrectas sugeridas con éxito! ✨', 'success');

        } catch (error) {
            console.error(error);
            showToast('No se pudieron generar las opciones con IA. Inténtalo de nuevo.', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
        }
    }

    async function handleEditSuggestDistractors(cardId) {
        const qVal = document.getElementById(`edit-textarea-q-${cardId}`).value.trim();
        const aVal = document.getElementById(`edit-textarea-a-${cardId}`).value.trim();
        
        if (!qVal || !aVal) {
            showToast('Por favor, escribe la Pregunta y la Respuesta primero.', 'error');
            return;
        }

        const btn = document.getElementById(`btn-edit-suggest-${cardId}`);
        const originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span>Generando... ⏳</span>';

        try {
            const currentDeck = currentDecks.find(d => d.id === manageDeckId);
            const category = currentDeck ? currentDeck.categoria : 'General';

            const response = await fetch('/api/flashcards/cards/generate-distractors', {
                method: 'POST',
                headers: getApiHeaders(),
                body: JSON.stringify({
                    pregunta: qVal,
                    respuesta: aVal,
                    categoria: category
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Error al generar distractores.');
            }

            const data = await response.json();
            document.getElementById(`edit-input-d1-${cardId}`).value = data.distractor_1 || '';
            document.getElementById(`edit-input-d2-${cardId}`).value = data.distractor_2 || '';
            document.getElementById(`edit-input-d3-${cardId}`).value = data.distractor_3 || '';
            showToast('¡Opciones incorrectas sugeridas con éxito! ✨', 'success');

        } catch (error) {
            console.error(error);
            showToast('No se pudieron generar las opciones con IA. Inténtalo de nuevo.', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
        }
    }

    async function saveEditCard(cardId) {
        const pregunta = document.getElementById(`edit-textarea-q-${cardId}`).value.trim();
        const respuesta = document.getElementById(`edit-textarea-a-${cardId}`).value.trim();
        const dist1 = document.getElementById(`edit-input-d1-${cardId}`).value.trim() || null;
        const dist2 = document.getElementById(`edit-input-d2-${cardId}`).value.trim() || null;
        const dist3 = document.getElementById(`edit-input-d3-${cardId}`).value.trim() || null;
        
        if (!pregunta || !respuesta) {
            showToast('Ambos campos son requeridos', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/flashcards/cards/${cardId}`, {
                method: 'PUT',
                headers: getApiHeaders(),
                body: JSON.stringify({ 
                    pregunta, 
                    respuesta,
                    distractor_1: dist1,
                    distractor_2: dist2,
                    distractor_3: dist3
                })
            });

            if (!response.ok) throw new Error('Error al actualizar tarjeta');

            editingCardId = null;
            await loadManageCards();
            showToast('Tarjeta guardada con éxito.', 'success');
        } catch (error) {
            console.error(error);
            showToast('No se pudo guardar la tarjeta. Intente de nuevo.', 'error');
        }
    }

    async function handleCreateCard(event) {
        event.preventDefault();
        const preguntaInput = document.getElementById('card-input-question');
        const respuestaInput = document.getElementById('card-input-answer');
        const d1Input = document.getElementById('card-input-d1');
        const d2Input = document.getElementById('card-input-d2');
        const d3Input = document.getElementById('card-input-d3');
        const submitBtn = event.target.querySelector('.btn-add-card');

        submitBtn.disabled = true;
        submitBtn.innerText = 'Guardando...';

        try {
            const response = await fetch(`/api/flashcards/decks/${manageDeckId}/cards`, {
                method: 'POST',
                headers: getApiHeaders(),
                body: JSON.stringify({
                    pregunta: preguntaInput.value.trim(),
                    respuesta: respuestaInput.value.trim(),
                    distractor_1: d1Input.value.trim() || null,
                    distractor_2: d2Input.value.trim() || null,
                    distractor_3: d3Input.value.trim() || null
                })
            });

            if (!response.ok) throw new Error('Error al añadir tarjeta');

            preguntaInput.value = '';
            respuestaInput.value = '';
            d1Input.value = '';
            d2Input.value = '';
            d3Input.value = '';
            preguntaInput.focus();
            await loadManageCards();
            showToast('Tarjeta añadida con éxito.', 'success');
        } catch (error) {
            console.error(error);
            showToast('No se pudo guardar la tarjeta. Intente de nuevo.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = 'Guardar Tarjeta';
        }
    }

    async function handleDeleteCard(cardId) {
        const confirmed = await showCustomConfirm({
            title: '¿Eliminar tarjeta?',
            message: '¿Estás seguro de que quieres eliminar esta tarjeta? Esta acción no se puede deshacer.',
            acceptText: 'Eliminar',
            cancelText: 'Cancelar',
            isDestructive: true
        });
        if (!confirmed) return;

        try {
            const response = await fetch(`/api/flashcards/cards/${cardId}`, {
                method: 'DELETE',
                headers: getApiHeaders()
            });

            if (!response.ok) throw new Error('Error al eliminar tarjeta');
            await loadManageCards();
            showToast('Tarjeta eliminada con éxito.', 'success');
        } catch (error) {
            console.error(error);
            showToast('No se pudo eliminar la tarjeta. Intente de nuevo.', 'error');
        }
    }

    function exitManageSection() {
        sectionManage.style.display = 'none';
        sectionDecks.style.display = 'block';
        loadDecks();
    }


    // ==========================================================================
    // UTILS / HELPERS
    // ==========================================================================
    function shuffleArray(array) {
        let arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    function escapeJs(text) {
        if (!text) return '';
        return text.replace(/\\/g, '\\\\')
                   .replace(/'/g, "\\'")
                   .replace(/"/g, '\\"')
                   .replace(/\n/g, '\\n')
                   .replace(/\r/g, '\\r');
    }

    // Parsear Markdown (código, negrita, cursiva, listas) y saltos de línea
    function parseCardText(text) {
        if (!text) return '';
        let escaped = escapeHtml(text);
        
        // Bloques de código (multilínea) con look de terminal oscuro
        escaped = escaped.replace(/```(?:[a-zA-Z0-9]+)?\n([\s\S]*?)\n```/g, '<pre style="background:#0f172a; color:#e2e8f0; padding:0.75rem; border-radius:8px; overflow-x:auto; text-align:left; font-family:monospace; font-size:0.82rem; border:1px solid rgba(255,255,255,0.08); width:100%; white-space:pre-wrap; margin: 0.75rem 0; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);"><code>$1</code></pre>');
        
        // Código inline
        escaped = escaped.replace(/`([^`]+)`/g, '<code style="background:rgba(99,102,241,0.08); color:var(--brand); padding:0.15rem 0.35rem; border-radius:4px; font-family:monospace; font-size:0.85rem; border:1px solid var(--brand-dim); font-weight:600;">$1</code>');
        
        // Negrita (**texto**)
        escaped = escaped.replace(/\*\*([\s\S]*?)\*\*/g, '<strong style="font-weight:700;">$1</strong>');
        
        // Cursiva (*texto*)
        escaped = escaped.replace(/\*([\s\S]*?)\*/g, '<em style="font-style:italic;">$1</em>');
        
        // Listas con viñetas:
        // Procesar línea por línea para estructurar listas de forma semántica
        let lines = escaped.split('\n');
        let inList = false;
        let processedLines = [];
        
        lines.forEach(line => {
            let trimmed = line.trim();
            if (trimmed.startsWith('- ')) {
                if (!inList) {
                    processedLines.push('<ul style="text-align: left; margin: 0.5rem 0 0.5rem 1.5rem; list-style-type: disc; width: 100%;">');
                    inList = true;
                }
                processedLines.push('<li style="margin-bottom: 0.25rem; font-size: 0.95rem; line-height: 1.5; color: inherit;">' + trimmed.substring(2) + '</li>');
            } else {
                if (inList) {
                    processedLines.push('</ul>');
                    inList = false;
                }
                processedLines.push(line);
            }
        });
        if (inList) {
            processedLines.push('</ul>');
        }
        
        escaped = processedLines.join('\n');
        
        // Saltos de línea
        escaped = escaped.replace(/\n/g, '<br>');
        
        return escaped;
    }

    // Lógica Text-To-Speech (Lectura en Voz Alta)
    function speakCardText(event, elementId) {
        if (event) event.stopPropagation(); // Evitar que gire la tarjeta
        
        if (!('speechSynthesis' in window)) {
            showToast('Tu navegador no soporta síntesis de voz.', 'error');
            return;
        }
        
        window.speechSynthesis.cancel(); // Cancelar cualquier lectura activa
        
        const el = document.getElementById(elementId);
        if (!el) return;
        
        // Extraer texto plano libre de formato markdown
        let cleanText = el.innerText
            .replace(/```[\s\S]*?```/g, '') // Eliminar bloques de código
            .replace(/`([^`]+)`/g, '$1')     // Código inline a texto
            .replace(/\*\*([^*]+)\*\*/g, '$1') // Negrita a texto
            .replace(/\*([^*]+)\*/g, '$1')     // Cursiva a texto
            .replace(/[-*]\s+/g, '')          // Viñetas
            .trim();
            
        if (!cleanText) return;
        
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'es-ES'; // Configurar voz en Español
        
        // Intentar seleccionar la voz en español de mejor calidad
        const voices = window.speechSynthesis.getVoices();
        const esVoice = voices.find(v => v.lang.startsWith('es'));
        if (esVoice) utterance.voice = esVoice;
        
        window.speechSynthesis.speak(utterance);
    }

    function handleAIDeckSelectCategoryChange() {
        const select = document.getElementById('ai-deck-select-category');
        const wrapper = document.getElementById('ai-new-category-input-wrapper');
        const input = document.getElementById('ai-deck-input-category');
        if (select && wrapper && input) {
            if (select.value === '__NEW__') {
                wrapper.style.display = 'block';
                input.focus();
            } else {
                wrapper.style.display = 'none';
                input.value = '';
            }
        }
    }

    function openAIDeckModal() {
        const select = document.getElementById('ai-deck-select-category');
        if (select) select.value = '__AUTO__';
        const wrapper = document.getElementById('ai-new-category-input-wrapper');
        if (wrapper) wrapper.style.display = 'none';
        document.getElementById('ai-deck-input-category').value = '';

        document.getElementById('ai-deck-modal').classList.add('open');
    }

    // Modal de IA cerrar
    function closeAIDeckModal() {
        document.getElementById('ai-deck-modal').classList.remove('open');
        document.getElementById('ai-deck-form').reset();
        const select = document.getElementById('ai-deck-select-category');
        if (select) select.value = '__AUTO__';
        const wrapper = document.getElementById('ai-new-category-input-wrapper');
        if (wrapper) wrapper.style.display = 'none';
        document.getElementById('ai-deck-input-category').value = '';
    }

    function closeAIDeckModalOnOverlay(event) {
        if (event.target === document.getElementById('ai-deck-modal')) {
            closeAIDeckModal();
        }
    }

    async function handleAICreateDeck(event) {
        event.preventDefault();
        
        const fileInput = document.getElementById('ai-deck-file');
        if (!fileInput.files.length) {
            showToast('Por favor, selecciona un archivo.', 'error');
            return;
        }

        const file = fileInput.files[0];
        const formData = new FormData();
        formData.append('file', file);
        
        const countInput = document.getElementById('ai-deck-cards-count');
        if (countInput) {
            formData.append('cantidad', countInput.value);
        }

        const selectVal = document.getElementById('ai-deck-select-category').value;
        const newCatInput = document.getElementById('ai-deck-input-category');
        let category = '__AUTO__';
        if (selectVal === '__NEW__') {
            category = newCatInput.value.trim() || '__AUTO__';
        } else {
            category = selectVal;
        }
        formData.append('categoria', category);

        // Cerrar modal de carga de archivos y abrir overlay de progreso
        closeAIDeckModal();
        
        const loadingOverlay = document.getElementById('ai-loading-overlay');
        const loadingTitle = document.getElementById('ai-loading-title');
        const loadingText = document.getElementById('ai-loading-text');
        
        loadingOverlay.style.display = 'flex';
        setTimeout(() => {
            loadingOverlay.classList.add('open');
        }, 10);
        loadingTitle.textContent = 'Subiendo archivo...';
        loadingText.textContent = 'Tu documento se está cargando en el servidor local.';

        // Simular fases en la UI de carga para dar un look premium interactivo
        const phases = [
            { t: 1500, title: 'Procesando archivo...', text: 'Analizando el documento o imagen subida.' },
            { t: 4000, title: 'Analizando contenido...', text: 'La IA de Cursus está leyendo y estructurando los conceptos principales.' },
            { t: 8500, title: 'Diseñando flashcards...', text: 'Redactando las mejores preguntas y respuestas académicas para ti.' },
            { t: 13000, title: 'Finalizando creación...', text: 'Guardando el mazo en la base de datos de tu panel.' }
        ];

        const timers = [];
        phases.forEach(phase => {
            timers.push(setTimeout(() => {
                loadingTitle.textContent = phase.title;
                loadingText.textContent = phase.text;
            }, phase.t));
        });

        try {
            const headers = getApiHeaders();
            delete headers['Content-Type']; // Permitir al navegador añadir el boundary de FormData

            const response = await fetch('/api/flashcards/decks/generate-ia', {
                method: 'POST',
                headers: headers,
                body: formData
            });

            // Cancelar todos los timers de animación simulada
            timers.forEach(t => clearTimeout(t));

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Error en la generación con IA.');
            }

            const createdDeck = await response.json();
            
            showToast('¡Mazo generado con IA con éxito! ✨', 'success');
            
            // Recargar la lista y simular clic para estudiar
            await loadDecks();
            
            // Cerrar carga
            loadingOverlay.classList.remove('open');
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 250);

            // Preguntar si quiere estudiar de inmediato
            startStudySession(createdDeck.id);

        } catch (error) {
            timers.forEach(t => clearTimeout(t));
            loadingOverlay.classList.remove('open');
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 250);
            showToast(error.message || 'No se pudo generar el mazo.', 'error');
            openAIDeckModal(); // Volver a abrir el modal de subida si falla
        }
    }
</script>
@endpush
