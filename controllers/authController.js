const bcrypt = require('bcryptjs');
const passport = require('passport');
const nodemailer = require('nodemailer');
const sendgrid = require('nodemailer-sendgrid-transport');
const crypto = require('crypto');
const { validationResult } = require('express-validator/check');	

const User = require('../models/User');
const Product = require('../models/Product');
const Subscriber = require('../models/Subscriber');
const env = require('../config/env/env');

const transporter = nodemailer.createTransport(sendgrid({
     auth: { api_key: env.sendgridApiKey} 
}) );    
     
     
exports.getRegisterPage = (req, res, next) => {
     // Render view file and send data	
     res.render('shop/registerM', {
          oldInput: {},
          valErrors: [],
          title: 'Register'
     });
}

exports.postRegister = async (req, res, next) => {
	// Parsing of text input data			              	    
	const username = req.body.username;
	const email = req.body.email;
	const password = req.body.password;
     const confirmPassword = req.body.confirmPassword;
     const firstName = req.body.firstName.charAt(0).toUpperCase() + req.body.firstName.slice(1);
     const lastName = req.body.lastName.charAt(0).toUpperCase() + req.body.lastName.slice(1);
	const telephone = req.body.telephone;
	const company = req.body.company;
	const street = req.body.street;
	const city = req.body.city.charAt(0).toUpperCase() + req.body.city.slice(1);
	const postCode = req.body.postCode;
     const country = req.body.country;
     const newsletter = req.body.newsletter;
     try {
          // Catching and displaying validation errors	
          const valErrors = validationResult(req);       
          if(!valErrors.isEmpty()) {
               return res.status(422).render('shop/registerM', {
                    title: 'Register', 
                    oldInput: {
                         username: username,
                         email: email,
                         password: password,
                         confirmPassword: confirmPassword,
                         firstName: firstName,
                         lastName: lastName,
                         telephone: telephone,
                         company: company,
                         street: street,
                         city: city,
                         postCode: postCode,
                         country: country,
                         newsletter: newsletter
                    },
                    valErrors: valErrors.array()  
               }); 
               console.log(valErrors.array());
          }         
          // Check if User with this username already exists in DB
          const user = await User.findOne({ username: username });
          if(user) {			              
               await req.flash('message-danger', 'User with this username already exists!');
               return res.status(422).render('shop/registerM', {
                    title: 'Register', 
                    oldInput: {
                         username: username,
                         email: email,
                         password: password,
                         confirmPassword: confirmPassword,
                         firstName: firstName,
                         lastName: lastName,
                         telephone: telephone,
                         company: company,
                         street: street,
                         city: city,
                         postCode: postCode,
                         country: country,
                         newsletter: newsletter
                    },
                    valErrors: [],
                    messageDang: req.flash('message-danger')
               }); 
          } else {
               // Check if User with this email already exists in DB
               const user = await User.findOne({ email: email });      
               if(user) {
                    await req.flash('message-danger', 'User with this email already exists!');
                    return res.status(422).render('shop/registerM', {
                         title: 'Register', 
                         oldInput: {
                              username: username,
                              email: email,
                              password: password,
                              confirmPassword: confirmPassword,
                              firstName: firstName,
                              lastName: lastName,
                              telephone: telephone,
                              company: company,
                              street: street,
                              city: city,
                              postCode: postCode,
                              country: country,
                              newsletter: newsletter
                         },
                         valErrors: [],
                         messageDang: req.flash('message-danger')
                    }); 
               }
               // Hash the password
               const hashedPassword = await bcrypt.hash(password, 12);
               // Create new user
               const newUser = new User({
                    username: username,
                    email: email, 	
                    password: hashedPassword,
                    telephone: telephone,
                    billAddress: {
                         firstName: firstName,
                         lastName: lastName,
                         company: company,
                         street: street,
                         city: city,
                         postCode: postCode,
                         country: country 
                    },
                    shippAddress: {
                         firstName: firstName,
                         lastName: lastName,
                         company: company,
                         street: street,
                         city: city,
                         postCode: postCode,
                         country: country 
                    },
                    newsletter: newsletter,
                    admin: 0 
               });  
               await newUser.save(); 
               await req.flash('message-success', 'You are now registered. Confirmation message has been sent to your email address!'); 
               res.redirect('/login');
               return transporter.sendMail({
                    to: email,
                    from: 'register@moonstore.com',
                    subject: 'Successful registration!',
                    html: `<h2>Welcome to the MoonStore CMS Webshop!</h2>
                         <p>Dear ${ newUser.username } you have successfully registered to our online shop.</p><b>Enjoy your shopping.</b>` 
               }); 
          }
     } catch(err) {
          console.log(err);
     }
}	


