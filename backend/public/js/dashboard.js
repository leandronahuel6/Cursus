// Cursus - Inicio: materias del cuatrimestre traídas desde la base de datos

const ESTADO_BADGE = {
  cursando: { label: 'Cursando', clase: 'b-cur' },
  regular: { label: 'Regular', clase: 'b-reg' },
  aprobada: { label: 'Aprobada', clase: 'b-apr' }
};

function getStoredToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function getAuthHeaders() {
  return {
    'Accept': 'application/json',
    'Authorization': 'Bearer ' + getStoredToken()
  };
}

function renderMatsGrid(materias) {
  const grid = document.getElementById('mats-grid');
  if (!grid) return;
  grid.innerHTML = '';

  materias.forEach(m => {
    const badge = ESTADO_BADGE[m.estado];
    const fillWidth = m.estado === 'aprobada' ? '100%' : '0%';

    const mat = document.createElement('div');
    mat.className = 'mat';
    mat.onclick = () => { window.location.href = '/area-estudio'; };
    mat.innerHTML = `
      <div class="mat-top">
        <div class="mat-name">${m.nombre}</div>
        <span class="badge ${badge.clase}">${badge.label}</span>
      </div>
      <div class="mat-bar"><div class="mat-fill" style="width:${fillWidth}"></div></div>
      <div class="mat-ft">
        <span class="mat-h">${m.estado === 'aprobada' ? 'Final rendido ✓' : ''}</span>
        <span class="mat-ar">→</span>
      </div>
    `;
    grid.appendChild(mat);
  });
}

function renderStudyPanel(materiasCursando) {
  const heroSubject = document.getElementById('study-hero-subject');
  if (heroSubject) {
    heroSubject.textContent = materiasCursando[0] ? materiasCursando[0].nombre : 'Sin materias en curso';
  }

  const list = document.getElementById('study-others-list');
  if (!list) return;
  list.innerHTML = '';

  materiasCursando.slice(1).forEach(m => {
    const item = document.createElement('div');
    item.className = 'so-item';
    item.onclick = () => { window.location.href = '/area-estudio'; };
    item.innerHTML = `<span>📖 ${m.nombre}</span><span>→</span>`;
    list.appendChild(item);
  });
}

