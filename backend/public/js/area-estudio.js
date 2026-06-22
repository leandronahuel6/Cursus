/* ==================
   ESTADO Y AUTENTICACIÓN
================== */
const API_BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer ' + token
  };
}

let materiasCursando = [];
let selectedMateriaId = null;

const COLUMNA_DB_TO_UI = { pendiente: 'pending', progreso: 'progress', finalizado: 'done' };
const COLUMNA_UI_TO_DB = { pending: 'pendiente', progress: 'progreso', done: 'finalizado' };

/* ==================
   SELECTOR DE MATERIA (dropdown vertical: tocás el nombre y elegís de la lista)
================== */
async function loadMateriasCursando() {
  try {
    const response = await fetch(`${API_BASE}/mis-materias`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('No se pudieron cargar las materias');
    const data = await response.json();
    materiasCursando = data.filter(m => m.estado === 'cursando');
  } catch (e) {
    console.error(e);
    materiasCursando = [];
  }

  renderMateriaDropdown();

  if (materiasCursando.length === 0) {
    document.getElementById('mat-selector-name').textContent = 'Sin materias en curso';
    document.getElementById('mat-selector-badge').textContent = '—';
    return;
  }

  const saved = parseInt(localStorage.getItem('cursus_selected_materia'), 10);
  const savedValida = materiasCursando.find(m => m.id === saved);
  selectMateria(savedValida ? saved : materiasCursando[0].id);
}

function renderMateriaDropdown() {
  const dropdown = document.getElementById('materia-dropdown');
  dropdown.innerHTML = '';

  if (materiasCursando.length === 0) {
    dropdown.innerHTML = `<div class="mat-dropdown-empty">No estás cursando ninguna materia. Anotate desde "Mis Materias" para poder estudiar acá.</div>`;
    return;
  }

  materiasCursando.forEach(m => {
    const item = document.createElement('div');
    item.className = `mat-dropdown-item ${m.id === selectedMateriaId ? 'active' : ''}`;
    item.innerHTML = `<span>${m.nombre}</span>${m.id === selectedMateriaId ? '<span>✓</span>' : ''}`;
    item.onclick = () => selectMateria(m.id);
    dropdown.appendChild(item);
  });
}

function toggleMateriaDropdown(e) {
  if (e) e.stopPropagation();
  document.getElementById('materia-dropdown').classList.toggle('open');
  document.getElementById('mat-dropdown-trigger').classList.toggle('open');
}

function closeMateriaDropdown() {
  document.getElementById('materia-dropdown').classList.remove('open');
  document.getElementById('mat-dropdown-trigger').classList.remove('open');
}

document.addEventListener('click', (e) => {
  const wrap = document.getElementById('mat-dropdown-wrap');
  if (wrap && !wrap.contains(e.target)) {
    closeMateriaDropdown();
  }
});

function selectMateria(id) {
  selectedMateriaId = id;
  localStorage.setItem('cursus_selected_materia', String(id));

  const materia = materiasCursando.find(m => m.id === id);
  document.getElementById('mat-selector-name').textContent = materia ? materia.nombre : '—';

  renderMateriaDropdown();
  closeMateriaDropdown();
  loadMateriaResumen();
  loadTareas();
  loadMarcadores();
}

/* ==================
   POMODORO TIMER
================== */
const CIRC = 2 * Math.PI * 70; // r=70 → 439.82

let totalSec  = 25 * 60;
let remaining = totalSec;
let running   = false;
let ticker    = null;
let doneCount = 0;

function fmt(s) {
  return String(Math.floor(s / 60)).padStart(2,'0') + ':' + String(s % 60).padStart(2,'0');
}

function updateRing() {
  const pct = remaining / totalSec;
  const rp  = document.getElementById('rp');
  rp.style.strokeDasharray  = CIRC;
  rp.style.strokeDashoffset = CIRC * (1 - pct);
  document.getElementById('ptime').textContent = fmt(remaining);
  document.getElementById('psub').textContent  = 'Sesión ' + (doneCount + 1) + ' de 4';
}

function togglePomo() {
  if (!selectedMateriaId) {
    alert('Elegí primero una materia para poder registrar la sesión.');
    return;
  }
  running = !running;
  const btn  = document.getElementById('play-btn');
  const wrap = document.getElementById('ring-wrap');
  if (running) {
    btn.textContent = '⏸';
    btn.classList.add('running');
    wrap.classList.add('glow');
    ticker = setInterval(() => {
      if (remaining > 0) {
        remaining--;
        updateRing();
      } else {
        clearInterval(ticker);
        running = false;
        btn.textContent = '▶';
        btn.classList.remove('running');
        wrap.classList.remove('glow');
        completeSesion();
      }
    }, 1000);
  } else {
    btn.textContent = '▶';
    btn.classList.remove('running');
    wrap.classList.remove('glow');
    clearInterval(ticker);
  }
}

async function completeSesion() {
  const duracion = totalSec;
  remaining = totalSec;
  updateRing();

  try {
    await fetch(`${API_BASE}/pomodoro/sesiones`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ materia_id: selectedMateriaId, duracion_segundos: duracion })
    });
  } catch (e) {
    console.error('No se pudo guardar la sesión de Pomodoro', e);
  }

  await loadMateriaResumen();
}

