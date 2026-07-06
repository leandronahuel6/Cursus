/**
 * @fileoverview Single Source of Truth del Temporizador Pomodoro (Observer Pattern).
 *
 * Implementa el patrón Observador extendiendo la clase nativa `EventTarget`.
 * Mantiene el estado canónico del Pomodoro (`_state`, `_settings`, `_ciclos`)
 * y emite eventos que los suscriptores de UI consumen para re-renderizarse
 * de forma independiente, sin acoplamiento entre sí.
 *
 * MOTOR DEL RELOJ — Time Deltas (resistente a throttling):
 * El tiempo restante se calcula en cada tick como delta entre el timestamp de
 * inicio del periodo actual y `Date.now()`. El `setInterval` de 500 ms solo
 * actúa como disparador de chequeo; no determina la magnitud del decremento.
 * Esto garantiza precisión aunque el navegador suspenda el hilo (Chrome y
 * Firefox limitan `setInterval` a ~1 s en pestañas inactivas o en background).
 *
 * Eventos emitidos (escuchar con `pomodoroService.addEventListener`):
 * - `'pomo:tick'`           → cada ciclo del reloj mientras corre.
 * - `'pomo:estadoCambiado'` → al iniciar, pausar, detener, cambiar fase o preset.
 * - `'pomo:faseCompletada'` → al finalizar una fase natural (no salto manual).
 *
 * Todos los eventos incluyen un snapshot inmutable del estado en `e.detail`.
 *
 * @module PomodoroStateService
 */

'use strict';

import { ESTADOS_POMO } from '../models/PomodoroStates.js';
import { ApiService } from './ApiService.js';

/* ==========================================================================
   CLAVES DE LOCALSTORAGE (Única declaración autorizada en el sistema)
   ========================================================================== */

/**
 * Mapa de claves de localStorage utilizadas por el servicio.
 * Exportado para que la UI pueda leer valores auxiliares (sonido, modo estricto)
 * sin acceder directamente a strings literales dispersos en el código.
 * @type {Object.<string, string>}
 */
const LS_KEYS = {
    ESTADO:          'cursus_pomodoro_estado',
    CICLOS:          'cursus_pomodoro_ciclos',
    CONFIG:          'cursus_pomodoro_config',
    DEDUP_TOKEN:     'cursus_pomodoro_dedup_token',
};

/* ==========================================================================
   CLASE PRINCIPAL
   ========================================================================== */

/**
 * Servicio central del estado del Pomodoro.
 *
 * Extiende `EventTarget` para implementar el sistema de Pub/Sub nativo del
 * navegador. Los componentes de UI deben suscribirse a los eventos en lugar
 * de leer el estado directamente, garantizando el desacoplamiento.
 */
class PomodoroStateService extends EventTarget {

    constructor() {
        super();

        window.__pomodoroServiceActive = true;

        /**
         * Estado operativo del reloj.
         * @type {{fase_actual: string, estado_reloj: string, tiempo_restante: number, timestamp_ultimo_cambio: number}}
         */
        this._state = {
            fase_actual:             'enfoque',
            estado_reloj:            'detenido',
            tiempo_restante:         25 * 60,
            timestamp_ultimo_cambio: 0,
        };

        /**
         * Configuración de duraciones y ciclos.
         * @type {{tiempo_enfoque: number, descanso_corto: number, descanso_largo: number, sesiones_por_ciclo: number, ciclos_totales: number|null}}
         */
        this._config = {
            preset_activo:           'classic',
            tiempo_enfoque:          25,
            descanso_corto:          5,
            descanso_largo:          20,
            sesiones_por_ciclo:      4,
            ciclos_totales:          null,
            sonido_alarma:           'chime',
            modo_estricto:           false,
            reproducir_alarma:       true,
            mostrar_widget:          true,
            auto_reproduccion_fases: true,
        };

        this._settings = {
            tiempo_enfoque:          25,
            descanso_corto:          5,
            descanso_largo:          20,
            sesiones_por_ciclo:      4,
            ciclos_totales:          null,
        };

        /**
         * Progreso del ciclo de sesiones y log histórico local.
         * @type {{ciclo_actual: number, sesiones_completadas_hoy: number, log: Array}}
         */
        this._ciclos = {
            ciclo_actual:             1,
            sesiones_completadas_hoy: 0,
            distracciones:            0,
            log:                      [],
        };

        /** Referencia al ID del `setInterval` del motor del reloj. */
        this._ticker = null;

        /** `Date.now()` en el momento de arrancar el periodo activo actual. */
        this._tickerInicioTs = 0;

        /** Segundos restantes cuando se arrancó el periodo activo actual. */
        this._tickerInicioSeg = 0;

        /**
         * Callback inyectado para mostrar notificaciones de UI.
         * Se asigna en `init()`. Por defecto es un no-op para evitar errores
         * si se llama antes de la inicialización completa.
         * @type {Function}
         */
        this._toast = () => {};
    }

    /* =========================================================================
       API PÚBLICA — Inicialización
       ========================================================================= */

