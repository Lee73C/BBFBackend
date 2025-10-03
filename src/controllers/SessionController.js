import UserService from '../services/UserService.js'; 

class SessionController {
    constructor() {
        this.userService = new UserService();
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Validación de campos para login
            if (!email || !password) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Email y password son requeridos'
                });
            }

            // Usar servicio que implementa bcrypt y JWT
            const result = await this.userService.loginUser(email, password);

            res.cookie('bbfermentos_auth_token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 horas
        });

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
            // Manejo de errores de autenticación
            res.status(401).json({
                status: 'error',
                message: 'Credenciales inválidas'
            });
        }
    }

    async logout(req, res) {
        try {

            res.json({
                status: 'success',
                message: 'Logout exitoso - Por favor elimina el token del cliente'
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }

    async current(req, res) {
        try {
            // Verificar que el usuario esté autenticado
            if (!req.user) {
                return res.status(401).json({
                    status: 'error',
                    message: 'No autorizado - Token inválido o inexistente'
                });
            }
            // Responder con CurrentUserDTO sin información sensible
            res.json({
                status: 'success',
                message: 'Usuario validado correctamente',
                payload: req.user 
            });

        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: 'Error interno del servidor'
            });
        }
    }

    // NUEVO: Solicitar reset de contraseña
    async requestPasswordReset(req, res) {
        try {

            const { email } = req.body;

            // Validación de email
            if (!email) {
                return res.status(400).json({
                    status: 'error',
                    message: 'El email es requerido'
                });
            }

            // Validación básica de formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Formato de email inválido'
                });
            }

            const result = await this.userService.requestPasswordReset(email);

            // Siempre devolver el mismo mensaje por seguridad
            res.json({
                status: 'success',
                message: 'Si el email existe en nuestro sistema, recibirás un enlace de restablecimiento'
            });

        } catch (error) {
            // Por seguridad, devolver siempre el mismo mensaje
            res.json({
                status: 'success',
                message: 'Si el email existe en nuestro sistema, recibirás un enlace de restablecimiento'
            });
        }
    }

    // NUEVO: Resetear contraseña
    async resetPassword(req, res) {
        try {

            const { token, newPassword, confirmPassword } = req.body;

            // Validaciones
            if (!token) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Token de restablecimiento requerido'
                });
            }

            if (!newPassword) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Nueva contraseña requerida'
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    status: 'error',
                    message: 'La contraseña debe tener al menos 6 caracteres'
                });
            }

            if (newPassword !== confirmPassword) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Las contraseñas no coinciden'
                });
            }

            const result = await this.userService.resetPassword(token, newPassword);

            res.json({
                status: 'success',
                message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.'
            });

        } catch (error) {
            // Manejo específico de errores
            if (error.message.includes('igual a la contraseña actual') ||
                error.message.includes('no puede ser igual')) {
                return res.status(400).json({
                    status: 'error',
                    message: 'La nueva contraseña no puede ser igual a tu contraseña actual'
                });
            }

            if (error.message.includes('inválido') || error.message.includes('expirado')) {
                return res.status(400).json({
                    status: 'error',
                    message: error.message
                });
            }

            res.status(500).json({
                status: 'error',
                message: error.message || 'Error interno del servidor'
            });
        }
    }

    // Endpoint para pruebas de email
    async sendTestEmail(req, res) {
        try {

            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Email requerido para prueba'
                });
            }

            const result = await this.userService.sendTestEmail(email);

            if (result.success) {
                res.json({
                    status: 'success',
                    message: 'Email de prueba enviado exitosamente',
                    messageId: result.messageId
                });
            } else {
                res.status(500).json({
                    status: 'error',
                    message: 'Error enviando email de prueba: ' + result.error
                });
            }

        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }
}

export default SessionController;