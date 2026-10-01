import { Routes, Route } from 'react-router-dom';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import AppLayout from '../layouts/AppLayout';

// Public Pages
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';

// App Pages
import Dashboard from '../pages/Dashboard';
import Requests from '../pages/Requests';
import CreateRequest from '../pages/CreateRequest';
import RequestDetail from '../pages/RequestDetail';
import Donors from '../pages/Donors';
import Hospitals from '../pages/Hospitals';
import Notifications from '../pages/Notifications';
import Profile from '../pages/Profile';

// 404 Page
import NotFound from '../pages/NotFound';
import { ProtectedRoute } from '../components/shared/ProtectedRoute';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Blood Requests */}
        <Route path="/requests" element={<Requests />} />
        <Route path="/requests/new" element={<CreateRequest />} />
        <Route path="/requests/:id" element={<RequestDetail />} />

        <Route path="/donors" element={<Donors />} />
        <Route path="/hospitals" element={<Hospitals />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
