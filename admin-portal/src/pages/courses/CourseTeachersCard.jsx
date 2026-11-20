// pages/courses/CourseTeachersCard.jsx — the course's "Doctors" and "Teacher assistants" lists.
// A course can have any number of each. Behind the scenes every doctor has a lecture group and
// every TA a lab group in the course; each student is placed with one doctor and optionally one TA.
import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { createSection, deleteSection, fetchStaff } from '../../api/admin.api.js';
import Alert from '../../components/Alert.jsx';

function StaffList({ course, kind, title, hint, addLabel, people, candidates, onChanged }) {
  const [staffId, setStaffId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Only offer people who are not already teaching this course.
  const taken = new Set(people.map((p) => p.staffId));
  const available = candidates?.filter((s) => !taken.has(s.staffId));

  async function run(fn) {
    setError('');
    setBusy(true);
    try {
      await fn();
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function handleAdd(event) {
    event.preventDefault();
    if (!staffId) return setError(`Choose the ${addLabel.toLowerCase()} to add.`);
    run(async () => {
      await createSection(course.courseId, kind, { staffId: Number(staffId) });
      setStaffId('');
    });
  }

  function handleRemove(person) {
    if (!window.confirm(`Remove ${person.staffName} from this course?`)) return;
    run(() => deleteSection(kind, person.sectionId));
  }

  return (
    <section className="card form-card">
      <div className="section-header">
        <h3>{title}</h3>
        <span className="muted small">{people.length}</span>
      </div>
      <p className="muted small">{hint}</p>
      {error && <Alert>{error}</Alert>}

      {people.length === 0 ? (
        <p className="muted">None yet.</p>
      ) : (
        <ul className="staff-list">
          {people.map((p) => (
            <li key={p.sectionId}>
              <span>
                <strong>{p.staffName ?? p.name}</strong>
                <span className="muted small"> · {p.studentCount} student{p.studentCount === 1 ? '' : 's'}</span>
              </span>
              {!course.isArchived && (
                <button
                  type="button"
                  className="icon-button icon-button-danger"
                  aria-label={`Remove ${p.staffName ?? p.name}`}
                  disabled={busy}
                  onClick={() => handleRemove(p)}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!course.isArchived && (
        <form className="inline-add" onSubmit={handleAdd}>
          <select className="select" value={staffId} onChange={(e) => setStaffId(e.target.value)} aria-label={`Add ${addLabel}`}>
            <option value="">{available ? `Choose a ${addLabel.toLowerCase()}…` : 'Loading…'}</option>
            {available?.map((s) => (
              <option key={s.staffId} value={s.staffId}>
                {s.fullName}
              </option>
            ))}
          </select>
          <button type="submit" className="button button-ghost" disabled={busy}>
            Add {addLabel.toLowerCase()}
          </button>
        </form>
      )}
    </section>
  );
}

export default function CourseTeachersCard({ course, sections, onChanged }) {
  const [staff, setStaff] = useState(null); // { lecturers, labTeachers }
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([fetchStaff('lecturer'), fetchStaff('lab_teacher')])
      .then(([lecturers, labTeachers]) => setStaff({ lecturers, labTeachers }))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <>
      {error && <Alert>{error}</Alert>}
      <div className="form-grid">
        <StaffList
          course={course}
          kind="lecture"
          title="Doctors"
          hint="Professors who teach this course. Each student is taught by one of them."
          addLabel="Doctor"
          people={sections.lectureSections}
          candidates={staff?.lecturers}
          onChanged={onChanged}
        />
        <StaffList
          course={course}
          kind="lab"
          title="Teacher assistants"
          hint="Lab TAs for this course. A student can have one TA, or none."
          addLabel="TA"
          people={sections.labSections}
          candidates={staff?.labTeachers}
          onChanged={onChanged}
        />
      </div>
    </>
  );
}
