const bcrypt = require('bcryptjs');
const passport = require('passport');
const nodemailer = require('nodemailer');
const sendgrid = require('nodemailer-sendgrid-transport');
const crypto = require('crypto');
const { validationResult } = require('express-validator/check');	

const User = require('../models/User');
const env = reuire('../config/env/env');

const transporter = nodemailer.createTransport(sendgrid({
	auth: { api_key: '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' } }) );             
exports.getRegisterPage = (req, res, next) => {
     // Render view file and send data	
     res.render('shop/register', {
          oldInput: {},
          valErrors: [],
          title: 'Register'
     });
}

exports.postRegister = (req, res, next) => {
	// Parsing of text input data			              	    
	const name = req.body.name;
	const email = req.body.email;
	const username = req.body.username;
	const password = req.body.password;
	const confirmPassword = req.body.confirmPassword;
	// Catching and displaying validation errors	
	const valErrors = validationResult(req);                        			    
	if(!valErrors.isEmpty()) {				      		         			            
		return res.status(422).render('shop/register', {
			title: 'Register', 
			oldInput: {
				name: name,
				email: email,
				username: username,
				password: password,
                    confirmPassword: confirmPassword 
               },
               valErrors: valErrors.array()  
          }); 
     }         
	// Check if User with this username already exists in DB
	User.findOne({ username: username })        	       								
		.then(user => {
			if(user) {			              
				req.flash('message-danger', 'User with this username already exists!');
				return res.status(422).render('shop/register', {
                         title: 'Register', 
                         oldInput: {
                              name: name,
                              email: email,
                              username: username,
                              password: password,
                              confirmPassword: confirmPassword 
                         },
                         valErrors: [],
                         messageDang: req.flash('message-danger')
                    }); 
			} else {
				// Check if User with this email already exists in DB
				User.findOne({ email: email })        
					.then(user => {
						if(user) {			               
							req.flash('message-danger', 'User with this email already exists!'); 
                                   return res.status(422).render('shop/register', {
                                        title: 'Register', 
                                        oldInput: {
                                             name: name,
                                             email: email,
                                             username: username,
                                             password: password,
                                             confirmPassword: confirmPassword 
                                        },
                                        valErrors: [],
                                        messageDang: req.flash('message-danger')
                                   }); 
                              }
                              // Hash the password
						bcrypt.hash(password, 12)           
							.then(hashedPassword => {
                                        // Create new user
								const newUser = new User({
									name: name,
									email: email, 	
									username: username,		          
									password: hashedPassword,
                                             admin: 0 
                                        });  
								return newUser.save(); })
							.then(newUser => {
								req.flash('message-success', 'You are now registered. Confirmation message has been sent to your email address!'); 
								res.redirect('/login');
								return transporter.sendMail({         
									to: email,			
									from: 'cmswebshop@shop.com',
									subject: 'Successful registration!',
                                             html: `<h2>Welcome to the CMS Webshop!</h2>
                                                    <p>Dear ${ newUser.name } you have successfully registered to our shop.</p><b>Enjoy your shopping.</b>` 
                                        }); 
                                   })
                                   .catch(err => console.log(err)); 
                         })
                         .catch(err => console.log(err)); 
                    }
          })
          .catch(err => console.log(err)); 
     }	

exports.getLoginPage = (req, res, next) => {
     // Check if user is already logged in	
     if(res.locals.user) {
          res.redirect('/'); 
     } else {	                                   			       
     // Render view file and send data	
     res.render('shop/login', {
          title: 'Log in', 
          oldInput: {},  	            
          valErrors: [] 
     }); 
     }    
}   	      

exports.postLogin = (req, res, next) => {
	// Authentication using 'Passport' strategy package		              	    
	passport.authenticate('local', {
		successRedirect: '/',
          failureRedirect: '/login',
          failureFlash: true 
     })
     (req, res, next); 
     console.log(res.locals.user);
}

