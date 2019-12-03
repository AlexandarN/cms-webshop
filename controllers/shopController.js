
const fsExtra = require('fs-extra');
const path = require('path');
const pdfkit = require('pdfkit');
const { validationResult } = require('express-validator/check');	

const Page = require('../models/Page');
const Product = require('../models/Product');
const Category = require('../models/Category');
const InfoPage = require('../models/InfoPage');
const env = require('../config/env/env');


exports.getHomePage = async (req, res, next) => {
     const ITEMS_PER_PAGE = 20;
     try {
          const page = await Page.findOne({firstSlug: 'home'});
          // Pagination - parse current page number
          const currentPage = +req.query.page || 1;
          let numProducts;
          // Find total no. of products in DB
          const numOfProducts = await Product.find().countDocuments();
          numProducts = numOfProducts;
          // Find all POPULAR products in DB that belong to the specified current page
          const popularProds = await Product.find({popular: true}).sort({sorting: 1})
               .skip((currentPage - 1) * ITEMS_PER_PAGE)
               .limit(ITEMS_PER_PAGE); 
          const bestSellProds = await Product.find({bestSell: true}).sort({sorting: 1})
               .skip((currentPage - 1) * ITEMS_PER_PAGE)
               .limit(ITEMS_PER_PAGE); 
          const specialProds = await Product.find({special: true}).sort({sorting: 1})
               .skip((currentPage - 1) * ITEMS_PER_PAGE)
               .limit(ITEMS_PER_PAGE); 
          const newProds = await Product.find({newProd: true}).sort({sorting: 1})
               .skip((currentPage - 1) * ITEMS_PER_PAGE)
               .limit(ITEMS_PER_PAGE); 
          const featuredProds = await Product.find({featured: true}).sort({sorting: 1})
               .skip((currentPage - 1) * ITEMS_PER_PAGE)
               .limit(ITEMS_PER_PAGE); 
          // Render view file and send data	
          res.render('shop/indexM', {
               page: page,
               title: page.title,
               popularProds: popularProds, 
               bestSellProds: bestSellProds, 
               specialProds: specialProds, 
               newProds: newProds, 
               popularProds: popularProds, 
               featuredProds: featuredProds, 
               currentPage: currentPage,
               nextPage: currentPage + 1,
               prevPage: currentPage - 1,
               lastPage: Math.ceil(numProducts / ITEMS_PER_PAGE) 
          });
     } catch(err) {
          console.log(err);
     }
}

exports.getIndexPage = async (req, res, next) => {
     const slug = req.params.slug;
     try {
          // Find the requested page in DB
          const page = await Page.findOne({slug: slug});
          if(!page) {
               res.status(404).redirect('/');
          } else {
               res.render('shop/pageM', {
                    page: page,
                    title: page.title
               });
          }
     } catch(err) {
          console.log(err);
     }
}

exports.getInfoPage = async (req, res, next) => {
     const slug = req.params.slug;
     try {
          // Find the requested infoPage in DB
          const infoPage = await InfoPage.findOne({slug: slug});
          if(!infoPage) {
               req.flash('message-danger', 'Info Page not found!')
               res.status(404).redirect('/');
          } else {
               res.render('shop/info-pageM', {
                    infoPage: infoPage,
                    title: infoPage.title
               });
          }
     } catch(err) {
          console.log(err);
     }
}



