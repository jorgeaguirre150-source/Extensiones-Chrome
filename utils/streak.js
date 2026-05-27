export function todayString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function evaluateRollover(state, now = new Date()) {
  const today = todayString(now);
  const updates = {};
  const { streak, focusTime } = state;

  if (streak.lastUpdateDate !== today) {
    const next = { ...streak };
    if (streak.lastUpdateDate === null) {
      next.current = 0;
    } else if (streak.brokeToday) {
      next.current = 0;
    } else {
      next.current = streak.current + 1;
    }
    if (next.current > next.best) next.best = next.current;
    next.brokeToday = false;
    next.lastUpdateDate = today;
    updates.streak = next;
  }

  if (focusTime.todayDate !== today) {
    const history = Array.isArray(focusTime.history) ? [...focusTime.history] : [];
    if (focusTime.todayDate && focusTime.today > 0) {
      history.push({ date: focusTime.todayDate, minutes: focusTime.today });
    }
    while (history.length > 30) history.shift();
    updates.focusTime = { today: 0, todayDate: today, history };
  }

  return updates;
}

export function getLast7Days(state, now = new Date()) {
  const days = [];
  const todayStr = todayString(now);
  const history = Array.isArray(state.focusTime?.history) ? state.focusTime.history : [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const ds = todayString(d);
    if (ds === todayStr) {
      days.push({ date: ds, minutes: state.focusTime?.todayDate === todayStr ? state.focusTime.today : 0 });
    } else {
      const entry = history.find((h) => h.date === ds);
      days.push({ date: ds, minutes: entry?.minutes ?? 0 });
    }
  }
  return days;
}
