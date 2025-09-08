import { Router } from 'express';
import bcrypt from 'bcrypt';
import { createUser, findByEmail, findById, updateUser, deleteUser } from '../services/UserService.js';
import { authenticate, authorize } from '../middleware/auth.js';
import CartManager from '../managers/CartManager.js';
import passport from "passport";

const router = Router();
const SALT_ROUNDS = 10;
const cartManager = new CartManager();

// Registro
router.post('/register', async (req, res, next) => {
  try {
    const { first_name, last_name, email, age, password } = req.body;

    // Validación de campos requeridos
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'first_name, last_name, email y password son obligatorios' 
      });
    }

    // Verificar que el email no exista
    const existingUser = await findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ 
        status: 'error', 
        message: 'El email ya está registrado' 
      });
    }

    // IMPORTANTE: Crear carrito para el nuevo usuario
    console.log('Creando carrito para nuevo usuario...');
    const newCart = await cartManager.createCart();
    console.log('Carrito creado con ID:', newCart._id);

    // Encriptar contraseña con bcrypt.hashSync
    const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);

    // Crear objeto de usuario con todos los campos
    const userData = {
      first_name,
      last_name,
      email,
      age: age ? Number(age) : undefined,
      password: hashedPassword,
      cart: newCart._id, // Asignar el carrito creado
      role: 'user' // Rol por defecto
    };

    // Crear usuario en la base de datos
    const newUser = await createUser(userData);

    // Respuesta sin incluir la contraseña
    const userResponse = {
      _id: newUser._id,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      email: newUser.email,
      age: newUser.age,
      role: newUser.role,
      cart: newUser.cart
    };

    res.status(201).json({ 
      status: 'success',
      message: 'Usuario registrado exitosamente',
      payload: userResponse 
    });
    
  } catch (err) {
    console.error('Error en registro:', err);
    next(err);
  }
});

// Obtener usuario por ID (protegido)
router.get('/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      // Verificar autorización
      const requesterId = req.user._id || req.user.id;
      const targetId = req.params.id;
      
      if (req.user.role !== 'admin' && requesterId.toString() !== targetId) {
        return res.status(403).json({ 
          status: 'error', 
          message: 'No tienes permiso para ver este usuario' 
        });
      }

      const user = await findById(targetId);
      if (!user) {
        return res.status(404).json({ 
          status: 'error', 
          message: 'Usuario no encontrado' 
        });
      }

      // Respuesta sin contraseña
      const { password, ...userResponse } = user;
      res.json({ 
        status: 'success', 
        payload: userResponse 
      });
    } catch (err) {
      next(err);
    }
  }
);

// Actualizar usuario (solo admin o el mismo usuario)
router.put('/:id',
  passport.authenticate('jwt', { session: false }),
  async (req, res, next) => {
    try {
      const requesterId = req.user._id || req.user.id;
      const targetId = req.params.id;
      
      // Solo admin o el mismo usuario puede actualizar
      if (req.user.role !== 'admin' && requesterId.toString() !== targetId) {
        return res.status(403).json({ 
          status: 'error', 
          message: 'No autorizado para actualizar este usuario' 
        });
      }

      const updateData = { ...req.body };
      
      // Si se actualiza la contraseña, hashearla con bcrypt.hashSync
      if (updateData.password) {
        updateData.password = bcrypt.hashSync(updateData.password, SALT_ROUNDS);
      }

      const updatedUser = await updateUser(targetId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ 
          status: 'error', 
          message: 'Usuario no encontrado' 
        });
      }

      // Respuesta sin contraseña
      const { password, ...userResponse } = updatedUser.toObject ? 
        updatedUser.toObject() : updatedUser;
      
      res.json({ 
        status: 'success',
        message: 'Usuario actualizado exitosamente',
        payload: userResponse 
      });
    } catch (err) {
      next(err);
    }
  }
);

// Eliminar usuario (solo admin)
router.delete('/:id',
  passport.authenticate('jwt', { session: false }),
  authorize('admin'),
  async (req, res, next) => {
    try {
      const deletedUser = await deleteUser(req.params.id);
      if (!deletedUser) {
        return res.status(404).json({ 
          status: 'error', 
          message: 'Usuario no encontrado' 
        });
      }

      res.json({ 
        status: 'success', 
        message: 'Usuario eliminado exitosamente' 
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;