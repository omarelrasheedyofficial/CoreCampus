// Sidebar — portal navigation. `items`: [{ to, label, icon }]
import { NavLink } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export default function Sidebar({ portalName, items, open, onNavigate }) {
  return (
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand">
        <GraduationCap size={28} aria-hidden="true" />
        <div>
          <div className="brand-name">CampusCore</div>
          <div className="brand-portal">{portalName}</div>
        </div>
      </div>
      <nav aria-label="Main navigation">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="nav-link" onClick={onNavigate}>
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
