// pages/courses/CourseEnrollmentsTab.jsx — everything about who is in a course:
//   1. Doctors and teacher assistants (any number of each) — CourseTeachersCard
//   2. Enroll a student with their doctor and (optional) TA
//   3. Enrolled students: move between doctors / TAs, change status (active / dropped / completed)
// Behind the scenes a doctor is a lecture section and a TA a lab section of the course.
import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search } from 'lucide-react';
import { enrollStudent, fetchCourse, fetchCourseSections, fetchEnrollments, searchStudents, updateEnrollment } from '../../api/admin.api.js';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';
import CourseTeachersCard from './CourseTeachersCard.jsx';

const STATUSES = ['active', 'dropped', 'completed'];

/** Doctor or TA picker. Values are section ids; options show the teacher's name. */
function TeacherSelect({ sections, value, onChange, label, noneLabel }) {
  return (
    <select className="select" value={value ?? ''} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)} aria-label={label}>
      {noneLabel ? <option value="">{noneLabel}</option> : <option value="" disabled>Choose…</option>}
      {sections.map((s) => (
        <option key={s.sectionId} value={s.sectionId}>
          {s.staffName ?? s.name}
        </option>
      ))}
    </select>
  );
}

function EnrollmentRow({ enrollment, sections, onSaved, onError }) {
  const [draft, setDraft] = useState({
    lectureSectionId: enrollment.lectureSection.sectionId,
    labSectionId: enrollment.labSection?.sectionId ?? null,
    status: enrollment.status,
  });
  const [busy, setBusy] = useState(false);
  const dirty =
    draft.lectureSectionId !== enrollment.lectureSection.sectionId ||
    draft.labSectionId !== (enrollment.labSection?.sectionId ?? null) ||
    draft.status !== enrollment.status;

  async function save() {
    if (draft.status === 'dropped' && enrollment.status !== 'dropped' &&
        !window.confirm(`Remove ${enrollment.student.fullName} from this course? The record is kept as "dropped".`)) return;
    onError('');
    setBusy(true);
    try {
      await onSaved(await updateEnrollment(enrollment.enrollmentId, draft));
    } catch (err) {
      onError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr className={enrollment.status === 'dropped' ? 'row-muted' : ''}>
      <td data-label="Student">
        <strong>{enrollment.student.fullName}</strong>
        <div className="muted small">{enrollment.student.universityId}</div>
      </td>
      <td data-label="Doctor">
        <TeacherSelect sections={sections.lectureSections} value={draft.lectureSectionId} onChange={(v) => setDraft({ ...draft, lectureSectionId: v })} label="Doctor" />
      </td>
      <td data-label="TA">
        <TeacherSelect sections={sections.labSections} value={draft.labSectionId} onChange={(v) => setDraft({ ...draft, labSectionId: v })} label="TA" noneLabel="No TA" />
      </td>
      <td data-label="Status">
        <select className="select" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })} aria-label="Status">
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </td>
      <td data-label="Actions">
        <button type="button" className="button button-primary button-small" disabled={busy || !dirty} onClick={save}>
          Save
        </button>
      </td>
    </tr>
  );
}

