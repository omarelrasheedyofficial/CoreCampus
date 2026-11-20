import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Loader from '../components/Loader.jsx';
import Alert from '../components/Alert.jsx';
import NoAccessPage from '../pages/NoAccessPage.jsx';
import ChangePasswordRequiredPage from '../pages/ChangePasswordRequiredPage.jsx';

export default function ProtectedRoute({ role }) {
  const { status, error, hasRole, user } = useAuth();

  if (status === 'loading') return <Loader fullPage label="Loading your account…" />;
  if (status === 'signedOut') return <Navigate to="/login" replace />;
  if (status === 'error') {
    return (
      <div className="center-page">
        <Alert>{error}</Alert>
      </div>
    );
  }
  if (!hasRole(role)) return <NoAccessPage />;
  if (user?.mustChangePassword) return <ChangePasswordRequiredPage />;
  return <Outlet />;
}
