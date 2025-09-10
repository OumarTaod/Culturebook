const express = require('express');
const { getNotifications, markAsRead, markOneAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Toutes les routes de ce fichier sont protégées
router.use(protect);

router.route('/')
  .get(getNotifications);

router.route('/read')
  .patch(markAsRead);

router.route('/:id/read')
  .patch(markOneAsRead);

module.exports = router;
