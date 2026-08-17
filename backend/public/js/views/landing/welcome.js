/**
 * @fileoverview Módulo principal de interactividad de la landing page Welcome.
 * Gestiona el Mock Dashboard interactivo (tabs, Pomodoro demo, materias, alertas,
 * horarios) y el acordeón FAQ. Toda manipulación del DOM usa classList, no
 * mutaciones directas de `.style`. Los atributos ARIA se actualizan dinámicamente.
 *
 * Importa funciones compartidas de `./shared.js`.
 *
 * @module landing/welcome
 */

'use strict';

import { initLanding } from './shared.js';

/* ============================================================
   MOCK DASHBOARD — TABS
   ============================================================ */

/**
 * Inicializa el sistema de tabs del Mock Dashboard.
 * Usa atributos ARIA (role="tab", aria-selected, aria-controls) para
 * cumplir con el patrón de accesibilidad WAI-ARIA Tabs.
 * Muestra/oculta paneles con el atributo nativo `hidden`.
 *
 * @returns {void}
 */
function initMockTabs() {
    const tabs     = document.querySelectorAll('.mock-sb-item');
    const panels   = document.querySelectorAll('.mock-tab-panel');

    if (!tabs.length) return;

    /**
     * Activa un tab y muestra su panel correspondiente.
     * @param {HTMLElement} activeTab - El tab a activar.
     */
    function activateTab(activeTab) {
        const targetId = activeTab.getAttribute('data-mock-tab');

        tabs.forEach((tab) => {
            const isActive = tab === activeTab;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', String(isActive));
            tab.setAttribute('tabindex', isActive ? '0' : '-1');
        });

        panels.forEach((panel) => {
            const match = panel.id === `mock-tab-${targetId}`;
            panel.hidden = !match;
            panel.setAttribute('aria-hidden', String(!match));
        });
    }

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => activateTab(tab));

        // Navegación con teclado (←/→) siguiendo patrón WAI-ARIA Tabs
        tab.addEventListener('keydown', (e) => {
            const tabList = [...tabs];
            const idx     = tabList.indexOf(tab);
            if (e.key === 'ArrowDown' && tabList[idx + 1]) {
                e.preventDefault();
                tabList[idx + 1].focus();
                activateTab(tabList[idx + 1]);
            } else if (e.key === 'ArrowUp' && tabList[idx - 1]) {
                e.preventDefault();
                tabList[idx - 1].focus();
                activateTab(tabList[idx - 1]);
            }
        });
    });

    // Activar el primero por defecto
    if (tabs[0]) {
        activateTab(tabs[0]);
        // Inicializar el ancho de la barra de progreso (3 de 4 aprobadas = 75%)
        const dashBar = document.getElementById('mock-dash-progress-bar');
        if (dashBar) {
            dashBar.style.setProperty('width', '75%');
            dashBar.setAttribute('aria-valuenow', '75');
        }
        const dashPct = document.getElementById('mock-dash-progress-text');
        if (dashPct) dashPct.textContent = '75%';
        const dashAvg = document.getElementById('mock-dash-avg');
        if (dashAvg) {
            const avgEl = dashAvg.querySelector('[data-avg-value]');
            if (avgEl) avgEl.textContent = '9.00';
        }
    }
}

/* ============================================================
   MOCK DASHBOARD — MATERIAS
   ============================================================ */

/** @type {Object.<string, {approved: boolean, grade: number}>} */
const subjectsData = {
    prog1: { approved: true,  grade: 9  },
    lab1:  { approved: true,  grade: 10 },
    spd:   { approved: true,  grade: 8  },
    prog2: { approved: false, grade: 0  },
};

/**
 * Recalcula el promedio y porcentaje de progreso y actualiza los elementos del DOM.
 * No usa mutaciones de `.style`; solo actualiza `textContent` y la propiedad
 * CSS `width` del progress bar mediante `style.setProperty`.
 *
 * @returns {void}
 */
function recalculateMockAcademicState() {
    const subjects      = Object.values(subjectsData);
    const approved      = subjects.filter((s) => s.approved);
    const totalGrades   = approved.reduce((sum, s) => sum + s.grade, 0);
    const avg           = approved.length > 0 ? (totalGrades / approved.length).toFixed(2) : '0.00';
    const progress      = Math.round((approved.length / subjects.length) * 100);

    const subjectAvg    = document.getElementById('mock-subject-avg');
    const subjectPct    = document.getElementById('mock-subject-percent');
    const dashAvg       = document.getElementById('mock-dash-avg');
    const dashBar       = document.getElementById('mock-dash-progress-bar');
    const dashPct       = document.getElementById('mock-dash-progress-text');

    if (subjectAvg)  subjectAvg.textContent  = avg;
    if (subjectPct)  subjectPct.textContent  = `${progress}%`;
    if (dashAvg)     dashAvg.querySelector('[data-avg-value]').textContent = avg;
    if (dashBar) {
        dashBar.style.setProperty('width', `${progress}%`);
        dashBar.setAttribute('aria-valuenow', String(progress));
        dashBar.setAttribute('aria-label', `${progress}% de materias aprobadas`);
    }
    if (dashPct)     dashPct.textContent     = `${progress}%`;
}

