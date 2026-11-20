import { Link, NavLink, Outlet, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useApi } from '../hooks/useApi.js';
import { fetchSection } from '../api/labSections.api.js';
import PageHeader from '../components/PageHeader.jsx';
import Loader from '../components/Loader.jsx';
import Alert from '../components/Alert.jsx';

export default function SectionPage() {
  const { sectionId } = useParams();
  const { data: section, loading, error } = useApi(() => fetchSection(sectionId), [sectionId]);

  return (
    <>
      <Link to="/courses" className="link back-link">
        <ArrowLeft size={16} aria-hidden="true" /> My Lab Sections
      </Link>

      {loading && <Loader label="Loading section…" />}
      {error && <Alert>{error}</Alert>}

      {!loading && !error && section && (
        <>
          <PageHeader
            title={`${section.course.code} · ${section.course.title}`}
            subtitle={`${section.name} · ${section.semester.name}`}
          />
          <nav className="tabs" aria-label="Section">
            <NavLink to="" end className="tab">
              Students
            </NavLink>
            <NavLink to="materials" className="tab">
              Materials
            </NavLink>
            <NavLink to="assignments" className="tab">
              Assignments
            </NavLink>
            <NavLink to="announcements" className="tab">
              Announcements
            </NavLink>
            <NavLink to="gradebook" className="tab">
              Gradebook
            </NavLink>
          </nav>
          <Outlet context={{ section }} />
        </>
      )}
    </>
  );
}