    /**
     * Inicializa el servicio leyendo el estado persistido en localStorage y
     * evaluando las condiciones de reingreso (abandono vs. recarga rápida).
     *
     * Debe llamarse una única vez al cargar la vista, antes de suscribirse
     * a cualquier evento. Emite `pomo:estadoCambiado` al finalizar para que
     * todos los suscriptores dibujen el estado inicial correctamente.
     *
     * @param {Function} toastFn - Función de la UI para mostrar notificaciones (message, type).
     */
    init(toastFn) {
        this._toast = toastFn;

        // --- Cargar configuración guardada ---
        const rawConfig = localStorage.getItem(LS_KEYS.CONFIG);
        if (rawConfig) {
            try {
                Object.assign(this._config, JSON.parse(rawConfig));
            } catch (_) { }
        }
        this._derivarSettings();
        
        // --- Cargar ciclos guardados ---
        const rawCiclos = localStorage.getItem(LS_KEYS.CICLOS);
        if (rawCiclos) {
            try {
                this._ciclos = JSON.parse(rawCiclos);
            } catch (_) { /* Mantener defaults */ }
        }

        // --- Cargar estado y evaluar condición de reingreso ---
        const rawState = localStorage.getItem(LS_KEYS.ESTADO);
        if (rawState) {
            try {
                const savedState = JSON.parse(rawState);
                const ahora        = Date.now();
                const horasPasadas = (ahora - savedState.timestamp_ultimo_cambio) / (1000 * 60 * 60);

                const eraValidoElTimestamp = savedState.timestamp_ultimo_cambio > 0;

                if (eraValidoElTimestamp && horasPasadas >= 4) {
                    // Abandono de larga duración: la sesión expiró, registrar como abandonada si hubo progreso
                    if (savedState.fase_actual === 'enfoque') {
                        const maxSeconds = this._settings.tiempo_enfoque * 60;
                        const elapsedSeconds = maxSeconds - savedState.tiempo_restante;
                        const elapsedMin = Math.floor(elapsedSeconds / 60);
                        if (elapsedMin > 0) {
                            this._registrarInterrupcionSesion(elapsedMin, 'abandonada');
                        }
                    }

                    this._toast('Sesión de estudio anterior expirada por inactividad (>4 hs).', 'warn');
                    this._resetearADefecto();

                } else {
                    this._state = savedState;

                    if (this._state.estado_reloj === 'corriendo') {
                        // Fast-forward matemático
                        let segundosAusente = Math.floor((ahora - this._state.timestamp_ultimo_cambio) / 1000);
                        let autoPlay = this._config.auto_reproduccion_fases;
                        
                        let tiempoRestanteLocal = this._state.tiempo_restante;
                        let faseActualLocal = this._state.fase_actual;
                        
                        while (segundosAusente > 0 && segundosAusente >= tiempoRestanteLocal) {
                            segundosAusente -= tiempoRestanteLocal;
                            
                            // 1. Simular fin de fase
                            const faseObj = ESTADOS_POMO[faseActualLocal];
                            if (faseActualLocal === 'enfoque') {
                                this._ciclos.sesiones_completadas_hoy++;
                                const logDate = new Date(ahora - (segundosAusente * 1000));
                                const hhmm  = `${String(logDate.getHours()).padStart(2, '0')}:${String(logDate.getMinutes()).padStart(2, '0')}`;
                                this._ciclos.log.unshift({
                                    time:     hhmm,
                                    duration: `${this._settings.tiempo_enfoque}:00`,
                                    status:   this._formatSessionStatus('completada'),
                                });
                            }
                            
                            // 2. Transición a siguiente fase
                            const siguienteClave = faseObj.siguiente(this._ciclos, this._settings);
                            const siguienteObj = ESTADOS_POMO[siguienteClave];
                            
                            if (this._ciclos.ciclo_actual === 1) {
                                this._ciclos.distracciones = 0;
                            }
                            
                            faseActualLocal = siguienteClave;
                            tiempoRestanteLocal = siguienteObj.duracion(this._settings);
                            
                            // 3. Evaluar autoplay
                            if (!autoPlay) {
                                // Se detiene al inicio de la nueva fase
                                segundosAusente = 0;
                                this._state.estado_reloj = 'detenido';
                                break;
                            }
                        }
                        
                        // Aplicar los residuos de tiempo a la fase resultante
                        this._state.fase_actual = faseActualLocal;
                        this._state.tiempo_restante = Math.max(0, tiempoRestanteLocal - segundosAusente);
                        this._state.timestamp_ultimo_cambio = ahora;
                        
                        if (!autoPlay) {
                            this._state.estado_reloj = 'detenido';
                        }
                        
                        this._persistirEstado();
                        this._persistirCiclos();
                        
                        if (this._state.estado_reloj === 'corriendo') {
                            this._iniciarTicker();
                        }
                    }
                }
            } catch (_) {
                this._resetearADefecto();
            }
        } else {
            this._resetearADefecto();
        }

        // Emitir estado inicial para que los suscriptores se dibujen
        this._emitir('pomo:estadoCambiado');

        // --- Sincronización cruzada entre pestañas (widget flotante, etc.) ---
        window.addEventListener('storage', (e) => {
            const clavesCriticas = [LS_KEYS.ESTADO, LS_KEYS.CONFIG, LS_KEYS.CICLOS];
            if (!clavesCriticas.includes(e.key)) return;

            // Sincronizar exclusivamente la rama de estado que fue modificada
            try {
                if (e.key === LS_KEYS.ESTADO) {
                    const rawSt = localStorage.getItem(LS_KEYS.ESTADO);
                    if (rawSt) {
                        this._state = JSON.parse(rawSt);
                        // Sincronizar el motor del reloj con el nuevo estado externo
                        this._detenerTicker();
                        if (this._state.estado_reloj === 'corriendo') {
                            this._iniciarTicker();
                        }
                    }
                } else if (e.key === LS_KEYS.CONFIG) {
                    const rawCo = localStorage.getItem(LS_KEYS.CONFIG);
                    if (rawCo) {
                        Object.assign(this._config, JSON.parse(rawCo));
                        this._derivarSettings();
                    }
                } else if (e.key === LS_KEYS.CICLOS) {
                    const rawCy = localStorage.getItem(LS_KEYS.CICLOS);
                    if (rawCy) {
                        this._ciclos = JSON.parse(rawCy);
                    }
                }
            } catch (_) { return; }

            this._emitir('pomo:estadoCambiado');
        });

        // Guardar timestamp exacto antes de cerrar/navegar para calcular ausencia al volver
        window.addEventListener('beforeunload', () => {
            if (this._state.estado_reloj === 'corriendo') {
                this._state.timestamp_ultimo_cambio = Date.now();
                localStorage.setItem(LS_KEYS.ESTADO, JSON.stringify(this._state));
            }
        });
    }

