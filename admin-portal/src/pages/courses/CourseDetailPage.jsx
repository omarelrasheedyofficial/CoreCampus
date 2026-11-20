// pages/courses/CourseDetailPage.jsx — one course: header + tabs (details, sections, enrollments).
// Tab pages get { course, setCourse } through the router outlet context.
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { fetchCourse } from '../../api/admin.api.js';
import PageHeader from '../../components/PageHeader.jsx';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setCourse(null);
    fetchCourse(courseId)
      .then((c) => !cancelled && setCourse(c))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  return (
    <>
      <Link to="/courses" className="link back-link">
        <ArrowLeft size={16} aria-hidden="true" /> Courses
      </Link>
      {error && <Alert>{error}</Alert>}
      {!course && !error && <Loader label="Loading course…" />}
      {course && (
        <>
          <PageHeader
            title={`${course.code} · ${course.title}`}
            subtitle={[
              course.semester.name,
              `Doctors: ${course.lecturerNames.join(', ') || 'none yet'}`,
              `TAs: ${course.labTeacherNames.join(', ') || 'none'}`,
            ].join(' · ')}
            actions={course.isArchived && <span className="badge badge-inactive">Archived</span>}
          />
          <nav className="tabs" aria-label="Course">
            <NavLink to="" end className="tab">
              Details
            </NavLink>
            <NavLink to="enrollments" className="tab">
              Enrollments
            </NavLink>
          </nav>
          <Outlet context={{ course, setCourse }} />
        </>
      )}
    </>
  );
}
