const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
     title: {
          type: String,
          required: true
     },
     slug: String,
     sorting: Number
});

module.exports = mongoose.model('Category', categorySchema);