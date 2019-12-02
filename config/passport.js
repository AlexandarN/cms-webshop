const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

const User = require('../models/User');

module.exports = (passport) => {
    passport.use(new LocalStrategy((username, password, done) => {
         // Match username
          User.findOne({username: username})
               .then(user => {
                    if(!user) {
                         return done(null, false, {message: 'No user found!'}); 
                    }
                    // Match password
                    bcrypt.compare(password, user.password, (err, isMatch) => {
                         if(err) throw err; 
                         if(isMatch) {
                              return done(null, user); 
                         } else {
                              return done(null, false, {message: 'Password incorrect!'}); 
                         } 
                    }); 
               })
               .catch(err => console.log(err));
     }));
     passport.serializeUser((user, done) => {
          done(null, user.id);
     });
     passport.deserializeUser((id, done) => {
          User.findById(id, (err, user) => {
               done(err, user);
          });
     });

}

