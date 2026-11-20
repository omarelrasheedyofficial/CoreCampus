// pages/users/NewUserPage.jsx — create a university account (Supabase Auth + CampusCore profile).
// The initial password is sent once to the backend, which passes it to Supabase Auth for hashing.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { createUser } from '../../api/admin.api.js';
import { ROLE_LABELS } from '../../config/portals.js';
import PageHeader from '../../components/PageHeader.jsx';
import Alert from '../../components/Alert.jsx';
import { RoleSelect, StaffProfileFields, StudentProfileFields } from '../../components/ProfileFields.jsx';

/** Same rules as the backend (backend/src/utils/validation.js). */
function passwordProblem(pw) {
  if (pw.length < 10 || pw.length > 72) return 'Password must be 10–72 characters long.';
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/\d/.test(pw)) {
    return 'Password must include an upper-case letter, a lower-case letter and a digit.';
  }
  return '';
}

export default function NewUserPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', roles: [] });
  const [studentProfile, setStudentProfile] = useState({});
  const [staffProfile, setStaffProfile] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const needsStudent = form.roles.includes('student');
  const needsStaff = form.roles.includes('lecturer') || form.roles.includes('lab_teacher');
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.fullName.trim() || !form.email.trim()) return setError('Full name and email are required.');
    if (form.roles.length === 0) return setError('Select a role.');
    const pwError = passwordProblem(form.password);
    if (pwError) return setError(pwError);
    if (needsStudent && !studentProfile.universityId?.trim()) return setError('University ID is required for students.');
    if (needsStaff && !staffProfile.employeeNumber?.trim()) return setError('Employee number is required for teaching staff.');

    setError('');
    setSaving(true);
    try {
      const user = await createUser({
        ...form,
        studentProfile: needsStudent ? studentProfile : undefined,
        staffProfile: needsStaff ? staffProfile : undefined,
      });
      navigate(`/users/${user.userId}`, { replace: true, state: { notice: `Created account for ${user.fullName}.` } });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <>
      <Link to="/users" className="link back-link">
        <ArrowLeft size={16} aria-hidden="true" /> Users & Roles
      </Link>
      <PageHeader title="New user" subtitle="Creates the sign-in account and the CampusCore profile." />

      <form className="card form-card" onSubmit={handleSubmit} noValidate>
        {error && <Alert>{error}</Alert>}

        <h3>Account</h3>
        <div className="form-grid">
          <label className="field">
            <span>Full name *</span>
            <input value={form.fullName} onChange={set('fullName')} maxLength={150} required />
          </label>
          <label className="field">
            <span>University email *</span>
            <input type="email" value={form.email} onChange={set('email')} maxLength={255} autoComplete="off" required />
          </label>
          <label className="field">
            <span>Temporary password * <span className="muted small">(they must change it at first sign-in)</span></span>
            <input type="password" value={form.password} onChange={set('password')} maxLength={72} autoComplete="new-password" required />
            <small className="muted">10+ characters with upper-case, lower-case and a digit.</small>
          </label>
        </div>

        <h3>Roles *</h3>
        <RoleSelect value={form.roles} onChange={(roles) => setForm({ ...form, roles })} labels={ROLE_LABELS} />

        {needsStudent && (
          <>
            <h3>Student profile</h3>
            <StudentProfileFields value={studentProfile} onChange={setStudentProfile} />
          </>
        )}
        {needsStaff && (
          <>
            <h3>Staff profile</h3>
            <StaffProfileFields value={staffProfile} onChange={setStaffProfile} />
          </>
        )}

        <div className="form-actions">
          <Link className="button button-ghost" to="/users">
            Cancel
          </Link>
          <button type="submit" className="button button-primary" disabled={saving}>
            {saving ? 'Creating…' : 'Create user'}
          </button>
        </div>
      </form>
    </>
  );
}
