import BaseManager from "./BaseManager.js";
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

class CartManager extends BaseManager {
    constructor() {
        super(Cart); 
    }

    // Crear un carrito 
    async createCart() {
        const newCart = {
            products: []
        };
        return await this.add(newCart);
    }

    // Obtener carrito por ID con populate
    async getCartById(cartId) {
        try {
            const cart = await this.model.findById(cartId).populate('products.product');
            
            if (!cart) {
                throw new Error(`Carrito con id: ${cartId} no encontrado`);
            }
            
            return cart;
        } catch (error) {
            if (error.name === 'CastError') {
                throw new Error(`ID de carrito inválido: ${cartId}`);
            }
            throw new Error(`Error al obtener carrito: ${error.message}`);
        }
    }

    // Tu método original 
    async addProductToCart(cartId, productId) {
        try {
            // Verificar que el producto existe
            const product = await Product.findById(productId);
            if (!product) {
                throw new Error(`Producto con ID ${productId} no encontrado`);
            }

            const cart = await Cart.findById(cartId);
            if (!cart) {
                throw new Error(`Carrito con id: ${cartId} no encontrado`);
            }

            // Buscar si el producto ya existe en el carrito
            const existingProductIndex = cart.products.findIndex(
                item => item.product.toString() === productId
            );

            if (existingProductIndex !== -1) {
                // Si existe, incrementar cantidad en 1 
                cart.products[existingProductIndex].quantity += 1;
            } else {
                // Si no existe, agregar con cantidad 1 
                cart.products.push({
                    product: productId,
                    quantity: 1
                });
            }

            await cart.save();
            
            // Retornar con populate para mantener consistencia
            return await Cart.findById(cartId).populate('products.product');
        } catch (error) {
            if (error.name === 'CastError') {
                throw new Error(`ID inválido`);
            }
            throw new Error(`Error al agregar producto al carrito: ${error.message}`);
        }
    }

    // Métodos adicionales útiles
    async removeProductFromCart(cartId, productId) {
        try {
            const cart = await Cart.findById(cartId);
            if (!cart) {
                throw new Error(`Carrito con id: ${cartId} no encontrado`);
            }

            cart.products = cart.products.filter(
                item => item.product.toString() !== productId
            );

            await cart.save();
            return await Cart.findById(cartId).populate('products.product');
        } catch (error) {
            throw new Error(`Error al eliminar producto del carrito: ${error.message}`);
        }
    }

    async updateProductQuantity(cartId, productId, quantity) {
        try {
            if (quantity <= 0) {
                return await this.removeProductFromCart(cartId, productId);
            }

            const cart = await Cart.findById(cartId);
            if (!cart) {
                throw new Error(`Carrito con id: ${cartId} no encontrado`);
            }

            const productIndex = cart.products.findIndex(
                item => item.product.toString() === productId
            );

            if (productIndex === -1) {
                throw new Error(`Producto no encontrado en el carrito`);
            }

            cart.products[productIndex].quantity = quantity;
            await cart.save();

            return await Cart.findById(cartId).populate('products.product');
        } catch (error) {
            throw new Error(`Error al actualizar cantidad: ${error.message}`);
        }
    }

    async clearCart(cartId) {
        try {
            const cart = await Cart.findById(cartId);
            if (!cart) {
                throw new Error(`Carrito con id: ${cartId} no encontrado`);
            }

            cart.products = [];
            await cart.save();
            
            return cart;
        } catch (error) {
            throw new Error(`Error al limpiar carrito: ${error.message}`);
        }
    }

    // Obtener todos los carritos con populate
    async getAllCarts() {
        try {
            return await this.getAll(null, 'products.product');
        } catch (error) {
            throw new Error(`Error al obtener carritos: ${error.message}`);
        }
    }

    // Calcular total del carrito
    async getCartTotal(cartId) {
        try {
            const cart = await this.getCartById(cartId);
            return await cart.calculateTotal();
        } catch (error) {
            throw new Error(`Error al calcular total: ${error.message}`);
        }
    }
}

export default CartManager;