// Script pour créer un compte admin ou superadmin
require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI;

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
      opts[key] = val;
    }
  }
  return opts;
}

async function main() {
  const { email, password, name, role } = parseArgs();

  if (!email || !password || !name) {
    console.error('Usage: node scripts/createAdmin.js --name "Nom" --email admin@example.com --password "motdepasse" [--role admin|superadmin]');
    process.exit(1);
  }

  const finalRole = role === 'superadmin' ? 'superadmin' : (role === 'admin' ? 'admin' : 'admin');

  await mongoose.connect(MONGO_URI);
  const exist = await User.findOne({ email });
  if (exist) {
    console.log('Un utilisateur existe déjà avec cet email.');
    process.exit(0);
  }

  const user = new User({ name, email, password, role: finalRole });
  await user.save();
  console.log(`Compte ${finalRole} créé:`, { email, name });

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (e) => {
  console.error(e);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
