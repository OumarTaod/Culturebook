// Ce fichier est obsolète. Utilisez routes/postRoutes.js
const express = require('express');
const router = express.Router();
router.all('*', (req, res) => res.status(410).json({ success: false, message: 'Route obsolète. Utilisez /api/posts' }));
module.exports = router;
