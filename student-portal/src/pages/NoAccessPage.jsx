// pages/NoAccessPage.jsx — signed in, but this account lacks the role this portal serves.
// Points the user to the portals their roles do allow.
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { otherPortalsFor, ROLE_LABELS, THIS_PORTAL_NAME, THIS_PORTAL_ROLE } from '../config/portals.js';

export default function NoAccessPage() {
  const { user, signOut } = useAuth();
  const portals = otherPortalsFor(user?.roles);
  const roleNames = (user?.roles ?? []).map((r) => ROLE_LABELS[r] ?? r).join(', ') || 'none';
  const requiredRole = ROLE_LABELS[THIS_PORTAL_ROLE];

  return (
    <div className="center-page">
      <div className="card narrow-card">
        <ShieldAlert size={40} className="text-warning" aria-hidden="true" />
        <h1>{requiredRole} access only</h1>
        <p>
          You are signed in as <strong>{user?.fullName}</strong> (roles: {roleNames}). The {THIS_PORTAL_NAME} requires
          the {requiredRole} role.
        </p>
        {portals.length > 0 && (
          <div className="stack">
            <p className="muted">Continue to a portal for your role:</p>
            {portals.map((p) => (
              <a key={p.role} className="button button-primary" href={p.url}>
                {p.label}
              </a>
            ))}
          </div>
        )}
        <button type="button" className="button button-ghost" onClick={signOut}>
          Sign out
        </button>
      </div>
    </div>
  );
}
