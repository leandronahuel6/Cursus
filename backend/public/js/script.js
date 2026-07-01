/* ==========================================
   HEATMAP
========================================== */
const hm = document.getElementById('hm');
const labels = ['Sin actividad','1-2 Pomodoros','3-4 Pomodoros','5+ Pomodoros'];

for (let i = 0; i < 91; i++) {
  const cell = document.createElement('div');
  const streak = i >= 83;   // últimos 8 días = racha activa
  const recent = i >= 55;

  let lv = 0;
  if (streak) {
    lv = Math.random() < .25 ? 2 : 3;
  } else if (recent) {
    const r = Math.random();
    lv = r < .32 ? 0 : r < .55 ? 1 : r < .8 ? 2 : 3;
  } else {
    const r = Math.random();
    lv = r < .52 ? 0 : r < .72 ? 1 : r < .88 ? 2 : 3;
  }

  cell.className = 'hm-cell' + (lv > 0 ? ' l' + lv : '');
  cell.title     = labels[lv];
  hm.appendChild(cell); // Corregir error de esta línea: Uncaught TypeError: Cannot read properties of null (reading 'appendChild')
}