exports.getAllProducts = async (req, res, next) => {
     const ITEMS_PER_PAGE = 12;
     // Pagination - parse current page number
     const currentPage = +req.query.page || 1;
     try {
          let numProducts;
          // Find total no. of products in DB
          const numOfProducts = await Product.find().countDocuments();
          numProducts = numOfProducts;
          // Find all products in DB that belong to the specified category
          const products = await Product.find().sort({sorting: 1})
               .skip((currentPage - 1) * ITEMS_PER_PAGE)
               .limit(ITEMS_PER_PAGE); 
          // Find all special products in DB and shuffle them
               // function shuffle(array) {
               //      var currentIndex = array.length, temporaryValue, randomIndex;
               //      // While there remain elements to shuffle...
               //      while (0 !== currentIndex) {
               //           // Pick a remaining element...
               //           randomIndex = Math.floor(Math.random() * currentIndex);
               //           currentIndex -= 1;
               //           // And swap it with the current element.
               //           temporaryValue = array[currentIndex];
               //           array[currentIndex] = array[randomIndex];
               //           array[randomIndex] = temporaryValue;
               //      }
               //      return array;
               // }
          const specialProds = await Product.find({special: true}).sort({sorting: 1})
               .limit(3);
          // Render view file and send data	
          res.render('shop/categoryM', {
               products: products, 
               specialProds: specialProds,
               title: 'All products',
               category: null,
               currentPage: currentPage,
               nextPage: currentPage + 1,
               prevPage: currentPage - 1,
               lastPage: Math.ceil(numProducts / ITEMS_PER_PAGE),
               numProducts: numProducts,
               perPage: ITEMS_PER_PAGE
          }); 
     } catch(err) {
          console.log(err);
     }
}		
          
exports.getProductsByCategory = async (req, res, next) => {
     const ITEMS_PER_PAGE = 9;
     // Pagination 1st part - parse current page number
     const currentPage = +req.query.page || 1;
     try {
          let numProducts;
          // Find requested category in DB	
          const slug = req.params.categorySlug;
          const category = await Category.findOne({slug: slug});
          // Pagination 2nd part - Find total no. of products for the requested category
          const numOfProducts = await Product.find({category: slug}).countDocuments();
          numProducts = numOfProducts;
          // Pagination 3rd part - Find all products in DB for the requested category and belong to the specified current page
          const products = await Product.find({category: slug}).sort({sorting: 1})
               .skip((currentPage - 1) * ITEMS_PER_PAGE)
               .limit(ITEMS_PER_PAGE);
          // Find all special products in DB
          const specialProds = await Product.find({special: true}).sort({sorting: 1})
               .limit(3);
          // Render view file and send data	
          res.render('shop/categoryM', {
               products: products, 
               specialProds: specialProds,
               title: category.title,
               category: category,
               currentPage: currentPage,
               nextPage: currentPage + 1,
               prevPage: currentPage - 1,
               lastPage: Math.ceil(numProducts / ITEMS_PER_PAGE),
               numProducts: numProducts,
               perPage: ITEMS_PER_PAGE
          }); 
     } catch(err) {
          console.log(err);
     }      
}
     

exports.getProduct = async (req, res, next) => {
     const slug = req.params.prodSlug;
     try {
          // Find product in DB	
          const product = await Product.findOne({slug: slug});
          if(!product) {					
               req.flash('message-danger', 'Product not found!');	 
               return res.status(404).redirect('/products'); 
          } else {
               // Find product's category in DB - (next 2 lines I added for the purpose of catching the category, which we need for Breadcrumb links in the parallax banner)
               const category = await Category.findOne({slug: product.category});
               // Find all products that belong to the same category as the chosen product (we need this for displaying Related products)
               const catProducts = await Product.find({$and: [{category: category.slug}, {slug: {$ne: product.slug}}]})
                    .sort({sorting: 1})
                    .limit(4);
               // Catch gallery images (IMPORTANT -> fsExtra.readdir() will also catch 'thumbs' folder (as an element of an array) inside gallery folder -> and this is why we will in view file set following condition: if(gallImage != 'thumbs') )	
               const gallery = 'public/images/products/' + product.firstSlug + '/gallery';
               let galleryImages = null;
               const images = await fsExtra.readdir(gallery);
               // Render view file and send data	
               res.render('shop/productM', {	
                    product: product,
                    category: category,
                    catProducts: catProducts,
                    title: product.title,
                    galleryImages: images 
               }); 
          }
     } catch (err) {
          console.log(err);
     }
}


