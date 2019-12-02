const mongoose = require('mongoose');
  
const userSchema = new mongoose.Schema({
     username: {
          type: String,
          required: true },
     email: {
          type: String,
          required: true },
     password: {
          type: String,
          required: true },
     telephone: String,
     billAddress: {
          firstName: String,
          lastName: String,
          company: String,
          street: String,
          city: String,
          postCode: Number,
          country: String 
     },
     shippAddress: {
          firstName: String,
          lastName: String,
          company: String,
          street: String,
          city: String,
          postCode: Number,
          country: String 
     },
     newsletter: Boolean,
     admin: {
          type: Number 
     },
     resetToken: String,			
     resetTokenExpiration: Date  
});				

module.exports = mongoose.model('User', userSchema);
