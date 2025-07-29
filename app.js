import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from 'dotenv';

// Configuraciones
import connectDB, { waitForConnection } from './src/config/database.js';
import { configureExpress } from './src/config/express.js';
import { configureHandlebars } from './src/config/handlebars.js';
import { configureWebSockets } from './src/config/websockets.js';

// Middleware
import { globalErrorHandler, notFoundHandler } from './src/middleware/errorHandler.js';

// Rutas
import productsRouter from './src/routes/products.router.js';
import cartsRouter from './src/routes/carts.router.js';
import viewsRouter from './src/routes/views.router.js';

// Utils
import { logger } from './src/utils/logger.js';

// Configurar entorno
dotenv.config();

// Función principal asíncrona
const startServer = async () => {
    try {
        // Crear aplicación
        const app = express();
        const httpServer = createServer(app);
        const io = new Server(httpServer);

        // Configurar aplicación
        configureExpress(app);
        configureHandlebars(app);

        // CONECTAR BASE DE DATOS ANTES DE CONFIGURAR RUTAS
        console.log('🔌 Conectando a base de datos...');
        await connectDB();
        
        // ESPERAR A QUE LA CONEXIÓN ESTÉ LISTA
        await waitForConnection();
        console.log('✅ Base de datos lista, configurando rutas...');

        // Configurar rutas DESPUÉS de que la DB esté conectada
        app.set('io', io);
        app.use('/', viewsRouter);
        app.use('/api/products', productsRouter);
        app.use('/api/carts', cartsRouter);

        // Configurar WebSockets
        configureWebSockets(io);

        // Manejo de errores
        app.use(globalErrorHandler);
        app.use('*', notFoundHandler);

        // Iniciar servidor
        const PORT = process.env.PORT || 8080;
        httpServer.listen(PORT, '0.0.0.0', () => {
            logger.success(`Servidor iniciado en puerto ${PORT}`);
            logger.info(`Accede desde: http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('💥 Error fatal iniciando servidor:', error);
        process.exit(1);
    }
};

// Iniciar el servidor
startServer();