import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Spinner from '../components/Spinner';

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Spinner />;
  }

  // Si l'utilisateur est authentifié, on affiche les routes enfants (via Outlet).
  // Sinon, on le redirige vers la page /login.
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;