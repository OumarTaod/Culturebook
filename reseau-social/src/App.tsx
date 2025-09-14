import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './auth/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import Follow from './pages/Follow';
import Explore from './pages/Explore';
import Friends from './pages/Friends';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import Saved from './pages/Saved';
import Marketplace from './pages/Marketplace';
import Admin from './pages/Admin';
import './App.css';

function App() {
  return (
    <Routes>
      {/* Les routes protégées nécessitent que l'utilisateur soit connecté */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="profile/:userId" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="messages" element={<Messages />} />
          <Route path="follow" element={<Follow />} />
          <Route path="explore" element={<Explore />} />
          <Route path="friends" element={<Friends />} />
          <Route path="groups" element={<Groups />} />
          <Route path="groups/:groupId" element={<GroupDetail />} />
          <Route path="saved" element={<Saved />} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="admin" element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          } />
        </Route>
      </Route>

      {/* La page de connexion n'aura pas la barre de navigation principale */}
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}

export default App;
