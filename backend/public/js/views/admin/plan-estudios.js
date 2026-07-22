(function () {
  'use strict';

  function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }
  function getUser() {
    try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user')); } catch { return null; }
  }

  function mostrarAccesoRestringido(mensaje, destino) {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0f172a;z-index:9999;gap:12px;';
    el.innerHTML = `
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <p style="color:#f1f5f9;font-size:20px;font-weight:700;margin:0;">Acceso restringido</p>
      <p style="color:#94a3b8;font-size:14px;margin:0;text-align:center;max-width:320px;">${mensaje}</p>
      <p style="color:#475569;font-size:12px;margin:0;">Redirigiendo...</p>
    `;
    document.body.appendChild(el);
    document.body.style.visibility = 'visible';
    setTimeout(() => window.location.replace(destino), 2500);
  }

  const token = getToken(), user = getUser();
  if (!token || !user) {
    mostrarAccesoRestringido('Debés iniciar sesión para acceder a esta sección.', '/login');
    return;
  }
  if (user.role !== 'admin') {
    mostrarAccesoRestringido('No tenés permisos para acceder al panel de administración.', '/dashboard');
    return;
  }

  document.body.style.visibility = 'visible';

  // ---- State ----
  let todasMaterias  = [];
  let carreraId      = null;
  let eliminandoId   = null;
  let modoEdicion    = false;

  // ---- Cargar plan ----
  async function cargar() {
    try {
      const res = await fetch('/api/admin/plan-estudios', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      carreraId     = data.carrera_id;
      todasMaterias = data.materias;
      renderTablas();
    } catch {
      document.getElementById('pe-subtitle').textContent = 'Error al cargar el plan de estudios.';
    }
  }

  function nombrePorId(id) {
    return todasMaterias.find(m => m.id === id)?.nombre ?? `#${id}`;
  }

  function renderTablas() {
    const total = todasMaterias.length;
    document.getElementById('pe-subtitle').textContent = `${total} materia${total !== 1 ? 's' : ''} en el plan`;

    [1, 2].forEach(nivel => {
      const lista = todasMaterias.filter(m => m.nivel === nivel);
      document.getElementById(`pe-count-${nivel}`).textContent = `${lista.length} materia${lista.length !== 1 ? 's' : ''}`;
      const tbody = document.getElementById(`pe-tbody-${nivel}`);
      tbody.innerHTML = '';

      if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="admin-table-empty">Sin materias</td></tr>';
        return;
      }

      lista.forEach(m => {
        const cursadas  = (m.prereq.cursadas || []).map(id => `<span class="pe-chip">${nombrePorId(id)}</span>`).join('') || '<span class="pe-none">—</span>';
        const aprobadas = (m.prereq.aprobadas || []).map(id => `<span class="pe-chip pe-chip-ap">${nombrePorId(id)}</span>`).join('') || '<span class="pe-none">—</span>';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="pe-td-nombre">${m.nombre}</td>
          <td class="pe-td-chips">${cursadas}</td>
          <td class="pe-td-chips">${aprobadas}</td>
          <td class="pe-td-actions">
            <button class="pe-btn-edit" onclick="window.peAbrirModal(${m.id})">Editar</button>
            <button class="pe-btn-del" onclick="window.peEliminar(${m.id})">Eliminar</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    });
  }

  // ---- Modal ----
  function peAbrirModal(id) {
    modoEdicion = !!id;
    document.getElementById('pe-modal-title').textContent = id ? 'Editar materia' : 'Nueva materia';
    document.getElementById('pe-id').value = id ?? '';
    document.getElementById('pe-nombre').value = '';
    document.getElementById('pe-nivel').value = '1';

    // Construir checkboxes (excluyendo la materia que se edita)
    const otras = todasMaterias.filter(m => m.id !== id);
    buildChecks('pe-check-cursadas', otras);
    buildChecks('pe-check-aprobadas', otras);

    if (id) {
      const m = todasMaterias.find(m => m.id === id);
      if (m) {
        document.getElementById('pe-nombre').value = m.nombre;
        document.getElementById('pe-nivel').value  = m.nivel;
        setChecked('pe-check-cursadas', m.prereq.cursadas || []);
        setChecked('pe-check-aprobadas', m.prereq.aprobadas || []);
      }
    }

    document.getElementById('pe-modal').hidden = false;
    document.documentElement.style.overflow = 'hidden';
  }

  function peCerrarModal() {
    document.getElementById('pe-modal').hidden = true;
    document.documentElement.style.overflow = '';
  }

  function buildChecks(containerId, materias) {
    const el = document.getElementById(containerId);
    el.innerHTML = '';
    if (materias.length === 0) {
      el.innerHTML = '<span class="pe-none">Sin otras materias</span>';
      return;
    }
    materias.forEach(m => {
      const label = document.createElement('label');
      label.className = 'pe-check-item';
      label.innerHTML = `<input type="checkbox" value="${m.id}"> <span>${m.nombre}</span>`;
      el.appendChild(label);
    });
  }

  function setChecked(containerId, ids) {
    document.querySelectorAll(`#${containerId} input[type=checkbox]`).forEach(cb => {
      cb.checked = ids.includes(parseInt(cb.value));
    });
  }

  function getChecked(containerId) {
    return [...document.querySelectorAll(`#${containerId} input[type=checkbox]:checked`)]
      .map(cb => parseInt(cb.value));
  }

  // ---- Guardar ----
  async function peGuardar(e) {
    e.preventDefault();
    const btn = document.getElementById('pe-btn-guardar');
    btn.disabled = true;
    btn.textContent = 'Guardando…';

    const id     = document.getElementById('pe-id').value;
    const body   = {
      carrera_id: carreraId,
      nombre:     document.getElementById('pe-nombre').value.trim(),
      nivel:      parseInt(document.getElementById('pe-nivel').value),
      prereq: {
        cursadas:  getChecked('pe-check-cursadas'),
        aprobadas: getChecked('pe-check-aprobadas'),
      },
    };

    try {
      const url    = id ? `/api/admin/plan-estudios/${id}` : '/api/admin/plan-estudios';
      const method = id ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message ?? 'Error al guardar.'); return; }

      // Actualizar state local
      if (id) {
        const idx = todasMaterias.findIndex(m => m.id === parseInt(id));
        if (idx !== -1) todasMaterias[idx] = data;
      } else {
        todasMaterias.push(data);
      }

      peCerrarModal();
      renderTablas();
    } catch {
      alert('Error de conexión.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Guardar';
    }
  }

  // ---- Eliminar ----
  function peEliminar(id) {
    eliminandoId = id;
    const m = todasMaterias.find(m => m.id === id);
    document.getElementById('pe-confirm-msg').textContent =
      `Estás por eliminar "${m?.nombre}". Se eliminarán también sus correlatividades. Esta acción no se puede deshacer.`;
    document.getElementById('pe-confirm-overlay').hidden = false;
    document.documentElement.style.overflow = 'hidden';
  }

  function peCancelarEliminar() {
    document.getElementById('pe-confirm-overlay').hidden = true;
    document.documentElement.style.overflow = '';
    eliminandoId = null;
  }

  async function peConfirmarEliminar() {
    if (!eliminandoId) return;
    const btn = document.getElementById('pe-btn-confirm');
    btn.disabled = true;
    btn.textContent = 'Eliminando…';

    try {
      const res = await fetch(`/api/admin/plan-estudios/${eliminandoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        todasMaterias = todasMaterias
          .filter(m => m.id !== eliminandoId)
          .map(m => ({
            ...m,
            prereq: {
              cursadas:  (m.prereq.cursadas  || []).filter(id => id !== eliminandoId),
              aprobadas: (m.prereq.aprobadas || []).filter(id => id !== eliminandoId),
            },
          }));
        peCancelarEliminar();
        renderTablas();
      } else {
        const data = await res.json();
        alert(data.message ?? 'Error al eliminar.');
      }
    } catch {
      alert('Error de conexión.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Eliminar';
    }
  }

  // Exportar
  window.peAbrirModal       = peAbrirModal;
  window.peCerrarModal      = peCerrarModal;
  window.peGuardar          = peGuardar;
  window.peEliminar         = peEliminar;
  window.peCancelarEliminar = peCancelarEliminar;
  window.peConfirmarEliminar = peConfirmarEliminar;

  cargar();
})();
