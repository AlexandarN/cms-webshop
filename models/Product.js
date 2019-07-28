const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
     title: {
          type: String,
          required: true
     },
     slug: String,
     firstSlug: String,
     description: {
          type: String,
          required: true
     },
     category: {
          type: String,
          required: true
     },
     price: {
          type: Number,
          required: true
     },
     image: String
});

module.exports = mongoose.model('Product', productSchema);