    /* =========================================================================
       API PÚBLICA — Controles del Temporizador
       ========================================================================= */

    /**
     * Inicia o reanuda el temporizador. El llamador debe haber desbloqueado
     * el contexto de audio antes de invocar este método (requiere gesto del usuario).
     *
     * @returns {boolean} `true` si era una sesión nueva (estado 'detenido'),
     *                    `false` si era una reanudación desde 'pausado'.
     */
    iniciar() {
        this._solicitarPermisosNotificacion();
        
        const esNueva = this._state.estado_reloj === 'detenido';
        this._state.estado_reloj = 'corriendo';
        this._persistirEstado();
        this._iniciarTicker();
        this._emitir('pomo:estadoCambiado');
        
        // Petición al API para reportar inicio/reanudación
        const endpoint = esNueva ? ApiService.iniciarSesion : ApiService.reanudarSesion;
        endpoint().catch(() => this._toast('No se pudo notificar el inicio al servidor', 'warn'));

        return esNueva;
    }

    /**
     * Pausa el temporizador, detiene el motor del reloj y persiste el estado.
     */
    pausar() {
        this._state.estado_reloj = 'pausado';
        this._detenerTicker();
        this._persistirEstado();
        this._emitir('pomo:estadoCambiado');

        // Petición al API para reportar pausa
        ApiService.pausarSesion().catch(() => this._toast('No se pudo notificar la pausa al servidor', 'warn'));
    }

    /**
     * Reinicia el temporizador de la fase actual (manteniendo si es enfoque o descanso).
     * Usado por el botón "Reiniciar" (no reinicia el ciclo completo).
     *
     * @returns {{elapsedMin: number, faseEraEnfoque: boolean}} Metadatos para que la
     *          UI decida si debe registrar una sesión parcial en el backend.
     */
    reiniciarFase() {
        this._detenerTicker();
        const faseActualObj  = ESTADOS_POMO[this._state.fase_actual];
        const totalSeg       = faseActualObj.duracion(this._settings);
        const elapsedMin     = Math.floor((totalSeg - this._state.tiempo_restante) / 60);
        const faseEraEnfoque = this._state.fase_actual === 'enfoque';

        // Agregar entrada de sesión parcial al log si hubo progreso real en enfoque
        if (faseEraEnfoque && elapsedMin > 0) {
            this._registrarInterrupcionSesion(elapsedMin, 'abandonada');
        }

        this._state.tiempo_restante = totalSeg;
        
        const autoPlay = this._config.auto_reproduccion_fases;
        this._state.estado_reloj = autoPlay ? 'corriendo' : 'detenido';
        this._state.timestamp_ultimo_cambio = Date.now();
        
        this._persistirEstado();
        
        if (autoPlay) {
            this._iniciarTicker();
        }
        
        this._emitir('pomo:estadoCambiado');
        return { elapsedMin, faseEraEnfoque };
    }

    /**
     * Reinicia el ciclo completo de sesiones, volviendo al estado inicial (sesión 1).
     * Usado por el botón "Reiniciar Ciclo".
     */
    reiniciarCiclo() {
        this._detenerTicker();
        const faseActualObj  = ESTADOS_POMO[this._state.fase_actual];
        const totalSeg       = faseActualObj.duracion(this._settings);
        const elapsedMin     = Math.floor((totalSeg - this._state.tiempo_restante) / 60);
        const faseEraEnfoque = this._state.fase_actual === 'enfoque';

        // Registrar sesión abandonada si hubo progreso en la fase de enfoque
        if (faseEraEnfoque && elapsedMin > 0) {
            this._registrarInterrupcionSesion(elapsedMin, 'abandonada');
        }

        this._ciclos.ciclo_actual = 1;
        this._ciclos.distracciones = 0;
        this._persistirCiclos();
        
        this._resetearADefecto();
        
        const autoPlay = this._config.auto_reproduccion_fases;
        if (autoPlay) {
            this._state.estado_reloj = 'corriendo';
            this._persistirEstado();
            this._iniciarTicker();
        }
        
        this._emitir('pomo:estadoCambiado');
    }

