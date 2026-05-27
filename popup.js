import { getState, setState, resetAll, DEFAULT_STATE } from './utils/storage.js';
import { getActiveBlock, getNextTransition, parseHHMM } from './utils/scheduler.js';
import { getLast7Days } from './utils/streak.js';
import { normalizeDomain } from './utils/domains.js';

const FLAME = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2s4 4 4 9a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 2 2 2 4z M8 14c0 4 2 7 4 7s4-3 4-7c0 2-2 4-4 4s-4-2-4-4z"/></svg>';
const SHIELD = '<svg viewBox="0 0 24 24" fill="none"><path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const ACHIEVEMENTS = [
  { id: 's3',   name: 'Tres días',    desc: 'Racha de 3 días',       icon: FLAME,  test: (s) => s.streak.best >= 3 },
  { id: 's7',   name: 'Una semana',   desc: 'Racha de 7 días',       icon: FLAME,  test: (s) => s.streak.best >= 7 },
  { id: 's14',  name: 'Dos semanas',  desc: 'Racha de 14 días',      icon: FLAME,  test: (s) => s.streak.best >= 14 },
  { id: 's30',  name: 'Un mes',       desc: 'Racha de 30 días',      icon: FLAME,  test: (s) => s.streak.best >= 30 },
  { id: 'b50',  name: '50 bloqueos',  desc: '50 distracciones esquivadas',  icon: SHIELD, test: (s) => s.stats.totalBlocksPrevented >= 50 },
  { id: 'b250', name: '250 bloqueos', desc: '250 distracciones esquivadas', icon: SHIELD, test: (s) => s.stats.totalBlocksPrevented >= 250 }
];

const PRESETS = {
  social: ['twitter.com', 'x.com', 'instagram.com', 'facebook.com', 'linkedin.com', 'threads.net'],
  video: ['youtube.com', 'netflix.com', 'twitch.tv', 'tiktok.com', 'primevideo.com'],
  news: ['cnn.com', 'bbc.com', 'reuters.com', 'elpais.com', 'elmundo.es']
};

let state = null;
let countdownTimer = null;
let editingScheduleId = null;
let prevStreak = 0;
let prevFocus = 0;

// ===== Tabs =====
function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  const indicator = document.querySelector('.tab-indicator');
  tabs.forEach((t) => t.addEventListener('click', () => switchTab(t.dataset.tab)));
  positionIndicator(document.querySelector('.tab.active'), indicator);
  window.addEventListener('resize', () => positionIndicator(document.querySelector('.tab.active'), indicator));
}

function positionIndicator(tab, indicator) {
  if (!tab || !indicator) return;
  const r = tab.getBoundingClientRect();
  const parent = tab.parentElement.getBoundingClientRect();
  indicator.style.left = `${r.left - parent.left}px`;
  indicator.style.width = `${r.width}px`;
}

function switchTab(name) {
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('active', p.dataset.panel === name));
  positionIndicator(document.querySelector('.tab.active'), document.querySelector('.tab-indicator'));
}

// ===== Status panel =====
function renderStatus() {
  const card = document.getElementById('status-card');
  const title = document.getElementById('status-title');
  const sub = document.getElementById('status-sub');
  const countdown = document.getElementById('status-countdown');
  const now = new Date();
  const active = getActiveBlock(state.schedules, now);
  renderAchievements();
  if (active) {
    card.classList.add('active');
    title.textContent = 'Modo foco ACTIVO';
    sub.textContent = `${active.name} · fin a las ${active.endTime}`;
    countdown.classList.remove('hidden');
    startCountdown(active);
  } else {
    card.classList.remove('active');
    title.textContent = 'Inactivo';
    const next = getNextTransition(state.schedules, now);
    sub.textContent = next ? formatNextLabel(next.time, now) : 'No hay bloques configurados';
    countdown.classList.add('hidden');
    stopCountdown();
  }
  updateStatBump('streak-current', state.streak.current, prevStreak);
  updateStatBump('focus-today', state.focusTime.today, prevFocus);
  prevStreak = state.streak.current;
  prevFocus = state.focusTime.today;
  document.getElementById('streak-best').textContent = state.streak.best;
  renderChart();
}

function updateStatBump(id, value, prev) {
  const el = document.getElementById(id);
  el.textContent = value;
  if (value !== prev && prev !== undefined) {
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  }
}

