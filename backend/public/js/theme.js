(function () {
  function setTheme(theme) {
    const isDark = theme === 'dark';
    document.body.classList.toggle('dark-mode', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    // Sin esto, los controles nativos (el popup de <select>, por ejemplo)
    // pueden seguir el tema del sistema operativo en vez del tema del sitio.
    const meta = document.getElementById('color-scheme-meta');
    if (meta) meta.setAttribute('content', isDark ? 'dark' : 'light');
  }

  function resolveInitialTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function toggleTheme() {
    const isDark = document.body.classList.contains('dark-mode');
    setTheme(isDark ? 'light' : 'dark');
  }

  function bindToggleButtons() {
    const buttons = document.querySelectorAll('[data-theme-toggle]');
    buttons.forEach((button) => {
      button.addEventListener('click', toggleTheme);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setTheme(resolveInitialTheme());
    bindToggleButtons();
  });
})();
