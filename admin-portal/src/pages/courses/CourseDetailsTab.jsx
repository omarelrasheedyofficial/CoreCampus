// pages/courses/CourseDetailsTab.jsx — edit course code, title, description and archive state.
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { updateCourse } from '../../api/admin.api.js';
import Alert from '../../components/Alert.jsx';

export default function CourseDetailsTab() {
  const { course, setCourse } = useOutletContext();
  const [form, setForm] = useState({ code: course.code, title: course.title, description: course.description ?? '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  async function save(isArchived) {
    if (!form.code.trim() || !form.title.trim()) return setError('Course code and title are required.');
    setError('');
    setNotice('');
    setSaving(true);
    try {
      const updated = await updateCourse(course.courseId, { ...form, isArchived });
      setCourse(updated);
      setNotice(isArchived !== course.isArchived ? (isArchived ? 'Course archived.' : 'Course restored.') : 'Course saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="card form-card"
      onSubmit={(e) => {
        e.preventDefault();
        save(course.isArchived);
      }}
      noValidate
    >
      {notice && <Alert variant="info">{notice}</Alert>}
      {error && <Alert>{error}</Alert>}
      <div className="form-grid">
        <label className="field">
          <span>Course code</span>
          <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} maxLength={20} />
        </label>
        <label className="field">
          <span>Title</span>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={200} />
        </label>
      </div>
      <label className="field">
        <span>Description</span>
        <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={2000} />
      </label>
      <div className="form-actions">
        <button
          type="button"
          className={`button ${course.isArchived ? 'button-ghost' : 'button-danger'}`}
          disabled={saving}
          onClick={() => {
            if (!course.isArchived && !window.confirm('Archive this course? It disappears from student and teacher portals.')) return;
            save(!course.isArchived);
          }}
        >
          {course.isArchived ? 'Restore course' : 'Archive course'}
        </button>
        <button type="submit" className="button button-primary" disabled={saving}>
          Save changes
        </button>
      </div>
    </form>
  );
}
