const multer = require('multer');
const path = require('path');

// Configuration du stockage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // dossier uploads
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtrage des fichiers acceptés (images + audio + vidéo)
function fileFilter(req, file, cb) {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
    'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    return cb(null, true);
  } else {
    cb(new Error('Seules les images (JPEG, PNG, GIF, WEBP), fichiers audio (MP3, WAV, OGG) et vidéos (MP4, WEBM, OGG, AVI, MOV) sont autorisés!'));
  }
}

const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB pour les vidéos
  }
});

module.exports = upload;