export default function CourseEnrollmentsTab() {
  const { course, setCourse } = useOutletContext();
  const [sections, setSections] = useState({ lectureSections: [], labSections: [] });
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [chosen, setChosen] = useState(null);
  const [newDoctor, setNewDoctor] = useState(null);
  const [newTa, setNewTa] = useState(null);
  const [busy, setBusy] = useState(false);

  // When the course has exactly one doctor / TA, pick it for new students; otherwise keep the
  // admin's current choice if it still exists.
  function applyDefaults(s) {
    const keep = (list, current) => (list.length === 1 ? list[0].sectionId : list.some((x) => x.sectionId === current) ? current : null);
    setNewDoctor((cur) => keep(s.lectureSections, cur));
    setNewTa((cur) => keep(s.labSections, cur));
  }

  const loadSections = () =>
    fetchCourseSections(course.courseId).then((s) => {
      setSections(s);
      applyDefaults(s);
    });

  useEffect(() => {
    Promise.all([loadSections(), fetchEnrollments(course.courseId).then(setEnrollments)])
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.courseId]);

  // Doctors / TAs changed: refresh the lists, student counts and the page header names.
  const handleTeachersChanged = () => Promise.all([loadSections(), fetchCourse(course.courseId).then(setCourse)]);

  // Debounced student search
  useEffect(() => {
    const term = search.trim();
    if (term.length < 2 || chosen) return setResults([]);
    let cancelled = false;
    const timer = setTimeout(() => {
      searchStudents(term)
        .then((rows) => !cancelled && setResults(rows))
        .catch((err) => !cancelled && setError(err.message));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, chosen]);

  async function handleEnroll(event) {
    event.preventDefault();
    if (!chosen) return setError('Search for and choose a student.');
    if (!newDoctor) return setError("Choose the student's doctor.");
    setError('');
    setNotice('');
    setBusy(true);
    try {
      const enrollment = await enrollStudent(course.courseId, {
        studentId: chosen.studentId,
        lectureSectionId: newDoctor,
        labSectionId: newTa,
      });
      setEnrollments((rows) => [enrollment, ...rows.filter((r) => r.enrollmentId !== enrollment.enrollmentId)]);
      setNotice(`Enrolled ${enrollment.student.fullName}.`);
      setChosen(null);
      setSearch('');
      loadSections(); // student counts per doctor / TA
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Loader label="Loading enrollments…" />;

  const active = enrollments.filter((e) => e.status === 'active').length;
  const noDoctor = sections.lectureSections.length === 0;

  return (
    <>
      <CourseTeachersCard course={course} sections={sections} onChanged={handleTeachersChanged} />

      {!course.isArchived && noDoctor && <Alert variant="info">Add at least one doctor above, then you can enroll students.</Alert>}

      {!course.isArchived && !noDoctor && (
        <form className="card form-card" onSubmit={handleEnroll} noValidate>
          <h3>Enroll a student</h3>
          <div className="form-row form-row-4">
            <div className="field student-picker">
              <span>Student</span>
              {chosen ? (
                <div className="chosen">
                  <span>
                    {chosen.fullName} <span className="muted">· {chosen.universityId}</span>
                  </span>
                  <button type="button" className="link-button" onClick={() => setChosen(null)}>
                    Change
                  </button>
                </div>
              ) : (
                <label className="search-field">
                  <Search size={16} aria-hidden="true" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, university ID or email" aria-label="Search students" maxLength={100} />
                </label>
              )}
              {!chosen && results.length > 0 && (
                <ul className="picker-results" role="listbox">
                  {results.map((s) => (
                    <li key={s.studentId}>
                      <button type="button" onClick={() => (setChosen(s), setResults([]), setError(''))}>
                        {s.fullName} <span className="muted small">· {s.universityId} · {s.email}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <label className="field">
              <span>Doctor *</span>
              <TeacherSelect sections={sections.lectureSections} value={newDoctor} onChange={setNewDoctor} label="New student's doctor" />
            </label>
            <label className="field">
              <span>TA</span>
              <TeacherSelect sections={sections.labSections} value={newTa} onChange={setNewTa} label="New student's TA" noneLabel="No TA" />
            </label>
            <div className="field-actions">
              <button type="submit" className="button button-primary" disabled={busy}>
                Enroll
              </button>
            </div>
          </div>
        </form>
      )}

      {notice && <Alert variant="info">{notice}</Alert>}
      {error && <Alert>{error}</Alert>}

      <div className="section-header">
        <h2>Enrolled students</h2>
        <span className="muted small">{active} active · {enrollments.length} records</span>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Student</th>
              <th scope="col">Doctor</th>
              <th scope="col">TA</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((e) => (
              <EnrollmentRow
                key={`${e.enrollmentId}-${e.status}-${e.lectureSection.sectionId}-${e.labSection?.sectionId}`}
                enrollment={e}
                sections={sections}
                onError={setError}
                onSaved={async (updated) => {
                  setEnrollments((rows) => rows.map((r) => (r.enrollmentId === updated.enrollmentId ? updated : r)));
                  setNotice(`Updated ${updated.student.fullName}.`);
                  await loadSections(); // student counts per doctor / TA
                }}
              />
            ))}
            {enrollments.length === 0 && (
              <tr>
                <td colSpan={5} className="table-empty">
                  No students enrolled yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
