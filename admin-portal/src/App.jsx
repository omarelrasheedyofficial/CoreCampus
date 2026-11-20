// App.jsx — route table for the Administrator Portal.
import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import UsersPage from './pages/users/UsersPage.jsx';
import NewUserPage from './pages/users/NewUserPage.jsx';
import UserDetailPage from './pages/users/UserDetailPage.jsx';
import SemestersPage from './pages/SemestersPage.jsx';
import CoursesPage from './pages/courses/CoursesPage.jsx';
import CourseDetailPage from './pages/courses/CourseDetailPage.jsx';
import CourseDetailsTab from './pages/courses/CourseDetailsTab.jsx';
import CourseEnrollmentsTab from './pages/courses/CourseEnrollmentsTab.jsx';
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
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="users/new" element={<NewUserPage />} />
          <Route path="users/:userId" element={<UserDetailPage />} />
          <Route path="semesters" element={<SemestersPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="courses/:courseId" element={<CourseDetailPage />}>
            <Route index element={<CourseDetailsTab />} />
            <Route path="enrollments" element={<CourseEnrollmentsTab />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
