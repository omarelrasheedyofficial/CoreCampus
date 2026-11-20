import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Megaphone, Pencil, Trash2 } from 'lucide-react';
import { createAnnouncement, deleteAnnouncement, fetchSectionAnnouncements, updateAnnouncement } from '../../api/teaching.api.js';
import { TEACHING } from '../../config/teaching.js';
import { formatDateTime } from '../../utils/format.js';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';
import EmptyState from '../../components/EmptyState.jsx';

function AnnouncementForm({ initial, onSubmit, onCancel, sectionName }) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [message, setMessage] = useState(initial?.message ?? '');
  const [scope, setScope] = useState('section');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim() || !message.trim()) return setError('Title and message are required.');
    setError('');
    setSaving(true);
    try {
      await onSubmit({ title: title.trim(), message: message.trim(), scope });
      if (!initial) (setTitle(''), setMessage(''));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card form-card" onSubmit={handleSubmit} noValidate>
      <h3>{initial ? 'Edit announcement' : 'New announcement'}</h3>
      {error && <Alert>{error}</Alert>}
      <label className="field">
        <span>Title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
      </label>
      <label className="field">
        <span>Message</span>
        <textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={5000} />
      </label>
      {!initial && TEACHING.allowCourseWideAnnouncements && (
        <div className="checkbox-row" role="radiogroup" aria-label="Audience">
          <label className="checkbox">
            <input type="radio" name="scope" checked={scope === 'section'} onChange={() => setScope('section')} />
            <span>Students of {sectionName}</span>
          </label>
          <label className="checkbox">
            <input type="radio" name="scope" checked={scope === 'course'} onChange={() => setScope('course')} />
            <span>All students of the course</span>
          </label>
        </div>
      )}
      <div className="form-actions">
        {onCancel && (
          <button type="button" className="button button-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="button button-primary" disabled={saving}>
          {initial ? 'Save' : 'Publish'}
        </button>
      </div>
    </form>
  );
}

export default function SectionAnnouncementsTab() {
  const { section } = useOutletContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchSectionAnnouncements(section.sectionId)
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [section.sectionId]);

  async function handleDelete(item) {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    setError('');
    try {
      await deleteAnnouncement(item.announcementId);
      setItems((rows) => rows.filter((r) => r.announcementId !== item.announcementId));
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <Loader label="Loading announcements…" />;
  const sectionName = `${TEACHING.sectionLabel === 'Lab' ? '' : 'Lecture '}${section.name}`;

  return (
    <>
      <AnnouncementForm
        sectionName={sectionName}
        onSubmit={async (fields) => {
          const created = await createAnnouncement(section.sectionId, fields);
          setItems((rows) => [created, ...rows]);
        }}
      />
      {error && <Alert>{error}</Alert>}
      {items.length === 0 && <EmptyState icon={Megaphone} title="No announcements yet" />}
      <div className="list">
        {items.map((item) =>
          editingId === item.announcementId ? (
            <AnnouncementForm
              key={item.announcementId}
              initial={item}
              onCancel={() => setEditingId(null)}
              onSubmit={async (fields) => {
                const updated = await updateAnnouncement(item.announcementId, fields);
                setItems((rows) => rows.map((r) => (r.announcementId === updated.announcementId ? updated : r)));
                setEditingId(null);
              }}
            />
          ) : (
            <article key={item.announcementId} className="card list-item">
              <div className="list-item-main">
                <div className="list-item-title">
                  {item.title} <span className="badge badge-active">{item.scope === 'course' ? 'Whole course' : sectionName}</span>
                </div>
                <div className="muted small">
                  {item.postedBy} · {formatDateTime(item.createdAt)}
                </div>
                <p className="list-item-text pre-wrap">{item.message}</p>
              </div>
              {item.canEdit && (
                <div className="row-actions">
                  <button type="button" className="icon-button" aria-label={`Edit ${item.title}`} onClick={() => setEditingId(item.announcementId)}>
                    <Pencil size={16} />
                  </button>
                  <button type="button" className="icon-button icon-button-danger" aria-label={`Delete ${item.title}`} onClick={() => handleDelete(item)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </article>
          ),
        )}
      </div>
    </>
  );
}