    /**
     * Salta la fase actual y pasa automáticamente a la siguiente.
     * Si la fase saltada era enfoque con progreso, registra la entrada parcial en el log.
     *
     * @returns {{elapsedMin: number, faseEraEnfoque: boolean}} Metadatos para que la
     *          UI decida si debe registrar una sesión parcial en el backend.
     */
    saltarFase() {
        this._detenerTicker();

        const faseActualObj  = ESTADOS_POMO[this._state.fase_actual];
        const totalSeg       = faseActualObj.duracion(this._settings);
        const elapsedMin     = Math.floor((totalSeg - this._state.tiempo_restante) / 60);
        const faseEraEnfoque = this._state.fase_actual === 'enfoque';

        // Registrar entrada parcial en el log si hubo progreso en la fase de enfoque
        if (faseEraEnfoque && elapsedMin > 0) {
            this._registrarInterrupcionSesion(elapsedMin, 'completada_parcial');
        }

        // Calcular y aplicar la siguiente fase usando la máquina de estados
        const siguienteClave = faseActualObj.siguiente(this._ciclos, this._settings);
        const siguienteObj   = ESTADOS_POMO[siguienteClave];

        if (this._ciclos.ciclo_actual === 1) {
            this._ciclos.distracciones = 0;
        }

        this._state.fase_actual      = siguienteClave;
        this._state.tiempo_restante  = siguienteObj.duracion(this._settings);
        
        const autoPlay = this._config.auto_reproduccion_fases;
        this._state.estado_reloj     = autoPlay ? 'corriendo' : 'detenido';
        this._state.timestamp_ultimo_cambio = Date.now();

        this._persistirEstado();
        this._persistirCiclos();
        
        if (autoPlay) {
            this._iniciarTicker();
        }
        this._emitir('pomo:estadoCambiado');

        return { elapsedMin, faseEraEnfoque };
    }


    registrarDistraccion() {
        if (typeof this._ciclos.distracciones !== 'number') {
            this._ciclos.distracciones = 0;
        }
        this._ciclos.distracciones++;
        this._persistirCiclos();
        return this._ciclos.distracciones;
    }

    reiniciarDistracciones() {
        this._ciclos.distracciones = 0;
        this._persistirCiclos();
    }

    obtenerDistracciones() {
        return this._ciclos.distracciones || 0;
    }

    /**
     * Fuerza el cambio de fase desde los tabs del Modo Concentración.
     * Pausa el temporizador para que el usuario lo reanude manualmente;
     * un cambio de fase involuntario con el reloj corriendo sería confuso.
     *
     * @param {string} faseKey - Clave de la fase ('enfoque'|'descanso_corto'|'descanso_largo').
     */
    forzarFase(faseKey) {
        const faseObj = ESTADOS_POMO[faseKey];
        if (!faseObj) return;

        this._detenerTicker();
        this._state.fase_actual     = faseKey;
        this._state.tiempo_restante = faseObj.duracion(this._settings);
        this._state.estado_reloj    = 'pausado';
        this._persistirEstado();
        this._emitir('pomo:estadoCambiado');
    }

    /* =========================================================================
       API PÚBLICA — Configuración
       ========================================================================= */

    /**
     * Aplica uno de los presets predefinidos de tiempo y reinicia el temporizador.
     * No tiene efecto si el reloj está corriendo (la UI debe validar antes).
     *
     * @param {'classic'|'deep'|'short'|'custom'} tipo - Nombre del preset.
     * @returns {boolean} `true` si el preset se aplicó, `false` si el reloj estaba corriendo.
     */
    _derivarSettings() {
        if (this._config.preset_activo === 'classic') {
            Object.assign(this._settings, { tiempo_enfoque: 25, descanso_corto: 5, descanso_largo: 20, sesiones_por_ciclo: 4, ciclos_totales: null });
        } else if (this._config.preset_activo === 'deep') {
            Object.assign(this._settings, { tiempo_enfoque: 50, descanso_corto: 10, descanso_largo: 30, sesiones_por_ciclo: 4, ciclos_totales: null });
        } else if (this._config.preset_activo === 'short') {
            Object.assign(this._settings, { tiempo_enfoque: 15, descanso_corto: 3, descanso_largo: 15, sesiones_por_ciclo: 4, ciclos_totales: null });
        } else {
            Object.assign(this._settings, {
                tiempo_enfoque: this._config.tiempo_enfoque,
                descanso_corto: this._config.descanso_corto,
                descanso_largo: this._config.descanso_largo,
                sesiones_por_ciclo: this._config.sesiones_por_ciclo,
                ciclos_totales: this._config.ciclos_totales
            });
        }
    }

    _persistirYEnviarConfig() {
        localStorage.setItem(LS_KEYS.CONFIG, JSON.stringify(this._config));
        if (ApiService.updateConfigPomodoro) {
            return ApiService.updateConfigPomodoro(this._config);
        }
        return Promise.resolve();
    }

