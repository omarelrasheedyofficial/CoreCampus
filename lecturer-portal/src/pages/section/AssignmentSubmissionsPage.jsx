// pages/section/AssignmentSubmissionsPage.jsx — every student of the section for one assignment:
// submission status, download, grade (0–100) and feedback.
// (Shared between the lecturer and lab-teacher portals.)
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { downloadSubmission, fetchAssignment, fetchSubmissions, gradeSubmission } from '../../api/teaching.api.js';
import { formatDateTime, STATUS_LABELS } from '../../utils/format.js';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

function GradeForm({ row, onSaved, onError }) {
  const sub = row.submission;
  const [grade, setGrade] = useState(sub.grade ?? '');
  const [feedback, setFeedback] = useState(sub.feedback ?? '');
  const [saving, setSaving] = useState(false);
  const dirty = String(grade) !== String(sub.grade ?? '') || feedback !== (sub.feedback ?? '');

  async function handleSubmit(event) {
    event.preventDefault();
    const n = Number(grade);
    if (grade === '' || !Number.isFinite(n) || n < 0 || n > 100) return onError('Grade must be between 0 and 100.');
    onError('');
    setSaving(true);
    try {
      onSaved(await gradeSubmission(sub.submissionId, { grade: n, feedback }));
    } catch (err) {
      onError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="grade-form" onSubmit={handleSubmit}>
      <input
        className="table-input grade-input"
        type="number"
        min={0}
        max={100}
        step="0.01"
        value={grade}
        onChange={(e) => setGrade(e.target.value)}
        aria-label={`Grade for ${row.student.fullName}`}
        placeholder="0–100"
      />
      <textarea
        className="table-input"
        rows={2}
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        maxLength={5000}
        aria-label={`Feedback for ${row.student.fullName}`}
        placeholder="Feedback (optional)"
      />
      <button type="submit" className="button button-primary button-small" disabled={saving || !dirty}>
        {sub.grade === null ? 'Save grade' : 'Update'}
      </button>
    </form>
  );
}

export default function AssignmentSubmissionsPage() {
  const { sectionId, assignmentId } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    Promise.all([fetchAssignment(assignmentId), fetchSubmissions(assignmentId)])
      .then(([a, s]) => (setAssignment(a), setRows(s)))
      .catch((err) => setError(err.message));
  }, [assignmentId]);

  if (!assignment) return error ? <Alert>{error}</Alert> : <Loader label="Loading submissions…" />;

  const submitted = rows.filter((r) => r.submission).length;
  const graded = rows.filter((r) => r.status === 'graded').length;

  return (
    <>
      <Link to={`/sections/${sectionId}/assignments`} className="link back-link">
        <ArrowLeft size={16} aria-hidden="true" /> Assignments
      </Link>
      <div className="section-header">
        <div>
          <h2>{assignment.title}</h2>
          <p className="muted small">
            Due {formatDateTime(assignment.dueAt)} · {submitted}/{rows.length} submitted · {graded} graded
          </p>
        </div>
      </div>
      {assignment.instructions && <p className="card instructions">{assignment.instructions}</p>}
      {notice && <Alert variant="info">{notice}</Alert>}
      {error && <Alert>{error}</Alert>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Student</th>
              <th scope="col">Status</th>
              <th scope="col">Submission</th>
              <th scope="col">Grade & feedback</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.enrollmentId}>
                <td data-label="Student">
                  <strong>{row.student.fullName}</strong>
                  <div className="muted small">{row.student.universityId}</div>
                </td>
                <td data-label="Status">
                  <span className={`badge badge-${row.status}`}>{STATUS_LABELS[row.status] ?? row.status}</span>
                  {row.submission?.isLate && <span className="badge badge-missing">Late</span>}
                </td>
                <td data-label="Submission">
                  {row.submission ? (
                    <>
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => downloadSubmission(row.submission.submissionId).catch((err) => setError(err.message))}
                      >
                        <Download size={14} aria-hidden="true" /> {row.submission.originalFilename}
                      </button>
                      <div className="muted small">{formatDateTime(row.submission.submittedAt)}</div>
                    </>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td data-label="Grade & feedback">
                  {row.submission ? (
                    <>
                      <GradeForm
                        key={`${row.submission.submissionId}-${row.submission.gradedAt}`}
                        row={row}
                        onError={setError}
                        onSaved={(updated) => {
                          setRows((all) => all.map((r) => (r.enrollmentId === updated.enrollmentId ? updated : r)));
                          setNotice(`Saved grade for ${updated.student.fullName}.`);
                        }}
                      />
                      {row.submission.gradedBy && (
                        <div className="muted small">
                          Graded by {row.submission.gradedBy}, {formatDateTime(row.submission.gradedAt)}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="muted small">Nothing to grade yet</span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="table-empty">
                  No students in this section.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
