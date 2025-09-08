import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from 'dotenv';
import passport from 'passport';
import cookieParser from 'cookie-parser';

// Configuraciones
import connectDB, { waitForConnection } from './src/config/database.js';
import { configureExpress } from './src/config/express.js';
import { configureHandlebars } from './src/config/handlebars.js';
import { configureWebSockets } from './src/config/websockets.js';
import { initializePassport } from './src/config/passport.js';

// Middleware
import { globalErrorHandler, notFoundHandler } from './src/middleware/errorHandler.js';

// Rutas
import productsRouter from './src/routes/products.router.js';
import cartsRouter from './src/routes/carts.router.js';
import viewsRouter from './src/routes/views.router.js';
import usersRouter from './src/routes/users.router.js';
import sessionsRouter from './src/routes/sessions.router.js';

// Configurar entorno
dotenv.config();

// Verificar variables de entorno críticas
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('Variables de entorno faltantes:', missingEnvVars);
    process.exit(1);
}

// Función principal asíncrona
const startServer = async () => {
    try {
        const app = express();
        const httpServer = createServer(app);
        const io = new Server(httpServer);

        // Middlewares básicos
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        app.use(cookieParser());
        
        // Configurar Express y Handlebars
        configureExpress(app);
        configureHandlebars(app);
        
        // Conectar a base de datos
        await connectDB();
        await waitForConnection();
        
        // Inicializar Passport
        initializePassport();
        app.use(passport.initialize());
        
        // Configurar rutas
        app.set('io', io);
        app.use('/', viewsRouter);
        app.use('/api/products', productsRouter);
        app.use('/api/carts', cartsRouter);
        app.use('/api/users', usersRouter);
        app.use('/api/sessions', sessionsRouter);
        
        // WebSockets
        configureWebSockets(io);
        
        // Error handlers
        app.use('*', notFoundHandler);
        app.use(globalErrorHandler);
        
        // Ruta de salud del servidor
        app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV,
                uptime: process.uptime()
            });
        });
        
        // Iniciar servidor
        const PORT = process.env.PORT || 8080;
        httpServer.listen(PORT, '0.0.0.0', () => {
            console.log(`Servidor iniciado en puerto ${PORT}`);
            console.log(`Accede desde: http://localhost:${PORT}`);
        });
        
        // Manejo de errores de servidor
        httpServer.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`Puerto ${PORT} ya está en uso`);
            } else {
                console.error('Error del servidor:', error);
            }
            process.exit(1);
        });
        
        // Manejo graceful de shutdown
        const gracefulShutdown = (signal) => {
            httpServer.close(async () => {
                try {
                    const mongoose = await import('mongoose');
                    if (mongoose.default.connection.readyState === 1) {
                        await mongoose.default.connection.close();
                    }
                } catch (error) {
                    console.error('Error cerrando MongoDB:', error);
                }
                process.exit(0);
            });
            
            setTimeout(() => {
                process.exit(1);
            }, 10000);
        };
        
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        
        // Manejo de errores no capturados
        process.on('uncaughtException', (error) => {
            console.error('Excepción no capturada:', error);
            gracefulShutdown('uncaughtException');
        });
        
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Promesa rechazada no manejada:', reason);
            gracefulShutdown('unhandledRejection');
        });
        
    } catch (error) {
        console.error('Error fatal al iniciar servidor:', error.message);
        process.exit(1);
    }
};

// Iniciar el servidor
startServer();