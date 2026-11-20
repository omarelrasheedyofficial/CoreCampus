import { useOutletContext } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { fetchGradebook } from '../../api/teaching.api.js';
import { TEACHING } from '../../config/teaching.js';
import { STATUS_LABELS } from '../../utils/format.js';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';
import EmptyState from '../../components/EmptyState.jsx';

function Cell({ result }) {
  if (result === null) return <span className="muted">n/a</span>;
  if (result.status === 'graded') return <strong>{result.grade}</strong>;
  return <span className={`badge badge-${result.status}`}>{STATUS_LABELS[result.status]}</span>;
}

function Grid({ title, assignments, rows, pick, averageKey, note }) {
  return (
    <section className="section">
      <div className="section-header">
        <h2>{title}</h2>
        {note && <span className="muted small">{note}</span>}
      </div>
      <div className="table-wrap">
        <table className="table gradebook">
          <thead>
            <tr>
              <th scope="col">Student</th>
              {assignments.map((a) => (
                <th scope="col" key={a.assignmentId} title={a.title}>
                  {a.title}
                  {a.labSectionName && <div className="muted small">{a.labSectionName}</div>}
                </th>
              ))}
              <th scope="col">Average</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.enrollmentId}>
                <td data-label="Student">
                  <strong>{s.fullName}</strong>
                  <div className="muted small">{s.universityId}</div>
                </td>
                {pick(s).map((result, i) => (
                  <td key={assignments[i].assignmentId} data-label={assignments[i].title}>
                    <Cell result={result} />
                  </td>
                ))}
                <td data-label="Average">{s[averageKey] ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function SectionGradebookTab() {
  const { section } = useOutletContext();
  const { data: gb, loading, error } = useApi(() => fetchGradebook(section.sectionId), [section.sectionId]);

  if (loading) return <Loader label="Loading gradebook…" />;
  if (error) return <Alert>{error}</Alert>;
  if (gb.students.length === 0) return <EmptyState title="No students in this section" />;

  return (
    <>
      {gb.assignments.length === 0 ? (
        <EmptyState title="No assignments yet">Grades appear here once assignments are graded.</EmptyState>
      ) : (
        <Grid
          title={`${TEACHING.sectionLabel} assignments`}
          assignments={gb.assignments}
          rows={gb.students}
          pick={(s) => s.results}
          averageKey="average"
        />
      )}
      {TEACHING.includeLabResults && gb.labAssignments.length > 0 && (
        <Grid
          title="Lab results (read-only)"
          note="Graded by lab teachers"
          assignments={gb.labAssignments}
          rows={gb.students}
          pick={(s) => s.labResults}
          averageKey="labAverage"
        />
      )}
    </>
  );
}
