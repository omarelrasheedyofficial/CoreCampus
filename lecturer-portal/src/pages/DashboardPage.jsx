// pages/DashboardPage.jsx — lecturer home: staff profile + current-semester teaching load.
import { Link } from 'react-router-dom';
import { BookOpen, CalendarDays, Library, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { fetchMySections } from '../api/lectureSections.api.js';
import { pickCurrentSemester } from '../utils/semesters.js';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import SectionCard from '../components/SectionCard.jsx';
import Loader from '../components/Loader.jsx';
import Alert from '../components/Alert.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: sections, loading, error } = useApi(fetchMySections);

  const profile = user.staffProfile;
  const all = sections ?? [];
  const currentSemester = pickCurrentSemester(all);
  const current = currentSemester ? all.filter((s) => s.semester.semesterId === currentSemester.semesterId) : [];
  const studentTotal = current.reduce((sum, s) => sum + s.studentCount, 0);

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.fullName}`}
        subtitle={profile ? [profile.academicTitle, profile.department].filter(Boolean).join(' · ') : user.email}
      />

      {loading && <Loader label="Loading your teaching load…" />}
      {error && <Alert>{error}</Alert>}

      {!loading && !error && (
        <>
          <section className="stat-grid" aria-label="Summary">
            <StatCard icon={CalendarDays} label="Current semester" value={currentSemester?.name ?? '—'} />
            <StatCard icon={BookOpen} label="Lecture sections" value={current.length} />
            <StatCard icon={Users} label="Enrolled students" value={studentTotal} />
          </section>

          <section className="section">
            <div className="section-header">
              <h2>{currentSemester ? `${currentSemester.name} sections` : 'My sections'}</h2>
              {all.length > 0 && (
                <Link to="/courses" className="link">
                  View all courses
                </Link>
              )}
            </div>

            {current.length === 0 ? (
              <EmptyState icon={Library} title="No assigned sections">
                You are not assigned to any lecture sections. Assignments are made by the administration.
              </EmptyState>
            ) : (
              <div className="course-grid">
                {current.map((section) => (
                  <SectionCard key={section.sectionId} section={section} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