    aplicarPreset(tipo) {
        if (this._state.estado_reloj === 'corriendo') return false;

        this._config.preset_activo = tipo;
        this._persistirYEnviarConfig().catch(e => console.warn('No se pudo guardar la config', e));
        this._derivarSettings();

        this._validarYCorregirCiclos();

        this._resetearADefecto();
        this._emitir('pomo:estadoCambiado');
        return true;
    }

    /**
     * Persiste y aplica una configuración personalizada ya validada por la UI.
     * La validación de rangos y restricciones de negocio debe completarse
     * ANTES de llamar a este método (la UI es responsable de ello).
     *
     * @param {{tiempo_enfoque: number, descanso_corto: number, descanso_largo: number, sesiones_por_ciclo: number, ciclos_totales: number|null}} nuevosSettings
     * @param {object} configuracionesGenerales
     * @returns {Promise}
     */
    guardarAjustesPersonalizados(nuevosSettings, configuracionesGenerales) {
        // Guardamos la duración de la fase actual antes de aplicar los cambios
        const faseObj = ESTADOS_POMO[this._state.fase_actual];
        const duracionPrevia = faseObj.duracion(this._settings);

        Object.assign(this._config, nuevosSettings);
        if (configuracionesGenerales) {
            Object.assign(this._config, configuracionesGenerales);
        }

        const promise = this._persistirYEnviarConfig();
        this._derivarSettings();

        this._validarYCorregirCiclos();

        // Si estamos en el preset 'custom' y la configuración del tiempo que afecta a la fase actual cambió,
        // reiniciamos ÚNICAMENTE la fase actual (no volvemos a enfoque por defecto, mantenemos la fase).
        if (this._config.preset_activo === 'custom') {
            const duracionNueva = faseObj.duracion(this._settings);
            if (duracionPrevia !== duracionNueva) {
                this._detenerTicker();
                this._state.tiempo_restante = duracionNueva;
                this._state.estado_reloj = 'detenido';
                this._state.timestamp_ultimo_cambio = Date.now();
                this._persistirEstado();
            }
        }
        
        this._emitir('pomo:estadoCambiado');
        return promise;
    }

    /**
     * Sincroniza el log y el contador de sesiones con datos reales del backend.
     * Llamado tras una respuesta exitosa de `ApiService.getMateriaResumen()`.
     *
     * @param {{sesiones_completadas_hoy: number, log: Array}} datos - Datos del backend.
     */
    sincronizarCiclosConBackend(datos) {
        this._ciclos.sesiones_completadas_hoy = datos.sesiones_completadas_hoy;
        this._ciclos.log = datos.log;
        this._persistirCiclos();
        this._emitir('pomo:estadoCambiado');
    }

    /**
     * Marca todas las sesiones locales offline como sincronizadas.
     * Útil cuando se vacía la cola de sincronización, especialmente
     * para el modo "Estudio Independiente" que no tiene resumen de backend.
     */
    marcarSesionesComoSincronizadas() {
        let changed = false;
        this._ciclos.log.forEach(row => {
            if (row.status && row.status.isOffline) {
                row.status.isOffline = false;
                changed = true;
            }
        });
        if (changed) {
            this._persistirCiclos();
            this._emitir('pomo:estadoCambiado');
        }
    }

    /* =========================================================================
       API PÚBLICA — Accesores (solo lectura)
       ========================================================================= */

    /**
     * Devuelve un snapshot inmutable del estado actual.
     * Los suscriptores deben usar este método para renderizar, no acceder a
     * las propiedades internas `_state`, `_settings` o `_ciclos` directamente.
     *
     * @returns {{state: object, settings: object, ciclos: object, presetActivo: string}}
     */
    obtenerSnapshot() {
        return {
            state:        { ...this._state },
            settings:     { ...this._settings },
            config:       { ...this._config },
            ciclos:       { ...this._ciclos, log: [...this._ciclos.log] },
            presetActivo: this._config.preset_activo,
        };
    }

    /* =========================================================================
       MOTOR DEL RELOJ — Time Deltas (Privado)
       ========================================================================= */

    /**
     * Inicia el motor del reloj basado en cálculo de deltas de tiempo real.
     *
     * En cada tick se calcula el tiempo restante como la diferencia entre el
     * tiempo actual y el timestamp de inicio del periodo, no como un decremento
     * acumulativo. Esto neutraliza el throttling del navegador en pestañas
     * inactivas porque la magnitud del decremento siempre es matemáticamente
     * correcta, independientemente de cuánto tiempo pasó entre ticks.
     */
    _iniciarTicker() {
        this._detenerTicker();

        // Anclar el origen del periodo actual para el cálculo de delta
        this._tickerInicioTs  = Date.now();
        this._tickerInicioSeg = this._state.tiempo_restante;
        this._ultimoSegundoPersistido = this._state.tiempo_restante;

        this._ticker = setInterval(() => {
            const deltaSeg = Math.floor((Date.now() - this._tickerInicioTs) / 1000);
            const restante = this._tickerInicioSeg - deltaSeg;

            if (restante <= 0) {
                // La fase terminó: el cálculo puede dar 0 o negativo si hubo throttling extremo
                this._state.tiempo_restante = 0;
                this._manejarFaseCompleta();
            } else {
                this._state.tiempo_restante         = restante;
                this._state.timestamp_ultimo_cambio = Date.now();

                // Persistir cada 10 s para no saturar I/O; siempre se persiste en beforeunload
                if (restante > 0 && restante % 10 === 0 && this._ultimoSegundoPersistido !== restante) {
                    this._ultimoSegundoPersistido = restante;
                    this._persistirEstado();
                }

                this._emitir('pomo:tick');
            }
        }, 500); // Poll a 500 ms: más responsivo que 1 s, el delta corrige cualquier deriva
    }