exports.getLogout = (req, res, next) => {
     // Log out using 'Passport' strategy package
     req.logout();
     req.flash('message-success', 'You have successfully logged out!');
     res.redirect('/login');
}
     

exports.getDashboardPage = (req, res, next) => {
     // Render view file and send data
     res.render('shop/dashboard', {
          title: 'Dashboard'
     });
}


exports.getResetPasswordPage = (req, res, next) => {
	// Render view file and send data	
	res.render('shop/reset-password', {
		title: 'Reset Password', 
          oldInput: {} 
     }); 
}             

exports.postResetPassword = (req, res, next) => {     
     // Parsing of text input data
     const email = req.body.email;
     // Create token with the crypto method                   
	crypto.randomBytes(32, (err, buffer) => { //crypto.randomBytes(32,cb) kreira buffer od 32 bajta, 2. arg. je callback koja kada se rB završi daje error ili buffer
		if(err) {
			console.log(err);
               return res.redirect('/reset-password'); 
          }
          const token = buffer.toString('hex');     //kreirani bafer pretvaramo u string, dobijamo token koji snimamo u BP i šaljemo useru
          // Find the user with the submitted email in DB
		User.findOne({email: email})
			.then(user => {
				if(!user) {
					req.flash('message-danger', 'Entered email is incorrect!'); 
                         return res.redirect('/reset-password'); 
                    }
                    // Apply the created token and it's expiration time to the user and save it as user's property in DB
				user.resetToken = token;	             
				user.resetTokenExpiration = Date.now() + 3600000;  //Date.now() - sadašnji dan i vreme + 1h (3.600.000 ms)
				return user.save()
					.then(result => {                                        
						req.flash('message-success', 'Reset password token has been sent to your email address!'); 
                              res.redirect('/reset-password');  
                              // Send the created token to user's email address               
						return transporter.sendMail({                      
							to: email,
							from: 'cmswebshop@shop.com',
							subject: 'Reset your password at CMS Webshop',
							html: `<p>Dear <b>${ user.name }</b>,</p> <p>You have requested a password reset.</p> <p>Please, click this <a href="http://localhost:3000/new-password/${ token }"><b>link</b></a> in order to proceed.</p>` //${ token } - za dinamičko embedovanje varijabli u kod
                                   }); 
                              })                                                    
					.then(result => console.log("Reset token sent to user's email!"))          
                         .catch(err => console.log(err)); 
               }); 
     }); 
}	

exports.getNewPasswordPage = (req, res, next) => {
	// Parsing of a token that came as part of URL (when user clicked on the link that was sent to him  in the message; link URL contains token)
	const token = req.params.token;           
	// Find the user in DB whose token is identical to the sent one and if the user is found check the token's expiration date
	User.findOne({resetToken: token, resetTokenExpiration: { $gt: Date.now() } })           //$gt (greather than) 
		.then(user => {							                                                       
			// Render view file and send data	
			res.render('shop/new-password', {
				userId: user._id.toString(),	                          
				passwordToken: token, 			                                      
				title: 'New Password',
                    valErrors: [] 
               }); 
          })
          .catch(err => console.log(err)); 
}	

exports.postNewPassword = (req, res, next) => {
	const newPassword = req.body.password;
	const userId = req.body.userId;			                           
	const token = req.body.passwordToken;
	User.findOne({_id: userId, resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
		.then(user => {
			if(!user) {
				req.flash('message-danger', 'Your password reset token has expired!');
                    return res.redirect('/reset-password'); 
               }
			return bcrypt.hash(newPassword, 12)	                         //hash() bcrypt metoda za enkripciju user passworda; 12 je nivo zaštite
				.then(hashedNewPassword => {                          
					user.password = hashedNewPassword;
					user.resetToken = undefined;                                                                	          
					user.resetTokenExpiration = undefined;
					return user.save(); })
				.then(result => {
					req.flash('message-success', 'Your password has been reset!');
                         res.redirect('/login'); 
                    })
                    .catch(err => console.log(err));
          })
          .catch(err => console.log(err)); 
}	