function formatNextLabel(date, now) {
  const t = `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  const same = date.toDateString() === now.toDateString();
  const tom = new Date(now);
  tom.setDate(tom.getDate() + 1);
  if (same) return `Próximo bloque hoy a las ${t}`;
  if (date.toDateString() === tom.toDateString()) return `Próximo bloque mañana a las ${t}`;
  const names = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  return `Próximo bloque ${names[date.getDay()]} a las ${t}`;
}

function pad2(n) { return String(n).padStart(2, '0'); }

function startCountdown(block) {
  stopCountdown();
  const value = document.getElementById('countdown-value');
  const fill = document.getElementById('countdown-fill');
  const [h, m] = block.endTime.split(':').map(Number);
  const [sh, sm] = block.startTime.split(':').map(Number);
  const totalMs = ((h * 60 + m) - (sh * 60 + sm)) * 60000;
  const tick = () => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(h, m, 0, 0);
    const diff = Math.max(0, end - now);
    const totalSec = Math.floor(diff / 1000);
    value.textContent = `${pad2(Math.floor(totalSec/3600))}:${pad2(Math.floor((totalSec%3600)/60))}:${pad2(totalSec%60)}`;
    const progressed = Math.max(0, Math.min(1, (totalMs - diff) / totalMs));
    fill.style.width = `${progressed * 100}%`;
    if (diff === 0) loadAndRender();
  };
  tick();
  countdownTimer = setInterval(tick, 1000);
}

function stopCountdown() {
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
}

function renderChart() {
  const chart = document.getElementById('chart-bars');
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
    const h = Math.max(3, (d.minutes / max) * 100);
    requestAnimationFrame(() => { bar.style.height = `${h}%`; });
    bar.title = `${d.date}: ${d.minutes} min`;
    const lbl = document.createElement('span');
    lbl.className = 'chart-label';
    const dt = new Date(d.date);
    lbl.textContent = labels[dt.getDay()];
    bar.appendChild(lbl);
    chart.appendChild(bar);
  });
  document.getElementById('chart-total').textContent = total;
}

// ===== Schedules =====
function renderSchedules() {
  const list = document.getElementById('schedule-list');
  list.innerHTML = '';
  if (state.schedules.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = 'Sin bloques. Añade uno para empezar.';
    list.appendChild(empty);
    return;
  }
  const now = new Date();
  const active = getActiveBlock(state.schedules, now);
  state.schedules.forEach((s, i) => {
    const item = scheduleItem(s, active?.id === s.id);
    item.style.setProperty('--i', i + 1);
    list.appendChild(item);
  });
}

function scheduleItem(sch, isActive) {
  const li = document.createElement('li');
  li.className = 'schedule-item' + (sch.enabled ? '' : ' disabled') + (isActive ? ' active-now' : '');
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
  meta.innerHTML = `${sch.startTime}–${sch.endTime} <span class="dot-sep">·</span> ${formatDays(sch.days)}`;
  info.appendChild(name);
  info.appendChild(meta);
  const actions = document.createElement('div');
  actions.className = 'schedule-actions';
  const edit = document.createElement('button');
  edit.className = 'icon-btn';
  edit.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M4 20h4l10-10-4-4L4 16v4z M14 6l4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  edit.title = 'Editar';
  edit.addEventListener('click', () => openModal(sch));
  const del = document.createElement('button');
  del.className = 'icon-btn danger';
  del.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M6 6l12 12 M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  del.title = 'Eliminar';
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
  renderAll();
}

async function deleteSchedule(id) {
  state.schedules = state.schedules.filter((s) => s.id !== id);
  await setState({ schedules: state.schedules });
  toast('Bloque eliminado');
  renderAll();
}

// ===== Modal =====
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
  document.body.classList.add('modal-open');
  setTimeout(() => document.getElementById('modal-name').focus(), 80);
}

function closeModal() {
  document.getElementById('modal').hidden = true;
  document.body.classList.remove('modal-open');
  editingScheduleId = null;
}

async function saveSchedule() {
  const name = document.getElementById('modal-name').value.trim() || 'Bloque';
  const startTime = document.getElementById('modal-start').value;
  const endTime = document.getElementById('modal-end').value;
  const days = [...document.querySelectorAll('#modal-days button.on')].map((b) => Number(b.dataset.day)).sort();
  const err = document.getElementById('modal-error');
  if (!startTime || !endTime) return showError(err, 'Configura ambas horas.');
  if (parseHHMM(endTime) <= parseHHMM(startTime))
    return showError(err, 'El bloque no puede cruzar medianoche. Crea dos bloques separados.');
  if (days.length === 0) return showError(err, 'Selecciona al menos un día.');
  const payload = { id: editingScheduleId ?? 'sched-' + Math.random().toString(36).slice(2, 8), name, days, startTime, endTime, enabled: true };
  if (editingScheduleId) {
    const idx = state.schedules.findIndex((s) => s.id === editingScheduleId);
    state.schedules[idx] = { ...state.schedules[idx], ...payload };
    toast('Bloque actualizado');
  } else {
    state.schedules.push(payload);
    toast('Bloque añadido');
  }
  await setState({ schedules: state.schedules });
  closeModal();
  renderAll();
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

function initModal() {
  document.getElementById('add-schedule-btn').addEventListener('click', () => openModal());
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
}

function applyDayPreset(preset) {
  const map = { weekdays: [1,2,3,4,5], weekend: [0,6], all: [0,1,2,3,4,5,6] };
  const set = new Set(map[preset]);
  document.querySelectorAll('#modal-days button').forEach((b) =>
    b.classList.toggle('on', set.has(Number(b.dataset.day)))
  );
}

// ===== Sites =====
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
  fav.loading = 'lazy';
  fav.addEventListener('error', () => { fav.style.opacity = '0.3'; });
  const name = document.createElement('span');
  name.className = 'site-name';
  name.textContent = domain;
  const del = document.createElement('button');
  del.className = 'icon-btn danger';
  del.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M6 6l12 12 M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  del.title = 'Eliminar';
  del.addEventListener('click', () => removeSite(domain));
  li.append(fav, name, del);
  return li;
}

async function addSite(raw) {
  const domain = normalizeDomain(raw);
  if (!domain) return flashSiteInputError();
  if (state.blockedSites.includes(domain)) { flashSiteInputError(); toast('Ya estaba en la lista'); return; }
  state.blockedSites = [...state.blockedSites, domain].sort();
  await setState({ blockedSites: state.blockedSites });
  toast(`${domain} añadido`);
  renderSites();
  document.getElementById('site-input').value = '';
}

function flashSiteInputError() {
  const i = document.getElementById('site-input');
  i.classList.add('error');
  setTimeout(() => i.classList.remove('error'), 600);
}

async function removeSite(domain) {
  state.blockedSites = state.blockedSites.filter((d) => d !== domain);
  await setState({ blockedSites: state.blockedSites });
  toast(`${domain} eliminado`);
  renderSites();
}

function initSites() {
  document.getElementById('add-site-form').addEventListener('submit', (e) => {
    e.preventDefault();
    addSite(document.getElementById('site-input').value);
  });
  document.querySelectorAll('.chip').forEach((c) =>
    c.addEventListener('click', () => addPreset(c.dataset.preset))
  );
}

async function addPreset(preset) {
  const list = PRESETS[preset] || [];
  const next = [...new Set([...state.blockedSites, ...list])].sort();
  state.blockedSites = next;
  await setState({ blockedSites: next });
  toast(`Preset "${preset}" añadido`);
  renderSites();
}

// ===== Settings =====
function renderSettings() {
  document.getElementById('setting-motivational').checked = state.settings.motivationalMessagesEnabled;
  document.getElementById('setting-sound').checked = state.settings.soundEnabled;
  applyAccent(state.settings.accentColor || 'green');
}

function initSettings() {
  document.getElementById('setting-motivational').addEventListener('change', (e) => {
    state.settings.motivationalMessagesEnabled = e.target.checked;
    setState({ settings: state.settings });
    toast('Ajuste guardado');
  });
  document.getElementById('setting-sound').addEventListener('change', (e) => {
    state.settings.soundEnabled = e.target.checked;
    setState({ settings: state.settings });
    toast('Ajuste guardado');
  });
  document.getElementById('export-btn').addEventListener('click', exportJson);
  document.getElementById('import-btn').addEventListener('click', () => document.getElementById('import-file').click());
  document.getElementById('import-file').addEventListener('change', importJson);
  document.getElementById('reset-streak-btn').addEventListener('click', resetStreakConfirm);
  document.getElementById('reset-all-btn').addEventListener('click', resetAllConfirm);
  document.getElementById('options-link').addEventListener('click', (e) => { e.preventDefault(); chrome.runtime.openOptionsPage(); });
  document.getElementById('open-options').addEventListener('click', () => chrome.runtime.openOptionsPage());
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
    await loadAndRender();
  } catch (err) {
    console.error('[popup] import', err);
    toast('Error al importar');
  }
  e.target.value = '';
}

async function resetStreakConfirm() {
  if (!confirm('¿Resetear racha actual a 0?')) return;
  state.streak = { ...state.streak, current: 0, brokeToday: false };
  await setState({ streak: state.streak });
  toast('Racha reseteada');
  renderStatus();
}

async function resetAllConfirm() {
  if (!confirm('Esto borra todo: bloques, webs, rachas, estadísticas. ¿Continuar?')) return;
  await resetAll();
  toast('Todo restablecido');
  await loadAndRender();
}

// ===== Toast =====
let toastTimer = null;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.hidden = false;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 1800);
}

// ===== Boot =====
async function loadAndRender() {
  state = await getState();
  renderAll();
}

function renderAll() {
  renderStatus();
  renderSchedules();
  renderSites();
  renderSettings();
}

// ===== Achievements =====
function renderAchievements() {
  const strip = document.getElementById('achievements-strip');
  if (!strip) return;
  strip.innerHTML = '';
  let unlocked = 0;
  ACHIEVEMENTS.forEach((a) => {
    const earned = a.test(state);
    if (earned) unlocked++;
    const badge = document.createElement('div');
    badge.className = 'achievement-badge' + (earned ? ' unlocked' : '');
    badge.innerHTML = a.icon + `<span class="tt">${earned ? '' : '🔒 '}${a.name} · ${a.desc}</span>`;
    strip.appendChild(badge);
  });
  document.getElementById('achievements-unlocked').textContent = unlocked;
  document.getElementById('achievements-total').textContent = ACHIEVEMENTS.length;
}

// ===== Pomodoro quick start =====
async function startPomodoro(minutes) {
  const now = new Date();
  const endDate = new Date(now.getTime() + minutes * 60000);
  if (endDate.getDate() !== now.getDate() || endDate.getMonth() !== now.getMonth()) {
    toast('Cruza medianoche — no disponible');
    return;
  }
  const start = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
  const end = `${pad2(endDate.getHours())}:${pad2(endDate.getMinutes())}`;
  if (parseHHMM(end) <= parseHHMM(start)) {
    toast('Demasiado tarde para este pomodoro');
    return;
  }
  // Remove any existing pomodoros
  state.schedules = state.schedules.filter((s) => !s.id.startsWith('pomodoro-'));
  state.schedules.push({
    id: 'pomodoro-' + Date.now(),
    name: `Pomodoro ${minutes}min`,
    days: [now.getDay()],
    startTime: start,
    endTime: end,
    enabled: true,
    expiresAt: endDate.getTime()
  });
  await setState({ schedules: state.schedules });
  toast(`Foco activado · ${minutes} min`);
  renderAll();
}

function initPomodoro() {
  document.querySelectorAll('.pomodoro-btn').forEach((b) =>
    b.addEventListener('click', () => startPomodoro(Number(b.dataset.min)))
  );
}

// ===== Add current tab =====
async function addCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return toast('No hay pestaña visible');
    let host;
    try {
      host = new URL(tab.url).hostname;
    } catch (err) {
      return toast('URL no válida');
    }
    const domain = normalizeDomain(host);
    if (!domain) return toast('Dominio no bloqueable');
    if (state.blockedSites.includes(domain)) return toast('Ya está en la lista');
    state.blockedSites = [...state.blockedSites, domain].sort();
    await setState({ blockedSites: state.blockedSites });
    toast(`${domain} añadido`);
    renderSites();
  } catch (err) {
    console.error('[popup] addCurrentTab', err);
    toast('No se pudo leer la pestaña');
  }
}

function initCurrentTab() {
  const btn = document.getElementById('add-current-tab-btn');
  if (btn) btn.addEventListener('click', addCurrentTab);
}

// ===== Theme accent =====
function applyAccent(accent) {
  const valid = ['green', 'amber', 'blue', 'purple'];
  const v = valid.includes(accent) ? accent : 'green';
  document.documentElement.dataset.accent = v;
  document.querySelectorAll('.theme-swatch').forEach((s) =>
    s.classList.toggle('active', s.dataset.accent === v)
  );
}

function initTheme() {
  document.querySelectorAll('.theme-swatch').forEach((s) =>
    s.addEventListener('click', async () => {
      const accent = s.dataset.accent;
      state.settings.accentColor = accent;
      applyAccent(accent);
      await setState({ settings: state.settings });
      toast('Color aplicado');
    })
  );
}

initTabs();
initModal();
initSites();
initSettings();
initPomodoro();
initCurrentTab();
initTheme();
loadAndRender();

chrome.storage.onChanged.addListener((_changes, area) => {
  if (area === 'local') loadAndRender();
});
