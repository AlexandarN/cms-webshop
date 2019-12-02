const mongoose = require('mongoose');

const infoSchema = new mongoose.Schema({
     shopName: String,
     logo: String,
     favicon: String,
     footerBanner: String,
     contact: {
          address: {
               street: String,
               city: String,
               country: String
          },
          email1: String,
          email2: String,
          email3: String,
          phone1: String,
          phone2: String,
          phone3: String
     }
});

module.exports = mongoose.model('Info', infoSchema);