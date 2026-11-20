import { useEffect, useState } from 'react';
import { fetchProfile, updateProfile } from '../api/profile.api.js';
import { ROLE_LABELS } from '../config/portals.js';
import PageHeader from '../components/PageHeader.jsx';
import Loader from '../components/Loader.jsx';
import Alert from '../components/Alert.jsx';
import ChangePasswordForm from '../components/ChangePasswordForm.jsx';
import PhoneInput from '../components/PhoneInput.jsx';

function Row({ label, value }) {
  return (
    <div className="detail-row">
      <dt>{label}</dt>
      <dd>{value ?? '—'}</dd>
    </div>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile()
      .then((p) => {
        setProfile(p);
        setPhone(p.studentProfile?.phoneNumber ?? p.staffProfile?.phoneNumber ?? '');
      })
      .catch((err) => setError(err.message));
  }, []);

  async function handleSave(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setSaving(true);
    try {
      const p = await updateProfile({ phoneNumber: phone.trim() });
      setProfile(p);
      setNotice('Profile updated.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!profile) return error ? <Alert>{error}</Alert> : <Loader label="Loading profile…" />;

  const student = profile.studentProfile;
  const staff = profile.staffProfile;
  const editable = Boolean(student || staff);

  return (
    <>
      <PageHeader title="My Profile" subtitle="Your account details. Contact the administration to change your name or IDs." />

      <section className="card form-card">
        <h3>Account</h3>
        <dl className="details">
          <Row label="Full name" value={profile.fullName} />
          <Row label="Email" value={profile.email} />
          <Row label="Roles" value={profile.roles.map((r) => ROLE_LABELS[r] ?? r).join(', ')} />
          {student && (
            <>
              <Row label="University ID" value={student.universityId} />
              <Row label="Major" value={student.major} />
              <Row label="Academic year" value={student.academicYear} />
            </>
          )}
          {staff && (
            <>
              <Row label="Employee number" value={staff.employeeNumber} />
              <Row label="Department" value={staff.department} />
              <Row label="Academic title" value={staff.academicTitle} />
            </>
          )}
        </dl>
      </section>

      {editable && (
        <form className="card form-card" onSubmit={handleSave} noValidate>
          <h3>Contact information</h3>
          {notice && <Alert variant="info">{notice}</Alert>}
          {error && <Alert>{error}</Alert>}
          <div className="form-row">
            <label className="field">
              <span>Phone number</span>
              <PhoneInput value={phone} onChange={setPhone} />
            </label>
            <div className="field-actions">
              <button type="submit" className="button button-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      )}

      <section className="card form-card">
        <h3>Password</h3>
        <ChangePasswordForm />
      </section>
    </>
  );
}
