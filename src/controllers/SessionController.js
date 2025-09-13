import UserService from '../services/UserService.js';

class SessionController {
    constructor() {
        this.userService = new UserService();
    }


    async login(req, res) {
        try {
            console.log('🔐 [SessionController] Iniciando proceso de login');
            console.log('📥 [SessionController] Datos recibidos:', {
                email: req.body.email,
                password: req.body.password ? '***' : 'MISSING'
            });

            const { email, password } = req.body;

            // Validación de campos para login
            if (!email || !password) {
                console.log('❌ [SessionController] Faltan credenciales');
                return res.status(400).json({
                    status: 'error',
                    message: 'Email y password son requeridos'
                });
            }

            console.log('🔄 [SessionController] Procesando autenticación...');
            
            // Usar servicio que implementa bcrypt y JWT
            const result = await this.userService.loginUser(email, password);

            console.log('✅ [SessionController] Login exitoso - Token JWT generado');
            
            // Respuesta con token JWT válido
            res.json({
                status: 'success',
                message: 'Login exitoso',
                payload: {
                    token: result.token,
                    user: result.user
                }
            });

        } catch (error) {
            console.error('❌ [SessionController] Error en login:', error.message);
            
            // Manejo de errores de autenticación
            res.status(401).json({
                status: 'error',
                message: 'Credenciales inválidas'
            });
        }
    }

    async logout(req, res) {
        try {
            console.log('🚪 [SessionController] Procesando logout');
            
            res.json({
                status: 'success',
                message: 'Logout exitoso - Por favor elimina el token del cliente'
            });
        } catch (error) {
            console.error('❌ [SessionController] Error en logout:', error.message);
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }

    async current(req, res) {
        try {
            console.log('👤 [SessionController] Procesando /current');
            console.log('🎫 [SessionController] Usuario del JWT:', {
                id: req.user._id,
                email: req.user.email,
                role: req.user.role
            });

            // Verificar que el usuario esté autenticado
            if (!req.user) {
                console.log('❌ [SessionController] No hay usuario en el token');
                return res.status(401).json({
                    status: 'error',
                    message: 'No autorizado - Token inválido o inexistente'
                });
            }

            console.log('✅ [SessionController] Usuario validado correctamente');
            
            // Devolver datos del usuario asociados al JWT
            res.json({
                status: 'success',
                message: 'Usuario validado correctamente',
                payload: req.user
            });

        } catch (error) {
            console.error('❌ [SessionController] Error en /current:', error.message);
            res.status(500).json({
                status: 'error',
                message: 'Error interno del servidor'
            });
        }
    }
}

export default SessionController;