// layouts/StudentLayout.jsx — sidebar + top bar shell around every student page.
// New student pages are added to NAV_ITEMS as they are implemented.
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Award, BookOpen, ClipboardList, LayoutDashboard, Megaphone, UserRound } from 'lucide-react';
import Sidebar from '../components/Sidebar.jsx';
import Topbar from '../components/Topbar.jsx';
import AnnouncementNotifications from '../components/AnnouncementNotifications.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/courses', label: 'My Courses', icon: BookOpen },
  { to: '/assignments', label: 'Assignments', icon: ClipboardList },
  { to: '/grades', label: 'Grades & Feedback', icon: Award },
  { to: '/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/profile', label: 'My Profile', icon: UserRound },
];

export default function StudentLayout() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar
        portalName="Student Portal"
        items={NAV_ITEMS}
        open={menuOpen}
        onNavigate={() => setMenuOpen(false)}
      />
      {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />}
      <div className="app-main">
        <Topbar
          onMenuClick={() => setMenuOpen(true)}
          actions={<AnnouncementNotifications key={user.email} email={user.email} />}
        />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
