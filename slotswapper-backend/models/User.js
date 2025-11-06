const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });


UserSchema.methods.generateAuthToken = function() {
  const payload = {
    user: {
      id: this._id,
    },
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};


module.exports = mongoose.model('User', UserSchema);