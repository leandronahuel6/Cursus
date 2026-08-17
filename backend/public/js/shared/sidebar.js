/**
 * @fileoverview Módulo de Sidebar — sidebar.js
 *
 * Gestiona el colapso/expansión del menú lateral de navegación y la
 * alternancia de la Vista Alumno para usuarios con rol de administrador.
 *
 * El estado de colapso se persiste en localStorage para restaurarlo
 * al recargar la página. Todos los eventos se registran localmente
 * mediante addEventListener. No expone funciones al objeto global `window`.
 *
 * @module sidebar
 */

(function () {
    document.addEventListener('DOMContentLoaded', function () {
        const sidebar  = document.getElementById('sidebar');
        const toggleBtn = document.getElementById('sb-toggle-btn');
        const logoLink  = document.getElementById('sb-logo-link');

        if (!sidebar || !toggleBtn) return;

        // --- Preservar href original del logo ---
        if (logoLink && logoLink.hasAttribute('href')) {
            logoLink.dataset.href = logoLink.getAttribute('href');
        }

        // --- Restaurar estado de colapso desde localStorage ---
        const isCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
            document.body.classList.add('sidebar-collapsed');
            if (logoLink) {
                logoLink.title = 'Abrir barra lateral';
                logoLink.removeAttribute('href');
            }
        }

        // =========================================================
        // COLAPSO DEL SIDEBAR
        // =========================================================

        /**
         * Alterna el estado de colapso del sidebar y persiste la
         * preferencia en localStorage.
         * Si el menú de perfil estaba abierto, lo cierra.
         *
         * @param {Event} [e] - Evento opcional de clic.
         * @returns {void}
         */
        function toggleSidebar(e) {
            if (e) e.preventDefault();

            const collapsing = !sidebar.classList.contains('collapsed');
            sidebar.classList.toggle('collapsed', collapsing);
            document.body.classList.toggle('sidebar-collapsed', collapsing);
            localStorage.setItem('sidebar_collapsed', collapsing);

            if (logoLink) {
                if (collapsing) {
                    logoLink.title = 'Abrir barra lateral';
                    logoLink.removeAttribute('href');
                } else {
                    logoLink.title = 'Ir al inicio';
                    if (logoLink.dataset.href) {
                        logoLink.setAttribute('href', logoLink.dataset.href);
                    }
                }
            }

            // Cerrar el menú de perfil si estaba abierto al colapsar
            const pMenu   = document.getElementById('profile-menu');
            const userBtn = document.querySelector('.sb-user');
            if (pMenu)   pMenu.classList.remove('open');
            if (userBtn) userBtn.classList.remove('menu-open');
        }

        toggleBtn.addEventListener('click', toggleSidebar);

        // Evitar que el logo redirija al inicio si el sidebar está colapsado
        if (logoLink) {
            logoLink.addEventListener('click', function (e) {
                if (sidebar.classList.contains('collapsed')) {
                    e.preventDefault();
                    toggleSidebar(e);
                }
            });
        }

        // =========================================================
        // VISTA ALUMNO (solo para administradores)
        // =========================================================

        /**
         * Alterna la visibilidad del bloque de ítems de Vista Alumno
         * en el sidebar para el rol de administrador.
         * Persiste el estado en localStorage para restaurarlo al recargar.
         *
         * @returns {void}
         */
        function toggleVistaAlumno() {
            const items   = document.getElementById('sb-alumno-items');
            const chevron = document.getElementById('va-chevron');
            if (!items) return;

            const abierto = items.classList.toggle('collapsed');
            localStorage.setItem('sb_vista_alumno_open', abierto ? 'false' : 'true');
            if (chevron) chevron.classList.toggle('open', !abierto);
        }

        const vaToggle = document.getElementById('sb-vista-alumno-toggle');
        if (vaToggle) {
            vaToggle.addEventListener('click', toggleVistaAlumno);
        }
    });
})();
