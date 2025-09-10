// Script pour créer un compte admin
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI;

async function createAdmin() {
  await mongoose.connect(MONGO_URI);
  const email = 'admin@culturebook.com';
  const exist = await User.findOne({ email });
  if (exist) {
    console.log('Un admin existe déjà avec cet email.');
    process.exit();
  }
  const admin = new User({
    nom: 'Admin',
    email,
    motDePasse: 'admin123', // À changer après la première connexion !
    role: 'admin',
  });
  await admin.save();
  console.log('Compte admin créé :', email, 'mot de passe : admin123');
  process.exit();
}

createAdmin().catch(e => {
  console.error(e);
  process.exit(1);
});
