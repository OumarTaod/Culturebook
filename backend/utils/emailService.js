const nodemailer = require('nodemailer');

// Configuration SMTP gratuit avec Brevo (ex-Sendinblue)
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: 'culturebook.reset@gmail.com',
    pass: 'xsmtpsib-a1b2c3d4e5f6g7h8-9i0j1k2l3m4n5o6p'
  }
});

console.log('Service email Brevo configuré');

const sendResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: '"CultureBook" <culturebook.reset@gmail.com>',
    to: email,
    subject: 'Réinitialisation de votre mot de passe - CultureBook',
    html: `
      <h2>Réinitialisation de mot de passe</h2>
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
      <a href="${resetUrl}" style="background: #0095f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Réinitialiser mon mot de passe
      </a>
      <p>Ce lien expire dans 1 heure.</p>
      <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
    `
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Email réellement envoyé à:', email);
  return info;
};

module.exports = { sendResetEmail };