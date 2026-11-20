// pages/course/CourseAssignmentsTab.jsx — the course's lecture and lab assignments for the student.
import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { fetchAssignments } from '../../api/student.api.js';
import AssignmentCard from '../../components/AssignmentCard.jsx';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';
import EmptyState from '../../components/EmptyState.jsx';

export default function CourseAssignmentsTab() {
  const { course } = useOutletContext();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAssignments(course.courseId).then(setItems).catch((err) => setError(err.message));
  }, [course.courseId]);

  if (error) return <Alert>{error}</Alert>;
  if (!items) return <Loader label="Loading assignments…" />;
  if (items.length === 0) return <EmptyState icon={ClipboardList} title="No assignments yet" />;

  return (
    <div className="list">
      {items.map((a) => (
        <AssignmentCard
          key={a.assignmentId}
          assignment={a}
          showCourse={false}
          onUpdated={(updated) => setItems((rows) => rows.map((r) => (r.assignmentId === updated.assignmentId ? updated : r)))}
        />
      ))}
    </div>
  );
}
