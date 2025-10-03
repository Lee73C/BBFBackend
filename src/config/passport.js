import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import passport from 'passport';
import dotenv from 'dotenv';
import UserRepository from '../repositories/UserRepository.js';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'secret_for_dev';

// Instanciar Repository para usar en estrategias
const userRepository = new UserRepository();


export const initializePassport = () => {

    // Estrategia JWT principal para autenticación
    const jwtOptions = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: JWT_SECRET,
    };

    passport.use('jwt', new JwtStrategy(jwtOptions, async (jwt_payload, done) => {
        try {
            
            // USAR REPOSITORY para buscar usuario
            const user = await userRepository.findByIdForJWT(jwt_payload.id);
            
            if (!user) {
                return done(null, false, { message: 'Usuario no encontrado' });
            }
            
            return done(null, user);
        } catch (err) {
            return done(err, false);
        }
    }));

    // Estrategia "current" para endpoint /api/sessions/current
    passport.use('current', new JwtStrategy(jwtOptions, async (jwt_payload, done) => {
        try {
            
            // Validar que el token tiene la información necesaria
            if (!jwt_payload.id) {
                return done(null, false, { message: 'Token inválido' });
            }
            
            // USAR REPOSITORY para obtener CurrentUserDTO
            // Este método retorna CurrentUserDTO sin información sensible
            const userDTO = await userRepository.getCurrentUser(jwt_payload.id);
            
            if (!userDTO) {
                return done(null, false, { message: 'Usuario no existe' });
            }
            
            // Retornar CurrentUserDTO que NO contiene información sensible
            return done(null, userDTO);
        } catch (err) {
            return done(err, false);
        }
    }));
};