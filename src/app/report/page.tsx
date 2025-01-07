import DocumentChat from '@/views/Report';
import ProtectedRoute from '../../../utils/ProtectedRoute';

export default function profile() {
  return (
    <ProtectedRoute>
      <DocumentChat />
    </ProtectedRoute>
  );
}