exports.getAddToWishlist = async (req, res, next) => {
     const slug = req.params.slug;
     try {
          const product = await Product.findOne({slug: slug});
          // If wishlist does not exist -> create it and push product in it
          if(typeof req.session.wishlist == 'undefined') {
               req.session.wishlist = [];
               await req.session.wishlist.push({
                    title: product.title,
                    slug: product.slug,
                    category: product.category,
                    price: product.price,
                    originalPrice: product.originalPrice,
                    imagePath: '/images/products/' + product.firstSlug + '/' + product.image 
               });
               await req.flash('message-success', 'Product added to Wishlist!');
               res.status(200).redirect('back');
          } else {
               // If wishlist already exists check if product is previously added to the wishlist
               let newItem = true;
               for(let i = 0; i < req.session.wishlist.length; i++) {
                    // if previously added to wishlist, just inform user about that
                    if(req.session.wishlist[i].slug == slug) {
                         newItem = false;
                         await req.flash('message-danger', 'This product has been previously added to Wishlist!');
                         res.redirect('back');
                    }
               }
               // if not previously added, push product to wishlist
               if(newItem) {
                    await req.session.wishlist.push({
                         title: product.title,
                         slug: product.slug,
                         category: product.category,
                         price: product.price,
                         originalPrice: product.originalPrice,
                         imagePath: '/images/products/' + product.firstSlug + '/' + product.image 
                    }); 
                    await req.flash('message-success', 'Product added to Wishlist!');
                    res.status(200).redirect('back');
               }
          } 
     } catch(err) {
          console.log(err);
     }
}


exports.getWishlistPage = async (req, res, next) => {
     try {
          // Find all special products in DB (needed for sidebar)
          const specialProds = await Product.find({special: true}).sort({sorting: 1})
               .limit(3);		
          // Check if wishlist exists and if it is maybe empty -> as in that case we don't want to display the empty wishlist table
          if(req.session.wishlist && req.session.wishlist.length == 0) {
               delete req.session.wishlist; 
               res.redirect('/wishlist');
          } else {											    
               // Render view file and send data
               res.render('shop/wishlistM', {
                    title: 'Wishlist',
                    specialProds: specialProds
               });
          }
     } catch(err) {
          console.log(err);
     }
}

exports.getRemoveFromWishlist = async (req, res, next) => {
     // Acquire slug of the wishlisted product
     const slug = req.params.slug;
     try {
          // Find product in the Wishlist
          if(typeof req.session.wishlist !== 'undefined') {
               console.log(req.session.wishlist.length);
               for(let i = 0; i < req.session.wishlist.length; i++ ) {
                    console.log(req.session.wishlist.length);
                    if(req.session.wishlist[i].slug == slug) {
                         // Remove product from Wishlist array located at index 'i'
                         await req.session.wishlist.splice(i, 1);
                         // If wishlist is empty delete it
                         // if(req.session.wishlist.length == 0) {
                         //      delete req.session.wishlist;
                         // }
                         await req.flash('message-success', 'Product successfully removed from your Wishlist!');
                    }
               }
          } else {
               await req.flash('message-danger', 'There was an error, Wishlist not found!');
          }
          res.status(200).redirect('back');
     } catch(err) {
          console.log(err);
     }
}

     

