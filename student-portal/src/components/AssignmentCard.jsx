// AssignmentCard — one assignment for the student: deadline, status, own submission, grade and
// feedback, and (before the deadline and until graded) a PDF upload to submit or resubmit.
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Upload } from 'lucide-react';
import { downloadMySubmission, submitAssignment } from '../api/student.api.js';
import { checkPdfFile, MAX_UPLOAD_MB } from '../config/uploads.js';
import { formatDateTime, relativeTime, STATUS_LABELS } from '../utils/format.js';
import Alert from './Alert.jsx';

export default function AssignmentCard({ assignment, onUpdated, showCourse = true }) {
  const a = assignment;
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const input = useRef(null);

  async function handleSubmit() {
    const problem = checkPdfFile(file);
    if (problem) return setError(problem);
    if (a.submission && !window.confirm('Replace your previous submission with this file?')) return;
    setError('');
    setNotice('');
    setBusy(true);
    try {
      const updated = await submitAssignment(a.assignmentId, file);
      onUpdated(updated);
      setNotice(a.submission ? 'Your new file replaced the previous submission.' : 'Submitted successfully.');
      setFile(null);
      if (input.current) input.current.value = '';
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="card list-item">
      <div className="list-item-main">
        <div className="list-item-title">
          {a.title}
          <span className={`badge badge-${a.status}`}>{STATUS_LABELS[a.status]}</span>
          <span className="badge badge-active">{a.type === 'lab' ? 'Lab' : 'Lecture'}</span>
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
          Due {formatDateTime(a.dueAt)} ({relativeTime(a.dueAt)}) · {a.createdBy}
        </div>
        {a.instructions && <p className="list-item-text pre-wrap">{a.instructions}</p>}

        {a.submission && (
          <div className="small">
            Your submission:{' '}
            <button type="button" className="link-button" onClick={() => downloadMySubmission(a.assignmentId).catch((err) => setError(err.message))}>
              <Download size={14} aria-hidden="true" /> {a.submission.originalFilename}
            </button>{' '}
            <span className="muted">({formatDateTime(a.submission.submittedAt)})</span>
          </div>
        )}

        {a.submission?.grade !== null && a.submission?.grade !== undefined && (
          <div className="feedback">
            <strong>Grade: {a.submission.grade} / 100</strong>
            {a.submission.feedback && <span className="pre-wrap">{a.submission.feedback}</span>}
          </div>
        )}

        {a.canSubmit && (
          <div className="submit-row">
            <input
              ref={input}
              type="file"
              accept="application/pdf,.pdf"
              aria-label={`PDF for ${a.title}`}
              onChange={(e) => (setFile(e.target.files?.[0] ?? null), setError(''))}
            />
            <button type="button" className="button button-primary button-small" disabled={busy || !file} onClick={handleSubmit}>
              <Upload size={14} aria-hidden="true" /> {busy ? 'Uploading…' : a.submission ? 'Resubmit' : 'Submit'}
            </button>
            <span className="muted small">PDF, max {MAX_UPLOAD_MB} MB</span>
          </div>
        )}
        {notice && <Alert variant="info">{notice}</Alert>}
        {error && <Alert>{error}</Alert>}
      </div>
    </article>
  );
}
