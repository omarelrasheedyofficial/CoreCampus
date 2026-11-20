// pages/CoursesPage.jsx — every lecture section assigned to the lecturer, grouped by semester.
import { Library } from 'lucide-react';
import { useApi } from '../hooks/useApi.js';
import { fetchMySections } from '../api/lectureSections.api.js';
import { groupBySemester } from '../utils/semesters.js';
import PageHeader from '../components/PageHeader.jsx';
import SectionCard from '../components/SectionCard.jsx';
import Loader from '../components/Loader.jsx';
import Alert from '../components/Alert.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function CoursesPage() {
  const { data: sections, loading, error } = useApi(fetchMySections);

  return (
    <>
      <PageHeader title="My Courses" subtitle="Lecture sections assigned to you, by semester." />

      {loading && <Loader label="Loading your courses…" />}
      {error && <Alert>{error}</Alert>}

      {!loading && !error && sections.length === 0 && (
        <EmptyState icon={Library} title="No assigned sections">
          You are not assigned to any lecture sections. Assignments are made by the administration.
        </EmptyState>
      )}

      {!loading &&
        !error &&
        groupBySemester(sections).map(({ semester, items }) => (
          <section className="section" key={semester.semesterId}>
            <div className="section-header">
              <h2>{semester.name}</h2>
              <span className="muted small">
                {items.length} section{items.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="course-grid">
              {items.map((section) => (
                <SectionCard key={section.sectionId} section={section} />
              ))}
            </div>
          </section>
        ))}
    </>
  );
}
