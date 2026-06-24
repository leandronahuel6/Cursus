(function() {
  document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sb-toggle-btn');
    const logoLink = document.getElementById('sb-logo-link');

    if (!sidebar || !toggleBtn) return;

    // Guardar href original
    if (logoLink && logoLink.hasAttribute('href')) {
      logoLink.dataset.href = logoLink.getAttribute('href');
    }

    // Load state from localStorage
    const isCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
    if (isCollapsed) {
      sidebar.classList.add('collapsed');
      document.body.classList.add('sidebar-collapsed');
      if (logoLink) {
        logoLink.title = 'Abrir barra lateral';
        logoLink.removeAttribute('href');
      }
    }

    // Toggle click
    window.toggleSidebar = function(e) {
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
          if (logoLink.dataset.href) logoLink.setAttribute('href', logoLink.dataset.href);
        }
      }

      // Close profile menu if it was open
      const pMenu = document.getElementById('profile-menu');
      if (pMenu) pMenu.classList.remove('open');
      const userBtn = document.querySelector('.sb-user');
      if (userBtn) userBtn.classList.remove('menu-open');
    };

    if (logoLink) {
      // Evitar que el logo redirija al inicio si la sidebar está cerrada (funciona como toggle)
      logoLink.addEventListener('click', (e) => {
        if (sidebar.classList.contains('collapsed')) {
          e.preventDefault();
          window.toggleSidebar(e);
        }
      });
    }
  });
})();
