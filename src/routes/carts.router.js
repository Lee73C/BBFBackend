import { Router } from 'express';
import CartManager from '../managers/CartManager.js';

const router = Router();
const cartManager = new CartManager();

//Crea nuevo carrito
router.post("/", async (req, res) => {
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

//Muestra productos según el ID del carrito
router.get("/:cid", async (req, res) => {
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
router.post("/:cid/product/:pid", async (req, res) => {
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

export default router;