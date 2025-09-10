const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Vérifier si nous sommes en environnement de développement
        if (process.env.NODE_ENV === 'development') {
            console.log('Mode développement: utilisation de la base de données en mémoire');
            // Continuer sans connexion à MongoDB pour le développement
            return;
        } else {
            const conn = await mongoose.connect(process.env.MONGO_URI);
            console.log(`MongoDB Connecté: ${conn.connection.host}`);
        }
    } catch (error) {
        console.error(`Erreur de connexion à la DB: ${error.message}`);
        // En développement, ne pas quitter l'application en cas d'erreur de connexion
        if (process.env.NODE_ENV !== 'development') {
            process.exit(1);
        }
    }
};

module.exports = connectDB;