/**
 * Inicializa las tarjetas de materias del Mock Dashboard.
 * Toggle de estado aprobado/cursando usando clases BEM en lugar de estilos inline.
 *
 * @returns {void}
 */
function initMockSubjectCards() {
    const cards = document.querySelectorAll('.mock-subject-card');
    if (!cards.length) return;

    cards.forEach((card) => {
        card.addEventListener('click', () => {
            const code   = card.getAttribute('data-subject');
            const data   = subjectsData[code];
            if (!data) return;

            const statusEl = card.querySelector('.mock-subject-card__status');

            if (data.approved) {
                data.approved = false;
                card.classList.remove('mock-subject-card--approved');
                if (statusEl) {
                    statusEl.textContent = 'Cursando';
                    statusEl.classList.add('mock-subject-card__status--cursando');
                }
            } else {
                data.approved = true;
                data.grade    = code === 'prog2' ? 10 : data.grade;
                card.classList.add('mock-subject-card--approved');
                if (statusEl) {
                    statusEl.textContent = `Aprobada (${data.grade})`;
                    statusEl.classList.remove('mock-subject-card__status--cursando');
                }
            }

            recalculateMockAcademicState();
        });
    });
}

/* ============================================================
   MOCK DASHBOARD — POMODORO DEMO
   ============================================================ */

/**
 * Inicializa el temporizador Pomodoro interactivo del Mock Dashboard.
 * Los estados (running/paused/done) se controlan con clases CSS en lugar
 * de mutar `.style.background` directamente.
 *
 * @returns {void}
 */
function initMockPomodoro() {
    const timerDisplay = document.getElementById('mock-pomo-timer');
    const playBtn      = document.getElementById('mock-pomo-play-btn');
    const resetBtn     = document.getElementById('mock-pomo-reset-btn');
    const descEl       = document.getElementById('mock-pomo-desc');
    const dashTimer    = document.getElementById('mock-dash-pomodoro-timer');
    const dashStatus   = document.getElementById('mock-dash-pomodoro-status');

    if (!playBtn) return;

    let secondsRemaining = 25 * 60;
    let isRunning        = false;
    let intervalId       = null;

    /**
     * Formatea los segundos restantes como `MM:SS` y actualiza los displays.
     * @returns {void}
     */
    function updateDisplay() {
        const mins = Math.floor(secondsRemaining / 60);
        const secs = secondsRemaining % 60;
        const str  = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        if (timerDisplay) timerDisplay.textContent = str;
        if (dashTimer)    dashTimer.textContent    = str;
    }

    /**
     * Aplica el estado de pausa a los elementos visuales usando clases CSS.
     * @returns {void}
     */
    function applyPausedState() {
        playBtn.textContent = 'Iniciar';
        playBtn.classList.remove('is-running');
        if (descEl)      descEl.textContent = 'Temporizador pausado.';
        if (dashStatus) {
            dashStatus.textContent = 'Pausado';
            dashStatus.classList.add('mock-widget__pomo-status--paused');
            dashStatus.classList.remove('mock-widget__pomo-status--done');
        }
    }

    /**
     * Aplica el estado de ejecución usando clases CSS.
     * @returns {void}
     */
    function applyRunningState() {
        playBtn.textContent = 'Pausar';
        playBtn.classList.add('is-running');
        if (descEl)      descEl.textContent = '¡Enfoque activo! Estudiando...';
        if (dashStatus) {
            dashStatus.textContent = 'Estudiando';
            dashStatus.classList.remove('mock-widget__pomo-status--paused', 'mock-widget__pomo-status--done');
        }
    }

    playBtn.addEventListener('click', () => {
        if (isRunning) {
            isRunning = false;
            clearInterval(intervalId);
            applyPausedState();
        } else {
            isRunning = true;
            applyRunningState();
            intervalId = setInterval(() => {
                if (secondsRemaining > 0) {
                    secondsRemaining--;
                    updateDisplay();
                } else {
                    clearInterval(intervalId);
                    isRunning        = false;
                    secondsRemaining = 25 * 60;
                    updateDisplay();
                    playBtn.textContent = 'Iniciar';
                    playBtn.classList.remove('is-running');
                    if (descEl)      descEl.textContent = '¡Sesión completada! Descansa 5 min.';
                    if (dashStatus) {
                        dashStatus.textContent = 'Terminado';
                        dashStatus.classList.add('mock-widget__pomo-status--done');
                        dashStatus.classList.remove('mock-widget__pomo-status--paused');
                    }
                }
            }, 1000);
        }
    });

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            isRunning        = false;
            clearInterval(intervalId);
            secondsRemaining = 25 * 60;
            updateDisplay();
            applyPausedState();
            if (descEl) descEl.textContent = 'Temporizador reiniciado.';
        });
    }
}

