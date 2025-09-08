import User from '../models/User.js';

export const createUser = async (userData) => {
  const user = new User(userData);
  return await user.save();
};

export const findByEmail = async (email) => {
  return await User.findOne({ email }).populate('cart').lean();
};

export const findById = async (id) => {
  return await User.findById(id).populate('cart').lean();
};

export const updateUser = async (id, update) => {
  return await User.findByIdAndUpdate(id, update, { new: true });
};

export const deleteUser = async (id) => {
  return await User.findByIdAndDelete(id);
};