exports.getAddToCart = async (req, res, next) => {
     const slug = req.params.slug;
     try {
          const product = await Product.findOne({slug: slug});
          // Check if the product to be added to Cart also exists in the Wishlist - then needs to be removed from the Wishlist
          if( typeof req.session.wishlist !== 'undefined') {
               for(i = 0; i < req.session.wishlist.length; i++) {
                    if(req.session.wishlist[i].slug == slug) {
                         await req.session.wishlist.splice(i, 1);
                    }
               }
          }
          // Add product to Cart
          let quantity = 0;
               // If cart does not exist -> create it and push product, set product's quantity = 1
          if(typeof req.session.cart == 'undefined') {
               req.session.cart = [];
               quantity = 1;
               await req.session.cart.push({
                    title: product.title,
                    slug: product.slug,
                    category: product.category,
                    quantity: quantity,
                    price: product.price,
                    subtotal: product.price * quantity,
                    imagePath: '/images/products/' + product.firstSlug + '/' + product.image 
               });
          } else {
               // If cart already exists check if product is previously added to the cart
               let newItem = true;
               for(let i = 0; i < req.session.cart.length; i++) {
                    // if previously added to cart, just increase product's quantity and subtotal
                    if(req.session.cart[i].title == product.title) {
                         newItem = false;
                         req.session.cart[i].quantity++;
                         req.session.cart[i].subtotal += product.price;
                         break;
                    }
               }
               // if not previously added, push product to cart and set it's quantity = 1
               if(newItem) {
                    quantity = 1;
                    await req.session.cart.push({
                         title: product.title,
                         slug: product.slug,
                         category: product.category,
                         quantity: quantity,
                         price: product.price,
                         subtotal: product.price * quantity,
                         imagePath: '/images/products/' + product.firstSlug + '/' + product.image 
                    }); 
               }
          } 
          // After adding the product to Cart redirect back
          await req.flash('message-success', 'Product added to cart!');
          res.status(200).redirect('back');
     } catch(err) {
          console.log(err);
     }
}

exports.getCartPage = async (req, res, next) => {
     try {
          if(!res.locals.user) {
               await req.flash('message-danger', 'You are not logged in, please log in!');
               res.status(404).redirect('/cart');
          }
          console.log(res.locals.user);
          // Find all special products in DB (needed for sidebar)
          const specialProds = await Product.find({special: true}).sort({sorting: 1})
               .limit(3);
          // Check if cart exists and if it is maybe empty -> as in that case we don't want to display the empty checkout table
          if(req.session.cart && req.session.cart.length == 0) {
               delete req.session.cart; 
               await req.flash('message-danger', 'Your cart has been cleared!');
               res.redirect('/cart');
          } else {											    
               // Render view file and send data
               res.render('shop/cartM', {
                    title: 'Cart',
                    specialProds: specialProds,
                    stripePubKey: env.stripePubKey
               });
          }
     } catch(err) {
          console.log(err);
     }
}


exports.getUpdateCart = async (req, res, next) => {
     const slug = req.params.slug;
     try {
          // Find the product in the cart whose quantity needs to be updated
          for(let i = 0; i < req.session.cart.length; i++ ) {
               if(req.session.cart[i].slug == slug) {
                    // Check the type of update action
                    if (req.query.action == 'add') { 
                         req.session.cart[i].quantity++;
                         req.session.cart[i].subtotal += req.session.cart[i].price;
                         await req.flash('message-success', 'Cart updated!');
                         break;
                    } else if (req.query.action == 'substract') {
                         req.session.cart[i].quantity--;
                         req.session.cart[i].subtotal -= req.session.cart[i].price;
                         if(req.session.cart[i].quantity < 1) {
                              req.session.cart.splice(i, 1);
                         }
                         await req.flash('message-success', 'Cart updated!');
                         break;
                    } else if (req.query.action == 'clear') {
                         req.session.cart.splice(i, 1);
                         if(req.session.cart.length == 0) {
                              delete req.session.cart;
                              await req.flash('message-danger', 'Your cart has been cleared!');
                         } else {
                              await req.flash('message-success', 'Cart updated!');
                         }
                         break;
                    }
               }
          }
          res.status(200).redirect('/cart');
     } catch(err) {
          console.log(err);
     }
}


