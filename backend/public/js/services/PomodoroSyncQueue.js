/**
 * @fileoverview Cola de Reintentos Offline-First para Sesiones Pomodoro.
 *
 * Intercepta y encola las sesiones de enfoque completadas o parciales que no
 * pudieron sincronizarse con el backend (por ej. corte de internet).
 * Intenta vaciar la cola automáticamente al cargar, al recuperar conexión
 * y de forma periódica cada 1 minuto.
 *
 * @module PomodoroSyncQueue
 */

'use strict';

import { ApiService } from './ApiService.js';

const QUEUE_KEY = 'cursus_pomo_sync_queue';

class SyncQueue {
    constructor() {
        this._interval = null;
    }

    /**
     * Inicializa la cola de sincronización.
     * Intenta vaciar la cola al cargar, se suscribe al evento 'online'
     * y configura un reintento periódico cada 1 minuto.
     */
    init() {
        this._attemptSync();

        window.addEventListener('online', () => {
            this._attemptSync();
        });

        this._interval = setInterval(() => {
            this._attemptSync();
        }, 60000); // 1 minuto
    }

    /**
     * Añade una sesión a la cola y fuerza un intento de sincronización.
     * @param {object} payload - Datos de la sesión (materia_id, duracion_segundos, estado).
     */
    enqueueSession(payload) {
        const queue = this._getQueue();
        queue.push({
            id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
            payload,
            timestamp: Date.now()
        });
        this._saveQueue(queue);
        this._emitQueueChangeEvent();
    }

    /**
     * Retorna el número de elementos en la cola.
     * Útil para actualizar la UI (mostrar icono de nube).
     * @returns {number}
     */
    getPendingCount() {
        return this._getQueue().length;
    }

    /**
     * Intenta enviar todas las sesiones de la cola al servidor.
     * Si la petición es exitosa (HTTP 2xx), la sesión se elimina de la cola.
     * Dispara un evento para que la UI actualice el indicador visual.
     */
    async _attemptSync() {
        let queue = this._getQueue();
        if (queue.length === 0) {
            this._emitQueueChangeEvent();
            return;
        }

        let hasChanges = false;
        const newQueue = [];

        for (const item of queue) {
            try {
                // Enviar la petición de sesión mediante el endpoint real
                await ApiService.apiFetch('/api/pomodoro/sesiones', {
                    method: 'POST',
                    body: JSON.stringify(item.payload),
                });
                // Si llegamos aquí, fue 200/201. No la metemos en newQueue (se elimina)
                hasChanges = true;
            } catch (error) {
                console.warn('Error sincronizando sesión encolada, se reintentará luego:', error);
                // Mantenemos el item en la cola
                newQueue.push(item);
            }
        }

        if (hasChanges) {
            this._saveQueue(newQueue);
        }
        this._emitQueueChangeEvent();
    }

    /**
     * Lee la cola del LocalStorage.
     * @returns {Array}
     */
    _getQueue() {
        try {
            const raw = localStorage.getItem(QUEUE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    /**
     * Guarda la cola en el LocalStorage.
     * @param {Array} queue 
     */
    _saveQueue(queue) {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    }

    /**
     * Emite un evento global para que la UI pueda actualizar el ícono de "sincronizando".
     */
    _emitQueueChangeEvent() {
        window.dispatchEvent(new CustomEvent('pomo:syncQueueChanged', {
            detail: { count: this.getPendingCount() }
        }));
    }
}

export const PomodoroSyncQueue = new SyncQueue();
