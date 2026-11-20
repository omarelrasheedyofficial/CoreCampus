// pages/ForgotPasswordPage.jsx — "Forgot password?": emails a one-time link to choose a new one.
// The answer is the same whether or not the email has an account (no account enumeration).
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Mail } from 'lucide-react';
import { requestPasswordResetEmail } from '../api/password.api.js';
import Alert from '../components/Alert.jsx';
import { THIS_PORTAL_NAME } from '../config/portals.js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return setError('Enter your university email address.');
    setBusy(true);
    try {
      await requestPasswordResetEmail(value);
      setSentTo(value);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="login-brand">
          <GraduationCap size={40} aria-hidden="true" />
          <h1>CampusCore</h1>
          <p>{THIS_PORTAL_NAME}</p>
        </div>

        <section className="card login-card">
          <h2>Forgot your password?</h2>
          {sentTo ? (
            <>
              <Alert variant="info">
                If an account exists for <strong>{sentTo}</strong>, we have sent it an email with a link to choose a
                new password. Check your inbox and spam folder. The link works once and expires soon.
              </Alert>
              <button type="button" className="link-button" onClick={() => setSentTo('')}>
                Send to a different email
              </button>
            </>
          ) : (
            <form className="password-form" onSubmit={handleSubmit} noValidate>
              <p className="muted">Enter your university email and we will send you a link to choose a new password.</p>
              {error && <Alert>{error}</Alert>}
              <label className="field">
                <span>Email</span>
                <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
              </label>
              <button type="submit" className="button button-primary button-block" disabled={busy}>
                <Mail size={18} aria-hidden="true" />
                {busy ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}
          <Link to="/login" className="link">
            Back to sign in
          </Link>
        </section>
      </div>
    </div>
  );
}
