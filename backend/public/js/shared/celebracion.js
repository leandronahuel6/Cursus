// Festejo de fuegos artificiales al completar el 100% del plan de estudios.
(function () {
  function crearOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'celebracion-overlay';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '9999';
    overlay.style.pointerEvents = 'none';
    document.body.appendChild(overlay);
    return overlay;
  }

  function crearBanner(overlay) {
    const banner = document.createElement('div');
    banner.className = 'celebracion-banner';
    banner.innerHTML = '🎉 ¡Felicitaciones! Completaste todo el plan de estudios 🎓';
    overlay.appendChild(banner);
  }

  function dispararFuegos(overlay) {
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    overlay.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const colores = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#06b6d4'];
    let particulas = [];

    function crearBurst(x, y) {
      const cantidad = 60;
      for (let i = 0; i < cantidad; i++) {
        const angulo = (Math.PI * 2 * i) / cantidad;
        const velocidad = 2 + Math.random() * 3.5;
        particulas.push({
          x, y,
          vx: Math.cos(angulo) * velocidad,
          vy: Math.sin(angulo) * velocidad,
          color: colores[Math.floor(Math.random() * colores.length)],
          vida: 1,
        });
      }
    }

    let bursts = 0;
    const maxBursts = 6;
    const burstInterval = setInterval(() => {
      crearBurst(
        canvas.width * (0.2 + Math.random() * 0.6),
        canvas.height * (0.2 + Math.random() * 0.4)
      );
      bursts++;
      if (bursts >= maxBursts) clearInterval(burstInterval);
    }, 500);

    let activo = true;
    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particulas.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // gravedad
        p.vida -= 0.012;
        ctx.globalAlpha = Math.max(p.vida, 0);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      particulas = particulas.filter((p) => p.vida > 0);

      if (activo || particulas.length > 0) {
        requestAnimationFrame(loop);
      }
    }
    loop();

    setTimeout(() => {
      activo = false;
      clearInterval(burstInterval);
    }, 4000);
  }

  // Llamar una sola vez cuando se completa el 100% del plan de estudios.
  window.celebrarPlanCompleto = function () {
    const overlay = crearOverlay();
    crearBanner(overlay);

    const animacionesOk = !window.animacionesHabilitadas || window.animacionesHabilitadas();
    if (animacionesOk) {
      dispararFuegos(overlay);
    }

    setTimeout(() => overlay.remove(), 5500);
  };
})();
