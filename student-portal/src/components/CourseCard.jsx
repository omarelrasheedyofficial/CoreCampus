// CourseCard — one enrolled course with its lecture/lab sections and teaching staff.
import { Link } from 'react-router-dom';
import { FlaskConical, Presentation } from 'lucide-react';

export default function CourseCard({ enrollment }) {
  const { course, semester, lectureSection, labSection, status } = enrollment;

  return (
    <article className="card course-card">
      <div className="course-card-top">
        <span className="course-code">{course.code}</span>
        {status !== 'active' && <span className={`badge badge-${status}`}>{status}</span>}
      </div>
      <h3>
        <Link className="course-title" to={`/courses/${course.courseId}`}>
          {course.title}
        </Link>
      </h3>
      <p className="muted small">{semester.name}</p>
      {course.description && <p className="course-description">{course.description}</p>}

      <ul className="course-sections">
        <li>
          <Presentation size={16} aria-hidden="true" />
          <span>
            Lecture {lectureSection.name} · {lectureSection.lecturerName ?? 'Lecturer not assigned'}
          </span>
        </li>
        <li>
          <FlaskConical size={16} aria-hidden="true" />
          <span>
            {labSection
              ? `Lab ${labSection.name.replace(/^Lab\s+/i, '')} · ${labSection.labTeacherName ?? 'Lab teacher not assigned'}`
              : 'No lab section'}
          </span>
        </li>
      </ul>
    </article>
  );
}
