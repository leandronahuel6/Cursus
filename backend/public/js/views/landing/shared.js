/**
 * @fileoverview Módulo compartido de inicialización para todas las páginas de
 * landing (welcome y contacto). Centraliza las funcionalidades transversales:
 * ScrollSpy via IntersectionObserver, animación Reveal al scroll, scroll suave
 * en links internos, botón volver arriba y efecto cursor glow en cards.
 *
 * IMPORTANTE: El scroll principal de la página ocurre en el elemento `.page`,
 * NO en `window`. Todos los listeners de scroll deben apuntar al contenedor
 * `.page` para funcionar correctamente con el layout de scroll independiente.
 *
 * @module landing/shared
 */

'use strict';

/**
 * Inicializa Lucide Icons si la biblioteca está disponible en el contexto global.
 * @returns {void}
 */
function initLucide() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

/**
 * Inicializa el ScrollSpy usando IntersectionObserver sobre las secciones con ID.
 * Marca el enlace de navegación correspondiente con la clase `active-link`
 * a medida que el usuario hace scroll dentro del contenedor `.page`.
 *
 * @param {HTMLElement} pageEl - El contenedor principal con scroll (`.page`).
 * @returns {void}
 */
function initScrollSpy(pageEl) {
    const navLinks  = document.querySelectorAll('.landing-nav a');
    const sections  = document.querySelectorAll('section[id]');

    if (!navLinks.length || !sections.length) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const activeId = entry.target.getAttribute('id');
                navLinks.forEach((link) => {
                    const href = link.getAttribute('href') ?? '';
                    const isActive = href === `#${activeId}` || href.endsWith(`#${activeId}`);
                    link.classList.toggle('active-link', isActive);
                    link.setAttribute('aria-current', isActive ? 'true' : 'false');
                });
            });
        },
        {
            root: pageEl,
            rootMargin: '-20% 0px -65% 0px',
            threshold: 0,
        }
    );

    sections.forEach((section) => observer.observe(section));
}

/**
 * Inicializa el observador de animación "Reveal" al hacer scroll.
 * Los elementos con clase `.reveal` se animan al entrar en el viewport.
 * También agrega la clase `.reveal` a elementos conocidos si aún no la tienen.
 *
 * @param {HTMLElement} pageEl - El contenedor principal con scroll (`.page`).
 * @returns {void}
 */
function initRevealObserver(pageEl) {
    const revealTargets = document.querySelectorAll(
        '.step-card, .benefit-card, .purpose-section, .contact-layout, .faq-item, .section-header, .table-wrapper, .testimonial-card, .reveal'
    );

    revealTargets.forEach((el) => {
        if (!el.classList.contains('reveal')) {
            el.classList.add('reveal');
        }
    });

    const observer = new IntersectionObserver(
        (entries, obs) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('active');
                obs.unobserve(entry.target);
            });
        },
        {
            root: pageEl,
            threshold: 0.08,
        }
    );

    revealTargets.forEach((el) => observer.observe(el));
}

/**
 * Inicializa el scroll suave para los enlaces internos (href="#seccion").
 * Compensa el alto del header fijo al calcular la posición destino.
 * Usa scroll en `.page` (no en `window`).
 *
 * @param {HTMLElement} pageEl - El contenedor principal con scroll (`.page`).
 * @returns {void}
 */
function initSmoothScroll(pageEl) {
    const HEADER_H = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--header-h') || '75',
        10
    );

    const internalLinks = document.querySelectorAll(
        '.landing-nav a[href^="#"], .footer-nav a[href^="#"], .btn-hero-secondary[href^="#"]'
    );

    internalLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (!href || !href.startsWith('#')) return;
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            // offsetTop suele fallar si hay elementos padres con 'position: relative'.
            // Usamos BoundingClientRect sumado al scrollTop actual del contenedor pageEl.
            const targetPosition = target.getBoundingClientRect().top + pageEl.scrollTop;
            pageEl.scrollTo({
                top: targetPosition - HEADER_H,
                behavior: 'smooth',
            });
        });
    });
}

/**
 * Inicializa el botón flotante "Volver arriba".
 * Muestra el botón con la clase `.show` al superar 400px de scroll
 * y hace scroll al inicio del contenedor `.page` al hacer clic.
 *
 * @param {HTMLElement} pageEl - El contenedor principal con scroll (`.page`).
 * @returns {void}
 */
