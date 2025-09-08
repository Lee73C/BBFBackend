import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const userSchema = new Schema({
  first_name: { type: String, required: true },
  last_name:  { type: String, required: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  age:        { type: Number },
  password:   { type: String, required: true }, // guardaremos el hash
  cart:       { type: mongoose.Schema.Types.ObjectId, ref: 'Cart' }, // asume que ya tienes modelo Cart
  role:       { type: String, enum: ['user','admin'], default: 'user' }
}, { timestamps: true });

export default model('User', userSchema);