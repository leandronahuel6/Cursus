(function () {
  const STORAGE_KEY = 'cursus_animaciones';
  const DURACION_SLIDER_MS = 220;
  let timeoutApagado = null;

  function setAnimaciones(habilitadas, { instantaneo = false } = {}) {
    localStorage.setItem(STORAGE_KEY, habilitadas ? 'on' : 'off');

    const toggle = document.getElementById('animaciones-toggle');
    if (toggle) toggle.checked = habilitadas;

    clearTimeout(timeoutApagado);

    if (habilitadas || instantaneo) {
      // Al prender (o en la carga inicial) no hay nada que esperar.
      document.body.classList.toggle('no-animations', !habilitadas);
    } else {
      // Al apagar, dejamos que el propio slider del switch termine su
      // animación antes de matar las transiciones de toda la app.
      timeoutApagado = setTimeout(() => {
        document.body.classList.add('no-animations');
      }, DURACION_SLIDER_MS);
    }
  }

  function resolveInitial() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved !== 'off'; // Habilitadas por defecto
  }

  // Otras pantallas (ej. festejo al aprobar todas las materias) consultan esto
  // antes de disparar una animación.
  window.animacionesHabilitadas = function () {
    return localStorage.getItem(STORAGE_KEY) !== 'off';
  };

  document.addEventListener('DOMContentLoaded', function () {
    setAnimaciones(resolveInitial(), { instantaneo: true });

    const toggle = document.getElementById('animaciones-toggle');
    if (toggle) {
      toggle.addEventListener('change', () => setAnimaciones(toggle.checked));
    }
  });
})();
