const DAY_MIN = 24 * 60;

export function parseHHMM(str) {
  const [h, m] = String(str).split(':').map(Number);
  return h * 60 + m;
}

export function formatHHMM(minutes) {
  const m = ((minutes % DAY_MIN) + DAY_MIN) % DAY_MIN;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function nowParts(now) {
  return {
    day: now.getDay(),
    minutes: now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60
  };
}

export function getActiveBlock(schedules, now = new Date()) {
  if (!Array.isArray(schedules)) return null;
  const { day, minutes } = nowParts(now);
  for (const sch of schedules) {
    if (!sch.enabled) continue;
    if (!sch.days.includes(day)) continue;
    const start = parseHHMM(sch.startTime);
    const end = parseHHMM(sch.endTime);
    if (minutes >= start && minutes < end) return sch;
  }
  return null;
}

export function getBlockEnd(block, now = new Date()) {
  const end = parseHHMM(block.endTime);
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return new Date(d.getTime() + end * 60000);
}

function getNextStart(schedules, now) {
  const enabled = (schedules || []).filter((s) => s.enabled);
  if (enabled.length === 0) return null;
  for (let offset = 0; offset <= 7; offset++) {
    const day = new Date(now);
    day.setDate(day.getDate() + offset);
    const dow = day.getDay();
    let bestToday = null;
    for (const sch of enabled) {
      if (!sch.days.includes(dow)) continue;
      const start = parseHHMM(sch.startTime);
      const mid = new Date(day);
      mid.setHours(0, 0, 0, 0);
      const startDate = new Date(mid.getTime() + start * 60000);
      if (startDate <= now) continue;
      if (!bestToday || startDate < bestToday.time) {
        bestToday = { time: startDate, type: 'start', block: sch };
      }
    }
    if (bestToday) return bestToday;
  }
  return null;
}

export function getNextTransition(schedules, now = new Date()) {
  const active = getActiveBlock(schedules, now);
  if (active) {
    return { time: getBlockEnd(active, now), type: 'end', block: active };
  }
  return getNextStart(schedules, now);
}
