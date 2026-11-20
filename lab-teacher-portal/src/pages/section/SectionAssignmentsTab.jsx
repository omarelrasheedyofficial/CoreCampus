import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { createAssignment, deleteAssignment, fetchSectionAssignments, updateAssignment } from '../../api/teaching.api.js';
import { TEACHING } from '../../config/teaching.js';
import { formatDateTime, relativeTime } from '../../utils/format.js';
import AssignmentForm from '../../components/AssignmentForm.jsx';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';
import EmptyState from '../../components/EmptyState.jsx';

export default function SectionAssignmentsTab() {
  const { section } = useOutletContext();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchSectionAssignments(section.sectionId)
      .then(setAssignments)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [section.sectionId]);

  const sortByDue = (rows) => [...rows].sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));

  async function handleCreate(fields) {
    const created = await createAssignment(section.sectionId, fields);
    setAssignments((rows) => sortByDue([...rows, created]));
    setShowCreate(false);
    setNotice(`Created "${created.title}".`);
  }

  async function handleUpdate(assignmentId, fields) {
    const updated = await updateAssignment(assignmentId, fields);
    setAssignments((rows) => sortByDue(rows.map((a) => (a.assignmentId === assignmentId ? updated : a))));
    setEditingId(null);
    setNotice(`Saved "${updated.title}".`);
  }

  async function handleDelete(assignment) {
    if (!window.confirm(`Delete "${assignment.title}"?`)) return;
    setError('');
    setNotice('');
    try {
      await deleteAssignment(assignment.assignmentId);
      setAssignments((rows) => rows.filter((a) => a.assignmentId !== assignment.assignmentId));
      setNotice(`Deleted "${assignment.title}".`);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <Loader label="Loading assignments…" />;

  return (
    <>
      <div className="toolbar toolbar-end">
        {!showCreate && (
          <button type="button" className="button button-primary" onClick={() => (setShowCreate(true), setEditingId(null))}>
            <Plus size={16} aria-hidden="true" /> New {TEACHING.sectionLabel.toLowerCase()} assignment
          </button>
        )}
      </div>
      {showCreate && (
        <AssignmentForm heading={`New ${TEACHING.sectionLabel.toLowerCase()} assignment`} submitLabel="Create" onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
      )}
      {notice && <Alert variant="info">{notice}</Alert>}
      {error && <Alert>{error}</Alert>}

      {assignments.length === 0 && !showCreate && (
        <EmptyState title="No assignments yet">Create the first assignment for this section.</EmptyState>
      )}

      <div className="list">
        {assignments.map((a) =>
          editingId === a.assignmentId ? (
            <AssignmentForm
              key={a.assignmentId}
              initial={a}
              heading={`Edit "${a.title}"`}
              submitLabel="Save"
              onSubmit={(fields) => handleUpdate(a.assignmentId, fields)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <article key={a.assignmentId} className="card list-item">
              <div className="list-item-main">
                <Link className="list-item-title link" to={`/sections/${section.sectionId}/assignments/${a.assignmentId}`}>
                  {a.title}
                </Link>
                <div className="muted small">
                  Due {formatDateTime(a.dueAt)} ({relativeTime(a.dueAt)}) · {a.submissionCount} submitted · {a.gradedCount} graded
                </div>
                {a.instructions && <p className="list-item-text">{a.instructions}</p>}
              </div>
              <div className="row-actions">
                <Link className="button button-ghost button-small" to={`/sections/${section.sectionId}/assignments/${a.assignmentId}`}>
                  Submissions
                </Link>
                <button type="button" className="icon-button" aria-label={`Edit ${a.title}`} title="Edit" onClick={() => (setEditingId(a.assignmentId), setShowCreate(false))}>
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  className="icon-button icon-button-danger"
                  aria-label={`Delete ${a.title}`}
                  title={a.submissionCount > 0 ? 'Assignments with submissions cannot be deleted' : 'Delete'}
                  disabled={a.submissionCount > 0}
                  onClick={() => handleDelete(a)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ),
        )}
      </div>
    </>
  );
}
