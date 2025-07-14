import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { engine } from 'express-handlebars';
import path from 'path';

// Importar routers
import productsRouter from './src/routes/products.router.js';
import cartsRouter from './src/routes/carts.router.js';
import viewsRouter from './src/routes/views.router.js';

// Importar managers para WebSockets
import ProductManager from "./src/managers/ProductManager.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Para servir archivos estáticos

// Configuración de Handlebars
app.engine('handlebars', engine({
  defaultLayout: 'main',
  layoutsDir: path.join(process.cwd(), 'src/views/layouts'),
  viewsDir: path.join(process.cwd(), 'src/views')
}));

app.set('view engine', 'handlebars');
app.set('views', path.join(process.cwd(), 'src/views'));

// Hacer io accesible en las rutas
app.set('io', io);

// Configurar rutas
app.use('/', viewsRouter);                    // Rutas de vistas (home, realtimeproducts)
app.use('/api/products', productsRouter);     // Rutas de productos
app.use('/api/carts', cartsRouter);           // Rutas de carritos

// CONFIGURACIÓN DE WEBSOCKETS
const productManager = new ProductManager();

io.on('connection', (socket) => {
    console.log('Usuario conectado:', socket.id);
    
    // Enviar productos actuales al cliente recién conectado
    productManager.getProducts().then(products => {
        socket.emit('updateProducts', products);
    });
    
    // Escuchar cuando un cliente se desconecte
    socket.on('disconnect', () => {
        console.log('Usuario desconectado:', socket.id);
    });
    
    // Escuchar eventos desde el cliente
    socket.on('addProduct', async (productData) => {
        try {
            // PROCESAR THUMBNAILS IGUAL QUE EN HTTP
            if (productData.thumbnails && Array.isArray(productData.thumbnails)) {
                productData.thumbnails = productData.thumbnails
                    .filter(filename => filename && filename.trim())
                    .map(filename => {
                        // Si ya tiene /img/, no agregar de nuevo
                        if (filename.startsWith('/img/')) {
                            return filename;
                        }
                        // Si es solo el nombre del archivo, agregar /img/
                        return `/img/${filename.trim()}`;
                    });
            }
            
            const newProduct = await productManager.addProduct(productData);
            const products = await productManager.getProducts();
            io.emit('updateProducts', products);
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    });
    
    socket.on('deleteProduct', async (productId) => {
        try {
            await productManager.deleteProductById(productId);
            const products = await productManager.getProducts();
            io.emit('updateProducts', products);
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    });
});

// Iniciar servidor
httpServer.listen(8080, () => {
    console.log(`Servidor con WebSockets iniciado en puerto 8080`);
});