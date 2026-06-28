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

  const token = getToken();
  const user  = getUser();
  if (!token || !user) { window.location.replace('/login'); return; }
  if (user.role !== 'admin') { window.location.replace('/dashboard'); return; }

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
    form.hidden = !form.hidden;
    if (!form.hidden) {
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
        document.getElementById('ac-form').hidden = true;
        document.getElementById('ac-monto-actual').textContent  = formatMonto(data.valor_mensual);
        document.getElementById('ac-vigente-desde').textContent = 'Vigente desde ' + formatFecha(data.vigente_desde);
        document.getElementById('ac-valor').value = '';
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
