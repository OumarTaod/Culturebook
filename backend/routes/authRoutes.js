const express = require('express');
const router = express.Router();
const { register, login, profile, refreshToken } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, profile);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email requis' });
  }
  try {
    const User = require('../models/User');
    const crypto = require('crypto');
    const { sendResetEmail } = require('../utils/emailService');
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ success: true, message: 'Si cet email existe, un lien a été envoyé' });
    }
    
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();
    
    try {
      await sendResetEmail(email, resetToken);
      res.status(200).json({ success: true, message: 'Email de récupération envoyé avec succès' });
    } catch (emailError) {
      console.error('Erreur d\'envoi email:', emailError);
      // Retourner le lien directement si l\'email échoue
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      res.status(200).json({ 
        success: true, 
        message: 'Problème d\'envoi email. Lien de récupération:', 
        resetLink: resetUrl 
      });
    }
  } catch (error) {
    console.error('Erreur forgot-password:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi: ' + error.message });
  }
});

module.exports = router;
