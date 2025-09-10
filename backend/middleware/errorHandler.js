// Middleware global de gestion des erreurs
module.exports = (err, req, res, next) => {
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Erreur serveur';

  if (process.env.NODE_ENV !== 'test') {
    console.error(err.stack || err);
  }

  res.status(status).json({
    success: false,
    message,
  });
};
