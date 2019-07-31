
const fsExtra = require('fs-extra');
const path = require('path');
const pdfkit = require('pdfkit');

const Page = require('../models/Page');
const Product = require('../models/Product');
const Category = require('../models/Category');
const env = require('../config/env/env');

exports.getIndexPage = (req, res, next) => {
     Page.findOne({slug: 'home'})
          .then(page => {
               res.render('shop/index', {
                    page: page,
                    title: page.title
               });
          })
          .catch(err => console.log(err));
}

exports.getPage = (req, res, next) => {
     const slug = req.params.slug;
     // Find the requested page in DB
     Page.findOne({slug: slug})
          .then(page => {
               if(!page) {
                    res.status(404).redirect('/');
               } else {
                    res.render('shop/index', {
                         page: page,
                         title: page.title
                    });
               }
          })
          .catch(err => console.log(err));
}

const ITEMS_PER_PAGE = 3;

exports.getAllProducts = (req, res, next) => {
     // Pagination - parse current page number
     const currentPage = +req.query.page || 1;
     let numProducts;
          // Find total no. of products in DB
     Product.find().countDocuments()
          .then(numOfProducts => {
               numProducts = numOfProducts;
               // Find all products in DB that belong to the specified current page
               return Product.find()
                    .skip((currentPage - 1) * ITEMS_PER_PAGE)
                    .limit(ITEMS_PER_PAGE);							           
          })
		.then(limitedProducts => {   
			// Render view file and send data	
			res.render('shop/products', {
				products: limitedProducts, 
                    title: 'All products',
                    currentPage: currentPage,
                    nextPage: currentPage + 1,
                    prevPage: currentPage - 1,
                    lastPage: Math.ceil(numProducts / ITEMS_PER_PAGE) 
               }); 
          })
          .catch(err => console.log(err)); 
}		
          
exports.getProductsByCategory = (req, res, next) => {
     // Pagination 1st part - parse current page number
     const currentPage = +req.query.page || 1;
     let numProducts;
     // Find requested category in DB	
     const slug = req.params.categorySlug;
     Category.findOne({slug: slug})
          .then(category => {
               // Pagination 2nd part - Find total no. of products for the requested category
               Product.find({category: slug}).countDocuments()
                    .then(numOfProducts => {
                         numProducts = numOfProducts;
                         // Pagination 3rd part - Find all products in DB for the requested category and belong to the specified current page
                         return Product.find({category: slug})
                              .skip((currentPage - 1) * ITEMS_PER_PAGE)
                              .limit(ITEMS_PER_PAGE);
                    })
                    .then(limitedProducts => {   
                         // Render view file and send data	
                         res.render('shop/products', {
                              products: limitedProducts, 
                              title: category.title,
                              currentPage: currentPage,
                              nextPage: currentPage + 1,
                              prevPage: currentPage - 1,
                              lastPage: Math.ceil(numProducts / ITEMS_PER_PAGE)
                         }); 
                    })
                    .catch(err => console.log(err)); 
          })
          .catch(err => console.log(err));
}
     

exports.getProduct = (req, res, next) => {
     const slug = req.params.prodSlug;
     // Find product in DB	
     Product.findOne({slug: slug})
          .then(product => {
               if(!product) {					
                    req.flash('message-danger', 'Product not found!');	                          			 
                    return res.status(404).redirect('/products'); 
               } else {
                    // Catch gallery images (IMPORTANT -> fsExtra.readdir() will also catch 'thumbs' folder inside gallery folder)	
                    const gallery = 'public/images/products/' + product.firstSlug + '/gallery';
                    let galleryImages = null;
                    fsExtra.readdir(gallery)
                         .then(images => {
                              // Render view file and send data	
                              res.render('shop/product', {	
                                   product: product,
                                   title: product.title,
                                   galleryImages: images 
                              }); 
                         })
                         .catch(err => comsole.log(err)); 
               }
          })
          .catch(err => console.log(err)); 
}
     

