// SectionCard — one lecture section the lecturer teaches, linking to its student list.
import { Link } from 'react-router-dom';
import { FlaskConical, Users } from 'lucide-react';

export default function SectionCard({ section }) {
  const { sectionId, name, course, semester, studentCount, labSectionCount } = section;

  return (
    <article className="card course-card">
      <div className="course-card-top">
        <span className="course-code">{course.code}</span>
        <span className="muted small">Lecture {name}</span>
      </div>
      <h3 className="course-title">{course.title}</h3>
      <p className="muted small">{semester.name}</p>
      {course.description && <p className="course-description">{course.description}</p>}

      <ul className="course-sections">
        <li>
          <Users size={16} aria-hidden="true" />
          <span>
            {studentCount} enrolled student{studentCount === 1 ? '' : 's'}
          </span>
        </li>
        <li>
          <FlaskConical size={16} aria-hidden="true" />
          <span>
            {labSectionCount === 0 ? 'No lab sections' : `${labSectionCount} lab section${labSectionCount === 1 ? '' : 's'}`}
          </span>
        </li>
      </ul>

      <div className="card-actions">
        <Link className="button button-ghost button-small" to={`/sections/${sectionId}`}>
          Students
        </Link>
        <Link className="button button-ghost button-small" to={`/sections/${sectionId}/materials`}>
          Materials
        </Link>
      </div>
    </article>
  );
}
