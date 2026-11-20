// utils/format.js — display formatting helpers.
// (Shared file: keep identical in every portal.)

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

/** ISO string → value for <input type="datetime-local"> in the user's time zone. */
export function toLocalInputValue(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** <input type="datetime-local"> value (local time) → ISO string for the API, or '' if empty. */
export function fromLocalInputValue(value) {
  return value ? new Date(value).toISOString() : '';
}

/** "in 3 days", "2 hours ago" … */
export function relativeTime(iso) {
  const diff = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(diff);
  const units = [
    ['day', 86_400_000],
    ['hour', 3_600_000],
    ['minute', 60_000],
  ];
  const [unit, ms] = units.find(([, size]) => abs >= size) ?? ['minute', 60_000];
  return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(Math.round(diff / ms), unit);
}

export const STATUS_LABELS = {
  not_submitted: 'Not submitted',
  submitted: 'Submitted',
  graded: 'Graded',
  missing: 'Missing',
  pending: 'Not due yet',
};