    /**
     * Detiene el motor del reloj liberando el intervalo y limpiando la referencia.
     */
    _detenerTicker() {
        if (this._ticker !== null) {
            clearInterval(this._ticker);
            this._ticker = null;
        }
    }

    /* =========================================================================
       LÓGICA DE TRANSICIÓN DE FASES (Privado)
       ========================================================================= */

    /**
     * Maneja la finalización natural de una fase:
     * 1. Registra la sesión completada en el log local (si era enfoque).
     * 2. Usa la máquina de estados para calcular la siguiente fase (sin if/else).
     * 3. Persiste el nuevo estado y ciclos.
     * 4. Emite `pomo:faseCompletada` con los datos necesarios para que la UI
     *    haga la llamada a `ApiService.registrarSesionCompletada()` con el
     *    contexto correcto (selectedMateriaId vive en la UI, no aquí).
     * 5. Arranca automáticamente el ticker de la siguiente fase.
     */
    _manejarFaseCompleta() {
        this._detenerTicker();

        const faseFinalizadaObj = ESTADOS_POMO[this._state.fase_actual];
        const faseFinalizadaKey = this._state.fase_actual;

        if (faseFinalizadaKey === 'enfoque') {
            // Registrar la sesión completada en el log local
            this._ciclos.sesiones_completadas_hoy++;
            const ahora = new Date();
            const hhmm  = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
            this._ciclos.log.unshift({
                time:     hhmm,
                duration: `${this._settings.tiempo_enfoque}:00`,
                status:   this._formatSessionStatus('completada'),
            });

            this._toast('¡Buen trabajo! Sesión de enfoque completada. Hora de descansar.', 'success');
            this._enviarNotificacionPush('¡Enfoque completado!', 'Buen trabajo. Es hora de tu descanso.');
        } else {
            this._toast('El descanso ha terminado. ¡A enfocar nuevamente!', 'success');
            this._enviarNotificacionPush('¡Descanso terminado!', 'Es hora de volver a enfocarse.');
        }

        // Máquina de estados: calcular la siguiente fase sin condicionales
        const siguienteClave = faseFinalizadaObj.siguiente(this._ciclos, this._settings);
        const siguienteObj   = ESTADOS_POMO[siguienteClave];

        if (this._ciclos.ciclo_actual === 1) {
            this._ciclos.distracciones = 0;
        }

        this._state.fase_actual     = siguienteClave;
        this._state.tiempo_restante = siguienteObj.duracion(this._settings);
        
        if (this._config.auto_reproduccion_fases) {
            this._state.estado_reloj = 'corriendo';
        } else {
            this._state.estado_reloj = 'detenido';
        }

        this._persistirEstado();
        this._persistirCiclos();

        // Emitir el evento ANTES de iniciar el siguiente ticker para que la UI
        // procese la completación (reproducir alarma, registrar en backend) primero.
        // dispatchEvent es síncrono, así que los listeners se ejecutan aquí mismo.
        this._emitir('pomo:faseCompletada', {
            faseCompletada:   faseFinalizadaKey,
            duracionSegundos: this._settings.tiempo_enfoque * 60,
        });

        // Emitir cambio de estado para que la UI se repinte inmediatamente con la nueva fase
        this._emitir('pomo:estadoCambiado');

        if (this._config.auto_reproduccion_fases) {
            this._iniciarTicker();
        }

        // 6. Si fue fase de enfoque, registrar globalmente con deduplicación
        if (faseFinalizadaKey === 'enfoque') {
            this._registrarSesionEnBackend(this._settings.tiempo_enfoque * 60);
        }
    }

    /* =========================================================================
       HELPERS PRIVADOS
       ========================================================================= */

    /**
     * Restablece el estado al punto de inicio: fase enfoque, reloj detenido,
     * tiempo según la configuración actual. Persiste automáticamente.
     */
    _resetearADefecto() {
        const faseEnfoque = ESTADOS_POMO['enfoque'];
        this._state = {
            fase_actual:             'enfoque',
            estado_reloj:            'detenido',
            tiempo_restante:         faseEnfoque.duracion(this._settings),
            timestamp_ultimo_cambio: Date.now(),
        };
        this._persistirEstado();
    }

    /**
     * Valida si el ciclo actual superó el límite máximo configurado
     * (por ejemplo, si se cambió a un preset con menos sesiones por ciclo).
     * Si es así, reinicia los ciclos de forma segura.
     */
    _validarYCorregirCiclos() {
        if (this._ciclos.ciclo_actual > this._settings.sesiones_por_ciclo) {
            this._ciclos.ciclo_actual = 1;
            this._ciclos.distracciones = 0;
            this._persistirCiclos();
        }
    }

