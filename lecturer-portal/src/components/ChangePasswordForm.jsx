// components/ChangePasswordForm.jsx — current password (optional), new password, confirmation.
// Used on My Profile, at the forced first-login change, and on the reset-email page.
import { useState } from 'react';
import { changePassword, passwordProblem } from '../api/password.api.js';
import { supabase } from '../api/supabaseClient.js';
import Alert from './Alert.jsx';

export default function ChangePasswordForm({ requireCurrent = true, staySignedIn = true, submitLabel = 'Change password', onDone }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (requireCurrent && !form.currentPassword) return setError('Enter your current password.');
    const problem = passwordProblem(form.newPassword);
    if (problem) return setError(problem);
    if (form.newPassword !== form.confirm) return setError('The two new passwords do not match.');
    if (requireCurrent && form.newPassword === form.currentPassword) {
      return setError('Choose a new password that is different from your current one.');
    }

    setBusy(true);
    try {
      const { data } = await supabase.auth.getSession();
      const email = data.session?.user.email;
      await changePassword({
        ...(requireCurrent && { currentPassword: form.currentPassword }),
        newPassword: form.newPassword,
      });
      // Supabase ends every session when the password changes; stay signed in on this device.
      if (staySignedIn && email) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: form.newPassword });
        if (signInError) throw new Error('Your password was changed. Please sign in again with the new password.');
      }
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      setNotice('Your password was changed. Any other device signed in to your account was signed out.');
      await onDone?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="password-form" onSubmit={handleSubmit} noValidate>
      {notice && <Alert variant="info">{notice}</Alert>}
      {error && <Alert>{error}</Alert>}
      {requireCurrent && (
        <label className="field">
          <span>Current password</span>
          <input type="password" autoComplete="current-password" value={form.currentPassword} onChange={set('currentPassword')} maxLength={72} />
        </label>
      )}
      <label className="field">
        <span>New password</span>
        <input type="password" autoComplete="new-password" value={form.newPassword} onChange={set('newPassword')} maxLength={72} />
      </label>
      <label className="field">
        <span>Confirm new password</span>
        <input type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} maxLength={72} />
      </label>
      <p className="muted small">At least 10 characters, with an upper-case letter, a lower-case letter and a digit.</p>
      <div className="form-actions">
        <button type="submit" className="button button-primary" disabled={busy}>
          {busy ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
