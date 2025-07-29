import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'La cantidad debe ser mayor a 0'],
      default: 1
    }
  }]
}, {
  timestamps: true, 
  versionKey: false
});

// Método para calcular el total del carrito
cartSchema.methods.calculateTotal = async function() {
  await this.populate('products.product');
  return this.products.reduce((total, item) => {
    return total + (item.product.price * item.quantity);
  }, 0);
};

export default mongoose.model('Cart', cartSchema);