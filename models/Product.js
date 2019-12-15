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
     features: String,
     category: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Category',
          // type: String,
          required: true
     },
     price: {
          type: Number,
          required: true
     },
     originalPrice: Number,
     image: String,
     brand: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Brand',
          // type: String,
          required: true
     },
     productCode: String,
     availability: String,
     featured: Boolean,
     popular: Boolean,
     bestSell: Boolean,
     special: Boolean,
     newProd: Boolean,
     sorting: Number

});

module.exports = mongoose.model('Product', productSchema);