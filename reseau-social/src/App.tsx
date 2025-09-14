// Importation des composants de routage React Router
import { Routes, Route } from 'react-router-dom';
// Importation du composant Layout principal (navbar + contenu)
import Layout from './components/Layout';
// Importation du composant de protection des routes authentifiées
import ProtectedRoute from './auth/ProtectedRoute';
// Importation du composant de protection des routes admin
import AdminRoute from './components/AdminRoute';
// Importation de toutes les pages de l'application
import Home from './pages/Home'; // Page d'accueil
import Login from './pages/Login'; // Page de connexion
import Profile from './pages/Profile'; // Page de profil utilisateur
import Notifications from './pages/Notifications'; // Page des notifications
import Messages from './pages/Messages'; // Page des messages privés
import Follow from './pages/Follow'; // Page de suivi des utilisateurs
import Explore from './pages/Explore'; // Page d'exploration
import Friends from './pages/Friends'; // Page des amis
import Groups from './pages/Groups'; // Page des groupes
import GroupDetail from './pages/GroupDetail'; // Page de détail d'un groupe
import Saved from './pages/Saved'; // Page des publications sauvegardées
import Marketplace from './pages/Marketplace'; // Page du marketplace
import Admin from './pages/Admin'; // Page d'administration
// Importation des feuilles de style
import './App.css'; // Styles principaux de l'application
import './mobile-responsive.css'; // Styles responsives pour mobile

// Composant principal de l'application React
function App() {
  return (
    // Configuration du système de routage de l'application
    <Routes>
      {/* ========== ROUTES PROTÉGÉES (NÉCESSITENT UNE AUTHENTIFICATION) ========== */}
      <Route element={<ProtectedRoute />}>
        {/* Layout principal avec navbar et sidebar */}
        <Route element={<Layout />}>
          {/* Route d'accueil - Fil d'actualité */}
          <Route path="/" element={<Home />} />
          {/* Route de profil utilisateur avec paramètre dynamique */}
          <Route path="profile/:userId" element={<Profile />} />
          {/* Route des notifications utilisateur */}
          <Route path="notifications" element={<Notifications />} />
          {/* Route de messagerie privée */}
          <Route path="messages" element={<Messages />} />
          {/* Route de suivi des utilisateurs */}
          <Route path="follow" element={<Follow />} />
          {/* Route d'exploration de contenu */}
          <Route path="explore" element={<Explore />} />
          {/* Route de gestion des amis */}
          <Route path="friends" element={<Friends />} />
          {/* Route de liste des groupes */}
          <Route path="groups" element={<Groups />} />
          {/* Route de détail d'un groupe avec paramètre dynamique */}
          <Route path="groups/:groupId" element={<GroupDetail />} />
          {/* Route des publications sauvegardées */}
          <Route path="saved" element={<Saved />} />
          {/* Route du marketplace */}
          <Route path="marketplace" element={<Marketplace />} />
          {/* Route d'administration avec double protection (auth + admin) */}
          <Route path="admin" element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          } />
        </Route>
      </Route>

      {/* ========== ROUTES PUBLIQUES (SANS LAYOUT) ========== */}
      {/* Page de connexion sans navbar ni sidebar */}
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}

export default App;
