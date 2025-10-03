import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from 'dotenv';
import passport from 'passport';
import cookieParser from 'cookie-parser';

import connectDB, { waitForConnection } from './src/config/database.js';
import { configureExpress } from './src/config/express.js';
import { configureHandlebars } from './src/config/handlebars.js';
import { configureWebSockets } from './src/config/websockets.js';
import { initializePassport } from './src/config/passport.js';

import { errorHandler } from './src/utils/CustomErrors.js';
import { notFoundHandler } from './src/middleware/errorHandler.js';

import productsRouter from './src/routes/products.router.js';
import cartsRouter from './src/routes/carts.router.js';
import viewsRouter from './src/routes/views.router.js';
import usersRouter from './src/routes/users.router.js';        
import sessionsRouter from './src/routes/sessions.router.js';
import emailTestRouter from './src/routes/emailTest.router.js';
import ordersRouter from './src/routes/orders.router.js';

import { logger } from './src/utils/logger.js';

dotenv.config();


const startServer = async () => {
    try {
        const app = express();
        const httpServer = createServer(app);
        const io = new Server(httpServer);

        // Middlewares globales
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        app.use(cookieParser());
        
        configureExpress(app);
        configureHandlebars(app);
        
        initializePassport();
        app.use(passport.initialize());

        await connectDB();
        await waitForConnection();

        
        app.set('io', io);
        
        
        // ========================================
        // RUTAS API - DEBEN IR ANTES DE LAS RUTAS DE VISTAS
        // ========================================
        app.use('/api/products', productsRouter);
        app.use('/api/carts', cartsRouter);
        app.use('/api/users', usersRouter);
        app.use('/api/sessions', sessionsRouter);
        app.use('/api/email', emailTestRouter);
        
        // NUEVO: Ruta de órdenes
        app.use('/api/orders', ordersRouter);
        
        
        // ========================================
        // RUTAS DE VISTAS - DESPUÉS DE LAS RUTAS API
        // ========================================
        app.use('/', viewsRouter);
        
        // ========================================
        // WebSockets
        // ========================================
        configureWebSockets(io);
        
        // ========================================
        // ERROR HANDLERS - DEBEN IR AL FINAL
        // ========================================
        
        // 404 - Ruta no encontrada
        app.use('*', notFoundHandler);
        
        //Error handler mejorado
        // Reemplaza el globalErrorHandler antiguo
        app.use(errorHandler);
        
        
        // ========================================
        // INICIAR SERVIDOR
        // ========================================
        const PORT = process.env.PORT || 8080;
        httpServer.listen(PORT, '0.0.0.0', () => {
        });
        
    } catch (error) {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    }
};

// Iniciar el servidor
startServer();