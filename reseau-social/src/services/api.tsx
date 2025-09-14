/**
 * ===========================================
 *           SERVICE API - CONFIGURATION AXIOS
 * ===========================================
 * 
 * Ce service configure Axios pour toutes les requêtes HTTP de l'application.
 * Il gère automatiquement :
 * - L'ajout du token d'authentification
 * - Le rafraîchissement automatique des tokens expirés
 * - La redirection en cas d'échec d'authentification
 * - La gestion des erreurs globales
 * 
 * ===========================================
 */

// Importation d'Axios pour les requêtes HTTP
import axios from 'axios';

// Création de l'instance Axios avec l'URL de base de l'API
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
});

// ========== INTERCEPTEUR DE REQUÊTES ==========
// Ajoute automatiquement le token d'authentification à chaque requête
api.interceptors.request.use((config) => {
  // Récupération du token depuis le localStorage
  const token = localStorage.getItem('token');
  if (token) {
    // Ajout du token dans l'en-tête Authorization
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ========== GESTION DU RAFRAÎCHISSEMENT DE TOKEN ==========
// Variable pour éviter les multiples tentatives de rafraîchissement simultanées
let isRefreshing = false;
// File d'attente pour les requêtes en échec pendant le rafraîchissement
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

// Fonction pour traiter la file d'attente des requêtes en échec
const processQueue = (error: any, token: string | null = null) => {
  // Traitement de toutes les requêtes en attente
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error); // Rejet si erreur de rafraîchissement
    } else {
      resolve(token); // Résolution avec le nouveau token
    }
  });
  
  // Vidage de la file d'attente
  failedQueue = [];
};

// ========== INTERCEPTEUR DE RÉPONSES ==========
// Gère automatiquement les erreurs et le rafraîchissement des tokens
api.interceptors.response.use(
  // Cas de succès : retourne la réponse telle quelle
  (response) => response,
  // Cas d'erreur : gestion intelligente des erreurs d'authentification
  async (error) => {
    const originalRequest = error.config;
    
    // Gestion spécifique des tokens expirés (code 401 avec TOKEN_EXPIRED)
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
      // Si un rafraîchissement est déjà en cours, mettre la requête en file d'attente
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          // Retry de la requête avec le nouveau token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }
      
      // Marquage de la requête pour éviter les boucles infinies
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        // Tentative de rafraîchissement du token
        const response = await api.post('/auth/refresh-token');
        const { token } = response.data;
        
        // Sauvegarde du nouveau token
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Traitement de la file d'attente avec le nouveau token
        processQueue(null, token);
        
        // Retry de la requête originale avec le nouveau token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Échec du rafraîchissement : déconnexion forcée
        processQueue(refreshError, null);
        // Nettoyage du localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
        // Redirection vers la page de connexion
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        // Réinitialisation du flag de rafraîchissement
        isRefreshing = false;
      }
    }
    
    // Gestion des autres erreurs 401 (token invalide, malformé, etc.)
    if (error.response?.status === 401 && error.response?.data?.code !== 'TOKEN_EXPIRED') {
      // Nettoyage et redirection immédiate
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      window.location.href = '/login';
    }
    
    // Propagation de l'erreur pour les autres cas
    return Promise.reject(error);
  }
);

// Export de l'instance Axios configurée pour utilisation dans toute l'application
export default api;

/**
 * ===========================================
 *                NOTES TECHNIQUES
 * ===========================================
 * 
 * FONCTIONNALITÉS CLÉS :
 * - Ajout automatique du token Bearer dans chaque requête
 * - Rafraîchissement automatique des tokens expirés
 * - Gestion de la file d'attente pour éviter les requêtes multiples
 * - Redirection automatique vers /login en cas d'échec
 * 
 * SÉCURITÉ :
 * - Nettoyage complet du localStorage en cas d'erreur
 * - Évitement des boucles infinies avec le flag _retry
 * - Gestion des erreurs de rafraîchissement
 * 
 * PERFORMANCE :
 * - Une seule tentative de rafraîchissement simultanée
 * - File d'attente pour les requêtes concurrentes
 * - Retry automatique des requêtes échouées
 * 
 * ===========================================
 */
