// layouts/LecturerLayout.jsx — sidebar + top bar shell around every lecturer page.
// New lecturer pages are added to NAV_ITEMS as they are implemented.
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { BookOpen, LayoutDashboard, UserRound } from 'lucide-react';
import Sidebar from '../components/Sidebar.jsx';
import Topbar from '../components/Topbar.jsx';
import { THIS_PORTAL_NAME } from '../config/portals.js';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/courses', label: 'My Courses', icon: BookOpen },
  { to: '/profile', label: 'My Profile', icon: UserRound },
];

export default function LecturerLayout() {
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
