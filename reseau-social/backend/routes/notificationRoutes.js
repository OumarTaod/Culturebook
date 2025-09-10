const express = require('express');
const { getNotifications, markAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Toutes les routes de ce fichier sont protégées
router.use(protect);

router.route('/')
    .get(getNotifications);

router.route('/read')
    .patch(markAsRead);

module.exports = router;
