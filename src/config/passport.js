import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import passport from 'passport';
import dotenv from 'dotenv';
import UserDAO from '../dao/UserDAO.js'; // CORREGIDO: default import

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'secret_for_dev';

// Instanciar DAO para usar en estrategias
const userDAO = new UserDAO();


export const initializePassport = () => {
    console.log('🔐 [Passport] Inicializando estrategias para evaluación...');

    // Estrategia JWT principal para autenticación
    const jwtOptions = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: JWT_SECRET,
    };

    passport.use('jwt', new JwtStrategy(jwtOptions, async (jwt_payload, done) => {
        try {
            console.log('🎫 [Passport-JWT] Procesando payload:', {
                id: jwt_payload.id,
                email: jwt_payload.email,
                role: jwt_payload.role
            });
            
            // Usar DAO para buscar usuario
            const user = await userDAO.findByIdForJWT(jwt_payload.id);
            
            if (!user) {
                console.log('❌ [Passport-JWT] Usuario no encontrado');
                return done(null, false, { message: 'Usuario no encontrado' });
            }
            
            console.log('✅ [Passport-JWT] Usuario autenticado:', user.email);
            return done(null, user);
        } catch (err) {
            console.error('❌ [Passport-JWT] Error en estrategia:', err.message);
            return done(err, false);
        }
    }));

    // Estrategia "current" para endpoint /api/sessions/current
    passport.use('current', new JwtStrategy(jwtOptions, async (jwt_payload, done) => {
        try {
            console.log('👤 [Passport-Current] Validando usuario actual:', jwt_payload.id);
            
            // Validar que el token tiene la información necesaria
            if (!jwt_payload.id) {
                console.log('❌ [Passport-Current] Token inválido - falta ID');
                return done(null, false, { message: 'Token inválido' });
            }
            
            // Usar DAO para obtener datos del usuario asociado al JWT
            const user = await userDAO.findByIdForJWT(jwt_payload.id);
            
            if (!user) {
                console.log('❌ [Passport-Current] Usuario no existe');
                return done(null, false, { message: 'Usuario no existe' });
            }
            
            // Devolver datos del usuario asociados al JWT
            const userData = {
                _id: user._id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                age: user.age,
                role: user.role,
                cart: user.cart,
                // Incluir información del JWT para la evaluación
                jwt_issued_at: new Date(jwt_payload.iat * 1000),
                jwt_expires_at: new Date(jwt_payload.exp * 1000)
            };
            
            console.log('✅ [Passport-Current] Usuario validado para /current:', userData.email);
            return done(null, userData);
        } catch (err) {
            console.error('❌ [Passport-Current] Error en estrategia current:', err.message);
            return done(err, false);
        }
    }));

    console.log('✅ [Passport] Estrategias configuradas correctamente');
    console.log('📋 [Passport] Estrategias disponibles: jwt, current');
};