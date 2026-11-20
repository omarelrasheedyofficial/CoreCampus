// Topbar — current user, role-aware links to the user's other portals, and logout.
import { LogOut, Menu, ArrowRightLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { otherPortalsFor } from '../config/portals.js';

function initials(name = '') {
  return name
    .replace(/^(Dr|Prof)\.?\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function Topbar({ onMenuClick, actions }) {
  const { user, signOut } = useAuth();
  const otherPortals = otherPortalsFor(user?.roles);

  return (
    <header className="topbar">
      <button type="button" className="icon-button menu-button" onClick={onMenuClick} aria-label="Open menu">
        <Menu size={20} />
      </button>

      <div className="topbar-right">
        {otherPortals.map((portal) => (
          <a key={portal.role} className="button button-ghost portal-link" href={portal.url}>
            <ArrowRightLeft size={16} aria-hidden="true" />
            <span>{portal.label}</span>
          </a>
        ))}

        {actions}
        <div className="user-chip">
          <span className="avatar" aria-hidden="true">{initials(user?.fullName)}</span>
          <div className="user-chip-text">
            <span className="user-name">{user?.fullName}</span>
            <span className="user-email">{user?.email}</span>
          </div>
        </div>

        <button type="button" className="button button-ghost" onClick={signOut}>
          <LogOut size={16} aria-hidden="true" />
          <span>Log out</span>
        </button>
      </div>
    </header>
  );
}
