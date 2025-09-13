import passport from 'passport';

export const authenticate = (req, res, next) => {
    console.log('🔐 [Auth] Verificando autenticación JWT');
    
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            console.error('❌ [Auth] Error en autenticación:', err.message);
            return res.status(500).json({
                status: 'error',
                message: 'Error interno de autenticación'
            });
        }
        
        if (!user) {
            console.log('❌ [Auth] Token inválido o usuario no encontrado');
            console.log('❌ [Auth] Info:', info);
            return res.status(401).json({
                status: 'error',
                message: 'No autenticado - Token inválido'
            });
        }
        
        console.log('✅ [Auth] Usuario autenticado:', user.email);
        req.user = user;
        next();
    })(req, res, next);
};

// Middleware de autorización por roles
export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        console.log('👮 [Auth] Verificando autorización para roles:', allowedRoles);
        
        if (!req.user) {
            console.log('❌ [Auth] No hay usuario autenticado');
            return res.status(401).json({
                status: 'error',
                message: 'No autenticado'
            });
        }
        
        if (allowedRoles.length === 0) {
            console.log('✅ [Auth] Sin restricciones de rol');
            return next();
        }
        
        if (!allowedRoles.includes(req.user.role)) {
            console.log('❌ [Auth] Rol no autorizado:', req.user.role);
            return res.status(403).json({
                status: 'error',
                message: 'No tienes permisos para acceder a este recurso'
            });
        }
        
        console.log('✅ [Auth] Rol autorizado:', req.user.role);
        next();
    };
};