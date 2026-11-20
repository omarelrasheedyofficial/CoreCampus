// pages/section/SectionStudentsTab.jsx — students enrolled in the section, with search.
import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useApi } from '../../hooks/useApi.js';
import { fetchSectionStudents } from '../../api/lectureSections.api.js';
import DataTable from '../../components/DataTable.jsx';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

const COLUMNS = [
  { key: 'fullName', header: 'Student' },
  { key: 'universityId', header: 'University ID' },
  { key: 'email', header: 'Email' },
  { key: 'major', header: 'Major' },
  { key: 'academicYear', header: 'Year' },
  { key: 'labSectionName', header: 'Lab section', render: (s) => s.labSectionName ?? 'None' },
  {
    key: 'status',
    header: 'Status',
    render: (s) => <span className={`badge badge-${s.status}`}>{s.status}</span>,
  },
];

export default function SectionStudentsTab() {
  const { section } = useOutletContext();
  const [filter, setFilter] = useState('');
  const { data, loading, error } = useApi(() => fetchSectionStudents(section.sectionId), [section.sectionId]);
  const students = data ?? [];

  const visible = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return students;
    return students.filter((s) =>
      [s.fullName, s.universityId, s.email].some((v) => v?.toLowerCase().includes(term)),
    );
  }, [students, filter]);

  if (loading) return <Loader label="Loading students…" />;
  if (error) return <Alert>{error}</Alert>;

  return (
    <>
      <div className="toolbar">
        <label className="search-field">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search by name, ID or email"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Search students"
            maxLength={100}
          />
        </label>
        <span className="muted small toolbar-count">{students.length} enrolled</span>
      </div>

      <DataTable
        columns={COLUMNS}
        rows={visible}
        rowKey={(s) => s.enrollmentId}
        emptyMessage={students.length === 0 ? 'No students are enrolled in this section.' : 'No students match your search.'}
      />
    </>
  );
}
