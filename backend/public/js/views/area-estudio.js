  /* ==========================================================================
     CONFIGURACIONES GENERALES & MOCK NETWORK
     ========================================================================== */
  const API_BASE = '/api';
  function getAuthHeaders() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + token
    };
  }

  const COLUMNA_DB_TO_UI = { pendiente: 'pending', progreso: 'progress', finalizado: 'done' };
  const COLUMNA_UI_TO_DB = { pending: 'pendiente', progress: 'progreso', done: 'finalizado' };

  // Simulación de Fetch asíncrono
  function mockFetch(url, options = {}) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // APLICAR LÓGICA DE ERROR PARA CASOS REALES AQUÍ:
        // En una implementación real, si la petición falla (ej. error 500, timeout), 
        // debes rechazar la promesa devolviendo el error para que el frontend 
        // atrape la excepción (catch) y ejecute el rollback visual del estado.
        /*
        if (url.includes('/mover') || url.includes('/tareas') || url.includes('/marcadores') || url.includes('/subtareas')) {
          reject({
            success: false,
            message: "Error de sincronización con el servidor. Se aplicó el rollback visual."
          });
          return;
        }
        */

        resolve({
          success: true,
          data: options.body ? JSON.parse(options.body) : {}
        });
      }, 500);
    });
  }

  // Toast System
  function showToast(message, type = 'error') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'ℹ️';
    if (type === 'error') icon = '❌';
    if (type === 'success') icon = '✅';
    if (type === 'warn') icon = '⚠️';

    toast.innerHTML = `
      <span class="toast-ic">${icon}</span>
      <span>${message}</span>
      <span class="toast-close" onclick="this.parentElement.remove()">✕</span>
    `;
    container.appendChild(toast);
    
    // Auto remove
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = 'toastOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
        setTimeout(() => toast.remove(), 300);
      }
    }, 4000);
  }

  /* ==========================================================================
     ESTADO LOCAL (KANBAN & MARCADORES)
     ========================================================================== */
  let tasks = [];
  let bookmarks = [];

  // Datos semilla iniciales si no hay en LocalStorage
  const defaultTasks = [
    {
      id: "c1",
      column: "pending",
      title: "TP N°2 — Calculadora en C",
      dueDate: "2026-06-25T23:59:00",
      description: "Desarrollar una calculadora científica en C usando funciones recursivas y estructuras de control.",
      subtasks: [
        { id: "s1", text: "Crear cabecera .h", completed: true },
        { id: "s2", text: "Implementar suma y resta", completed: false }
      ]
    },
    {
      id: "c2",
      column: "pending",
      title: "Práctica 4 — Recursividad",
      dueDate: "2026-06-29T23:59:00",
      description: "Resolver los ejercicios de recursión simple y recursión mutua.",
      subtasks: []
    },
    {
      id: "c3",
      column: "pending",
      title: "Leer cap. 7 — Punteros",
      dueDate: "",
      description: "Leer el capítulo sobre punteros y referencias de memoria del libro oficial.",
      subtasks: []
    },
    {
      id: "c4",
      column: "progress",
      title: "Ejercicios de repaso — Parcial 2",
      dueDate: "2026-06-20T18:00:00",
      description: "Ejercicios prácticos con punteros y arrays dinámicos.",
      subtasks: [
        { id: "s3", text: "Repasar aritmética de punteros", completed: true }
      ]
    },
    {
      id: "c5",
      column: "done",
      title: "TP N°1 — Hola Mundo y variables",
      dueDate: "2026-05-10T23:59:00",
      description: "Primer trabajo práctico de presentación de variables básicas.",
      subtasks: []
    }
  ];

  const defaultBookmarks = [
    { id: "b1", url: "https://youtube.com/watch?v=zuegQmMdy8M", title: "Tutorial punteros en C — YouTube" },
    { id: "b2", url: "https://stackoverflow.com/questions/1538420", title: "StackOverflow — diferencia malloc vs calloc" }
  ];

  async function loadAppState() {
    if (!selectedMateriaId) {
      tasks = [];
      bookmarks = [];
      renderKanban();
      renderBookmarks();
      return;
    }

    const localTasks = localStorage.getItem('cursus_tasks_v2');
    const savedLocalTasks = localTasks ? JSON.parse(localTasks) : [];
    
    // [REAL API] Cargar tareas desde la Base de Datos
    try {
      const response = await fetch(`${API_BASE}/tareas?materia_id=${selectedMateriaId}`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error();
      const dbTasks = await response.json();
      
      tasks = dbTasks.map(t => {
          const localMatches = savedLocalTasks.find(lt => lt.id == t.id);
          return {
              id: String(t.id),
              column: COLUMNA_DB_TO_UI[t.columna] || 'pending',
              title: t.titulo,
              dueDate: t.fecha_vencimiento ? t.fecha_vencimiento.split('T')[0] : "",
              description: localMatches ? localMatches.description : "",
              subtasks: localMatches ? localMatches.subtasks : [] // [MOCK API]
          };
      });
    } catch (e) {
      console.error("Error cargando tareas DB", e);
      tasks = [];
    }

    // [REAL API] Cargar marcadores desde la Base de Datos
    try {
      const response = await fetch(`${API_BASE}/marcadores?materia_id=${selectedMateriaId}`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error();
      const dbBookmarks = await response.json();
      
      bookmarks = dbBookmarks.map(b => ({
          id: String(b.id),
          url: b.url,
          title: b.titulo || b.url
      }));
    } catch (e) {
      console.error("Error cargando marcadores DB", e);
      bookmarks = [];
    }
    
    renderKanban();
    renderBookmarks();
  }

  function saveTasksToLocal() {
    localStorage.setItem('cursus_tasks_v2', JSON.stringify(tasks));
  }

  function saveBookmarksToLocal() {
    localStorage.setItem('cursus_bookmarks_v2', JSON.stringify(bookmarks));
  }

  /* ==========================================================================
     TEMPORIZADOR POMODORO (STATE MACHINE + LOCALSTORAGE)
     ========================================================================== */
  const CIRC = 2 * Math.PI * 65; // r=65 -> ~408.4

  let pomoSettings = {
    focusTime: 25,
    shortBreak: 5,
    longBreak: 20,
    sessionsPerCycle: 4,
    totalCycles: null // Null = infinito
  };

  let pomoState = {
    fase_actual: 'enfoque', // 'enfoque', 'descanso_corto', 'descanso_largo'
    estado_reloj: 'detenido', // 'corriendo', 'pausado', 'detenido'
    tiempo_restante: 25 * 60, // Segundos
    timestamp_ultimo_cambio: 0
  };

  let pomoCycles = {
    ciclo_actual: 1,
    sesiones_completadas_hoy: 0,
    log: [] // [{ time: "14:05", duration: "25:00", status: "✓ Completada" }]
  };

  let pomoTicker = null;

  function initPomodoro() {
    // 1. Cargar configuraciones
    const localSettings = localStorage.getItem('cursus_pomo_settings_v2');
    if (localSettings) pomoSettings = JSON.parse(localSettings);

    const activePreset = localStorage.getItem('cursus_pomo_active_preset') || 'classic';
    document.querySelectorAll('.pomo-preset-btn').forEach(b => b.classList.remove('active'));
    const btnPreset = document.getElementById('preset-' + activePreset);
    if (btnPreset) btnPreset.classList.add('active');
    
    const settingsBtn = document.getElementById('pomo-settings-btn');
    if (settingsBtn) {
      settingsBtn.style.display = (activePreset === 'custom') ? 'inline-block' : 'none';
    }

    // 2. Cargar ciclos
    const localCycles = localStorage.getItem('cursus_pomo_ciclos_v2');
    if (localCycles) pomoCycles = JSON.parse(localCycles);

    // 3. Cargar estado y evaluar auto-pausa/offline
    const localState = localStorage.getItem('cursus_pomo_estado_v2');
    if (localState) {
      const savedState = JSON.parse(localState);
      
      // Chequear abandono de 4 horas
      const now = Date.now();
      const hoursPassed = (now - savedState.timestamp_ultimo_cambio) / (1000 * 60 * 60);
      
      if (savedState.timestamp_ultimo_cambio > 0 && hoursPassed >= 4) {
        // Abandonada: reiniciar a default
        showToast("Sesión de estudio anterior expirada por inactividad (>4 hs)", "warn");
        resetToDefaultPomoState();
      } else {
        pomoState = savedState;
        
        // Si estaba corriendo, evaluar tiempo offline
        if (pomoState.estado_reloj === 'corriendo') {
          const secondsAbsent = Math.floor((now - pomoState.timestamp_ultimo_cambio) / 1000);
          
          if (secondsAbsent <= 120) {
            // Recarga rápida: descontar y seguir corriendo
            pomoState.tiempo_restante -= secondsAbsent;
            pomoState.timestamp_ultimo_cambio = now;
            
            if (pomoState.tiempo_restante <= 0) {
              handleFaseComplete();
            } else {
              startTicker();
            }
          } else {
            // Ausencia prolongada: aplicar Auto-Pausa y descontar exactamente 120s
            pomoState.tiempo_restante -= 120;
            pomoState.estado_reloj = 'pausado';
            pomoState.timestamp_ultimo_cambio = now;
            
            if (pomoState.tiempo_restante < 0) pomoState.tiempo_restante = 0;
            
            savePomoStateToLocal();
            showToast("Auto-Pausa: se detectó inactividad prolongada. Se descontaron 120 segundos.", "warn");
          }
        }
      }
    } else {
      resetToDefaultPomoState();
    }

    updatePomoUI();
  }

  function resetToDefaultPomoState() {
    pomoState.fase_actual = 'enfoque';
    pomoState.estado_reloj = 'detenido';
    pomoState.tiempo_restante = pomoSettings.focusTime * 60;
    pomoState.timestamp_ultimo_cambio = Date.now();
    savePomoStateToLocal();
  }

  function savePomoStateToLocal() {
    pomoState.timestamp_ultimo_cambio = Date.now();
    localStorage.setItem('cursus_pomo_estado_v2', JSON.stringify(pomoState));
  }

  function savePomoCyclesToLocal() {
    localStorage.setItem('cursus_pomo_ciclos_v2', JSON.stringify(pomoCycles));
  }

  function updatePomoUI() {
    // 1. Reloj texto
    const min = Math.floor(pomoState.tiempo_restante / 60);
    const sec = pomoState.tiempo_restante % 60;
    document.getElementById('ptime').textContent = `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;

    // 2. Subtítulo (Sesión X de Y)
    let faseTxt = 'Enfoque';
    if (pomoState.fase_actual === 'descanso_corto') faseTxt = 'Descanso Corto';
    if (pomoState.fase_actual === 'descanso_largo') faseTxt = 'Descanso Largo';
    
    document.getElementById('psub').textContent = `${faseTxt} · Sesión ${pomoCycles.ciclo_actual} de ${pomoSettings.sessionsPerCycle}`;

    // 3. Progreso del Ring SVG
    let totalSec = pomoSettings.focusTime * 60;
    if (pomoState.fase_actual === 'descanso_corto') totalSec = pomoSettings.shortBreak * 60;
    if (pomoState.fase_actual === 'descanso_largo') totalSec = pomoSettings.longBreak * 60;

    const pct = pomoState.tiempo_restante / totalSec;
    const rp = document.getElementById('rp');
    rp.style.strokeDasharray = CIRC;
    rp.style.strokeDashoffset = CIRC * (1 - pct);

    // 4. Glow del Ring si está corriendo
    const wrap = document.getElementById('ring-wrap');
    if (pomoState.estado_reloj === 'corriendo') {
      wrap.classList.add('glow');
      document.getElementById('play-btn').textContent = '⏸';
      document.getElementById('play-btn').classList.add('running');
    } else {
      wrap.classList.remove('glow');
      document.getElementById('play-btn').textContent = '▶';
      document.getElementById('play-btn').classList.remove('running');
    }

    // 5. Presets active tabs
    document.querySelectorAll('.pomo-preset-btn').forEach(btn => btn.classList.remove('active'));
    
    const activePreset = localStorage.getItem('cursus_pomo_active_preset') || 'classic';
    const activeBtn = document.getElementById('preset-' + activePreset);
    if (activeBtn) activeBtn.classList.add('active');
    
    const settingsBtn = document.getElementById('pomo-settings-btn');
    if (settingsBtn) {
      settingsBtn.style.display = (activePreset === 'custom') ? 'inline-block' : 'none';
    }

    // 6. Dots de progreso
    const dotsContainer = document.getElementById('pomo-dots');
    dotsContainer.innerHTML = '';
    for (let i = 1; i <= pomoSettings.sessionsPerCycle; i++) {
      const dot = document.createElement('div');
      dot.className = `dot ${i < pomoCycles.ciclo_actual ? 'done' : ''}`;
      dotsContainer.appendChild(dot);
    }

    // 7. Registro de sesiones y chip de estadísticas
    const logList = document.getElementById('slog-list');
    logList.innerHTML = '';
    pomoCycles.log.forEach(row => {
      const div = document.createElement('div');
      div.className = 'slog-row';
      div.innerHTML = `
        <span class="slog-t">${row.time}</span>
        <span class="slog-d">${row.duration}</span>
        <span class="slog-ok">${row.status}</span>
      `;
      logList.appendChild(div);
    });

    // Las estadísticas superiores se actualizan con datos reales del backend (loadMateriaResumen).
  }

  function startTicker() {
    clearInterval(pomoTicker);
    pomoTicker = setInterval(() => {
      if (pomoState.tiempo_restante > 0) {
        pomoState.tiempo_restante--;
        // Guardar estado cada segundo en memoria RAM, y defensivamente al recargar
        pomoState.timestamp_ultimo_cambio = Date.now();
        // Para no degradar LocalStorage escribiendo cada segundo, escribimos cada 10s
        if (pomoState.tiempo_restante % 10 === 0) {
          localStorage.setItem('cursus_pomo_estado_v2', JSON.stringify(pomoState));
        }
        updatePomoUI();
      } else {
        handleFaseComplete();
      }
    }, 1000);
  }

  function togglePomo() {
    if (pomoState.estado_reloj === 'corriendo') {
      // Pausar
      pomoState.estado_reloj = 'pausado';
      clearInterval(pomoTicker);
      savePomoStateToLocal();
      updatePomoUI();
      
      mockFetch('/api/sesiones/pausar', { method: 'POST' })
        .then(() => showToast("Temporizador pausado en el servidor", "success"))
        .catch(err => showToast(err.message, "error"));
    } else {
      // Reanudar/Iniciar
      const isNew = pomoState.estado_reloj === 'detenido';
      pomoState.estado_reloj = 'corriendo';
      savePomoStateToLocal();
      startTicker();
      updatePomoUI();

      const endpoint = isNew ? '/api/sesiones/iniciar' : '/api/sesiones/reanudar';
      mockFetch(endpoint, { method: 'POST' })
        .then(() => showToast(isNew ? "Sesión de estudio iniciada en servidor" : "Sesión reanudada en servidor", "success"))
        .catch(err => showToast(err.message, "error"));
    }
  }

  function handleFaseComplete() {
    clearInterval(pomoTicker);
    pomoState.estado_reloj = 'detenido';

    if (pomoState.fase_actual === 'enfoque') {
      // Completó enfoque
      pomoCycles.sesiones_completadas_hoy++;
      
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      pomoCycles.log.unshift({
        time: hhmm,
        duration: `${pomoSettings.focusTime}:00`,
        status: "✓ Completada"
      });

      // Validar si toca descanso corto o largo
      if (pomoCycles.ciclo_actual < pomoSettings.sessionsPerCycle) {
        pomoState.fase_actual = 'descanso_corto';
        pomoState.tiempo_restante = pomoSettings.shortBreak * 60;
        pomoCycles.ciclo_actual++;
      } else {
        pomoState.fase_actual = 'descanso_largo';
        pomoState.tiempo_restante = pomoSettings.longBreak * 60;
        pomoCycles.ciclo_actual = 1; // Resetea ciclo al terminar descanso largo
      }

      showToast("¡Buen trabajo! Sesión de enfoque completada. Hora de descansar.", "success");
      
      // [REAL API] Registrar sesión completada
      if (selectedMateriaId) {
          fetch(`${API_BASE}/pomodoro/sesiones`, { 
            method: 'POST', 
            headers: getAuthHeaders(),
            body: JSON.stringify({ materia_id: selectedMateriaId, duracion_segundos: pomoSettings.focusTime * 60 }) 
          }).then(() => loadMateriaResumen()).catch(e => console.error(e));
      }

    } else {
      // Completó descanso
      pomoState.fase_actual = 'enfoque';
      pomoState.tiempo_restante = pomoSettings.focusTime * 60;
      showToast("El descanso ha terminado. ¡A enfocar nuevamente!", "success");
    }

    savePomoStateToLocal();
    savePomoCyclesToLocal();
    updatePomoUI();
  }

  function resetPomo() {
    if (pomoState.estado_reloj === 'detenido') return;
    
    openConfirm("¿Desea reiniciar el temporizador actual? Se registrará el progreso parcial en el servidor.", () => {
      clearInterval(pomoTicker);
      
      if (pomoState.fase_actual === 'enfoque') {
        // Guardar parcial
        const totalSec = pomoSettings.focusTime * 60;
        const elapsedMin = Math.floor((totalSec - pomoState.tiempo_restante) / 60);
        
        if (elapsedMin > 0) {
          const now = new Date();
          const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
          pomoCycles.log.unshift({
            time: hhmm,
            duration: `${elapsedMin}:00`,
            status: "⚠ Parcial"
          });
          savePomoCyclesToLocal();
          
          mockFetch('/api/sesiones/finalizar', { 
            method: 'POST', 
            body: JSON.stringify({ estado: 'completada_parcial', duracion: elapsedMin }) 
          });
        }
      }

      resetToDefaultPomoState();
      updatePomoUI();
      showToast("Temporizador reiniciado", "success");
    });
  }

  function skipPomo() {
    openConfirm("¿Desea saltar la fase actual?", () => {
      clearInterval(pomoTicker);

      if (pomoState.fase_actual === 'enfoque') {
        // Enviar parcial al backend
        const totalSec = pomoSettings.focusTime * 60;
        const elapsedMin = Math.floor((totalSec - pomoState.tiempo_restante) / 60);
        
        if (elapsedMin > 0) {
          const now = new Date();
          const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
          pomoCycles.log.unshift({
            time: hhmm,
            duration: `${elapsedMin}:00`,
            status: "⚠ Parcial"
          });
          savePomoCyclesToLocal();

          mockFetch('/api/sesiones/finalizar', { 
            method: 'POST', 
            body: JSON.stringify({ estado: 'completada_parcial', duracion: elapsedMin }) 
          });
        }

        // Avanzar a descanso
        if (pomoCycles.ciclo_actual < pomoSettings.sessionsPerCycle) {
          pomoState.fase_actual = 'descanso_corto';
          pomoState.tiempo_restante = pomoSettings.shortBreak * 60;
          pomoCycles.ciclo_actual++;
        } else {
          pomoState.fase_actual = 'descanso_largo';
          pomoState.tiempo_restante = pomoSettings.longBreak * 60;
          pomoCycles.ciclo_actual = 1;
        }
      } else {
        // Saltear descanso es puramente local
        pomoState.fase_actual = 'enfoque';
        pomoState.tiempo_restante = pomoSettings.focusTime * 60;
      }

      pomoState.estado_reloj = 'detenido';
      savePomoStateToLocal();
      updatePomoUI();
      showToast("Fase salteada", "success");
    });
  }

  function setPreset(type) {
    if (pomoState.estado_reloj === 'corriendo') {
      showToast("Pausa el temporizador antes de cambiar de modo", "warn");
      return;
    }

    document.querySelectorAll('.pomo-preset-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById('preset-' + type);
    if (activeBtn) activeBtn.classList.add('active');

    const settingsBtn = document.getElementById('pomo-settings-btn');
    if (settingsBtn) {
      settingsBtn.style.display = (type === 'custom') ? 'inline-block' : 'none';
    }

    if (type === 'classic') {
      pomoSettings.focusTime = 25;
      pomoSettings.shortBreak = 5;
      pomoSettings.longBreak = 20;
      pomoSettings.sessionsPerCycle = 4;
      pomoSettings.totalCycles = null;
    } else if (type === 'deep') {
      pomoSettings.focusTime = 50;
      pomoSettings.shortBreak = 10;
      pomoSettings.longBreak = 30;
      pomoSettings.sessionsPerCycle = 4;
      pomoSettings.totalCycles = null;
    } else if (type === 'short') {
      pomoSettings.focusTime = 15;
      pomoSettings.shortBreak = 3;
      pomoSettings.longBreak = 15;
      pomoSettings.sessionsPerCycle = 4;
      pomoSettings.totalCycles = null;
    } else if (type === 'custom') {
      const savedCustom = localStorage.getItem('cursus_pomo_custom_settings');
      if (savedCustom) {
        const cSet = JSON.parse(savedCustom);
        pomoSettings.focusTime = cSet.focusTime;
        pomoSettings.shortBreak = cSet.shortBreak;
        pomoSettings.longBreak = cSet.longBreak;
        pomoSettings.sessionsPerCycle = cSet.sessionsPerCycle;
        pomoSettings.totalCycles = cSet.totalCycles;
      } else {
        pomoSettings.focusTime = 25;
        pomoSettings.shortBreak = 5;
        pomoSettings.longBreak = 20;
        pomoSettings.sessionsPerCycle = 4;
        pomoSettings.totalCycles = null;
        localStorage.setItem('cursus_pomo_custom_settings', JSON.stringify(pomoSettings));
      }
    }

    localStorage.setItem('cursus_pomo_settings_v2', JSON.stringify(pomoSettings));
    localStorage.setItem('cursus_pomo_active_preset', type);
    resetToDefaultPomoState();
    updatePomoUI();
    showToast(`Preset aplicado: ${type.toUpperCase()}`, "success");
  }

  // Modal Ajustes Personalizados
  function openCustomPomoModal() {
    if (pomoState.estado_reloj === 'corriendo') {
      showToast("Pausa el temporizador antes de cambiar ajustes", "warn");
      return;
    }
    
    document.getElementById('custom-pomo-focus').value = pomoSettings.focusTime;
    document.getElementById('custom-pomo-short').value = pomoSettings.shortBreak;
    document.getElementById('custom-pomo-long').value = pomoSettings.longBreak;
    document.getElementById('custom-pomo-sessions').value = pomoSettings.sessionsPerCycle;
    document.getElementById('custom-pomo-cycles').value = pomoSettings.totalCycles || "infinite";
    
    document.getElementById('pomo-validation-error').style.display = 'none';
    document.getElementById('pomo-custom-modal').classList.add('show');
  }

  function closeCustomPomoModal() {
    document.getElementById('pomo-custom-modal').classList.remove('show');
  }

  function saveCustomPomoSettings() {
    const focus = parseInt(document.getElementById('custom-pomo-focus').value);
    const short = parseInt(document.getElementById('custom-pomo-short').value);
    const long = parseInt(document.getElementById('custom-pomo-long').value);
    const sessions = parseInt(document.getElementById('custom-pomo-sessions').value);
    const cycleVal = document.getElementById('custom-pomo-cycles').value;
    const cycles = cycleVal === 'infinite' ? null : parseInt(cycleVal);

    // Validaciones
    const errorDiv = document.getElementById('pomo-validation-error');
    errorDiv.style.display = 'none';

    if (isNaN(focus) || focus < 1 || focus > 90) {
      errorDiv.textContent = "El enfoque debe estar entre 1 y 90 minutos.";
      errorDiv.style.display = 'block';
      return;
    }
    if (isNaN(short) || short < 1 || short > 30) {
      errorDiv.textContent = "El descanso corto debe estar entre 1 y 30 minutos.";
      errorDiv.style.display = 'block';
      return;
    }
    if (isNaN(long) || long < 5 || long > 60) {
      errorDiv.textContent = "El descanso largo debe estar entre 5 y 60 minutos.";
      errorDiv.style.display = 'block';
      return;
    }
    if (isNaN(sessions) || sessions < 1 || sessions > 8) {
      errorDiv.textContent = "Las sesiones por ciclo deben ser entre 1 y 8.";
      errorDiv.style.display = 'block';
      return;
    }

    // Regla 1: Descanso Corto < Tiempo de Enfoque
    if (short >= focus) {
      errorDiv.textContent = "Restricción: El descanso corto debe ser estrictamente menor que el tiempo de enfoque.";
      errorDiv.style.display = 'block';
      return;
    }

    // Regla 2: Descanso Largo >= Descanso Corto
    if (long < short) {
      errorDiv.textContent = "Restricción: El descanso largo debe ser mayor o igual que el descanso corto.";
      errorDiv.style.display = 'block';
      return;
    }

    // Guardar
    pomoSettings.focusTime = focus;
    pomoSettings.shortBreak = short;
    pomoSettings.longBreak = long;
    pomoSettings.sessionsPerCycle = sessions;
    pomoSettings.totalCycles = cycles;

    localStorage.setItem('cursus_pomo_custom_settings', JSON.stringify({
      focusTime: focus,
      shortBreak: short,
      longBreak: long,
      sessionsPerCycle: sessions,
      totalCycles: cycles
    }));

    localStorage.setItem('cursus_pomo_settings_v2', JSON.stringify(pomoSettings));
    closeCustomPomoModal();
    resetToDefaultPomoState();
    updatePomoUI();
    showToast("Ajustes personalizados aplicados con éxito", "success");
  }

  // Escuchas defensivas para guardar estado antes de abandonar la pestaña
  window.addEventListener('beforeunload', () => {
    if (pomoState.estado_reloj === 'corriendo') {
      pomoState.timestamp_ultimo_cambio = Date.now();
      localStorage.setItem('cursus_pomo_estado_v2', JSON.stringify(pomoState));
    }
  });

  /* ==========================================================================
     TABLERO KANBAN: RENDERIZACIÓN & ACCIONES
     ========================================================================== */
  function renderKanban() {
    const cols = ['pending', 'progress', 'done'];
    
    cols.forEach(col => {
      const container = document.getElementById(`cards-${col}`);
      container.innerHTML = '';
      
      const colTasks = tasks.filter(t => t.column === col);
      document.getElementById(`cnt-${col}`).textContent = colTasks.length;

      colTasks.forEach(task => {
        const card = document.createElement('div');
        card.className = 'kbcard';
        card.id = task.id;
        card.draggable = true;
        
        // Drag events
        card.addEventListener('dragstart', (e) => dragStart(e, task.id));
        card.addEventListener('dragend', dragEnd);
        
        // Clic para abrir modal de detalle
        card.addEventListener('click', (e) => {
          // Si hace clic en eliminar, no abrir modal
          if (e.target.closest('.kb-del')) return;
          openTaskModal(task.id);
        });

        // Crear meta indicators
        let metaHtml = '';
        if (task.dueDate) {
          const [y, m, d] = task.dueDate.split('-');
          const date = new Date(y, m - 1, d);
          const currentYear = new Date().getFullYear();
          let dateStr = date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
          if (date.getFullYear() !== currentYear) {
            dateStr += ` ${date.getFullYear()}`;
          }
          
          // Urgencia si vence hoy/antes y no está finalizado
          const today = new Date();
          today.setHours(0,0,0,0);
          const isOverdue = date < today && task.column !== 'done';
          metaHtml += `
            <div class="kb-meta ${isOverdue ? 'urg' : ''}">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 1v2M11 1v2M2 6h12"/></svg>
              <span>Vence ${dateStr}</span>
            </div>
          `;
        }

        if (task.subtasks && task.subtasks.length > 0) {
          const completed = task.subtasks.filter(s => s.completed).length;
          metaHtml += `
            <div class="kb-meta">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="10" height="10" rx="1.5"/><path d="M6 8l1.5 1.5L10 6" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>Subtareas ${completed}/${task.subtasks.length}</span>
            </div>
          `;
        }

        card.innerHTML = `
          <div class="kb-title">${escapeHTML(task.title)}</div>
          <div class="kb-meta-wrap">${metaHtml}</div>
          <button class="kb-del" title="Eliminar tarea">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h10M5 6v7a1 1 0 001 1h4a1 1 0 001-1V6M6 3.5V2a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1.5"/></svg>
          </button>
        `;

        // Botón eliminar rápido
        card.querySelector('.kb-del').addEventListener('click', () => {
          openConfirm(`¿Desea eliminar la tarea "${task.title}"?`, () => {
            deleteTask(task.id);
          });
        });

        container.appendChild(card);
      });
    });
  }

  // Flujo Creación Inline
  function showInlineAddCardForm(col) {
    // Cerrar cualquier otro formulario abierto
    cancelAllInlineForms();

    const container = document.getElementById(`add-form-container-${col}`);
    const btnAdd = document.getElementById(`btn-add-${col}`);
    
    btnAdd.style.display = 'none';

    const form = document.createElement('div');
    form.className = 'kb-add-form';
    form.id = `inline-form-${col}`;
    form.innerHTML = `
      <textarea class="kb-add-inp" id="inline-inp-${col}" placeholder="Introduce el título de la tarea..." required></textarea>
      <div class="kb-add-btns">
        <button class="kb-add-btn-save" onclick="saveInlineCard('${col}')">Añadir tarea</button>
        <button class="kb-add-btn-cancel" onclick="cancelInlineAddCard('${col}')">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9"/></svg>
        </button>
      </div>
    `;

    container.appendChild(form);
    const textarea = form.querySelector('textarea');
    textarea.focus();

    // Auto-save on enter
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveInlineCard(col);
      }
    });

    // Cancelación o Guardado Implícito en Blur
    // Se evalúa después de un brevísimo timeout para no pisar el clic explícito de guardar o cancelar
    textarea.addEventListener('blur', (e) => {
      setTimeout(() => {
        const activeEl = document.activeElement;
        // Si el foco se fue a elementos del mismo formulario, no hacer nada
        if (activeEl && activeEl.closest(`#inline-form-${col}`)) return;
        
        const title = textarea.value.trim();
        if (title) {
          saveInlineCard(col);
        } else {
          cancelInlineAddCard(col);
        }
      }, 150);
    });
  }

  function cancelInlineAddCard(col) {
    const form = document.getElementById(`inline-form-${col}`);
    if (form) form.remove();
    document.getElementById(`btn-add-${col}`).style.display = 'block';
  }

  function cancelAllInlineForms() {
    ['pending', 'progress', 'done'].forEach(col => cancelInlineAddCard(col));
  }

  function saveInlineCard(col) {
    const input = document.getElementById(`inline-inp-${col}`);
    if (!input) return;
    const title = input.value.trim();
    if (!title) {
      cancelInlineAddCard(col);
      return;
    }

    // [REAL API] Crear tarea
    if (!selectedMateriaId) { showToast("Elegí una materia primero", "warn"); return; }
    
    cancelInlineAddCard(col);
    
    fetch(`${API_BASE}/tareas`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ materia_id: selectedMateriaId, titulo: title })
    }).then(async (res) => {
      if (!res.ok) throw new Error();
      await loadAppState(); // Recargar desde BD para tener el ID real
      showToast("Tarea agregada exitosamente", "success");
    }).catch(e => showToast("Error creando tarea", "error"));
  }

  function deleteTask(id) {
    const taskToDelete = tasks.find(t => t.id === id);
    if (!taskToDelete) return;

    // Optimista
    tasks = tasks.filter(t => t.id !== id);
    saveTasksToLocal();
    renderKanban();

    // [REAL API] Eliminar tarea
    fetch(`${API_BASE}/tareas/${id}`, { method: 'DELETE', headers: getAuthHeaders() })
      .then(async (res) => {
          if (!res.ok) throw new Error();
          showToast("Tarea eliminada", "success");
      })
      .catch(err => showToast("Error al eliminar", "error"));
  }

  /* ==========================================================================
     DRAG & DROP CON OPTIMISTIC UI Y ROLLBACK
     ========================================================================== */
  let dragId = null;
  let dragOriginalCol = null;
  let dragOriginalSibling = null;

  function dragStart(e, id) {
    dragId = id;
    const card = document.getElementById(id);
    dragOriginalCol = tasks.find(t => t.id === id).column;
    dragOriginalSibling = card.nextSibling;
    
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => card.classList.add('dragging'), 0);
  }

  function dragEnd(e) {
    e.target.classList.remove('dragging');
  }

  function allowDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.add('over');
  }

  function leaveDrop(e) {
    e.currentTarget.classList.remove('over');
  }

  function dropCard(e, col) {
    e.preventDefault();
    e.currentTarget.classList.remove('over');
    if (!dragId) return;

    const card = document.getElementById(dragId);
    if (!card) return;

    const cardsContainer = document.getElementById(`cards-${col}`);
    const taskObj = tasks.find(t => t.id === dragId);
    
    // Mover nodo optimísticamente en el DOM
    cardsContainer.appendChild(card);
    
    // Sincronizar en memoria temporal
    const oldCol = taskObj.column;
    taskObj.column = col;
    updateCounts();

    // [REAL API] Actualizar columna
    const currentDragId = dragId;
    fetch(`${API_BASE}/tareas/${currentDragId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ columna: COLUMNA_UI_TO_DB[col] })
    })
    .then(async (res) => {
      if (!res.ok) throw new Error();
      saveTasksToLocal();
      renderKanban(); // Re-renderizar para limpiar orden, etc.
    })
    .catch(err => {
      // Rollback visual
      taskObj.column = oldCol;
      updateCounts();

      // Devolver al contenedor original antes del hermano correspondiente
      const origContainer = document.getElementById(`cards-${oldCol}`);
      if (dragOriginalSibling && dragOriginalSibling.parentNode === origContainer) {
        origContainer.insertBefore(card, dragOriginalSibling);
      } else {
        origContainer.appendChild(card);
      }

      // Animación de Falla CSS Shake
      card.classList.add('kb-error-shake');
      setTimeout(() => card.classList.remove('kb-error-shake'), 350);

      showToast("Error moviendo tarea", "error");
    });

    dragId = null;
  }

  function updateCounts() {
    ['pending','progress','done'].forEach(col => {
      const n = tasks.filter(t => t.column === col).length;
      document.getElementById(`cnt-${col}`).textContent = n;
    });
  }

  /* ==========================================================================
     MODAL DE EDICIÓN DE TAREA (DETALLES Y SUBTAREAS)
     ========================================================================== */
  let currentEditingTaskId = null;
  let subtasksTempList = []; // Lista de subtareas en memoria temporal del modal

  function openTaskModal(id) {
    currentEditingTaskId = id;
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    document.getElementById('task-modal-col-name').textContent = translateCol(task.column);
    document.getElementById('task-modal-title').value = task.title;
    
    let dueStr = "";
    if (task.dueDate) {
      dueStr = task.dueDate.length === 10 ? task.dueDate + "T00:00" : task.dueDate.substring(0, 16);
    }
    document.getElementById('task-modal-due').value = dueStr;
    
    document.getElementById('task-modal-desc').value = task.description || "";
    
    // Clonar subtareas para edición local en el modal
    subtasksTempList = task.subtasks ? JSON.parse(JSON.stringify(task.subtasks)) : [];
    
    renderModalSubtasks();
    hideSubtaskAddInput();
    
    document.getElementById('task-modal').classList.add('show');
  }

  function closeTaskModal() {
    document.getElementById('task-modal').classList.remove('show');
    currentEditingTaskId = null;
  }

  function translateCol(col) {
    if (col === 'pending') return 'Pendiente';
    if (col === 'progress') return 'En Curso';
    if (col === 'done') return 'Finalizado';
    return col;
  }

  // Autocompletar la hora 23:59:00 si el usuario solo selecciona fecha
  function handleDateAutocomplete(input) {
    if (!input.value) return;
    // datetime-local contiene T. Si el valor termina en T00:00 o no tiene hora explícita
    // En navegadores genéricos el input de fecha devuelve YYYY-MM-DDTHH:MM
    // Si la hora es 00:00, consultamos si es la de defecto o rellenamos 23:59
    const parts = input.value.split('T');
    if (parts.length === 2 && parts[1] === '00:00') {
      input.value = `${parts[0]}T23:59:00`;
    }
  }

  function renderModalSubtasks() {
    const list = document.getElementById('task-modal-subtasks-list');
    list.innerHTML = '';

    subtasksTempList.forEach((sub, index) => {
      const item = document.createElement('div');
      item.className = 'subtask-item';
      item.innerHTML = `
        <input type="checkbox" class="subtask-chk" ${sub.completed ? 'checked' : ''} onchange="toggleSubtaskStatus(${index})">
        <span class="subtask-txt ${sub.completed ? 'done' : ''}" contenteditable="true" onblur="saveSubtaskText(${index}, this)" onkeydown="handleSubtaskEnter(event, ${index}, this)">${escapeHTML(sub.text)}</span>
        <div class="subtask-del" title="Eliminar subtarea" onclick="deleteSubtask(${index})">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h10M5 6v7a1 1 0 001 1h4a1 1 0 001-1V6M6 3.5V2a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1.5"/></svg>
        </div>
      `;
      list.appendChild(item);
    });
  }

  function toggleSubtaskStatus(index) {
    subtasksTempList[index].completed = !subtasksTempList[index].completed;
    renderModalSubtasks();
    
    // Guardar inmediatamente si queremos reflejar instantáneamente en DB según especificaciones
    saveTaskSubtasksStateOnly();
  }

  // [MOCK API] Subtareas simuladas
  function saveSubtaskText(index, element) {
    const newText = element.textContent.trim();
    if (newText) {
      subtasksTempList[index].text = newText;
    } else {
      // Si se deja vacío, restaurar valor anterior
      element.textContent = subtasksTempList[index].text;
    }
    saveTaskSubtasksStateOnly();
  }

  function handleSubtaskEnter(e, index, element) {
    if (e.key === 'Enter') {
      e.preventDefault();
      element.blur();
    }
  }

  function deleteSubtask(index) {
    subtasksTempList.splice(index, 1);
    renderModalSubtasks();
    saveTaskSubtasksStateOnly();
  }

  function showSubtaskAddInput() {
    document.getElementById('subtask-add-form').style.display = 'flex';
    document.getElementById('btn-show-subtask-add').style.display = 'none';
    document.getElementById('subtask-new-txt').value = '';
    document.getElementById('subtask-new-txt').focus();
    
    // Configurar Enter para añadir subtarea
    document.getElementById('subtask-new-txt').onkeydown = function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveNewSubtask();
      }
    };
  }

  function hideSubtaskAddInput() {
    document.getElementById('subtask-add-form').style.display = 'none';
    document.getElementById('btn-show-subtask-add').style.display = 'inline-flex';
  }

  function saveNewSubtask() {
    const input = document.getElementById('subtask-new-txt');
    const text = input.value.trim();
    if (!text) {
      hideSubtaskAddInput();
      return;
    }

    subtasksTempList.push({
      id: `s_${Date.now()}`,
      text: text,
      completed: false
    });

    renderModalSubtasks();
    hideSubtaskAddInput();
    saveTaskSubtasksStateOnly();
  }

  // Guardar subtareas instantáneamente a la BD (Mocked)
  function saveTaskSubtasksStateOnly() {
    const task = tasks.find(t => t.id === currentEditingTaskId);
    if (!task) return;
    
    const oldSubtasks = JSON.parse(JSON.stringify(task.subtasks || []));
    task.subtasks = JSON.parse(JSON.stringify(subtasksTempList));
    saveTasksToLocal();
    renderKanban();

    mockFetch(`/api/subtareas/${task.id}`, {
      method: 'PUT',
      body: JSON.stringify({ subtasks: task.subtasks })
    })
    .catch(err => {
      // Rollback
      task.subtasks = oldSubtasks;
      subtasksTempList = JSON.parse(JSON.stringify(oldSubtasks));
      saveTasksToLocal();
      renderKanban();
      renderModalSubtasks();
      showToast(err.message, "error");
    });
  }

  // Guardar campos base (Título, Fecha, Descripción) desde el footer del Modal
  function saveTaskDetails() {
    const task = tasks.find(t => t.id === currentEditingTaskId);
    if (!task) return;

    const newTitle = document.getElementById('task-modal-title').value.trim();
    if (!newTitle) {
      showToast("El título de la tarea no puede estar vacío", "error");
      return;
    }

    // Copias para rollback
    const oldTitle = task.title;
    const oldDueDate = task.dueDate;
    const oldDesc = task.description;

    task.title = newTitle;
    task.dueDate = document.getElementById('task-modal-due').value;
    task.description = document.getElementById('task-modal-desc').value.trim();

    saveTasksToLocal();
    renderKanban();
    closeTaskModal();

    fetch(`${API_BASE}/tareas/${task.id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ titulo: task.title, fecha_vencimiento: task.dueDate || null })
    })
    .then(async (res) => {
      if (!res.ok) throw new Error();
      await loadAppState();
      showToast("Tarea actualizada exitosamente", "success");
    })
    .catch(err => {
      // Rollback
      task.title = oldTitle;
      task.dueDate = oldDueDate;
      task.description = oldDesc;
      saveTasksToLocal();
      renderKanban();
      showToast("Error actualizando tarea", "error");
    });
  }

  function deleteTaskFromModal() {
    if (!currentEditingTaskId) return;
    
    openConfirm("¿Desea eliminar esta tarea de forma permanente?", () => {
      const id = currentEditingTaskId;
      closeTaskModal();
      deleteTask(id);
    });
  }

  /* ==========================================================================
     BOVEDA DE MARCADORES: RENDERIZACIÓN & ACCIONES
     ========================================================================== */
  function renderBookmarks() {
    const container = document.getElementById('bm-list');
    container.innerHTML = '';

    bookmarks.forEach(bm => {
      const card = document.createElement('div');
      card.className = 'bm-item';
      card.id = 'bm-item-' + bm.id;

      // Extraer favicon oficial de Google API
      let hostname = '';
      try { hostname = new URL(bm.url).hostname; } catch(_) { hostname = 'link'; }
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;

      card.innerHTML = `
        <img class="bm-ic" src="${faviconUrl}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22%234f46e5%22><circle cx=%228%22 cy=%228%22 r=%226%22/></svg>'" alt="Logo">
        
        <!-- Normal info layout -->
        <div class="bm-inf">
          <div class="bm-name">${escapeHTML(bm.title || bm.url)}</div>
          <div class="bm-url">${escapeHTML(bm.url)}</div>
        </div>

        <!-- Inline Edit Inputs (Hidden by default) -->
        <div class="bm-edit-row">
          <input type="text" class="bm-edit-inp" id="bm-edit-title-${bm.id}" value="${escapeHTML(bm.title || '')}" placeholder="Título">
          <input type="url" class="bm-edit-inp url" id="bm-edit-url-${bm.id}" value="${escapeHTML(bm.url)}" placeholder="https://...">
          <div class="bm-edit-btns">
            <button class="bm-act-btn" onclick="saveBookmarkInlineEdit('${bm.id}')" title="Guardar">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 8l3 3 7-7" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <button class="bm-act-btn" onclick="cancelBookmarkInlineEdit('${bm.id}')" title="Cancelar">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9"/></svg>
            </button>
          </div>
        </div>

        <!-- Hover Actions -->
        <div class="bm-actions">
          <a class="bm-act-btn" href="${bm.url}" target="_blank" rel="noopener" title="Abrir enlace">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 4v4m0-4H8m4 0L6 10" stroke-linecap="round"/><circle cx="8" cy="8" r="6"/></svg>
          </a>
          <button class="bm-act-btn" onclick="startBookmarkInlineEdit('${bm.id}')" title="Editar marcador">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2.5a1.5 1.5 0 012 2l-8 8L2 13l.5-3.5 8-8z"/></svg>
          </button>
          <button class="bm-act-btn del" onclick="deleteBookmark('${bm.id}')" title="Eliminar marcador">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h10M5 6v7a1 1 0 001 1h4a1 1 0 001-1V6M6 3.5V2a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1.5"/></svg>
          </button>
        </div>
      `;
      container.appendChild(card);
    });
  }

  function addBookmark() {
    const urlInput = document.getElementById('bm-url');
    const titleInput = document.getElementById('bm-title');
    const btnSave = document.getElementById('btn-bm-save');
    
    const url = urlInput.value.trim();
    const title = titleInput.value.trim();

    if (!url) {
      showToast("Introduce una dirección URL válida", "error");
      return;
    }

    // Cambiar estado a cargando (Scraping Open Graph Sim)
    btnSave.disabled = true;
    btnSave.textContent = "Guardando...";

    // [REAL API] Crear marcador
    if (!selectedMateriaId) { showToast("Elegí una materia primero", "warn"); return; }
    
    fetch(`${API_BASE}/marcadores`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ materia_id: selectedMateriaId, url: url, titulo: title || null })
    })
    .then(async (res) => {
      if (!res.ok) throw new Error();
      await loadAppState();
      urlInput.value = '';
      titleInput.value = '';
      showToast("Marcador agregado con éxito", "success");
    })
    .catch(err => {
      showToast("Error al guardar marcador", "error");
    })
    .finally(() => {
      btnSave.disabled = false;
      btnSave.textContent = "Guardar";
    });
  }

  // Inline Edición de Marcadores
  function startBookmarkInlineEdit(id) {
    const item = document.getElementById('bm-item-' + id);
    if (item) item.classList.add('editing');
  }

  function cancelBookmarkInlineEdit(id) {
    const item = document.getElementById('bm-item-' + id);
    if (item) item.classList.remove('editing');
  }

  function saveBookmarkInlineEdit(id) {
    const bm = bookmarks.find(b => b.id === id);
    if (!bm) return;

    const newTitle = document.getElementById(`bm-edit-title-${id}`).value.trim();
    const newUrl = document.getElementById(`bm-edit-url-${id}`).value.trim();

    if (!newUrl) {
      showToast("La URL no puede quedar vacía", "error");
      return;
    }

    // Copias rollback
    const oldTitle = bm.title;
    const oldUrl = bm.url;

    bm.title = newTitle;
    bm.url = newUrl;
    
    saveBookmarksToLocal();
    renderBookmarks();

    fetch(`${API_BASE}/marcadores/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ url: newUrl, titulo: newTitle })
    })
    .then(async (res) => {
      if (!res.ok) throw new Error();
      await loadAppState();
      showToast("Marcador actualizado", "success");
    })
    .catch(err => {
      // Rollback
      bm.title = oldTitle;
      bm.url = oldUrl;
      saveBookmarksToLocal();
      renderBookmarks();
      showToast("Error al actualizar", "error");
    });
  }

  function deleteBookmark(id) {
    const bmToDelete = bookmarks.find(b => b.id === id);
    if (!bmToDelete) return;

    const index = bookmarks.indexOf(bmToDelete);
    
    // Remoción optimista
    bookmarks.splice(index, 1);
    saveBookmarksToLocal();
    renderBookmarks();

    fetch(`${API_BASE}/marcadores/${id}`, { method: 'DELETE', headers: getAuthHeaders() })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        await loadAppState();
        showToast("Marcador eliminado", "success");
      })
      .catch(err => {
        // Rollback
        bookmarks.splice(index, 0, bmToDelete);
        saveBookmarksToLocal();
        renderBookmarks();
        showToast("Error al eliminar", "error");
      });
  }

  /* ==========================================================================
     SOCIAL COMPONENT (Heartbeat / Compañeros)
     ========================================================================== */
  const mockStudents = [
    { name: "Laura G.", initials: "LG", state: "estudiando", time: "Hace 12 seg", pomodoros: 2, bg: "linear-gradient(135deg,#06b6d4,#0284c7)" },
    { name: "Franco M.", initials: "FM", state: "estudiando", time: "Hace 5 min", pomodoros: 1, bg: "linear-gradient(135deg,#8b5cf6,#7c3aed)" },
    { name: "Ana L.", initials: "AL", state: "descansando", time: "Hace 1 min", pomodoros: 3, bg: "linear-gradient(135deg,#f59e0b,#d97706)" },
    { name: "Mateo R.", initials: "MR", state: "estudiando", time: "Hace 18 min", pomodoros: 0, bg: "linear-gradient(135deg,#10b981,#059669)" }
  ];

  // [MOCK API] Panel social simulado
  function renderSocial() {
    const list = document.getElementById('social-list');
    list.innerHTML = '';

    mockStudents.forEach(st => {
      const user = document.createElement('div');
      user.className = 'cp-user';
      user.innerHTML = `
        <div class="cp-av ${st.state === 'descansando' ? 'descansando' : ''}" style="background: ${st.bg}">${st.initials}</div>
        <div class="cp-inf">
          <div class="cp-name">${st.name}</div>
        </div>
        <div class="cp-pom">${st.state === 'estudiando' ? '🍅' : '☕'} × ${st.pomodoros}</div>
      `;
      list.appendChild(user);
    });

    document.getElementById('social-active-count').textContent = `${mockStudents.length} activos en Programación II`;
  }

  // Simulación de Heartbeat Pings (Cada 60s)
  setInterval(() => {
    mockFetch('/api/presencia/ping', { method: 'POST' })
      .then(() => {
        // Simular actualizaciones aleatorias del estado de los compañeros
        const rand = Math.random();
        if (rand < 0.3) {
          // Cambiar estado
          const index = Math.floor(Math.random() * mockStudents.length);
          mockStudents[index].state = mockStudents[index].state === 'estudiando' ? 'descansando' : 'estudiando';
          mockStudents[index].time = "Hace 12 seg";
          if (mockStudents[index].state === 'estudiando' && Math.random() > 0.5) {
            mockStudents[index].pomodoros++;
          }
          renderSocial();
        }
      });
  }, 60000);

  /* ==========================================================================
     INTERFAZ Y MODAL AUXILIAR DE CONFIRMACIÓN / CONTACTO
     ========================================================================== */
  let confirmCallback = null;

  function openConfirm(text, callback) {
    confirmCallback = callback;
    document.getElementById('confirm-text').textContent = text;
    document.getElementById('confirm-modal').classList.add('show');
  }

  function closeConfirmModal() {
    document.getElementById('confirm-modal').classList.remove('show');
    confirmCallback = null;
  }

  document.getElementById('confirm-yes-btn').addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    closeConfirmModal();
  });




  // HTML Helpers
  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  /* ==========================================================================
     INICIO DE LA APLICACIÓN
     ========================================================================== */
  window.addEventListener('DOMContentLoaded', async () => {
    await loadMateriasCursando();
    initPomodoro();
    renderSocial();
  });

// Exponer funciones globales para que funcionen los eventos inline en Blade con type='module'
window.resetPomo = resetPomo;
window.togglePomo = togglePomo;
window.skipPomo = skipPomo;
window.setPreset = setPreset;
window.openCustomPomoModal = openCustomPomoModal;
window.closeCustomPomoModal = closeCustomPomoModal;
window.saveCustomPomoSettings = saveCustomPomoSettings;
window.showInlineAddCardForm = showInlineAddCardForm;
window.allowDrop = allowDrop;
window.leaveDrop = leaveDrop;
window.dropCard = dropCard;
window.addBookmark = addBookmark;
window.closeTaskModal = closeTaskModal;
window.handleDateAutocomplete = handleDateAutocomplete;
window.saveNewSubtask = saveNewSubtask;
window.hideSubtaskAddInput = hideSubtaskAddInput;
window.showSubtaskAddInput = showSubtaskAddInput;
window.deleteTaskFromModal = deleteTaskFromModal;
window.saveTaskDetails = saveTaskDetails;

window.closeConfirmModal = closeConfirmModal;

// Inline functions from JS dynamic creation
window.saveInlineCard = saveInlineCard;
window.cancelInlineAddCard = cancelInlineAddCard;
window.deleteTask = deleteTask;
window.startBookmarkInlineEdit = startBookmarkInlineEdit;
window.cancelBookmarkInlineEdit = cancelBookmarkInlineEdit;
window.saveBookmarkInlineEdit = saveBookmarkInlineEdit;
window.deleteBookmark = deleteBookmark;
window.toggleSubtaskStatus = toggleSubtaskStatus;
window.saveSubtaskText = saveSubtaskText;
window.handleSubtaskEnter = handleSubtaskEnter;
window.deleteSubtask = deleteSubtask;

/* ==================
   SELECTOR DE MATERIA
================== */
let materiasCursando = [];
let selectedMateriaId = null;

async function loadMateriasCursando() {
  try {
    const response = await fetch('/api/mis-materias', { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('No se pudieron cargar las materias');
    const data = await response.json();
    materiasCursando = data.filter(m => m.estado === 'cursando');
  } catch (e) {
    console.error(e);
    materiasCursando = [];
  }

  renderMateriaDropdown();

  if (materiasCursando.length === 0) {
    document.getElementById('mat-selector-name').textContent = 'Sin materias en curso';
    document.getElementById('mat-selector-badge').textContent = '—';
    return;
  }

  const saved = parseInt(localStorage.getItem('cursus_selected_materia'), 10);
  const savedValida = materiasCursando.find(m => m.id === saved);
  selectMateria(savedValida ? saved : materiasCursando[0].id);
}

function renderMateriaDropdown() {
  const dropdown = document.getElementById('materia-dropdown');
  dropdown.innerHTML = '';

  if (materiasCursando.length === 0) {
    dropdown.innerHTML = `<div class="mat-dropdown-empty">No estás cursando ninguna materia. Anotate desde "Mis Materias" para poder estudiar acá.</div>`;
    return;
  }

  materiasCursando.forEach(m => {
    const item = document.createElement('div');
    item.className = `mat-dropdown-item ${m.id === selectedMateriaId ? 'active' : ''}`;
    item.innerHTML = `<span>${m.nombre}</span>${m.id === selectedMateriaId ? '<span>✓</span>' : ''}`;
    item.onclick = () => selectMateria(m.id);
    dropdown.appendChild(item);
  });
}

function toggleMateriaDropdown(e) {
  if (e) e.stopPropagation();
  document.getElementById('materia-dropdown').classList.toggle('open');
  document.getElementById('mat-dropdown-trigger').classList.toggle('open');
}

async function loadMateriaResumen() {
  if (!selectedMateriaId) return;
  try {
    const response = await fetch(`${API_BASE}/materias/${selectedMateriaId}/pomodoro-resumen`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error();
    const data = await response.json();
    
    document.getElementById('chip-stat-hours').textContent = `${data.horas_semana}h`;
    document.getElementById('chip-stat-pomos').textContent = data.sesiones_totales;

    // Actualizar historial local de la sesión
    pomoCycles.sesiones_completadas_hoy = data.sesiones_hoy.length;
    pomoCycles.log = data.sesiones_hoy.map(s => ({
        time: s.hora,
        duration: `${Math.floor(s.duracion_segundos / 60)}:00`,
        status: "✓ Completada"
    }));
    updatePomoUI();
  } catch (e) {
    console.error("Error resumen", e);
  }
}

function closeMateriaDropdown() {
  document.getElementById('materia-dropdown').classList.remove('open');
  document.getElementById('mat-dropdown-trigger').classList.remove('open');
}

document.addEventListener('click', (e) => {
  const wrap = document.getElementById('mat-dropdown-wrap');
  if (wrap && !wrap.contains(e.target)) {
    closeMateriaDropdown();
  }
});

function selectMateria(id) {
  selectedMateriaId = id;
  localStorage.setItem('cursus_selected_materia', String(id));

  const materia = materiasCursando.find(m => m.id === id);
  document.getElementById('mat-selector-name').textContent = materia ? materia.nombre : '—';
  document.getElementById('mob-materia-name').textContent = materia ? materia.nombre : '—';
  document.getElementById('mob-materia-meta').textContent = materia ? `Nivel ${materia.nivel ?? '—'}` : '—';

  // Evita mostrar datos viejos mientras llega el resumen real de la materia seleccionada.
  document.getElementById('chip-stat-hours').textContent = '—';
  document.getElementById('chip-stat-pomos').textContent = '—';

  renderMateriaDropdown();
  closeMateriaDropdown();
  
  // [REAL API] Recargar todo al seleccionar materia
  loadAppState();
  loadMateriaResumen();
}

window.toggleMateriaDropdown = toggleMateriaDropdown;
