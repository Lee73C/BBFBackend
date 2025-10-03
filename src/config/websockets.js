
import ProductManager from '../managers/ProductManager.js';
import jwt from 'jsonwebtoken';
import UserDAO from '../dao/UserDAO.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_for_dev';

export const configureWebSockets = (io) => {
    const productManager = new ProductManager();
    const userDAO = new UserDAO();
    
    // ✅ MIDDLEWARE DE AUTENTICACIÓN PARA SOCKET.IO
    io.use(async (socket, next) => {
        try {
            
            // Obtener token del handshake
            const token = socket.handshake.auth.token || 
                          socket.handshake.headers.authorization?.replace('Bearer ', '');
            
            if (!token) {
                // Permitir conexión pero marcar como invitado
                socket.user = null;
                socket.isGuest = true;
                return next();
            }
            
            // Verificar token
            const decoded = jwt.verify(token, JWT_SECRET);
            
            // Obtener usuario completo
            const user = await userDAO.findById(decoded.id);
            
            if (!user) {
                return next();
            }
            
            // Guardar info del usuario en el socket
            socket.user = {
                id: user._id.toString(),
                email: user.email,
                role: user.role,
                first_name: user.first_name
            };
            socket.isGuest = false;
            
            next();
        } catch (error) {
            // Permitir conexión como invitado en caso de error
            socket.user = null;
            socket.isGuest = true;
            next();
        }
    });
    
    io.on('connection', (socket) => {
        
        // Enviar productos iniciales (público)
        productManager.getProducts({ limit: 100, status: undefined })
            .then(result => {
                socket.emit('updateProducts', result.payload);
            })
            .catch(error => {
                socket.emit('error', { message: 'Error al cargar productos' });
            });
        
        //  HELPER: Verificar si es admin
        const isAdmin = () => {
            return socket.user && socket.user.role === 'admin';
        };
        
        //  HELPER: Enviar error de autorización
        const sendUnauthorized = (action) => {

            
            socket.emit('error', {
                message: `No tienes permisos para ${action}. Solo administradores pueden realizar esta acción.`,
                code: 'FORBIDDEN',
                action
            });
        };
        
        // ========================================
        // EVENTO: Agregar Producto (SOLO ADMIN)
        // ========================================
        socket.on('addProduct', async (productData) => {
            try {
                // ✅ VERIFICAR PERMISOS
                if (!isAdmin()) {
                    return sendUnauthorized('agregar productos');
                }
                
                
                const newProduct = await productManager.addProduct(productData);
                const result = await productManager.getProducts({ limit: 100, status: undefined });
                
                // Emitir a TODOS los clientes conectados
                io.emit('updateProducts', result.payload);
                
                socket.emit('productAdded', { 
                    success: true, 
                    product: newProduct,
                    message: 'Producto agregado exitosamente'
                });
                
            } catch (error) {
                socket.emit('productAdded', { 
                    success: false, 
                    message: error.message 
                });
            }
        });
        
        // ========================================
        // EVENTO: Actualizar Producto (SOLO ADMIN)
        // ========================================
        socket.on('updateProduct', async (data) => {
            try {
                // VERIFICAR PERMISOS
                if (!isAdmin()) {
                    return sendUnauthorized('actualizar productos');
                }
                
                
                const { productId, productData } = data;
                const updatedProduct = await productManager.updateProductById(productId, productData);
                const result = await productManager.getProducts({ limit: 100, status: undefined });
                
                // Emitir a TODOS los clientes conectados
                io.emit('updateProducts', result.payload);
                
                socket.emit('productUpdated', { 
                    success: true, 
                    product: updatedProduct,
                    message: 'Producto actualizado exitosamente'
                });
                
            } catch (error) {
                socket.emit('productUpdated', { 
                    success: false, 
                    message: error.message 
                });
            }
        });
        
        // ========================================
        // EVENTO: Eliminar Producto (SOLO ADMIN)
        // ========================================
        socket.on('deleteProduct', async (productId) => {
            try {
                //  VERIFICAR PERMISOS
                if (!isAdmin()) {
                    return sendUnauthorized('eliminar productos');
                }
                
                
                await productManager.deleteProductById(productId);
                const result = await productManager.getProducts({ limit: 100, status: undefined });
                
                // Emitir a TODOS los clientes conectados
                io.emit('updateProducts', result.payload);
                
                socket.emit('productDeleted', { 
                    success: true, 
                    productId,
                    message: 'Producto eliminado exitosamente'
                });
                
            } catch (error) {
                socket.emit('error', { 
                    message: error.message 
                });
            }
        });
        
        // ========================================
        // EVENTO: Solicitar productos (Público)
        // ========================================
        socket.on('requestProducts', async () => {
            try {
                
                const result = await productManager.getProducts({ limit: 100, status: undefined });
                socket.emit('updateProducts', result.payload);
                
            } catch (error) {
                socket.emit('error', { message: 'Error al cargar productos' });
            }
        });
        
        // ========================================
        // DESCONEXIÓN
        // ========================================
        socket.on('disconnect', () => {
        });
    });
    
};