    /**
     * Registra una sesión interrumpida de forma local y en el backend.
     * @param {number} elapsedMin 
     * @param {string} estado ('completada_parcial' | 'abandonada')
     */
    _registrarInterrupcionSesion(elapsedMin, estado) {
        this._agregarLogParcial(elapsedMin, estado);
        
        const rawMateria = localStorage.getItem('cursus_selected_materia');
        const materiaId = (rawMateria && rawMateria !== 'independiente') ? parseInt(rawMateria, 10) : null;
        
        // Evitar registrar si hay un rawMateria inválido distinto de 'independiente'
        if (rawMateria && rawMateria !== 'independiente' && isNaN(materiaId)) return;

        const duracionSegundos = elapsedMin * 60;
        
        if (estado === 'completada_parcial') {
            ApiService.registrarSesionParcial(materiaId, duracionSegundos).catch(() => console.warn('No se pudo registrar la sesión parcial'));
        } else {
            ApiService.registrarSesionAbandonada(materiaId, duracionSegundos).catch(() => console.warn('No se pudo registrar la sesión abandonada'));
        }
    }

    /**
     * Helper para formatear el estado de la sesión para el renderizado del log.
     * @param {string} estado ('completada', 'completada_parcial', 'abandonada')
     * @param {boolean} [synced=false] Si proviene del backend (siempre true) o si fue local
     * @returns {object} { text, class, icon, tooltip }
     */
    _formatSessionStatus(estado, synced = false) {
        const isOffline = !navigator.onLine && !synced;
        const icon = estado === 'completada' ? 'check-check' : (estado === 'completada_parcial' ? 'check' : 'x');
        
        let text, cssClass;
        if (estado === 'completada') {
            text = 'Completada'; cssClass = 'status-completada';
        } else if (estado === 'completada_parcial') {
            text = 'Parcial'; cssClass = 'status-parcial';
        } else {
            text = 'Abandonada'; cssClass = 'status-abandonada';
        }
        
        return { text, class: cssClass, icon, isOffline };
    }

    /**
     * Agrega una entrada de sesión parcial al log de ciclos.
     * @param {number} elapsedMin - Minutos transcurridos antes de la interrupción.
     * @param {string} estado - Estado de la sesión.
     */
    _agregarLogParcial(elapsedMin, estado) {
        const ahora = new Date();
        const hhmm  = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
        this._ciclos.log.unshift({
            time:     hhmm,
            duration: `${elapsedMin}:00`,
            status:   this._formatSessionStatus(estado),
        });
        this._persistirCiclos();
    }

    /**
     * Persiste el estado actual del Pomodoro en localStorage.
     * Siempre actualiza el timestamp para disponer de un punto de referencia
     * confiable al calcular el tiempo ausente en la próxima carga.
     */
    _persistirEstado() {
        this._state.timestamp_ultimo_cambio = Date.now();
        localStorage.setItem(LS_KEYS.ESTADO, JSON.stringify(this._state));
    }

    /**
     * Persiste el estado de los ciclos (log, contador de sesiones) en localStorage.
     */
    _persistirCiclos() {
        localStorage.setItem(LS_KEYS.CICLOS, JSON.stringify(this._ciclos));
    }

    /**
     * Emite un evento CustomEvent con el snapshot del estado actual como `detail`.
     * El snapshot es inmutable (copia por valor) para que los suscriptores no
     * puedan mutar accidentalmente el estado interno del servicio.
     *
     * @param {string} nombreEvento - Nombre del evento a despachar.
     * @param {object} [extraDetail={}] - Datos adicionales a incluir en `e.detail`.
     */
    _emitir(nombreEvento, extraDetail = {}) {
        this.dispatchEvent(new CustomEvent(nombreEvento, {
            detail: {
                ...this.obtenerSnapshot(),
                ...extraDetail,
            },
        }));
    }

    /**
     * Registra de forma global y atómica la sesión en el backend.
     * Utiliza Web Locks API para garantizar exclusión mutua entre pestañas.
     * @param {number} duracionSegundos 
     */
    _registrarSesionEnBackend(duracionSegundos) {
        const rawMateria = localStorage.getItem('cursus_selected_materia');
        const materiaId = (rawMateria && rawMateria !== 'independiente') ? parseInt(rawMateria, 10) : null;
        
        if (rawMateria && rawMateria !== 'independiente' && isNaN(materiaId)) return;

        if (!navigator.locks) {
            this._registrarConTokenLegacy(materiaId, duracionSegundos);
            return;
        }

        navigator.locks.request('cursus_pomo_dedup', { mode: 'exclusive' }, async () => {
            const dedupKey      = LS_KEYS.DEDUP_TOKEN;
            const ahora         = Date.now();
            const existingToken = localStorage.getItem(dedupKey);

            if (existingToken && (ahora - parseInt(existingToken, 10)) <= 10000) return;

            localStorage.setItem(dedupKey, String(ahora));
            setTimeout(() => {
                if (localStorage.getItem(dedupKey) === String(ahora)) {
                    localStorage.removeItem(dedupKey);
                }
            }, 30000);

            try {
                await ApiService.registrarSesionCompletada(materiaId, duracionSegundos);
                this._emitir('pomo:sesionRegistradaBackend');
            } catch (e) {
                console.error('Error registrando sesión completada global', e);
            }
        });
    }

