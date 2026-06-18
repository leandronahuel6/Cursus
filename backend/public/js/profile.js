(function () {
  function getStoredToken() {
    return localStorage.getItem('token');
  }

  function clearStoredSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  function toggleProfileMenu(e) {
    e.stopPropagation();
    const menu = document.getElementById('profile-menu');
    const user = e.currentTarget;
    const isOpen = menu.classList.toggle('open');
    user.classList.toggle('menu-open', isOpen);
  }

  function closeProfileMenu() {
    const menu = document.getElementById('profile-menu');
    if (!menu || !menu.classList.contains('open')) return;
    menu.classList.remove('open');
    const user = document.querySelector('.sb-user');
    if (user) user.classList.remove('menu-open');
  }

  function openContactModal() {
    closeProfileMenu();
    document.getElementById('contact-overlay').classList.add('open');
  }

  function closeContactModal() {
    document.getElementById('contact-overlay').classList.remove('open');
  }

  function handleContactSubmit(e) {
    e.preventDefault();
    const btn = document.querySelector('.contact-btn-send');
    const original = btn.textContent;
    btn.textContent = '✓ Enviado';
    btn.disabled = true;
    btn.style.background = 'var(--green)';
    setTimeout(function () {
      closeContactModal();
      e.target.reset();
      btn.textContent = original;
      btn.disabled = false;
      btn.style.background = '';
    }, 1500);
  }

  document.addEventListener('click', function (e) {
    const overlay = document.getElementById('contact-overlay');
    if (overlay && overlay.classList.contains('open') && e.target === overlay) {
      closeContactModal();
      return;
    }
    closeProfileMenu();
  });

  // Badge de alertas pendientes en el sidebar/bottom nav, compartido por todas las páginas.
  // Lee el mismo estado que guarda alertas.js en localStorage.
  function updateAlertsBadge() {
    const saved = localStorage.getItem('cursus_alerts_state');
    let count = 0;

    if (saved) {
      const alertsState = JSON.parse(saved);
      const isPaid = alertsState.career === 'TUP' || alertsState.career === 'TUSI';
      let filtered = (alertsState.alerts || []).filter(a => !a.completed);
      if (!isPaid) {
        filtered = filtered.filter(a => a.category !== 'payment' || !a.title.includes('Cuota'));
      }
      count = filtered.length;
    }

    const navBadge = document.getElementById('nav-badge-count');
    const bnavBadge = document.getElementById('bnav-badge-count');
    if (navBadge) navBadge.innerText = count;
    if (bnavBadge) bnavBadge.innerText = count;
  }

  document.addEventListener('DOMContentLoaded', updateAlertsBadge);

  // Datos del usuario logueado: saludo ("Buen día, {nombre}") y bloque de perfil del sidebar
  function applyUserToDOM(user) {
    if (!user) return;

    const greetingTargets = document.querySelectorAll('.greeting-name');
    const firstName = (user.nombre || '').split(' ')[0];
    if (firstName) {
      greetingTargets.forEach(el => el.textContent = firstName);
    }

    const unameEl = document.getElementById('sb-uname');
    const ulegEl = document.getElementById('sb-uleg');
    const avEl = document.getElementById('sb-av');

    if (unameEl && user.nombre) unameEl.textContent = user.nombre;
    if (ulegEl) ulegEl.textContent = user.legajo ? `Legajo ${user.legajo}` : '';
    if (avEl && user.nombre) {
      const parts = user.nombre.trim().split(' ');
      avEl.textContent = ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
    }
  }

  async function handleLogout() {
    const token = getStoredToken();

    try {
      if (token) {
        await fetch('/api/logout', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + token,
            'Accept': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('No se pudo cerrar la sesión remota', error);
    } finally {
      clearStoredSession();
      window.location.href = '/login';
    }
  }

  async function loadUserProfile() {
    // 1. Pintar al instante con lo que ya tengamos guardado (sin esperar la red,
    //    así no se ve por un instante el usuario hardcodeado del HTML).
    const cached = localStorage.getItem('user');
    if (cached) {
      try { applyUserToDOM(JSON.parse(cached)); } catch (e) { /* cache corrupto, se ignora */ }
    }

    const token = getStoredToken();
    if (!token) return;

    // 2. Refrescar contra la API por si los datos cambiaron.
    try {
      const response = await fetch('/api/user', {
        headers: {
          'Authorization': 'Bearer ' + token,
          'Accept': 'application/json'
        }
      });
      if (!response.ok) return;

      const user = await response.json();
      localStorage.setItem('user', JSON.stringify(user));
      applyUserToDOM(user);
    } catch (error) {
      console.error('No se pudo cargar el usuario logueado', error);
    }
  }

  loadUserProfile();
  document.addEventListener('DOMContentLoaded', loadUserProfile);

  window.toggleProfileMenu  = toggleProfileMenu;
  window.openContactModal   = openContactModal;
  window.closeContactModal  = closeContactModal;
  window.handleContactSubmit = handleContactSubmit;
  window.handleLogout = handleLogout;
  window.updateAlertsBadge  = updateAlertsBadge;
})();
