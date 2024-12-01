import DocumentChat from '@/views/Report/features/DocumentChat';
import ProtectedRoute from '../../../utils/ProtectedRoute';

export default function profile() {
  return (
    <ProtectedRoute>
      <DocumentChat />
    </ProtectedRoute>
  );
}
