import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../context/useAuthStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const authStore = useAuthStore();

  // Nếu chưa đăng nhập, redirect về login
  if (!authStore.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Nếu cần admin mà user không phải admin
  if (adminOnly && !authStore.isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}