exports.getClearCart = async (req, res, next) => {   // this is when we press button clear cart
	try {
          // Check if cart exists and if it is maybe empty
          if(req.session.cart) {
               // Clear session
               delete req.session.cart; 					
               await req.flash('message-success', 'Your cart has been successfully cleared!'); 
               await res.redirect('/cart'); 
          }
     } catch(err) {
          console.log(err);
     }
}


exports.getCheckoutPage = async (req, res, next) => {
     try {
          if(!res.locals.user) {
               await req.flash('message-danger', 'You are not logged in, please log in!');
               res.status(404).redirect('/cart/checkout');
          }
          // Find logged in user
          const user = res.locals.user;
          // Find all special products in DB (needed for sidebar)
          const specialProds = await Product.find({special: true})
               .sort({sorting: 1})
               .limit(3);
          // Check if cart exists and if it is maybe empty -> as in that case we don't want to display the empty checkout table
          if(req.session.cart && req.session.cart.length == 0) {
               delete req.session.cart; 
               await req.flash('message-danger', 'Your cart has been cleared!');
               res.redirect('/cart/checkout');
          } else {											    
               // Render view file and send data
               res.render('shop/checkoutM', {
                    title: 'Checkout',
                    stripePubKey: env.stripePubKey,
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
                    shipping: req.session.shipping,
                    valErrors: []
               });
          }
     } catch(err) {
          console.log(err);
     }
}


exports.postShippingMethod = async (req, res, next) => {
     const shippingMethod = req.body.shippingMethod;
     // Find logged in user
     const user = res.locals.user;
     req.session.shipping = {};
     try {
          if(shippingMethod === 'economy') {
               req.session.shipping.method = 'Economy';
               req.session.shipping.price = 0;
          } else if(shippingMethod === 'standard') {
               req.session.shipping.method = 'Standard';
               req.session.shipping.price = 5;
          } else if(shippingMethod === 'express') {
               req.session.shipping.method = 'Express';
               req.session.shipping.price = 10; 
          } else {
               await req.flash('message-danger', 'Please select one of the given shipping methods!');
               res.status(404).redirect('/cart/checkout');
          }
          // Find all special products in DB (needed for sidebar)
          const specialProds = await Product.find({special: true})
               .sort({sorting: 1})
               .limit(3);
          // Render view file and send data
          await req.flash('message-success', 'Shipping method saved successfully. Please proceed to checkout!');
          res.status(200).redirect('/cart/checkout'); 
     } catch(err) {
          console.log(err);
     }
}


exports.postPayWithStripe = async (req, res, next) => {
     try {
          // Find user to check if user's billing and shipping addresses are saved in DB
          const user = res.locals.user;
          if(user.billAddress.firstName === '' || 
               user.billAddress.lastName === '' ||
               user.billAddress.street === '' ||
               user.billAddress.city === '' ||
               user.billAddress.postCode === null ||
               user.billAddress.country === '') {
                    await req.flash('message-danger', 'Please fill out the Billing Details form!')
                    res.status(404).redirect('/cart/checkout');
          } else if(user.shippAddress.firstName === '' || 
               user.shippAddress.lastName === '' ||
               user.shippAddress.street === '' ||
               user.shippAddress.city === '' ||
               user.shippAddress.postCode === null ||
               user.shippAddress.country === '') {
                    await req.flash('message-danger', 'Please fill out the Delivery Details form!')
                    res.status(404).redirect('/cart/checkout');
          // Check if 'shipping' variable exists in the session, i.e. if user has selected one of the Delivery methods
          } else if(!res.locals.shipping) {
               await req.flash('message-danger', 'Please choose a Delivery Method!')
               res.status(404).redirect('/cart/checkout');
          } else {
               // Set your secret key: remember to change this to your live secret key in production
               // See your Stripe keys here: https://dashboard.stripe.com/account/apikeys
               var stripe = require('stripe')(env.stripeSecKey); 
               //  Calculate total amount to be payed       
               total = 0;
               req.session.cart.forEach(item => {
                    total += item.subtotal; 
               });
               if(res.locals.shipping) {
                    total += req.session.shipping.price;
               }
               // Find all special products in DB (needed for sidebar)
               const specialProds = await Product.find({special: true})
                    .sort({sorting: 1})
                    .limit(3);	
               //  Pay with Stripe - create customer
               const customer = await stripe.customers.create({
                    email: req.body.stripeEmail,				            
                    source: req.body.stripeToken
               });	            
               //  Charge the customer
               await stripe.charges.create({
                    amount: Math.round(total.toFixed(2) * 100),
                    currency: 'usd',
                    description: 'Payment',
                    customer: customer.id
               }); 
               // Check if cart still exists and if it is maybe empty
               if(req.session.cart) {
                    // Clear session
                    delete req.session.cart; 
               }		    
               // Render view file and send data
               res.render('shop/payment-successM', {
                    title: 'Successful Payment',
                    specialProds: specialProds
               });
          }
     } catch(err) {
          console.log(err);
     }
}


