// utils/awayTimeout.js — signs the user out after they have been away from the page for `timeoutMs`.
// (Shared file: keep identical in every portal.)
//
// "Away" = the page is hidden (other tab, minimized), does not have focus, AND has stopped being
// drawn. Some embedded browsers (e.g. a browser tab inside an editor) report `hidden` and no focus
// while the page is actually on screen, so those two signals alone are not trusted:
//   • a focused page is never away;
//   • a page that is still being painted (requestAnimationFrame keeps running) is on screen, so
//     it is not away — real hidden tabs stop painting;
//   • any activity on the page (mouse, click, key, scroll, touch, focus) cancels a countdown.
// If the browser suspends timers while the page is hidden, the expired deadline is caught on return.
const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart', 'focus'];
const PAINT_GRACE_MS = 1500;
const PRESENCE_INTERVAL_MS = 1000;

export function watchAwayTimeout({
  timeoutMs,
  onTimeout,
  visibilityDocument = globalThis.document,
  activityTarget = globalThis.window,
  presenceKey,
  presenceStorage,
  now = Date.now,
  schedule = globalThis.setTimeout,
  cancel = globalThis.clearTimeout,
  requestFrame = globalThis.requestAnimationFrame?.bind(globalThis),
  cancelFrame = globalThis.cancelAnimationFrame?.bind(globalThis),
}) {
  let timer = null;
  let frame = null;
  let lastPaintAt = null;
  let deadline = null;
  let awaySince = null;
  let expired = false;
  let stopped = false;
  let presenceTimer = null;
  let lastPublishedAt = null;
  let wasPresent = false;
  let storage = presenceStorage;
  if (presenceKey && storage === undefined) {
    try { storage = activityTarget?.localStorage ?? globalThis.localStorage; }
    catch { storage = null; }
  }
  let sharingPresence = Boolean(presenceKey && storage?.getItem && storage?.setItem);

  const stopPresenceWatch = () => {
    if (presenceTimer !== null) cancel(presenceTimer);
    presenceTimer = null;
  };

  const readSharedPresence = () => {
    if (!sharingPresence) return null;
    try {
      const raw = storage.getItem(presenceKey);
      if (raw === null || raw === '') return null;
      const timestamp = Number(raw);
      return Number.isFinite(timestamp) && timestamp >= 0 && timestamp <= now() ? timestamp : null;
    } catch {
      sharingPresence = false;
      stopPresenceWatch();
      return null;
    }
  };

  const publishPresence = (force = false) => {
    if (!sharingPresence) return;
    const timestamp = now();
    if (!force && lastPublishedAt !== null && timestamp - lastPublishedAt < PRESENCE_INTERVAL_MS) return;
    try {
      storage.setItem(presenceKey, String(timestamp));
      lastPublishedAt = timestamp;
    } catch {
      sharingPresence = false;
      stopPresenceWatch();
    }
  };

  const extendSharedDeadline = () => {
    if (deadline === null) return;
    const timestamp = readSharedPresence();
    if (timestamp !== null && timestamp + timeoutMs > deadline) {
      awaySince = timestamp;
      deadline = timestamp + timeoutMs;
    }
  };

  const hasFocus = () => (typeof visibilityDocument.hasFocus === 'function' ? visibilityDocument.hasFocus() : false);
  const reportedAway = () => visibilityDocument.visibilityState === 'hidden' && !hasFocus();
  const stillPainting = () => lastPaintAt !== null && now() - lastPaintAt < PAINT_GRACE_MS;

  // While a countdown runs, watch whether the page is still being drawn.
  const onFrame = () => {
    if (stopped || expired) return;
    // A resumed frame must not erase time spent genuinely away.
    extendSharedDeadline();
    if (deadline !== null && now() >= deadline && !stillPainting()) {
      fire();
      return;
    }
    lastPaintAt = now();
    wasPresent = true;
    publishPresence();
    startPresenceWatch();
    frame = requestFrame ? requestFrame(onFrame) : null;
  };
  const startPaintWatch = () => {
    if (frame === null && requestFrame) frame = requestFrame(onFrame);
  };
  const stopPaintWatch = () => {
    if (frame !== null && cancelFrame) cancelFrame(frame);
    frame = null;
    lastPaintAt = null;
  };

  const clearTimer = () => {
    if (timer !== null) cancel(timer);
    timer = null;
  };

  const reset = () => {
    clearTimer();
    // Keep checking paint when an embedded browser incorrectly reports hidden.
    if (!reportedAway() || !stillPainting()) stopPaintWatch();
    deadline = null;
    awaySince = null;
  };

  const fire = () => {
    const info = {
      awayMs: awaySince === null ? null : now() - awaySince,
      visibilityState: visibilityDocument.visibilityState,
      hasFocus: hasFocus(),
    };
    expired = true;
    reset();
    stopPaintWatch();
    stopPresenceWatch();
    onTimeout(info);
  };

  const checkDeadline = () => {
    if (stopped || expired || deadline === null) return;
    clearTimer();
    extendSharedDeadline();
    if (!reportedAway() || stillPainting()) {
      markPresent();
      return;
    }
    const remaining = deadline - now();
    if (remaining > 0) timer = schedule(checkDeadline, remaining);
    else fire();
  };

  /** The user is demonstrably present: honour an already-passed deadline, otherwise cancel. */
  const markPresent = () => {
    if (stopped || expired) return;
    // A hidden duplicate must respect activity in another tab of this session.
    extendSharedDeadline();
    if (deadline !== null && now() >= deadline && !stillPainting()) {
      fire();
      return;
    }
    reset();
    wasPresent = true;
    publishPresence();
    startPresenceWatch();
  };

  const startPresenceWatch = () => {
    if (!sharingPresence || presenceTimer !== null || stopped || expired) return;
    // This is a presence heartbeat, not an idle/logout countdown.
    presenceTimer = schedule(() => {
      presenceTimer = null;
      if (stopped || expired) return;
      if (!reportedAway() || stillPainting()) markPresent();
      else evaluate();
    }, PRESENCE_INTERVAL_MS);
  };

  const evaluate = () => {
    if (stopped || expired) return;
    if (reportedAway()) {
      stopPresenceWatch();
      // Give all tabs a full timeout after the last visible tab leaves.
      // A tab that starts hidden must never fabricate active presence.
      if (wasPresent) publishPresence(true);
      wasPresent = false;
      // Repeated hidden events must not extend the original deadline.
      if (deadline === null) {
        awaySince = now();
        deadline = awaySince + timeoutMs;
        startPaintWatch();
      }
      checkDeadline();
    } else {
      markPresent();
    }
  };

  visibilityDocument.addEventListener('visibilitychange', evaluate);
  activityTarget?.addEventListener('blur', evaluate);
  ACTIVITY_EVENTS.forEach((type) => activityTarget?.addEventListener(type, markPresent, { passive: true }));
  evaluate();

  return () => {
    stopped = true;
    reset();
    stopPaintWatch();
    stopPresenceWatch();
    // Do not erase the timestamp: another visible tab may still be using it.
    visibilityDocument.removeEventListener('visibilitychange', evaluate);
    activityTarget?.removeEventListener('blur', evaluate);
    ACTIVITY_EVENTS.forEach((type) => activityTarget?.removeEventListener(type, markPresent));
  };
}