exports.postBillingAddress = async (req, res, next) => {
	// Parsing of text input data			              	    
	const firstName = req.body.firstName.charAt(0).toUpperCase() + req.body.firstName.slice(1);
     const lastName = req.body.lastName.charAt(0).toUpperCase() + req.body.lastName.slice(1);
	const company = req.body.company;
	const street = req.body.street;
	const city = req.body.city.charAt(0).toUpperCase() + req.body.city.slice(1);
	const postCode = req.body.postCode;
     const country = req.body.country;
     const userId = req.body.userId;
     // Find all special products in DB (needed for sidebar)
     const specialProds = await Product.find({special: true})
     .limit(3);
     try {
          // Find existing user in DB that should be edited
          const user = await User.findById(userId);
          if(!user) {
               await req.flash('message-danger', 'We are sorry, we could not find your data in the database. Please try one more time or log in again!');
               res.status(404).redirect('/cart/checkout');
          }
          // Catching and displaying validation errors	
          const valErrors = validationResult(req);       
          if(!valErrors.isEmpty()) {
               return res.status(422).render('shop/checkoutM', {
                    title: 'Checkout', 
                    oldInput: {
                         billAddress: {
                              firstName: firstName,
                              lastName: lastName,
                              company: company,
                              street: street,
                              city: city,
                              postCode: postCode,
                              country: country
                         },
                         shippAddress: {
                              firstName: user.shippAddress.firstName,
                              lastName: user.shippAddress.lastName,
                              company: user.shippAddress.company,
                              street: user.shippAddress.street,
                              city: user.shippAddress.city,
                              postCode: user.shippAddress.postCode,
                              country: user.shippAddress.country
                         }
                    },
                    specialProds: specialProds,
                    shipping: req.shipping.address,
                    valErrors: valErrors.array()  
               }); 
          }         
          // Update user's billing addres in DB	
          user.billAddress.firstName = firstName;
          user.billAddress.lastName = lastName;
          user.billAddress.company = company;
          user.billAddress.street = street;
          user.billAddress.postCode = postCode;
          user.billAddress.city = city;
          user.billAddress.country = country;
          await user.save();
          await req.flash('message-success', 'Billing address saved successfully. Please proceed to checkout!');
          res.status(200).redirect('/cart/checkout');  
     } catch(err) {
          console.log(err);
     }
}


exports.postShippingAddress = async (req, res, next) => {
     const shippingAddr = req.body.shippingAddr;
     const userId = req.body.userId;
     try {
          // Find all special products in DB (needed for sidebar)
          const specialProds = await Product.find({special: true})
               .limit(3);
          // Find existing user in DB that should be edited
          const user = await User.findById(userId);
          if(!user) {
               await req.flash('message-danger', 'We are sorry, we could not find your user data in the database. Please try one more time or log in again!');
               res.status(404).redirect('/cart/checkout');
          }
          if(shippingAddr === 'existing') {
               // Update user's shipping address in DB	
               user.shippAddress.firstName = user.billAddress.firstName;
               user.shippAddress.lastName = user.billAddress.lastName;
               user.shippAddress.company = user.billAddress.company;
               user.shippAddress.street = user.billAddress.street;
               user.shippAddress.postCode = user.billAddress.postCode;
               user.shippAddress.city = user.billAddress.city;
               user.shippAddress.country = user.billAddress.country;
               await user.save();
               await req.flash('message-success', 'Shipping address saved successfully. Please proceed to checkout!');
               res.status(200).redirect('/cart/checkout');  
          } else if(shippingAddr === 'new') {
               // Catching and displaying validation errors	
               const valErrors = validationResult(req);       
               if(!valErrors.isEmpty()) {
                    return res.status(422).render('shop/checkoutM', {
                         title: 'Checkout', 
                         oldInput: {
                              billAddress: {
                                   firstName: user.billAddress.firstName,
                                   lastName: user.billAddress.lastName,
                                   company: user.billAddress.company,
                                   street: user.billAddress.street,
                                   city: user.billAddress.city,
                                   postCode: user.billAddress.postCode,
                                   country: user.billAddress.country
                              },
                              shippAddress: {
                                   firstName: req.body.firstName,
                                   lastName: req.body.lastName,
                                   company: req.body.company,
                                   street: req.body.street,
                                   city: req.body.city,
                                   postCode: req.body.postCode,
                                   country: req.body.country
                              }
                         },
                         specialProds: specialProds,
                         shipping: req.session.shipping,
                         valErrors: valErrors.array()  
                    }); 
               }         
               // Update user's shipping addres in DB	
               user.shippAddress.firstName = req.body.firstName;
               user.shippAddress.lastName = req.body.lastName;
               user.shippAddress.company = req.body.company;
               user.shippAddress.street = req.body.street;
               user.shippAddress.postCode = req.body.postCode;
               user.shippAddress.city = req.body.city;
               user.shippAddress.country = req.body.country;
               await user.save();
               await req.flash('message-success', 'Shipping address saved successfully. Please proceed to checkout!');
               res.status(200).redirect('/cart/checkout'); 
               }
     } catch(err) {
          console.log(err);
     }
}


