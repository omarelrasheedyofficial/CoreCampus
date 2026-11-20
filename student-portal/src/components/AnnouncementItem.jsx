// AnnouncementItem — one announcement. The message is rendered as plain text (no HTML), so any
// markup a sender typed is displayed literally instead of executed (doc §6.1).
import { Link } from 'react-router-dom';
import { formatDateTime } from '../utils/format.js';

const SCOPE_LABELS = { course: 'Course', lecture: 'Lecture section', lab: 'Lab section' };

export default function AnnouncementItem({ announcement: a, showCourse = true }) {
  return (
    <article id={`announcement-${a.announcementId}`} className="card list-item" tabIndex={-1} style={{ scrollMarginTop: '80px' }}>
      <div className="list-item-main">
        <div className="list-item-title">
          {a.title} <span className="badge badge-active">{SCOPE_LABELS[a.scope]}</span>
        </div>
        <div className="muted small">
          {showCourse && (
            <>
              <Link className="link" to={`/courses/${a.course.courseId}`}>
                {a.course.code}
              </Link>{' '}
              ·{' '}
            </>
          )}
          {a.postedBy} · {formatDateTime(a.createdAt)}
        </div>
        <p className="list-item-text pre-wrap">{a.message}</p>
      </div>
    </article>
  );
}
