(function() {
    const isAreaEstudioPage = window.location.pathname.includes('/area-estudio');
    if (isAreaEstudioPage) {
        localStorage.removeItem('cursus_pomo_float_dismissed'); // Resetear despido cuando vuelven a la página de estudio
        return; 
    }

    let pomoState = null;
    let pomoSettings = { focusTime: 25, shortBreak: 5, longBreak: 15, sessionsPerCycle: 4 };
    let pomoCycles = { ciclo_actual: 1 };
    let tickerInterval = null;
    let widgetDismissed = false;

    // Crear e inyectar el contenedor del widget flotante
    const widget = document.createElement('div');
    widget.id = 'pomo-floating-widget';
    widget.className = 'pomo-float';
    
    widget.innerHTML = `
        <div class="pomo-float__info" id="pomo-float-info" title="Mostrar/Ocultar controles">
            <span class="pomo-float__icon" id="pomo-float-icon">
                <svg width="18" height="18" aria-hidden="true"><use href="/assets/icons/sprite.svg#timer"></use></svg>
            </span>
            <span class="pomo-float__time" id="pomo-float-time">25:00</span>
            <span class="pomo-float__label" id="pomo-float-label">Enfoque</span>
            <span class="pomo-float__session" id="pomo-float-session"></span>
        </div>
        <div class="pomo-float__divider"></div>
        <div class="pomo-float__actions" id="pomo-float-actions">
            <button class="pomo-float__btn pomo-float__btn--play" id="pomo-float-play-btn" title="Pausar/Reanudar" aria-label="Pausar/Reanudar">
                <svg width="15" height="15" aria-hidden="true"><use href="/assets/icons/sprite.svg#play"></use></svg>
            </button>
            <button class="pomo-float__btn pomo-float__btn--nav" id="pomo-float-nav-btn" title="Ir a Área de Estudio" aria-label="Ir a Área de Estudio">
                <svg width="15" height="15" aria-hidden="true"><use href="/assets/icons/sprite.svg#move-right"></use></svg>
            </button>
            <button class="pomo-float__btn pomo-float__btn--min" id="pomo-float-min-btn" title="Minimizar" aria-label="Minimizar">
                <svg width="15" height="15" aria-hidden="true"><use href="/assets/icons/sprite.svg#minus"></use></svg>
            </button>
            <button class="pomo-float__btn pomo-float__btn--close" id="pomo-float-close-btn" title="Cerrar widget" aria-label="Cerrar widget">
                <svg width="15" height="15" aria-hidden="true"><use href="/assets/icons/sprite.svg#x"></use></svg>
            </button>
        </div>
    `;

    document.body.appendChild(widget);

    // Referencias al DOM
    const playBtn = document.getElementById('pomo-float-play-btn');
    const navBtn = document.getElementById('pomo-float-nav-btn');
    const minBtn = document.getElementById('pomo-float-min-btn');
    const closeBtn = document.getElementById('pomo-float-close-btn');
    const infoWrapper = document.getElementById('pomo-float-info');
    const actionsWrapper = document.getElementById('pomo-float-actions');
    const timeEl = document.getElementById('pomo-float-time');
    const labelEl = document.getElementById('pomo-float-label');
    const iconUseEl = document.querySelector('#pomo-float-icon use');
    const playUseEl = document.querySelector('#pomo-float-play-btn use');
    const sessionEl = document.getElementById('pomo-float-session');

    // Restaurar posición persistente en pantalla
    const savedPos = localStorage.getItem('cursus_pomo_float_pos');
    if (savedPos) {
        try {
            const pos = JSON.parse(savedPos);
            widget.style.top = pos.top;
            widget.style.left = pos.left;
            widget.style.bottom = 'auto';
            widget.style.right = 'auto';
        } catch (e) {}
    }

    makeElementDraggable(widget, widget);
    
    loadSettings();
    syncWithStorage();

    // Sincronización multi-pestaña usando storage de HTML5
    window.addEventListener('storage', function(e) {
        if (e.key === 'cursus_pomo_estado_v2' || e.key === 'cursus_pomo_settings_v2' || e.key === 'cursus_pomo_ciclos_v2') {
            loadSettings();
            syncWithStorage();
        }
    });

    // Escuchar eventos locales para sincronización en la misma ventana
    window.addEventListener('pomo_local_change', () => {
        syncWithStorage();
    });

    function loadSettings() {
        pomoSettings = PomoShared.loadSettings(pomoSettings);
        pomoCycles = PomoShared.loadCycles(pomoCycles);
    }

    function syncWithStorage() {
        const dismissed = localStorage.getItem('cursus_pomo_float_dismissed') === 'true';
        if (widgetDismissed || dismissed) {
            widget.classList.remove('is-visible');
            stopTicker();
            return;
        }

        const nuevoEstado = PomoShared.loadState();
        if (!nuevoEstado) {
            widget.classList.remove('is-visible');
            stopTicker();
            return;
        }
        pomoState = nuevoEstado;

        // El flotante SOLO debe mostrarse si el reloj está corriendo activamente (corriendo)
        if (pomoState.estado_reloj !== 'corriendo') {
            widget.classList.remove('is-visible');
            stopTicker();
        } else {
            widget.classList.add('is-visible');
            updateWidgetUI();
            startTicker();
        }
    }

    function updateWidgetUI() {
        const min = Math.floor(pomoState.tiempo_restante / 60);
        const sec = pomoState.tiempo_restante % 60;
        
        // Evitamos parpadeos actualizando solo el textContent
        const newTime = `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
        if (timeEl.textContent !== newTime) {
            timeEl.textContent = newTime;
        }

        // Configuración por fase
        let phaseLabel = 'Enfoque';
        let phaseIcon = 'timer';
        let phaseClass = 'pomo-float--enfoque';
        
        if (pomoState.fase_actual === 'descanso_corto') {
            phaseLabel = 'D. Corto';
            phaseIcon = 'coffee';
            phaseClass = 'pomo-float--corto';
        } else if (pomoState.fase_actual === 'descanso_largo') {
            phaseLabel = 'D. Largo';
            phaseIcon = 'bed';
            phaseClass = 'pomo-float--largo';
        }

        if (labelEl.textContent !== phaseLabel) {
            labelEl.textContent = phaseLabel;
            iconUseEl.setAttribute('href', `/assets/icons/sprite.svg#${phaseIcon}`);
            widget.classList.remove('pomo-float--enfoque', 'pomo-float--corto', 'pomo-float--largo');
            widget.classList.add(phaseClass);
        }

        // Actualizar sesión actual/total
        const sessionText = `${pomoCycles.ciclo_actual || 1}/${pomoSettings.sessionsPerCycle || 4}`;
        if (sessionEl.textContent !== sessionText) {
            sessionEl.textContent = sessionText;
        }

        // Actualizar botón play/pause
        const isRunning = pomoState.estado_reloj === 'corriendo';
        const playIcon = isRunning ? 'pause' : 'play';
        const currentPlayHref = playUseEl.getAttribute('href');
        if (!currentPlayHref.endsWith(`#${playIcon}`)) {
            playUseEl.setAttribute('href', `/assets/icons/sprite.svg#${playIcon}`);
            playBtn.title = isRunning ? 'Pausar' : 'Reanudar';
            playBtn.setAttribute('aria-label', playBtn.title);
        }
    }

    function tickPomo() {
        if (!pomoState || pomoState.estado_reloj !== 'corriendo') return;

        const delta = PomoShared.elapsedSeconds(pomoState);
        if (delta < 1) return;

        pomoState.tiempo_restante -= delta;
        pomoState.timestamp_ultimo_cambio = Date.now();

        if (pomoState.tiempo_restante <= 0) {
            handleFaseComplete();
        } else {
            // Guardamos en cada tick para que otras pestañas/páginas siempre
            // lean un timestamp reciente y no se desincronicen entre sí.
            PomoShared.saveState(pomoState);
            updateWidgetUI();
        }
    }

    function startTicker() {
        if (tickerInterval) return;
        tickerInterval = setInterval(tickPomo, 1000);
    }

    // Si el navegador puso en pausa/retrasó el intervalo por tener la pestaña
    // en segundo plano, al volver a mostrarla recalculamos al instante en vez
    // de esperar a que el próximo tick (posiblemente demorado) se dispare.
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) tickPomo();
    });

    function stopTicker() {
        if (tickerInterval) {
            clearInterval(tickerInterval);
            tickerInterval = null;
        }
    }

    // Funciones de Sonido
    function playPomoAlarm(soundName) {
        if (!soundName || soundName === 'none') return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            if (soundName === 'chime') {
                [880, 1175].forEach((freq, i) => {
                    const start = ctx.currentTime + i * 0.16;
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    gain.gain.setValueAtTime(0, start);
                    gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
                    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.7);
                    osc.connect(gain).connect(ctx.destination);
                    osc.start(start);
                    osc.stop(start + 0.75);
                });
            } else if (soundName === 'beep') {
                [0, 0.2, 0.4].forEach((delay) => {
                    const start = ctx.currentTime + delay;
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'square';
                    osc.frequency.value = 987.77;
                    gain.gain.setValueAtTime(0, start);
                    gain.gain.linearRampToValueAtTime(0.08, start + 0.01);
                    gain.gain.setValueAtTime(0.08, start + 0.09);
                    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);
                    osc.connect(gain).connect(ctx.destination);
                    osc.start(start);
                    osc.stop(start + 0.15);
                });
            } else if (soundName === 'zen') {
                const frequencies = [440, 554.37, 659.25, 880];
                frequencies.forEach((freq, index) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = index % 2 === 0 ? 'sine' : 'triangle';
                    osc.frequency.value = freq;
                    const start = ctx.currentTime;
                    gain.gain.setValueAtTime(0, start);
                    gain.gain.linearRampToValueAtTime(0.05, start + 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.001, start + 1.8 - (index * 0.2));
                    osc.connect(gain).connect(ctx.destination);
                    osc.start(start);
                    osc.stop(start + 2.0);
                });
            }
        } catch (e) {}
    }

    function handleFaseComplete() {
        stopTicker();

        const alarmSound = localStorage.getItem('cursus_pomo_alarm_sound') || 'chime';
        playPomoAlarm(alarmSound);

        // Misma lógica de avance de fase, registro de sesión y anti-duplicación
        // que usa Área de Estudio: una sola fuente de verdad para ambos.
        const mensaje = PomoShared.avanzarFase(pomoState, pomoSettings, pomoCycles);
        showNotificationToast(mensaje, "success");

        updateWidgetUI();
        startTicker();
        triggerPomoChangeEvent();
    }

    function showNotificationToast(msg, type) {
        if (window.showToast) {
            window.showToast(msg, type);
        } else {
            alert(msg);
        }
    }

    function triggerPomoChangeEvent() {
        // Disparar evento para que otras ventanas y el DOM local se sincronicen
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('pomo_local_change'));
    }

    // Comportamiento de botones y área de info
    infoWrapper.addEventListener('click', (e) => {
        // Toggle de los botones de acción si no está minimizado
        if (widget.classList.contains('pomo-float--minimized')) {
            widget.classList.remove('pomo-float--minimized');
            return;
        }
        actionsWrapper.classList.toggle('pomo-float__actions--visible');
    });

    playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!pomoState) return;

        if (pomoState.estado_reloj === 'corriendo') {
            pomoState.estado_reloj = 'pausado';
            stopTicker();
        } else {
            pomoState.estado_reloj = 'corriendo';
            pomoState.timestamp_ultimo_cambio = Date.now();
            startTicker();
        }

        pomoState.timestamp_ultimo_cambio = Date.now();
        PomoShared.saveState(pomoState);
        updateWidgetUI();
        triggerPomoChangeEvent();
    });

    navBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = '/area-estudio';
    });

    minBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        actionsWrapper.classList.remove('pomo-float__actions--visible');
        widget.classList.add('pomo-float--minimized');
    });

    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        widgetDismissed = true;
        localStorage.setItem('cursus_pomo_float_dismissed', 'true'); // Persistir despido del widget
        widget.classList.remove('is-visible');
        stopTicker();
    });

    // Lógica Draggable (Mouse y Touch)
    function makeElementDraggable(el, handle) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        let isDragging = false;
        let dragStartTime = 0;

        handle.onmousedown = dragMouseDown;
        handle.ontouchstart = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            // No arrastrar si hace clic en los botones
            if (e.target.closest('.pomo-float__btn')) return;
            
            if (e.type === 'touchstart') {
                pos3 = e.touches[0].clientX;
                pos4 = e.touches[0].clientY;
            } else {
                pos3 = e.clientX;
                pos4 = e.clientY;
            }
            isDragging = false;
            dragStartTime = Date.now();
            
            document.onmouseup = closeDragElement;
            document.ontouchend = closeDragElement;
            document.onmousemove = elementDrag;
            document.ontouchmove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            
            let clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
            let clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
            
            // Si el movimiento es muy pequeño, no lo consideramos drag (para permitir clics normales)
            if (Math.abs(clientX - pos3) > 5 || Math.abs(clientY - pos4) > 5) {
                isDragging = true;
            }
            
            if (!isDragging) return;
            
            if (e.type === 'touchmove') e.preventDefault(); // Evitar scroll
            
            pos1 = pos3 - clientX;
            pos2 = pos4 - clientY;
            pos3 = clientX;
            pos4 = clientY;
            
            let newTop = el.offsetTop - pos2;
            let newLeft = el.offsetLeft - pos1;
            
            const padding = 10;
            const maxTop = window.innerHeight - el.offsetHeight - padding;
            const maxLeft = window.innerWidth - el.offsetWidth - padding;
            
            if (newTop < padding) newTop = padding;
            if (newTop > maxTop) newTop = maxTop;
            if (newLeft < padding) newLeft = padding;
            if (newLeft > maxLeft) newLeft = maxLeft;
            
            el.style.top = newTop + "px";
            el.style.left = newLeft + "px";
            el.style.bottom = "auto";
            el.style.right = "auto";
        }

        function closeDragElement(e) {
            document.onmouseup = null;
            document.onmousemove = null;
            document.ontouchend = null;
            document.ontouchmove = null;
            
            // Prevenir click event si estábamos arrastrando
            if (isDragging && Date.now() - dragStartTime > 150) {
                if (e) {
                    e.stopPropagation();
                }
                // Hacemos una captura en la fase de captura para matar el click subsecuente
                const captureClick = (ev) => {
                    ev.stopPropagation();
                    ev.preventDefault();
                    window.removeEventListener('click', captureClick, true);
                };
                window.addEventListener('click', captureClick, true);
                setTimeout(() => window.removeEventListener('click', captureClick, true), 50);
            }
            
            if (isDragging) {
                localStorage.setItem('cursus_pomo_float_pos', JSON.stringify({
                    top: el.style.top,
                    left: el.style.left
                }));
            }
        }
    }
})();
