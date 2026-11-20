// pages/users/UserDetailPage.jsx — edit one account: name, active status, roles and profiles.
import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  fetchUser,
  sendPasswordReset,
  saveStaffProfile,
  saveStudentProfile,
  setUserActive,
  setUserRoles,
  updateUser,
} from '../../api/admin.api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { PORTALS, ROLE_LABELS } from '../../config/portals.js';
import PageHeader from '../../components/PageHeader.jsx';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';
import { RoleSelect, StaffProfileFields, StudentProfileFields } from '../../components/ProfileFields.jsx';

export default function UserDetailPage() {
  const { userId } = useParams();
  const location = useLocation();
  const { user: me } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(location.state?.notice ?? '');
  const [busy, setBusy] = useState(false);

  const [fullName, setFullName] = useState('');
  const [roles, setRoles] = useState([]);
  const [studentProfile, setStudentProfile] = useState({});
  const [staffProfile, setStaffProfile] = useState({});
  const [resetPortal, setResetPortal] = useState('');

  function load(next) {
    setUser(next);
    setFullName(next.fullName);
    setRoles(next.roles);
    setStudentProfile(next.studentProfile ?? {});
    setStaffProfile(next.staffProfile ?? {});
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchUser(userId)
      .then((u) => !cancelled && load(u))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function run(action, successMessage) {
    setError('');
    setNotice('');
    setBusy(true);
    try {
      load(await action());
      setNotice(successMessage);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Loader label="Loading user…" />;
  if (!user) return <Alert>{error || 'User not found.'}</Alert>;

  const isSelf = me.email.toLowerCase() === user.email.toLowerCase();
  // Portals this user can sign in to — the reset link opens the chosen one.
  const userPortals = PORTALS.filter((p) => p.url && user.roles.includes(p.role));
  const chosenPortal = userPortals.find((p) => p.role === resetPortal) ?? userPortals[0];

  async function handleSendReset() {
    if (!window.confirm(`Email ${user.email} a link to choose a new password?`)) return;
    setError('');
    setNotice('');
    setBusy(true);
    try {
      await sendPasswordReset(user.userId, `${chosenPortal.url.replace(/\/+$/, '')}/reset-password`);
      setNotice(`Password reset email sent to ${user.email}. The link opens the ${chosenPortal.label}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Link to="/users" className="link back-link">
        <ArrowLeft size={16} aria-hidden="true" /> Users & Roles
      </Link>
      <PageHeader
        title={user.fullName}
        subtitle={`${user.email} · created ${new Date(user.createdAt).toLocaleDateString()}`}
        actions={
          <span className={`badge ${user.isActive ? 'badge-active' : 'badge-inactive'}`}>
            {user.isActive ? 'Active' : 'Inactive'}
          </span>
        }
      />

      {notice && <Alert variant="info">{notice}</Alert>}
      {error && <Alert>{error}</Alert>}

      <section className="card form-card">
        <h3>Account</h3>
        <form
          className="form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => updateUser(user.userId, { fullName }), 'Name updated.');
          }}
        >
          <label className="field">
            <span>Full name</span>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={150} required />
          </label>
          <div className="field-actions">
            <button type="submit" className="button button-primary" disabled={busy || !fullName.trim() || fullName === user.fullName}>
              Save name
            </button>
          </div>
        </form>
        <div className="inline-row">
          <p className="muted small">
            {user.isActive
              ? 'Deactivating blocks sign-in and all access immediately. Records are kept.'
              : 'This account cannot sign in. Activate it to restore access.'}
          </p>
          <button
            type="button"
            className={`button ${user.isActive ? 'button-danger' : 'button-primary'}`}
            disabled={busy || (isSelf && user.isActive)}
            title={isSelf ? 'You cannot deactivate your own account' : undefined}
            onClick={() => {
              if (user.isActive && !window.confirm(`Deactivate ${user.fullName}? They will no longer be able to sign in.`)) return;
              run(() => setUserActive(user.userId, !user.isActive), user.isActive ? 'Account deactivated.' : 'Account activated.');
            }}
          >
            {user.isActive ? 'Deactivate account' : 'Activate account'}
          </button>
        </div>
      </section>

      <section className="card form-card">
        <h3>Password</h3>
        <p className="muted small">
          For someone who forgot their password and cannot use “Forgot password?” on the login page. They receive an
          email link and choose the new password themselves — you never see it.
        </p>
        {userPortals.length === 0 ? (
          <p className="muted small">Give this user a role first.</p>
        ) : (
          <div className="inline-add">
            {userPortals.length > 1 && (
              <select className="select" value={chosenPortal.role} onChange={(e) => setResetPortal(e.target.value)} aria-label="Portal the link opens">
                {userPortals.map((p) => (
                  <option key={p.role} value={p.role}>
                    {p.label}
                  </option>
                ))}
              </select>
            )}
            <button type="button" className="button button-ghost" disabled={busy || !user.isActive} onClick={handleSendReset}>
              Send password reset email
            </button>
          </div>
        )}
      </section>

      <section className="card form-card">
        <h3>Roles</h3>
        <p className="muted small">Teaching roles require a staff profile; the Student role requires a student profile.</p>
        <RoleSelect value={roles} onChange={setRoles} labels={ROLE_LABELS} />
        <div className="form-actions">
          <button
            type="button"
            className="button button-primary"
            disabled={busy || roles.length === 0 || [...roles].sort().join() === [...user.roles].sort().join()}
            onClick={() => run(() => setUserRoles(user.userId, roles), 'Roles updated.')}
          >
            Save roles
          </button>
        </div>
      </section>

      <section className="card form-card">
        <h3>Student profile {user.studentProfile ? '' : '(none)'}</h3>
        <StudentProfileFields value={studentProfile} onChange={setStudentProfile} />
        <div className="form-actions">
          <button
            type="button"
            className="button button-ghost"
            disabled={busy || !studentProfile.universityId?.trim()}
            onClick={() => run(() => saveStudentProfile(user.userId, studentProfile), 'Student profile saved.')}
          >
            {user.studentProfile ? 'Save student profile' : 'Add student profile'}
          </button>
        </div>
      </section>

      <section className="card form-card">
        <h3>Staff profile {user.staffProfile ? '' : '(none)'}</h3>
        <StaffProfileFields value={staffProfile} onChange={setStaffProfile} />
        <div className="form-actions">
          <button
            type="button"
            className="button button-ghost"
            disabled={busy || !staffProfile.employeeNumber?.trim()}
            onClick={() => run(() => saveStaffProfile(user.userId, staffProfile), 'Staff profile saved.')}
          >
            {user.staffProfile ? 'Save staff profile' : 'Add staff profile'}
          </button>
        </div>
      </section>
    </>
  );
}
