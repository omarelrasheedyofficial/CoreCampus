// pages/courses/CoursesPage.jsx — course list per semester, and course creation.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createCourse, fetchCourses, fetchSemesters } from '../../api/admin.api.js';
import PageHeader from '../../components/PageHeader.jsx';
import DataTable from '../../components/DataTable.jsx';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

const COLUMNS = [
  {
    key: 'code',
    header: 'Code',
    render: (c) => (
      <Link className="link" to={`/courses/${c.courseId}`}>
        {c.code}
      </Link>
    ),
  },
  { key: 'title', header: 'Title' },
  {
    key: 'staff',
    header: 'Doctors / TAs',
    render: (c) => (
      <>
        <div>{c.lecturerNames.join(', ') || <span className="muted">No doctor yet</span>}</div>
        <div className="muted small">{c.labTeacherNames.join(', ') || 'No TA'}</div>
      </>
    ),
  },
  { key: 'activeEnrollments', header: 'Students' },
  {
    key: 'status',
    header: 'Status',
    render: (c) => <span className={`badge ${c.isArchived ? 'badge-inactive' : 'badge-active'}`}>{c.isArchived ? 'Archived' : 'Active'}</span>,
  },
];

const EMPTY = { code: '', title: '', description: '' };

export default function CoursesPage() {
  const [semesters, setSemesters] = useState([]);
  const [semesterId, setSemesterId] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSemesters()
      .then((rows) => {
        setSemesters(rows);
        if (rows[0]) setSemesterId(String(rows[0].semesterId)); // newest semester first
        else setLoading(false);
      })
      .catch((err) => (setError(err.message), setLoading(false)));
  }, []);

  useEffect(() => {
    if (!semesterId) return;
    let cancelled = false;
    setLoading(true);
    fetchCourses({ semesterId, includeArchived: includeArchived ? 'true' : undefined })
      .then((rows) => !cancelled && setCourses(rows))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [semesterId, includeArchived]);

  async function handleCreate(event) {
    event.preventDefault();
    if (!form.code.trim() || !form.title.trim()) return setError('Course code and title are required.');
    setError('');
    setNotice('');
    setSaving(true);
    try {
      const course = await createCourse({ ...form, semesterId: Number(semesterId) });
      setCourses((rows) => [...rows, course].sort((a, b) => a.code.localeCompare(b.code)));
      setForm(EMPTY);
      setShowForm(false);
      setNotice(`Created ${course.code} – ${course.title}. Open it and use the Enrollments tab to add its doctors, TAs and students.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const semesterName = semesters.find((s) => String(s.semesterId) === semesterId)?.name;

  return (
    <>
      <PageHeader
        title="Courses"
        subtitle="Courses per semester. Open a course to add its doctors, TAs and students."
        actions={
          semesterId && (
            <button type="button" className="button button-primary" onClick={() => setShowForm((v) => !v)}>
              {showForm ? 'Close' : 'New course'}
            </button>
          )
        }
      />

      {semesters.length === 0 && !loading && <Alert variant="info">Create a semester first, then add its courses.</Alert>}

      {semesters.length > 0 && (
        <div className="toolbar">
          <select className="select" value={semesterId} onChange={(e) => setSemesterId(e.target.value)} aria-label="Semester">
            {semesters.map((s) => (
              <option key={s.semesterId} value={s.semesterId}>
                {s.name}
              </option>
            ))}
          </select>
          <label className="checkbox">
            <input type="checkbox" checked={includeArchived} onChange={(e) => setIncludeArchived(e.target.checked)} />
            <span>Show archived</span>
          </label>
        </div>
      )}

      {showForm && (
        <form className="card form-card" onSubmit={handleCreate} noValidate>
          <h3>New course in {semesterName}</h3>
          <div className="form-grid">
            <label className="field">
              <span>Course code *</span>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} maxLength={20} placeholder="e.g. CS401" />
            </label>
            <label className="field">
              <span>Title *</span>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={200} />
            </label>
          </div>
          <label className="field">
            <span>Description</span>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={2000} />
          </label>
          <div className="form-actions">
            <button type="submit" className="button button-primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create course'}
            </button>
          </div>
        </form>
      )}

      {notice && <Alert variant="info">{notice}</Alert>}
      {error && <Alert>{error}</Alert>}
      {loading ? (
        <Loader label="Loading courses…" />
      ) : (
        semesterId && <DataTable columns={COLUMNS} rows={courses} rowKey={(c) => c.courseId} emptyMessage="No courses in this semester yet." />
      )}
    </>
  );
}
