import nodemailer from 'nodemailer';
import { EMAIL_TEMPLATES } from '../config/constants.js';

class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    initializeTransporter() {
        try {
            
            if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
                return;
            }

            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_APP_PASSWORD
                }
            });
            
        } catch (error) {
            }
    }

    async verifyConnection() {
        if (!this.transporter) {
            return false;
        }

        try {
            await this.transporter.verify();
            return true;
        } catch (error) {
            return false;
        }
    }

    // ==========================================
    // EMAILS DE AUTENTICACIÓN
    // ==========================================

    async sendWelcomeEmail(userEmail, firstName, lastName) {
        if (!this.transporter) {
            return { success: false, message: 'Servicio no inicializado' };
        }

        try {
            
            const html = this.getWelcomeEmailTemplate(firstName, lastName);
            
            const result = await this.transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: userEmail,
                subject: '🎉 ¡Bienvenido a BBFermentos!',
                html
            });

            return {
                success: true,
                messageId: result.messageId,
                message: 'Email de bienvenida enviado'
            };

        } catch (error) {
            return {
                success: false,
                message: 'Error: ' + error.message
            };
        }
    }

    async sendPasswordResetEmail(userEmail, resetToken) {
        if (!this.transporter) {
            return { success: false, message: 'Servicio no inicializado' };
        }

        try {
            
            const resetUrl = `${process.env.WEBSITE_URL || 'http://localhost:8080'}/reset-password/${resetToken}`;
            const html = this.getPasswordResetTemplate(resetUrl);
            
            const result = await this.transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: userEmail,
                subject: '🔐 Recuperación de Contraseña - BBFermentos',
                html
            });

            return {
                success: true,
                messageId: result.messageId,
                message: 'Email de reset enviado'
            };

        } catch (error) {
            return {
                success: false,
                message: 'Error: ' + error.message
            };
        }
    }

    // ==========================================
    // EMAILS DE ÓRDENES
    // ==========================================

    async sendOrderConfirmationEmail(userEmail, firstName, order) {
        if (!this.transporter) {
            return { success: false, message: 'Servicio no inicializado' };
        }

        try {
            
            const html = this.getOrderConfirmationTemplate(firstName, order);
            
            const result = await this.transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: userEmail,
                subject: `✅ Confirmación de Orden ${order.orderNumber} - BBFermentos`,
                html
            });

            return {
                success: true,
                messageId: result.messageId
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    async sendOrderShippedEmail(userEmail, firstName, order) {
        if (!this.transporter) {
            return { success: false, message: 'Servicio no inicializado' };
        }

        try {
            
            const html = this.getOrderShippedTemplate(firstName, order);
            
            const result = await this.transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: userEmail,
                subject: `📦 Tu orden ${order.orderNumber} ha sido enviada - BBFermentos`,
                html
            });

            return {
                success: true,
                messageId: result.messageId
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    async sendOrderDeliveredEmail(userEmail, firstName, order) {
        if (!this.transporter) {
            return { success: false, message: 'Servicio no inicializado' };
        }

        try {
            
            const html = this.getOrderDeliveredTemplate(firstName, order);
            
            const result = await this.transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: userEmail,
                subject: `🎉 Tu orden ${order.orderNumber} ha sido entregada - BBFermentos`,
                html
            });
            return {
                success: true,
                messageId: result.messageId
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    async sendOrderCancelledEmail(userEmail, firstName, order, reason) {
        if (!this.transporter) {
            return { success: false, message: 'Servicio no inicializado' };
        }

        try {
            
            const html = this.getOrderCancelledTemplate(firstName, order, reason);
            
            const result = await this.transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: userEmail,
                subject: `❌ Orden ${order.orderNumber} cancelada - BBFermentos`,
                html
            });

            return {
                success: true,
                messageId: result.messageId
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    async sendPaymentConfirmationEmail(userEmail, firstName, order) {
        if (!this.transporter) {
            return { success: false, message: 'Servicio no inicializado' };
        }

        try {
            
            const html = this.getPaymentConfirmationTemplate(firstName, order);
            
            const result = await this.transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: userEmail,
                subject: `💳 Pago confirmado - Orden ${order.orderNumber} - BBFermentos`,
                html
            });

            return {
                success: true,
                messageId: result.messageId
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // ==========================================
    // TEMPLATES HTML
    // ==========================================

    getWelcomeEmailTemplate(firstName, lastName) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #000; color: white; padding: 30px; text-align: center; }
                    .content { padding: 30px; background: #f9f9f9; }
                    .button { display: inline-block; padding: 12px 30px; background: #000; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 ¡Bienvenido a BBFermentos!</h1>
                    </div>
                    <div class="content">
                        <h2>¡Hola ${firstName} ${lastName}!</h2>
                        <p>Gracias por unirte a nuestra comunidad de productos fermentados de calidad.</p>
                        <p>Tu cuenta ha sido creada exitosamente. Ahora puedes:</p>
                        <ul>
                            <li>✅ Explorar nuestro catálogo completo</li>
                            <li>🛒 Agregar productos a tu carrito</li>
                            <li>📦 Realizar compras fácilmente</li>
                            <li>📋 Ver el historial de tus órdenes</li>
                            <li>🎁 Acceder a ofertas exclusivas</li>
                        </ul>
                        <center>
                            <a href="${process.env.WEBSITE_URL || 'http://localhost:8080'}/products" class="button">
                                Explorar Productos
                            </a>
                        </center>
                        <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                        <p>¡Gracias por elegirnos!</p>
                        <p><strong>El equipo de BBFermentos</strong></p>
                    </div>
                    <div class="footer">
                        <p>BBFermentos - Productos Fermentados de Calidad</p>
                        <p>Este es un email automático, por favor no responder.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    getPasswordResetTemplate(resetUrl) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #dc3545; color: white; padding: 30px; text-align: center; }
                    .content { padding: 30px; background: #f9f9f9; }
                    .button { display: inline-block; padding: 15px 30px; background: #000; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Recuperación de Contraseña</h1>
                    </div>
                    <div class="content">
                        <h2>Restablecimiento de Contraseña</h2>
                        <p>Has solicitado restablecer tu contraseña en BBFermentos.</p>
                        <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
                        <center>
                            <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
                        </center>
                        <p>O copia y pega este enlace en tu navegador:</p>
                        <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px;">
                            ${resetUrl}
                        </p>
                        <div class="warning">
                            <strong>⚠️ Importante:</strong>
                            <ul>
                                <li>Este enlace expirará en <strong>1 hora</strong></li>
                                <li>Solo puede usarse <strong>una vez</strong></li>
                                <li>Si no solicitaste esto, ignora este email</li>
                            </ul>
                        </div>
                    </div>
                    <div class="footer">
                        <p>BBFermentos - Seguridad de tu cuenta</p>
                        <p>Este es un email automático, por favor no responder.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    getOrderConfirmationTemplate(firstName, order) {
        const itemsHtml = order.items.map(item => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">
                    ${item.productSnapshot.title}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">
                    ${item.quantity}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">
                    $${item.price.toLocaleString('es-CL')}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">
                    $${item.subtotal.toLocaleString('es-CL')}
                </td>
            </tr>
        `).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #28a745; color: white; padding: 30px; text-align: center; }
                    .content { padding: 30px; background: #f9f9f9; }
                    .order-number { background: #000; color: white; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; border-radius: 5px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
                    th { background: #f0f0f0; padding: 10px; text-align: left; }
                    .total-row { font-weight: bold; background: #f0f0f0; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ ¡Orden Confirmada!</h1>
                    </div>
                    <div class="content">
                        <h2>¡Gracias por tu compra, ${firstName}!</h2>
                        <p>Tu orden ha sido recibida y está siendo procesada.</p>
                        
                        <div class="order-number">
                            Orden: ${order.orderNumber}
                        </div>

                        <h3>📦 Resumen de tu orden:</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th style="text-align: center;">Cantidad</th>
                                    <th style="text-align: right;">Precio</th>
                                    <th style="text-align: right;">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="3" style="padding: 10px; text-align: right;">Subtotal:</td>
                                    <td style="padding: 10px; text-align: right;">$${order.subtotal.toLocaleString('es-CL')}</td>
                                </tr>
                                <tr>
                                    <td colspan="3" style="padding: 10px; text-align: right;">Envío:</td>
                                    <td style="padding: 10px; text-align: right;">$${order.shipping.toLocaleString('es-CL')}</td>
                                </tr>
                                <tr>
                                    <td colspan="3" style="padding: 10px; text-align: right;">Impuestos:</td>
                                    <td style="padding: 10px; text-align: right;">$${order.tax.toLocaleString('es-CL')}</td>
                                </tr>
                                <tr class="total-row">
                                    <td colspan="3" style="padding: 15px; text-align: right; font-size: 18px;">TOTAL:</td>
                                    <td style="padding: 15px; text-align: right; font-size: 18px;">$${order.total.toLocaleString('es-CL')}</td>
                                </tr>
                            </tfoot>
                        </table>

                        <h3>📍 Dirección de envío:</h3>
                        <p>
                            ${order.shippingAddress.street}<br>
                            ${order.shippingAddress.city}, ${order.shippingAddress.state}<br>
                            ${order.shippingAddress.zipCode}<br>
                            Teléfono: ${order.shippingAddress.phone}
                        </p>

                        <h3>💳 Método de pago:</h3>
                        <p>${order.payment.method}</p>

                        <p>Te enviaremos una notificación cuando tu orden sea enviada.</p>
                        <p><strong>¡Gracias por confiar en BBFermentos!</strong></p>
                    </div>
                    <div class="footer">
                        <p>BBFermentos - Productos Fermentados de Calidad</p>
                        <p>¿Preguntas? Contáctanos: ${process.env.EMAIL_USER}</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    getOrderShippedTemplate(firstName, order) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #17a2b8; color: white; padding: 30px; text-align: center; }
                    .content { padding: 30px; background: #f9f9f9; }
                    .tracking-box { background: #fff; border: 2px solid #17a2b8; padding: 20px; margin: 20px 0; border-radius: 5px; text-align: center; }
                    .tracking-number { font-size: 24px; font-weight: bold; color: #17a2b8; margin: 10px 0; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📦 ¡Tu Orden ha sido Enviada!</h1>
                    </div>
                    <div class="content">
                        <h2>¡Buenas noticias, ${firstName}!</h2>
                        <p>Tu orden <strong>${order.orderNumber}</strong> ya está en camino.</p>
                        
                        <div class="tracking-box">
                            <p><strong>Número de seguimiento:</strong></p>
                            <div class="tracking-number">${order.tracking.trackingNumber}</div>
                            <p><strong>Transportista:</strong> ${order.tracking.company}</p>
                            ${order.tracking.estimatedDelivery ? 
                                `<p><strong>Entrega estimada:</strong> ${new Date(order.tracking.estimatedDelivery).toLocaleDateString('es-CL')}</p>` 
                                : ''}
                        </div>

                        <p>Puedes usar este número para rastrear tu envío directamente con el transportista.</p>
                        <p>Te notificaremos cuando tu orden sea entregada.</p>
                        <p><strong>¡Gracias por tu compra!</strong></p>
                    </div>
                    <div class="footer">
                        <p>BBFermentos - Productos Fermentados de Calidad</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    getOrderDeliveredTemplate(firstName, order) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #28a745; color: white; padding: 30px; text-align: center; }
                    .content { padding: 30px; background: #f9f9f9; }
                    .celebration { font-size: 48px; text-align: center; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 ¡Orden Entregada!</h1>
                    </div>
                    <div class="content">
                        <div class="celebration">🎊🎉🎊</div>
                        <h2>¡Tu orden llegó, ${firstName}!</h2>
                        <p>Tu orden <strong>${order.orderNumber}</strong> ha sido entregada exitosamente.</p>
                        <p>Esperamos que disfrutes de tus productos de BBFermentos.</p>
                        <p>Si tienes algún problema con tu orden, por favor contáctanos.</p>
                        <p><strong>¡Gracias por elegirnos!</strong></p>
                    </div>
                    <div class="footer">
                        <p>BBFermentos - Productos Fermentados de Calidad</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    getOrderCancelledTemplate(firstName, order, reason) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #dc3545; color: white; padding: 30px; text-align: center; }
                    .content { padding: 30px; background: #f9f9f9; }
                    .reason-box { background: #fff; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>❌ Orden Cancelada</h1>
                    </div>
                    <div class="content">
                        <h2>Hola ${firstName},</h2>
                        <p>Tu orden <strong>${order.orderNumber}</strong> ha sido cancelada.</p>
                        
                        <div class="reason-box">
                            <strong>Motivo:</strong>
                            <p>${reason}</p>
                        </div>

                        ${order.payment.status === 'approved' ? `
                            <p><strong>Reembolso:</strong> Se procesará el reembolso en los próximos 5-7 días hábiles.</p>
                        ` : ''}

                        <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                        <p>Esperamos verte pronto en BBFermentos.</p>
                    </div>
                    <div class="footer">
                        <p>BBFermentos - Productos Fermentados de Calidad</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    getPaymentConfirmationTemplate(firstName, order) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #28a745; color: white; padding: 30px; text-align: center; }
                    .content { padding: 30px; background: #f9f9f9; }
                    .payment-box { background: #fff; border: 2px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 5px; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>💳 Pago Confirmado</h1>
                    </div>
                    <div class="content">
                        <h2>¡Excelente noticia, ${firstName}!</h2>
                        <p>Tu pago para la orden <strong>${order.orderNumber}</strong> ha sido confirmado exitosamente.</p>
                        
                        <div class="payment-box">
                            <p><strong>Monto pagado:</strong> $${order.total.toLocaleString('es-CL')}</p>
                            <p><strong>Método de pago:</strong> ${order.payment.method}</p>
                            <p><strong>ID de transacción:</strong> ${order.payment.transactionId}</p>
                        </div>

                        <p>Tu orden está siendo procesada y será enviada pronto.</p>
                        <p>Te notificaremos cuando tu pedido sea despachado.</p>
                        <p><strong>¡Gracias por tu compra!</strong></p>
                    </div>
                    <div class="footer">
                        <p>BBFermentos - Productos Fermentados de Calidad</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // ==========================================
    // EMAILS DE TESTING
    // ==========================================

    async sendTestEmail(toEmail) {
        if (!this.transporter) {
            return { success: false, message: 'Servicio no inicializado' };
        }

        try {
            
            const result = await this.transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: toEmail,
                subject: '🧪 Prueba - BBFermentos',
                text: 'Email de prueba desde BBFermentos. ¡El sistema funciona!',
                html: '<h1>🧪 Prueba BBFermentos</h1><p>Email de prueba. ¡El sistema funciona!</p>'
            });
            return {
                success: true,
                messageId: result.messageId,
                message: 'Email enviado correctamente'
            };

        } catch (error) {
            return {
                success: false,
                message: 'Error: ' + error.message
            };
        }
    }

    async verifyEmailConfiguration() {
        try {
            
            const config = {
                hasEmailUser: !!process.env.EMAIL_USER,
                hasEmailPassword: !!process.env.EMAIL_APP_PASSWORD,
                emailUser: process.env.EMAIL_USER || 'No configurado',
                emailFrom: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'No configurado',
                provider: 'gmail'
            };
            
            if (!config.hasEmailUser || !config.hasEmailPassword) {
                return {
                    success: false,
                    message: 'Configuración de email incompleta. Faltan EMAIL_USER o EMAIL_APP_PASSWORD',
                    ...config
                };
            }
            
            const connectionTest = await this.verifyConnection();
            
            return {
                success: connectionTest,
                message: connectionTest ? 'Configuración de email válida' : 'Error de conexión con Gmail',
                ...config
            };
            
        } catch (error) {
            return {
                success: false,
                message: 'Error verificando configuración: ' + error.message
            };
        }
    }
}

const emailService = new EmailService();
export default emailService;