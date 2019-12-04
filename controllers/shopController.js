
const fsExtra = require('fs-extra');
const path = require('path');
const pdfkit = require('pdfkit');

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



exports.getInvoice = async (req, res, next) => {
     try {
          let total = req.session.cart.reduce((total, item) => total + item.subtotal, 0);
          if(req.session.shipping) {
               total += req.session.shipping.price; 
          }

          const invoice = {
               logoPath: 'public/images/info/' + req.app.locals.info.logo,
               company: {
                    name: req.app.locals.info.shopName,
                    street: req.app.locals.info.contact.address.street,
                    city: req.app.locals.info.contact.address.city,
                    country: req.app.locals.info.contact.address.country,
                    email: req.app.locals.info.contact.email1,
                    phone: req.app.locals.info.contact.phone1
               },
               billing: {
                    firstName: req.user.billAddress.firstName,
                    lastName: req.user.billAddress.lastName,
                    company: req.user.billAddress.company,
                    street: req.user.billAddress.street,
                    city: req.user.billAddress.city,
                    postCode: req.user.billAddress.postCode,
                    country: req.user.billAddress.country
               },
               items: req.session.cart,
               shipping: {
                    method: req.session.shipping.method,
                    price: req.session.shipping.price
               },
               subtotal: total * 0.8,
               VAT: total * 0.2,
               number: Date.now()
          };

          // Create INVOICE NAME and the PATH where it will be stored on the server
          const invoiceNumber = Date.now();
          const invoiceName = 'Invoice-' + invoiceNumber + '.pdf';
          const invoicePath = path.join('data', 'invoices', invoiceName);

          // Setting FILE TYPE of the invoice and DOWNLOAD METHOD
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"' );  // inline (automatic download); attachment (prompt dialog box before download)


          // CREATE PDF File with PDFKIT package 
          const pdfDoc = new pdfkit({ size: 'A4', margin: 50});

               // Import FONTS downloaded from www.fontsquirrel.com, we downloaded .ttf files and saved them in the Public folder of the project
          pdfDoc.registerFont('ClearSans-Medium', 'public/fonts/ClearSans-Medium.ttf'); // ClearSans font we need in order to display Serbian fonts
               // Create stream of the pdf file (invoice)
          pdfDoc.pipe(fsExtra.createWriteStream(invoicePath));
          pdfDoc.pipe(res);

               // 1. INVOICE HEADER (Logo + Company Address)
          pdfDoc
               .image(invoice.logoPath, 50, 45, { width: 150 })
               .fillColor("#122047")
               .font("Helvetica-Bold")
               .fontSize(11)
               .text(invoice.company.name, 200, 50, { align: "right" })
               .font("Helvetica")
               .fontSize(10)
               .text(invoice.company.street, 200, 65, { align: "right" })
               .text(invoice.company.city, 200, 80, { align: "right" })
               .text(invoice.company.country, 200, 95, { align: "right" })
               .moveDown();

               // 2. INVOICE TITLE
          const invoiceStart = 140;
          pdfDoc
               .fontSize(20)
               .text("INVOICE", 50, invoiceStart);

          generateHr(pdfDoc, invoiceStart + 25);

               // 3. INVOICE DATA and CUSTOMER INFORMATION
          const customerInformationTop = invoiceStart + 35;
          pdfDoc
               // invoice data
               .fontSize(10)
               .text("Invoice Number:", 50, customerInformationTop)
               .font("Helvetica-Bold")
               .text(invoice.number, 150, customerInformationTop)
               .font("Helvetica")
               .text("Invoice Date:", 50, customerInformationTop + 15)
               .text(formatDate(new Date()), 150, customerInformationTop + 15)
               .text("Balance Due:", 50, customerInformationTop + 30)
               .text(formatCurrency(total), 150, customerInformationTop + 30)
               // customer info
               .font("Helvetica-Bold")
               .text(invoice.billing.firstName + ' ' + invoice.billing.lastName + ', ' + invoice.billing.company, 350, customerInformationTop)
               .font("Helvetica")
               .text(invoice.billing.street, 350, customerInformationTop + 15)
               .text(invoice.billing.city + ", " + invoice.billing.postCode, 350, customerInformationTop + 30)
               .text(invoice.billing.country, 350, customerInformationTop + 45)
               .moveDown();
          
          generateHr(pdfDoc, customerInformationTop + 60);

               // 4. TABLE HEADER
          let i;
          const invoiceTableTop = customerInformationTop + 120;

          pdfDoc.font("Helvetica-Bold");
          generateHeaderRow(pdfDoc, invoiceTableTop, "ITEM", "IMAGE", "UNIT COST", "QUANTITY", "LINE TOTAL");

          generateHr(pdfDoc, invoiceTableTop + 19);
          generateHr(pdfDoc, invoiceTableTop + 20);
          
               // 5. TABLE ROWS
          pdfDoc.font("Helvetica");
          for (i = 0; i < invoice.items.length; i++) {
               const item = invoice.items[i];
               const position = invoiceTableTop + (i + 1) * 30;
               generateTableRow(pdfDoc, position, item.title, item.imagePath, formatCurrency(item.price), item.quantity, formatCurrency(item.subtotal));

               generateHr(pdfDoc, position + 20);
          }

          const shippingPosition = invoiceTableTop + (invoice.items.length + 1) * 30;
          if(req.session.shipping) {
               generateHeaderRow(pdfDoc, shippingPosition, invoice.shipping.method + ' shipping rate', "", "", "", formatCurrency(invoice.shipping.price));
          }
          
          generateHr(pdfDoc, shippingPosition + 19);
          generateHr(pdfDoc, shippingPosition + 20);

               // 6. TABLE FOOTER
          const subtotalPosition = shippingPosition + 30;
          generateHeaderRow(pdfDoc, subtotalPosition, "", "", "Subtotal", "", formatCurrency(invoice.subtotal));

          const VATPosition = subtotalPosition + 20;
          generateHeaderRow(pdfDoc, VATPosition, "", "", "VAT", "", formatCurrency(invoice.VAT));

          const totalPosition = VATPosition + 20;
          pdfDoc.font("Helvetica-Bold").fontSize(11);
          generateHeaderRow(pdfDoc, totalPosition, "", "", "Total", "", formatCurrency(total));
          pdfDoc.font("Helvetica");

               // TEXT BELOW TABLE
          pdfDoc
               .fontSize(10)
               .text("Payment is due within 15 days. Thank you for your business.", 50, totalPosition + 50, { align: "center", width: 500 });

               // CLOSE THE DOCUMENT
          pdfDoc.end();


          // FUNCTIONS FOR PDF DESIGN
          function formatDate(date) {
               const day = date.getDate();
               const month = date.getMonth() + 1;
               const year = date.getFullYear();
          
               return year + "/" + month + "/" + day;
          }

          function formatCurrency(dollars) {
               return "$" + parseFloat(dollars).toFixed(2);
          }

          function generateHr(doc, y) {
               doc
                    .strokeColor("#aaaaaa")
                    .lineWidth(1)
                    .moveTo(50, y)
                    .lineTo(550, y)
                    .stroke();
          }

          function generateHrDash(doc, y) {
               doc
                    .strokeColor("#aaaaaa")
                    .lineWidth(1)
                    .moveTo(50, y)
                    .lineTo(550, y)
                    .dash(3, {space: 2});
          }

          function generateHeaderRow(doc, y, item, image, unitCost, quantity, lineTotal) {
               doc
                    .fontSize(10)
                    .text(item, 50, y)
                    .text(image, 230, y)
                    .text(unitCost, 280, y, { width: 90, align: "right" })
                    .text(quantity, 370, y, { width: 90, align: "right" })
                    .text(lineTotal, 0, y, { align: "right" });   
          }

          function generateTableRow(doc, y, item, image, unitCost, quantity, lineTotal) {
               doc
                    .fontSize(10)
                    .text(item, 50, y)
                    .image('public' + image, 230, y - 5, {height: 25, align: 'right', valign: 'top'})
                    .text(unitCost, 280, y, { width: 90, align: "right" })
                    .text(quantity, 370, y, { width: 90, align: "right" })
                    .text(lineTotal, 0, y, { align: "right" });   
          }
          
          //      STREAMING OF FILE DATA - GOOD APPROACH FOR BIG FILES DOWNLOAD
          // const file = fs.createReadStream(invoicePath);
          // res.setHeader('Content-Type', 'application/pdf');
          // res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"' );
          // file.pipe(res);
          //      READING OF FILE DATA IN THE MEMORY - NOT GOOD APPROACH FOR BIG FILES
          // fs.readFile(invoicePath, (err, data) => {
          //      if(err) {
          //           return next(err);
          //      }
          //      res.setHeader('Content-Type', 'application/pdf');
          //      res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"' );
          //      res.send(data);
          //      console.log("You've opened a document!");
          // });
     } catch(err) {
          console.log(err);
     }
}
