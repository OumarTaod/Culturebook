/**
 * Classe pour gérer les erreurs personnalisées
 * avec un message et un code de statut HTTP
 */
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = ErrorResponse;