import Dashboard from '@/views/Dashboard';
import ProtectedRoute from '../../../utils/ProtectedRoute';

const dashboard = () => {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
};

export default dashboard;
