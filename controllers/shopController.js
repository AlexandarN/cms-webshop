
const fsExtra = require('fs-extra');
const path = require('path');
const pdfkit = require('pdfkit');

const Page = require('../models/Page');
const Product = require('../models/Product');
const Category = require('../models/Category');
const InfoPage = require('../models/InfoPage');
const Order = require('../models/Order');
const Brand = require('../models/Brand');
const env = require('../config/env/env');


exports.getHomePage = async (req, res, next) => {
     const ITEMS_PER_PAGE = 20;
     try {
          const page = await Page.findOne({firstSlug: 'home'});
          // Pagination - parse current page number
          const currentPage = +req.query.page || 1;
          let numItems;
          // Find total no. of products in DB
          const numOfProducts = await Product.find().countDocuments();
          numItems = numOfProducts;
          // Find all POPULAR products in DB that belong to the specified current page
          const popularProds = await Product.find({popular: true}).populate('category')
               .sort({sorting: 1})
               .skip((currentPage - 1) * ITEMS_PER_PAGE)
               .limit(ITEMS_PER_PAGE); 
          const bestSellProds = await Product.find({bestSell: true}).populate('category')
               .sort({sorting: 1})
               .skip((currentPage - 1) * ITEMS_PER_PAGE)
               .limit(ITEMS_PER_PAGE); 
          const specialProds = await Product.find({special: true}).populate('category')
               .sort({sorting: 1})
               .skip((currentPage - 1) * ITEMS_PER_PAGE)
               .limit(ITEMS_PER_PAGE); 
          const newProds = await Product.find({newProd: true}).populate('category')
               .sort({sorting: 1})
               .skip((currentPage - 1) * ITEMS_PER_PAGE)
               .limit(ITEMS_PER_PAGE); 
          const featuredProds = await Product.find({featured: true}).populate('category')
               .sort({sorting: 1})
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
               lastPage: Math.ceil(numItems / ITEMS_PER_PAGE) 
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
     // Parse filters:
     const ITEMS_PER_PAGE = +req.query.limit || 12;
     const dir = req.query.dir || 'asc';
     const order = req.query.order || 'sorting';
     const stock = req.query.stock || '';
     const price = req.query.price || '';
     // Set price levels
     const min = 0;
     const med1 = 100;
     const med2 = 300;
     const max = 10000;
     if(price === 'low') {
          bottom = min;
          top = med1;
     } else if(price === 'medium') {
          bottom = med1;
          top = med2;
     } else if(price === 'high') {
          bottom = med2;
          top = max;
     }
     // Pagination - parse current page number
     const currentPage = +req.query.page || 1;
     try {
          // Catch all products in DB
          // Get total no. of products in DB
          let products;
          let numItems;
          let numItemsIn;
          let numItemsOut;
          let numItemsLow;
          let numItemsMedium;
          let numItemsHigh;
          // 1. When 'stock' filter is selected and 'price' filter is not selected
          if((stock == 'inStock' || stock == 'outOfStock') && (price !== 'low' && price !== 'medium' && price !== 'high'))  {
               products = await Product.find({availability: stock})
                    .populate('category')
                    .sort({[`${order}`]: dir})
                    .skip((currentPage - 1) * ITEMS_PER_PAGE)
                    .limit(ITEMS_PER_PAGE);           
               numItems = await Product.find({availability: stock}).countDocuments();
               numItemsIn = await Product.find({availability: 'inStock'}).countDocuments();
               numItemsOut = await Product.find({availability: 'outOfStock'}).countDocuments();
               numItemsLow = await Product.find({$and:[{availability: stock}, {$and: [{price: {$gte: min}}, {price: {$lt: med1}}] }] }).countDocuments();
               numItemsMedium = await Product.find({$and:[{availability: stock}, {$and: [{price: {$gte: med1}}, {price: {$lt: med2}}] }] }).countDocuments();
               numItemsHigh = await Product.find({$and:[{availability: stock}, {$and: [{price: {$gte: med2}}, {price: {$lt: max}}] }] }).countDocuments();

          // 2. When both 'stock' filter and 'price' filter are selected
          } else if((stock == 'inStock' || stock == 'outOfStock') && (price == 'low' || price == 'medium' || price == 'high')) {
               products = await Product.find({$and:[{availability: stock}, {$and: [{price: {$gte: bottom}}, {price: {$lt: top}}] }] })
                    .populate('category')
                    .sort({[`${order}`]: dir})
                    .skip((currentPage - 1) * ITEMS_PER_PAGE)
                    .limit(ITEMS_PER_PAGE);           
               numItems = await Product.find({$and:[{availability: stock}, {$and: [{price: {$gte: bottom}}, {price: {$lt: top}}]}]})
                    .countDocuments();
               // 2.1 When 'inStock' is selected and any of the 'price' filters is selected
               if(stock == 'inStock' && (price == 'low' || price == 'medium' || price == 'high')) {
                    numItemsLow = await Product.find({$and:[{availability: 'inStock'}, {$and: [{price: {$gte: min}}, {price: {$lt: med1}}] }] }).countDocuments();
                    numItemsMedium = await Product.find({$and:[{availability: 'inStock'}, {$and: [{'price': {$gte: med1}}, {'price': {$lt: med2}}] }] }).countDocuments();
                    numItemsHigh = await Product.find({$and:[{availability: 'inStock'}, {$and: [{price: {$gte: med2}}, {price: {$lt: max}}] }] }).countDocuments();
                    // 2.1.1 When 'inStock' is selected and 'low' is selected
                    if(stock == 'inStock' && price == 'low') {
                         numItemsIn = await Product.find({$and:[{availability: 'inStock'}, {$and: [{price: {$gte: min}}, {price: {$lt: med1}}] }] }).countDocuments();
                         numItemsOut = await Product.find({$and:[{availability: 'outOfStock'}, {$and: [{price: {$gte: min}}, {price: {$lt: med1}}] }] }).countDocuments();
                    // 2.1.2 When 'inStock' is selected and 'medium' is selected
                    } else if(stock == 'inStock' && price == 'medium') {
                         numItemsIn = await Product.find({$and:[{availability: 'inStock'}, {$and: [{price: {$gte: med1}}, {price: {$lt: med2}}] }] }).countDocuments();
                         numItemsOut = await Product.find({$and:[{availability: 'outOfStock'}, {$and: [{price: {$gte: med1}}, {price: {$lt: med2}}] }] }).countDocuments();
                    // 2.1.3 When 'inStock' is selected and 'high' is selected
                    } else if(stock == 'inStock' && price == 'high') {
                         numItemsIn = await Product.find({$and:[{availability: 'inStock'}, {$and: [{price: {$gte: med2}}, {price: {$lt: max}}] }] }).countDocuments();
                         numItemsOut = await Product.find({$and:[{availability: 'outOfStock'}, {$and: [{price: {$gte: med2}}, {price: {$lt: max}}] }] }).countDocuments();
                    }
               // 2.2 When 'outOfStock' is selected and any of the 'price' filters is selected
               } else if(stock == 'outOfStock' && (price == 'low' || price == 'medium' || price == 'high')) {
                    numItemsLow = await Product.find({$and:[{availability: 'outOfStock'}, {$and: [{price: {$gte: min}}, {price: {$lt: med1}}] }] }).countDocuments();
                    numItemsMedium = await Product.find({$and:[{availability: 'outOfStock'}, {$and: [{price: {$gte: med1}}, {price: {$lt: med2}}] }] }).countDocuments();
                    numItemsHigh = await Product.find({$and:[{availability: 'outOfStock'}, {$and: [{price: {$gte: med2}}, {price: {$lt: max}}] }] }).countDocuments();
                    // 2.2.1 When 'outOfStock' is selected and 'low' is selected
                    if(stock == 'outOfStock' && price == 'low') {
                         numItemsIn = await Product.find({$and:[{availability: 'inStock'}, {$and: [{price: {$gte: min}}, {price: {$lt: med1}}] }] }).countDocuments();
                         numItemsOut = await Product.find({$and:[{availability: 'outOfStock'}, {$and: [{price: {$gte: min}}, {price: {$lt: med1}}] }] }).countDocuments();
                    // 2.2.2 When 'outOfStock' is selected and 'medium' is selected
                    } else if(stock == 'outOfStock' && price == 'medium') {
                         numItemsIn = await Product.find({$and:[{availability: 'inStock'}, {$and: [{price: {$gte: med1}}, {price: {$lt: med2}}] }] }).countDocuments();
                         numItemsOut = await Product.find({$and:[{availability: 'outOfStock'}, {$and: [{price: {$gte: med1}}, {price: {$lt: med2}}] }] }).countDocuments();
                    // 2.2.3 When 'outOfStock' is selected and 'high' is selected
                    } else if(stock == 'outOfStock' && price == 'high') {
                         numItemsIn = await Product.find({$and:[{availability: 'inStock'}, {$and: [{price: {$gte: med2}}, {price: {$lt: max}}] }] }).countDocuments();
                         numItemsOut = await Product.find({$and:[{availability: 'outOfStock'}, {$and: [{price: {$gte: med2}}, {price: {$lt: max}}] }] }).countDocuments();
                    }
               }
               
          // 3. When 'stock' filter is not selected and 'price' filter is selected
          } else if((stock !== 'inStock' && stock !== 'outOfStock') && (price == 'low' || price == 'medium' || price == 'high')) {
               products = await Product.find({$and:[{price: {$gte: bottom}}, {price: {$lt: top}}] })
                    .populate('category')
                    .sort({[`${order}`]: dir})
                    .skip((currentPage - 1) * ITEMS_PER_PAGE)
                    .limit(ITEMS_PER_PAGE);           
               numItems = await Product.find({$and: [{price: {$gte: bottom}}, {price: {$lt: top}}]}).countDocuments();
               numItemsIn = await Product.find({$and:[{availability: 'inStock'}, {$and: [{price: {$gte: bottom}}, {price: {$lt: top}}] }] }).countDocuments();
               numItemsOut = await Product.find({$and:[{availability: 'outOfStock'}, {$and: [{price: {$gte: bottom}}, {price: {$lt: top}}] }] }).countDocuments();
               numItemsLow = await Product.find({$and: [{price: {$gte: min}}, {price: {$lt: med1}}]}).countDocuments();
               numItemsMedium = await Product.find({$and: [{price: {$gte: med1}}, {price: {$lt: med2}}]}).countDocuments();
               numItemsHigh = await Product.find({$and: [{price: {$gte: med2}}, {price: {$lt: max}}]}).countDocuments();

          // 4. When neither 'stock' filter nor 'price' filter are not selected
          } else {
               products = await Product.find()
                    .populate('category')
                    .sort({[`${order}`]: dir})
                    .skip((currentPage - 1) * ITEMS_PER_PAGE)
                    .limit(ITEMS_PER_PAGE); 
               numItems = await Product.find().countDocuments();
               numItemsIn = await Product.find({availability: 'inStock'}).countDocuments();
               numItemsOut = await Product.find({availability: 'outOfStock'}).countDocuments();
               numItemsLow = await Product.find({$and: [{price: {$gte: min}}, {price: {$lt: med1}}]}).countDocuments();
               numItemsMedium = await Product.find({$and: [{price: {$gte: med1}}, {price: {$lt: med2}}]}).countDocuments();
               numItemsHigh = await Product.find({$and: [{price: {$gte: med2}}, {price: {$lt: max}}]}).countDocuments();
          }
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
          const specialProds = await Product.find({special: true}).populate('category')
               .sort({sorting: 1})
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
               lastPage: Math.ceil(numItems / ITEMS_PER_PAGE),
               numItems: numItems,
               min: min,
               med1: med1,
               med2: med2,
               max: max,
               numItemsIn: numItemsIn,
               numItemsOut: numItemsOut,
               numItemsLow: numItemsLow,
               numItemsMedium: numItemsMedium,
               numItemsHigh: numItemsHigh,
               limit: ITEMS_PER_PAGE,
               dir: dir,
               order: order,
               stock: stock,
               price: price,
               items: 'products'  // this is used in pagination.ejs to switch the word between 'products' and 'brands'
          }); 
     } catch(err) {
          console.log(err);
     }
}		
          
