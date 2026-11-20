// layouts/AdminLayout.jsx — sidebar + top bar shell around every administrator page.
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { BookOpen, CalendarDays, LayoutDashboard, UserRound, Users } from 'lucide-react';
import Sidebar from '../components/Sidebar.jsx';
import Topbar from '../components/Topbar.jsx';
import { THIS_PORTAL_NAME } from '../config/portals.js';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/users', label: 'Users & Roles', icon: Users },
  { to: '/semesters', label: 'Semesters', icon: CalendarDays },
  { to: '/courses', label: 'Courses', icon: BookOpen },
  { to: '/profile', label: 'My Profile', icon: UserRound },
];

export default function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar
        portalName={THIS_PORTAL_NAME}
        items={NAV_ITEMS}
        open={menuOpen}
        onNavigate={() => setMenuOpen(false)}
      />
      {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />}
      <div className="app-main">
        <Topbar onMenuClick={() => setMenuOpen(true)} />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
