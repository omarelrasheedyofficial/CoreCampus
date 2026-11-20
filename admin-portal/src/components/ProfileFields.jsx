// ProfileFields — inputs for a student or staff profile. `value` is the profile object,
// `onChange(nextValue)` receives the updated copy.
import PhoneInput from './PhoneInput.jsx';
import { DEPARTMENTS, ACADEMIC_TITLES } from '../config/profileOptions.js';

function ProfileSelect({ value, onChange, options, placeholder }) {
  // Keep existing values selectable when editing older profiles.
  const choices = value && !options.includes(value) ? [value, ...options] : options;
  return (
    <select value={value ?? ''} onChange={onChange}>
      <option value="">{placeholder}</option>
      {choices.map((choice) => <option key={choice} value={choice}>{choice}</option>)}
    </select>
  );
}

export function StudentProfileFields({ value, onChange }) {
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value });
  return (
    <div className="form-grid">
      <label className="field">
        <span>University ID *</span>
        <input value={value.universityId ?? ''} onChange={set('universityId')} maxLength={30} required />
      </label>
      <label className="field">
        <span>Major</span>
        <input value={value.major ?? ''} onChange={set('major')} maxLength={120} />
      </label>
      <label className="field">
        <span>Academic year (1–7)</span>
        <input type="number" min={1} max={7} value={value.academicYear ?? ''} onChange={set('academicYear')} />
      </label>
      <label className="field">
        <span>Phone number</span>
        <PhoneInput value={value.phoneNumber ?? ''} onChange={(phoneNumber) => onChange({ ...value, phoneNumber })} />
      </label>
    </div>
  );
}

export function StaffProfileFields({ value, onChange }) {
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value });
  return (
    <div className="form-grid">
      <label className="field">
        <span>Employee number *</span>
        <input value={value.employeeNumber ?? ''} onChange={set('employeeNumber')} maxLength={30} required />
      </label>
      <label className="field">
        <span>Department</span>
        <ProfileSelect value={value.department} onChange={set('department')} options={DEPARTMENTS} placeholder="Select department" />
      </label>
      <label className="field">
        <span>Academic title</span>
        <ProfileSelect value={value.academicTitle} onChange={set('academicTitle')} options={ACADEMIC_TITLES} placeholder="Select academic title" />
      </label>
      <label className="field">
        <span>Phone number</span>
        <PhoneInput value={value.phoneNumber ?? ''} onChange={(phoneNumber) => onChange({ ...value, phoneNumber })} />
      </label>
    </div>
  );
}

/** Role dropdown; keep existing multiple-role assignments selected until changed. */
export function RoleSelect({ value, onChange, labels }) {
  const selected = value.join(',');
  return (
    <select
      className="select"
      aria-label="Roles"
      value={selected}
      onChange={(event) => onChange(event.target.value ? event.target.value.split(',') : [])}
      required
    >
      <option value="">Select a role</option>
      {value.length > 1 && (
        <option value={selected}>{value.map((role) => labels[role] ?? role).join(' + ')} (current roles)</option>
      )}
      {Object.entries(labels).map(([role, label]) => (
        <option key={role} value={role}>{label}</option>
      ))}
    </select>
  );
}
