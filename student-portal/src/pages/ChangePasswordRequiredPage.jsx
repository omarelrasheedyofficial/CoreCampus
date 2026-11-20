// pages/ChangePasswordRequiredPage.jsx — shown instead of the portal after the first sign-in,
// because the administrator chose the account's first password. The backend also refuses every
// other request until the password is changed.
import { GraduationCap, KeyRound, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import ChangePasswordForm from '../components/ChangePasswordForm.jsx';
import { THIS_PORTAL_NAME } from '../config/portals.js';

export default function ChangePasswordRequiredPage() {
  const { user, refreshUser, signOut } = useAuth();

  // The form signed in again with the new password, so the fresh token no longer carries the
  // "must change" flag; reload the account to enter the portal.
  async function handleDone() {
    await refreshUser();
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
          <h2>
            <KeyRound size={20} aria-hidden="true" /> Choose your own password
          </h2>
          <p className="muted">
            Welcome{user?.fullName ? `, ${user.fullName}` : ''}. Your account was created with a temporary password.
            Replace it with a password only you know before you continue.
          </p>
          <ChangePasswordForm submitLabel="Save and continue" onDone={handleDone} />
          <button type="button" className="link-button" onClick={signOut}>
            <LogOut size={16} aria-hidden="true" /> Sign out
          </button>
        </section>
      </div>
    </div>
  );
}
