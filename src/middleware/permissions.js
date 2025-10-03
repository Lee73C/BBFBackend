import { USER_ROLES, ROLE_PERMISSIONS } from '../config/constants.js';
import { AuthorizationError, NotFoundError } from '../utils/CustomErrors.js';

/**
 * Verificar si un usuario tiene un permiso específico
 */
export function hasPermission(userRole, permission) {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
}


export function requirePermission(permission) {
  return (req, res, next) => {
    
    if (!req.user) {
      throw new AuthorizationError('Usuario no autenticado');
    }
    
    const userRole = req.user.role || USER_ROLES.GUEST;
    
    if (hasPermission(userRole, permission)) {
      return next();
    }
    
    throw new AuthorizationError(
      `No tienes permiso para realizar esta acción. Permiso requerido: ${permission}`
    );
  };
}


export function requireAllPermissions(...permissions) {
  return (req, res, next) => {
    
    if (!req.user) {
      throw new AuthorizationError('Usuario no autenticado');
    }
    
    const userRole = req.user.role || USER_ROLES.GUEST;
    const hasAll = permissions.every(permission => hasPermission(userRole, permission));
    
    if (hasAll) {
      return next();
    }
    
    throw new AuthorizationError(
      `No tienes todos los permisos necesarios para esta acción`
    );
  };
}


export function requireAnyPermission(...permissions) {
  return (req, res, next) => {
    
    if (!req.user) {
      throw new AuthorizationError('Usuario no autenticado');
    }
    
    const userRole = req.user.role || USER_ROLES.GUEST;
    const hasAny = permissions.some(permission => hasPermission(userRole, permission));
    
    if (hasAny) {
      return next();
    }
    
    throw new AuthorizationError(
      `No tienes ninguno de los permisos necesarios para esta acción`
    );
  };
}


export function requireOwnershipOrAdmin(getResourceOwnerId) {
  return async (req, res, next) => {
    try {
      
      if (!req.user) {
        throw new AuthorizationError('Usuario no autenticado');
      }
      
      // Si es admin, permitir acceso
      if (req.user.role === USER_ROLES.ADMIN) {
        return next();
      }
      
      // Obtener ID del propietario del recurso
      const ownerId = await getResourceOwnerId(req);
      
      if (!ownerId) {
        throw new NotFoundError('Recurso');
      }
      
      // Verificar propiedad
      const userId = req.user._id?.toString() || req.user.id?.toString();
      const ownerIdStr = ownerId.toString();
      
      if (userId === ownerIdStr) {
        return next();
      }
      
      throw new AuthorizationError('No tienes permiso para acceder a este recurso');
      
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware para permitir acceso solo a recursos propios
 * 
 * @param {Function} getResourceOwnerId - Función que obtiene el ID del propietario
 * @returns {Function} Middleware de Express
 */
export function requireOwnership(getResourceOwnerId) {
  return async (req, res, next) => {
    try {
      
      if (!req.user) {
        throw new AuthorizationError('Usuario no autenticado');
      }
      
      const ownerId = await getResourceOwnerId(req);
      
      if (!ownerId) {
        throw new NotFoundError('Recurso');
      }
      
      const userId = req.user._id?.toString() || req.user.id?.toString();
      const ownerIdStr = ownerId.toString();
      
      if (userId === ownerIdStr) {
        return next();
      }
      
      throw new AuthorizationError('No tienes permiso para acceder a este recurso');
      
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware para verificar upgrade a premium
 * Bloquea acceso si el usuario no es premium o admin
 */
export function requirePremium(req, res, next) {
  
  if (!req.user) {
    throw new AuthorizationError('Usuario no autenticado');
  }
  
  const userRole = req.user.role;
  
  if (userRole === USER_ROLES.PREMIUM || userRole === USER_ROLES.ADMIN) {
    return next();
  }
  
  throw new AuthorizationError(
    'Esta funcionalidad está disponible solo para usuarios premium. Actualiza tu cuenta para acceder.'
  );
}

/**
 * Helper para verificar si el usuario actual es propietario de un recurso
 */
export function isOwner(userId, resourceOwnerId) {
  if (!userId || !resourceOwnerId) return false;
  return userId.toString() === resourceOwnerId.toString();
}

/**
 * Helper para verificar si el usuario es admin
 */
export function isAdmin(userRole) {
  return userRole === USER_ROLES.ADMIN;
}

/**
 * Helper para verificar si el usuario es premium o admin
 */
export function isPremiumOrAdmin(userRole) {
  return userRole === USER_ROLES.PREMIUM || userRole === USER_ROLES.ADMIN;
}

/**
 * Middleware de rate limiting basado en rol
 * Diferentes límites para diferentes roles
 */
const rateLimitStore = new Map();

export function rolBasedRateLimit(limits = {}) {
  // Límites por defecto
  const defaultLimits = {
    [USER_ROLES.ADMIN]: { requests: 1000, window: 60000 },    // 1000 req/min
    [USER_ROLES.PREMIUM]: { requests: 500, window: 60000 },   // 500 req/min
    [USER_ROLES.USER]: { requests: 100, window: 60000 },      // 100 req/min
    [USER_ROLES.GUEST]: { requests: 20, window: 60000 }       // 20 req/min
  };
  
  const mergedLimits = { ...defaultLimits, ...limits };
  
  return (req, res, next) => {
    const userId = req.user?._id?.toString() || req.ip;
    const userRole = req.user?.role || USER_ROLES.GUEST;
    const limit = mergedLimits[userRole];
    
    const key = `${userId}:${userRole}`;
    const now = Date.now();
    
    // Obtener o crear registro de rate limit
    let userLimit = rateLimitStore.get(key);
    
    if (!userLimit || now - userLimit.resetTime > limit.window) {
      // Resetear contador
      userLimit = {
        count: 0,
        resetTime: now
      };
    }
    
    userLimit.count++;
    rateLimitStore.set(key, userLimit);
    
    // Agregar headers de rate limit
    res.setHeader('X-RateLimit-Limit', limit.requests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit.requests - userLimit.count));
    res.setHeader('X-RateLimit-Reset', new Date(userLimit.resetTime + limit.window).toISOString());
    
    if (userLimit.count > limit.requests) {
      return res.status(429).json({
        status: 'error',
        message: 'Demasiadas solicitudes. Por favor intenta más tarde.',
        retryAfter: Math.ceil((userLimit.resetTime + limit.window - now) / 1000)
      });
    }
    
    next();
  };
}

/**
 * Limpiar rate limit store periódicamente
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now - value.resetTime > 3600000) { // 1 hora
      rateLimitStore.delete(key);
    }
  }
}, 300000); // Cada 5 minutos

export default {
  hasPermission,
  requirePermission,
  requireAllPermissions,
  requireAnyPermission,
  requireOwnershipOrAdmin,
  requireOwnership,
  requirePremium,
  isOwner,
  isAdmin,
  isPremiumOrAdmin,
  rolBasedRateLimit
};