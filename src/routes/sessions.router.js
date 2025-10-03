import { Router } from 'express';
import SessionController from '../controllers/SessionController.js';
import passport from "passport";

const router = Router();
const sessionController = new SessionController();

// POST /api/sessions/login - Login con JWT
router.post('/login', (req, res) => {
    sessionController.login(req, res);
});

// POST /api/sessions/logout - Logout
router.post('/logout', (req, res) => {
    sessionController.logout(req, res);
});

// POST /api/sessions/forgot-password - Solicitar reset de contraseña
router.post('/forgot-password', (req, res) => {
    sessionController.requestPasswordReset(req, res);
});

// POST /api/sessions/reset-password - Resetear contraseña con token
router.post('/reset-password', (req, res) => {
    sessionController.resetPassword(req, res);
});

// GET /api/sessions/current - Validar usuario logueado
router.get('/current',
    passport.authenticate('current', { session: false }),
    (req, res) => {
        sessionController.current(req, res);
    }
);

// 🧪 ENDPOINT DE PRUEBA PARA EMAIL
router.post('/test-email', async (req, res) => {
    try {
        
        const { email } = req.body;
        const testEmail = email || 'test@example.com';
        
        
        // Import dinámico del EmailService
        const { default: EmailService } = await import('../services/EmailService.js');
        const emailService = new EmailService();
        
        // Verificar configuración primero
        const configResult = await emailService.verifyEmailConfiguration();
        if (!configResult.success) {
            return res.status(500).json({
                status: 'error',
                message: 'Configuración de email incorrecta',
                details: configResult.message
            });
        }
        
        // Enviar email de prueba
        const result = await emailService.sendTestEmail(testEmail);
        
        if (result.success) {
            res.json({
                status: 'success',
                message: 'Email de prueba enviado correctamente',
                messageId: result.messageId,
                sentTo: testEmail,
                configuration: configResult
            });
        } else {
            res.status(500).json({
                status: 'error',
                message: 'Error enviando email de prueba',
                error: result.error,
                configuration: configResult
            });
        }
        
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// ENDPOINT PARA VERIFICAR CONFIGURACIÓN
router.get('/email-config', async (req, res) => {
    try {
        
        // Import dinámico del EmailService
        const { default: EmailService } = await import('../services/EmailService.js');
        const emailService = new EmailService();
        
        const configResult = await emailService.verifyEmailConfiguration();
        
        res.json({
            status: configResult.success ? 'success' : 'error',
            message: configResult.message || 'Configuración verificada',
            configuration: {
                provider: configResult.provider,
                emailUser: configResult.emailUser,
                emailFrom: configResult.emailFrom,
                hasEmailUser: !!process.env.EMAIL_USER,
                hasEmailPassword: !!(process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_PASSWORD),
                websiteUrl: process.env.WEBSITE_URL,
                nodeEnv: process.env.NODE_ENV
            }
        });
        
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error verificando configuración',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

export default router;