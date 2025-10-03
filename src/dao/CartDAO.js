import BaseDAO from './BaseDAO.js';
import Cart from '../models/Cart.js';


class CartDAO extends BaseDAO {
    constructor() {
        super(Cart);
    }


    async createEmptyCart() {
        try {
            
            const cart = await this.create({
                products: []
            });
            
            return cart;
        } catch (error) {
            throw error;
        }
    }

    async getCartWithProducts(cartId) {
        try {
            
            const cart = await this.findById(cartId, 'products.product');
            return cart;
        } catch (error) {
            throw error;
        }
    }
}

export default CartDAO;