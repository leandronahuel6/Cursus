(function() {
    const isAreaEstudioPage = window.location.pathname.includes('/area-estudio');
    if (isAreaEstudioPage) return; // No mostrar el flotante en la propia página de estudio

    let pomoState = null;
    let pomoSettings = { focusTime: 25, shortBreak: 5, longBreak: 15 };
    let tickerInterval = null;

    // Crear e inyectar el contenedor del widget flotante
    const widget = document.createElement('div');
    widget.id = 'pomo-floating-widget';
    widget.style.cssText = 'display: none; position: fixed; bottom: 85px; right: 20px; z-index: 10000; background: rgba(17, 24, 39, 0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 999px; padding: 0.4rem 0.9rem; align-items: center; gap: 0.65rem; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3); color: #ffffff; cursor: move; user-select: none; -webkit-user-select: none; font-family: "Outfit", sans-serif; transition: border-color 0.2s;';
    
    widget.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer;" id="pomo-float-info-wrapper" title="Maximizar / Ir a Área de Estudio">
            <span id="pomo-float-icon">⏱️</span>
            <span id="pomo-float-time" style="font-family: monospace; font-size: 1.05rem; font-weight: 700; color: #ffffff; letter-spacing: 0.02em;">25:00</span>
            <span id="pomo-float-label" style="font-size: 0.72rem; opacity: 0.8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #eef2ff;">Enfoque</span>
        </div>
        <div style="height: 16px; width: 1px; background: rgba(255,255,255,0.18);"></div>
        <div style="display: flex; align-items: center; gap: 0.4rem;">
            <button id="pomo-float-play-btn" style="background: transparent; border: none; color: #ffffff; cursor: pointer; padding: 0.2rem; display: flex; align-items: center; justify-content: center; opacity: 0.9; transition: opacity 0.2s; outline: none;" title="Pausar/Reanudar">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </button>
            <button id="pomo-float-stop-btn" style="background: transparent; border: none; color: #ef4444; cursor: pointer; padding: 0.2rem; display: flex; align-items: center; justify-content: center; opacity: 0.9; transition: opacity 0.2s; outline: none;" title="Reiniciar/Detener">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
            </button>
        </div>
    `;

    document.body.appendChild(widget);

    const playBtn = document.getElementById('pomo-float-play-btn');
    const stopBtn = document.getElementById('pomo-float-stop-btn');
    const infoWrapper = document.getElementById('pomo-float-info-wrapper');
    const timeEl = document.getElementById('pomo-float-time');
    const labelEl = document.getElementById('pomo-float-label');
    const iconEl = document.getElementById('pomo-float-icon');

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
        if (e.key === 'cursus_pomo_estado_v2' || e.key === 'cursus_pomo_settings_v2') {
            loadSettings();
            syncWithStorage();
        }
    });

    // Escuchar eventos locales para sincronización en la misma ventana
    window.addEventListener('pomo_local_change', () => {
        syncWithStorage();
    });

    function loadSettings() {
        const localSettings = localStorage.getItem('cursus_pomo_settings_v2');
        if (localSettings) {
            try { pomoSettings = JSON.parse(localSettings); } catch(e){}
        }
    }

    function syncWithStorage() {
        const localState = localStorage.getItem('cursus_pomo_estado_v2');
        if (!localState) {
            widget.style.display = 'none';
            stopTicker();
            return;
        }

        try {
            pomoState = JSON.parse(localState);
        } catch (e) {
            widget.style.display = 'none';
            stopTicker();
            return;
        }

        // Si el reloj está detenido, no mostrar el reproductor flotante
        if (pomoState.estado_reloj === 'detenido') {
            widget.style.display = 'none';
            stopTicker();
        } else {
            widget.style.display = 'flex';
            updateWidgetUI();
            
            if (pomoState.estado_reloj === 'corriendo') {
                startTicker();
            } else {
                stopTicker();
            }
        }
    }

    function updateWidgetUI() {
        const min = Math.floor(pomoState.tiempo_restante / 60);
        const sec = pomoState.tiempo_restante % 60;
        timeEl.textContent = `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;

        if (pomoState.fase_actual === 'enfoque') {
            labelEl.textContent = 'Enfoque';
            iconEl.textContent = '⏱️';
            labelEl.style.color = '#818cf8'; // Índigo suave
            widget.style.borderColor = 'rgba(129, 140, 248, 0.3)';
        } else {
            labelEl.textContent = 'Recreo';
            iconEl.textContent = '☕';
            labelEl.style.color = '#34d399'; // Esmeralda suave
            widget.style.borderColor = 'rgba(52, 211, 153, 0.3)';
        }

        if (pomoState.estado_reloj === 'corriendo') {
            playBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="4" x2="18" y2="20"/><line x1="6" y1="4" x2="6" y2="20"/></svg>`;
            playBtn.title = 'Pausar';
        } else {
            playBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
            playBtn.title = 'Reanudar';
        }
    }

    function startTicker() {
        if (tickerInterval) return;
        tickerInterval = setInterval(() => {
            if (pomoState && pomoState.estado_reloj === 'corriendo') {
                const now = Date.now();
                const delta = Math.floor((now - pomoState.timestamp_ultimo_cambio) / 1000);
                
                if (delta >= 1) {
                    pomoState.tiempo_restante -= delta;
                    pomoState.timestamp_ultimo_cambio = now;

                    if (pomoState.tiempo_restante <= 0) {
                        handleFaseComplete();
                    } else {
                        // Guardamos intermitentemente en localStorage
                        localStorage.setItem('cursus_pomo_estado_v2', JSON.stringify(pomoState));
                        updateWidgetUI();
                    }
                }
            }
        }, 1000);
    }

    function stopTicker() {
        if (tickerInterval) {
            clearInterval(tickerInterval);
            tickerInterval = null;
        }
    }

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

        if (pomoState.fase_actual === 'enfoque') {
            pomoState.fase_actual = 'recreo_corto';
            pomoState.tiempo_restante = pomoSettings.shortBreak * 60;
            showNotificationToast("¡Fase de Enfoque Completada! Tómate un recreo.", "success");
        } else {
            pomoState.fase_actual = 'enfoque';
            pomoState.tiempo_restante = pomoSettings.focusTime * 60;
            showNotificationToast("¡Recreo finalizado! Hora de enfocarse.", "success");
        }
        
        pomoState.estado_reloj = 'pausado'; 
        pomoState.timestamp_ultimo_cambio = Date.now();
        
        localStorage.setItem('cursus_pomo_estado_v2', JSON.stringify(pomoState));
        updateWidgetUI();
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

    // Botones de control del widget flotante
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
        localStorage.setItem('cursus_pomo_estado_v2', JSON.stringify(pomoState));
        updateWidgetUI();
        triggerPomoChangeEvent();
    });

    stopBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!pomoState) return;
        
        if (confirm('¿Deseas reiniciar/detener el Pomodoro actual?')) {
            pomoState.estado_reloj = 'detenido';
            pomoState.tiempo_restante = pomoSettings.focusTime * 60;
            pomoState.fase_actual = 'enfoque';
            pomoState.timestamp_ultimo_cambio = Date.now();
            
            localStorage.setItem('cursus_pomo_estado_v2', JSON.stringify(pomoState));
            widget.style.display = 'none';
            stopTicker();
            triggerPomoChangeEvent();
        }
    });

    infoWrapper.addEventListener('click', () => {
        window.location.href = '/area-estudio';
    });

    // Lógica Draggable (Mouse y Touch)
    function makeElementDraggable(el, handle) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        handle.onmousedown = dragMouseDown;
        handle.ontouchstart = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
            
            if (e.type === 'touchstart') {
                pos3 = e.touches[0].clientX;
                pos4 = e.touches[0].clientY;
            } else {
                pos3 = e.clientX;
                pos4 = e.clientY;
            }
            document.onmouseup = closeDragElement;
            document.ontouchend = closeDragElement;
            document.onmousemove = elementDrag;
            document.ontouchmove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            let clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
            let clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
            
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

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
            document.ontouchend = null;
            document.ontouchmove = null;
            
            localStorage.setItem('cursus_pomo_float_pos', JSON.stringify({
                top: el.style.top,
                left: el.style.left
            }));
        }
    }
})();
