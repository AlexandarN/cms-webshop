const mongoose = require('mongoose');
  
const userSchema = new mongoose.Schema({
     name: {
          type: String,
          required: true },
     email: {
          type: String,
          required: true },
     username: {
          type: String,
          required: true },
     password: {
          type: String,
          required: true },
     admin: {
          type: Number },
     resetToken: String,			
     resetTokenExpiration: Date  
});				

module.exports = mongoose.model('User', userSchema);