exports.getAddToCart = (req, res, next) => {
	const slug = req.params.slug;
     Product.findOne({slug: slug})
		.then(product => {
               let quantity = 0;
			if(typeof req.session.cart == 'undefined') {
                    req.session.cart = [];
                    quantity = 1;
				req.session.cart.push({
                         title: product.title,
                         slug: product.slug,
                         category: product.category,
					quantity: quantity,
                         price: product.price,
                         subtotal: product.price * quantity,
                         imagePath: '/images/products/' + product.firstSlug + '/' + product.image 
                    });
			} else {
				let newItem = true;
				for(let i = 0; i < req.session.cart.length; i++) {
					if(req.session.cart[i].title == product.title) {
						newItem = false;
                              req.session.cart[i].quantity++;
                              req.session.cart[i].subtotal += product.price;
                              break;
                         }
                    }
                    if(newItem) {
                         quantity = 1;
                         req.session.cart.push({
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
               console.log(req.session.cart);
               req.flash('message-success', 'Product added to cart!');
               res.status(200).redirect('back');
          })
          .catch(err => console.log(err));
}

exports.getCheckoutPage = (req, res, next) => {
     // Check if cart exists and if it is maybe empty -> as in that case we don't want to display the empty checkout table
	if(req.session.cart && req.session.cart.length == 0) {
          delete req.session.cart; 
          req.flash('message-danger', 'Your cart has been cleared!');
          res.redirect('/cart/checkout');
     } else {											    
          // Render view file and send data
          res.render('shop/checkout', {
               title: 'Checkout',
               stripePubKey: env.stripePubKey
          });
     }
}

exports.getUpdateCart = (req, res, next) => {
     const slug = req.params.slug;
     // Find the product in the cart whose quantity needs to be updated
     for(let i = 0; i < req.session.cart.length; i++ ) {
          if(req.session.cart[i].slug == slug) {
               // Check the type of update action
               if (req.query.action == 'add') {
                    req.session.cart[i].quantity++;
                    req.session.cart[i].subtotal += req.session.cart[i].price;
                    req.flash('message-success', 'Cart updated!');
                    break;
               } else if (req.query.action == 'substract') {
                    req.session.cart[i].quantity--;
                    req.session.cart[i].subtotal -= req.session.cart[i].price;
                    if(req.session.cart[i].quantity < 1) {
                         req.session.cart.splice(i, 1);
                    }
                    req.flash('message-success', 'Cart updated!');
                    break;
               } else if (req.query.action == 'clear') {
                    req.session.cart.splice(i, 1);
                    if(req.session.cart.length == 0) {
                         delete req.session.cart;
                         req.flash('message-danger', 'Your cart has been cleared!');
                    } else {
                         req.flash('message-success', 'Cart updated!');
                    }
                    break;
               }
          }
     }
     res.status(200).redirect('/cart/checkout');
}

exports.getClearCart = (req, res, next) => {   // this is the case when we press button clear cart
	// Check if cart exists and if it is maybe empty
	if(req.session.cart) {
          // Clear session
		delete req.session.cart; 					
		req.flash('message-success', 'Your cart has been successfully cleared!'); 
          res.redirect('/cart/checkout'); 
     }
}


exports.postPayWithStripe = (req, res, next) => {
     // Set your secret key: remember to change this to your live secret key in production
     // See your keys here: https://dashboard.stripe.com/account/apikeys
     var stripe = require('stripe')(env.stripeSecKey); 
     //  Calculate total amount to be payed       
     total = 0;
	req.session.cart.forEach(item => {
          total += item.subtotal; 
     });
	//  Pay with Stripe - create customer
     stripe.customers.create({
          email: req.body.stripeEmail,				            
          source: req.body.stripeToken
     })			            
          .then(customer => {
               //  Charge the customer
               stripe.charges.create({
                    amount: Math.round(total.toFixed(2) * 100),
                    currency: 'usd',
                    description: 'Payment',
                    customer: customer.id
               }); 
          })
          .then(charge => {
               // Check if cart still exists and if it is maybe empty
			if(req.session.cart) {
				// Clear session
                    delete req.session.cart; 
               }									    
               // Render view file and send data
               res.render('shop/payment-success', {
                    title: ''
               });
          })
          .catch(err => console.log(err));
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
