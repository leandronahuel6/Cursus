/**
 * @fileoverview Renderizado de gráficos SVG para la página de Mi Progreso.
 * Funciones puras que reciben datos y dibujan donuts, heatmaps, líneas,
 * histogramas y barras semanales. No realiza fetching de datos.
 * @module views/progreso/progreso-charts
 */

'use strict';

const DONUT_COLORS = ['#4f46e5', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

// ── 1. Donut Chart ──────────────────────────────────────────────────────────

export function renderDonutChart(distribucionMaterias) {
  const container = document.getElementById('container-chart-donut');
  const legendContainer = document.getElementById('donut-legend-container');
  if (!container || !legendContainer) return;

  const distribution = (distribucionMaterias || []).map((d, idx) => ({
    name: d.materia,
    hours: d.horas,
    color: DONUT_COLORS[idx % DONUT_COLORS.length]
  }));

  if (distribution.length === 0) {
    container.innerHTML = '';
    legendContainer.innerHTML = '<div style="font-size:12.5px;color:var(--t3);">Todavía no hay sesiones de Pomodoro registradas por materia.</div>';
    return;
  }

  const total = distribution.reduce((acc, d) => acc + d.hours, 0);
  const radius = 60;

  if (total === 0) {
    container.innerHTML = `
      <svg width="200" height="180" viewBox="0 0 200 180">
        <circle cx="100" cy="90" r="${radius}" fill="transparent" stroke="#e2e8f0" stroke-width="16" />
        <text x="100" y="90" fill="#64748b" font-size="11" font-weight="700" text-anchor="middle">Sin sesiones</text>
      </svg>
    `;
    legendContainer.innerHTML = '<div style="color: var(--t2); font-size: 12.5px; text-align: center; margin-top: 10px;">Completá sesiones de Pomodoro para ver tu distribución de estudio.</div>';
    return;
  }

  const circumference = 2 * Math.PI * radius;
  const cx = 100;
  const cy = 90;

  let currentOffset = 0;
  let circlesSvg = '';

  distribution.forEach(d => {
    const pct = d.hours / total;
    const strokeDash = pct * circumference;
    const strokeGap = circumference - strokeDash;

    circlesSvg += `
      <circle cx="${cx}" cy="${cy}" r="${radius}"
              fill="none"
              stroke="${d.color}"
              stroke-width="16"
              stroke-dasharray="${strokeDash} ${strokeGap}"
              stroke-dashoffset="${-currentOffset}"
              transform="rotate(-90 ${cx} ${cy})"
              class="donut-segment"
              data-name="${d.name}"
              data-hours="${d.hours.toFixed(1)}h"
              style="transition: stroke-width 0.2s; cursor: pointer;" />
    `;
    currentOffset += strokeDash;
  });

  circlesSvg += `
    <circle cx="${cx}" cy="${cy}" r="${radius - 8}" fill="#ffffff" />
    <text x="${cx}" y="${cy - 2}" fill="#1e293b" font-size="14" font-weight="800" text-anchor="middle">${total.toFixed(1)} hs</text>
    <text x="${cx}" y="${cy + 12}" fill="#64748b" font-size="8" font-weight="700" text-anchor="middle">ESTUDIADAS</text>
  `;

  container.innerHTML = `
    <svg width="200" height="180" viewBox="0 0 200 180">
      ${circlesSvg}
    </svg>
  `;

  legendContainer.innerHTML = '';
  distribution.forEach(d => {
    const pct = ((d.hours / total) * 100).toFixed(0);
    const row = document.createElement('div');
    row.className = 'donut-legend-row';
    row.innerHTML = `
      <div class="donut-legend-name">
        <div class="legend-color" style="background-color: ${d.color};"></div>
        <span>${d.name}</span>
      </div>
      <span class="donut-legend-pct">${pct}% (${d.hours.toFixed(1)}h)</span>
    `;
    legendContainer.appendChild(row);
  });

  const segments = container.querySelectorAll('.donut-segment');
  segments.forEach(seg => {
    seg.addEventListener('mouseenter', () => seg.setAttribute('stroke-width', '22'));
    seg.addEventListener('mouseleave', () => seg.setAttribute('stroke-width', '16'));
  });
}

// ── 2. Heatmap Grid ─────────────────────────────────────────────────────────

export function renderHeatmap(actividad) {
  const grid = document.getElementById('activity-heatmap-grid');
  if (!grid) return;

  grid.innerHTML = '';

  const dias = 45;
  const hoy = new Date();

  for (let i = dias - 1; i >= 0; i--) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() - i);
    const clave = fecha.toISOString().slice(0, 10);
    const cantidad = actividad[clave] || 0;

    let lvl = 0;
    if (cantidad >= 8) lvl = 4;
    else if (cantidad >= 5) lvl = 3;
    else if (cantidad >= 3) lvl = 2;
    else if (cantidad >= 1) lvl = 1;

    const day = document.createElement('div');
    day.className = 'heatmap-day';
    if (lvl > 0) day.classList.add(`lvl-${lvl}`);

    day.title = `${clave}: ${cantidad} pomodoro${cantidad !== 1 ? 's' : ''} completado${cantidad !== 1 ? 's' : ''}`;
    grid.appendChild(day);
  }
}

