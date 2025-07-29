import { Router } from 'express';
import ProductManager from '../managers/ProductManager.js';
import { validateProductQuery } from '../middleware/queryValidation.js';

const router = Router();
const productManager = new ProductManager();

// GET /api/products - Con validación de query automática
router.get("/", validateProductQuery, async (req, res) => {
    try {
        console.log('📥 GET /api/products con query validado:', req.query);

        const result = await productManager.getProducts(req.query);

        // Formato de respuesta según consigna
        const response = {
            status: "success",
            payload: result.payload,
            totalPages: result.totalPages,
            prevPage: result.prevPage,
            nextPage: result.nextPage,
            page: result.page,
            hasPrevPage: result.hasPrevPage,
            hasNextPage: result.hasNextPage,
            prevLink: result.prevLink,
            nextLink: result.nextLink
        };

        res.json(response);

    } catch (error) {
        console.error('❌ Error en GET /api/products:', error);
        res.status(500).json({
            status: "error",
            payload: [],
            totalPages: 0,
            prevPage: null,
            nextPage: null,
            page: 1,
            hasPrevPage: false,
            hasNextPage: false,
            prevLink: null,
            nextLink: null,
            error: error.message
        });
    }
});

// GET /api/products/search - Búsqueda avanzada
router.get("/search", validateProductQuery, async (req, res) => {
    try {
        const { search: searchTerm, ...options } = req.query;

        if (!searchTerm) {
            return res.status(400).json({
                status: "error",
                message: "Parámetro 'search' es requerido"
            });
        }

        const result = await productManager.searchProducts(searchTerm, options);

        res.json({
            status: "success",
            searchTerm,
            ...result
        });

    } catch (error) {
        console.error('❌ Error en búsqueda:', error);
        res.status(500).json({
            status: "error",
            message: "Error en la búsqueda",
            error: error.message
        });
    }
});

// Endpoints de información (sin paginación)
router.get("/categories", async (req, res) => {
    try {
        const categories = await productManager.getCategories();
        res.json({ status: "success", categories });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

router.get("/stats", async (req, res) => {
    try {
        const stats = await productManager.getProductStats();
        res.json({ status: "success", stats });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// CRUD endpoints (mantener existentes)
router.get("/:pid", async (req, res) => {
    try {
        const { pid } = req.params;
        const product = await productManager.getProductById(pid);
        res.json({ status: "success", product });
    } catch (error) {
        res.status(404).json({ status: "error", message: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const isAdmin = req.body.isAdmin === 'true' || req.headers['x-admin-mode'] === 'true';

        if (!isAdmin) {
            return res.status(403).json({
                status: "error",
                message: "Solo los administradores pueden agregar productos"
            });
        }

        const newProduct = await productManager.addProduct(req.body);

        // Emitir WebSocket
        const io = req.app.get('io');
        if (io) {
            const result = await productManager.getProducts({ limit: 100 });
            io.emit('updateProducts', result.payload);
        }

        res.status(201).json({
            status: "success",
            message: "Producto agregado exitosamente",
            product: newProduct
        });

    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Error al agregar producto",
            error: error.message
        });
    }
});

router.put("/:pid", async (req, res) => {
    try {
        const { pid } = req.params;
        const updatedProduct = await productManager.updateProductById(pid, req.body);

        // Emitir WebSocket
        const io = req.app.get('io');
        if (io) {
            const result = await productManager.getProducts({ limit: 100 });
            io.emit('updateProducts', result.payload);
        }

        res.json({
            status: "success",
            message: "Producto actualizado exitosamente",
            product: updatedProduct
        });

    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Error al actualizar el producto",
            error: error.message
        });
    }
});

router.delete('/:pid', async (req, res) => {
    try {
        const { pid } = req.params;
        await productManager.deleteProductById(pid);

        // Emitir WebSocket
        const io = req.app.get('io');
        if (io) {
            const result = await productManager.getProducts({ limit: 100 });
            io.emit('updateProducts', result.payload);
        }

        res.json({
            status: "success",
            message: "Producto eliminado exitosamente"
        });

    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Error al eliminar el producto",
            error: error.message
        });
    }
});

export default router;