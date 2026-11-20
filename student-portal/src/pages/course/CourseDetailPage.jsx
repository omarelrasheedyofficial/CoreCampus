// pages/course/CourseDetailPage.jsx — one enrolled course: teachers, sections and tabs for
// materials, assignments and announcements. Not-enrolled courses return 404 from the API.
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import { ArrowLeft, FlaskConical, Presentation } from 'lucide-react';
import { useApi } from '../../hooks/useApi.js';
import { fetchCourse } from '../../api/student.api.js';
import PageHeader from '../../components/PageHeader.jsx';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const { data: course, loading, error } = useApi(() => fetchCourse(courseId), [courseId]);

  return (
    <>
      <Link to="/courses" className="link back-link">
        <ArrowLeft size={16} aria-hidden="true" /> My Courses
      </Link>
      {loading && <Loader label="Loading course…" />}
      {error && <Alert>{error}</Alert>}
      {course && (
        <>
          <PageHeader
            title={`${course.code} · ${course.title}`}
            subtitle={course.semester.name}
            actions={course.enrollmentStatus !== 'active' && <span className="badge badge-completed">{course.enrollmentStatus}</span>}
          />
          {course.description && <p className="muted course-intro">{course.description}</p>}
          <ul className="course-sections card">
            <li>
              <Presentation size={16} aria-hidden="true" />
              <span>
                Lecture {course.lectureSection.name} · {course.lectureSection.lecturerName ?? 'Lecturer not assigned'}
                {course.lectureSection.lecturerEmail && <span className="muted"> · {course.lectureSection.lecturerEmail}</span>}
              </span>
            </li>
            <li>
              <FlaskConical size={16} aria-hidden="true" />
              <span>
                {course.labSection
                  ? `${course.labSection.name} · ${course.labSection.labTeacherName ?? 'Lab teacher not assigned'}`
                  : 'No lab section'}
                {course.labSection?.labTeacherEmail && <span className="muted"> · {course.labSection.labTeacherEmail}</span>}
              </span>
            </li>
          </ul>
          <nav className="tabs section" aria-label="Course">
            <NavLink to="" end className="tab">
              Materials
            </NavLink>
            <NavLink to="assignments" className="tab">
              Assignments
            </NavLink>
            <NavLink to="announcements" className="tab">
              Announcements
            </NavLink>
          </nav>
          <Outlet context={{ course }} />
        </>
      )}
    </>
  );
}
