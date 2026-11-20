// AssignmentForm — title, instructions and deadline. Used to create and to edit assignments.
// (Shared between the lecturer and lab-teacher portals.)
import { useState } from 'react';
import Alert from './Alert.jsx';
import { fromLocalInputValue, toLocalInputValue } from '../utils/format.js';

export default function AssignmentForm({ initial, heading, submitLabel, onSubmit, onCancel }) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [instructions, setInstructions] = useState(initial?.instructions ?? '');
  const [dueAt, setDueAt] = useState(initial?.dueAt ? toLocalInputValue(initial.dueAt) : '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim()) return setError('Please enter a title.');
    if (!dueAt) return setError('Please choose a deadline.');
    const changedDue = !initial || fromLocalInputValue(dueAt) !== new Date(initial.dueAt).toISOString();
    if (changedDue && new Date(dueAt).getTime() <= Date.now()) return setError('The deadline must be in the future.');

    setError('');
    setSaving(true);
    try {
      // Unchanged deadlines are sent back exactly as stored (avoids minute rounding).
      await onSubmit({ title: title.trim(), instructions, dueAt: changedDue ? fromLocalInputValue(dueAt) : initial.dueAt });
      if (!initial) {
        setTitle('');
        setInstructions('');
        setDueAt('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card form-card" onSubmit={handleSubmit} noValidate>
      <h3>{heading}</h3>
      {error && <Alert>{error}</Alert>}
      <div className="form-grid">
        <label className="field">
          <span>Title *</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
        </label>
        <label className="field">
          <span>Deadline *</span>
          <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
        </label>
      </div>
      <label className="field">
        <span>Instructions</span>
        <textarea rows={3} value={instructions} onChange={(e) => setInstructions(e.target.value)} maxLength={5000} />
      </label>
      <div className="form-actions">
        {onCancel && (
          <button type="button" className="button button-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="button button-primary" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
