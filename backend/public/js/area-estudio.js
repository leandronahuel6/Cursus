/* ==================
   POMODORO TIMER
================== */
const CIRC = 2 * Math.PI * 70; // r=70 → 439.82

let totalSec  = 25 * 60;
let remaining = totalSec;
let running   = false;
let ticker    = null;
let doneCount = 2; // ya completó 2 hoy

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

function completeSesion() {
  doneCount++;
  // Mark next dot
  const dots = document.querySelectorAll('.dot');
  const next = Array.from(dots).find(d => !d.classList.contains('done'));
  if (next) next.classList.add('done');
  // Log
  const now  = new Date();
  const hhmm = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
  const row  = document.createElement('div');
  row.className = 'slog-row';
  row.innerHTML = `<span class="slog-t">${hhmm}</span><span class="slog-d">${fmt(totalSec)}</span><span class="slog-ok">✓ Completada</span>`;
  document.getElementById('log-extra').appendChild(row);
  // Reset
  remaining = totalSec;
  updateRing();
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

updateRing();

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
   KANBAN DRAG & DROP
================== */
let dragId = null;

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

function dropCard(e, col) {
  e.preventDefault();
  e.currentTarget.classList.remove('over');
  if (!dragId) return;
  const card = document.getElementById(dragId);
  if (!card) { dragId = null; return; }
  document.getElementById('cards-' + col).appendChild(card);
  updateCounts();
  dragId = null;
}

function updateCounts() {
  ['pending','progress','done'].forEach(col => {
    const n = document.getElementById('cards-' + col).querySelectorAll('.kbcard').length;
    document.getElementById('cnt-' + col).textContent = n;
  });
}

function addCard(col) {
  const title = prompt('Nombre de la tarea:');
  if (!title || !title.trim()) return;
  const id   = 'c' + Date.now();
  const card = document.createElement('div');
  card.className  = 'kbcard';
  card.id         = id;
  card.draggable  = true;
  card.setAttribute('ondragstart', `dStart(event,'${id}')`);
  card.setAttribute('ondragend',   'dEnd(event)');
  card.innerHTML  = `
    <div class="kb-title">${title.trim()}</div>
    <div class="kb-meta">Sin fecha</div>
    <button class="kb-del" onclick="delCard('${id}')">✕</button>
  `;
  document.getElementById('cards-' + col).appendChild(card);
  updateCounts();
}

function delCard(id) {
  const c = document.getElementById(id);
  if (c) { c.remove(); updateCounts(); }
}

/* ==================
   MARCADORES
================== */
function addBookmark() {
  const url   = document.getElementById('bm-url').value.trim();
  const title = document.getElementById('bm-title').value.trim();
  if (!url) return;

  const icons = { 'youtube.com':'🎥', 'stackoverflow.com':'💬', 'drive.google.com':'📄', 'github.com':'💻' };
  let ic = '🔗';
  try {
    const host = new URL(url).hostname.replace('www.','');
    ic = icons[host] || '🔗';
  } catch(_) {}

  const display = title || url;
  const item    = document.createElement('div');
  item.className = 'bm-item';
  item.innerHTML = `
    <div class="bm-ic">${ic}</div>
    <div class="bm-inf">
      <div class="bm-name">${display}</div>
      <div class="bm-url">${url}</div>
    </div>
    <a href="${url}" target="_blank" rel="noopener" class="bm-open">↗</a>
    <button class="bm-del" onclick="this.parentElement.remove()">✕</button>
  `;
  document.getElementById('bm-list').prepend(item);
  document.getElementById('bm-url').value   = '';
  document.getElementById('bm-title').value = '';
}
