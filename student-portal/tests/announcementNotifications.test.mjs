import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers/promises';
import {
  loadReadAnnouncements, notificationStorageKey, saveReadAnnouncements, startAnnouncementPolling,
} from '../src/utils/announcementNotifications.js';

test('read notifications persist per account and tolerate unavailable or corrupt storage', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const values = new Map();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  } });
  try {
    const first = notificationStorageKey(' First@campus.test ');
    const second = notificationStorageKey('second@campus.test');
    assert.equal(first, notificationStorageKey('first@campus.test'));
    saveReadAnnouncements(first, ['17', '22']);
    assert.deepEqual(loadReadAnnouncements(first), ['17', '22']);
    assert.deepEqual(loadReadAnnouncements(second), []);
    values.set(first, '{invalid');
    assert.deepEqual(loadReadAnnouncements(first), []);
    values.set(first, '{"unexpected":true}');
    assert.deepEqual(loadReadAnnouncements(first), []);
    values.set(first, '["17",null,{}]');
    assert.deepEqual(loadReadAnnouncements(first), ['17']);
    localStorage.getItem = () => { throw new Error('Storage blocked'); };
    localStorage.setItem = () => { throw new Error('Storage full'); };
    assert.deepEqual(loadReadAnnouncements(first), []);
    assert.doesNotThrow(() => saveReadAnnouncements(first, ['17']));
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    else delete globalThis.localStorage;
  }
});

test('polling refreshes on schedule and return to the page, recovers from failure, and isolates unmounted accounts', async () => {
  const target = new EventTarget();
  const visibility = new EventTarget();
  visibility.hidden = false;
  let tick;
  let cleared = false;
  target.setInterval = (callback, ms) => { assert.equal(ms, 30_000); tick = callback; return 1; };
  target.clearInterval = (id) => { assert.equal(id, 1); cleared = true; };
  let resolveRequest;
  let next = () => new Promise((resolve) => { resolveRequest = resolve; });
  let calls = 0;
  const updates = [];
  const errors = [];
  let settled = 0;
  const subscription = startAnnouncementPolling({
    target, visibility,
    fetchItems: () => { calls++; return next(); },
    onItems: (items) => updates.push(items),
    onError: (error) => errors.push(error.message),
    onSettled: () => settled++,
  });
  assert.equal(calls, 1);
  target.dispatchEvent(new Event('focus'));
  tick();
  await subscription.refresh();
  assert.equal(calls, 1, 'Pending requests must not overlap');
  resolveRequest([{ announcementId: 17 }]);
  await setImmediate();
  assert.equal(updates.length, 1);

  next = async () => { throw new Error('Temporary outage'); };
  await tick();
  assert.deepEqual(errors, ['Temporary outage']);
  next = async () => [{ announcementId: 18 }];
  await subscription.refresh();
  assert.deepEqual(updates.at(-1), [{ announcementId: 18 }]);
  assert.equal(settled, 3);

  visibility.hidden = true;
  const before = calls;
  await tick();
  target.dispatchEvent(new Event('focus'));
  assert.equal(calls, before, 'Hidden pages should not poll');
  visibility.hidden = false;
  visibility.dispatchEvent(new Event('visibilitychange'));
  await setImmediate();
  assert.equal(calls, before + 1);

  next = () => new Promise((resolve) => { resolveRequest = resolve; });
  const pending = subscription.refresh();
  const lastUpdates = updates.length;
  const lastSettled = settled;
  subscription.stop();
  assert.equal(cleared, true);
  resolveRequest([{ announcementId: 99 }]);
  await pending;
  assert.equal(updates.length, lastUpdates, 'Old accounts must not receive stale responses');
  assert.equal(settled, lastSettled);
  const stoppedCalls = calls;
  target.dispatchEvent(new Event('focus'));
  visibility.dispatchEvent(new Event('visibilitychange'));
  await tick();
  assert.equal(calls, stoppedCalls, 'Timers and listeners must be cleaned up');
});
