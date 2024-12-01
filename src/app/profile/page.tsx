import UserForm from '@/views/Profile/features/UserForm';
import ProtectedRoute from '../../../utils/ProtectedRoute';

export default function profile() {
  return (
    <ProtectedRoute>
      <UserForm />
    </ProtectedRoute>
  );
}
