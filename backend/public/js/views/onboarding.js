// Cursus Onboarding Guided Tour - Premium Multipage Version
(function () {
    const styles = `
    .onboarding-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(15, 23, 42, 0.0); /* Inicialmente transparente */
        z-index: 99999;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease, background-color 0.3s ease;
    }
    .onboarding-backdrop.show {
        opacity: 1;
        pointer-events: auto;
        background: rgba(15, 23, 42, 0.35); /* Oscurece un poco el fondo al aparecer */
    }
    .onboarding-backdrop.modal-active {
        background: rgba(15, 23, 42, 0.65); /* Filtro completo cuando es modal */
        backdrop-filter: blur(4px);
    }
    .onboarding-highlighted {
        position: relative;
        z-index: 100000 !important;
        box-shadow: 0 0 0 4px #ffffff, 0 0 0 8px var(--brand), 0 0 0 9999px rgba(15, 23, 42, 0.65) !important;
        pointer-events: none !important;
        transition: box-shadow 0.3s ease !important;
    }
    body.dark-mode .onboarding-highlighted {
        box-shadow: 0 0 0 4px #0f172a, 0 0 0 8px var(--brand), 0 0 0 9999px rgba(15, 23, 42, 0.65) !important;
    }
    .bnav.onboarding-highlighted {
        position: fixed;
        bottom: 8px;
        left: 8px;
        right: 8px;
        width: calc(100% - 16px);
        border-radius: 12px;
        transition: all 0.3s ease;
    }
    .onboarding-tooltip {
        position: absolute;
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 20px;
        padding: 24px;
        width: 360px;
        max-width: 90vw; /* Evitar desbordes en mobile */
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        z-index: 100001;
        opacity: 0;
        transform: translate(0, 15px) scale(0.97);
        pointer-events: none;
        transition: opacity 0.25s ease, transform 0.25s ease;
        display: flex;
        flex-direction: column;
        gap: 16px;
        overflow: hidden;
    }
    .onboarding-tooltip::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 6px;
        background: linear-gradient(90deg, var(--brand), #818cf8);
    }
    body.dark-mode .onboarding-tooltip {
        background: #1e293b;
        border-color: #334155;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .onboarding-tooltip.show {
        opacity: 1;
        transform: translate(0, 0) scale(1);
        pointer-events: auto;
    }
    .onboarding-tooltip.modal-step {
        position: fixed !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -40%) scale(0.97) !important;
    }
    .onboarding-tooltip.modal-step.show {
        transform: translate(-50%, -50%) scale(1) !important;
    }
    .onboarding-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2px;
    }
    .onboarding-title {
        font-size: 19px;
        font-weight: 800;
        color: #0f172a;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    body.dark-mode .onboarding-title {
        color: #f8fafc;
    }
    .onboarding-close {
        background: none;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        font-size: 20px;
        line-height: 1;
        transition: color 0.2s;
        padding: 0;
    }
    .onboarding-close:hover {
        color: #475569;
    }
    body.dark-mode .onboarding-close:hover {
        color: #cbd5e1;
    }
    .onboarding-body {
        font-size: 14px;
        line-height: 1.6;
        color: #475569;
    }
    body.dark-mode .onboarding-body {
        color: #cbd5e1;
    }
    .onboarding-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 10px;
        border-top: 1px solid #f1f5f9;
        padding-top: 16px;
    }
    body.dark-mode .onboarding-footer {
        border-top-color: #334155;
    }
    .onboarding-dots {
        display: flex;
        gap: 6px;
        align-items: center;
    }
    .onboarding-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #e2e8f0;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    body.dark-mode .onboarding-dot {
        background: #475569;
    }
    .onboarding-dot:hover {
        background: #94a3b8;
    }
    .onboarding-dot.active {
        width: 18px;
        border-radius: 4px;
        background: var(--brand);
    }
    .onboarding-btns {
        display: flex;
        gap: 8px;
        align-items: center;
    }
    .onboarding-btn {
        padding: 9px 15px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        border: none;
        transition: all 0.2s ease;
        white-space: nowrap;
    }
    .onboarding-btn-prev {
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        color: #334155;
    }
    .onboarding-btn-prev:hover {
        background: #e2e8f0;
    }
    body.dark-mode .onboarding-btn-prev {
        background: #334155;
        border-color: #475569;
        color: #cbd5e1;
    }
    body.dark-mode .onboarding-btn-prev:hover {
        background: #475569;
    }
    .onboarding-btn-next {
        background: var(--brand);
        color: #ffffff;
    }
    .onboarding-btn-next:hover {
        background: var(--brand-hover);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
    }
    .onboarding-btn-skip {
        background: transparent;
        color: #64748b;
        border: none;
    }
    .onboarding-btn-skip:hover {
        color: #334155;
    }
    body.dark-mode .onboarding-btn-skip {
        color: #94a3b8;
    }
    body.dark-mode .onboarding-btn-skip:hover {
        color: #cbd5e1;
    }
    .onboarding-illustration {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 8px 0;
        animation: onboardingFloat 3s ease-in-out infinite;
    }
    @keyframes onboardingFloat {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-6px); }
        100% { transform: translateY(0px); }
    }
    .onboarding-icon-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 50px;
        height: 50px;
        border-radius: 14px;
        background: rgba(79, 70, 229, 0.08);
        margin-bottom: 4px;
    }
    body.dark-mode .onboarding-icon-wrap {
        background: rgba(129, 140, 248, 0.12);
    }
    @media (max-width: 640px) {
        .onboarding-tooltip {
            padding: 16px 20px;
            width: 290px;
            max-width: calc(100% - 32px);
            gap: 10px;
            border-radius: 16px;
        }
        .onboarding-title {
            font-size: 16px;
        }
        .onboarding-body {
            font-size: 13px;
            line-height: 1.5;
        }
        .onboarding-btn {
            padding: 7px 12px;
            font-size: 12px;
            border-radius: 8px;
        }
        .onboarding-illustration svg {
            width: 56px;
            height: 56px;
        }
        .onboarding-tooltip.modal-step {
            transform: translate(-50%, -45%) scale(0.97) !important;
        }
        .onboarding-tooltip.modal-step.show {
            transform: translate(-50%, -50%) scale(1) !important;
        }
    }
    `;

    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);

    const steps = [
        {
            title: "¡Te damos la bienvenida! 🚀",
            body: "Cursus es tu asistente de estudio inteligente diseñado para ayudarte a organizar tus materias, llevar registro de tu progreso, estudiar con flashcards y entrar en estados de concentración profunda.<br><br>¿Te gustaría realizar un recorrido rápido de 1 minuto?",
            isModal: true,
            illustration: `
                <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--brand);">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                    <path d="M6 12v5c0 2 2.5 3 6 3s6-1 6-3v-5" opacity="0.85"/>
                </svg>
            `,
            nextLabel: "Empezar Tour 🗺️",
            skipLabel: "Omitir"
        },
        {
            title: "Navegación Principal 🧭",
            body: "Desde esta barra lateral podés acceder a todas tus secciones:<br>• <b>Mis Materias</b> para ver tu plan de cursada y notas.<br>• <b>Simulador de Horarios</b> para armar tu semana.<br>• <b>Área de Estudio</b> con el Pomodoro.<br>• <b>Flashcards</b> para repasar con repetición espaciada.",
            selector: "#sidebar",
            placement: "right",
            iconColor: "#4f46e5",
            iconSvg: `
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                </svg>
            `,
            nextLabel: "Siguiente",
            prevLabel: "Atrás",
            skipLabel: "Omitir"
        },
        {
            title: "Tus Estadísticas 📊",
            body: "Llevá un control rápido de las horas dedicadas al estudio esta semana, tu racha diaria en días consecutivos, la cantidad de tareas pendientes y materias cursadas activamente.",
            selector: ".stats",
            placement: "bottom",
            iconColor: "#10b981",
            iconSvg: `
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
            `,
            nextLabel: "Siguiente",
            prevLabel: "Atrás",
            skipLabel: "Omitir"
        },
        {
            title: "Tu Espacio de Estudio ⚡",
            body: "Aquí podés ver tu racha diaria y hacer clic en <b>Continuar estudiando</b> para acceder al cronómetro Pomodoro interactivo, al reproductor de sonidos ambientales (lluvia, bosque, etc.), y a tu lista de tareas pendientes.",
            selector: ".study-card",
            placement: "bottom",
            iconColor: "#f97316",
            iconSvg: `
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
            `,
            nextLabel: "Siguiente",
            prevLabel: "Atrás",
            skipLabel: "Omitir"
        },
        {
            title: "Calendario de Actividad 🗓️",
            body: "Este mapa de calor registra tus días de mayor esfuerzo. Cada día que estudies pintará un cuadro verde. ¡Mantené tu constancia para pintar todo el calendario!",
            selector: ".hm-wrap",
            placement: "top",
            iconColor: "#8b5cf6",
            iconSvg: `
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
            `,
            nextLabel: "Siguiente",
            prevLabel: "Atrás",
            skipLabel: "Omitir"
        },
        {
            title: "¡Área de Estudio! ⚡",
            body: "Ya conocés el panel de control. Ahora visitemos el Área de Estudio, donde podés gestionar tus tareas y usar el Pomodoro clásico.<br><br>¿Vamos?",
            isModal: true,
            illustration: `
                <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--brand);">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                    <polyline points="2 17 12 22 22 17"/>
                    <polyline points="2 12 12 17 22 12"/>
                </svg>
            `,
            nextLabel: "Ir a estudiar 🚀",
            prevLabel: "Atrás",
            skipLabel: "Omitir"
        },
        {
            title: "Selector de Materia 📖",
            body: "Antes de empezar, seleccioná la materia que vas a estudiar. Esto filtrará automáticamente tu tablero de tareas y tus marcadores guardados.",
            selector: ".mat-hdr",
            placement: "bottom",
            iconColor: "#4f46e5",
            iconSvg: `
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
            `,
            nextLabel: "Siguiente",
            prevLabel: "Atrás",
            skipLabel: "Omitir"
        },
        {
            title: "Tablero Kanban 📋",
            body: "Organizá tus tareas arrastrándolas entre las columnas de <b>Pendiente</b>, <b>En Curso</b> y <b>Finalizado</b>. Añadí subtareas y vencimientos haciendo clic en cada una.",
            selector: ".kanban-section",
            placement: "right",
            iconColor: "#10b981",
            iconSvg: `
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="9" y1="3" x2="9" y2="21"/>
                    <line x1="15" y1="3" x2="15" y2="21"/>
                </svg>
            `,
            nextLabel: "Siguiente",
            prevLabel: "Atrás",
            skipLabel: "Omitir"
        },
        {
            title: "Temporizador Pomodoro 🍅",
            body: "Configurá bloques de enfoque y descansos (ej: 25 minutos de estudio y 5 de recreo). ¡Hacé clic en el botón de reproducción para empezar!<br><br>Y recordá presionar el botón <b>Modo Concentración</b> en la barra superior para abrir el reproductor inmersivo a pantalla completa con música Lofi y sonidos relajantes.",
            selector: ".focus-card",
            placement: "left",
            iconColor: "#f97316",
            iconSvg: `
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
            `,
            nextLabel: "Siguiente",
            prevLabel: "Atrás",
            skipLabel: "Omitir"
        },
        {
            title: "¡Recorrido Completado! 🎓",
            body: "¡Excelente! Ya conocés las herramientas fundamentales de Cursus. El tablero de tareas, tus marcadores y el Pomodoro te ayudarán a rendir al máximo.<br><br>¡Mucho éxito en tu cursada!",
            isModal: true,
            illustration: `
                <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                    <path d="M4 22h16"/>
                    <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"/>
                    <path d="M12 2a6 6 0 0 1 6 6v5a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z" fill="#eab308" opacity="0.18"/>
                </svg>
            `,
            nextLabel: "Comenzar 🎉"
        }
    ];

    let currentStep = 0;
    let backdrop = null;
    let tooltip = null;
    let resizeHandler = null;

    function initElements() {
        if (document.getElementById('onboarding-backdrop')) return;

        backdrop = document.createElement('div');
        backdrop.id = 'onboarding-backdrop';
        backdrop.className = 'onboarding-backdrop';
        document.body.appendChild(backdrop);

        tooltip = document.createElement('div');
        tooltip.id = 'onboarding-tooltip';
        tooltip.className = 'onboarding-tooltip';
        document.body.appendChild(tooltip);

        // Cerrar únicamente cuando se hace clic exactamente en el backdrop
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                endTour();
            }
        });

        // Evitar que cualquier clic dentro del diálogo se propague e interfiera con otros handlers
        tooltip.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    function renderStep() {
        initElements();
        
        // 1. Ocultar tooltip inmediatamente para evitar saltos bruscos/teletransportación visual
        tooltip.classList.remove('show');
        
        // Limpiar resaltado anterior
        document.querySelectorAll('.onboarding-highlighted').forEach(el => {
            el.classList.remove('onboarding-highlighted');
        });

        if (resizeHandler) {
            window.removeEventListener('resize', resizeHandler);
            window.removeEventListener('scroll', resizeHandler);
            resizeHandler = null;
        }

        // Clonar y adaptar paso para móviles
        const step = { ...steps[currentStep] };
        if (window.innerWidth <= 768) {
            if (step.selector === '#sidebar') {
                step.selector = '.bnav';
                step.placement = 'top';
            } else if (step.placement === 'left' || step.placement === 'right') {
                step.placement = 'bottom';
            }
        }
        
        // Armar contenido con botones type="button" explícitos
        let html = `
            <div class="onboarding-header">
        `;

        if (step.iconSvg) {
            html += `
                <div class="onboarding-icon-wrap" style="color: ${step.iconColor};">
                    ${step.iconSvg}
                </div>
            `;
        }

        html += `
                <div class="onboarding-title">${step.title}</div>
                <button type="button" class="onboarding-close" onclick="window.onboardingCloseTour()">✕</button>
            </div>
        `;

        if (step.illustration) {
            html += `<div class="onboarding-illustration">${step.illustration}</div>`;
        }

        html += `
            <div class="onboarding-body">${step.body}</div>
            <div class="onboarding-footer">
        `;

        // Generar dots indicadores premium condicionados por página
        if (!step.isModal) {
            html += `<div class="onboarding-dots">`;
            if (window.location.pathname.includes('/area-estudio')) {
                // Pasos 6, 7, 8
                for (let i = 6; i <= 8; i++) {
                    const activeClass = i === currentStep ? 'active' : '';
                    html += `<div class="onboarding-dot ${activeClass}" onclick="window.onboardingGoToStep(${i})"></div>`;
                }
            } else {
                // Pasos 1, 2, 3, 4
                for (let i = 1; i <= 4; i++) {
                    const activeClass = i === currentStep ? 'active' : '';
                    html += `<div class="onboarding-dot ${activeClass}" onclick="window.onboardingGoToStep(${i})"></div>`;
                }
            }
            html += `</div>`;
        } else {
            html += `<div></div>`;
        }

        // Se eliminó la etiqueta de texto redundante "X de Y" para dar más espacio y evitar encimamientos.
        html += `<div class="onboarding-btns">`;
        if (step.skipLabel) {
            html += `<button type="button" class="onboarding-btn onboarding-btn-skip" onclick="window.onboardingCloseTour()">${step.skipLabel}</button>`;
        }
        if (step.prevLabel && currentStep > 0) {
            html += `<button type="button" class="onboarding-btn onboarding-btn-prev" onclick="window.onboardingPrevStep()">${step.prevLabel}</button>`;
        }
        html += `<button type="button" class="onboarding-btn onboarding-btn-next" onclick="window.onboardingNextStep()">${step.nextLabel}</button>`;
        html += `</div></div>`;

        // Esperar a que se complete el fade-out (200ms) antes de inyectar el HTML y mover el tooltip
        setTimeout(() => {
            tooltip.innerHTML = html;

            if (step.isModal) {
                // Centrado en pantalla
                tooltip.className = 'onboarding-tooltip modal-step';
                backdrop.className = 'onboarding-backdrop show modal-active';
                
                // Mostrar con retraso mínimo para animar la entrada
                setTimeout(() => {
                    tooltip.classList.add('show');
                }, 50);
            } else {
                let target = document.querySelector(step.selector);
                if (step.selector === '.hm-wrap' && target) {
                    target = target.closest('.card') || target;
                }
                if (target) {
                    const isFixed = window.getComputedStyle(target).position === 'fixed' || target.classList.contains('bnav');
                    if (!isFixed) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    
                    // Esperar a que el scroll termine antes de recalcular y mostrar
                    setTimeout(() => {
                        target.classList.add('onboarding-highlighted');
                        tooltip.className = 'onboarding-tooltip';
                        backdrop.className = 'onboarding-backdrop show';
                        positionTooltip(target, tooltip, step.placement);
                        
                        tooltip.classList.add('show');

                        resizeHandler = () => positionTooltip(target, tooltip, step.placement);
                        window.addEventListener('resize', resizeHandler);
                        window.addEventListener('scroll', resizeHandler);
                    }, 400); // 400ms para asegurar que el scroll suave finalice
                } else {
                    // Respaldo modal centrado
                    tooltip.className = 'onboarding-tooltip modal-step';
                    backdrop.className = 'onboarding-backdrop show modal-active';
                    setTimeout(() => {
                        tooltip.classList.add('show');
                    }, 50);
                }
            }
        }, 200);
    }

    function positionTooltip(element, tooltipEl, placement = 'bottom') {
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltipEl.getBoundingClientRect();
        
        let top = 0;
        let left = 0;
        
        if (placement === 'right') {
            top = rect.top + window.scrollY + 40; // Centrar un poco verticalmente
            left = rect.right + 14;
        } else if (placement === 'left') {
            top = rect.top + window.scrollY + 40;
            left = rect.left - tooltipRect.width - 14;
        } else if (placement === 'top') {
            const offset = element.classList.contains('bnav') ? 32 : 14;
            top = rect.top + window.scrollY - tooltipRect.height - offset;
            left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        } else { // default 'bottom'
            top = rect.bottom + window.scrollY + 14;
            left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        }
        
        // Ajustes de seguridad para no salirse de la pantalla
        if (left + tooltipRect.width > window.innerWidth - 20) {
            left = window.innerWidth - tooltipRect.width - 20;
        }
        if (left < 20) {
            left = 20;
        }
        if (top < window.scrollY + 20) {
            top = window.scrollY + 20;
        }
        if (top + tooltipRect.height > document.documentElement.scrollHeight - 20) {
            top = document.documentElement.scrollHeight - tooltipRect.height - 20;
        }
        
        tooltipEl.style.top = `${top}px`;
        tooltipEl.style.left = `${left}px`;
    }

    function nextStep() {
        // Si estamos en el paso de transición (5) del dashboard, redirigir al área de estudio
        if (currentStep === 5 && !window.location.pathname.includes('/area-estudio')) {
            localStorage.setItem('cursus_onboarding_step', '6');
            location.href = '/area-estudio?start_study_tour=true';
            return;
        }
        
        if (currentStep < steps.length - 1) {
            currentStep++;
            renderStep();
        } else {
            endTour();
        }
    }

    function prevStep() {
        // Si estamos al principio del área de estudio (6), volver al paso de transición (5) en el dashboard
        if (currentStep === 6 && window.location.pathname.includes('/area-estudio')) {
            localStorage.setItem('cursus_onboarding_step', '5');
            location.href = '/dashboard?start_tour=true';
            return;
        }

        if (currentStep > 0) {
            currentStep--;
            renderStep();
        }
    }

    function endTour() {
        localStorage.setItem('cursus_onboarding_completed', 'true');
        
        document.querySelectorAll('.onboarding-highlighted').forEach(el => {
            el.classList.remove('onboarding-highlighted');
        });

        if (resizeHandler) {
            window.removeEventListener('resize', resizeHandler);
            window.removeEventListener('scroll', resizeHandler);
            resizeHandler = null;
        }

        if (tooltip) tooltip.className = 'onboarding-tooltip';
        if (backdrop) backdrop.className = 'onboarding-backdrop';
        
        setTimeout(() => {
            if (tooltip) tooltip.remove();
            if (backdrop) backdrop.remove();
            tooltip = null;
            backdrop = null;
        }, 300);
    }

    // Exponer funciones globales
    window.startOnboardingTour = function () {
        currentStep = 0;
        renderStep();
    };
    window.onboardingNextStep = nextStep;
    window.onboardingPrevStep = prevStep;
    window.onboardingCloseTour = endTour;
    window.onboardingGoToStep = function (index) {
        if (index > 0 && index < steps.length - 1) {
            currentStep = index;
            renderStep();
        }
    };

    // Auto inicio y coordinación entre páginas
    window.addEventListener('DOMContentLoaded', () => {
        const completed = localStorage.getItem('cursus_onboarding_completed') === 'true';
        const forceTour = window.location.search.includes('start_tour=true');
        const forceStudyTour = window.location.search.includes('start_study_tour=true');
        
        const savedStep = localStorage.getItem('cursus_onboarding_step');

        if (forceStudyTour || savedStep === '6') {
            localStorage.removeItem('cursus_onboarding_step');
            
            // Limpiar parámetro de URL
            const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
            
            setTimeout(() => {
                currentStep = 6;
                renderStep();
            }, 1000);
            return;
        }

        if (!completed || forceTour || savedStep === '5') {
            localStorage.removeItem('cursus_onboarding_step');
            
            if (forceTour) {
                const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
            }
            
            setTimeout(() => {
                currentStep = savedStep === '5' ? 5 : 0;
                renderStep();
            }, 1000);
        }
    });
})();