exports.getProductsByCategory = async (req, res, next) => {
     // Parse filters:
     const ITEMS_PER_PAGE = +req.query.limit || 12;
     const dir = req.query.dir || 'asc';
     const order = req.query.order || 'sorting';
     const stock = req.query.stock || '';
     const price = req.query.price || '';
     // Set price levels
     const min = 0;
     const med1 = 100;
     const med2 = 300;
     const max = 10000;
     if(price === 'low') {
          bottom = min;
          top = med1;
     } else if(price === 'medium') {
          bottom = med1;
          top = med2;
     } else if(price === 'high') {
          bottom = med2;
          top = max;
     }
     // Pagination - parse current page number
     const currentPage = +req.query.page || 1;
     try {
          // Find requested category in DB	
          const slug = req.params.categorySlug;
          const category = await Category.findOne({slug: slug});
          // Catch all products in DB that belong to the specified category
          // Get total no. of products in DB that belong to the specified category
          let productss;
          let numItems;
          let numItemsIn;
          let numItemsOut;
          let numItemsLow;
          let numItemsMedium;
          let numItemsHigh;
          // 1. When 'stock' filter is selected and 'price' filter is not selected
          if((stock == 'inStock' || stock == 'outOfStock') && (price !== 'low' && price !== 'medium' && price !== 'high'))  {
               products = await Product.find({category: category._id, availability: stock})
                    .populate('category')
                    .sort({[`${order}`]: dir})
                    .skip((currentPage - 1) * ITEMS_PER_PAGE)
                    .limit(ITEMS_PER_PAGE);           
               numItems = await Product.find({category: category._id, availability: stock}).countDocuments();
               numItemsIn = await Product.find({category: category._id, availability: 'inStock'}).countDocuments();
               numItemsOut = await Product.find({category: category._id, availability: 'outOfStock'}).countDocuments();
               numItemsLow = await Product.find({category: category._id, availability: stock, $and: [{price: {$gte: min}}, {price: {$lt: med1}}]}).countDocuments();
               numItemsMedium = await Product.find({category: category._id, availability: stock, $and: [{price: {$gte: med1}}, {price: {$lt: med2}}]}).countDocuments();
               numItemsHigh = await Product.find({category: category._id, availability: stock, $and: [{price: {$gte: med2}}, {price: {$lt: max}}]}).countDocuments();

          // 2. When both 'stock' filter and 'price' filter are selected
          } else if((stock == 'inStock' || stock == 'outOfStock') && (price == 'low' || price == 'medium' || price == 'high')) {
               products = await Product.find({category: category._id, availability: stock, $and: [{price: {$gte: bottom}}, {price: {$lt: top}}]})
                    .populate('category')
                    .sort({[`${order}`]: dir})
                    .skip((currentPage - 1) * ITEMS_PER_PAGE)
                    .limit(ITEMS_PER_PAGE);           
               numItems = await Product.find({category: category._id, availability: stock, $and: [{price: {$gte: bottom}}, {price: {$lt: top}}]}).countDocuments();
               // 2.1 When 'inStock' is selected and any of the 'price' filters is selected
               if(stock == 'inStock' && (price == 'low' || price == 'medium' || price == 'high')) {
                    numItemsLow = await Product.find({category: category._id, availability: 'inStock', $and: [{price: {$gte: min}}, {price: {$lt: med1}}]}).countDocuments();
                    numItemsMedium = await Product.find({category: category._id, availability: 'inStock', $and: [{price: {$gte: med1}}, {price: {$lt: med2}}]}).countDocuments();
                    numItemsHigh = await Product.find({category: category._id, availability: 'inStock', $and: [{price: {$gte: med2}}, {price: {$lt: max}}]}).countDocuments();
                    // 2.1.1 When 'inStock' is selected and 'low' is selected
                    if(stock == 'inStock' && price == 'low') {
                         numItemsIn = await Product.find({category: category._id, availability: 'inStock', $and: [{price: {$gte: min}}, {price: {$lt: med1}}]}).countDocuments();
                         numItemsOut = await Product.find({category: category._id, availability: 'outOfStock', $and: [{price: {$gte: min}}, {price: {$lt: med1}}]}).countDocuments();
                    // 2.1.2 When 'inStock' is selected and 'medium' is selected
                    } else if(stock == 'inStock' && price == 'medium') {
                         numItemsIn = await Product.find({category: category._id, availability: 'inStock', $and: [{price: {$gte: med1}}, {price: {$lt: med2}}]}).countDocuments();
                         numItemsOut = await Product.find({category: category._id, availability: 'outOfStock', $and: [{price: {$gte: med1}}, {price: {$lt: med2}}]}).countDocuments();
                    // 2.1.3 When 'inStock' is selected and 'high' is selected
                    } else if(stock == 'inStock' && price == 'high') {
                         numItemsIn = await Product.find({category: category._id, availability: 'inStock', $and: [{price: {$gte: med2}}, {price: {$lt: max}}]}).countDocuments();
                         numItemsOut = await Product.find({category: category._id, availability: 'outOfStock', $and: [{price: {$gte: med2}}, {price: {$lt: max}}]}).countDocuments();
                    }
               // 2.2 When 'outOfStock' is selected and any of the 'price' filters is selected
               } else if(stock == 'outOfStock' && (price == 'low' || price == 'medium' || price == 'high')) {
                    numItemsLow = await Product.find({category: category._id, availability: 'outOfStock', $and: [{price: {$gte: min}}, {price: {$lt: med1}}]}).countDocuments();
                    numItemsMedium = await Product.find({category: category._id, availability: 'outOfStock', $and: [{price: {$gte: med1}}, {price: {$lt: med2}}]}).countDocuments();
                    numItemsHigh = await Product.find({category: category._id, availability: 'outOfStock', $and: [{price: {$gte: med2}}, {price: {$lt: max}}]}).countDocuments();
                    // 2.2.1 When 'outOfStock' is selected and 'low' is selected
                    if(stock == 'outOfStock' && price == 'low') {
                         numItemsIn = await Product.find({category: category._id, availability: 'inStock', $and: [{price: {$gte: min}}, {price: {$lt: med1}}]}).countDocuments();
                         numItemsOut = await Product.find({category: category._id, availability: 'outOfStock', $and: [{price: {$gte: min}}, {price: {$lt: med1}}]}).countDocuments();
                    // 2.2.2 When 'outOfStock' is selected and 'medium' is selected
                    } else if(stock == 'outOfStock' && price == 'medium') {
                         numItemsIn = await Product.find({category: category._id, availability: 'inStock', $and: [{price: {$gte: med1}}, {price: {$lt: med2}}]}).countDocuments();
                         numItemsOut = await Product.find({category: category._id, availability: 'outOfStock', $and: [{price: {$gte: med1}}, {price: {$lt: med2}}]}).countDocuments();
                    // 2.2.3 When 'outOfStock' is selected and 'high' is selected
                    } else if(stock == 'outOfStock' && price == 'high') {
                         numItemsIn = await Product.find({category: category._id, availability: 'inStock', $and: [{price: {$gte: med2}}, {price: {$lt: max}}]}).countDocuments();
                         numItemsOut = await Product.find({category: category._id, availability: 'outOfStock', $and: [{price: {$gte: med2}}, {price: {$lt: max}}]}).countDocuments();
                    }
               }
               
          // 3. When 'stock' filter is not selected and 'price' filter is selected
          } else if((stock !== 'inStock' && stock !== 'outOfStock') && (price == 'low' || price == 'medium' || price == 'high')) {
               products = await Product.find({category: category._id, $and: [{price: {$gte: bottom}}, {price: {$lt: top}}]})
                    .populate('category')
                    .sort({[`${order}`]: dir})
                    .skip((currentPage - 1) * ITEMS_PER_PAGE)
                    .limit(ITEMS_PER_PAGE);           
               numItems = await Product.find({category: category._id, $and: [{price: {$gte: bottom}}, {price: {$lt: top}}]}).countDocuments();
               numItemsIn = await Product.find({category: category._id, availability: 'inStock', $and: [{price: {$gte: bottom}}, {price: {$lt: top}}]}).countDocuments();
               numItemsOut = await Product.find({category: category._id, availability: 'outOfStock', $and: [{price: {$gte: bottom}}, {price: {$lt: top}}]}).countDocuments();
               numItemsLow = await Product.find({category: category._id, $and: [{price: {$gte: min}}, {price: {$lt: med1}}]}).countDocuments();
               numItemsMedium = await Product.find({category: category._id, $and: [{price: {$gte: med1}}, {price: {$lt: med2}}]}).countDocuments();
               numItemsHigh = await Product.find({category: category._id, $and: [{price: {$gte: med2}}, {price: {$lt: max}}]}).countDocuments();

          // 4. When neither 'stock' filter nor 'price' filter are not selected
          } else {
               products = await Product.find({category: category._id})
                    .populate('category')
                    .sort({[`${order}`]: dir})
                    .skip((currentPage - 1) * ITEMS_PER_PAGE)
                    .limit(ITEMS_PER_PAGE); 
               numItems = await Product.find({category: category._id}).countDocuments();
               numItemsIn = await Product.find({category: category._id, availability: 'inStock'}).countDocuments();
               numItemsOut = await Product.find({category: category._id, availability: 'outOfStock'}).countDocuments();
               numItemsLow = await Product.find({category: category._id, $and: [{price: {$gte: min}}, {price: {$lt: med1}}]}).countDocuments();
               numItemsMedium = await Product.find({category: category._id, $and: [{price: {$gte: med1}}, {price: {$lt: med2}} ]}).countDocuments();
               numItemsHigh = await Product.find({category: category._id, $and: [{price: {$gte: med2}}, {price: {$lt: max}} ]}).countDocuments();
          }

          // Find all special products in DB
          const specialProds = await Product.find({special: true}).populate('category')
               .sort({sorting: 1})
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
               lastPage: Math.ceil(numItems / ITEMS_PER_PAGE),
               numItems: numItems,
               min: min,
               med1: med1,
               med2: med2,
               max: max,
               numItemsIn: numItemsIn,
               numItemsOut: numItemsOut,
               numItemsLow: numItemsLow,
               numItemsMedium: numItemsMedium,
               numItemsHigh: numItemsHigh,
               limit: ITEMS_PER_PAGE,
               dir: dir,
               order: order,
               stock: stock,
               price: price,
               items: 'products'  // this is used in pagination.ejs to switch the word between 'products' and 'brands'
          }); 
     } catch(err) {
          console.log(err);
     }      
}


