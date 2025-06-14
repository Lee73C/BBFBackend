import fs from "fs";

class CartManager {
    constructor(pathFile) {
        this.pathFile = pathFile;
    }

    //Generador de ID carrito
    generateNewId(carts) {
        if (carts.length > 0) {
            return carts[carts.length - 1].id + 1;
        } else {
            return 1;
        }
    }

    //Crear un carrito
    async createCart() {
        try {
            const fileData = await fs.promises.readFile(this.pathFile, "utf-8");
            const carts = JSON.parse(fileData);

            const newId = this.generateNewId(carts);
            const newCart = {
                id: newId,
                products: []
            };

            carts.push(newCart);
            await fs.promises.writeFile(this.pathFile, JSON.stringify(carts, null, 2), "utf-8");
            
            return newCart;
        } catch (error) {
            throw new Error("Error al crear el carrito");
        }
    }

    //Obtener un carrito segun su ID
    async getCartById(cartId) {
        try {
            const fileData = await fs.promises.readFile(this.pathFile, "utf-8");
            const carts = JSON.parse(fileData);
            
            const cart = carts.find(cart => cart.id === parseInt(cartId));
            if (!cart) {
                throw new Error(`Carrito con id: ${cartId} no encontrado`);
            }
            
            return cart;
        } catch (error) {
            throw new Error(`Error al obtener el carrito: ${error.message}`);
        }
    }

    //Añadir producto al carrito
    async addProductToCart(cartId, productId) {
        try {
            const fileData = await fs.promises.readFile(this.pathFile, "utf-8");
            const carts = JSON.parse(fileData);
            
            const cartIndex = carts.findIndex(cart => cart.id === parseInt(cartId));
            if (cartIndex === -1) {
                throw new Error(`Carrito con id: ${cartId} no encontrado`);
            }

            const cart = carts[cartIndex];
            const existingProductIndex = cart.products.findIndex(
                product => product.product === parseInt(productId)
            );

            if (existingProductIndex !== -1) {
                // Si el producto ya existe, suma la cantidad
                cart.products[existingProductIndex].quantity += 1;
            } else {
                // Si no existe, agrega 1
                cart.products.push({
                    product: parseInt(productId),
                    quantity: 1
                });
            }

            await fs.promises.writeFile(this.pathFile, JSON.stringify(carts, null, 2), "utf-8");
            return cart;
        } catch (error) {
            throw new Error(`Error al agregar producto al carrito: ${error.message}`);
        }
    }
}

export default CartManager;
