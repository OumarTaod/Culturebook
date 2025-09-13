import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

interface AdminRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'superadmin';
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children, requiredRole = 'admin' }) => {
  const { user, isAuthenticated } = useAuth();

  // Vérifier si l'utilisateur est connecté
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Vérifier si l'utilisateur a le rôle requis
  const hasPermission = user && (
    user.role === 'superadmin' || 
    (requiredRole === 'admin' && (user.role === 'admin' || user.role === 'superadmin'))
  );

  if (!hasPermission) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;