// App.jsx — route table for the Student Portal.
import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import StudentLayout from './layouts/StudentLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import CoursesPage from './pages/CoursesPage.jsx';
import CourseDetailPage from './pages/course/CourseDetailPage.jsx';
import CourseMaterialsTab from './pages/course/CourseMaterialsTab.jsx';
import CourseAssignmentsTab from './pages/course/CourseAssignmentsTab.jsx';
import CourseAnnouncementsTab from './pages/course/CourseAnnouncementsTab.jsx';
import AssignmentsPage from './pages/AssignmentsPage.jsx';
import GradesPage from './pages/GradesPage.jsx';
import AnnouncementsPage from './pages/AnnouncementsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import { THIS_PORTAL_ROLE } from './config/portals.js';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute role={THIS_PORTAL_ROLE} />}>
        <Route element={<StudentLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="courses/:courseId" element={<CourseDetailPage />}>
            <Route index element={<CourseMaterialsTab />} />
            <Route path="assignments" element={<CourseAssignmentsTab />} />
            <Route path="announcements" element={<CourseAnnouncementsTab />} />
          </Route>
          <Route path="assignments" element={<AssignmentsPage />} />
          <Route path="grades" element={<GradesPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