// ── 3. Line Chart ───────────────────────────────────────────────────────────

export function renderLineChart(approvedList) {
  const container = document.getElementById('container-chart-line');
  if (!container) return;

  if (approvedList.length === 0) {
    container.innerHTML = '<div style="text-align: center; color: var(--tm); padding: 40px 10px; font-size: 13px;">No hay materias aprobadas para graficar.</div>';
    return;
  }

  let runningSum = 0;
  const data = approvedList.map((item, idx) => {
    runningSum += item.grade;
    return { label: item.code, name: item.name, grade: item.grade, avg: runningSum / (idx + 1) };
  });

  const width = container.clientWidth || 500;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;
  const minGrade = 4;
  const maxGrade = 10;

  const getX = (index) => {
    if (data.length === 1) return width / 2;
    return paddingX + (index / (data.length - 1)) * (width - 2 * paddingX);
  };
  const getY = (val) => height - paddingY - ((val - minGrade) / (maxGrade - minGrade)) * (height - 2 * paddingY);

  let pathD = '';
  let areaD = '';

  data.forEach((p, idx) => {
    const x = getX(idx);
    const y = getY(p.avg);
    if (idx === 0) {
      pathD = `M ${x} ${y}`;
      areaD = `M ${x} ${height - paddingY} L ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
    }
    if (idx === data.length - 1) {
      areaD += ` L ${x} ${y} L ${x} ${height - paddingY} Z`;
    } else if (idx > 0) {
      areaD += ` L ${x} ${y}`;
    }
  });

  if (data.length === 1) {
    const x = getX(0);
    const y = getY(data[0].avg);
    pathD = `M ${x - 5} ${y} L ${x + 5} ${y}`;
    areaD = '';
  }

  let axisLines = '';
  [4, 7, 10].forEach(g => {
    const y = getY(g);
    axisLines += `<line x1="${paddingX}" y1="${y}" x2="${width - paddingX}" y2="${y}" stroke="#f1f5f9" stroke-width="1" />
      <text x="${paddingX - 10}" y="${y + 4}" fill="#94a3b8" font-size="10" font-weight="600" text-anchor="end">${g}</text>`;
  });

  let nodes = '';
  let xLabels = '';
  data.forEach((p, idx) => {
    const x = getX(idx);
    const y = getY(p.avg);
    nodes += `<circle cx="${x}" cy="${y}" r="4.5" fill="#4F46E5" stroke="#ffffff" stroke-width="1.5" class="chart-point" data-index="${idx}" style="cursor: pointer;" />`;
    if (data.length <= 8 || idx % Math.ceil(data.length / 8) === 0) {
      xLabels += `<text x="${x}" y="${height - 5}" fill="#94a3b8" font-size="9" font-weight="600" text-anchor="middle">${p.label}</text>`;
    }
  });

  container.innerHTML = `
    <div class="chart-tooltip" id="tooltip-chart-line"></div>
    <svg class="svg-chart" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <linearGradient id="line-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#4F46E5" stop-opacity="0.18" />
          <stop offset="100%" stop-color="#4F46E5" stop-opacity="0.00" />
        </linearGradient>
      </defs>
      ${axisLines}
      ${areaD ? `<path d="${areaD}" fill="url(#line-grad)" />` : ''}
      <path d="${pathD}" fill="none" stroke="#4F46E5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      ${nodes}
      ${xLabels}
    </svg>
  `;

  const tooltip = document.getElementById('tooltip-chart-line');
  const points = container.querySelectorAll('.chart-point');
  points.forEach(point => {
    point.addEventListener('mouseenter', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'));
      const item = data[idx];
      tooltip.style.opacity = '1';
      tooltip.innerHTML = `<strong>${item.name}</strong><br>Nota: ${item.grade} | Promedio: ${item.avg.toFixed(2)}`;

      const ptX = getX(idx);
      const ptY = getY(item.avg);
      tooltip.style.left = `${ptX - tooltip.clientWidth / 2}px`;
      tooltip.style.top = `${ptY - 50}px`;
    });
    point.addEventListener('mouseleave', () => { tooltip.style.opacity = '0'; });
  });
}

// ── 4. Histogram Chart ──────────────────────────────────────────────────────

export function renderHistoChart(grades) {
  const container = document.getElementById('container-chart-histo');
  if (!container) return;

  if (grades.length === 0) {
    container.innerHTML = '<div style="text-align: center; color: var(--tm); padding: 40px 10px; font-size: 13px;">No hay calificaciones registradas.</div>';
    return;
  }

  const frequencies = { 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };
  grades.forEach(grade => {
    if (frequencies[grade] !== undefined) frequencies[grade]++;
  });

  const width = container.clientWidth || 500;
  const height = 180;
  const paddingX = 30;
  const paddingY = 25;
  const maxFreq = Math.max(...Object.values(frequencies), 2);

  const gradeList = [4, 5, 6, 7, 8, 9, 10];
  const colWidth = (width - 2 * paddingX) / gradeList.length;
  const barWidth = colWidth * 0.6;

  let bars = '';
  let labels = '';

  gradeList.forEach((g, idx) => {
    const freq = frequencies[g];
    const colCenterX = paddingX + idx * colWidth + colWidth / 2;
    const barHeight = (freq / maxFreq) * (height - 2 * paddingY);
    const barX = colCenterX - barWidth / 2;
    const barY = height - paddingY - barHeight;

    bars += `
      <rect x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}" fill="#3b82f6" rx="4" class="histo-bar" data-grade="${g}" data-freq="${freq}" style="cursor: pointer; transition: fill 0.15s;" />
      ${freq > 0 ? `<text x="${colCenterX}" y="${barY - 5}" fill="#1e293b" font-size="10" font-weight="700" text-anchor="middle">${freq}</text>` : ''}
    `;
    labels += `<text x="${colCenterX}" y="${height - 5}" fill="#94a3b8" font-size="10" font-weight="600" text-anchor="middle">Nota ${g}</text>`;
  });

  const lineY = height - paddingY;
  const baseLine = `<line x1="${paddingX}" y1="${lineY}" x2="${width - paddingX}" y2="${lineY}" stroke="#e2e8f0" stroke-width="1.5" />`;

  container.innerHTML = `
    <div class="chart-tooltip" id="tooltip-chart-histo"></div>
    <svg class="svg-chart" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      ${baseLine}
      ${bars}
      ${labels}
    </svg>
  `;

  const tooltip = document.getElementById('tooltip-chart-histo');
  const barEls = container.querySelectorAll('.histo-bar');
  barEls.forEach(bar => {
    bar.addEventListener('mouseenter', (e) => {
      const g = e.target.getAttribute('data-grade');
      const f = e.target.getAttribute('data-freq');
      e.target.setAttribute('fill', '#1d4ed8');
      tooltip.style.opacity = '1';
      tooltip.innerHTML = `<strong>Calificación: ${g}</strong><br>${f} materia${f !== '1' ? 's' : ''}`;
      const barX = parseFloat(e.target.getAttribute('x'));
      const barY = parseFloat(e.target.getAttribute('y'));
      tooltip.style.left = `${barX + barWidth / 2 - tooltip.clientWidth / 2}px`;
      tooltip.style.top = `${barY - 45}px`;
    });
    bar.addEventListener('mouseleave', (e) => {
      e.target.setAttribute('fill', '#3b82f6');
      tooltip.style.opacity = '0';
    });
  });
}

// ── 5. Weekly Bar Chart ─────────────────────────────────────────────────────

export function renderWeeklyChart(horasPorDia) {
  const container = document.getElementById('container-chart-weekly');
  if (!container) return;

  const studyHours = (horasPorDia || []).map(d => ({ day: d.dia, hours: d.horas }));

  const totalMinutes = studyHours.reduce((acc, d) => acc + (d.hours * 60), 0);
  const totalH = Math.floor(totalMinutes / 60);
  const totalM = Math.round(totalMinutes % 60);
  const totalLbl = document.getElementById('total-weekly-hours-lbl');
  if (totalLbl) totalLbl.textContent = `Total: ${totalH}h ${totalM}m`;

  const width = container.clientWidth || 500;
  const height = 180;
  const paddingX = 30;
  const paddingY = 25;
  const maxHours = Math.max(...studyHours.map(d => d.hours), 1);
  const colWidth = (width - 2 * paddingX) / studyHours.length;
  const barWidth = colWidth * 0.55;

  let bars = '';
  let labels = '';

  studyHours.forEach((d, idx) => {
    const colCenterX = paddingX + idx * colWidth + colWidth / 2;
    const barHeight = (d.hours / maxHours) * (height - 2 * paddingY);
    const barX = colCenterX - barWidth / 2;
    const barY = height - paddingY - barHeight;

    const formattedHours = d.hours >= 1
      ? `${Math.floor(d.hours)}h ${Math.round((d.hours % 1) * 60)}m`
      : `${Math.round(d.hours * 60)}m`;

    bars += `
      <rect x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}" fill="#10b981" rx="4" class="week-bar" data-day="${d.day}" data-hours="${formattedHours}" style="cursor: pointer; transition: fill 0.15s;" />
      ${d.hours > 0 ? `<text x="${colCenterX}" y="${barY - 5}" fill="#111827" font-size="9" font-weight="700" text-anchor="middle">${d.hours.toFixed(1)}h</text>` : ''}
    `;
    labels += `<text x="${colCenterX}" y="${height - 5}" fill="#94a3b8" font-size="10" font-weight="600" text-anchor="middle">${d.day}</text>`;
  });

  const baseLine = `<line x1="${paddingX}" y1="${height - paddingY}" x2="${width - paddingX}" y2="${height - paddingY}" stroke="#e2e8f0" stroke-width="1.5" />`;

  container.innerHTML = `
    <div class="chart-tooltip" id="tooltip-chart-weekly"></div>
    <svg class="svg-chart" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      ${baseLine}
      ${bars}
      ${labels}
    </svg>
  `;

  const tooltip = document.getElementById('tooltip-chart-weekly');
  const barEls = container.querySelectorAll('.week-bar');
  barEls.forEach(bar => {
    bar.addEventListener('mouseenter', (e) => {
      const day = e.target.getAttribute('data-day');
      const hours = e.target.getAttribute('data-hours');
      e.target.setAttribute('fill', '#059669');
      tooltip.style.opacity = '1';
      tooltip.innerHTML = `<strong>${day}</strong>: ${hours}`;
      const barX = parseFloat(e.target.getAttribute('x'));
      const barY = parseFloat(e.target.getAttribute('y'));
      tooltip.style.left = `${barX + barWidth / 2 - tooltip.clientWidth / 2}px`;
      tooltip.style.top = `${barY - 45}px`;
    });
    bar.addEventListener('mouseleave', (e) => {
      e.target.setAttribute('fill', '#10b981');
      tooltip.style.opacity = '0';
    });
  });
}

// ── Legacy Global Export ────────────────────────────────────────────────────

window.ProgresoCharts = {
  renderDonutChart,
  renderHeatmap,
  renderLineChart,
  renderHistoChart,
  renderWeeklyChart
};
