// pages/course/CourseMaterialsTab.jsx — lecture, lab and course-wide materials the student may access.
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Download, FileText, Library } from 'lucide-react';
import { useApi } from '../../hooks/useApi.js';
import { downloadMaterial, fetchCourseMaterials } from '../../api/student.api.js';
import { formatDateTime, formatFileSize } from '../../utils/format.js';
import DataTable from '../../components/DataTable.jsx';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';
import EmptyState from '../../components/EmptyState.jsx';

const SCOPE = { lecture: 'Lecture', lab: 'Lab', course: 'Course' };

export default function CourseMaterialsTab() {
  const { course } = useOutletContext();
  const { data, loading, error } = useApi(() => fetchCourseMaterials(course.courseId), [course.courseId]);
  const [downloadError, setDownloadError] = useState('');

  if (loading) return <Loader label="Loading materials…" />;
  if (error) return <Alert>{error}</Alert>;
  if (data.length === 0) return <EmptyState icon={Library} title="No materials yet">Your teachers have not uploaded materials.</EmptyState>;

  const columns = [
    {
      key: 'title',
      header: 'Title',
      render: (m) => (
        <span className="material-title">
          <FileText size={16} aria-hidden="true" /> {m.title}
        </span>
      ),
    },
    { key: 'scope', header: 'For', render: (m) => SCOPE[m.scope] },
    { key: 'file', header: 'File', render: (m) => <span className="small">{m.originalFilename} · {formatFileSize(m.fileSize)}</span> },
    { key: 'uploaded', header: 'Uploaded', render: (m) => <span className="small">{formatDateTime(m.createdAt)} · {m.uploadedBy}</span> },
    {
      key: 'download',
      header: 'Download',
      render: (m) => (
        <button
          type="button"
          className="icon-button"
          aria-label={`Download ${m.title}`}
          onClick={() => (setDownloadError(''), downloadMaterial(m.materialId).catch((err) => setDownloadError(err.message)))}
        >
          <Download size={16} />
        </button>
      ),
    },
  ];

  return (
    <>
      {downloadError && <Alert>{downloadError}</Alert>}
      <DataTable columns={columns} rows={data} rowKey={(m) => m.materialId} />
    </>
  );
}
