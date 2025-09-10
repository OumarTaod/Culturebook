import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import api from '../services/api';
import './Login.css';

const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Seulement pour l'inscription
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isRegistering) {
        if (!name || !email || !password) {
          setError('Veuillez remplir tous les champs.');
          return;
        }
        await api.post('/auth/register', { name, email, password });
        const loginResponse = await api.post('/auth/login', { email, password });
        login(loginResponse.data);
      } else {
        if (!email || !password) {
          setError('Veuillez remplir tous les champs.');
          return;
        }
        const response = await api.post('/auth/login', { email, password });
        login(response.data);
      }
    } catch (err: any) {
      // Gestion des erreurs de l'API
    const message = err.response?.data?.message || "Une erreur s'est produite avec l'API.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="brand-title">CultureBook</h1>
        <h2>{isRegistering ? 'Inscription' : 'Connexion'}</h2>
        <form onSubmit={handleSubmit}>
          {isRegistering && (
            <div className="input-group">
              <label htmlFor="name">Nom complet</label>
              <input
                type="text"
                id="name"
                value={name}
                disabled={isLoading}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              disabled={isLoading}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              value={password}
              disabled={isLoading}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Chargement...' : (isRegistering ? "S'inscrire" : 'Se connecter')}
          </button>
        </form>
        <button onClick={() => setIsRegistering(!isRegistering)} className="toggle-button">
          {isRegistering ? 'Déjà un compte ? Se connecter' : "Pas de compte ? S'inscrire"}
        </button>
      </div>
    </div>
  );
};

export default Login;
