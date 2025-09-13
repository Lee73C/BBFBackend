import BaseDAO from './BaseDAO.js';
import Cart from '../models/Cart.js';


class CartDAO extends BaseDAO {
    constructor() {
        super(Cart);
    }


    async createEmptyCart() {
        try {
            console.log('🛒 [CartDAO] Creando carrito vacío para nuevo usuario');
            
            const cart = await this.create({
                products: []
            });
            
            console.log('✅ [CartDAO] Carrito vacío creado:', cart._id);
            return cart;
        } catch (error) {
            console.error('❌ [CartDAO] Error creando carrito vacío:', error.message);
            throw error;
        }
    }

    async getCartWithProducts(cartId) {
        try {
            console.log('🛒 [CartDAO] Obteniendo carrito con productos:', cartId);
            
            const cart = await this.findById(cartId, 'products.product');
            return cart;
        } catch (error) {
            console.error('❌ [CartDAO] Error obteniendo carrito:', error.message);
            throw error;
        }
    }
}

export default CartDAO;