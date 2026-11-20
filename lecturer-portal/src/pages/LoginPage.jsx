// pages/LoginPage.jsx — email/password sign-in through Supabase Auth.
import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { GraduationCap, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Alert from '../components/Alert.jsx';
import { THIS_PORTAL_NAME } from '../config/portals.js';

export default function LoginPage() {
  const { status, error: sessionError, signIn } = useAuth();
  const notice = useLocation().state?.notice; // e.g. after choosing a new password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (status === 'ready') return <Navigate to="/" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    if (!email.trim() || !password) {
      setFormError('Please enter your university email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      // On success the auth listener loads the profile and this page redirects.
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const message = formError || sessionError;

  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="login-brand">
          <GraduationCap size={40} aria-hidden="true" />
          <h1>CampusCore</h1>
          <p>{THIS_PORTAL_NAME}</p>
        </div>

        <form className="card login-card" onSubmit={handleSubmit} noValidate>
          <h2>Sign in</h2>
          <p className="muted">Use your university account.</p>

          {message ? <Alert>{message}</Alert> : notice && <Alert variant="info">{notice}</Alert>}

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <div className="login-links">
            <Link to="/forgot-password" className="link">
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="button button-primary button-block" disabled={submitting || status === 'loading'}>
            <LogIn size={18} aria-hidden="true" />
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
