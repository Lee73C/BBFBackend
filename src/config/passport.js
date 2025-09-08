import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import passport from 'passport';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'secret_for_dev';

export const initializePassport = () => {
  // Estrategia JWT principal
  const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET,
  };

  passport.use('jwt', new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
      const user = await User.findById(jwt_payload.id)
        .select('-password')
        .populate('cart')
        .lean();
      
      if (!user) {
        return done(null, false, { message: 'Usuario no encontrado' });
      }
      
      return done(null, user);
    } catch (err) {
      console.error('Error en estrategia JWT:', err);
      return done(err, false);
    }
  }));

  passport.use('current', new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
      // Validar que el token tiene la información necesaria
      if (!jwt_payload.id) {
        return done(null, false, { message: 'Token inválido' });
      }
      
      // Buscar usuario y devolver sus datos asociados al JWT
      const user = await User.findById(jwt_payload.id)
        .select('-password')
        .populate('cart')
        .lean();
      
      if (!user) {
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
        jwt_issued_at: new Date(jwt_payload.iat * 1000),
        jwt_expires_at: new Date(jwt_payload.exp * 1000)
      };
      
      return done(null, userData);
    } catch (err) {
      console.error('Error en estrategia CURRENT:', err);
      return done(err, false);
    }
  }));
};