function initScrollTopBtn(pageEl) {
    const btn = document.getElementById('scroll-top-btn');
    if (!btn) return;
    
    // Ejecutar solo si estamos en la vista de inicio (desacoplado de clases internas)
    if (pageEl && pageEl.dataset.route !== 'welcome') {
        btn.setAttribute('hidden', '');
        return;
    }

    pageEl.addEventListener('scroll', () => {
        btn.classList.toggle('is-visible', pageEl.scrollTop > 400);
    });

    btn.addEventListener('click', () => {
        pageEl.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/**
 * Inicializa el efecto de iluminación de cursor en las tarjetas (cursor glow).
 * Actualiza las propiedades CSS `--mouse-x` y `--mouse-y` en cada tarjeta
 * a medida que el cursor se mueve sobre ellas. No muta `.style.color` ni similares.
 *
 * @returns {void}
 */
function initCursorGlow() {
    const glowCards = document.querySelectorAll('.benefit-card, .step-card, .testimonial-card');
    glowCards.forEach((card) => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
            card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
        });
    });
}

/**
 * Inicializa el menú de navegación móvil (Off-Canvas).
 * Maneja eventos de teclado (Escape), clics en el overlay y clics
 * en los anclajes para garantizar accesibilidad (ARIA) y una UX fluida.
 *
 * @returns {void}
 */
function initMobileNav() {
    const toggleBtn = document.getElementById('mobile-nav-toggle');
    const closeBtn  = document.getElementById('mobile-nav-close');
    const nav = document.getElementById('landing-nav');
    const overlay = document.getElementById('landing-nav-overlay');
    
    if (!toggleBtn || !nav || !overlay) return;

    const navLinks = nav.querySelectorAll('a');

    // Prevenir doble bind si el script o framework ejecuta DOMContentLoaded múltiples veces
    if (toggleBtn.dataset.mobileNavInitialized === 'true') return;
    toggleBtn.dataset.mobileNavInitialized = 'true';

    const toggleMenu = (forceState) => {
        const isCurrentlyOpen = nav.classList.contains('landing-nav--open');
        const willBeOpen = typeof forceState === 'boolean' ? forceState : !isCurrentlyOpen;

        if (willBeOpen) {
            nav.classList.add('landing-nav--open');
            overlay.classList.add('landing-nav-overlay--active');
            toggleBtn.setAttribute('aria-expanded', 'true');
        } else {
            nav.classList.remove('landing-nav--open');
            overlay.classList.remove('landing-nav-overlay--active');
            toggleBtn.setAttribute('aria-expanded', 'false');
        }
    };

    // Alternar menú desde el botón
    toggleBtn.addEventListener('click', () => toggleMenu());
    
    // Cerrar desde el nuevo botón
    if (closeBtn) {
        closeBtn.addEventListener('click', () => toggleMenu(false));
    }

    // Cerrar desde el overlay
    overlay.addEventListener('click', () => toggleMenu(false));

    // Cerrar con Escape y retornar foco
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && nav.classList.contains('landing-nav--open')) {
            toggleMenu(false);
            toggleBtn.focus();
        }
    });

    // Cierre automático al redimensionar a vista de escritorio (>1248px)
    const mediaQuery = window.matchMedia('(min-width: 1249px)');
    mediaQuery.addEventListener('change', (e) => {
        if (e.matches && nav.classList.contains('landing-nav--open')) {
            toggleMenu(false);
        }
    });

    // Cierre automático al clickear enlaces
    navLinks.forEach(link => {
        link.addEventListener('click', () => toggleMenu(false));
    });
}

/**
 * Punto de entrada principal. Orquesta la inicialización de todos los módulos
 * compartidos de la landing al dispararse el evento `DOMContentLoaded`.
 *
 * @returns {void}
 */
function initLanding() {
    const pageEl = document.querySelector('.page');
    if (!pageEl) return;

    initLucide();
    initScrollSpy(pageEl);
    initRevealObserver(pageEl);
    initSmoothScroll(pageEl);
    initScrollTopBtn(pageEl);
    initCursorGlow();
    initMobileNav();
}

document.addEventListener('DOMContentLoaded', initLanding);

export {
    initLucide,
    initScrollSpy,
    initRevealObserver,
    initSmoothScroll,
    initScrollTopBtn,
    initCursorGlow,
    initMobileNav,
    initLanding,
};
