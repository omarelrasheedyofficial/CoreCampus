// App.jsx — route table for the Lecturer Portal.
import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import LecturerLayout from './layouts/LecturerLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import CoursesPage from './pages/CoursesPage.jsx';
import SectionPage from './pages/SectionPage.jsx';
import SectionStudentsTab from './pages/section/SectionStudentsTab.jsx';
import SectionMaterialsTab from './pages/section/SectionMaterialsTab.jsx';
import SectionAssignmentsTab from './pages/section/SectionAssignmentsTab.jsx';
import AssignmentSubmissionsPage from './pages/section/AssignmentSubmissionsPage.jsx';
import SectionAnnouncementsTab from './pages/section/SectionAnnouncementsTab.jsx';
import SectionGradebookTab from './pages/section/SectionGradebookTab.jsx';
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
        <Route element={<LecturerLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="sections/:sectionId" element={<SectionPage />}>
            <Route index element={<SectionStudentsTab />} />
            <Route path="materials" element={<SectionMaterialsTab />} />
            <Route path="assignments" element={<SectionAssignmentsTab />} />
            <Route path="assignments/:assignmentId" element={<AssignmentSubmissionsPage />} />
            <Route path="announcements" element={<SectionAnnouncementsTab />} />
            <Route path="gradebook" element={<SectionGradebookTab />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
