import ProductManager from '../managers/ProductManager.js';

export const configureWebSockets = (io) => {
    const productManager = new ProductManager();
    
    io.on('connection', (socket) => {
        console.log('👤 Usuario conectado:', socket.id);
        
        // Enviar productos iniciales
        productManager.getProducts({ limit: 100, status: undefined })
            .then(result => {
                socket.emit('updateProducts', result.payload);
            })
            .catch(error => {
                socket.emit('error', { message: 'Error al cargar productos' });
            });
        
        // Manejar eventos
        socket.on('addProduct', async (productData) => {
            try {
                const newProduct = await productManager.addProduct(productData);
                const result = await productManager.getProducts({ limit: 100, status: undefined });
                io.emit('updateProducts', result.payload);
                socket.emit('productAdded', { success: true, product: newProduct });
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });
        
        socket.on('updateProduct', async (data) => {
            try {
                const { productId, productData } = data;
                const updatedProduct = await productManager.updateProductById(productId, productData);
                const result = await productManager.getProducts({ limit: 100, status: undefined });
                io.emit('updateProducts', result.payload);
                socket.emit('productUpdated', { success: true, product: updatedProduct });
            } catch (error) {
                socket.emit('productUpdated', { success: false, message: error.message });
            }
        });
        
        socket.on('deleteProduct', async (productId) => {
            try {
                await productManager.deleteProductById(productId);
                const result = await productManager.getProducts({ limit: 100, status: undefined });
                io.emit('updateProducts', result.payload);
                socket.emit('productDeleted', { success: true, productId });
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });
        
        socket.on('disconnect', () => {
            console.log('👋 Usuario desconectado:', socket.id);
        });
    });
};