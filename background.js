import { getState, setState, initialize } from './utils/storage.js';
import { getActiveBlock, getNextTransition } from './utils/scheduler.js';
import { evaluateRollover, todayString } from './utils/streak.js';
import { buildDomainRegex } from './utils/domains.js';

const RULE_ID_START = 1000;
const ALARM_TICK = 'fg-tick';
const ALARM_TRANSITION = 'fg-transition';
const ALARM_BREAK_PREFIX = 'fg-break-';

function buildRule(id, domain) {
  const target =
    chrome.runtime.getURL('block.html') +
    '?site=' + encodeURIComponent(domain) + '&from=\\0';
  return {
    id,
    priority: 1,
    action: { type: 'redirect', redirect: { regexSubstitution: target } },
    condition: { regexFilter: buildDomainRegex(domain), resourceTypes: ['main_frame'] }
  };
}

async function updateBlockingRules(state, activeBlock) {
  try {
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    const removeRuleIds = existing.map((r) => r.id);
    let addRules = [];
    if (activeBlock) {
      const onBreak = new Set(
        (state.activeBreaks || []).filter((b) => b.expiresAt > Date.now()).map((b) => b.domain)
      );
      const sites = (state.blockedSites || []).filter((d) => !onBreak.has(d));
      addRules = sites.map((domain, idx) => buildRule(RULE_ID_START + idx, domain));
    }
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules });
  } catch (err) {
    console.error('[bg] updateBlockingRules', err);
  }
}

async function scheduleNextTransitionAlarm(state, now) {
  try {
    const next = getNextTransition(state.schedules, now);
    if (!next) {
      await chrome.alarms.clear(ALARM_TRANSITION);
      return;
    }
    await chrome.alarms.create(ALARM_TRANSITION, { when: next.time.getTime() });
  } catch (err) {
    console.error('[bg] scheduleNextTransitionAlarm', err);
  }
}

async function rescheduleBreakAlarms(breaks) {
  try {
    for (const b of breaks || []) {
      if (b.expiresAt > Date.now()) {
        await chrome.alarms.create(ALARM_BREAK_PREFIX + b.domain, { when: b.expiresAt });
      }
    }
  } catch (err) {
    console.error('[bg] rescheduleBreakAlarms', err);
  }
}

async function refresh() {
  const state = await getState();
  const now = new Date();
  const active = getActiveBlock(state.schedules, now);
  await updateBlockingRules(state, active);
  await scheduleNextTransitionAlarm(state, now);
  await rescheduleBreakAlarms(state.activeBreaks);
}

async function registerBreak(domain) {
  const state = await getState();
  const expiresAt = Date.now() + 5 * 60 * 1000;
  const filtered = (state.activeBreaks || []).filter((b) => b.domain !== domain);
  filtered.push({ domain, expiresAt });
  const newStreak = { ...state.streak, brokeToday: true, current: 0 };
  const newStats = { ...state.stats, totalBreaks: (state.stats.totalBreaks || 0) + 1 };
  await setState({ activeBreaks: filtered, streak: newStreak, stats: newStats });
  await chrome.alarms.create(ALARM_BREAK_PREFIX + domain, { when: expiresAt });
  await refresh();
  return { ok: true, expiresAt };
}

async function expireBreak(domain) {
  const state = await getState();
  const filtered = (state.activeBreaks || []).filter((b) => b.domain !== domain);
  await setState({ activeBreaks: filtered });
}

async function onTick() {
  const state = await getState();
  const now = new Date();
  const updates = evaluateRollover(state, now);
  if (Object.keys(updates).length > 0) {
    await setState(updates);
  }
  const merged = { ...state, ...updates };
  const active = getActiveBlock(merged.schedules, now);
  if (active) {
    const today = todayString(now);
    const ft = { ...(merged.focusTime || {}) };
    if (ft.todayDate !== today) { ft.todayDate = today; ft.today = 0; }
    ft.today = (ft.today || 0) + 1;
    await setState({ focusTime: ft });
  }
  const breaks = merged.activeBreaks || [];
  const still = breaks.filter((b) => b.expiresAt > Date.now());
  if (still.length !== breaks.length) {
    await setState({ activeBreaks: still });
  }
}

async function recordBlockHit() {
  const state = await getState();
  const newStats = {
    ...state.stats,
    totalBlocksPrevented: (state.stats.totalBlocksPrevented || 0) + 1
  };
  await setState({ stats: newStats });
  return { ok: true };
}

async function handleMessage(msg, sender) {
  if (!msg || !msg.type) return { ok: false };
  switch (msg.type) {
    case 'GET_STATE': {
      const state = await getState();
      const now = new Date();
      const active = getActiveBlock(state.schedules, now);
      const transition = getNextTransition(state.schedules, now);
      return {
        ok: true,
        state,
        active,
        transition: transition ? { ...transition, time: transition.time.toISOString() } : null,
        now: now.toISOString()
      };
    }
    case 'BREAK':
      return await registerBreak(msg.domain);
    case 'BLOCK_HIT':
      return await recordBlockHit();
    case 'CLOSE_TAB': {
      if (sender?.tab?.id) {
        try { await chrome.tabs.remove(sender.tab.id); } catch (err) { console.error('[bg] close tab', err); }
      }
      return { ok: true };
    }
    case 'FORCE_REFRESH':
      await refresh();
      return { ok: true };
    default:
      return { ok: false, error: 'unknown' };
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  try {
    const data = await chrome.storage.local.get(null);
    if (!data || !data.schemaVersion) await initialize();
    await chrome.alarms.create(ALARM_TICK, { periodInMinutes: 1 });
    await refresh();
  } catch (err) {
    console.error('[bg] onInstalled', err);
  }
});

chrome.runtime.onStartup.addListener(async () => {
  try {
    await chrome.alarms.create(ALARM_TICK, { periodInMinutes: 1 });
    await refresh();
  } catch (err) {
    console.error('[bg] onStartup', err);
  }
});

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== 'local') return;
  if (changes.schedules || changes.blockedSites || changes.activeBreaks) {
    try { await refresh(); } catch (err) { console.error('[bg] storage change', err); }
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  try {
    if (alarm.name === ALARM_TICK) await onTick();
    else if (alarm.name === ALARM_TRANSITION) await refresh();
    else if (alarm.name.startsWith(ALARM_BREAK_PREFIX)) {
      await expireBreak(alarm.name.slice(ALARM_BREAK_PREFIX.length));
    }
  } catch (err) {
    console.error('[bg] onAlarm', err);
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  handleMessage(msg, sender).then(sendResponse).catch((err) => {
    console.error('[bg] onMessage', err);
    sendResponse({ ok: false, error: String(err) });
  });
  return true;
});