async function loadDashboardMaterias() {
  const token = getStoredToken();
  if (!token) return;

  try {
    const response = await fetch('/api/mis-materias', { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('No se pudieron cargar las materias');
    const data = await response.json();

    const enCurso = data.filter(m => m.estado !== 'libre');
    const cursando = data.filter(m => m.estado === 'cursando');

    renderMatsGrid(enCurso);
    renderStudyPanel(cursando);

    const statMateriasActivas = document.getElementById('stat-materias-activas');
    if (statMateriasActivas) statMateriasActivas.textContent = cursando.length;
  } catch (e) {
    console.error('No se pudieron cargar las materias del usuario', e);
  }
}

function formatHoras(horasDecimal) {
  const totalMinutos = Math.round(horasDecimal * 60);
  const h = Math.floor(totalMinutos / 60);
  const m = totalMinutos % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function renderHeatmap(actividad) {
  const grid = document.getElementById('hm');
  if (!grid) return;
  grid.innerHTML = '';

  const dias = 91; // 13 semanas
  const hoy = new Date();

  for (let i = dias - 1; i >= 0; i--) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() - i);
    const clave = fecha.toISOString().slice(0, 10);
    const cantidad = actividad[clave] || 0;

    let nivel = 0;
    if (cantidad >= 4) nivel = 3;
    else if (cantidad >= 2) nivel = 2;
    else if (cantidad >= 1) nivel = 1;

    const cell = document.createElement('div');
    cell.className = 'hm-cell' + (nivel > 0 ? ` l${nivel}` : '');
    cell.title = `${clave}: ${cantidad} pomodoro${cantidad !== 1 ? 's' : ''}`;
    grid.appendChild(cell);
  }
}

// La racha se muestra en 4 lugares de la página (header móvil, topbar, stat
// principal y el widget de actividad): todos deben reflejar el mismo número.
function setRachaText(dias) {
  const corto = `🔥 ${dias} día${dias !== 1 ? 's' : ''}`;

  const statRacha = document.getElementById('stat-racha');
  if (statRacha) statRacha.textContent = `${dias} día${dias !== 1 ? 's' : ''}`;

  const mobRacha = document.getElementById('mob-racha');
  if (mobRacha) mobRacha.textContent = corto;

  const topbarRacha = document.getElementById('topbar-racha');
  if (topbarRacha) topbarRacha.textContent = `🔥 ${dias} día${dias !== 1 ? 's' : ''} de racha`;

  const hmRacha = document.getElementById('hm-racha');
  if (hmRacha) hmRacha.textContent = corto;
}

async function loadPomodoroResumen() {
  const token = getStoredToken();
  if (!token) return;

  try {
    const response = await fetch('/api/pomodoro/resumen', { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('No se pudo cargar el resumen de Pomodoro');
    const data = await response.json();

    const statHoras = document.getElementById('stat-horas-semana');
    if (statHoras) statHoras.textContent = formatHoras(data.horas_semana);

    setRachaText(data.racha_dias);
    renderHeatmap(data.actividad || {});
  } catch (e) {
    console.error('No se pudo cargar el resumen de Pomodoro', e);
  }
}

// "Entregas próximas": tareas con fecha de vencimiento de todas las materias
// que el usuario está cursando, sin importar en cuál las haya creado.
function diasRestantes(fechaStr) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(fechaStr + 'T00:00:00');
  return Math.round((fecha - hoy) / 86400000);
}

function urgenciaTarea(dias) {
  if (dias <= 2) return { dot: 'd-red', due: 'urg' };
  if (dias <= 5) return { dot: 'd-org', due: 'mid' };
  if (dias <= 8) return { dot: 'd-ylw', due: '' };
  return { dot: 'd-grn', due: '' };
}

function textoVencimiento(dias) {
  if (dias < 0) return `Venció hace ${Math.abs(dias)} día${Math.abs(dias) !== 1 ? 's' : ''}`;
  if (dias === 0) return 'Vence hoy';
  if (dias === 1) return 'Vence mañana';
  return `En ${dias} días`;
}

function renderTareasProximas(tareas) {
  const body = document.getElementById('tareas-proximas-body');
  if (!body) return;
  body.innerHTML = '';

  if (tareas.length === 0) {
    body.innerHTML = `<div style="padding:10px 0;color:var(--t3);font-size:13px">No tenés entregas próximas pendientes.</div>`;
    return;
  }

  tareas.forEach(t => {
    const dias = diasRestantes(t.fecha_vencimiento);
    const { dot, due } = urgenciaTarea(dias);

    const task = document.createElement('div');
    task.className = 'task';
    task.onclick = () => { window.location.href = '/area-estudio'; };
    task.innerHTML = `
      <div class="task-dot ${dot}"></div>
      <div class="task-inf">
        <div class="task-name">${t.titulo}</div>
        <div class="task-sub">${t.materia_nombre}</div>
      </div>
      <div class="task-due ${due}">${textoVencimiento(dias)}</div>
    `;
    body.appendChild(task);
  });
}

async function loadTareasProximas() {
  const token = getStoredToken();
  if (!token) return;

  try {
    const response = await fetch('/api/tareas/proximas', { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('No se pudieron cargar las entregas próximas');
    const tareas = await response.json();
    renderTareasProximas(tareas);
  } catch (e) {
    console.error('No se pudieron cargar las entregas próximas', e);
  }
}

// Banner superior: muestra la alerta más urgente (dentro de los próximos 7 días),
// si hay alguna. Reemplaza el aviso de pago de cuota que estaba fijo.
function diasHastaAlerta(fechaStr) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(fechaStr + 'T00:00:00');
  return Math.round((fecha - hoy) / 86400000);
}

async function loadAlertaDestacada() {
  const token = getStoredToken();
  const banner = document.getElementById('js-alert');
  if (!token || !banner) return;

  try {
    const response = await fetch('/api/alertas', { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('No se pudieron cargar las alertas');
    const alertas = await response.json();

    const proximas = alertas
      .filter(a => !a.completada && diasHastaAlerta(a.fecha) <= 7)
      .sort((a, b) => diasHastaAlerta(a.fecha) - diasHastaAlerta(b.fecha));

    if (proximas.length === 0) return;

    const masUrgente = proximas[0];
    const dias = diasHastaAlerta(masUrgente.fecha);
    const cuando = dias < 0
      ? `venció hace ${Math.abs(dias)} día${Math.abs(dias) !== 1 ? 's' : ''}`
      : dias === 0 ? 'vence hoy'
      : dias === 1 ? 'vence mañana'
      : `vence en ${dias} días`;

    document.getElementById('js-alert-text').textContent = `${masUrgente.titulo} (${cuando}).`;
    banner.style.display = 'flex';
  } catch (e) {
    console.error('No se pudo cargar la alerta destacada', e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadDashboardMaterias();
  loadPomodoroResumen();
  loadTareasProximas();
  loadAlertaDestacada();
});
