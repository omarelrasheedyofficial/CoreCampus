// pages/ResetPasswordPage.jsx — opened from the password-reset email. Supabase signs the user in
// from the link (token in the URL); they then choose a new password without the old one.
// The backend accepts that only for sessions opened from a reset email in the last 15 minutes.
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { supabase } from '../api/supabaseClient.js';
import ChangePasswordForm from '../components/ChangePasswordForm.jsx';
import Alert from '../components/Alert.jsx';
import Loader from '../components/Loader.jsx';
import { THIS_PORTAL_NAME } from '../config/portals.js';

const EMAIL_LINK_WINDOW_SECONDS = 15 * 60;

// The error Supabase puts in the URL when a link is expired or already used. Read it before the
// Supabase client cleans up the address bar.
const LINK_ERROR = new URLSearchParams(window.location.hash.slice(1)).get('error_description');

/** True when the access token says this session came from a reset email in the last 15 minutes. */
function openedFromRecentEmailLink(accessToken) {
  try {
    const part = accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { amr = [] } = JSON.parse(atob(part));
    const now = Date.now() / 1000;
    return amr.some((a) => ['recovery', 'otp'].includes(a.method) && now - a.timestamp <= EMAIL_LINK_WINDOW_SECONDS);
  } catch {
    return false;
  }
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [state, setState] = useState('checking'); // checking | ready | invalid

  useEffect(() => {
    if (LINK_ERROR) return setState('invalid');
    // getSession waits until the client has read the token from the link.
    supabase.auth.getSession().then(({ data }) => {
      setState(data.session && openedFromRecentEmailLink(data.session.access_token) ? 'ready' : 'invalid');
    });
  }, []);

  // The password change already ended the session; clear it from this browser too.
  async function handleDone() {
    await supabase.auth.signOut({ scope: 'local' });
    navigate('/login', { replace: true, state: { notice: 'Your password was changed. Sign in with your new password.' } });
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
          <h2>Choose a new password</h2>
          {state === 'checking' && <Loader label="Checking your link…" />}
          {state === 'invalid' && (
            <>
              <Alert>This password-reset link is invalid, already used, or expired.</Alert>
              <Link to="/forgot-password" className="link">
                Send a new link
              </Link>
            </>
          )}
          {state === 'ready' && <ChangePasswordForm requireCurrent={false} staySignedIn={false} submitLabel="Save new password" onDone={handleDone} />}
          <Link to="/login" className="link">
            Back to sign in
          </Link>
        </section>
      </div>
    </div>
  );
}
