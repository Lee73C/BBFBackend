import mongoose from 'mongoose';
import { generateBarcode } from '../utils/codeGenerator.js';

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    trim: true
  },
  code: {
    type: String,
    unique: true, 
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'El precio es obligatorio'],
    min: [0, 'El precio debe ser mayor a 0']
  },
  status: {
    type: Boolean,
    default: true
  },
  stock: {
    type: Number,
    required: [true, 'El stock es obligatorio'],
    min: [0, 'El stock no puede ser negativo']
  },
  category: {
    type: String,
    required: [true, 'La categoría es obligatoria'],
    trim: true
  },
  thumbnails: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true, // Agrega createdAt y updatedAt automáticamente
  versionKey: false
});


productSchema.index({ category: 1 });
productSchema.index({ status: 1 });

// Método estático para generar código único
productSchema.statics.generateUniqueCode = async function() {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const code = generateBarcode();
    const existing = await this.findOne({ code });
    
    if (!existing) {
      return code;
    }
    
    attempts++;
  }
  
  throw new Error('No se pudo generar un código único');
};


productSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      this.code = await this.constructor.generateUniqueCode();
    } catch (error) {
      return next(error);
    }
  }
  next();
});

export default mongoose.model('Product', productSchema);