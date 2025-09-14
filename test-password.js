const axios = require('axios');

async function testPasswordChange() {
  try {
    // 1. Connexion
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Connexion réussie');
    
    // 2. Test changement mot de passe
    const response = await axios.patch('http://localhost:5000/api/users/change-password', {
      currentPassword: 'password123',
      newPassword: 'newpassword123'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Changement réussi:', response.data);
    
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
  }
}

testPasswordChange();