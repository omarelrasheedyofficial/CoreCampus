// pages/DashboardPage.jsx — administrator overview of users and academic structure.
import { Link } from 'react-router-dom';
import { AlertTriangle, BookOpen, CalendarDays, ClipboardList, GraduationCap, UserCheck, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { fetchSummary } from '../api/admin.api.js';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import Loader from '../components/Loader.jsx';
import Alert from '../components/Alert.jsx';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: s, loading, error } = useApi(fetchSummary);
  const unassigned = s ? s.unassignedLectureSections + s.unassignedLabSections : 0;

  return (
    <>
      <PageHeader title={`Welcome, ${user.fullName}`} subtitle="University administration overview" />

      {loading && <Loader label="Loading overview…" />}
      {error && <Alert>{error}</Alert>}

      {s && (
        <>
          <section className="stat-grid" aria-label="Users">
            <StatCard icon={UserCheck} label={`Active users (${s.inactiveUsers} inactive)`} value={s.activeUsers} />
            <StatCard icon={GraduationCap} label="Students" value={s.students} />
            <StatCard icon={Users} label="Lecturers / Lab teachers" value={`${s.lecturers} / ${s.labTeachers}`} />
          </section>
          <section className="stat-grid section" aria-label="Academic structure">
            <StatCard icon={CalendarDays} label="Semesters" value={s.semesters} />
            <StatCard icon={BookOpen} label="Active courses" value={s.courses} />
            <StatCard icon={ClipboardList} label="Active enrollments" value={s.activeEnrollments} />
          </section>

          {unassigned > 0 && (
            <div className="section">
              <Alert variant="info">
                <AlertTriangle size={16} aria-hidden="true" /> {s.unassignedLectureSections} lecture section(s) and{' '}
                {s.unassignedLabSections} lab section(s) have no assigned teacher.{' '}
                <Link to="/courses" className="link">
                  Review courses
                </Link>
              </Alert>
            </div>
          )}
        </>
      )}
    </>
  );
}
