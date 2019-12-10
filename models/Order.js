const mongoose = require('mongoose');

  
const orderSchema = new mongoose.Schema({
     items: [ Object ],
     shipping: Object,
     billAddress: Object,
     orderNo: {
          type: String,
          required: true
     },
     total: {
          type: Number,
          required: true
     },
     userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',			         		       
          required: true 
     },
     createdAt: {
          type: String,
          required: true
     }
});
         
module.exports = mongoose.model('Order', orderSchema);
