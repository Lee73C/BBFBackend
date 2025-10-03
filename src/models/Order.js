import mongoose from 'mongoose';
import { ORDER_STATUS, PAYMENT_METHODS, PAYMENT_STATUS } from '../config/constants.js';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  // Guardamos snapshot del producto por si cambia después
  productSnapshot: {
    title: { type: String, required: true },
    price: { type: Number, required: true },
    code: String,
    thumbnails: [String]
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'La cantidad debe ser al menos 1']
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'El precio no puede ser negativo']
  },
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'El subtotal no puede ser negativo']
  }
}, { _id: false });

const shippingAddressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true, default: 'Chile' },
  phone: { type: String, required: true },
  additionalInfo: String
}, { _id: false });

const orderSchema = new mongoose.Schema({
  
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  items: {
    type: [orderItemSchema],
    required: true,
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: 'La orden debe tener al menos un producto'
    }
  },
  
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'El subtotal no puede ser negativo']
  },
  
  discount: {
    type: Number,
    default: 0,
    min: [0, 'El descuento no puede ser negativo']
  },
  
  shipping: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'El envío no puede ser negativo']
  },
  
  tax: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'El impuesto no puede ser negativo']
  },
  
  total: {
    type: Number,
    required: true,
    min: [0, 'El total no puede ser negativo']
  },
  
  shippingAddress: {
    type: shippingAddressSchema,
    required: true
  },
  
  status: {
    type: String,
    enum: Object.values(ORDER_STATUS),
    default: ORDER_STATUS.PENDING,
    required: true,
    index: true  
  },
  
  statusHistory: [{
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    notes: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  payment: {
    method: {
      type: String,
      enum: Object.values(PAYMENT_METHODS),
      required: true
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      required: true
    },
    transactionId: String,
    paidAt: Date,
    paymentDetails: mongoose.Schema.Types.Mixed
  },
  
  tracking: {
    company: String,
    trackingNumber: String,
    estimatedDelivery: Date,
    shippedAt: Date,
    deliveredAt: Date
  },
  
  notes: String,
  adminNotes: String,
  
  cancellation: {
    reason: String,
    cancelledAt: Date,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    refundStatus: {
      type: String,
      enum: ['pending', 'processed', 'rejected']
    }
  }
  
}, {
  timestamps: true,
  versionKey: false
});

// ÍNDICES COMPUESTOS

orderSchema.index({ user: 1, createdAt: -1 });  // Para búsquedas de órdenes por usuario
orderSchema.index({ status: 1, createdAt: -1 }); // Para búsquedas por estado


//  Virtual para número de items
orderSchema.virtual('itemCount').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Método para generar número de orden
orderSchema.statics.generateOrderNumber = async function() {
    try {
        const prefix = 'ORD';
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        
        const lastOrder = await this.findOne({
            orderNumber: new RegExp(`^${prefix}${year}${month}`)
        }).sort({ orderNumber: -1 });
        
        let sequence = 1;
        if (lastOrder) {
            const lastSequence = parseInt(lastOrder.orderNumber.slice(-4));
            sequence = lastSequence + 1;
            }
        
        const orderNumber = `${prefix}${year}${month}${sequence.toString().padStart(4, '0')}`;
        return orderNumber;
    } catch (error) {
        // Si hay error, generar un número único con timestamp
        const fallback = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
        return fallback;
    }
};

// Método para calcular totales
orderSchema.methods.calculateTotals = function() {
  this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
  const discountAmount = this.discount || 0;
  const FREE_SHIPPING_THRESHOLD = 50000;
  this.shipping = this.subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 5000;
  const taxableAmount = this.subtotal - discountAmount;
  this.tax = Math.round(taxableAmount * 0.19);
  this.total = this.subtotal - discountAmount + this.shipping + this.tax;
  return this;
};

// Método para actualizar estado
orderSchema.methods.updateStatus = function(newStatus, notes = '', updatedBy = null) {
  this.status = newStatus;
  
  this.statusHistory.push({
    status: newStatus,
    date: new Date(),
    notes,
    updatedBy
  });
  
  if (newStatus === ORDER_STATUS.SHIPPED && !this.tracking.shippedAt) {
    this.tracking.shippedAt = new Date();
  }
  
  if (newStatus === ORDER_STATUS.DELIVERED && !this.tracking.deliveredAt) {
    this.tracking.deliveredAt = new Date();
  }
  
  if (newStatus === ORDER_STATUS.CANCELLED && !this.cancellation.cancelledAt) {
    this.cancellation.cancelledAt = new Date();
    this.cancellation.cancelledBy = updatedBy;
  }
  
  return this;
};

// Método para verificar si la orden puede ser cancelada
orderSchema.methods.canBeCancelled = function() {
  const nonCancellableStatuses = [
    ORDER_STATUS.SHIPPED,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.REFUNDED
  ];
  
  return !nonCancellableStatuses.includes(this.status);
};

// Método para cancelar orden
orderSchema.methods.cancel = function(reason, cancelledBy) {
  if (!this.canBeCancelled()) {
    throw new Error('Esta orden no puede ser cancelada en su estado actual');
  }
  
  this.cancellation = {
    reason,
    cancelledAt: new Date(),
    cancelledBy,
    refundStatus: this.payment.status === PAYMENT_STATUS.APPROVED ? 'pending' : null
  };
  
  this.updateStatus(ORDER_STATUS.CANCELLED, `Orden cancelada: ${reason}`, cancelledBy);
  
  return this;
};

// Método para confirmar pago
orderSchema.methods.confirmPayment = function(transactionId, paymentDetails = null) {
  this.payment.status = PAYMENT_STATUS.APPROVED;
  this.payment.paidAt = new Date();
  this.payment.transactionId = transactionId;
  
  if (paymentDetails) {
    this.payment.paymentDetails = paymentDetails;
  }
  
  this.updateStatus(ORDER_STATUS.PROCESSING, 'Pago confirmado');
  
  return this;
};

orderSchema.pre('validate', async function(next) {
    // Solo generar orderNumber si es un documento nuevo y no tiene orderNumber
    if (this.isNew && !this.orderNumber) {
        try {
            this.orderNumber = await this.constructor.generateOrderNumber();
            } catch (error) {
            return next(error);
        }
    }
    next();
});

// Middleware pre-save para calcular totales (después de la validación)
orderSchema.pre('save', function(next) {
    if (this.isModified('items') || this.isModified('discount') || this.isNew) {
        this.calculateTotals();
    }
    next();
});

export default mongoose.model('Order', orderSchema);