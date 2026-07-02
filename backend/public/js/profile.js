(function () {
  // El token vive en localStorage si se marcó "Recordarme" al iniciar sesión,
  // o en sessionStorage si no (se pierde al cerrar el navegador).
  function getStoredToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  if (!getStoredToken()) {
    window.location.replace('/login');
    return;
  }

  // Las páginas de admin se revelan después del chequeo de rol en su propio JS
  if (!window.location.pathname.startsWith('/admin')) {
    document.body.style.visibility = 'visible';
  }

  function getStoredUser() {
    return localStorage.getItem('user') || sessionStorage.getItem('user');
  }

  function clearStoredSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
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

  async function handleContactSubmit(e) {
    e.preventDefault();
    const btn = document.querySelector('.contact-btn-send');
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Enviando...';

    const storedUser = getStoredUser();
    let remitenteNombre = '';
    let remitenteEmail = '';
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        remitenteNombre = u.nombre || '';
        remitenteEmail = u.email || '';
      } catch (_) {}
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          tipo: document.getElementById('contact-type').value,
          asunto: document.getElementById('contact-subject').value,
          descripcion: document.getElementById('contact-body-msg').value,
          remitente_nombre: remitenteNombre,
          remitente_email: remitenteEmail,
        })
      });
      if (!res.ok) throw new Error('Error');
      btn.textContent = '✓ Enviado';
      btn.style.background = 'var(--green)';
      setTimeout(function () {
        closeContactModal();
        e.target.reset();
        btn.textContent = original;
        btn.disabled = false;
        btn.style.background = '';
      }, 1500);
    } catch (_) {
      btn.textContent = 'Error al enviar';
      btn.style.background = '#ef4444';
      setTimeout(function () {
        btn.textContent = original;
        btn.disabled = false;
        btn.style.background = '';
      }, 2000);
    }
  }

  document.addEventListener('click', function (e) {
    const overlay = document.getElementById('contact-overlay');
    if (overlay && overlay.classList.contains('open') && e.target === overlay) {
      closeContactModal();
      return;
    }
    const profileOverlay = document.getElementById('profile-edit-overlay');
    if (profileOverlay && profileOverlay.classList.contains('open') && e.target === profileOverlay) {
      closeProfileModal();
      return;
    }
    const cpOverlay = document.getElementById('change-password-overlay');
    if (cpOverlay && cpOverlay.classList.contains('open') && e.target === cpOverlay) {
      closeChangePasswordModal();
      return;
    }
    closeProfileMenu();
  });

  // Badge de alertas pendientes en el sidebar/bottom nav, compartido por todas las páginas.
  // Cuenta solo las alertas de los próximos 7 días (las de mayor prioridad), traídas de la BD.
  function diasHastaAlerta(fechaStr) {
    const hoy = new Date();
    const fecha = new Date(fechaStr + 'T00:00:00');
    const dHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const dFecha = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    return Math.ceil((dFecha - dHoy) / (1000 * 60 * 60 * 24));
  }

  async function updateAlertsBadge() {
    const token = getStoredToken();
    const navBadge = document.getElementById('nav-badge-count');
    const bnavBadge = document.getElementById('bnav-badge-count');
    if (!token || (!navBadge && !bnavBadge)) return;

    try {
      const response = await fetch('/api/alertas', {
        headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' }
      });
      if (!response.ok) return;

      const alertas = await response.json();
      const count = alertas.filter(a => !a.completada && diasHastaAlerta(a.fecha) <= 7).length;

      if (navBadge) navBadge.innerText = count;
      if (bnavBadge) bnavBadge.innerText = count;
    } catch (error) {
      console.error('No se pudo cargar el contador de alertas', error);
    }
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
    const bnAvEl = document.getElementById('bn-av');
    
    // PM header elements (Mobile profile modal like GitHub)
    const pmUnameEl = document.getElementById('pm-uname');
    const pmUlegEl = document.getElementById('pm-uleg');
    const pmAvEl = document.getElementById('pm-av');

    if (unameEl && user.nombre) unameEl.textContent = user.nombre;
    if (ulegEl) ulegEl.textContent = user.legajo ? `Legajo ${user.legajo}` : '';
    
    if (pmUnameEl && user.nombre) pmUnameEl.textContent = user.nombre;
    if (pmUlegEl) pmUlegEl.textContent = user.legajo ? `Legajo ${user.legajo}` : '';

    if (user.nombre) {
      const parts = user.nombre.trim().split(' ');
      const initials = ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
      [avEl, bnAvEl, pmAvEl, document.getElementById('profile-avatar-preview')].forEach(el => {
        if (!el) return;
        if (user.avatar_url) {
          el.style.backgroundImage = `url('${user.avatar_url}')`;
          el.textContent = '';
        } else {
          el.style.backgroundImage = '';
          el.textContent = initials;
        }
      });
    }

    const deleteBtn = document.getElementById('profile-avatar-delete-btn');
    if (deleteBtn) deleteBtn.style.display = user.avatar_url ? 'flex' : 'none';

    // Mostrar sección admin en sidebar solo si es admin
    const isAdmin = user.role === 'admin';
    if (isAdmin) {
      document.body.classList.add('is-admin');
    } else {
      document.body.classList.remove('is-admin');
    }
    ['admin-nav-group', 'admin-nav-alumnos', 'admin-nav-cuotas', 'admin-nav-plan'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = isAdmin ? '' : 'none';
    });

    // Toggle "Vista Alumno" para admin
    const toggle = document.getElementById('sb-vista-alumno-toggle');
    const alumnoItems = document.getElementById('sb-alumno-items');
    if (toggle) toggle.style.display = isAdmin ? '' : 'none';
    if (isAdmin && alumnoItems) {
      // Por defecto colapsado para admin; restaurar estado guardado
      const abierto = localStorage.getItem('sb_vista_alumno_open') === 'true';
      alumnoItems.classList.toggle('collapsed', !abierto);
      const chevron = document.getElementById('va-chevron');
      if (chevron) chevron.classList.toggle('open', abierto);
    }
  }

  // Pop up para editar los datos de perfil (nombre, legajo, email)
  function clearProfileFormErrors() {
    ['profile-nombre-error', 'profile-legajo-error', 'profile-email-error'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '';
    });
  }

  function openProfileModal() {
    closeProfileMenu();
    clearProfileFormErrors();

    const cached = getStoredUser();
    if (cached) {
      try {
        const user = JSON.parse(cached);
        document.getElementById('profile-nombre').value = user.nombre || '';
        document.getElementById('profile-legajo').value = user.legajo || '';
        document.getElementById('profile-email').value = user.email || '';
      } catch (e) { /* cache corrupto, se ignora */ }
    }

    document.getElementById('profile-edit-overlay').classList.add('open');
  }

  // Foto pendiente de confirmación: se previsualiza localmente y sólo se sube
  // (o se elimina) contra la API cuando el usuario toca "Guardar cambios".
  // Si cancela, todo se descarta y se restaura el avatar realmente guardado.
  let pendingAvatarFile = null;
  let pendingAvatarPreviewUrl = null;
  let pendingAvatarRemove = false;

  function discardPendingAvatar() {
    pendingAvatarFile = null;
    pendingAvatarRemove = false;
    if (pendingAvatarPreviewUrl) {
      URL.revokeObjectURL(pendingAvatarPreviewUrl);
      pendingAvatarPreviewUrl = null;
    }
    const input = document.getElementById('profile-avatar-input');
    if (input) input.value = '';
    const errorEl = document.getElementById('profile-avatar-error');
    if (errorEl) errorEl.textContent = '';

    // Restaurar la vista previa al avatar realmente guardado (o iniciales).
    const preview = document.getElementById('profile-avatar-preview');
    const deleteBtn = document.getElementById('profile-avatar-delete-btn');
    if (!preview) return;
    const cached = getStoredUser();
    let user = null;
    if (cached) {
      try { user = JSON.parse(cached); } catch (e) { /* cache corrupto, se ignora */ }
    }
    if (user && user.avatar_url) {
      preview.style.backgroundImage = `url('${user.avatar_url}')`;
      preview.textContent = '';
      if (deleteBtn) deleteBtn.style.display = 'flex';
    } else {
      preview.style.backgroundImage = '';
      if (user && user.nombre) {
        const parts = user.nombre.trim().split(' ');
        preview.textContent = ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
      }
      if (deleteBtn) deleteBtn.style.display = 'none';
    }
  }

  function closeProfileModal() {
    discardPendingAvatar();
    document.getElementById('profile-edit-overlay').classList.remove('open');
  }

  function handleAvatarFileChange(e) {
    const file = e.target.files[0];
    const errorEl = document.getElementById('profile-avatar-error');
    errorEl.textContent = '';
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg'];
    if (!allowedTypes.includes(file.type)) {
      errorEl.textContent = 'Solo se permiten imágenes PNG o JPG.';
      e.target.value = '';
      return;
    }

    if (pendingAvatarPreviewUrl) {
      URL.revokeObjectURL(pendingAvatarPreviewUrl);
    }
    pendingAvatarFile = file;
    pendingAvatarPreviewUrl = URL.createObjectURL(file);
    pendingAvatarRemove = false;

    const preview = document.getElementById('profile-avatar-preview');
    preview.style.backgroundImage = `url('${pendingAvatarPreviewUrl}')`;
    preview.textContent = '';

    const deleteBtn = document.getElementById('profile-avatar-delete-btn');
    if (deleteBtn) deleteBtn.style.display = 'flex';
  }

  function handleAvatarDelete() {
    if (pendingAvatarPreviewUrl) {
      URL.revokeObjectURL(pendingAvatarPreviewUrl);
      pendingAvatarPreviewUrl = null;
    }
    pendingAvatarFile = null;
    pendingAvatarRemove = true;

    const input = document.getElementById('profile-avatar-input');
    if (input) input.value = '';
    const errorEl = document.getElementById('profile-avatar-error');
    if (errorEl) errorEl.textContent = '';

    const preview = document.getElementById('profile-avatar-preview');
    const nombre = document.getElementById('profile-nombre')?.value || '';
    const parts = nombre.trim().split(' ');
    preview.style.backgroundImage = '';
    preview.textContent = ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();

    const deleteBtn = document.getElementById('profile-avatar-delete-btn');
    if (deleteBtn) deleteBtn.style.display = 'none';
  }

  async function uploadPendingAvatar(token) {
    const formData = new FormData();
    formData.append('avatar', pendingAvatarFile);

    const response = await fetch('/api/profile/avatar', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: formData
    });

    const data = await response.json();
    if (!response.ok) {
      const errorEl = document.getElementById('profile-avatar-error');
      if (errorEl) errorEl.textContent = data.errors?.avatar?.[0] || data.message || 'No se pudo actualizar la foto.';
      throw new Error('avatar-upload-failed');
    }
    return data;
  }

  async function deleteAvatarNow(token) {
    const response = await fetch('/api/profile/avatar', {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    });

    const data = await response.json();
    if (!response.ok) {
      const errorEl = document.getElementById('profile-avatar-error');
      if (errorEl) errorEl.textContent = data.message || 'No se pudo eliminar la foto.';
      throw new Error('avatar-delete-failed');
    }
    return data;
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    clearProfileFormErrors();

    const token = getStoredToken();
    if (!token) return;

    const nombre = document.getElementById('profile-nombre').value.trim();
    const legajo = document.getElementById('profile-legajo').value.trim();
    const email = document.getElementById('profile-email').value.trim();

    const btn = document.querySelector('#profile-edit-form .contact-btn-send');
    const original = btn.textContent;
    btn.disabled = true;

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ nombre, legajo: legajo || null, email })
      });

      let data = await response.json();

      if (!response.ok) {
        if (data.errors?.nombre) document.getElementById('profile-nombre-error').textContent = data.errors.nombre[0];
        if (data.errors?.legajo) document.getElementById('profile-legajo-error').textContent = data.errors.legajo[0];
        if (data.errors?.email) document.getElementById('profile-email-error').textContent = data.errors.email[0];
        btn.disabled = false;
        return;
      }

      // Si el usuario eligió una foto nueva o marcó eliminarla, recién ahora se aplica.
      if (pendingAvatarFile) {
        data = await uploadPendingAvatar(token);
        pendingAvatarFile = null;
        if (pendingAvatarPreviewUrl) {
          URL.revokeObjectURL(pendingAvatarPreviewUrl);
          pendingAvatarPreviewUrl = null;
        }
      } else if (pendingAvatarRemove) {
        data = await deleteAvatarNow(token);
        pendingAvatarRemove = false;
      }

      // Guardar en el mismo storage donde ya vive el token y refrescar la UI.
      const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
      storage.setItem('user', JSON.stringify(data));
      applyUserToDOM(data);

      btn.textContent = '✓ Guardado';
      setTimeout(() => {
        document.getElementById('profile-edit-overlay').classList.remove('open');
        btn.textContent = original;
        btn.disabled = false;
      }, 900);
    } catch (error) {
      console.error('No se pudo actualizar el perfil', error);
      btn.disabled = false;
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
    const cached = getStoredUser();
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
      // Guardar el refresh en el mismo storage donde ya vive el token.
      const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
      storage.setItem('user', JSON.stringify(user));
      applyUserToDOM(user);
    } catch (error) {
      console.error('No se pudo cargar el usuario logueado', error);
    }
  }

  loadUserProfile();
  document.addEventListener('DOMContentLoaded', loadUserProfile);

  function openChangePasswordModal() {
    closeProfileModal();
    document.getElementById('change-password-form').reset();
    ['cp-current-error', 'cp-new-error', 'cp-confirm-error'].forEach(id => {
      document.getElementById(id).textContent = '';
    });
    const success = document.getElementById('cp-success');
    success.hidden = true;
    success.textContent = '';
    document.getElementById('cp-submit').disabled = false;
    document.getElementById('change-password-overlay').classList.add('open');
  }

  function closeChangePasswordModal() {
    document.getElementById('change-password-overlay').classList.remove('open');
  }

  async function handleChangePasswordSubmit(e) {
    e.preventDefault();

    const current      = document.getElementById('cp-current');
    const newPwd       = document.getElementById('cp-new');
    const confirm      = document.getElementById('cp-confirm');
    const currentError = document.getElementById('cp-current-error');
    const newError     = document.getElementById('cp-new-error');
    const confirmError = document.getElementById('cp-confirm-error');
    const successEl    = document.getElementById('cp-success');
    const submitBtn    = document.getElementById('cp-submit');

    currentError.textContent = '';
    newError.textContent = '';
    confirmError.textContent = '';
    successEl.hidden = true;

    if (!current.value) {
      currentError.textContent = 'Ingresá tu contraseña actual';
      current.focus();
      return;
    }
    if (newPwd.value.length < 8) {
      newError.textContent = 'La nueva contraseña debe tener al menos 8 caracteres';
      newPwd.focus();
      return;
    }
    if (newPwd.value !== confirm.value) {
      confirmError.textContent = 'Las contraseñas no coinciden';
      confirm.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';

    try {
      const response = await fetch('/api/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + getStoredToken()
        },
        body: JSON.stringify({
          current_password: current.value,
          password: newPwd.value,
          password_confirmation: confirm.value
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors?.current_password) {
          currentError.textContent = data.errors.current_password[0];
        } else if (data.errors?.password) {
          newError.textContent = data.errors.password[0];
        } else {
          currentError.textContent = data.message || 'Ocurrió un error';
        }
        return;
      }

      successEl.textContent = data.message;
      successEl.hidden = false;
      document.getElementById('change-password-form').reset();
      setTimeout(closeChangePasswordModal, 2000);

    } catch (err) {
      currentError.textContent = 'Error de conexión';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Guardar cambios';
    }
  }

  function toggleMobileProfileMenu(e) {
    e.stopPropagation();
    const menu = document.getElementById('profile-menu');
    menu.classList.toggle('open');
  }

  window.toggleProfileMenu         = toggleProfileMenu;
  window.toggleMobileProfileMenu   = toggleMobileProfileMenu;
  window.openContactModal          = openContactModal;
  window.closeContactModal         = closeContactModal;
  window.handleContactSubmit       = handleContactSubmit;
  window.openProfileModal          = openProfileModal;
  window.closeProfileModal         = closeProfileModal;
  window.handleProfileSubmit       = handleProfileSubmit;
  window.handleAvatarFileChange    = handleAvatarFileChange;
  window.handleAvatarDelete        = handleAvatarDelete;
  window.handleLogout              = handleLogout;
  window.updateAlertsBadge         = updateAlertsBadge;
  window.openChangePasswordModal   = openChangePasswordModal;
  window.closeChangePasswordModal  = closeChangePasswordModal;
  window.handleChangePasswordSubmit = handleChangePasswordSubmit;

  window.toggleVistaAlumno = function () {
    const items   = document.getElementById('sb-alumno-items');
    const chevron = document.getElementById('va-chevron');
    if (!items) return;
    const abierto = items.classList.toggle('collapsed');
    // toggle devuelve true si la clase fue AÑADIDA (collapsed), false si fue removida
    localStorage.setItem('sb_vista_alumno_open', abierto ? 'false' : 'true');
    if (chevron) chevron.classList.toggle('open', !abierto);
  };
})();
