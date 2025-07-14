import BaseManager from "./BaseManager.js";

class CartManager extends BaseManager {
    constructor() {
        super('carts.json');
    }

    // Crear un carrito
    async createCart() {
        const newCart = {
            products: []
        };
        return await this.add(newCart);
    }

    // Obtener carrito por ID (usa el método heredado)
    async getCartById(cartId) {
        return await this.getById(cartId);
    }

    // Añadir producto al carrito
    async addProductToCart(cartId, productId) {
        try {
            const data = await this.readData();
            const cartIndex = data.findIndex(cart => cart.id === parseInt(cartId));
            
            if (cartIndex === -1) {
                throw new Error(`Carrito con id: ${cartId} no encontrado`);
            }

            const cart = data[cartIndex];
            const existingProductIndex = cart.products.findIndex(
                product => product.product === parseInt(productId)
            );

            if (existingProductIndex !== -1) {
                cart.products[existingProductIndex].quantity += 1;
            } else {
                cart.products.push({
                    product: parseInt(productId),
                    quantity: 1
                });
            }

            await this.writeData(data);
            return cart;
        } catch (error) {
            throw new Error(`Error al agregar producto al carrito: ${error.message}`);
        }
    }
}

export default CartManager;