exports.getInvoice = (req, res, next) => {
     // Create invoice name and the path where it will be stored on the server
     const invoiceNumber = Date.now();
     const invoiceName = 'Invoice-' + invoiceNumber + '.pdf';
     const invoicePath = path.join('data', 'invoices', invoiceName);
     // Setting file type of the invoice and download method
     res.setHeader('Content-Type', 'application/pdf');
     res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"' );  // inline (automatic download); attachment (prompt dialog box before download)
     // CREATE PDF File with PDFKIT package 
     const pdfDoc = new pdfkit();
          // These fonts need to be downloaded from www.fontsquirrel.com, we download .ttf files and save them in the Public folder of the project
     pdfDoc.registerFont('ClearSans-Medium', 'public/fonts/ClearSans-Medium.ttf'); // ClearSans font we need in order to display serbian fonts
          // Create stream of the pdf file (invoice)
     pdfDoc.pipe(fsExtra.createWriteStream(invoicePath));
     pdfDoc.pipe(res);

     // DESIGN the PDF file
          // Set the coordinates of the document (x1 will be used as left margin of the doc, x2, x3, ... - will be used for the table columns' witdhs)
     // x1 = pdfDoc.x; --> for default x margin
     x1 = 50;
     x2 = 190;
     x3 = 280;
     x4 = 380;
     x5 = 480;
          // Set the document title
     pdfDoc.fontSize(23).font('Helvetica').text('Invoice - id: ' + invoiceNumber, x1, pdfDoc.y, {underline: true});
          // Set the table header
     pdfDoc.moveDown(1).fontSize(15).font('Helvetica-Bold').text('Product title', x1, pdfDoc.y, {indent: 5, align: 'left', width: 100})
          .moveUp().text('Image', x2, pdfDoc.y)
          .moveUp().text('Quantity', x3, pdfDoc.y)
          .moveUp().text('Unit price', x4, pdfDoc.y)
          .moveUp().text('Subtotal', x5, pdfDoc.y);
          // Set the table body
     req.session.cart.forEach(item => {
          pdfDoc.moveDown(0.2).fontSize(13).font('ClearSans-Medium').text(item.title, x1, pdfDoc.y, {indent: 5, align: 'left', baseline: 'hanging', width: 190})
               .moveUp().image('public/' + item.imagePath, x2, pdfDoc.y, {height: 30, align: 'center', valign: 'bottom'})
               .moveUp().text(item.quantity, x3, pdfDoc.y, {align: 'center', baseline: 'middle', width: 60})
               .moveUp().text('$' + parseFloat(item.price).toFixed(2), x4, pdfDoc.y, {align: 'center', baseline: 'middle', width: 60})
               .moveUp().text('$' + parseFloat(item.subtotal).toFixed(2), x5, pdfDoc.y, {align: 'right', baseline: 'middle', width: 60});
     });
          // Set the table footer
     pdfDoc.fontSize(10).font('Helvetica').text('---------------------------------------------------------------------------------------------------------------------------------------------------', x1);
     
     total = req.session.cart.reduce((total, item) => total + item.subtotal, 0);
     pdfDoc
          .moveDown(-0.2).fontSize(13).font('Helvetica-Bold').text('Total price:', {indent: 5})
          .moveUp().text(' ', x2, pdfDoc.y, {align: 'center', width: 60})
          .moveUp().text(' ', x3, pdfDoc.y, {align: 'center', width: 60})
          .moveUp().text(' ', x4, pdfDoc.y, {align: 'center', width: 60})
          .moveUp().text('$' + parseFloat(total).toFixed(2), x5, pdfDoc.y, {align: 'right', width: 60});

     pdfDoc.moveDown(-0.4).fontSize(10).font('Helvetica').text('---------------------------------------------------------------------------------------------------------------------------------------------------', x1);
          // Add new page (we can set its margin, instead of using x1 coordinate)
     pdfDoc.addPage({margin: 30});
     // Create columnized text
     const lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam in suscipit purus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Vivamus nec hendrerit felis. Morbi aliquam facilisis risus eu lacinia. Sed eu leo in turpis fringilla hendrerit. Ut nec accumsan nisl. Suspendisse rhoncus nisl posuere tortor tempus et dapibus elit porta. Cras leo neque, elementum a rhoncus ut, vestibulum non nibh. Phasellus pretium justo turpis. Etiam vulputate, odio vitae tincidunt ultricies, eros odio dapibus nisi, ut tincidunt lacus arcu eu elit. Aenean velit erat, vehicula eget lacinia ut, dignissim non tellus. Aliquam nec lacus mi, sed vestibulum nunc. Suspendisse potenti. Curabitur vitae sem turpis. Vestibulum sed neque eget dolor dapibus porttitor at sit amet sem. Fusce a turpis lorem. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae;';  
     pdfDoc.fontSize(12).text(lorem, x1, pdfDoc.y, {columns: 3, columnGap: 15, height: 190, width: 465, align: 'justify'});
          //  Create bulleted list
     pdfDoc.moveDown(1.5).font('ClearSans-Medium').list(['jedan', 'dva', 'tri', 'četiri'], {bulletRadius: 1.5, indent: 20, textIndent: 15});
          // Add some additional texts in one line
     pdfDoc.moveDown(2).fontSize(13).font('Helvetica').text('The amount you need to pay for this order is', x1)
          .moveUp().font('Helvetica-Bold').fillColor('red').text('$' + parseFloat(total).toFixed(2), 309)
          .moveUp().font('Helvetica').fillColor('black').text('.', 345);
          // Add some additional text and a hyperlink in one line
     pdfDoc.moveDown(0.5).text('Visit our web presentation at ', x1)
          .moveUp().fillColor('blue').text('www.cmswebshop.com', 219, pdfDoc.y, {link: 'www.cmswebshop.com', underline: true})
          .moveUp().fillColor('black').text('.', 353);
          //  Add some additional text
     pdfDoc.moveDown(2).text('Sincerely yours,', x1);
          // Add image
     pdfDoc.image('data/Richard_M_Nixon_Signature.png', {width: 150});
          // Close the document
     pdfDoc.end();
          // STREAMING OF FILE DATA - GOOD APPROACH FOR BIG FILES DOWNLOAD
     // const file = fs.createReadStream(invoicePath);
     // res.setHeader('Content-Type', 'application/pdf');
     // res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"' );
     // file.pipe(res);
          // READING OF FILE DATA IN THE MEMORY - NOT GOOD APPROACH FOR BIG FILES
     // fs.readFile(invoicePath, (err, data) => {
     //      if(err) {
     //           return next(err);
     //      }
     //      res.setHeader('Content-Type', 'application/pdf');
     //      res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"' );
     //      res.send(data);
     //      console.log("You've opened a document!");
     // });
}