exports.getProductsByBrand = async (req, res, next) => {
     // Parse filters:
     const ITEMS_PER_PAGE = +req.query.limit || 12;
     const dir = req.query.dir || 'asc';
     const order = req.query.order || 'sorting';
     const stock = req.query.stock || '';
     const price = req.query.price || '';
     // Set price levels
     const min = 0;
     const med1 = 100;
     const med2 = 300;
     const max = 10000;
     if(price === 'low') {
          bottom = min;
          top = med1;
     } else if(price === 'medium') {
          bottom = med1;
          top = med2;
     } else if(price === 'high') {
          bottom = med2;
          top = max;
     }
     // Pagination - parse current page number
     const currentPage = +req.query.page || 1;
     try {
          // Find requested Brand in DB	
          const slug = req.params.brandSlug;
          const brand = await Brand.findOne({slug: slug});
          // Catch all products in DB that belong to the specified category
          // Get total no. of products in DB that belong to the specified category
          let productss;
          let numItems;
          let numItemsIn;
          let numItemsOut;
          let numItemsLow;
          let numItemsMedium;
          let numItemsHigh;
          // 1. When 'stock' filter is selected and 'price' filter is not selected
          if((stock == 'inStock' || stock == 'outOfStock') && (price !== 'low' && price !== 'medium' && price !== 'high'))  {
               products = await Product.find({brand: brand._id, availability: stock})
                    .populate('category')
                    .sort({[`${order}`]: dir})
                    .skip((currentPage - 1) * ITEMS_PER_PAGE)
                    .limit(ITEMS_PER_PAGE);           
               numItems = await Product.find({brand: brand._id, availability: stock}).countDocuments();
               numItemsIn = await Product.find({brand: brand._id, availability: 'inStock'}).countDocuments();
               numItemsOut = await Product.find({brand: brand._id, availability: 'outOfStock'}).countDocuments();
               numItemsLow = await Product.find({brand: brand._id, availability: stock, $and: [{price: {$gte: min}}, {price: {$lt: med1}}]}).countDocuments();
               numItemsMedium = await Product.find({brand: brand._id, availability: stock, $and: [{price: {$gte: med1}}, {price: {$lt: med2}}]}).countDocuments();
               numItemsHigh = await Product.find({brand: brand._id, availability: stock, $and: [{price: {$gte: med2}}, {price: {$lt: max}}]}).countDocuments();

          // 2. When both 'stock' filter and 'price' filter are selected
          } else if((stock == 'inStock' || stock == 'outOfStock') && (price == 'low' || price == 'medium' || price == 'high')) {
               products = await Product.find({brand: brand._id, availability: stock, $and: [{price: {$gte: bottom}}, {price: {$lt: top}}]})
                    .populate('category')
                    .sort({[`${order}`]: dir})
                    .skip((currentPage - 1) * ITEMS_PER_PAGE)
                    .limit(ITEMS_PER_PAGE);           
               numItems = await Product.find({brand: brand._id, availability: stock, $and: [{price: {$gte: bottom}}, {price: {$lt: top}}]}).countDocuments();
               // 2.1 When 'inStock' is selected and any of the 'price' filters is selected
               if(stock == 'inStock' && (price == 'low' || price == 'medium' || price == 'high')) {
                    numItemsLow = await Product.find({brand: brand._id, availability: 'inStock', $and: [{price: {$gte: min}}, {price: {$lt: med1}}]}).countDocuments();
                    numItemsMedium = await Product.find({brand: brand._id, availability: 'inStock', $and: [{price: {$gte: med1}}, {price: {$lt: med2}}]}).countDocuments();
                    numItemsHigh = await Product.find({brand: brand._id, availability: 'inStock', $and: [{price: {$gte: med2}}, {price: {$lt: max}}]}).countDocuments();
                    // 2.1.1 When 'inStock' is selected and 'low' is selected
                    if(stock == 'inStock' && price == 'low') {
                         numItemsIn = await Product.find({brand: brand._id, availability: 'inStock', $and: [{price: {$gte: min}}, {price: {$lt: med1}}]}).countDocuments();
                         numItemsOut = await Product.find({brand: brand._id, availability: 'outOfStock', $and: [{price: {$gte: min}}, {price: {$lt: med1}}]}).countDocuments();
                    // 2.1.2 When 'inStock' is selected and 'medium' is selected
                    } else if(stock == 'inStock' && price == 'medium') {
                         numItemsIn = await Product.find({brand: brand._id, availability: 'inStock', $and: [{price: {$gte: med1}}, {price: {$lt: med2}}]}).countDocuments();
                         numItemsOut = await Product.find({brand: brand._id, availability: 'outOfStock', $and: [{price: {$gte: med1}}, {price: {$lt: med2}}]}).countDocuments();
                    // 2.1.3 When 'inStock' is selected and 'high' is selected
                    } else if(stock == 'inStock' && price == 'high') {
                         numItemsIn = await Product.find({brand: brand._id, availability: 'inStock', $and: [{price: {$gte: med2}}, {price: {$lt: max}}]}).countDocuments();
                         numItemsOut = await Product.find({brand: brand._id, availability: 'outOfStock', $and: [{price: {$gte: med2}}, {price: {$lt: max}}]}).countDocuments();
                    }
               // 2.2 When 'outOfStock' is selected and any of the 'price' filters is selected
               } else if(stock == 'outOfStock' && (price == 'low' || price == 'medium' || price == 'high')) {
                    numItemsLow = await Product.find({brand: brand._id, availability: 'outOfStock', $and: [{price: {$gte: min}}, {price: {$lt: med1}}]}).countDocuments();
                    numItemsMedium = await Product.find({brand: brand._id, availability: 'outOfStock', $and: [{price: {$gte: med1}}, {price: {$lt: med2}}]}).countDocuments();
                    numItemsHigh = await Product.find({brand: brand._id, availability: 'outOfStock', $and: [{price: {$gte: med2}}, {price: {$lt: max}}]}).countDocuments();
                    // 2.2.1 When 'outOfStock' is selected and 'low' is selected
                    if(stock == 'outOfStock' && price == 'low') {
                         numItemsIn = await Product.find({brand: brand._id, availability: 'inStock', $and: [{price: {$gte: min}}, {price: {$lt: med1}}]}).countDocuments();
                         numItemsOut = await Product.find({brand: brand._id, availability: 'outOfStock', $and: [{price: {$gte: min}}, {price: {$lt: med1}}]}).countDocuments();
                    // 2.2.2 When 'outOfStock' is selected and 'medium' is selected
                    } else if(stock == 'outOfStock' && price == 'medium') {
                         numItemsIn = await Product.find({brand: brand._id, availability: 'inStock', $and: [{price: {$gte: med1}}, {price: {$lt: med2}}]}).countDocuments();
                         numItemsOut = await Product.find({brand: brand._id, availability: 'outOfStock', $and: [{price: {$gte: med1}}, {price: {$lt: med2}}]}).countDocuments();
                    // 2.2.3 When 'outOfStock' is selected and 'high' is selected
                    } else if(stock == 'outOfStock' && price == 'high') {
                         numItemsIn = await Product.find({brand: brand._id, availability: 'inStock', $and: [{price: {$gte: med2}}, {price: {$lt: max}}]}).countDocuments();
                         numItemsOut = await Product.find({brand: brand._id, availability: 'outOfStock', $and: [{price: {$gte: med2}}, {price: {$lt: max}}]}).countDocuments();
                    }
               }
               
          // 3. When 'stock' filter is not selected and 'price' filter is selected
          } else if((stock !== 'inStock' && stock !== 'outOfStock') && (price == 'low' || price == 'medium' || price == 'high')) {
               products = await Product.find({brand: brand._id, $and: [{price: {$gte: bottom}}, {price: {$lt: top}}]})
                    .populate('category')
                    .sort({[`${order}`]: dir})
                    .skip((currentPage - 1) * ITEMS_PER_PAGE)
                    .limit(ITEMS_PER_PAGE);           
               numItems = await Product.find({brand: brand._id, $and: [{price: {$gte: bottom}}, {price: {$lt: top}}]}).countDocuments();
               numItemsIn = await Product.find({brand: brand._id, availability: 'inStock', $and: [{price: {$gte: bottom}}, {price: {$lt: top}}]}).countDocuments();
               numItemsOut = await Product.find({brand: brand._id, availability: 'outOfStock', $and: [{price: {$gte: bottom}}, {price: {$lt: top}}]}).countDocuments();
               numItemsLow = await Product.find({brand: brand._id, $and: [{price: {$gte: min}}, {price: {$lt: med1}}]}).countDocuments();
               numItemsMedium = await Product.find({brand: brand._id, $and: [{price: {$gte: med1}}, {price: {$lt: med2}}]}).countDocuments();
               numItemsHigh = await Product.find({brand: brand._id, $and: [{price: {$gte: med2}}, {price: {$lt: max}}]}).countDocuments();

          // 4. When neither 'stock' filter nor 'price' filter are not selected
          } else {
               products = await Product.find({brand: brand._id})
                    .populate('category')
                    .sort({[`${order}`]: dir})
                    .skip((currentPage - 1) * ITEMS_PER_PAGE)
                    .limit(ITEMS_PER_PAGE); 
               numItems = await Product.find({brand: brand._id}).countDocuments();
               numItemsIn = await Product.find({brand: brand._id, availability: 'inStock'}).countDocuments();
               numItemsOut = await Product.find({brand: brand._id, availability: 'outOfStock'}).countDocuments();
               numItemsLow = await Product.find({brand: brand._id, $and: [{price: {$gte: min}}, {price: {$lt: med1}}]}).countDocuments();
               numItemsMedium = await Product.find({brand: brand._id, $and: [{price: {$gte: med1}}, {price: {$lt: med2}} ]}).countDocuments();
               numItemsHigh = await Product.find({brand: brand._id, $and: [{price: {$gte: med2}}, {price: {$lt: max}} ]}).countDocuments();
          }

          // Find all special products in DB
          const specialProds = await Product.find({special: true}).populate('category')
               .sort({sorting: 1})
               .limit(3);
          // Render view file and send data	
          res.render('shop/brandM', {
               products: products, 
               specialProds: specialProds,
               title: brand.title,
               brand: brand,
               currentPage: currentPage,
               nextPage: currentPage + 1,
               prevPage: currentPage - 1,
               lastPage: Math.ceil(numItems / ITEMS_PER_PAGE),
               numItems: numItems,
                min: min,
               med1: med1,
               med2: med2,
               max: max,
               numItemsIn: numItemsIn,
               numItemsOut: numItemsOut,
               numItemsLow: numItemsLow,
               numItemsMedium: numItemsMedium,
               numItemsHigh: numItemsHigh,
               limit: ITEMS_PER_PAGE,
               dir: dir,
               order: order,
               stock: stock,
               price: price,
               items: 'products'   // this is used in pagination.ejs to switch the word between 'products' and 'brands'
          }); 
     } catch(err) {
          console.log(err);
     }      
}


