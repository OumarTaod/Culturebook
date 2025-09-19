import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import api from '../services/api';
import './Login.css';

const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState(''); // Seulement pour l'inscription
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { login } = useAuth();
  const passwordMismatch = isRegistering && confirmPassword.length > 0 && password !== confirmPassword;
  const isRegisterDisabled = isRegistering && (
    isLoading || !name || !email || !password || !confirmPassword || password.length < 6 || passwordMismatch
  );
  const apiBaseUrl = (api as any)?.defaults?.baseURL as string | undefined;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (import.meta.env.DEV) {
        console.log('[Auth] API base URL:', apiBaseUrl);
      }
      if (isRegistering) {
        if (!name || !email || !password || !confirmPassword) {
          setError('Veuillez remplir tous les champs.');
          return;
        }
        if (password.length < 6) {
          setError('Le mot de passe doit contenir au moins 6 caractères.');
          return;
        }
        if (password !== confirmPassword) {
          setError('Les mots de passe ne correspondent pas.');
          return;
        }
        const registerPayload = { name, email, password };
        if (import.meta.env.DEV) {
          console.log('[Auth] Register → POST /auth/register', registerPayload);
        }
        const registerResponse = await api.post('/auth/register', registerPayload);
        if (import.meta.env.DEV) {
          console.log('[Auth] Register response:', registerResponse?.status, registerResponse?.data);
        }
        const loginPayload = { email, password };
        if (import.meta.env.DEV) {
          console.log('[Auth] Auto-login → POST /auth/login', loginPayload);
        }
        const loginResponse = await api.post('/auth/login', loginPayload);
        if (import.meta.env.DEV) {
          console.log('[Auth] Login response:', loginResponse?.status, loginResponse?.data);
        }
        login(loginResponse.data);
      } else {
        if (!email || !password) {
          setError('Veuillez remplir tous les champs.');
          return;
        }
        const loginPayload = { email, password };
        if (import.meta.env.DEV) {
          console.log('[Auth] Login → POST /auth/login', loginPayload);
        }
        const response = await api.post('/auth/login', loginPayload);
        if (import.meta.env.DEV) {
          console.log('[Auth] Login response:', response?.status, response?.data);
        }
        login(response.data);
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const backendMessage = err?.response?.data?.message || err?.message;
      const endpoint = isRegistering ? '/auth/register or /auth/login' : '/auth/login';
      if (import.meta.env.DEV) {
        console.error('[Auth] Error on', endpoint, 'status:', status, 'message:', backendMessage, 'response:', err?.response?.data);
      }
      setError(backendMessage || "Une erreur s'est produite avec l'API.");
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
          {import.meta.env.DEV && (
            <div className="input-group">
              <small style={{ color: '#6b7280' }}>API: {apiBaseUrl || 'non définie'}</small>
            </div>
          )}
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
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                disabled={isLoading}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  fontSize: '1rem'
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          {isRegistering && (
            <div className="input-group">
              <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  disabled={isLoading}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ width: '100%', paddingRight: '44px' }}
                  aria-invalid={passwordMismatch}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    fontSize: '1rem'
                  }}
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {passwordMismatch && (
                <p style={{ color: '#dc2626', marginTop: 6, fontSize: '0.9rem' }}>
                  Les mots de passe ne correspondent pas.
                </p>
              )}
            </div>
          )}
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="login-button" disabled={isLoading || isRegisterDisabled}>
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
