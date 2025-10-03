
import OrderService from '../services/OrderService.js';
import { asyncHandler } from '../utils/CustomErrors.js';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../config/constants.js';

class OrderController {
  constructor() {
    this.orderService = new OrderService();
  }

  /**
   * POST /api/orders
   * Crear orden desde carrito
   */
  createOrder = asyncHandler(async (req, res) => {

    const { shippingAddress, paymentMethod, notes } = req.body;

    // Validar campos requeridos
    if (!shippingAddress || !paymentMethod) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        status: 'fail',
        message: 'shippingAddress y paymentMethod son requeridos'
      });
    }

    // Validar shippingAddress
    const requiredAddressFields = ['street', 'city', 'state', 'zipCode', 'phone'];
    const missingFields = requiredAddressFields.filter(field => !shippingAddress[field]);

    if (missingFields.length > 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        status: 'fail',
        message: `Campos faltantes en dirección de envío: ${missingFields.join(', ')}`
      });
    }

    const order = await this.orderService.createOrderFromCart(
      req.user._id,
      shippingAddress,
      paymentMethod,
      notes
    );

    res.status(HTTP_STATUS.CREATED).json({
      status: 'success',
      message: SUCCESS_MESSAGES.ORDER_CREATED,
      payload: order
    });
  });

  /**
   * GET /api/orders/:id
   * Obtener orden por ID
   */
  getOrderById = asyncHandler(async (req, res) => {

    const order = await this.orderService.getOrderById(
      req.params.id,
      req.user._id,
      req.user.role
    );

    res.json({
      status: 'success',
      payload: order
    });
  });

  /**
   * GET /api/orders/user/me
   * Obtener órdenes del usuario autenticado
   */
  getMyOrders = asyncHandler(async (req, res) => {

    const { page = 1, limit = 10, status } = req.query;

    const result = await this.orderService.getUserOrders(
      req.user._id,
      parseInt(page),
      parseInt(limit),
      status
    );

    res.json({
      status: 'success',
      payload: result.orders,
      pagination: result.pagination
    });
  });

  /**
   * GET /api/orders
   * Obtener todas las órdenes (Admin)
   */
  getAllOrders = asyncHandler(async (req, res) => {

    const { page = 1, limit = 20, status, userId, paymentStatus, startDate, endDate } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (userId) filters.userId = userId;
    if (paymentStatus) filters.paymentStatus = paymentStatus;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const result = await this.orderService.getAllOrders(
      filters,
      parseInt(page),
      parseInt(limit)
    );

    res.json({
      status: 'success',
      payload: result.orders,
      pagination: result.pagination
    });
  });

  /**
   * PATCH /api/orders/:id/status
   * Actualizar estado de orden (Admin)
   */
  updateOrderStatus = asyncHandler(async (req, res) => {

    const { status, notes } = req.body;

    if (!status) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        status: 'fail',
        message: 'El campo status es requerido'
      });
    }

    const order = await this.orderService.updateOrderStatus(
      req.params.id,
      status,
      notes || '',
      req.user._id
    );

    res.json({
      status: 'success',
      message: SUCCESS_MESSAGES.ORDER_UPDATED,
      payload: order
    });
  });

  /**
   * POST /api/orders/:id/confirm-payment
   * Confirmar pago de orden (Admin o sistema de pago)
   */
  confirmPayment = asyncHandler(async (req, res) => {

    const { transactionId, paymentDetails } = req.body;

    if (!transactionId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        status: 'fail',
        message: 'El campo transactionId es requerido'
      });
    }

    const order = await this.orderService.confirmPayment(
      req.params.id,
      transactionId,
      paymentDetails
    );

    res.json({
      status: 'success',
      message: 'Pago confirmado exitosamente',
      payload: order
    });
  });

  /**
   * POST /api/orders/:id/cancel
   * Cancelar orden
   */
  cancelOrder = asyncHandler(async (req, res) => {

    const { reason } = req.body;

    if (!reason) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        status: 'fail',
        message: 'El motivo de cancelación es requerido'
      });
    }

    const order = await this.orderService.cancelOrder(
      req.params.id,
      reason,
      req.user._id
    );

    res.json({
      status: 'success',
      message: 'Orden cancelada exitosamente',
      payload: order
    });
  });

  /**
   * GET /api/orders/stats
   * Obtener estadísticas de órdenes (Admin)
   */
  getOrderStats = asyncHandler(async (req, res) => {

    const { startDate, endDate } = req.query;

    const stats = await this.orderService.getOrderStats(startDate, endDate);

    res.json({
      status: 'success',
      payload: stats
    });
  });

  /**
   * POST /api/orders/:id/tracking
   * Actualizar información de tracking (Admin)
   */
  updateTracking = asyncHandler(async (req, res) => {

    const { company, trackingNumber, estimatedDelivery } = req.body;

    const order = await this.orderService.getOrderById(req.params.id);

    order.tracking = {
      ...order.tracking,
      company: company || order.tracking.company,
      trackingNumber: trackingNumber || order.tracking.trackingNumber,
      estimatedDelivery: estimatedDelivery || order.tracking.estimatedDelivery
    };

    await order.save();

    res.json({
      status: 'success',
      message: 'Información de tracking actualizada',
      payload: order
    });
  });
}

export default OrderController;