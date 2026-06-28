(function () {
  'use strict';

  function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  function getUser() {
    try {
      const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  // Auth + role guard
  const token = getToken();
  const user  = getUser();
  if (!token || !user) {
    window.location.replace('/login');
    return;
  }
  if (user.role !== 'admin') {
    window.location.replace('/dashboard');
    return;
  }

  // ---- State ----
  let alumnoActual = null;

  // ---- Helpers ----
  function initials(nombre) {
    if (!nombre) return '?';
    return nombre.trim().split(/\s+/).slice(0, 2).map(p => p[0].toUpperCase()).join('');
  }

  function estadoBadge(estado) {
    const map = {
      aprobada: { cls: 'badge-aprobada', label: 'Aprobada' },
      cursando: { cls: 'badge-cursando', label: 'Cursando' },
      regular:  { cls: 'badge-regular',  label: 'Regular'  },
      libre:    { cls: 'badge-libre',    label: 'Libre'    },
    };
    const e = map[estado] ?? { cls: 'badge-libre', label: estado ?? '—' };
    return `<span class="aa-badge ${e.cls}">${e.label}</span>`;
  }

  function showError(msg) {
    const el = document.getElementById('aa-error');
    el.textContent = msg;
    el.hidden = false;
  }

  function hideError() {
    const el = document.getElementById('aa-error');
    el.hidden = true;
    el.textContent = '';
  }

  function setLoading(loading) {
    const btn = document.getElementById('aa-btn-search');
    btn.disabled = loading;
    btn.textContent = loading ? 'Buscando…' : 'Buscar';
  }

  // ---- Buscar alumno ----
  async function aaBuscar(e) {
    e.preventDefault();
    hideError();
    document.getElementById('aa-result').hidden = true;
    alumnoActual = null;

    const legajo = document.getElementById('aa-legajo').value.trim();
    if (!legajo) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/alumnos/buscar?legajo=${encodeURIComponent(legajo)}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) {
        showError(data.message ?? 'Error al buscar el alumno.');
        return;
      }
      alumnoActual = data;
      renderAlumno(data);
    } catch {
      showError('Error de conexión. Revisá que el servidor esté corriendo.');
    } finally {
      setLoading(false);
    }
  }

  function renderAlumno(data) {
    const { usuario, materias, pomodoro, cuota_actual, resumen } = data;

    document.getElementById('aa-av').textContent      = initials(usuario.nombre);
    document.getElementById('aa-nombre').textContent  = usuario.nombre;
    document.getElementById('aa-legajo-txt').textContent = `Legajo ${usuario.legajo}`;
    document.getElementById('aa-email').textContent   = usuario.email;

    document.getElementById('aa-stat-aprobadas').textContent  = resumen.aprobadas;
    document.getElementById('aa-stat-cursando').textContent   = resumen.cursando;
    document.getElementById('aa-stat-pendientes').textContent = resumen.regulares;
    document.getElementById('aa-stat-pomodoro').textContent   = pomodoro.total_horas + 'h';
    document.getElementById('aa-stat-cuota').textContent      = cuota_actual.pagado ? 'Pagó' : 'Pendiente';
    document.getElementById('aa-stat-cuota').className        = 'aa-stat-val ' + (cuota_actual.pagado ? 'text-ok' : 'text-warn');

    // Guardar id para el delete
    document.getElementById('aa-btn-delete').dataset.id = usuario.id;

    // Tabla materias
    const tbody = document.getElementById('aa-materias-body');
    tbody.innerHTML = '';
    if (materias.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="aa-table-empty">Sin materias registradas</td></tr>';
    } else {
      materias.forEach(m => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${m.nombre}</td>
          <td>${m.nivel ?? '—'}</td>
          <td>${estadoBadge(m.estado)}</td>
          <td>${m.nota_promedio !== null ? m.nota_promedio : '—'}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    document.getElementById('aa-result').hidden = false;
  }

  // ---- Eliminar alumno ----
  function aaEliminar() {
    if (!alumnoActual) return;
    const msg = document.getElementById('aa-confirm-msg');
    msg.textContent = `Estás por eliminar a ${alumnoActual.usuario.nombre} (Legajo ${alumnoActual.usuario.legajo}). Esta acción no se puede deshacer.`;
    document.getElementById('aa-confirm-overlay').hidden = false;
  }

  function aaCancelEliminar() {
    document.getElementById('aa-confirm-overlay').hidden = true;
  }

  async function aaConfirmarEliminar() {
    if (!alumnoActual) return;
    const btn = document.getElementById('aa-btn-confirm');
    btn.disabled = true;
    btn.textContent = 'Eliminando…';

    try {
      const res = await fetch(`/api/admin/alumnos/${alumnoActual.usuario.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) {
        document.getElementById('aa-confirm-overlay').hidden = true;
        document.getElementById('aa-result').hidden = true;
        document.getElementById('aa-legajo').value = '';
        alumnoActual = null;
        // Mensaje rápido de éxito
        const err = document.getElementById('aa-error');
        err.textContent = '✓ Alumno eliminado correctamente.';
        err.className = 'aa-error aa-success';
        err.hidden = false;
        setTimeout(() => { err.hidden = true; err.className = 'aa-error'; }, 3000);
      } else {
        alert(data.message ?? 'Error al eliminar.');
      }
    } catch {
      alert('Error de conexión.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Eliminar';
    }
  }

  // Exportar al scope global
  window.aaBuscar          = aaBuscar;
  window.aaEliminar        = aaEliminar;
  window.aaCancelEliminar  = aaCancelEliminar;
  window.aaConfirmarEliminar = aaConfirmarEliminar;
})();
