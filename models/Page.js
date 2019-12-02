const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
     title: {
          type: String,
          required: true
     },
     slug: String,
     firstSlug: String,
     banner: String,
     subtitle1: String,
     image1: String,
     content: String,
     subtitle2: String,
     image2: String,
     subcontent: String,
     sorting: Number
});

module.exports = mongoose.model('Page', pageSchema);