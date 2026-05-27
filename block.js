import { pickRandomMessage } from './utils/messages.js';
import { parseHHMM } from './utils/scheduler.js';

const FROM_PREFIX = '&from=';

function readParams() {
  const search = location.search;
  const params = new URLSearchParams(search);
  const site = params.get('site') || '';
  const idx = search.indexOf(FROM_PREFIX);
  const fromUrl = idx >= 0 ? decodeURIComponent(search.slice(idx + FROM_PREFIX.length)) : '';
  return { site, fromUrl };
}

const { site, fromUrl } = readParams();

document.getElementById('motivational').textContent = pickRandomMessage();
if (site) {
  document.getElementById('domain').textContent = site;
} else {
  document.querySelector('.domain-pill').style.display = 'none';
}

let countdownTimer = null;
let activeBlockRef = null;

async function refreshState() {
  try {
    const res = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
    if (!res?.ok) return;
    document.getElementById('streak-current').textContent = res.state.streak.current;
    document.getElementById('streak-best').textContent = res.state.streak.best;
    document.getElementById('focus-today').textContent = res.state.focusTime.today;
    document.getElementById('break-current-streak').textContent = res.state.streak.current;
    if (res.active && res.transition?.time) {
      if (!countdownTimer || activeBlockRef?.id !== res.active.id) {
        activeBlockRef = res.active;
        startCountdown(new Date(res.transition.time), res.active);
      }
    } else {
      goBack();
    }
  } catch (err) {
    console.error('[block] refresh', err);
  }
}

function startCountdown(endDate, block) {
  stopCountdown();
  const valueEl = document.getElementById('time-remaining');
  const progressEl = document.getElementById('time-progress');
  const totalMs = (parseHHMM(block.endTime) - parseHHMM(block.startTime)) * 60000;
  const tick = () => {
    const now = new Date();
    const diff = Math.max(0, endDate - now);
    const totalSec = Math.floor(diff / 1000);
    const hh = Math.floor(totalSec / 3600);
    const mm = Math.floor((totalSec % 3600) / 60);
    const ss = totalSec % 60;
    valueEl.textContent = `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
    const progressed = Math.max(0, Math.min(1, (totalMs - diff) / totalMs));
    progressEl.style.width = `${progressed * 100}%`;
    if (diff === 0) {
      stopCountdown();
      setTimeout(goBack, 600);
    }
  };
  tick();
  countdownTimer = setInterval(tick, 1000);
}

function stopCountdown() {
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
}

function pad(n) { return String(n).padStart(2, '0'); }

function goBack() {
  if (fromUrl) location.replace(fromUrl);
  else closeTab();
}

async function closeTab() {
  try {
    await chrome.runtime.sendMessage({ type: 'CLOSE_TAB' });
  } catch (err) {
    console.error('[block] closeTab', err);
    window.close();
  }
}

document.getElementById('back-btn').addEventListener('click', closeTab);

// Break modal flow
const modal = document.getElementById('break-modal');
const breakInput = document.getElementById('break-input');
const breakConfirm = document.getElementById('break-confirm');

document.getElementById('break-btn').addEventListener('click', openBreakModal);
document.getElementById('break-cancel-1').addEventListener('click', closeBreakModal);
document.getElementById('break-cancel-2').addEventListener('click', closeBreakModal);
document.getElementById('break-next').addEventListener('click', () => showStep(2));
document.getElementById('break-confirm').addEventListener('click', confirmBreak);

breakInput.addEventListener('input', () => {
  breakConfirm.disabled = breakInput.value !== 'ROMPER';
});

modal.addEventListener('click', (e) => {
  if (e.target.id === 'break-modal') closeBreakModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.hidden) closeBreakModal();
});

function openBreakModal() {
  modal.hidden = false;
  showStep(1);
  breakInput.value = '';
  breakConfirm.disabled = true;
}

function closeBreakModal() {
  modal.hidden = true;
  showStep(1);
}

function showStep(n) {
  document.querySelectorAll('.modal-step').forEach((s) =>
    s.classList.toggle('hidden', Number(s.dataset.step) !== n)
  );
  if (n === 2) setTimeout(() => breakInput.focus(), 80);
}

async function confirmBreak() {
  if (breakInput.value !== 'ROMPER') return;
  try {
    const res = await chrome.runtime.sendMessage({ type: 'BREAK', domain: site });
    if (res?.ok) {
      closeBreakModal();
      setTimeout(() => {
        if (fromUrl) location.replace(fromUrl);
        else window.close();
      }, 380);
    }
  } catch (err) {
    console.error('[block] confirm break', err);
  }
}

// Record block hit + initial render
chrome.runtime.sendMessage({ type: 'BLOCK_HIT' }).catch((err) => console.error('[block] hit', err));
refreshState();
setInterval(refreshState, 30000);