exports.getLoginPage = (req, res, next) => {
     // Check if user is already logged in	
     if(res.locals.user) {
          res.redirect('/'); 
     } else {
          // Render view file and send data	
          res.render('shop/loginM', {
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
}

exports.getLogout = (req, res, next) => {
     // Log out using 'Passport' strategy package
     req.logout();
     req.flash('message-success', 'You have successfully logged out!');
     res.redirect('/login');
}
     

exports.getDashboardPage = async (req, res, next) => {
     try {
          // Find all special products in DB (needed for sidebar)
          const specialProds = await Product.find({special: true})
               .limit(3);
          // Render view file and send data
          res.render('shop/dashboardM', {
               title: 'Dashboard',
               specialProds: specialProds
          });
     } catch(err) {
          console.log(err);
     }
}


exports.getResetPasswordPage = (req, res, next) => {
	// Render view file and send data	
	res.render('shop/reset-passwordM', {
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
               return res.redirect('/forgetPasswordM'); 
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
				user.resetTokenExpiration = Date.now() + 7200000;  //Date.now() - sadašnji dan i vreme + 1h (3.600.000 ms)
				return user.save()
					.then(result => {
						req.flash('message-success', 'Reset password token has been sent to your email address!'); 
                              res.redirect('/reset-password');  
                              // Send the created token to user's email address               
						return transporter.sendMail({
							to: email,
							from: 'register@moonstore.com',
							subject: 'Reset your password at MoonStore CMS Webshop',
							html: `<p>Dear customer,</p> <p>You have requested a password reset.</p> <p>Please, click this <a href="https://cms-webshop.herokuapp.com/new-password/${ token }"><b>link</b></a> in order to proceed.</p>` //${ token } - za dinamičko embedovanje varijabli u kod
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
               console.log(user);
			// Render view file and send data	
			res.render('shop/new-passwordM', {
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
     // Catching and displaying validation errors	
     const valErrors = validationResult(req);    
	if(!valErrors.isEmpty()) {
		return res.status(422).render('shop/new-passwordM', {
			userId: userId,
               passwordToken: token,
               title: 'New Password',
               valErrors: valErrors.array()  
          }); 
     }   
	User.findOne({_id: userId, resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
		.then(user => {
			if(!user) {
				req.flash('message-danger', 'Your password reset token has expired!');
                    return res.redirect('/reset-passwordM'); 
               }
			return bcrypt.hash(newPassword, 12)	                   //hash() bcrypt metoda za enkripciju user passworda; 12 je nivo zaštite
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


exports.postSubscribe = async (req, res, next) => {
	// Parsing of text input data			              	    
	const email = req.body.email;
     try {
          // Catching and displaying validation errors	
          const valErrors = validationResult(req);       
          if(!valErrors.isEmpty()) {
               await req.flash('message-danger', 'Wrong email format!');
               return res.status(422).redirect('back'); 
          }         
          // Check if Subscriber with this email already exists in DB
          const subscriber = await Subscriber.findOne({ email: email });
          if(subscriber) {			              
               await req.flash('message-danger', 'Subscriber with this email already exists!');
               return res.status(422).redirect('back'); 
          } else {
               // Create new subscriber
               const newSubscriber = new Subscriber({
                    email: email
               });  
               await newSubscriber.save(); 
               await req.flash('message-success', 'You are now subscribed and will be regularly informed about our discount offers. Confirmation message has been sent to your email address!');
               res.status(201).redirect('back');
               return transporter.sendMail({
                    to: email,
                    from: 'office@moonstore.com',
                    subject: 'Successful subscription!',
                    html: `<h2>You have succesfully signed up for MoonStore discount offers!</h2><p>Dear ${ newSubscriber.email },</p> <p>With pleasure we inform you that you have successfully registered to the MoonStore online store. <br> We will regularly inform you about all our future discount offers for shopping at at our webshop.</p>Enjoy your shopping.</p><p><b>Your MoonStore Team</b></p>` 
               }); 
          }
     } catch(err) {
          console.log(err);
     }
}	
