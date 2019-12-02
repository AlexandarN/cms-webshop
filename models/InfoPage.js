const mongoose = require('mongoose');

const infoPageSchema = new mongoose.Schema({
     title: {
          type: String,
          required: true
     },
     slug: String,
     content: String,
     sorting: Number
});

module.exports = mongoose.model('InfoPage', infoPageSchema);