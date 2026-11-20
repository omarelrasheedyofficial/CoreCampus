// SectionCard — one lab section the lab teacher runs, linking to its students and materials.
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';

export default function SectionCard({ section }) {
  const { sectionId, name, course, semester, studentCount } = section;

  return (
    <article className="card course-card">
      <div className="course-card-top">
        <span className="course-code">{course.code}</span>
        <span className="muted small">{name}</span>
      </div>
      <h3 className="course-title">{course.title}</h3>
      <p className="muted small">{semester.name}</p>
      {course.description && <p className="course-description">{course.description}</p>}

      <ul className="course-sections">
        <li>
          <Users size={16} aria-hidden="true" />
          <span>
            {studentCount} assigned student{studentCount === 1 ? '' : 's'}
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
