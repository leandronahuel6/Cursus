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

  const token = getToken();
  const user  = getUser();
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
  let todosAlumnos = [];
  let filtroActual = 'todos';

  // ---- Helpers ----
  function formatPeriodo(periodo) {
    const [y, m] = periodo.split('-');
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    return `${meses[parseInt(m) - 1]} ${y}`;
  }

  function formatFecha(fecha) {
    if (!fecha) return '—';
    const solo = fecha.split('T')[0]; // saca la parte de tiempo si viene como ISO
    const [y, m, d] = solo.split('-');
    return `${d}/${m}/${y}`;
  }

  function formatMonto(valor) {
    if (valor == null) return '—';
    return '$' + parseFloat(valor).toLocaleString('es-AR', { minimumFractionDigits: 2 });
  }

  // ---- Cargar datos ----
  async function cargarDatos() {
    try {
      const res = await fetch('/api/admin/cuotas/estado', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      renderDatos(data);
    } catch {
      document.getElementById('ac-loading').textContent = 'Error al cargar los datos.';
    }
  }

  function renderDatos(data) {
    // Cuota vigente
    if (data.cuota_vigente) {
      document.getElementById('ac-monto-actual').textContent  = formatMonto(data.cuota_vigente.valor_mensual);
      document.getElementById('ac-vigente-desde').textContent = 'Vigente desde ' + formatFecha(data.cuota_vigente.vigente_desde);
    } else {
      document.getElementById('ac-monto-actual').textContent  = 'Sin cuota cargada';
      document.getElementById('ac-vigente-desde').textContent = '';
    }

    // Cuota próxima programada
    const proximaEl = document.getElementById('ac-proxima-notice');
    if (data.cuota_proxima) {
      proximaEl.textContent = `Próxima: ${formatMonto(data.cuota_proxima.valor_mensual)} a partir del ${formatFecha(data.cuota_proxima.vigente_desde)}`;
      proximaEl.hidden = false;
    } else {
      proximaEl.hidden = true;
    }

    // Carreras en el select
    const select = document.getElementById('ac-carrera');
    select.innerHTML = '';
    (data.carreras || []).forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.nombre;
      select.appendChild(opt);
    });

    // Resumen
    document.getElementById('ac-periodo-label').textContent   = formatPeriodo(data.periodo);
    document.getElementById('ac-stat-total').textContent      = data.resumen.total;
    document.getElementById('ac-stat-pagaron').textContent    = data.resumen.pagaron;
    document.getElementById('ac-stat-pendientes').textContent = data.resumen.pendientes;

    todosAlumnos = data.alumnos;
    renderTabla(todosAlumnos);
  }

  function renderTabla(alumnos) {
    const tbody = document.getElementById('ac-tbody');
    const loading = document.getElementById('ac-loading');
    const table = document.getElementById('ac-table');

    loading.hidden = true;
    tbody.innerHTML = '';

    if (alumnos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="aa-table-empty">Sin alumnos registrados</td></tr>';
    } else {
      alumnos.forEach(a => {
        const tr = document.createElement('tr');
        const badge = a.pagado
          ? '<span class="aa-badge badge-aprobada">Pagó</span>'
          : '<span class="aa-badge badge-libre">Pendiente</span>';
        tr.innerHTML = `
          <td>${a.nombre}</td>
          <td>${a.legajo ?? '—'}</td>
          <td>${badge}</td>
          <td>${formatFecha(a.fecha_pago)}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    table.hidden = false;
  }

  // ---- Filtro ----
  function acFiltrar(btn) {
    document.querySelectorAll('.ac-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filtroActual = btn.dataset.filter;

    let lista = todosAlumnos;
    if (filtroActual === 'pagaron')    lista = todosAlumnos.filter(a => a.pagado);
    if (filtroActual === 'pendientes') lista = todosAlumnos.filter(a => !a.pagado);
    renderTabla(lista);
  }

  // ---- Formulario nueva cuota ----
  function acToggleForm() {
    const form = document.getElementById('ac-form');
    const btnEdit = document.getElementById('ac-btn-edit');
    
    const isShowing = form.classList.toggle('show');
    btnEdit.hidden = isShowing;

    if (isShowing) {
      // Prellenar fecha de hoy
      document.getElementById('ac-desde').value = new Date().toISOString().split('T')[0];
    }
  }

  async function acGuardarCuota(e) {
    e.preventDefault();
    const btn = document.getElementById('ac-btn-guardar');
    btn.disabled = true;
    btn.textContent = 'Guardando…';

    try {
      const res = await fetch('/api/admin/cuotas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          carrera_id:    document.getElementById('ac-carrera').value,
          valor_mensual: document.getElementById('ac-valor').value,
          vigente_desde: document.getElementById('ac-desde').value,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        document.getElementById('ac-form').classList.remove('show');
        document.getElementById('ac-btn-edit').hidden = false;
        document.getElementById('ac-valor').value = '';
        await cargarDatos();
      } else {
        alert(data.message ?? 'Error al guardar la cuota.');
      }
    } catch {
      alert('Error de conexión.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Guardar';
    }
  }

  // Exportar
  window.acToggleForm    = acToggleForm;
  window.acGuardarCuota  = acGuardarCuota;
  window.acFiltrar       = acFiltrar;

  cargarDatos();
})();