exports.getAllBrands = async (req, res, next) => {
     const ITEMS_PER_PAGE = +req.query.limit || 20;
     const dir = req.query.dir || 'asc';
     const order = req.query.order || 'sorting';
     const stock = req.query.stock || '';
     const price = req.query.price || '';
     // Pagination 1st part - parse current page number
     const currentPage = +req.query.page || 1;
     let numItems;
     try {
          // Pagination 2nd part - Find total no. of products for the requested brand
          const numOfBrands = await Brand.find().countDocuments();
          numItems = numOfBrands;
          // Find all brands in DB	
          const brands = await Brand.find()
               .sort({title: 1})
               .skip((currentPage - 1) * ITEMS_PER_PAGE)
               .limit(ITEMS_PER_PAGE);
          // Find number of products for each brand
          brands.forEach(async brand => {
               brand.numOfProds = await Product.find({brand: brand._id}).countDocuments();
          });
          // Find all special products in DB
          const specialProds = await Product.find({special: true}).populate('category')
               .sort({sorting: 1})
               .limit(3);
          // Render view file and send data	
          res.render('shop/brandsM', {
               brands: brands, 
               specialProds: specialProds,
               title: "Brands",
               currentPage: currentPage,
               nextPage: currentPage + 1,
               prevPage: currentPage - 1,
               lastPage: Math.ceil(numItems / ITEMS_PER_PAGE),
               numItems: numItems,
               limit: ITEMS_PER_PAGE,
               dir: dir,
               order: order,
               stock: stock,
               price: price,
               items: 'brands'   // this is used in pagination.ejs to switch the word between 'products' and 'brands'
          }); 
     } catch(err) {
          console.log(err);
     }      
}
     

