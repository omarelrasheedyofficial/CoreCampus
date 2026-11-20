import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Megaphone } from 'lucide-react';
import { fetchAnnouncements } from '../api/student.api.js';
import { formatDateTime } from '../utils/format.js';
import {
  loadReadAnnouncements, notificationStorageKey, saveReadAnnouncements, startAnnouncementPolling,
} from '../utils/announcementNotifications.js';
import './AnnouncementNotifications.css';

export default function AnnouncementNotifications({ email }) {
  const storageKey = notificationStorageKey(email);
  const [items, setItems] = useState([]);
  const [readIds, setReadIds] = useState(() => loadReadAnnouncements(storageKey));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const bell = useRef(null);
  const panel = useRef(null);
  const polling = useRef(null);
  const panelId = useId();
  const location = useLocation();
  const read = new Set(readIds);
  const unread = items.filter((item) => !read.has(String(item.announcementId))).length;
  const recent = [...items].sort((a, b) =>
    Number(read.has(String(a.announcementId))) - Number(read.has(String(b.announcementId))) ||
    new Date(b.createdAt) - new Date(a.createdAt) || b.announcementId - a.announcementId,
  ).slice(0, 8);

  useEffect(() => {
    const subscription = startAnnouncementPolling({
      fetchItems: fetchAnnouncements,
      onItems: (next) => { setItems(next); setError(false); },
      onError: () => setError(true),
      onSettled: () => setLoading(false),
    });
    polling.current = subscription;
    return () => subscription.stop();
  }, []);

  useEffect(() => {
    const sync = (event) => {
      if (event.key === storageKey || event.key === null) setReadIds(loadReadAnnouncements(storageKey));
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [storageKey]);

  useEffect(() => { setOpen(false); }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector('button, a')?.focus();
    const outside = (event) => { if (!root.current?.contains(event.target)) setOpen(false); };
    const escape = (event) => {
      if (event.key === 'Escape') { setOpen(false); bell.current?.focus(); }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  function markRead(ids) {
    const next = [...new Set([...readIds, ...loadReadAnnouncements(storageKey), ...ids.map(String)])];
    setReadIds(next);
    saveReadAnnouncements(storageKey, next);
  }

  return (
    <div className="announcement-notifications" ref={root} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <button
        ref={bell} type="button" className="icon-button notification-bell"
        aria-label={`Announcements: ${unread} unread`} aria-expanded={open} aria-controls={panelId}
        onClick={() => { setOpen((current) => !current); polling.current?.refresh(); }}
      >
        <Bell size={20} aria-hidden="true" />
        {unread > 0 && <span className="notification-count" aria-hidden="true">{unread > 99 ? '99+' : unread}</span>}
      </button>
      <span className="notification-sr-only" role="status">{!loading && !error && `${unread} unread announcements`}</span>
      {open && (
        <section id={panelId} ref={panel} className="notification-panel" aria-label="Announcement notifications">
          <div className="notification-heading">
            <h2>Announcements</h2>
            {unread > 0 && <button type="button" className="link-button" onClick={() => markRead(items.map((item) => item.announcementId))}>Mark all as read</button>}
          </div>
          {loading && <p className="notification-message muted">Loading announcements…</p>}
          {error && <div className="notification-message" role="alert">
            <p>Couldn’t refresh announcements.</p>
            <button type="button" className="link-button" onClick={() => polling.current?.refresh()}>Try again</button>
          </div>}
          {!loading && !error && items.length === 0 && <div className="notification-message muted">
            <Megaphone size={24} aria-hidden="true" /><p>No announcements yet.</p>
          </div>}
          {recent.length > 0 && <ul className="notification-list">
            {recent.map((item) => {
              const isUnread = !read.has(String(item.announcementId));
              return <li key={item.announcementId}>
                <Link
                  className={`notification-item${isUnread ? ' notification-unread' : ''}`}
                  to={`/announcements#announcement-${item.announcementId}`}
                  onClick={() => { markRead([item.announcementId]); setOpen(false); }}
                >
                  <span className="notification-title">{isUnread && <span className="notification-sr-only">Unread: </span>}{item.title}</span>
                  <span className="notification-meta">{item.course.code} · {item.postedBy}</span>
                  <time className="notification-meta" dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time>
                </Link>
              </li>;
            })}
          </ul>}
          <Link className="notification-footer link" to="/announcements" onClick={() => setOpen(false)}>View all announcements</Link>
        </section>
      )}
    </div>
  );
}