function resetPomo() {
  clearInterval(ticker);
  running = false;
  remaining = totalSec;
  const btn = document.getElementById('play-btn');
  btn.textContent = '▶';
  btn.classList.remove('running');
  document.getElementById('ring-wrap').classList.remove('glow');
  updateRing();
}

function skipPomo() { resetPomo(); }

function setMode(min, el) {
  document.querySelectorAll('.ptab').forEach(t => t.classList.remove('on'));
  el.classList.add('on');
  resetPomo();
  totalSec  = min * 60;
  remaining = totalSec;
  updateRing();
}

/* ==================
   RESUMEN DE LA MATERIA SELECCIONADA (chips + dots + log)
================== */
async function loadMateriaResumen() {
  if (!selectedMateriaId) return;

  try {
    const response = await fetch(`${API_BASE}/materias/${selectedMateriaId}/pomodoro-resumen`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('No se pudo cargar el resumen de la materia');
    const data = await response.json();

    document.getElementById('chip-horas-semana').textContent = `${data.horas_semana}h`;
    document.getElementById('chip-sesiones-totales').textContent = data.sesiones_totales;

    doneCount = data.sesiones_hoy.length;
    updateRing();
    renderDots(doneCount);
    renderSessionLog(data.sesiones_hoy);
  } catch (e) {
    console.error(e);
  }
}

function renderDots(count) {
  const dots = document.querySelectorAll('#dots .dot');
  dots.forEach((dot, idx) => {
    dot.classList.toggle('done', idx < count);
  });
}

function renderSessionLog(sesionesHoy) {
  const container = document.getElementById('log-extra');
  container.innerHTML = '';

  if (sesionesHoy.length === 0) {
    container.innerHTML = `<div style="font-size:12px;color:var(--t3);padding:6px 0">Todavía no completaste ninguna sesión hoy.</div>`;
    return;
  }

  sesionesHoy.forEach(s => {
    const row = document.createElement('div');
    row.className = 'slog-row';
    row.innerHTML = `<span class="slog-t">${s.hora}</span><span class="slog-d">${fmt(s.duracion_segundos)}</span><span class="slog-ok">✓ Completada</span>`;
    container.appendChild(row);
  });
}

/* ==================
   MODO CONCENTRACIÓN
================= */
function toggleFocus() {
  const sb = document.querySelector('.sidebar');
  const mn = document.querySelector('.main');
  const hidden = sb.style.display === 'none';
  sb.style.display = hidden ? 'flex' : 'none';
  mn.style.marginLeft = hidden ? 'var(--sidebar-w)' : '0';
}

/* ==================
   TABS
================== */
function switchTab(name, el) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('on'));
  document.querySelectorAll('.stab').forEach(t => t.classList.remove('on'));
  document.getElementById('panel-' + name).classList.add('on');
  el.classList.add('on');
}

/* ==================
   KANBAN DE TAREAS (por materia, persistido en la BD)
================== */
let dragId = null;

async function loadTareas() {
  ['pending', 'progress', 'done'].forEach(col => {
    document.getElementById('cards-' + col).innerHTML = '';
  });

  if (!selectedMateriaId) {
    updateCounts();
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/tareas?materia_id=${selectedMateriaId}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('No se pudieron cargar las tareas');
    const tareas = await response.json();

    tareas.forEach(t => {
      const col = COLUMNA_DB_TO_UI[t.columna] || 'pending';
      const card = buildTaskCard(t);
      document.getElementById('cards-' + col).appendChild(card);
    });
  } catch (e) {
    console.error(e);
  }

  updateCounts();
}

function buildTaskCard(tarea) {
  const id = 'tarea-' + tarea.id;
  const card = document.createElement('div');
  card.className  = 'kbcard';
  card.id         = id;
  card.dataset.tareaId = tarea.id;
  card.draggable  = true;
  card.setAttribute('ondragstart', `dStart(event,'${id}')`);
  card.setAttribute('ondragend',   'dEnd(event)');

  const meta = tarea.fecha_vencimiento
    ? `📅 Vence ${tarea.fecha_vencimiento}`
    : 'Sin fecha';

  card.innerHTML = `
    <div class="kb-title">${tarea.titulo}</div>
    <div class="kb-meta">${meta}</div>
    <button class="kb-del" onclick="delCard('${id}')">✕</button>
  `;
  return card;
}

