import { getState, setState, resetAll } from './utils/storage.js';
import { getActiveBlock, parseHHMM } from './utils/scheduler.js';
import { getLast7Days } from './utils/streak.js';
import { normalizeDomain } from './utils/domains.js';

let state = null;
let editingScheduleId = null;

async function load() {
  state = await getState();
  applyAccent(state.settings?.accentColor || 'green');
  render();
}

function applyAccent(accent) {
  const valid = ['green', 'amber', 'blue', 'purple'];
  document.documentElement.dataset.accent = valid.includes(accent) ? accent : 'green';
}

function render() {
  renderStats();
  renderChart();
  renderSchedules();
  renderSites();
}

function renderStats() {
  document.getElementById('big-streak').textContent = state.streak.current;
  document.getElementById('big-best').textContent = state.streak.best;
  document.getElementById('big-focus').textContent = state.focusTime.today;
  document.getElementById('big-prevented').textContent = state.stats.totalBlocksPrevented;
  document.getElementById('big-breaks').textContent = state.stats.totalBreaks;
  document.getElementById('sites-count').textContent = state.blockedSites.length;
  const active = getActiveBlock(state.schedules, new Date());
  document.getElementById('big-status').textContent = active ? `En foco · ${active.name}` : 'Inactivo';
}

function renderChart() {
  const chart = document.getElementById('chart-large');
  chart.innerHTML = '';
  const days = getLast7Days(state);
  const max = Math.max(60, ...days.map((d) => d.minutes));
  const labels = ['D','L','M','X','J','V','S'];
  let total = 0;
  days.forEach((d, i) => {
    total += d.minutes;
    const bar = document.createElement('div');
    bar.className = 'chart-bar';
    if (i === days.length - 1) bar.classList.add('today');
    if (d.minutes === 0) bar.classList.add('zero');
    bar.style.height = '0%';
    const h = Math.max(4, (d.minutes / max) * 100);
    requestAnimationFrame(() => { bar.style.height = `${h}%`; });
    const val = document.createElement('span');
    val.className = 'chart-value';
    val.textContent = `${d.minutes}m`;
    bar.appendChild(val);
    const lbl = document.createElement('span');
    lbl.className = 'chart-label';
    const dt = new Date(d.date);
    lbl.textContent = labels[dt.getDay()];
    bar.appendChild(lbl);
    chart.appendChild(bar);
  });
  document.getElementById('week-total').textContent = total;
}

function renderSchedules() {
  const list = document.getElementById('schedule-list');
  list.innerHTML = '';
  if (state.schedules.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = 'Sin bloques. Crea uno arriba.';
    list.appendChild(empty);
    return;
  }
  state.schedules.forEach((s) => list.appendChild(scheduleItem(s)));
}

function scheduleItem(sch) {
  const li = document.createElement('li');
  li.className = 'schedule-item' + (sch.enabled ? '' : ' disabled');
  const toggle = document.createElement('div');
  toggle.className = 'schedule-toggle' + (sch.enabled ? ' on' : '');
  toggle.addEventListener('click', () => toggleSchedule(sch.id));
  const info = document.createElement('div');
  info.className = 'schedule-info';
  const name = document.createElement('div');
  name.className = 'schedule-name';
  name.textContent = sch.name;
  const meta = document.createElement('div');
  meta.className = 'schedule-meta';
  meta.textContent = `${sch.startTime}–${sch.endTime} · ${formatDays(sch.days)}`;
  info.append(name, meta);
  const actions = document.createElement('div');
  actions.className = 'schedule-actions';
  const edit = document.createElement('button');
  edit.className = 'icon-btn';
  edit.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M4 20h4l10-10-4-4L4 16v4z M14 6l4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  edit.addEventListener('click', () => openModal(sch));
  const del = document.createElement('button');
  del.className = 'icon-btn danger';
  del.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 6l12 12 M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  del.addEventListener('click', () => deleteSchedule(sch.id));
  actions.append(edit, del);
  li.append(toggle, info, actions);
  return li;
}

function formatDays(days) {
  if (days.length === 7) return 'Todos los días';
  const set = new Set(days);
  if (set.size === 5 && [1,2,3,4,5].every((d) => set.has(d))) return 'L–V';
  if (set.size === 2 && set.has(0) && set.has(6)) return 'Fin de semana';
  const labels = ['D','L','M','X','J','V','S'];
  return [1,2,3,4,5,6,0].filter((d) => set.has(d)).map((d) => labels[d]).join(' ');
}

async function toggleSchedule(id) {
  const s = state.schedules.find((s) => s.id === id);
  if (!s) return;
  s.enabled = !s.enabled;
  await setState({ schedules: state.schedules });
  toast(s.enabled ? 'Bloque activado' : 'Bloque desactivado');
  render();
}

async function deleteSchedule(id) {
  if (!confirm('¿Eliminar este bloque?')) return;
  state.schedules = state.schedules.filter((s) => s.id !== id);
  await setState({ schedules: state.schedules });
  toast('Bloque eliminado');
  render();
}

function openModal(schedule = null) {
  editingScheduleId = schedule?.id ?? null;
  document.getElementById('modal-title').textContent = schedule ? 'Editar bloque' : 'Nuevo bloque';
  document.getElementById('modal-name').value = schedule?.name ?? '';
  document.getElementById('modal-start').value = schedule?.startTime ?? '09:00';
  document.getElementById('modal-end').value = schedule?.endTime ?? '13:00';
  const days = new Set(schedule?.days ?? [1,2,3,4,5]);
  document.querySelectorAll('#modal-days button').forEach((b) =>
    b.classList.toggle('on', days.has(Number(b.dataset.day)))
  );
  document.getElementById('modal-error').classList.add('hidden');
  document.getElementById('modal').hidden = false;
  setTimeout(() => document.getElementById('modal-name').focus(), 80);
}

