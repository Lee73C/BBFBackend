
import ProductManager from '../managers/ProductManager.js';

class ProductRepository {
    constructor() {
        this.productManager = new ProductManager();
    }

    /**
     * Obtener productos con filtros y paginación
     */
    async getProducts(options = {}) {
        try {
            return await this.productManager.getProducts(options);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener producto por ID
     */
    async getProductById(productId) {
        try {
            return await this.productManager.getProductById(productId);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Crear producto
     */
    async createProduct(productData) {
        try {
            return await this.productManager.addProduct(productData);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Actualizar producto
     */
    async updateProduct(productId, updateData) {
        try {
            return await this.productManager.updateProductById(productId, updateData);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Eliminar producto
     */
    async deleteProduct(productId) {
        try {
            return await this.productManager.deleteProductById(productId);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Buscar productos
     */
    async searchProducts(searchTerm, options = {}) {
        try {
            return await this.productManager.searchProducts(searchTerm, options);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener categorías
     */
    async getCategories() {
        try {
            return await this.productManager.getCategories();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener productos relacionados
     */
    async getRelatedProducts(productId, limit = 4) {
        try {
            return await this.productManager.getRelatedProducts(productId, limit);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener estadísticas
     */
    async getProductStats() {
        try {
            return await this.productManager.getProductStats();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Verificar stock disponible
     */
    async checkStock(productId, requestedQuantity) {
        try {
            const product = await this.getProductById(productId);
            
            return {
                available: product.stock >= requestedQuantity,
                stock: product.stock,
                requested: requestedQuantity,
                product: product
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Actualizar stock de múltiples productos (para órdenes)
     */
    async updateStockBatch(updates) {
        try {

            const results = [];
            for (const update of updates) {
                const product = await this.getProductById(update.productId);
                product.stock -= update.quantity;
                await product.save();
                results.push(product);
            }
            
            return results;
        } catch (error) {
            throw error;
        }
    }
}

export default ProductRepository;