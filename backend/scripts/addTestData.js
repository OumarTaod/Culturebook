require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Message = require('../models/Message');

async function addTestData() {
  await mongoose.connect(process.env.MONGO_URI);
  
  // Créer des utilisateurs de test
  const testUsers = [
    { name: 'Alice Martin', email: 'alice@test.com', password: 'password123' },
    { name: 'Bob Dupont', email: 'bob@test.com', password: 'password123' },
    { name: 'Claire Moreau', email: 'claire@test.com', password: 'password123' }
  ];
  
  const createdUsers = [];
  for (const userData of testUsers) {
    const existingUser = await User.findOne({ email: userData.email });
    if (!existingUser) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`Utilisateur créé: ${user.name}`);
    } else {
      createdUsers.push(existingUser);
    }
  }
  
  // Créer des posts de test
  const testPosts = [
    { content: 'Bonjour tout le monde ! Premier post sur CultureBook 🎉', author: createdUsers[0]._id },
    { content: 'Quelle belle journée pour partager de la culture ! 📚', author: createdUsers[1]._id },
    { content: 'J\'adore cette nouvelle plateforme sociale ! 💖', author: createdUsers[2]._id },
    { content: 'Qui veut discuter de littérature française ? 🇫🇷', author: createdUsers[0]._id },
    { content: 'Partage de mes dernières lectures... 📖', author: createdUsers[1]._id }
  ];
  
  for (const postData of testPosts) {
    const existingPost = await Post.findOne({ content: postData.content });
    if (!existingPost) {
      const post = new Post(postData);
      await post.save();
      console.log(`Post créé: ${post.content.substring(0, 30)}...`);
    }
  }
  
  console.log('Données de test ajoutées avec succès !');
  await mongoose.disconnect();
}

addTestData().catch(console.error);