function closeModal() {
  document.getElementById('modal').hidden = true;
  editingScheduleId = null;
}

async function saveSchedule() {
  const name = document.getElementById('modal-name').value.trim() || 'Bloque';
  const startTime = document.getElementById('modal-start').value;
  const endTime = document.getElementById('modal-end').value;
  const days = [...document.querySelectorAll('#modal-days button.on')].map((b) => Number(b.dataset.day)).sort();
  const err = document.getElementById('modal-error');
  if (!startTime || !endTime || parseHHMM(endTime) <= parseHHMM(startTime)) {
    err.textContent = 'Horas inválidas. El bloque no puede cruzar medianoche.';
    err.classList.remove('hidden');
    return;
  }
  if (days.length === 0) {
    err.textContent = 'Selecciona al menos un día.';
    err.classList.remove('hidden');
    return;
  }
  const payload = { id: editingScheduleId ?? 'sched-' + Math.random().toString(36).slice(2, 8), name, days, startTime, endTime, enabled: true };
  if (editingScheduleId) {
    const idx = state.schedules.findIndex((s) => s.id === editingScheduleId);
    state.schedules[idx] = { ...state.schedules[idx], ...payload };
  } else {
    state.schedules.push(payload);
  }
  await setState({ schedules: state.schedules });
  closeModal();
  toast('Guardado');
  render();
}

function applyDayPreset(preset) {
  const map = { weekdays: [1,2,3,4,5], weekend: [0,6], all: [0,1,2,3,4,5,6] };
  const set = new Set(map[preset]);
  document.querySelectorAll('#modal-days button').forEach((b) =>
    b.classList.toggle('on', set.has(Number(b.dataset.day)))
  );
}

function renderSites() {
  const list = document.getElementById('site-list');
  list.innerHTML = '';
  if (state.blockedSites.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = 'Sin webs bloqueadas.';
    list.appendChild(empty);
    return;
  }
  state.blockedSites.forEach((d) => list.appendChild(siteItem(d)));
}

function siteItem(domain) {
  const li = document.createElement('li');
  li.className = 'site-item';
  const fav = document.createElement('img');
  fav.className = 'site-favicon';
  fav.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  fav.alt = '';
  fav.addEventListener('error', () => { fav.style.opacity = '0.3'; });
  const name = document.createElement('span');
  name.className = 'site-name';
  name.textContent = domain;
  const del = document.createElement('button');
  del.className = 'icon-btn danger';
  del.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 6l12 12 M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  del.addEventListener('click', () => removeSite(domain));
  li.append(fav, name, del);
  return li;
}

async function addSite(raw) {
  const d = normalizeDomain(raw);
  if (!d) return toast('Dominio inválido');
  if (state.blockedSites.includes(d)) return toast('Ya estaba');
  state.blockedSites = [...state.blockedSites, d].sort();
  await setState({ blockedSites: state.blockedSites });
  document.getElementById('site-input').value = '';
  toast(`${d} añadido`);
  renderSites();
  renderStats();
}

async function removeSite(d) {
  state.blockedSites = state.blockedSites.filter((s) => s !== d);
  await setState({ blockedSites: state.blockedSites });
  toast(`${d} eliminado`);
  renderSites();
  renderStats();
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'focusguard-backup.json'; a.click();
  URL.revokeObjectURL(url);
  toast('Backup descargado');
}

async function importJson(e) {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    await setState(data);
    toast('Importación completada');
    await load();
  } catch (err) {
    console.error('[options] import', err);
    toast('Error al importar');
  }
  e.target.value = '';
}

async function resetStreakConfirm() {
  if (!confirm('¿Resetear racha a 0?')) return;
  state.streak = { ...state.streak, current: 0, brokeToday: false };
  await setState({ streak: state.streak });
  toast('Racha reseteada');
  renderStats();
}

async function resetAllConfirm() {
  if (!confirm('Esto borra TODO: bloques, webs, rachas y stats. ¿Continuar?')) return;
  await resetAll();
  toast('Todo restablecido');
  await load();
}

let toastTimer = null;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.hidden = false;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 1800);
}

document.getElementById('add-schedule').addEventListener('click', () => openModal());
document.getElementById('modal-cancel').addEventListener('click', closeModal);
document.getElementById('modal-save').addEventListener('click', saveSchedule);
document.querySelectorAll('#modal-days button').forEach((b) =>
  b.addEventListener('click', () => b.classList.toggle('on'))
);
document.querySelectorAll('.day-presets button').forEach((b) =>
  b.addEventListener('click', () => applyDayPreset(b.dataset.preset))
);
document.getElementById('modal').addEventListener('click', (e) => {
  if (e.target.id === 'modal') closeModal();
});
document.getElementById('add-site-form').addEventListener('submit', (e) => {
  e.preventDefault();
  addSite(document.getElementById('site-input').value);
});
document.getElementById('export-btn').addEventListener('click', exportJson);
document.getElementById('import-btn').addEventListener('click', () => document.getElementById('import-file').click());
document.getElementById('import-file').addEventListener('change', importJson);
document.getElementById('reset-streak').addEventListener('click', resetStreakConfirm);
document.getElementById('reset-all').addEventListener('click', resetAllConfirm);

chrome.storage.onChanged.addListener((_changes, area) => {
  if (area === 'local') load();
});

load();
