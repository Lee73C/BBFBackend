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
            
            // Crear usuario (la contraseña ya debe venir hasheada desde el service)
            const newUser = await this.create(userData);
            
            // Remover password de la respuesta por seguridad
            const { password, ...userWithoutPassword } = newUser.toObject();
            
            return userWithoutPassword;
        } catch (error) {
            throw error;
        }
    }

    async findByEmail(email) {
        try {
            
            const user = await this.findOne({ 
                email: email.toLowerCase() 
            }, 'cart');
            
            
            return user;
        } catch (error) {
            throw error;
        }
    }

    async findByEmailWithPassword(email) {
        try {
            
            await this._ensureConnection();
            
            const user = await this.model.findOne({ 
                email: email.toLowerCase() 
            }).populate('cart').exec();
            
            return user;
        } catch (error) {
            throw error;
        }
    }

    async findByIdForJWT(userId) {
        try {
            
            const user = await this.findById(userId, 'cart');
            
            // Remover password por seguridad
            const { password, ...userForJWT } = user.toObject();
            
            
            return userForJWT;
        } catch (error) {
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
            return false;
        }
    }

    /**
     * Actualizar usuario por ID (necesario para reset password)
     */
    async updateById(userId, updateData) {
        try {
            
            await this._ensureConnection();
            
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                throw new Error(`ID inválido: ${userId}`);
            }
            
            const updated = await this.model.findByIdAndUpdate(
                userId,
                updateData,
                { new: true, runValidators: true }
            );
            
            if (!updated) {
                throw new Error(`Usuario con ID ${userId} no encontrado`);
            }
            
            return updated;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Actualizar último login (opcional, para auditoría)
     */
    async updateLastLogin(userId) {
        try {
            
            return await this.updateById(userId, { 
                lastLogin: new Date() 
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener usuarios por rol
     */
    async findByRole(role) {
        try {
            
            await this._ensureConnection();
            
            const users = await this.model.find({ role })
                .select('-password') // Excluir password
                .populate('cart')
                .exec();
            
            
            return users;
        } catch (error) {
            throw error;
        }
    }
}

export default UserDAO;