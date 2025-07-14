import BaseManager from "./BaseManager.js";

class ProductManager extends BaseManager {
    constructor() {
        super('products.json');
    }

    // Generador de código de barras
    generateBarcode() {
        let barcode = '';
        for (let i = 0; i < 13; i++) {
            barcode += Math.floor(Math.random() * 10);
        }
        return barcode;
    }

    // Agregar producto (sobrescribe el método base para añadir código de barras)
    async addProduct(newProduct) {
        const productWithCode = {
            ...newProduct,
            code: this.generateBarcode()
        };
        return await this.add(productWithCode);
    }

    // Métodos wrapper para mantener compatibilidad con el código existente
    async getProducts() {
        return await this.getAll();
    }

    async deleteProductById(idProduct) {
        return await this.deleteById(idProduct);
    }

    async updateProductById(idProduct, updatedProduct) {
        return await this.updateById(idProduct, updatedProduct);
    }
}

export default ProductManager;