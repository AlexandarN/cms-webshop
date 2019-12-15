const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
     title: {
          type: String,
          required: true
     },
     slug: String,
     firstSlug: String,
     image: String, 
     favourite: Boolean
});

module.exports = mongoose.model('Brand', brandSchema);