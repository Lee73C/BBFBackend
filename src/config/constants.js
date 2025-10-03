

// Roles del sistema
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  PREMIUM: 'premium',  // Futuros roles
  GUEST: 'guest'      
};

// Estados de órdenes
export const ORDER_STATUS = {
  PENDING: 'pending',           // Orden creada, pendiente de pago
  PROCESSING: 'processing',     // Pago confirmado, procesando
  SHIPPED: 'shipped',          // Orden enviada
  DELIVERED: 'delivered',      // Orden entregada
  CANCELLED: 'cancelled',      // Orden cancelada
  REFUNDED: 'refunded'         // Orden con reembolso
};

// Métodos de pago
export const PAYMENT_METHODS = {
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  BANK_TRANSFER: 'bank_transfer',
  CASH_ON_DELIVERY: 'cash_on_delivery',
  PAYPAL: 'paypal'
};

// Estados de pago
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REFUNDED: 'refunded'
};

// Tipos de descuento
export const DISCOUNT_TYPES = {
  PERCENTAGE: 'percentage',
  FIXED_AMOUNT: 'fixed_amount',
  FREE_SHIPPING: 'free_shipping'
};

// Límites de la aplicación
export const LIMITS = {
  MAX_CART_ITEMS: 50,
  MAX_PRODUCT_QUANTITY: 100,
  MIN_ORDER_AMOUNT: 1000,      // Monto mínimo de orden
  FREE_SHIPPING_AMOUNT: 50000,  // Envío gratis sobre este monto
  MAX_PRODUCTS_PER_PAGE: 100,
  DEFAULT_PAGE_SIZE: 12,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000 // 24 horas
};

// Mensajes de error estandarizados
export const ERROR_MESSAGES = {
  // Autenticación
  UNAUTHORIZED: 'No autorizado - Token inválido o inexistente',
  FORBIDDEN: 'Acceso denegado - No tienes permisos suficientes',
  INVALID_CREDENTIALS: 'Credenciales inválidas',
  
  // Usuarios
  USER_NOT_FOUND: 'Usuario no encontrado',
  EMAIL_ALREADY_EXISTS: 'El email ya está registrado',
  INVALID_EMAIL: 'Formato de email inválido',
  
  // Productos
  PRODUCT_NOT_FOUND: 'Producto no encontrado',
  INSUFFICIENT_STOCK: 'Stock insuficiente',
  PRODUCT_INACTIVE: 'Producto no disponible',
  
  // Carrito
  CART_NOT_FOUND: 'Carrito no encontrado',
  CART_EMPTY: 'El carrito está vacío',
  INVALID_QUANTITY: 'Cantidad inválida',
  
  // Órdenes
  ORDER_NOT_FOUND: 'Orden no encontrada',
  ORDER_CANNOT_BE_CANCELLED: 'La orden no puede ser cancelada en este estado',
  PAYMENT_FAILED: 'Error al procesar el pago',
  
  // General
  INTERNAL_SERVER_ERROR: 'Error interno del servidor',
  INVALID_ID: 'ID inválido',
  VALIDATION_ERROR: 'Error de validación',
  DATABASE_ERROR: 'Error de base de datos'
};

// Mensajes de éxito estandarizados
export const SUCCESS_MESSAGES = {
  USER_REGISTERED: 'Usuario registrado exitosamente',
  LOGIN_SUCCESS: 'Login exitoso',
  LOGOUT_SUCCESS: 'Logout exitoso',
  PASSWORD_RESET: 'Contraseña restablecida exitosamente',
  PRODUCT_ADDED: 'Producto agregado exitosamente',
  PRODUCT_UPDATED: 'Producto actualizado exitosamente',
  PRODUCT_DELETED: 'Producto eliminado exitosamente',
  CART_UPDATED: 'Carrito actualizado exitosamente',
  ORDER_CREATED: 'Orden creada exitosamente',
  ORDER_UPDATED: 'Orden actualizada exitosamente'
};

// Permisos por rol
export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: [
    'products:create',
    'products:read',
    'products:update',
    'products:delete',
    'users:read',
    'users:update',
    'users:delete',
    'orders:read',
    'orders:update',
    'orders:cancel',
    'analytics:view'
  ],
  [USER_ROLES.PREMIUM]: [
    'products:read',
    'orders:create',
    'orders:read',
    'orders:cancel_own',
    'cart:manage',
    'profile:update',
    'discounts:use_premium'
  ],
  [USER_ROLES.USER]: [
    'products:read',
    'orders:create',
    'orders:read_own',
    'cart:manage',
    'profile:update'
  ],
  [USER_ROLES.GUEST]: [
    'products:read',
    'cart:view'
  ]
};

// Configuración de emails
export const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  ORDER_CONFIRMATION: 'order_confirmation',
  ORDER_SHIPPED: 'order_shipped',
  ORDER_DELIVERED: 'order_delivered',
  ORDER_CANCELLED: 'order_cancelled',
  PASSWORD_RESET: 'password_reset',
  PAYMENT_CONFIRMATION: 'payment_confirmation'
};

// Códigos de estado HTTP
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
};

// Eventos del sistema
export const SYSTEM_EVENTS = {
  USER_REGISTERED: 'user:registered',
  USER_LOGIN: 'user:login',
  ORDER_CREATED: 'order:created',
  ORDER_PAID: 'order:paid',
  ORDER_SHIPPED: 'order:shipped',
  ORDER_DELIVERED: 'order:delivered',
  ORDER_CANCELLED: 'order:cancelled',
  PRODUCT_OUT_OF_STOCK: 'product:out_of_stock',
  PAYMENT_PROCESSED: 'payment:processed'
};

export default {
  USER_ROLES,
  ORDER_STATUS,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  DISCOUNT_TYPES,
  LIMITS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ROLE_PERMISSIONS,
  EMAIL_TEMPLATES,
  HTTP_STATUS,
  SYSTEM_EVENTS
};