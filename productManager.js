import fs from "fs";

class ProductManager {

    constructor(pathFile) {
        this.pathFile = pathFile;
    }
    //Generador de ID
    generateNewId(products) {
        if (products.length > 0) {
            return products[products.length - 1].id + 1;
        } else {
            return 1;
        }
    }

    //Generador de Code
    generateBarcode() {
        let barcode = '';
        for (let i = 0; i < 13; i++) {
            barcode += Math.floor(Math.random() * 10);
        }
        return barcode;
    }

    //Agregar un nuevo producto
    async addProduct(newProduct) {
        try {
            const fileData = await fs.promises.readFile(this.pathFile, "utf-8");
            const products = JSON.parse(fileData);

            const newId = this.generateNewId(products);
            const code = this.generateBarcode();
            const product = {
                id: newId,
                ...newProduct,
                code: code
            };
            products.push(product);

            await fs.promises.writeFile(this.pathFile, JSON.stringify(products, null, 2), "utf-8");
            return products;
        } catch (error) {
            await fs.promises.writeFile(this.pathFile, JSON.stringify([product], null, 2), "utf-8");
            return [product];
        }
        throw new Error("Error al agregar el nuevo producto");
    }
    
    //Obtener productos
    async getProducts(){
        try {
            const fileData = await fs.promises.readFile(this.pathFile, "utf-8");
            const products = JSON.parse(fileData);

            return products;
        } catch (error) {
            throw new Error("Error al cargar los productos")
        }
    }

    //Eliminar un producto
    async deleteProductById(idProduct){
        try {
            const fileData = await fs.promises.readFile(this.pathFile, 'utf-8');
            const data = JSON.parse(fileData);
            const productIndex = data.findIndex((prod) => prod.id === parseInt(idProduct));

            if (productIndex === -1) throw new Error(`Producto con id: ${idProduct} no encontrado`);
            data.splice(productIndex, 1);

            await fs.promises.writeFile(this.pathFile, JSON.stringify(data, null, 2), 'utf-8');

            return data;
        } catch (error) {
            throw new Error(`Error al eliminar el producto: ${error.message}`);
        }
    }

    //Actualizar un producto
    async updateProductById(idProduct, updatedProduct){
        try {
            const fileData = await fs.promises.readFile(this.pathFile, 'utf-8');
            const data = JSON.parse(fileData);
            const productIndex = data.findIndex((prod) => prod.id === parseInt(idProduct));
            if (productIndex === -1) throw new Error(`Producto con id: ${idProduct} no encontrado`);

            data[productIndex] = { ...data[productIndex], ...updatedProduct };
            await fs.promises.writeFile(this.pathFile, JSON.stringify(data, null, 2), 'utf-8');
            return data;

        } catch (error) {
            throw new Error(`Error al actualizar el producto: ${error.message}`);
        }
    }
}

export default ProductManager;

