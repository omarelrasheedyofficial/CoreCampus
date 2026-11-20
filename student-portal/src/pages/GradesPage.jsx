// pages/GradesPage.jsx — the student's own grades and teacher feedback, grouped by course
// (doc §2.2.1: view personal grades and feedback; never other students').
import { Link } from 'react-router-dom';
import { Award } from 'lucide-react';
import { useApi } from '../hooks/useApi.js';
import { fetchAssignments } from '../api/student.api.js';
import { formatDateTime, STATUS_LABELS } from '../utils/format.js';
import PageHeader from '../components/PageHeader.jsx';
import Loader from '../components/Loader.jsx';
import Alert from '../components/Alert.jsx';
import EmptyState from '../components/EmptyState.jsx';

function average(items) {
  const grades = items.filter((a) => a.submission?.grade != null).map((a) => a.submission.grade);
  return grades.length ? Math.round((grades.reduce((x, y) => x + y, 0) / grades.length) * 100) / 100 : null;
}

export default function GradesPage() {
  const { data, loading, error } = useApi(fetchAssignments);

  if (loading) return <Loader label="Loading grades…" />;
  if (error) return <Alert>{error}</Alert>;

  const byCourse = new Map();
  for (const a of data) {
    if (!byCourse.has(a.course.courseId)) byCourse.set(a.course.courseId, { course: a.course, items: [] });
    byCourse.get(a.course.courseId).items.push(a);
  }

  return (
    <>
      <PageHeader title="Grades & Feedback" subtitle="Your results for lecture and lab assignments." />
      {byCourse.size === 0 && <EmptyState icon={Award} title="No assignments yet" />}
      {[...byCourse.values()].map(({ course, items }) => {
        const lecture = average(items.filter((a) => a.type === 'lecture'));
        const lab = average(items.filter((a) => a.type === 'lab'));
        return (
          <section className="section" key={course.courseId}>
            <div className="section-header">
              <h2>
                <Link className="link" to={`/courses/${course.courseId}`}>
                  {course.code}
                </Link>{' '}
                · {course.title}
              </h2>
              <span className="muted small">
                Lecture average: {lecture ?? '—'} · Lab average: {lab ?? '—'}
              </span>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Assignment</th>
                    <th scope="col">Type</th>
                    <th scope="col">Status</th>
                    <th scope="col">Grade</th>
                    <th scope="col">Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((a) => (
                    <tr key={a.assignmentId}>
                      <td data-label="Assignment">
                        <strong>{a.title}</strong>
                        <div className="muted small">Due {formatDateTime(a.dueAt)}</div>
                      </td>
                      <td data-label="Type">{a.type === 'lab' ? 'Lab' : 'Lecture'}</td>
                      <td data-label="Status">
                        <span className={`badge badge-${a.status}`}>{STATUS_LABELS[a.status]}</span>
                      </td>
                      <td data-label="Grade">{a.submission?.grade != null ? <span className="grade-big">{a.submission.grade}</span> : '—'}</td>
                      <td data-label="Feedback" className="pre-wrap">
                        {a.submission?.feedback ?? <span className="muted">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </>
  );
}
