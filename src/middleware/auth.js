import passport from 'passport';

// Middleware de autenticación flexible (soporta headers y cookies)
export const authenticate = (req, res, next) => {
  // Primero intenta con JWT desde headers
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (user) {
      req.user = user;
      return next();
    }
    
    // Si no hay token en headers, intenta con cookies
    passport.authenticate('jwt-cookie', { session: false }, (err2, user2, info2) => {
      if (user2) {
        req.user = user2;
        return next();
      }
      
      // No autenticado
      return res.status(401).json({ 
        status: 'error', 
        message: 'No autenticado' 
      });
    })(req, res, next);
  })(req, res, next);
};

// Middleware de autorización por roles
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'No autenticado' 
      });
    }
    
    if (allowedRoles.length === 0) {
      return next();
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'No tienes permisos para acceder a este recurso' 
      });
    }
    
    next();
  };
};