import BaseDAO from './BaseDAO.js';
import User from '../models/User.js';
import mongoose from 'mongoose';


class UserDAO extends BaseDAO {
    constructor() {
        super(User);
    }

    async createUser(userData) {
        try {
            // Validar campos requeridos según evaluación
            const requiredFields = ['first_name', 'last_name', 'email', 'password'];
            for (const field of requiredFields) {
                if (!userData[field]) {
                    throw new Error(`El campo ${field} es requerido`);
                }
            }

            // Verificar que el email sea único
            const existingUser = await this.findByEmail(userData.email);
            if (existingUser) {
                throw new Error('El email ya está registrado');
            }

            console.log('📝 [UserDAO] Creando usuario con campos:', Object.keys(userData));
            
            // Crear usuario (la contraseña ya debe venir hasheada desde el service)
            const newUser = await this.create(userData);
            
            // Remover password de la respuesta por seguridad
            const { password, ...userWithoutPassword } = newUser.toObject();
            
            return userWithoutPassword;
        } catch (error) {
            console.error('❌ [UserDAO] Error creando usuario:', error.message);
            throw error;
        }
    }

    async findByEmail(email) {
        try {
            console.log('🔍 [UserDAO] Buscando usuario por email:', email);
            
            const user = await this.findOne({ 
                email: email.toLowerCase() 
            }, 'cart');
            
            if (user) {
                console.log('✅ [UserDAO] Usuario encontrado:', user._id);
            } else {
                console.log('⚠️ [UserDAO] Usuario no encontrado');
            }
            
            return user;
        } catch (error) {
            console.error('❌ [UserDAO] Error buscando por email:', error.message);
            throw error;
        }
    }

    async findByEmailWithPassword(email) {
        try {
            console.log('🔍 [UserDAO] Buscando usuario con password para login:', email);
            
            await this._ensureConnection();
            
            const user = await this.model.findOne({ 
                email: email.toLowerCase() 
            }).populate('cart').exec();
            
            if (user) {
                console.log('✅ [UserDAO] Usuario encontrado para autenticación:', user._id);
                console.log('🔐 [UserDAO] Password hash presente:', !!user.password);
            }
            
            return user;
        } catch (error) {
            console.error('❌ [UserDAO] Error buscando usuario para login:', error.message);
            throw error;
        }
    }

    async findByIdForJWT(userId) {
        try {
            console.log('🎫 [UserDAO] Buscando usuario por ID para JWT:', userId);
            
            const user = await this.findById(userId, 'cart');
            
            // Remover password por seguridad
            const { password, ...userForJWT } = user.toObject();
            
            console.log('✅ [UserDAO] Usuario encontrado para JWT:', {
                id: userForJWT._id,
                email: userForJWT.email,
                role: userForJWT.role
            });
            
            return userForJWT;
        } catch (error) {
            console.error('❌ [UserDAO] Error buscando usuario para JWT:', error.message);
            throw error;
        }
    }

    async existsById(userId) {
        try {
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return false;
            }
            
            const user = await this.model.findById(userId).select('_id').lean();
            return !!user;
        } catch (error) {
            console.error('❌ [UserDAO] Error verificando existencia de usuario:', error.message);
            return false;
        }
    }

    /**
     * Actualizar último login (opcional, para auditoría)
     */
    async updateLastLogin(userId) {
        try {
            console.log('📅 [UserDAO] Actualizando último login:', userId);
            
            return await this.updateById(userId, { 
                lastLogin: new Date() 
            });
        } catch (error) {
            console.error('❌ [UserDAO] Error actualizando último login:', error.message);
            throw error;
        }
    }

    /**
     * Obtener usuarios por rol (útil para administración)
     */
    async findByRole(role) {
        try {
            console.log('👥 [UserDAO] Buscando usuarios por rol:', role);
            
            await this._ensureConnection();
            
            const users = await this.model.find({ role })
                .select('-password') // Excluir password
                .populate('cart')
                .exec();
            
            console.log(`✅ [UserDAO] Encontrados ${users.length} usuarios con rol ${role}`);
            
            return users;
        } catch (error) {
            console.error('❌ [UserDAO] Error buscando por rol:', error.message);
            throw error;
        }
    }
}

export default UserDAO;