// pages/AnnouncementsPage.jsx — course and lab announcements from all the student's courses.
import { Megaphone } from 'lucide-react';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { fetchAnnouncements } from '../api/student.api.js';
import PageHeader from '../components/PageHeader.jsx';
import AnnouncementItem from '../components/AnnouncementItem.jsx';
import Loader from '../components/Loader.jsx';
import Alert from '../components/Alert.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function AnnouncementsPage() {
  const { data, loading, error } = useApi(() => fetchAnnouncements());
  const { hash } = useLocation();

  useEffect(() => {
    if (!data || !/^#announcement-\d+$/.test(hash)) return;
    const announcement = document.getElementById(hash.slice(1));
    announcement?.scrollIntoView({ block: 'center' });
    announcement?.focus({ preventScroll: true });
  }, [data, hash]);

  return (
    <>
      <PageHeader title="Announcements" subtitle="News from your lecturers and lab teachers." />
      {loading && <Loader label="Loading announcements…" />}
      {error && <Alert>{error}</Alert>}
      {data && data.length === 0 && <EmptyState icon={Megaphone} title="No announcements yet" />}
      <div className="list">
        {data?.map((a) => (
          <AnnouncementItem key={a.announcementId} announcement={a} />
        ))}
      </div>
    </>
  );
}
