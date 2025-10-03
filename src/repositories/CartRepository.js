
import BaseRepository from './BaseRepository.js';
import CartDAO from '../dao/CartDAO.js';

class CartRepository extends BaseRepository {
    constructor() {
        const cartDAO = new CartDAO();
        super(cartDAO);
    }

    /**
     * Crear carrito vacío
     */
    async createEmptyCart() {
        try {
            return await this.dao.createEmptyCart();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Obtener carrito con productos populados
     */
    async getCartWithProducts(cartId) {
        try {
            return await this.dao.getCartWithProducts(cartId);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Agregar producto al carrito
     */
    async addProductToCart(cartId, productId, quantity = 1) {
        try {
            
            // Si usas CartManager en lugar de DAO directamente
            const CartManager = (await import('../managers/CartManager.js')).default;
            const cartManager = new CartManager();
            
            return await cartManager.addProductToCart(cartId, productId);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Actualizar cantidad de producto
     */
    async updateProductQuantity(cartId, productId, quantity) {
        try {           
            const CartManager = (await import('../managers/CartManager.js')).default;
            const cartManager = new CartManager();
            
            return await cartManager.updateProductQuantity(cartId, productId, quantity);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Eliminar producto del carrito
     */
    async removeProductFromCart(cartId, productId) {
        try {
            
            const CartManager = (await import('../managers/CartManager.js')).default;
            const cartManager = new CartManager();
            
            return await cartManager.removeProductFromCart(cartId, productId);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Vaciar carrito
     */
    async clearCart(cartId) {
        try {
            
            const CartManager = (await import('../managers/CartManager.js')).default;
            const cartManager = new CartManager();
            
            return await cartManager.clearCart(cartId);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Calcular total del carrito
     */
    async getCartTotal(cartId) {
        try {
            const cart = await this.getCartWithProducts(cartId);
            return await cart.calculateTotal();
        } catch (error) {
            throw error;
        }
    }
}

export default CartRepository;
