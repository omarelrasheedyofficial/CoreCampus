export function notificationStorageKey(email) {
  return `campuscore:announcement-reads:${encodeURIComponent(email.trim().toLowerCase())}`;
}

export function loadReadAnnouncements(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(value) ? value.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function saveReadAnnouncements(key, ids) {
  try {
    localStorage.setItem(key, JSON.stringify(ids.slice(-1000)));
  } catch {
    // Read state still works for this session when browser storage is unavailable.
  }
}

/** Refresh while visible, without overlapping requests or updating an unmounted account. */
export function startAnnouncementPolling({ fetchItems, onItems, onError, onSettled, target = window, visibility = document }) {
  let stopped = false;
  let pending = false;

  async function refresh() {
    if (stopped || pending || visibility.hidden) return;
    pending = true;
    try {
      const items = await fetchItems();
      if (!stopped) onItems(items);
    } catch (error) {
      if (!stopped) onError(error);
    } finally {
      pending = false;
      if (!stopped) onSettled();
    }
  }

  const timer = target.setInterval(refresh, 30_000);
  target.addEventListener('focus', refresh);
  visibility.addEventListener('visibilitychange', refresh);
  refresh();

  return {
    refresh,
    stop() {
      stopped = true;
      target.clearInterval(timer);
      target.removeEventListener('focus', refresh);
      visibility.removeEventListener('visibilitychange', refresh);
    },
  };
}
