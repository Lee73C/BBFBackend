import BaseRepository from './BaseRepository.js';
import UserDAO from '../dao/UserDAO.js';
import UserDTO from '../dto/UserDTO.js';
import CurrentUserDTO from '../dto/CurrentUserDTO.js';

class UserRepository extends BaseRepository {
    constructor() {
        const userDAO = new UserDAO();
        super(userDAO);
    }

    /**
     * Crear usuario y retornar DTO
     */
    async createUser(userData) {
        try {
            
            const user = await this.dao.createUser(userData);
            
            // Retornar DTO sin información sensible
            return UserDTO.fromUser(user);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Buscar usuario por email (con password para login)
     */
    async findByEmailWithPassword(email) {
        try {
            
            // Para login necesitamos el password
            return await this.dao.findByEmailWithPassword(email);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Buscar usuario por email (sin password)
     */
    async findByEmail(email) {
        try {
            
            const user = await this.dao.findByEmail(email);
            
            if (!user) return null;
            
            // Retornar DTO sin información sensible
            return UserDTO.fromUser(user);
        } catch (error) {
            throw error;
        }
    }

    async getCurrentUser(userId) {
        try {
            
            const user = await this.dao.findByIdForJWT(userId);
            
            if (!user) {
                throw new Error('Usuario no encontrado');
            }
            
            return CurrentUserDTO.fromUser(user);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Buscar usuario por ID para JWT (sin password)
     */
    async findByIdForJWT(userId) {
        try {
 
            const user = await this.dao.findByIdForJWT(userId);
            
            // Ya viene sin password del DAO
            return user;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Actualizar usuario
     */
    async updateUser(userId, updateData) {
        try {
            const user = await this.dao.updateById(userId, updateData);
            
            // Retornar DTO sin información sensible
            return UserDTO.fromUser(user);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Verificar si usuario existe
     */
    async existsById(userId) {
        try {
            return await this.dao.existsById(userId);
        } catch (error) {
            return false;
        }
    }

    /**
     * Actualizar último login
     */
    async updateLastLogin(userId) {
        try {
            
            return await this.dao.updateLastLogin(userId);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Buscar usuarios por rol (para administración)
     */
    async findByRole(role) {
        try {
            
            const users = await this.dao.findByRole(role);
            
            // Retornar array de DTOs sin información sensible
            return UserDTO.fromUsers(users);
        } catch (error) {
            throw error;
        }
    }
}

export default UserRepository;