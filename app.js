import express from "express";
import ProductManager from "./productManager.js";
import CartManager from "./cartManager.js";

const app = express();
app.use(express.json());

const productManager = new ProductManager("./products.json");
const cartManager = new CartManager("./carts.json");


//Ruta Raiz
app.get("/", (req, res) => {
    res.json({ 
        message: "BBFermentos"
    });
});

//Productos

//Mostrar todos los productos
app.get("/api/products", async (req, res) => {
    try {
        const products = await productManager.getProducts();
        res.json({ status: "success", products });
    } catch (error) {
        res.status(500).json({ 
            status: "error", 
            message: "Error al obtener los productos", 
            error: error.message 
        });
    }
});

//Mostrar el producto por ID
app.get("/api/products/:pid", async (req, res) => {
    try {
        const { pid } = req.params;
        const products = await productManager.getProducts();
        const product = products.find(p => p.id === parseInt(pid));
        
        if (!product) {
            return res.status(404).json({ 
                status: "error", 
                message: `Producto con id: ${pid} no encontrado` 
            });
        }
        
        res.json({ status: "success", product });
    } catch (error) {
        res.status(500).json({ 
            status: "error", 
            message: "Error al obtener el producto", 
            error: error.message 
        });
    }
});

//Agregar nuevo producto
app.post("/api/products", async (req, res) => {
    try {
        const { title, description, price, status = true, stock, category } = req.body;
        
        // Todos los campos son obligatorios, menos ID y Code
        if (!title || !description || !price || !stock || !category) {
            return res.status(400).json({
                status: "error",
                message: "Todos los campos son obligatorios: title, description, price, stock, category"
            });
        }

        const newProduct = {
            title,
            description,
            price,
            status,
            stock,
            category,
            thumbnails: []
        };

        const products = await productManager.addProduct(newProduct);
        res.status(201).json({ status: "success", products });
    } catch (error) {
        res.status(500).json({ 
            status: "error", 
            message: "Error al agregar el producto", 
            error: error.message 
        });
    }
});

//Actualizar producto
app.put("/api/products/:pid", async (req, res) => {
    try {
        const { pid } = req.params;
        const updatedData = req.body;
        
        // Actualiza todo menos el ID y Code
        if (updatedData.id) {
            delete updatedData.id;
        }
        if (updatedData.code) {
            delete updatedData.code;
        }
        
        const products = await productManager.updateProductById(pid, updatedData);
        res.json({ status: "success", products });
    } catch (error) {
        res.status(500).json({ 
            status: "error", 
            message: "Error al actualizar el producto", 
            error: error.message 
        });
    }
});

//Elimina un producto
app.delete("/api/products/:pid", async (req, res) => {
    try {
        const { pid } = req.params;
        const products = await productManager.deleteProductById(pid);
        res.json({ status: "success", products });
    } catch (error) {
        res.status(500).json({ 
            status: "error", 
            message: "Error al eliminar el producto", 
            error: error.message 
        });
    }
});

//Carrito

//Crea nuevo carrito
app.post("/api/carts", async (req, res) => {
    try {
        const newCart = await cartManager.createCart();
        res.status(201).json({ 
            status: "success", 
            message: "Carrito creado exitosamente",
            cart: newCart 
        });
    } catch (error) {
        res.status(500).json({ 
            status: "error", 
            message: "Error al crear el carrito", 
            error: error.message 
        });
    }
});

//Muestra productos segun el ID del carrito
app.get("/api/carts/:cid", async (req, res) => {
    try {
        const { cid } = req.params;
        const cart = await cartManager.getCartById(cid);
        
        res.json({ 
            status: "success", 
            cart 
        });
    } catch (error) {
        res.status(404).json({ 
            status: "error", 
            message: error.message 
        });
    }
});

//Agregar un producto al carrito identificado por ID 
app.post("/api/carts/:cid/product/:pid", async (req, res) => {
    try {
        const { cid, pid } = req.params;
        const updatedCart = await cartManager.addProductToCart(cid, pid);
        
        res.json({ 
            status: "success", 
            message: "Producto agregado al carrito exitosamente",
            cart: updatedCart 
        });
    } catch (error) {
        res.status(500).json({ 
            status: "error", 
            message: error.message 
        });
    }
});

//Ruta no encontrada
app.use("*", (req, res) => {
    res.status(404).json({
        status: "error",
        message: "Ruta no encontrada"
    });
});

//Utilizar un puerto
app.listen(8080, () => {
    console.log(`Servidor iniciado`);
});