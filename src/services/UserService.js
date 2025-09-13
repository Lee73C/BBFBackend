import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import UserDAO from '../dao/UserDAO.js';
import CartDAO from '../dao/CartDAO.js';


class UserService {
    constructor() {
        this.userDAO = new UserDAO();
        this.cartDAO = new CartDAO();
        this.saltRounds = 10;
    }


    async registerUser(userData) {
        try {
            console.log('👤 [UserService] Iniciando registro de usuario:', userData.email);
            
            // Crear carrito para el usuario
            const cart = await this.cartDAO.createEmptyCart();
            console.log('🛒 [UserService] Carrito creado para usuario:', cart._id);
            
            // Encriptar contraseña con bcrypt.hashSync
            console.log('🔐 [UserService] Encriptando contraseña con bcrypt.hashSync');
            const hashedPassword = bcrypt.hashSync(userData.password, this.saltRounds);
            console.log('✅ [UserService] Contraseña encriptada correctamente');
            
            // Preparar datos del usuario con todos los campos requeridos
            const userToCreate = {
                first_name: userData.first_name,
                last_name: userData.last_name,
                email: userData.email.toLowerCase(),
                age: userData.age || undefined,
                password: hashedPassword, // Password ya hasheado
                cart: cart._id, // Referencia al carrito
                role: userData.role || 'user' // Valor por defecto
            };
            
            console.log('📝 [UserService] Creando usuario con estructura completa');
            const user = await this.userDAO.createUser(userToCreate);
            
            console.log('✅ [UserService] Usuario registrado exitosamente:', user._id);
            
            return {
                status: 'success',
                user: user
            };
        } catch (error) {
            console.error('❌ [UserService] Error en registro:', error.message);
            throw error;
        }
    }


    async loginUser(email, password) {
        try {
            console.log('🔐 [UserService] Iniciando login para:', email);
            
            // Buscar usuario con password
            const user = await this.userDAO.findByEmailWithPassword(email);
            if (!user) {
                console.log('❌ [UserService] Usuario no encontrado');
                throw new Error('Credenciales inválidas');
            }
            
            // Verificar contraseña encriptada
            console.log('🔍 [UserService] Verificando contraseña con bcrypt');
            const isValidPassword = bcrypt.compareSync(password, user.password);
            
            if (!isValidPassword) {
                console.log('❌ [UserService] Contraseña inválida');
                throw new Error('Credenciales inválidas');
            }
            
            console.log('✅ [UserService] Contraseña válida, generando JWT');
            
            // Generar token JWT
            const tokenPayload = {
                id: user._id.toString(),
                email: user.email,
                role: user.role,
                first_name: user.first_name,
                last_name: user.last_name
            };
            
            const token = jwt.sign(
                tokenPayload,
                process.env.JWT_SECRET || 'secret_for_dev',
                { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
            );
            
            console.log('✅ [UserService] Token JWT generado exitosamente');
            
            // Remover password de la respuesta
            const { password: _, ...userResponse } = user.toObject();
            
            return {
                status: 'success',
                token: token,
                user: userResponse
            };
        } catch (error) {
            console.error('❌ [UserService] Error en login:', error.message);
            throw error;
        }
    }

    async getCurrentUser(userId) {
        try {
            console.log('👤 [UserService] Obteniendo usuario actual:', userId);
            
            const user = await this.userDAO.findByIdForJWT(userId);
            
            return {
                status: 'success',
                user: user
            };
        } catch (error) {
            console.error('❌ [UserService] Error obteniendo usuario actual:', error.message);
            throw error;
        }
    }


    async validateUserExists(userId) {
        try {
            return await this.userDAO.existsById(userId);
        } catch (error) {
            console.error('❌ [UserService] Error validando usuario:', error.message);
            return false;
        }
    }
}

export default UserService;