/* ============================================================
   MOCK DASHBOARD — ALERTAS (Pago de cuota)
   ============================================================ */

/**
 * Inicializa el botón de pago de cuota del Mock Dashboard.
 * Usa clases CSS para el estado pagado/pendiente, no mutaciones de `.style`.
 *
 * @returns {void}
 */
function initMockPayment() {
    const payBtn  = document.getElementById('mock-pay-btn');
    const card    = document.getElementById('mock-alert-payment-card');
    if (!payBtn) return;

    payBtn.addEventListener('click', () => {
        const isPaid = payBtn.classList.contains('is-paid');

        if (!isPaid) {
            payBtn.textContent = 'Pagada ✓';
            payBtn.classList.add('is-paid');
            card?.classList.add('is-paid');
            const descEl = card?.querySelector('.mock-alert-card__desc');
            if (descEl) descEl.textContent = 'Pagada exitosamente • $80.000';
        } else {
            payBtn.textContent = 'Pagar';
            payBtn.classList.remove('is-paid');
            card?.classList.remove('is-paid');
            const descEl = card?.querySelector('.mock-alert-card__desc');
            if (descEl) descEl.textContent = 'Vence en 5 días • $80.000';
        }
    });
}

/* ============================================================
   MOCK DASHBOARD — HORARIOS (Versiones A/B y Clash Resolver)
   ============================================================ */

/**
 * Construye y devuelve el HTML del horario para la Versión A (con solapamiento).
 * No usa inline styles; usa clases BEM.
 *
 * @returns {string} Markup HTML del horario versión A.
 */
function buildScheduleVerA() {
    return `
        <div class="mock-schedule-row">
            <span class="mock-schedule-row__day">Lunes</span>
            <div class="mock-schedule-row__content">
                <span class="mock-schedule-row__subject">
                    Programación II
                    <small class="mock-schedule-row__time">(18:30 - 22:30)</small>
                </span>
                <span id="mock-overlap-block" class="mock-overlap-tag">
                    ⚡ Solapamiento: Inglés I (Leandro)
                </span>
            </div>
        </div>
        <div class="mock-schedule-row">
            <span class="mock-schedule-row__day">Martes</span>
            <span class="mock-schedule-row__subject">
                Base de Datos I
                <small class="mock-schedule-row__time">(18:30 - 21:30)</small>
            </span>
        </div>
        <div class="mock-schedule-row">
            <span class="mock-schedule-row__day">Jueves</span>
            <span class="mock-schedule-row__subject">
                Prob. y Estadística
                <small class="mock-schedule-row__time">(18:30 - 21:30)</small>
            </span>
        </div>
    `;
}

/**
 * Construye y devuelve el HTML del horario para la Versión B (sin solapamiento).
 *
 * @returns {string} Markup HTML del horario versión B.
 */
function buildScheduleVerB() {
    return `
        <div class="mock-schedule-row">
            <span class="mock-schedule-row__day">Lunes</span>
            <span class="mock-schedule-row__subject">
                Programación II
                <small class="mock-schedule-row__time">(18:30 - 22:30)</small>
            </span>
        </div>
        <div class="mock-schedule-row">
            <span class="mock-schedule-row__day">Miércoles</span>
            <span class="mock-schedule-row__subject">
                Inglés I
                <small class="mock-schedule-row__time">(18:30 - 20:30)</small>
            </span>
        </div>
        <div class="mock-schedule-row">
            <span class="mock-schedule-row__day">Viernes</span>
            <span class="mock-schedule-row__subject">
                Metodología I
                <small class="mock-schedule-row__time">(18:30 - 21:30)</small>
            </span>
        </div>
    `;
}

/**
 * Enlaza el comportamiento del botón "Resolver" del Clash Resolver.
 * Oculta el bloque de solapamiento y marca la barra como resuelta usando clases.
 *
 * @param {HTMLButtonElement|null} btn - El botón del Clash Resolver.
 * @param {HTMLElement|null} resolverBar - El contenedor de la barra del resolutor.
 * @returns {void}
 */
function bindResolveBtn(btn, resolverBar) {
    if (!btn || !resolverBar) return;
    btn.addEventListener('click', () => {
        const overlapEl = document.getElementById('mock-overlap-block');
        if (overlapEl) overlapEl.hidden = true;

        resolverBar.classList.add('mock-clash-resolver--resolved');
        resolverBar.innerHTML = `
            <span class="mock-clash-resolver__text">
                ✓ Solapamiento resuelto: Inglés I movida a Miércoles.
            </span>
            <span class="mock-clash-resolver__badge">Seguro</span>
        `;
    }, { once: true });
}

