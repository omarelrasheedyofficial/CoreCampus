// pages/course/CourseAnnouncementsTab.jsx — announcements of one course for the student.
import { useOutletContext } from 'react-router-dom';
import { Megaphone } from 'lucide-react';
import { useApi } from '../../hooks/useApi.js';
import { fetchAnnouncements } from '../../api/student.api.js';
import AnnouncementItem from '../../components/AnnouncementItem.jsx';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';
import EmptyState from '../../components/EmptyState.jsx';

export default function CourseAnnouncementsTab() {
  const { course } = useOutletContext();
  const { data, loading, error } = useApi(() => fetchAnnouncements(course.courseId), [course.courseId]);

  if (loading) return <Loader label="Loading announcements…" />;
  if (error) return <Alert>{error}</Alert>;
  if (data.length === 0) return <EmptyState icon={Megaphone} title="No announcements yet" />;

  return (
    <div className="list">
      {data.map((a) => (
        <AnnouncementItem key={a.announcementId} announcement={a} showCourse={false} />
      ))}
    </div>
  );
}
