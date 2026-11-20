// pages/CoursesPage.jsx — all of the student's enrolled courses, grouped by semester.
import { Library } from 'lucide-react';
import { useMyEnrollments } from '../hooks/useMyEnrollments.js';
import PageHeader from '../components/PageHeader.jsx';
import CourseCard from '../components/CourseCard.jsx';
import Loader from '../components/Loader.jsx';
import Alert from '../components/Alert.jsx';
import EmptyState from '../components/EmptyState.jsx';

function groupBySemester(enrollments) {
  const groups = new Map();
  for (const e of enrollments) {
    const key = e.semester.semesterId;
    if (!groups.has(key)) groups.set(key, { semester: e.semester, items: [] });
    groups.get(key).items.push(e);
  }
  // API already orders by semester start date (newest first)
  return [...groups.values()];
}

export default function CoursesPage() {
  const { enrollments, loading, error } = useMyEnrollments();

  return (
    <>
      <PageHeader title="My Courses" subtitle="Courses you are enrolled in, by semester." />

      {loading && <Loader label="Loading your courses…" />}
      {error && <Alert>{error}</Alert>}

      {!loading && !error && enrollments.length === 0 && (
        <EmptyState icon={Library} title="No courses yet">
          You are not enrolled in any courses. Enrollment is managed by the university administration.
        </EmptyState>
      )}

      {!loading &&
        !error &&
        groupBySemester(enrollments).map(({ semester, items }) => (
          <section className="section" key={semester.semesterId}>
            <div className="section-header">
              <h2>{semester.name}</h2>
              <span className="muted small">
                {items.length} course{items.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="course-grid">
              {items.map((enrollment) => (
                <CourseCard key={enrollment.enrollmentId} enrollment={enrollment} />
              ))}
            </div>
          </section>
        ))}
    </>
  );
}