/**
 * Inicializa el sistema de versiones A/B del simulador de horarios mock.
 * Alterna entre versiones usando clases en los botones y reconstruye
 * el contenido del horario sin inyectar inline styles.
 *
 * @returns {void}
 */
function initMockSchedule() {
    const verA       = document.getElementById('mock-ver-a');
    const verB       = document.getElementById('mock-ver-b');
    const schedList  = document.getElementById('mock-schedule-list');
    const resolverBar = document.getElementById('mock-clash-resolver-bar');
    const resolveBtn  = document.getElementById('mock-resolve-btn');

    if (!verA || !verB || !schedList) return;

    bindResolveBtn(resolveBtn, resolverBar);

    verA.addEventListener('click', () => {
        verA.classList.add('mock-version-btn--active');
        verA.classList.remove('mock-version-btn--inactive');
        verB.classList.add('mock-version-btn--inactive');
        verB.classList.remove('mock-version-btn--active');

        schedList.innerHTML = buildScheduleVerA();

        if (resolverBar) {
            resolverBar.hidden = false;
            resolverBar.classList.remove('mock-clash-resolver--resolved');
            resolverBar.innerHTML = `
                <span class="mock-clash-resolver__text">💡 Resolutor: Usar Com. N1-2 para Inglés I</span>
                <button id="mock-resolve-btn-new" class="mock-clash-resolver__btn">Resolver</button>
            `;
            bindResolveBtn(document.getElementById('mock-resolve-btn-new'), resolverBar);
        }
    });

    verB.addEventListener('click', () => {
        verB.classList.add('mock-version-btn--active');
        verB.classList.remove('mock-version-btn--inactive');
        verA.classList.add('mock-version-btn--inactive');
        verA.classList.remove('mock-version-btn--active');

        schedList.innerHTML = buildScheduleVerB();

        if (resolverBar) resolverBar.hidden = true;
    });
}

/* ============================================================
   FAQ — ACORDEÓN
   ============================================================ */

/**
 * Inicializa el acordeón de Preguntas Frecuentes.
 * Usa delegación de eventos en el contenedor y atributos ARIA
 * (`aria-expanded` en el botón, `aria-hidden` en la respuesta).
 * No usa eventos inline `onclick`.
 *
 * @returns {void}
 */
function initFaqAccordion() {
    const container = document.querySelector('.faq-container');
    if (!container) return;

    // Convertir los divs .faq-question en botones accesibles si no lo son ya
    container.querySelectorAll('.faq-question').forEach((question) => {
        question.setAttribute('role', 'button');
        question.setAttribute('aria-expanded', 'false');
        const answer = question.parentElement?.querySelector('.faq-answer');
        if (answer) {
            const answerId = `faq-answer-${Math.random().toString(36).slice(2, 7)}`;
            answer.id = answerId;
            question.setAttribute('aria-controls', answerId);
            answer.setAttribute('aria-hidden', 'true');
        }
    });

    container.addEventListener('click', (e) => {
        const question = e.target.closest('.faq-question');
        if (!question) return;

        const item    = question.parentElement;
        const answer  = item?.querySelector('.faq-answer');
        const isOpen  = item?.classList.contains('open');

        // Cerrar todos los demás items
        container.querySelectorAll('.faq-item.open').forEach((openItem) => {
            if (openItem === item) return;
            openItem.classList.remove('open');
            const openAnswer   = openItem.querySelector('.faq-answer');
            const openQuestion = openItem.querySelector('.faq-question');
            if (openAnswer)   { openAnswer.style.maxHeight = null; openAnswer.setAttribute('aria-hidden', 'true'); }
            if (openQuestion)   openQuestion.setAttribute('aria-expanded', 'false');
        });

        // Toggle del item actual
        if (isOpen) {
            item.classList.remove('open');
            question.setAttribute('aria-expanded', 'false');
            if (answer) { answer.style.maxHeight = null; answer.setAttribute('aria-hidden', 'true'); }
        } else {
            item.classList.add('open');
            question.setAttribute('aria-expanded', 'true');
            if (answer) { answer.style.maxHeight = `${answer.scrollHeight}px`; answer.setAttribute('aria-hidden', 'false'); }
        }
    });

    // Soporte de teclado (Enter/Space)
    container.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const question = e.target.closest('.faq-question');
        if (!question) return;
        e.preventDefault();
        question.click();
    });
}

/* ============================================================
   INICIALIZACIÓN
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    initLanding();
    initMockTabs();
    initMockSubjectCards();
    initMockPomodoro();
    initMockPayment();
    initMockSchedule();
    initFaqAccordion();
});
