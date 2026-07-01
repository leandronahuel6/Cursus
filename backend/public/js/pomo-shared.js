// Cursus - Núcleo compartido del Pomodoro (Área de Estudio + widget flotante).
// Ambos lugares usan esta misma lógica para leer/guardar el estado, calcular
// el tiempo transcurrido y avanzar de fase, así nunca vuelven a divergir.
(function () {
  const STATE_KEY = 'cursus_pomo_estado_v2';
  const SETTINGS_KEY = 'cursus_pomo_settings_v2';
  const CYCLES_KEY = 'cursus_pomo_ciclos_v2';
  const DEDUP_KEY = 'cursus_pomo_dedup_token';
  const MATERIA_KEY = 'cursus_selected_materia';

  function getStoredToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  function getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + getStoredToken()
    };
  }

  function parseOr(json, fallback) {
    if (!json) return fallback;
    try { return JSON.parse(json); } catch (e) { return fallback; }
  }

  function loadState() {
    return parseOr(localStorage.getItem(STATE_KEY), null);
  }

  function saveState(state) {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  }

  function loadSettings(defaults) {
    return parseOr(localStorage.getItem(SETTINGS_KEY), defaults);
  }

  function loadCycles(defaults) {
    return parseOr(localStorage.getItem(CYCLES_KEY), defaults);
  }

  function saveCycles(cycles) {
    localStorage.setItem(CYCLES_KEY, JSON.stringify(cycles));
  }

  // Segundos reales transcurridos desde la última actualización guardada,
  // basado en reloj real (no en cuántas veces disparó el setInterval).
  function elapsedSeconds(state) {
    return Math.floor((Date.now() - state.timestamp_ultimo_cambio) / 1000);
  }

  // Registra la sesión de enfoque completada contra la API, con protección
  // anti-duplicación compartida (antes vivía por separado y con leves
  // diferencias en el widget flotante y en Área de Estudio).
  function registrarSesionCompletada(duracionSegundos) {
    const materiaId = localStorage.getItem(MATERIA_KEY);
    if (!materiaId) return;

    const nowTime = Date.now();
    const existingToken = localStorage.getItem(DEDUP_KEY);
    if (existingToken && (nowTime - parseInt(existingToken, 10)) <= 10000) return;

    localStorage.setItem(DEDUP_KEY, String(nowTime));
    setTimeout(() => {
      if (localStorage.getItem(DEDUP_KEY) === String(nowTime)) {
        localStorage.removeItem(DEDUP_KEY);
      }
    }, 30000);

    fetch('/api/pomodoro/sesiones', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ materia_id: materiaId, duracion_segundos: duracionSegundos })
    }).catch(e => console.error('Error registrando sesión de Pomodoro', e));
  }

  // Avanza el estado a la siguiente fase (enfoque -> descanso corto/largo ->
  // enfoque), actualiza los ciclos y registra la sesión si corresponde.
  // Muta `state` y `cycles` in-place y los persiste; devuelve un mensaje
  // para que cada página lo muestre con su propio sistema de toasts.
  function avanzarFase(state, settings, cycles) {
    let mensaje;

    if (state.fase_actual === 'enfoque') {
      registrarSesionCompletada(settings.focusTime * 60);

      cycles.sesiones_completadas_hoy = (cycles.sesiones_completadas_hoy || 0) + 1;
      if (!cycles.log) cycles.log = [];
      const d = new Date();
      const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      cycles.log.unshift({ time: hhmm, duration: `${settings.focusTime}:00`, status: '✓ Completada' });

      if (cycles.ciclo_actual < settings.sessionsPerCycle) {
        state.fase_actual = 'descanso_corto';
        state.tiempo_restante = settings.shortBreak * 60;
        cycles.ciclo_actual++;
      } else {
        state.fase_actual = 'descanso_largo';
        state.tiempo_restante = settings.longBreak * 60;
        cycles.ciclo_actual = 1;
      }
      mensaje = '¡Buen trabajo! Sesión de enfoque completada. Hora de descansar.';
    } else {
      state.fase_actual = 'enfoque';
      state.tiempo_restante = settings.focusTime * 60;
      mensaje = 'El descanso ha terminado. ¡A enfocar nuevamente!';
    }

    // Continúa corriendo automáticamente: nunca debe frenarse solo porque
    // se cambió de página o se completó una fase.
    state.estado_reloj = 'corriendo';
    state.timestamp_ultimo_cambio = Date.now();

    saveState(state);
    saveCycles(cycles);

    return mensaje;
  }

  window.PomoShared = {
    STATE_KEY, SETTINGS_KEY, CYCLES_KEY,
    getStoredToken, getAuthHeaders,
    loadState, saveState, loadSettings, loadCycles, saveCycles,
    elapsedSeconds, registrarSesionCompletada, avanzarFase
  };
})();
