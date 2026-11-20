// pages/DashboardPage.jsx — student home: profile summary, current-semester courses, upcoming
// deadlines and the latest announcements. All data comes from the API (no placeholder content).
import { Link } from 'react-router-dom';
import { BookOpen, CalendarDays, ClipboardList, Library } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { pickCurrentSemester, useMyEnrollments } from '../hooks/useMyEnrollments.js';
import { useApi } from '../hooks/useApi.js';
import { fetchAnnouncements, fetchAssignments } from '../api/student.api.js';
import { formatDateTime, relativeTime, STATUS_LABELS } from '../utils/format.js';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import CourseCard from '../components/CourseCard.jsx';
import AnnouncementItem from '../components/AnnouncementItem.jsx';
import Loader from '../components/Loader.jsx';
import Alert from '../components/Alert.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function DashboardPage() {
  const { user } = useAuth();
  const { enrollments, loading, error } = useMyEnrollments();
  const assignments = useApi(() => fetchAssignments());
  const announcements = useApi(() => fetchAnnouncements());

  const firstName = user.fullName.split(' ')[0];
  const profile = user.studentProfile;
  const currentSemester = pickCurrentSemester(enrollments);
  const currentCourses = currentSemester
    ? enrollments.filter((e) => e.semester.semesterId === currentSemester.semesterId && e.status === 'active')
    : [];
  const upcoming = (assignments.data ?? []).filter((a) => a.canSubmit || (a.status === 'submitted' && new Date(a.dueAt) > new Date()));
  const toDo = upcoming.filter((a) => a.status === 'not_submitted');

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        subtitle={
          profile
            ? `${profile.major ?? 'Student'} · Year ${profile.academicYear ?? '–'} · ID ${profile.universityId}`
            : user.email
        }
      />

      {loading && <Loader label="Loading your courses…" />}
      {error && <Alert>{error}</Alert>}

      {!loading && !error && (
        <>
          <section className="stat-grid" aria-label="Summary">
            <StatCard icon={CalendarDays} label="Current semester" value={currentSemester?.name ?? '—'} />
            <StatCard icon={BookOpen} label="Courses this semester" value={currentCourses.length} />
            <StatCard icon={ClipboardList} label="Assignments to submit" value={assignments.data ? toDo.length : '…'} />
          </section>

          <section className="section">
            <div className="section-header">
              <h2>Upcoming deadlines</h2>
              <Link to="/assignments" className="link">
                All assignments
              </Link>
            </div>
            {assignments.error && <Alert>{assignments.error}</Alert>}
            {assignments.data && upcoming.length === 0 && <p className="muted">Nothing due.</p>}
            {upcoming.length > 0 && (
              <div className="table-wrap">
                <table className="table">
                  <tbody>
                    {upcoming.slice(0, 5).map((a) => (
                      <tr key={a.assignmentId}>
                        <td data-label="Assignment">
                          <strong>{a.title}</strong>
                          <div className="muted small">
                            {a.course.code} · {a.type === 'lab' ? 'Lab' : 'Lecture'}
                          </div>
                        </td>
                        <td data-label="Due">
                          {formatDateTime(a.dueAt)}
                          <div className="muted small">{relativeTime(a.dueAt)}</div>
                        </td>
                        <td data-label="Status">
                          <span className={`badge badge-${a.status}`}>{STATUS_LABELS[a.status]}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="section">
            <div className="section-header">
              <h2>{currentSemester ? `${currentSemester.name} courses` : 'My courses'}</h2>
              {enrollments.length > 0 && (
                <Link to="/courses" className="link">
                  View all courses
                </Link>
              )}
            </div>
            {currentCourses.length === 0 ? (
              <EmptyState icon={Library} title="No courses yet">
                You are not enrolled in any courses. Enrollment is managed by the university administration.
              </EmptyState>
            ) : (
              <div className="course-grid">
                {currentCourses.map((enrollment) => (
                  <CourseCard key={enrollment.enrollmentId} enrollment={enrollment} />
                ))}
              </div>
            )}
          </section>

          {announcements.data && announcements.data.length > 0 && (
            <section className="section">
              <div className="section-header">
                <h2>Latest announcements</h2>
                <Link to="/announcements" className="link">
                  All announcements
                </Link>
              </div>
              <div className="list">
                {announcements.data.slice(0, 3).map((a) => (
                  <AnnouncementItem key={a.announcementId} announcement={a} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
