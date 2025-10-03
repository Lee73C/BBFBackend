import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants.js';

// ==========================================
// CLASE BASE: CustomError
// ==========================================

export class CustomError extends Error {
  constructor(
    message,
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    
    // Capturar stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// ==========================================
// ERRORES ESPECÍFICOS
// ==========================================

/**
 * Error 404 - Recurso no encontrado
 */
export class NotFoundError extends CustomError {
  constructor(resource = 'Recurso', id = '') {
    const message = id 
      ? `${resource} con ID ${id} no encontrado`
      : `${resource} no encontrado`;
    super(message, HTTP_STATUS.NOT_FOUND);
  }
}

/**
 * Error 401 - No autenticado
 */
export class AuthenticationError extends CustomError {
  constructor(message = ERROR_MESSAGES.UNAUTHORIZED) {
    super(message, HTTP_STATUS.UNAUTHORIZED);
  }
}

/**
 * Error 403 - No autorizado
 */
export class AuthorizationError extends CustomError {
  constructor(message = ERROR_MESSAGES.FORBIDDEN) {
    super(message, HTTP_STATUS.FORBIDDEN);
  }
}

/**
 * Error 400 - Datos inválidos
 */
export class ValidationError extends CustomError {
  constructor(message = ERROR_MESSAGES.VALIDATION_ERROR, errors = []) {
    super(message, HTTP_STATUS.BAD_REQUEST);
    this.errors = errors;
  }
}

/**
 * Error 409 - Conflicto
 */
export class ConflictError extends CustomError {
  constructor(message) {
    super(message, HTTP_STATUS.CONFLICT);
  }
}

/**
 * Error 422 - Entidad no procesable
 */
export class UnprocessableEntityError extends CustomError {
  constructor(message, errors = []) {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    this.errors = errors;
  }
}

/**
 * Error de lógica de negocio
 */
export class BusinessError extends CustomError {
  constructor(message) {
    super(message, HTTP_STATUS.BAD_REQUEST);
  }
}

/**
 * Error de stock insuficiente
 */
export class InsufficientStockError extends CustomError {
  constructor(productName, available, requested) {
    super(
      `Stock insuficiente para ${productName}. Disponible: ${available}, Solicitado: ${requested}`,
      HTTP_STATUS.BAD_REQUEST
    );
    this.available = available;
    this.requested = requested;
  }
}

/**
 * Error relacionado con órdenes
 */
export class OrderError extends CustomError {
  constructor(message) {
    super(message, HTTP_STATUS.BAD_REQUEST);
  }
}

/**
 * Error de base de datos
 */
export class DatabaseError extends CustomError {
  constructor(message = ERROR_MESSAGES.DATABASE_ERROR) {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, false);
  }
}

// ==========================================
// ASYNC HANDLER
// ==========================================

export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ==========================================
// ERROR HANDLER MIDDLEWARE
// ==========================================

export const errorHandler = (err, req, res, next) => {
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      errors: err.errors || undefined,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      status: 'error',
      message: 'Error de validación',
      errors
    });
  }

  // Error de Cast de Mongoose (ID inválido)
  if (err.name === 'CastError') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      status: 'error',
      message: `ID inválido: ${err.value}`
    });
  }

  // Error de duplicado en MongoDB
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(HTTP_STATUS.CONFLICT).json({
      status: 'error',
      message: `Ya existe un registro con ese ${field}`
    });
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      status: 'error',
      message: 'Token inválido'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      status: 'error',
      message: 'Token expirado'
    });
  }

  // Error genérico (500)
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    status: 'error',
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// ==========================================
// UTILIDADES
// ==========================================

/**
 * Helper para lanzar errores según condición
 */
export const throwIf = (condition, ErrorClass, message) => {
  if (condition) {
    throw new ErrorClass(message);
  }
};

/**
 * Helper para validar ID de MongoDB
 */
export const validateMongoId = (id, resourceName = 'Recurso') => {
  const mongoose = require('mongoose');
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ValidationError(`ID inválido para ${resourceName}`);
  }
};

// ==========================================
// EXPORTS
// ==========================================

export default {
  CustomError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  ConflictError,
  UnprocessableEntityError,
  BusinessError,
  InsufficientStockError,
  OrderError,
  DatabaseError,
  asyncHandler,
  errorHandler,
  throwIf,
  validateMongoId
};