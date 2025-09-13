// Script de test pour vérifier la fonctionnalité de suivi
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testFollowFeature() {
  try {
    console.log('🧪 Test de la fonctionnalité de suivi...\n');
    
    // 1. Connexion avec un utilisateur test
    console.log('1. Connexion...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Connexion réussie\n');
    
    // 2. Récupérer la liste des utilisateurs
    console.log('2. Récupération des utilisateurs...');
    const usersResponse = await axios.get(`${API_BASE}/users`, { headers });
    const users = usersResponse.data.data;
    
    if (users.length < 2) {
      console.log('❌ Pas assez d\'utilisateurs pour tester');
      return;
    }
    
    const targetUser = users.find(u => u.email !== 'test@example.com');
    console.log(`✅ Utilisateur cible trouvé: ${targetUser.name}\n`);
    
    // 3. Vérifier le statut initial
    console.log('3. Vérification du statut initial...');
    const statusResponse = await axios.get(`${API_BASE}/users/${targetUser._id}/is-following`, { headers });
    console.log(`📊 Statut initial: ${statusResponse.data.isFollowing ? 'Suivi' : 'Non suivi'}\n`);
    
    // 4. Suivre l'utilisateur
    console.log('4. Suivi de l\'utilisateur...');
    const followResponse = await axios.post(`${API_BASE}/users/${targetUser._id}/follow`, {}, { headers });
    console.log(`✅ Suivi: ${followResponse.data.isFollowing}\n`);
    
    // 5. Vérifier le nouveau statut
    console.log('5. Vérification du nouveau statut...');
    const newStatusResponse = await axios.get(`${API_BASE}/users/${targetUser._id}/is-following`, { headers });
    console.log(`📊 Nouveau statut: ${newStatusResponse.data.isFollowing ? 'Suivi' : 'Non suivi'}\n`);
    
    // 6. Se désabonner
    console.log('6. Désabonnement...');
    const unfollowResponse = await axios.delete(`${API_BASE}/users/${targetUser._id}/follow`, { headers });
    console.log(`✅ Désabonnement: ${!unfollowResponse.data.isFollowing}\n`);
    
    // 7. Vérifier le statut final
    console.log('7. Vérification du statut final...');
    const finalStatusResponse = await axios.get(`${API_BASE}/users/${targetUser._id}/is-following`, { headers });
    console.log(`📊 Statut final: ${finalStatusResponse.data.isFollowing ? 'Suivi' : 'Non suivi'}\n`);
    
    console.log('🎉 Test terminé avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
  }
}

testFollowFeature();