exports.getProduct = async (req, res, next) => {
     const slug = req.params.prodSlug;
     try {
          // Find product in DB	
          const product = await Product.findOne({slug: slug}).populate('category', 'title slug').populate('brand');
          if(!product) {					
               req.flash('message-danger', 'Product not found!');	 
               return res.status(404).redirect('/products'); 
          } else {
               // Find product's category in DB - (next 2 lines I added for the purpose of catching the category, which we need for Breadcrumb links in the parallax banner)
               const category = await Category.findOne({_id: product.category._id});
               // Find all products that belong to the same category as the chosen product (we need this for displaying Related products)
               // const relatedProducts = await Product.find({$and: [{category: product.category._id}, {slug: {$ne: product.slug}}]})
               //      .sort({sorting: 1})
               //      .limit(4);
               const relatedProducts = await Product.find({category: category._id})
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
                    relatedProducts: relatedProducts,
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
               for(let i = 0; i < req.session.wishlist.length; i++ ) {
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
          if(typeof req.session.wishlist !== 'undefined') {
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
          // Check if user is logged in
          if(!req.user) {
               await req.flash('message-danger', 'You are not logged in, please log in!');
               res.status(404).redirect('back');
               return
          }
          // Find all special products in DB (needed for the sidebar)
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
          // Check if user is logged in
          if(!req.user) {
               await req.flash('message-danger', 'You are not logged in, please log in!');
               res.status(404).redirect('back');
               return
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
     try {
          if(!shippingMethod || (shippingMethod !== 'economy' && shippingMethod !== 'standard' && shippingMethod !== 'express')) {
               await req.flash('message-danger', 'Please select one of the given shipping methods!');
               res.status(404).redirect('/cart/checkout');
               return
          }
          req.session.shipping = {};
          if(shippingMethod === 'economy') {
               req.session.shipping.method = 'Economy';
               req.session.shipping.price = 0;
          } else if(shippingMethod === 'standard') {
               req.session.shipping.method = 'Standard';
               req.session.shipping.price = 5;
          } else if(shippingMethod === 'express') {
               req.session.shipping.method = 'Express';
               req.session.shipping.price = 10; 
          } 
          // Render view file and send data
          await req.flash('message-success', 'Shipping method saved successfully. Please proceed to checkout!');
          res.status(200).redirect('/cart/checkout'); 
     } catch(err) {
          console.log(err);
     }
}


exports.postPayWithStripe = async (req, res, next) => {
     try {
          // Check if cart is empty
          if(typeof req.session.cart == 'undefined' || req.session.cart.length < 1) {
               await req.flash('message-danger', 'Your cart is empty, add products to your cart before checkout!')
               res.status(404).redirect('/cart/checkout');
               return
          }
          // Check if user does not have billing address data
          if(req.user.billAddress.firstName === '' || 
               req.user.billAddress.lastName === '' ||
               req.user.billAddress.street === '' ||
               req.user.billAddress.city === '' ||
               req.user.billAddress.postCode === null ||
               req.user.billAddress.country === '') {
                    await req.flash('message-danger', 'Please fill out the Billing Details form!')
                    return res.status(404).redirect('/cart/checkout');
          // Check if user does not have shipping address data
          } else if(req.user.shippAddress.firstName === '' || 
               req.user.shippAddress.lastName === '' ||
               req.user.shippAddress.street === '' ||
               req.user.shippAddress.city === '' ||
               req.user.shippAddress.postCode === null ||
               req.user.shippAddress.country === '') {
                    await req.flash('message-danger', 'Please fill out the Delivery Details form!')
                    res.status(404).redirect('/cart/checkout');
          // Check if 'shipping' variable exists in the session, i.e. if user has selected one of the Delivery methods
          } else if(typeof req.session.shipping == 'undefined') {
               await req.flash('message-danger', 'Please choose a Delivery Method!')
               res.status(404).redirect('/cart/checkout');
               return
          } else {
               // Set your secret key: remember to change this to your live secret key in production
               // See your Stripe keys here: https://dashboard.stripe.com/account/apikeys
               var stripe = require('stripe')(env.stripeSecKey); 
               //  Calculate total amount to be payed       
               total = 0;
               req.session.cart.forEach(item => {
                    total += item.subtotal; 
               });
               if(req.session.shipping) {
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
               // Find all user's orders - in order to calculate new order's number
               const number = await Order.find().countDocuments() + 1;
               // Format date function
               function formatDate(date) {
                    const day = date.getDate();
                    const month = date.getMonth() + 1;
                    const year = date.getFullYear();
                    return year + "/" + (month <= 9 ? '0' + month : month) + "/" + (day <= 9 ? '0' + day : day);
               }
               const year = new Date().getFullYear();
               // Create ORDER    
               const order = new Order({
                    items: req.session.cart,
                    shipping: req.session.shipping,
                    billAddress: req.user.billAddress, 
                    orderNo: number <= 9 ? year + '00' + number : 10 >= number <=99 ? year + '0' + number : year + number,
                    total: total,
                    userId: req.user._id,
                    createdAt: formatDate(new Date())
               });
               await order.save();
               // Check if cart still exists and if it is maybe empty
               if(req.session.cart) {
                    // Clear session
                    delete req.session.cart; 
               }
               // Render view file and send data
               res.status(200).render('shop/payment-successM', {
                    title: 'Successful Payment',
                    specialProds: specialProds
               });
          }
     } catch(err) {
          console.log(err);
     }
}


exports.getPayWithPaypal = async (req, res, next) => {
     try {
          // Check if cart is empty
          if(typeof req.session.cart == 'undefined' || req.session.cart.length < 1) {
               await req.flash('message-danger', 'Your cart is empty, add products to your cart before checkout!')
               res.status(404).redirect('/cart/checkout');
               return
          }
          // Check if user does not have billing address data
          if(req.user.billAddress.firstName === '' || 
               req.user.billAddress.lastName === '' ||
               req.user.billAddress.street === '' ||
               req.user.billAddress.city === '' ||
               req.user.billAddress.postCode === null ||
               req.user.billAddress.country === '') {
                    await req.flash('message-danger', 'Please fill out the Billing Details form!')
                    return res.status(404).redirect('/cart/checkout');
          // Check if user does not have shipping address data
          } else if(req.user.shippAddress.firstName === '' || 
               req.user.shippAddress.lastName === '' ||
               req.user.shippAddress.street === '' ||
               req.user.shippAddress.city === '' ||
               req.user.shippAddress.postCode === null ||
               req.user.shippAddress.country === '') {
                    await req.flash('message-danger', 'Please fill out the Delivery Details form!')
                    return res.status(404).redirect('/cart/checkout');
          // Check if 'shipping' variable exists in the session, i.e. if user has selected one of the Delivery methods
          } else if(typeof req.session.shipping == 'undefined') {
               await req.flash('message-danger', 'Please choose a Delivery Method!')
               res.status(404).redirect('/cart/checkout');
               return
          } else {
               //  Calculate total amount to be payed       
               total = 0;
               req.session.cart.forEach(item => {
                    total += item.subtotal; 
               });
               if(req.session.shipping) {
                    total += req.session.shipping.price;
               }
               // Find all special products in DB (needed for sidebar)
               const specialProds = await Product.find({special: true})
                    .sort({sorting: 1})
                    .limit(3);	
               // Find all user's orders - in order to calculate new order's number
               const number = await Order.find().countDocuments() + 1;
               // Format date function
               function formatDate(date) {
                    const day = date.getDate();
                    const month = date.getMonth() + 1;
                    const year = date.getFullYear();
                    return year + "/" + (month <= 9 ? '0' + month : month) + "/" + (day <= 9 ? '0' + day : day);
               }
               const year = new Date().getFullYear();
               // Create ORDER    
               const order = new Order({
                    items: req.session.cart,
                    shipping: req.session.shipping,
                    billAddress: req.user.billAddress, 
                    orderNo: number <= 9 ? year + '00' + number : 10 >= number <=99 ? year + '0' + number : year + number,
                    total: total,
                    userId: req.user._id,
                    createdAt: formatDate(new Date())
               });
               await order.save();
               // Check if cart still exists and if it is maybe empty
               if(req.session.cart) {
                    // Clear session
                    delete req.session.cart; 
               }
               // Render view file and send data
               res.status(200).redirect('back');
          }
     } catch(err) {
          console.log(err);
     }
}


exports.getOrdersPage = async (req, res, next) => {
     try {
          // Check if user is logged in
          if(!res.locals.user) {
               await req.flash('message-danger', 'You are not logged in, please log in!');
               res.status(404).redirect('/cart');
          }
          // Find all user's orders
          const orders = await Order.find({userId: req.user._id});
          let userTotal = 0;
          orders.forEach(order => {
               userTotal += order.total;               
          });
          // Find all special products in DB (needed for sidebar)
          const specialProds = await Product.find({special: true}).sort({sorting: 1})
               .limit(3);
          res.render('shop/ordersM', {
               title: 'Order History',
               specialProds: specialProds,
               orders: orders, 
               userTotal: userTotal
          });
     } catch(err) {
          console.log(err);
     }
}


exports.getOrder = async (req, res, next) => {
     // Catch order's id
     const orderId = req.params.id;
     try {
          // Find order
          const order = await Order.findById(orderId);
          if(!order) {
               await req.flash('message-danger', 'There was an error! Order you requested does not exist')
               res.status(404).redirect('/orders');
               return
          }
          // Find all special products in DB (needed for sidebar)
          const specialProds = await Product.find({special: true}).sort({sorting: 1})
               .limit(3);
          res.render('shop/orderM', {
               title: 'Order no. ' + order.orderNo,
               specialProds: specialProds,
               order: order
          });
     } catch(err) {
          console.log(err);
     }
}


exports.getInvoice = async (req, res, next) => {
     // Catch order's id
     const orderId = req.params.id;
     try {
          // Find order
          const order = await Order.findById(orderId);
          if(!order) {
               await req.flash('message-danger', 'There was an error! Order you requested does not exist')
               res.status(404).redirect('/orders');
               return
          }
          // Create invoice variable that contains data to be used below for invoice creation
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
                    firstName: order.billAddress.firstName,
                    lastName: order.billAddress.lastName,
                    company: order.billAddress.company,
                    street: order.billAddress.street,
                    city: order.billAddress.city,
                    postCode: order.billAddress.postCode,
                    country: order.billAddress.country
               },
               items: order.items,
               shipping: {
                    method: order.shipping.method,
                    price: order.shipping.price
               },
               total: order.total,
               number: order.orderNo,
               date: order.createAt
          };

          // Create INVOICE NAME and the PATH where it will be stored on the server
          const invoiceName = 'Invoice-' + invoice.number + '.pdf';
          const invoicePath = path.join('data', 'invoices', invoiceName);

          // Setting FILE TYPE of the invoice and DOWNLOAD METHOD
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"' );  // inline (automatic download); attachment (prompt dialog box before download)


          // CREATE PDF FILE with PDFKIT package 
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
               .text(invoice.date, 150, customerInformationTop + 15)
               .text("Balance Due:", 50, customerInformationTop + 30)
               .text(formatCurrency(invoice.total), 150, customerInformationTop + 30)
               // customer info
               .text("Billed to:", 300, customerInformationTop)
               .font("Helvetica-Bold")
               .text(invoice.billing.firstName + ' ' + invoice.billing.lastName + ', ' + invoice.billing.company, 400, customerInformationTop)
               .font("Helvetica")
               .text("Street address:", 300, customerInformationTop + 15)
               .text(invoice.billing.street, 400, customerInformationTop + 15)
               .text("City, ZIP Code:", 300, customerInformationTop + 30)
               .text(invoice.billing.city + ", " + invoice.billing.postCode, 400, customerInformationTop + 30)
               .text("Country:", 300, customerInformationTop + 45)
               .text(invoice.billing.country, 400, customerInformationTop + 45)
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
          if(invoice.shipping) {
               generateHeaderRow(pdfDoc, shippingPosition, invoice.shipping.method + ' shipping rate', "", "", "", formatCurrency(invoice.shipping.price));
          }
          
          generateHr(pdfDoc, shippingPosition + 19);
          generateHr(pdfDoc, shippingPosition + 20);

               // 6. TABLE FOOTER
          const subtotalPosition = shippingPosition + 30;
          generateHeaderRow(pdfDoc, subtotalPosition, "", "", "Subtotal", "", formatCurrency(invoice.total * 0.8));

          const VATPosition = subtotalPosition + 20;
          generateHeaderRow(pdfDoc, VATPosition, "", "", "VAT", "", formatCurrency(invoice.total * 0.2));

          const totalPosition = VATPosition + 20;
          pdfDoc.font("Helvetica-Bold").fontSize(11);
          generateHeaderRow(pdfDoc, totalPosition, "", "", "Total", "", formatCurrency(invoice.total));
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







     