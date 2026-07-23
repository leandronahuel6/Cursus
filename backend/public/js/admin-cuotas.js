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

    carrerasCache = data.carreras || [];
    poblarSelectCarreras();

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
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      
      const dateInput = document.getElementById('ac-desde');
      // Prellenar fecha de hoy
      dateInput.value = today.toISOString().split('T')[0];
      // Limitar mínimo al primer día del mes
      dateInput.min = `${year}-${month}-01`;
      // Limitar máximo al final del año próximo
      dateInput.max = `${year + 1}-12-31`;
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
        showToast('Cuota actualizada correctamente.', 'success');
      } else {
        let errorMsg = 'Error al guardar la cuota.';
        if (res.status === 422 && data.errors) {
          // Tomamos siempre el primer error de validación que devuelve Laravel (ya vienen traducidos)
          errorMsg = Object.values(data.errors)[0][0];
        } else if (data.message) {
          errorMsg = data.message;
        }
        showToast(errorMsg, 'error');
      }
    } catch {
      showToast('Error de conexión.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Guardar';
    }
  }

  // ---- Historial de cuotas por legajo ----
  let carrerasCache = [];
  let historialLegajoActual = null;
  let eliminarPagoIdActual = null;

  const MESES_CUOTA = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  function formatPeriodoLargo(periodo) {
    const [y, m] = periodo.split('-');
    return `${MESES_CUOTA[parseInt(m, 10) - 1]} ${y}`;
  }

  function badgeCuota(pago) {
    if (pago.estado === 'pagado') {
      const medio = pago.medio_pago === 'efectivo' ? ' (efectivo)' : '';
      return `<span class="aa-badge badge-aprobada">Pagó${medio}</span>`;
    }
    if (pago.estado === 'pendiente_efectivo') {
      return '<span class="aa-badge badge-regular">Efectivo, a confirmar</span>';
    }
    return '<span class="aa-badge badge-libre">Pendiente</span>';
  }

  async function achBuscar(e, anioOverride) {
    e.preventDefault();
    const legajo = document.getElementById('ach-legajo').value.trim();
    if (!legajo) return;

    const err = document.getElementById('ach-error');
    err.hidden = true;
    document.getElementById('ach-result').hidden = true;

    const btn = document.getElementById('ach-btn-search');
    btn.disabled = true;
    btn.textContent = 'Buscando…';

    try {
      const qs = anioOverride ? `?anio=${encodeURIComponent(anioOverride)}` : '';
      const res = await fetch(`/api/admin/alumnos/${encodeURIComponent(legajo)}/cuotas${qs}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) {
        err.textContent = data.message ?? 'Error al buscar el alumno.';
        err.hidden = false;
        return;
      }
      historialLegajoActual = legajo;
      renderHistorialAlumno(data);
    } catch {
      err.textContent = 'Error de conexión.';
      err.hidden = false;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Buscar';
    }
  }

  function iaIndicador(p) {
    const ia = p.datos_extraidos_ia;
    if (!ia) return '<span class="aa-badge badge-libre">—</span>';

    const declarado = p.monto_declarado != null ? formatMonto(p.monto_declarado) : '—';
    if (ia.coincide_monto === true) {
      return `<span class="aa-badge badge-aprobada" title="El monto leído coincide con el exigible">✓ ${declarado}</span>`;
    }
    if (ia.coincide_monto === false) {
      const obs = (ia.observaciones || 'el monto leído no coincide con el exigible').replace(/"/g, '&quot;');
      return `<span class="aa-badge badge-regular" title="${obs}">✗ ${declarado}</span>`;
    }
    return `<span class="aa-badge badge-libre" title="No se pudo comparar el monto">${declarado}</span>`;
  }

  function achCambiarAnio(anio) {
    achBuscar({ preventDefault: () => {} }, anio);
  }

  function renderSelectorAnioAch(anioActual, aniosDisponibles) {
    const select = document.getElementById('ach-anio');
    if (!select) return;

    select.innerHTML = '';
    (aniosDisponibles && aniosDisponibles.length ? aniosDisponibles : [anioActual]).forEach(a => {
      const opt = document.createElement('option');
      opt.value = a;
      opt.textContent = `Ciclo ${a}`;
      select.appendChild(opt);
    });
    select.value = anioActual;
  }

  function renderHistorialAlumno(data) {
    document.getElementById('ach-nombre').textContent = `${data.usuario.nombre} — Legajo ${data.usuario.legajo}`;
    renderSelectorAnioAch(data.anio, data.anios_disponibles);
    const tbody = document.getElementById('ach-tbody');
    tbody.innerHTML = '';

    if (data.cuotas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="aa-table-empty">Sin cuotas generadas.</td></tr>';
    } else {
      data.cuotas.forEach(p => {
        const tr = document.createElement('tr');
        const acciones = [];
        if (p.tiene_comprobante) {
          acciones.push(`<button type="button" class="aa-btn-search" style="padding:4px 10px; font-size:0.78rem;" onclick="window.acVerComprobante(${p.id})">Ver comprobante</button>`);
        }
        if (p.estado === 'pendiente_efectivo') {
          acciones.push(`<button type="button" class="aa-btn-search" style="padding:4px 10px; font-size:0.78rem;" onclick="window.acConfirmarEfectivo(${p.id})">Confirmar</button>`);
        }
        acciones.push(`<button type="button" class="aa-btn-cancel" style="padding:4px 10px; font-size:0.78rem;" onclick="window.acAbrirEliminar(${p.id})">Eliminar</button>`);

        tr.innerHTML = `
          <td>${formatPeriodoLargo(p.periodo)}</td>
          <td>${badgeCuota(p)}</td>
          <td>${p.medio_pago ?? '—'}</td>
          <td>${formatMonto(p.monto_exigible)}</td>
          <td>${iaIndicador(p)}</td>
          <td>${formatFecha(p.fecha_pago)}</td>
          <td style="display:flex; gap:6px; flex-wrap:wrap;">${acciones.join('')}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    document.getElementById('ach-result').hidden = false;
  }

  async function acVerComprobante(id) {
    try {
      const res = await fetch(`/api/admin/cuotas/${id}/comprobante`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      window.open(URL.createObjectURL(blob), '_blank');
    } catch {
      showToast('No se pudo abrir el comprobante.', 'error');
    }
  }

  async function acConfirmarEfectivo(id) {
    try {
      const res = await fetch(`/api/admin/cuotas/${id}/confirmar-efectivo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Error al confirmar el pago.');
      showToast('Pago en efectivo confirmado.', 'success');
      await refrescarVistasCuotas();
    } catch (e) {
      showToast(e.message ?? 'Error al confirmar el pago.', 'error');
    }
  }

  function acAbrirEliminar(id) {
    eliminarPagoIdActual = id;
    document.getElementById('ac-eliminar-motivo').value = '';
    document.getElementById('ac-eliminar-overlay').hidden = false;
  }

  function acCancelarEliminar() {
    eliminarPagoIdActual = null;
    document.getElementById('ac-eliminar-overlay').hidden = true;
  }

  async function acConfirmarEliminar() {
    if (!eliminarPagoIdActual) return;
    const btn = document.getElementById('ac-btn-confirmar-eliminar');
    btn.disabled = true;
    btn.textContent = 'Eliminando…';

    try {
      const motivo = document.getElementById('ac-eliminar-motivo').value.trim();
      const res = await fetch(`/api/admin/cuotas/${eliminarPagoIdActual}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ motivo: motivo || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Error al eliminar el registro.');

      document.getElementById('ac-eliminar-overlay').hidden = true;
      showToast('Registro de pago eliminado.', 'success');
      await refrescarVistasCuotas();
    } catch (e) {
      showToast(e.message ?? 'Error al eliminar el registro.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Eliminar';
      eliminarPagoIdActual = null;
    }
  }

  // ---- Pendientes de confirmar (efectivo) ----
  async function cargarPendientesEfectivo() {
    const cont = document.getElementById('ac-efectivo-list');
    try {
      const res = await fetch('/api/admin/cuotas/pendientes-efectivo', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error();
      const alumnos = await res.json();

      if (alumnos.length === 0) {
        cont.innerHTML = '<p class="ac-loading">No hay pagos en efectivo esperando confirmación.</p>';
        return;
      }

      cont.innerHTML = '';
      alumnos.forEach(a => {
        const box = document.createElement('div');
        box.style.cssText = 'border:1px solid var(--border); border-radius:var(--r-sm); padding:10px 14px; margin-bottom:8px;';
        const periodosHtml = a.periodos.map(p => `
          <div style="display:flex; align-items:center; gap:8px; justify-content:space-between; padding:4px 0;">
            <span>${formatPeriodoLargo(p.periodo)} — ${formatMonto(p.monto_exigible)}</span>
            <button type="button" class="aa-btn-search" style="padding:3px 10px; font-size:0.78rem;" onclick="window.acConfirmarEfectivo(${p.id})">Confirmar</button>
          </div>
        `).join('');
        box.innerHTML = `
          <div style="font-weight:600; color:var(--text);">${a.nombre} — Legajo ${a.legajo}</div>
          ${periodosHtml}
        `;
        cont.appendChild(box);
      });
    } catch {
      cont.innerHTML = '<p class="ac-loading">Error al cargar.</p>';
    }
  }

  // ---- Deudores del ciclo ----
  function poblarSelectCarreras() {
    const select = document.getElementById('ac-deudores-carrera');
    if (!select || carrerasCache.length === 0) return;
    const actual = select.value;
    select.innerHTML = '<option value="">Todas las carreras</option>';
    carrerasCache.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.nombre;
      select.appendChild(opt);
    });
    select.value = actual;
  }

  async function cargarDeudores() {
    const tbody = document.getElementById('ac-deudores-tbody');
    tbody.innerHTML = '<tr><td colspan="5" class="aa-table-empty">Cargando…</td></tr>';

    const carreraId = document.getElementById('ac-deudores-carrera').value;
    const qs = carreraId ? `?carrera_id=${encodeURIComponent(carreraId)}` : '';

    try {
      const res = await fetch(`/api/admin/cuotas/deudores${qs}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error();
      const alumnos = await res.json();

      if (alumnos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="aa-table-empty">No hay deudores.</td></tr>';
        return;
      }

      tbody.innerHTML = '';
      alumnos.forEach(a => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${a.nombre}</td>
          <td>${a.legajo ?? '—'}</td>
          <td>${a.meses_adeudados}</td>
          <td>${a.periodos_pendientes.map(formatPeriodoLargo).join(', ')}</td>
          <td><button type="button" class="aa-btn-search" style="padding:4px 10px; font-size:0.78rem;" onclick="window.acVerHistorialDesdeLegajo('${a.legajo}')">Ver historial</button></td>
        `;
        tbody.appendChild(tr);
      });
    } catch {
      tbody.innerHTML = '<tr><td colspan="5" class="aa-table-empty">Error al cargar.</td></tr>';
    }
  }

  function acVerHistorialDesdeLegajo(legajo) {
    document.getElementById('ach-legajo').value = legajo;
    achBuscar({ preventDefault: () => {} });
  }

  // Refresca todas las vistas de cuotas tras una acción (eliminar/confirmar).
  // Preserva el ciclo (año) que se estaba mirando, no vuelve siempre al actual.
  async function refrescarVistasCuotas() {
    const anioSelect = document.getElementById('ach-anio');
    const anioActual = anioSelect && anioSelect.value ? anioSelect.value : undefined;

    await Promise.all([
      cargarDatos(),
      cargarPendientesEfectivo(),
      cargarDeudores(),
      historialLegajoActual ? achBuscar({ preventDefault: () => {} }, anioActual) : Promise.resolve(),
    ]);
  }

  // Exportar
  window.acToggleForm         = acToggleForm;
  window.acGuardarCuota       = acGuardarCuota;
  window.acFiltrar            = acFiltrar;
  window.achBuscar            = achBuscar;
  window.achCambiarAnio       = achCambiarAnio;
  window.acVerComprobante     = acVerComprobante;
  window.acConfirmarEfectivo  = acConfirmarEfectivo;
  window.acAbrirEliminar      = acAbrirEliminar;
  window.acCancelarEliminar   = acCancelarEliminar;
  window.acConfirmarEliminar  = acConfirmarEliminar;
  window.cargarDeudores       = cargarDeudores;
  window.acVerHistorialDesdeLegajo = acVerHistorialDesdeLegajo;

  cargarDatos();
  cargarPendientesEfectivo();
  cargarDeudores();
})();
