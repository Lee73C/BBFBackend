import passport from 'passport';
import cookieParser from 'cookie-parser';

// ==========================================
// MIDDLEWARE BASE
// ==========================================

/**
 * Autenticación base con Passport JWT
 */
function authenticateJWT(req, res, next) {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).json({
        status: 'error',
        message: 'Error interno de autenticación'
      });
    }
    
    if (!user) {

      return { authenticated: false, user: null, info };
    }
    
    return { authenticated: true, user, info: null };
  })(req, res, next);
}

// ==========================================
// PARA APIs (JSON)
// ==========================================

/**
 * Requiere autenticación para APIs
 */
export const authenticate = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).json({
        status: 'error',
        message: 'Error interno'
      });
    }
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'No autenticado'
      });
    }
    
    req.user = user;
    next();
  })(req, res, next);
};

/**
 * Requiere rol específico
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'No autenticado'
      });
    }
    
    if (roles.length === 0) return next();
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `Acceso denegado - Se requiere: ${roles.join(' o ')}`
      });
    }
    
    next();
  };
};


export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return next();
  }
  
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) {
      return next();
    }
    if (user) {
      req.user = user;
    }
    next();
  })(req, res, next);
};

// ==========================================
// PARA VISTAS (HTML)
// ==========================================

/**
 * Autenticación para vistas (redirige al login)
 */
export const authenticateView = (req, res, next) => {

  // Leer token de cookie
  const token = req.cookies?.bbfermentos_auth_token;
  
  if (!token) {

    const redirectUrl = encodeURIComponent(req.originalUrl);
    return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
  }
    
    // Configurar el header Authorization para que Passport pueda leerlo
    req.headers.authorization = `Bearer ${token}`;

  // Usar passport para autenticar
  passport.authenticate('jwt', { 
    session: false,
  }, (err, user, info) => {
    if (err) {
      return res.redirect('/login?error=auth_error');
    }
    
    if (!user) {
      return res.redirect('/login?error=invalid_token');
    }
    
    req.user = user;
    next();
  })(req, res, next);
};

/**
 * Autorización para vistas (muestra página de error)
 */
export const authorizeView = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.redirect('/login?error=auth_required');
    }
    
    if (roles.length === 0) return next();
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).render('error', {
        title: 'Acceso Denegado',
        status: 403,
        message: 'No tienes permisos suficientes',
        backUrl: '/products'
      });
    }
    
    next();
  };
};

/**
 * Auth opcional para vistas
 */
export const optionalAuthView = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (user) {
      req.user = user;
    }
    next();
  })(req, res, next);
};

// ==========================================
// UTILIDADES ADICIONALES
// ==========================================

/**
 * Verificar propiedad de recurso
 */
export const authorizeOwnerOrAdmin = (resourceIdParam = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'No autenticado'
      });
    }
    
    if (req.user.role === 'admin') return next();
    
    const resourceId = req.params[resourceIdParam];
    const userId = req.user._id?.toString();
    
    if (resourceId === userId) return next();
    
    return res.status(403).json({
      status: 'error',
      message: 'No autorizado'
    });
  };
};

/**
 * Verificar propiedad del carrito
 */
export const authorizeCartOwner = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'No autenticado'
      });
    }
    
    if (req.user.role === 'admin') return next();
    
    const cartId = req.params.cid;
    const userCartId = req.user.cart?.toString();
    
    if (cartId === userCartId) return next();
    
    return res.status(403).json({
      status: 'error',
      message: 'No autorizado para modificar este carrito'
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Error interno'
    });
  }
};

/**
 * Solo para invitados (no autenticados)
 */
export const requireGuest = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) return next();
  
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (user) {
      return res.status(400).json({
        status: 'error',
        message: 'Ya tienes sesión activa'
      });
    }
    next();
  })(req, res, next);
};

export default {
  authenticate,
  authorize,
  optionalAuth,
  authenticateView,
  authorizeView,
  optionalAuthView,
  authorizeOwnerOrAdmin,
  authorizeCartOwner,
  requireGuest
};