// pages/AssignmentsPage.jsx — all of the student's assignments: to do (open), and past ones.
import { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { fetchAssignments } from '../api/student.api.js';
import PageHeader from '../components/PageHeader.jsx';
import AssignmentCard from '../components/AssignmentCard.jsx';
import Loader from '../components/Loader.jsx';
import Alert from '../components/Alert.jsx';
import EmptyState from '../components/EmptyState.jsx';

const FILTERS = [
  { key: 'open', label: 'Open', test: (a) => new Date(a.dueAt).getTime() > Date.now() },
  { key: 'past', label: 'Past deadline', test: (a) => new Date(a.dueAt).getTime() <= Date.now() },
  { key: 'all', label: 'All', test: () => true },
];

export default function AssignmentsPage() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('open');

  useEffect(() => {
    fetchAssignments().then(setItems).catch((err) => setError(err.message));
  }, []);

  const active = FILTERS.find((f) => f.key === filter);
  const visible = (items ?? []).filter(active.test);
  if (filter === 'past') visible.reverse(); // most recent first

  return (
    <>
      <PageHeader title="Assignments" subtitle="Lecture and lab assignments of all your courses." />
      <nav className="tabs" aria-label="Filter">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" className={`tab tab-button ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
            {f.label}
            {items && <span className="muted small"> ({items.filter(f.test).length})</span>}
          </button>
        ))}
      </nav>
      {error && <Alert>{error}</Alert>}
      {!items && !error && <Loader label="Loading assignments…" />}
      {items && visible.length === 0 && (
        <EmptyState icon={ClipboardList} title={filter === 'open' ? 'Nothing due' : 'No assignments'} />
      )}
      <div className="list">
        {visible.map((a) => (
          <AssignmentCard
            key={a.assignmentId}
            assignment={a}
            onUpdated={(updated) => setItems((rows) => rows.map((r) => (r.assignmentId === updated.assignmentId ? updated : r)))}
          />
        ))}
      </div>
    </>
  );
}
