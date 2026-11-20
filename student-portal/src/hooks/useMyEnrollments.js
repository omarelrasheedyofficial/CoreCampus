// hooks/useMyEnrollments.js — loads the student's enrollments (shared by Dashboard and My Courses).
import { useCallback, useEffect, useState } from 'react';
import { fetchMyEnrollments } from '../api/enrollments.api.js';

export function useMyEnrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setEnrollments(await fetchMyEnrollments());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { enrollments, loading, error, reload: load };
}

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * The semester to highlight: the one running today, otherwise the most recent one
 * the student is enrolled in. Semester dates arrive as 'YYYY-MM-DD' strings.
 */
export function pickCurrentSemester(enrollments) {
  const semesters = [...new Map(enrollments.map((e) => [e.semester.semesterId, e.semester])).values()];
  if (semesters.length === 0) return null;
  const today = todayIso();
  return (
    semesters.find((s) => s.startDate <= today && today <= s.endDate) ??
    semesters.sort((a, b) => b.startDate.localeCompare(a.startDate))[0]
  );
}
