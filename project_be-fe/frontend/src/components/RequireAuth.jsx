import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function RequireAuth({ children }) {
  const { session } = useAuth();
  return session ? children : <Navigate to="/login" replace />;
}