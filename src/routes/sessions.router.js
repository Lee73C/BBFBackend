import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { findByEmail } from '../services/UserService.js';
import { authenticate } from '../middleware/auth.js';
import passport from "passport";

dotenv.config();

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret_for_dev';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '24h';

// Login - devuelve token
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Validación de campos
    if (!email || !password) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Email y password son requeridos' 
      });
    }

    // Buscar usuario por email
    const user = await findByEmail(email);
    if (!user) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Credenciales inválidas' 
      });
    }

    // Verificar contraseña con bcrypt
    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Credenciales inválidas' 
      });
    }

    // Generar JWT con los datos del usuario
    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { 
      expiresIn: JWT_EXPIRES 
    });

    // Preparar respuesta sin contraseña
    const userResponse = {
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      age: user.age,
      role: user.role,
      cart: user.cart
    };

    // Responder con el token y datos del usuario
    res.json({ 
      status: 'success', 
      message: 'Login exitoso',
      payload: { 
        token, 
        user: userResponse 
      } 
    });
    
  } catch (err) {
    console.error('Error en login:', err);
    next(err);
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.json({ 
    status: 'success', 
    message: 'Logout exitoso - Por favor elimina el token del cliente' 
  });
});

// Current user - usa el middleware authenticate
router.get('/current', 
  passport.authenticate('current', { session: false }), 
  (req, res) => {
    // Si llegamos aquí, el token es válido y req.user tiene los datos
    if (!req.user) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'No autorizado - Token inválido o inexistente' 
      });
    }

    // Devolver datos del usuario asociados al JWT
    res.json({ 
      status: 'success',
      message: 'Usuario validado correctamente',
      payload: req.user 
    });
  }
);

export default router;