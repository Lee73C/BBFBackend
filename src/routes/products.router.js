import { Router } from 'express';
import ProductManager from '../managers/ProductManager.js';
import { validateProductQuery } from '../middleware/queryValidation.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';
import { asyncHandler } from '../utils/CustomErrors.js';

const router = Router();
const productManager = new ProductManager();

// ====================================
// RUTAS PÚBLICAS (NO REQUIEREN AUTH)
// ====================================

router.get("/", 
    validateProductQuery, 
    optionalAuth,
    asyncHandler(async (req, res) => {
        const result = await productManager.getProducts(req.query);
        res.json({
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
        });
    })
);

router.get("/:pid", asyncHandler(async (req, res) => {
    const { pid } = req.params;
    const product = await productManager.getProductById(pid);
    res.json({ status: "success", product });
}));

// ====================================
// RUTAS PROTEGIDAS - SOLO ADMIN
// ====================================

/**
 * POST /api/products
 * SOLO ADMIN puede crear productos
 */
router.post('/', 
    authenticate,
    authorize('admin'),
    asyncHandler(async (req, res) => {
        const newProduct = await productManager.addProduct(req.body);
        
        // Emitir WebSocket
        const io = req.app.get('io');
        if (io) {
            const result = await productManager.getProducts({ limit: 100 });
            io.emit('updateProducts', result.payload);
        }

        res.status(201).json({
            status: "success",
            message: "Producto creado por administrador",
            product: newProduct
        });
    })
);

/**
 * PUT /api/products/:pid
 * SOLO ADMIN puede actualizar productos
 */
router.put('/:pid', 
    authenticate,
    authorize('admin'),
    asyncHandler(async (req, res) => {
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
            message: "Producto actualizado por administrador",
            product: updatedProduct
        });
    })
);

/**
 * DELETE /api/products/:pid
 * SOLO ADMIN puede eliminar productos
 */
router.delete('/:pid', 
    authenticate,
    authorize('admin'),
    asyncHandler(async (req, res) => {
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
            message: "Producto eliminado por administrador"
        });
    })
);

export default router;