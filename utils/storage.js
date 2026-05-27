export const SCHEMA_VERSION = 1;

export const DEFAULT_STATE = {
  schemaVersion: SCHEMA_VERSION,
  schedules: [
    { id: 'default-morning', name: 'Mañana', days: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '14:00', enabled: true },
    { id: 'default-afternoon', name: 'Tarde', days: [1, 2, 3, 4, 5], startTime: '16:00', endTime: '19:00', enabled: true }
  ],
  blockedSites: [
    'youtube.com', 'twitter.com', 'x.com', 'instagram.com',
    'reddit.com', 'tiktok.com', 'facebook.com', 'netflix.com'
  ],
  streak: { current: 0, best: 0, lastUpdateDate: null, brokeToday: false },
  focusTime: { today: 0, todayDate: null, history: [] },
  stats: { totalBlocksPrevented: 0, totalBreaks: 0 },
  settings: { motivationalMessagesEnabled: true, soundEnabled: false, theme: 'dark' },
  activeBreaks: []
};

function mergeWithDefaults(data) {
  return {
    schemaVersion: data.schemaVersion ?? SCHEMA_VERSION,
    schedules: data.schedules ?? DEFAULT_STATE.schedules,
    blockedSites: data.blockedSites ?? DEFAULT_STATE.blockedSites,
    streak: { ...DEFAULT_STATE.streak, ...(data.streak ?? {}) },
    focusTime: { ...DEFAULT_STATE.focusTime, ...(data.focusTime ?? {}) },
    stats: { ...DEFAULT_STATE.stats, ...(data.stats ?? {}) },
    settings: { ...DEFAULT_STATE.settings, ...(data.settings ?? {}) },
    activeBreaks: data.activeBreaks ?? []
  };
}

export async function getState() {
  try {
    const data = await chrome.storage.local.get(null);
    if (!data || !data.schemaVersion) {
      await initialize();
      return { ...DEFAULT_STATE };
    }
    return mergeWithDefaults(data);
  } catch (err) {
    console.error('[storage] getState failed', err);
    return { ...DEFAULT_STATE };
  }
}

export async function setState(updates) {
  try {
    await chrome.storage.local.set(updates);
  } catch (err) {
    console.error('[storage] setState failed', err);
  }
}

export async function initialize() {
  try {
    await chrome.storage.local.set(DEFAULT_STATE);
  } catch (err) {
    console.error('[storage] initialize failed', err);
  }
}

export async function resetAll() {
  try {
    await chrome.storage.local.clear();
    await initialize();
  } catch (err) {
    console.error('[storage] resetAll failed', err);
  }
}

export async function migrate() {
  try {
    const data = await chrome.storage.local.get(null);
    if (!data || !data.schemaVersion) {
      await initialize();
    }
  } catch (err) {
    console.error('[storage] migrate failed', err);
  }
}
