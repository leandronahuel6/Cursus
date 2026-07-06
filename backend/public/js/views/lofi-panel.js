/**
 * @fileoverview Lógica del reproductor de música Lofi.
 *
 * @module lofi-panel
 */

'use strict';

let currentLofiVideoId = '3yH2Wo2SaIM';

/**
 * Abre o cierra el panel del reproductor Lofi en el Modo Concentración.
 */
export function toggleLofiPanel() {
    const panel  = document.getElementById('focus-lofi-panel');
    const btn    = document.getElementById('lofi-panel-toggle');
    const iframe = document.getElementById('focus-lofi-iframe');
    if (!panel || !iframe) return;

    const isOpen = panel.classList.contains('show');
    if (isOpen) {
        panel.classList.remove('show');
        if (btn) btn.classList.remove('active');
        iframe.src = '';
    } else {
        panel.classList.add('show');
        if (btn) btn.classList.add('active');
        const select    = document.getElementById('focus-lofi-select');
        const videoId   = select ? select.value : currentLofiVideoId;
        const separator = videoId.includes('?') ? '&' : '?';
        iframe.src      = `https://www.youtube.com/embed/${videoId}${separator}enablejsapi=1&autoplay=1&mute=0`;
    }
}

/**
 * Cambia el canal del reproductor Lofi.
 * @param {string} videoId - ID del video de YouTube a cargar.
 */
export function changeLofiChannel(videoId) {
    currentLofiVideoId = videoId;
    const panel  = document.getElementById('focus-lofi-panel');
    const iframe = document.getElementById('focus-lofi-iframe');
    if (!panel || !iframe) return;
    if (panel.classList.contains('show')) {
        const separator = videoId.includes('?') ? '&' : '?';
        iframe.src      = `https://www.youtube.com/embed/${videoId}${separator}enablejsapi=1&autoplay=1&mute=0`;
    }
}

// Attach to window for inline handlers
window.toggleLofiPanel = toggleLofiPanel;
window.changeLofiChannel = changeLofiChannel;
