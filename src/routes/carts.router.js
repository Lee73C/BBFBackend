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

// Eliminar un producto específico del carrito
router.delete("/:cid/product/:pid", async (req, res) => {
    try {
        const { cid, pid } = req.params;
        const updatedCart = await cartManager.removeProductFromCart(cid, pid);
        
        res.json({ 
            status: "success", 
            message: "Producto eliminado del carrito exitosamente",
            cart: updatedCart 
        });
    } catch (error) {
        res.status(500).json({ 
            status: "error", 
            message: error.message 
        });
    }
});

// Actualizar cantidad de un producto en el carrito
router.put("/:cid/product/:pid", async (req, res) => {
    try {
        const { cid, pid } = req.params;
        const { quantity } = req.body;
        
        if (!quantity || quantity < 0) {
            return res.status(400).json({
                status: "error",
                message: "La cantidad debe ser un número positivo"
            });
        }
        
        const updatedCart = await cartManager.updateProductQuantity(cid, pid, parseInt(quantity));
        
        res.json({ 
            status: "success", 
            message: "Cantidad actualizada exitosamente",
            cart: updatedCart 
        });
    } catch (error) {
        res.status(500).json({ 
            status: "error", 
            message: error.message 
        });
    }
});

// Vaciar carrito completo
router.delete("/:cid", async (req, res) => {
    try {
        const { cid } = req.params;
        const clearedCart = await cartManager.clearCart(cid);
        
        res.json({ 
            status: "success", 
            message: "Carrito vaciado exitosamente",
            cart: clearedCart 
        });
    } catch (error) {
        res.status(500).json({ 
            status: "error", 
            message: error.message 
        });
    }
});

// Actualizar carrito completo (reemplazar todos los productos)
router.put("/:cid", async (req, res) => {
    try {
        const { cid } = req.params;
        const { products } = req.body;
        
        if (!Array.isArray(products)) {
            return res.status(400).json({
                status: "error",
                message: "Products debe ser un array"
            });
        }
        
        // Validar formato de productos
        for (const item of products) {
            if (!item.product || !item.quantity || item.quantity < 1) {
                return res.status(400).json({
                    status: "error",
                    message: "Cada producto debe tener 'product' (ID) y 'quantity' (número positivo)"
                });
            }
        }
        
        const cart = await cartManager.getCartById(cid);
        cart.products = products;
        await cart.save();
        
        const updatedCart = await cartManager.getCartById(cid);
        
        res.json({ 
            status: "success", 
            message: "Carrito actualizado exitosamente",
            cart: updatedCart 
        });
    } catch (error) {
        res.status(500).json({ 
            status: "error", 
            message: error.message 
        });
    }
});

// Obtener total del carrito
router.get("/:cid/total", async (req, res) => {
    try {
        const { cid } = req.params;
        const total = await cartManager.getCartTotal(cid);
        
        res.json({ 
            status: "success", 
            total: total 
        });
    } catch (error) {
        res.status(500).json({ 
            status: "error", 
            message: error.message 
        });
    }
});

// Obtener todos los carritos (para admin)
router.get("/", async (req, res) => {
    try {
        const carts = await cartManager.getAllCarts();
        res.json({ 
            status: "success", 
            carts 
        });
    } catch (error) {
        res.status(500).json({ 
            status: "error", 
            message: "Error al obtener carritos", 
            error: error.message 
        });
    }
});

export default router;