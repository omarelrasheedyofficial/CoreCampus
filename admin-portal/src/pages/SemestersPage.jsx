// pages/SemestersPage.jsx — create, edit and delete academic semesters.
import { useEffect, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { createSemester, deleteSemester, fetchSemesters, updateSemester } from '../api/admin.api.js';
import PageHeader from '../components/PageHeader.jsx';
import DataTable from '../components/DataTable.jsx';
import Loader from '../components/Loader.jsx';
import Alert from '../components/Alert.jsx';

const EMPTY = { name: '', startDate: '', endDate: '' };

function validate(f) {
  if (!f.name.trim() || !f.startDate || !f.endDate) return 'Name, start date and end date are required.';
  if (f.endDate <= f.startDate) return 'The end date must be after the start date.';
  return '';
}

export default function SemestersPage() {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function reload() {
    setSemesters(await fetchSemesters());
  }

  useEffect(() => {
    reload()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function run(action, message) {
    setError('');
    setNotice('');
    setBusy(true);
    try {
      await action();
      await reload();
      setNotice(message);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const problem = validate(form);
    if (problem) return setError(problem);
    const body = { ...form, name: form.name.trim() };
    const ok = await run(
      () => (editingId ? updateSemester(editingId, body) : createSemester(body)),
      editingId ? `Updated ${body.name}.` : `Created ${body.name}.`,
    );
    if (ok) {
      setForm(EMPTY);
      setEditingId(null);
    }
  }

  const columns = [
    { key: 'name', header: 'Semester' },
    { key: 'startDate', header: 'Start date' },
    { key: 'endDate', header: 'End date' },
    { key: 'courseCount', header: 'Courses' },
    {
      key: 'actions',
      header: 'Actions',
      render: (s) => (
        <div className="row-actions">
          <button
            type="button"
            className="icon-button"
            aria-label={`Edit ${s.name}`}
            title="Edit"
            onClick={() => {
              setEditingId(s.semesterId);
              setForm({ name: s.name, startDate: s.startDate, endDate: s.endDate });
              setError('');
            }}
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            className="icon-button icon-button-danger"
            aria-label={`Delete ${s.name}`}
            title={s.courseCount > 0 ? 'Semesters with courses cannot be deleted' : 'Delete'}
            disabled={busy || s.courseCount > 0}
            onClick={() => window.confirm(`Delete ${s.name}?`) && run(() => deleteSemester(s.semesterId), `Deleted ${s.name}.`)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Semesters" subtitle="Academic semesters and their dates." />

      <form className="card form-card" onSubmit={handleSubmit} noValidate>
        <h3>{editingId ? 'Edit semester' : 'New semester'}</h3>
        <div className="form-row form-row-4">
          <label className="field">
            <span>Name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={60} placeholder="e.g. Spring 2027" />
          </label>
          <label className="field">
            <span>Start date</span>
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </label>
          <label className="field">
            <span>End date</span>
            <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </label>
          <div className="field-actions">
            {editingId && (
              <button type="button" className="button button-ghost" onClick={() => (setEditingId(null), setForm(EMPTY))}>
                Cancel
              </button>
            )}
            <button type="submit" className="button button-primary" disabled={busy}>
              {editingId ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      </form>

      {notice && <Alert variant="info">{notice}</Alert>}
      {error && <Alert>{error}</Alert>}
      {loading ? (
        <Loader label="Loading semesters…" />
      ) : (
        <DataTable columns={columns} rows={semesters} rowKey={(s) => s.semesterId} emptyMessage="No semesters yet." />
      )}
    </>
  );
}
