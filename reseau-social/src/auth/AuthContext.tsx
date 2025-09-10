import { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import api from '../services/api';
import type { User } from '../types';

// Define the shape of the user object
// L'interface User est maintenant dans src/types.ts

// Le type de données que l'on attend de l'API après une connexion réussie
interface AuthResponse {
  token: string;
  user: User;
}

// Define the shape of the context
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (authData: AuthResponse) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/auth/profile');
          setUser(response.data);
          setIsAuthenticated(true);
          setIsLoading(false);
        } catch (error) {
          console.error("Session invalide, déconnexion");
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setUser(null);
          setRedirectTo('/login');
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    verifyUser();
  }, []);

  // Effet pour gérer les redirections
  useEffect(() => {
    if (redirectTo) {
      navigate(redirectTo);
      setRedirectTo(null);
    }
  }, [redirectTo, navigate]);

  const login = (authData: AuthResponse) => {
    localStorage.setItem('token', authData.token);
    setUser(authData.user);
    setIsAuthenticated(true);
    setRedirectTo('/');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    setRedirectTo('/login');
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    isLoading
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }
  return context;
};