function dStart(e, id) {
  dragId = id;
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(() => { const c = document.getElementById(id); if (c) c.classList.add('dragging'); }, 0);
}

function dEnd(e) { e.target.classList.remove('dragging'); }

function allowDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.add('over');
}

function leaveDrop(e) { e.currentTarget.classList.remove('over'); }

async function dropCard(e, col) {
  e.preventDefault();
  e.currentTarget.classList.remove('over');
  if (!dragId) return;
  const card = document.getElementById(dragId);
  if (!card) { dragId = null; return; }
  document.getElementById('cards-' + col).appendChild(card);
  updateCounts();

  const tareaId = card.dataset.tareaId;
  dragId = null;

  try {
    await fetch(`${API_BASE}/tareas/${tareaId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ columna: COLUMNA_UI_TO_DB[col] })
    });
  } catch (err) {
    console.error('No se pudo actualizar la tarea', err);
  }
}

function updateCounts() {
  ['pending','progress','done'].forEach(col => {
    const n = document.getElementById('cards-' + col).querySelectorAll('.kbcard').length;
    document.getElementById('cnt-' + col).textContent = n;
  });
}

async function addCard(col) {
  if (!selectedMateriaId) {
    alert('Elegí primero una materia.');
    return;
  }
  const title = prompt('Nombre de la tarea:');
  if (!title || !title.trim()) return;

  const fecha = prompt('Fecha de vencimiento (AAAA-MM-DD), opcional:');
  const fechaValida = fecha && /^\d{4}-\d{2}-\d{2}$/.test(fecha.trim()) ? fecha.trim() : null;

  try {
    await fetch(`${API_BASE}/tareas`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ materia_id: selectedMateriaId, titulo: title.trim(), fecha_vencimiento: fechaValida })
    });
    await loadTareas();
  } catch (e) {
    console.error('No se pudo crear la tarea', e);
  }
}

async function delCard(id) {
  const c = document.getElementById(id);
  if (!c) return;
  const tareaId = c.dataset.tareaId;
  c.remove();
  updateCounts();

  try {
    await fetch(`${API_BASE}/tareas/${tareaId}`, { method: 'DELETE', headers: getAuthHeaders() });
  } catch (e) {
    console.error('No se pudo eliminar la tarea', e);
  }
}

/* ==================
   MARCADORES (por materia, persistidos en la BD)
================== */
function iconForUrl(url) {
  const icons = { 'youtube.com':'🎥', 'stackoverflow.com':'💬', 'drive.google.com':'📄', 'github.com':'💻' };
  try {
    const host = new URL(url).hostname.replace('www.','');
    return icons[host] || '🔗';
  } catch (_) {
    return '🔗';
  }
}

async function loadMarcadores() {
  const list = document.getElementById('bm-list');
  list.innerHTML = '';

  if (!selectedMateriaId) return;

  try {
    const response = await fetch(`${API_BASE}/marcadores?materia_id=${selectedMateriaId}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('No se pudieron cargar los marcadores');
    const marcadores = await response.json();
    marcadores.forEach(m => list.appendChild(buildBookmarkItem(m)));
  } catch (e) {
    console.error(e);
  }
}

function buildBookmarkItem(marcador) {
  const item = document.createElement('div');
  item.className = 'bm-item';
  const display = marcador.titulo || marcador.url;
  item.innerHTML = `
    <div class="bm-ic">${iconForUrl(marcador.url)}</div>
    <div class="bm-inf">
      <div class="bm-name">${display}</div>
      <div class="bm-url">${marcador.url}</div>
    </div>
    <a href="${marcador.url}" target="_blank" rel="noopener" class="bm-open">↗</a>
    <button class="bm-del" onclick="deleteBookmark(${marcador.id}, this)">✕</button>
  `;
  return item;
}

async function addBookmark() {
  if (!selectedMateriaId) {
    alert('Elegí primero una materia.');
    return;
  }
  const url   = document.getElementById('bm-url').value.trim();
  const title = document.getElementById('bm-title').value.trim();
  if (!url) return;

  try {
    await fetch(`${API_BASE}/marcadores`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ materia_id: selectedMateriaId, url, titulo: title || null })
    });
    document.getElementById('bm-url').value   = '';
    document.getElementById('bm-title').value = '';
    await loadMarcadores();
  } catch (e) {
    console.error('No se pudo guardar el marcador', e);
  }
}

window.deleteBookmark = async function(id, btn) {
  btn.parentElement.remove();
  try {
    await fetch(`${API_BASE}/marcadores/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
  } catch (e) {
    console.error('No se pudo eliminar el marcador', e);
  }
};

/* ==================
   INICIALIZACIÓN
================== */
document.addEventListener('DOMContentLoaded', () => {
  updateRing();
  loadMateriasCursando();
});
