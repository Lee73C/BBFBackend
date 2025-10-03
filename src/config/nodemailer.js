import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();


// Función para crear el transporter según el proveedor
const createTransporter = () => {
    const provider = process.env.EMAIL_PROVIDER || 'gmail';
    
    switch (provider.toLowerCase()) {
        case 'gmail':
            return createGmailTransporter();
        case 'outlook':
            return createOutlookTransporter();
        case 'yahoo':
            return createYahooTransporter();
        case 'mailtrap':
            return createMailtrapTransporter();
        case 'sendgrid':
            return createSendgridTransporter();
        default:
            return createGmailTransporter();
    }
};

// Gmail transporter
const createGmailTransporter = () => {
    
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_APP_PASSWORD;
    
    if (!user || !pass) {
        return null;
    }
    
    // Usar nodemailer.createTransport (sin 'er' al final)
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: user,
            pass: pass
        },
        tls: {
            rejectUnauthorized: false
        }
    });
};


// Mailtrap transporter (para testing)
const createMailtrapTransporter = () => {
    
    const user = process.env.MAILTRAP_USER;
    const pass = process.env.MAILTRAP_PASS;
    
    if (!user || !pass) {
        return null;
    }
    
    return nodemailer.createTransport({
        host: 'sandbox.smtp.mailtrap.io',
        port: 2525,
        auth: {
            user: user,
            pass: pass
        }
    });
};

// SendGrid transporter
const createSendgridTransporter = () => {
    
    const apiKey = process.env.SENDGRID_API_KEY;
    
    if (!apiKey) {
        return null;
    }
    
    return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
            user: 'apikey',
            pass: apiKey
        }
    });
};

// Función para verificar la configuración
const verifyTransporter = async (transporter) => {
    if (!transporter) {
        return false;
    }
    
    try {
        await transporter.verify();
        return true;
    } catch (error) {
        return false;
    }
};

// Función para enviar email
const sendEmail = async (options) => {
    const transporter = createTransporter();
    
    if (!transporter) {
        throw new Error('No se pudo crear el transporter de email');
    }
    
    const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
    };
    
    try {
        const result = await transporter.sendMail(mailOptions);
        return result;
    } catch (error) {
        throw error;
    }
};

// Exportar configuración
const transporter = createTransporter();

export { transporter, sendEmail, verifyTransporter };
export default transporter;