import UserService from '../services/UserService.js'; 

class UserController {
    constructor() {
        this.userService = new UserService();
    }
    
    async register(req, res) {
        try {

            const { first_name, last_name, email, age, password } = req.body;

            // Validación de campos requeridos del modelo User
            if (!first_name || !last_name || !email || !password) {
                return res.status(400).json({
                    status: 'error',
                    message: 'first_name, last_name, email y password son obligatorios',
                    missingFields: {
                        first_name: !first_name,
                        last_name: !last_name,
                        email: !email,
                        password: !password
                    }
                });
            }

            const userData = {
                first_name,
                last_name,
                email,
                age: age ? Number(age) : undefined,
                password,
                role: 'user'
            };

            const result = await this.userService.registerUser(userData);

            res.status(201).json({
                status: 'success',
                message: 'Usuario registrado exitosamente',
                payload: result.user
            });

        } catch (error) {
            // Manejo específico de errores para la evaluación
            if (error.message.includes('ya está registrado')) {
                return res.status(409).json({
                    status: 'error',
                    message: 'El email ya está registrado'
                });
            }
            
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    async getUserById(req, res) {
        try {
            const { id } = req.params;
            
            // Verificar autorización
            const requesterId = req.user._id || req.user.id;
            if (req.user.role !== 'admin' && requesterId.toString() !== id) {
                return res.status(403).json({
                    status: 'error',
                    message: 'No tienes permiso para ver este usuario'
                });
            }

            const result = await this.userService.getCurrentUser(id);

            res.json({
                status: 'success',
                payload: result.user
            });

        } catch (error) {
            res.status(404).json({
                status: 'error',
                message: error.message
            });
        }
    }
}

export default UserController;