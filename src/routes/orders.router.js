
import { Router } from 'express';
import OrderController from '../controllers/OrderController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../utils/CustomErrors.js';

const router = Router();
const orderController = new OrderController();

// ====================================
// RUTAS PROTEGIDAS PARA USUARIOS
// ====================================

/**
 * POST /api/orders
 * Crear orden desde carrito
 * REQUIERE: Autenticación (user o premium)
 */
router.post('/',
  authenticate,
  orderController.createOrder
);

/**
 * GET /api/orders/user/me
 * Obtener mis órdenes
 * REQUIERE: Autenticación
 */
router.get('/user/me',
  authenticate,
  orderController.getMyOrders
);

/**
 * GET /api/orders/:id
 * Obtener orden por ID (propia o admin)
 * REQUIERE: Autenticación
 */
router.get('/:id',
  authenticate,
  orderController.getOrderById
);

/**
 * POST /api/orders/:id/cancel
 * Cancelar orden (propia)
 * REQUIERE: Autenticación
 */
router.post('/:id/cancel',
  authenticate,
  orderController.cancelOrder
);

// ====================================
// RUTAS ADMINISTRATIVAS (SOLO ADMIN)
// ====================================

/**
 * GET /api/orders
 * Obtener todas las órdenes con filtros
 * REQUIERE: Admin
 */
router.get('/',
  authenticate,
  authorize('admin'),
  orderController.getAllOrders
);

/**
 * GET /api/orders/stats
 * Obtener estadísticas de órdenes
 * REQUIERE: Admin
 */
router.get('/stats',
  authenticate,
  authorize('admin'),
  orderController.getOrderStats
);

/**
 * PATCH /api/orders/:id/status
 * Actualizar estado de orden
 * REQUIERE: Admin
 */
router.patch('/:id/status',
  authenticate,
  authorize('admin'),
  orderController.updateOrderStatus
);

/**
 * POST /api/orders/:id/confirm-payment
 * Confirmar pago de orden
 * REQUIERE: Admin
 */
router.post('/:id/confirm-payment',
  authenticate,
  authorize('admin'),
  orderController.confirmPayment
);

/**
 * POST /api/orders/:id/tracking
 * Actualizar información de tracking
 * REQUIERE: Admin
 */
router.post('/:id/tracking',
  authenticate,
  authorize('admin'),
  orderController.updateTracking
);

router.post('/orders', 
  authenticate,
  asyncHandler(async (req, res) => {
    const order = await orderService.createOrder(req.user._id, req.body);
    res.status(201).json({
      status: 'success',
      payload: order
    });
  })
);

export default router;