    /**
     * Fallback de deduplicación sin garantía atómica para Safari < 15.4
     * @param {number} materiaId 
     * @param {number} duracionSegundos 
     */
    _registrarConTokenLegacy(materiaId, duracionSegundos) {
        const dedupKey      = LS_KEYS.DEDUP_TOKEN;
        const ahora         = Date.now();
        const existingToken = localStorage.getItem(dedupKey);

        if (existingToken && (ahora - parseInt(existingToken, 10)) <= 10000) return;

        localStorage.setItem(dedupKey, String(ahora));
        setTimeout(() => {
            if (localStorage.getItem(dedupKey) === String(ahora)) {
                localStorage.removeItem(dedupKey);
            }
        }, 30000);

        ApiService.registrarSesionCompletada(materiaId, duracionSegundos)
            .then(() => this._emitir('pomo:sesionRegistradaBackend'))
            .catch(e => console.error('Error registrando sesión completada global (legacy)', e));
    }

    /**
     * Sincroniza la configuración de forma asíncrona con el backend para evitar
     * desincronización si el LocalStorage se borró o si se accede desde otro dispositivo.
     */
    async sincronizarConfigDesdeBackend() {
        try {
            const data = await ApiService.getConfigPomodoro();
            // La API devuelve el objeto config directamente (data.preset_activo, data.tiempo_enfoque, etc.)
            if (data && data.preset_activo) {
                const dbConfig = data;
                let hasChanges = false;
                
                // Aplicar propiedades que existan en el backend
                for (const key in dbConfig) {
                    if (dbConfig.hasOwnProperty(key) && this._config[key] !== dbConfig[key]) {
                        this._config[key] = dbConfig[key];
                        hasChanges = true;
                    }
                }

                if (hasChanges) {
                    this._derivarSettings();
                    localStorage.setItem(LS_KEYS.CONFIG, JSON.stringify(this._config));
                    
                    // Si el reloj está detenido y estamos en enfoque, actualizamos el tiempo restante 
                    // para que refleje la nueva configuración inmediatamente
                    if (this._state.estado_reloj === 'detenido' && this._state.fase_actual === 'enfoque') {
                        this._state.tiempo_restante = this._settings.tiempo_enfoque * 60;
                        localStorage.setItem(LS_KEYS.ESTADO, JSON.stringify(this._state));
                    }
                    
                    this._emitir('pomo:estadoCambiado');
                }
            }
        } catch (error) {
            console.warn('[PomodoroStateService] No se pudo sincronizar la config con el backend:', error);
        }
    }

    /* =========================================================================
       API PÚBLICA — Notificaciones
       ========================================================================= */

    _solicitarPermisosNotificacion() {
        if (!("Notification" in window)) return;
        if (Notification.permission === "default") {
            Notification.requestPermission();
        }
    }

    _enviarNotificacionPush(titulo, cuerpo) {
        if (!("Notification" in window) || Notification.permission !== "granted") return;
        
        const isAreaEstudio = window.location.pathname.includes('/area-estudio');
        const widgetDismissed = localStorage.getItem('cursus_pomo_float_dismissed') === 'true';
        const widgetDisabled = this._config.mostrar_widget === false;

        let shouldNotify = false;
        if (document.hidden) {
            shouldNotify = true;
        } else {
            // Si la pestaña está activa, pero NO estamos en area-estudio y el widget está cerrado/desactivado,
            // no hay interfaz visual, por lo que DEBEMOS mostrar la notificación push.
            if (!isAreaEstudio && (widgetDismissed || widgetDisabled)) {
                shouldNotify = true;
            }
        }

        if (shouldNotify) {
            // Deduplicar notificaciones entre múltiples pestañas abiertas
            const lockKey = 'cursus_pomo_notif_lock';
            const currentLock = localStorage.getItem(lockKey);
            const timeKey = String(this._state.timestamp_ultimo_cambio);
            
            if (currentLock !== timeKey) {
                localStorage.setItem(lockKey, timeKey);
                
                const notif = new Notification(titulo, {
                    body: cuerpo,
                    icon: '/favicon.ico'
                });
                
                notif.onclick = function() {
                    window.focus();
                    if (!window.location.pathname.includes('/area-estudio')) {
                        window.location.href = '/area-estudio';
                    }
                };
                
                setTimeout(() => notif.close(), 8000);
            }
        }
    }
}

/* ==========================================================================
   SINGLETON EXPORTADO
   ========================================================================== */

/**
 * Instancia singleton del servicio. Toda la aplicación debe importar y usar
 * esta misma instancia para garantizar el Single Source of Truth.
 *
 * Consumidores futuros (ej: `pomo-float.js`) deben importar este módulo
 * directamente en lugar de acceder al estado vía `localStorage` o `window.*`.
 *
 * @type {PomodoroStateService}
 */
const pomodoroService = new PomodoroStateService();

export { pomodoroService, LS_KEYS };
