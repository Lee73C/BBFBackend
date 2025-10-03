import { Router } from 'express';
import emailService from '../services/EmailService.js';
import UserService from '../services/UserService.js';

const router = Router();
const userService = new UserService();

// GET /api/email/status - Estado del servicio de email
router.get('/status', async (req, res) => {
    try {
        const hasConfig = !!(process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD);
        const connectionTest = hasConfig ? await emailService.verifyConnection() : false;
        
        res.json({
            status: 'success',
            emailService: {
                configured: hasConfig,
                connected: connectionTest,
                emailUser: process.env.EMAIL_USER || 'No configurado',
                emailFrom: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'No configurado',
                lastCheck: new Date().toISOString()
            },
            environment: {
                nodeEnv: process.env.NODE_ENV || 'development',
                websiteUrl: process.env.WEBSITE_URL || 'http://localhost:8080'
            }
        });
        
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error obteniendo estado del servicio: ' + error.message
        });
    }
});

// GET /api/email/test - Probar configuración de email
router.get('/test', async (req, res) => {
    try {
        const result = await userService.checkEmailConfiguration();
        
        res.json({
            status: result.success ? 'success' : 'error',
            message: result.message,
            timestamp: new Date().toISOString(),
            emailConfig: {
                emailUser: process.env.EMAIL_USER || 'No configurado',
                emailFrom: process.env.EMAIL_FROM || 'No configurado',
                hasPassword: !!process.env.EMAIL_APP_PASSWORD
            }
        });
        
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error probando configuración: ' + error.message
        });
    }
});

// POST /api/email/send-test - Enviar email de prueba
router.post('/send-test', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                status: 'error',
                message: 'Email de destino es requerido'
            });
        }
        
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                status: 'error',
                message: 'Formato de email inválido'
            });
        }
        
        const result = await emailService.sendTestEmail(email);
        
        res.json({
            status: result.success ? 'success' : 'error',
            message: result.message,
            messageId: result.messageId || null,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error enviando email de prueba: ' + error.message
        });
    }
});

// POST /api/email/send-welcome - Enviar email de bienvenida manual
router.post('/send-welcome', async (req, res) => {
    try {
        const { email, firstName, lastName } = req.body;
        
        if (!email || !firstName || !lastName) {
            return res.status(400).json({
                status: 'error',
                message: 'Email, firstName y lastName son requeridos'
            });
        }
        
        const result = await emailService.sendWelcomeEmail(email, firstName, lastName);
        
        res.json({
            status: result.success ? 'success' : 'error',
            message: result.message,
            messageId: result.messageId || null,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error enviando email de bienvenida: ' + error.message
        });
    }
});

export default router;