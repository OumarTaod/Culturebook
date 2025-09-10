/**
 * Wrapper pour gérer les exceptions dans les fonctions asynchrones
 * et éviter d'utiliser try/catch dans chaque contrôleur
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;