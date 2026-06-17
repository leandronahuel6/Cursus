(function () {
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

  window.toggleProfileMenu  = toggleProfileMenu;
  window.openContactModal   = openContactModal;
  window.closeContactModal  = closeContactModal;
  window.handleContactSubmit = handleContactSubmit;
})();
