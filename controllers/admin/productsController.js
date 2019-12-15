const mkdirp = require('mkdirp');
const fsExtra = require('fs-extra');
const resizeImg = require('resize-img');

const { validationResult } = require('express-validator/check');

const Product = require('../../models/Product');
const Category = require('../../models/Category');
const Brand = require('../../models/Brand');

exports.getProductsListPage = async (req, res, next) => {
     try {
          const products = await Product.find().populate('brand', 'title').populate('category', 'title slug').sort({sorting: 1});
          // .then(prods => {
          //      console.log(prods);
          //      const products = prods.map(product => {
          //           Category.find({slug: product.category})
          //                .then(category => {
          //                     console.log(category);
          //                     return {...product, catName: category.title};
          //                })
          //                .catch(err => console.log(err));   
          //      });
          //      return products;
          // })
          // Render view file and send data
          res.render('admin/productsM', {
               title: 'Products',
               products: products
          });
     } catch(err) {
          console.log(err);
     }
}


exports.postReorderProducts = async (req, res, next) => {
     // Catch the array of page ids sent through POST request after manual reordering of pages
     console.log(req.body);
     const ids = req.body['id[]'];
     try {
          // For each reordered page -> catch it's id and increase value of variable 'count' by 1
          var count = 0;
          for(var i = 0; i < ids.length; i++) {
               var id = ids[i].toString();
               console.log(id);
               count++;
               // For each reordered page -> find that page in DB (based on it's previously caught id) and change it's sorting property
               const product = await Product.findById(id);
               product.sorting = count;
               await product.save();
               // When all pages are asigned with new sorting property values, catch all pages and put them in request locals, so that they could be caught in the header view - for the purpose of reordering navigation links in accordance to new pages' sorting values 
               if(count >= ids.length) {
                    const products = await Product.find().sort({sorting: 1});
                    req.app.locals.products = products;
               }
          };
     } catch(err) {
          console.log(err);
     }
}


exports.getAddProductPage = async (req, res, next) => {
     try {
          // Catch all categories that could be assigned to newly added product	
          const categories = await Category.find().sort({sorting: 1});
          // Catch all brands that could be assigned to newly added product	
          const brands = await Brand.find().sort({title: 1});
          // Render view file and send data
          res.render('admin/add-productM', {
               title: 'Add Product',
               oldInput: {},
               categories: categories,
               brands: brands,
               valErrors: []
          });
     } catch (err) {
          console.log(err);
     }
}


exports.postAddProduct = async (req, res, next) => {
     // Parsing of text input data
     const title = req.body.title;
     let slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
     if(slug == "") {
          slug = title.replace(/\s+/g, '-').toLowerCase();
     }
     const price = req.body.price;
     const category = req.body.category;
     const description = req.body.description;
     const features = req.body.features;
     let originalPrice = req.body.originalPrice;
     if(originalPrice == "") {
          originalPrice = price;
     }
     // console.log('originalPrice: ' + originalPrice);
     const brand = req.body.brand;
     const productCode = req.body.productCode;
     const availability = req.body.availability;
     const featured = req.body.featured;
     const popular = req.body.popular;
     const bestSell = req.body.bestSell;
     const special = req.body.special;
     const newProd = req.body.newProd;
     try {
          // Validating the mimetype of the parsed file (if sent)
          if(req.files && (
               req.files.image.mimetype !== 'image/jpeg' && 
               req.files.image.mimetype !== 'image/jpg' && 
               req.files.image.mimetype !== 'image/png'
               )) {
               // Catch all categories that could be assigned to newly added product
               const categories = await Category.find().sort({sorting: 1});
               // Catch all brands that could be assigned to newly added product	
               const brands = await Brand.find().sort({title: 1});
               await req.flash('message-danger', 'The attached file is not an image!');
               res.status(422).render('admin/add-productM', {
                    title: 'Add Product',
                    oldInput: {
                         title: title,
                         slug: req.body.slug,
                         price: price,
                         category: category,
                         description: description,
                         features: features,
                         originalPrice: originalPrice,
                         brand: brand,
                         productCode: productCode,
                         availability: availability,
                         featured: featured,
                         popular: popular,
                         bestSell: bestSell,
                         special: special,
                         newProd: newProd
                    },
                    categories: categories,
                    brands: brands,
                    valErrors: [],
                    messageDang: req.flash('message-danger')
               });
          } else {
               //Catching and displaying validation errors
               const valErrors = validationResult(req);
               if(!valErrors.isEmpty()) {
                    // Catch all categories that could be assigned to newly added product
                    const categories = await Category.find().sort({sorting: 1});
                    // Catch all brands that could be assigned to newly added product	
                    const brands = await Brand.find().sort({title: 1});
                    res.status(422).render('admin/add-productM', {
                         title: 'Add Product',
                         oldInput: {
                              title: title,
                              slug: req.body.slug,
                              price: price,
                              category: category,
                              description: description,
                              features: features,
                              originalPrice: originalPrice,
                              brand: brand,
                              productCode: productCode,
                              availability: availability,
                              featured: featured,
                              popular: popular,
                              bestSell: bestSell,
                              special: special,
                              newProd: newProd
                         },
                         categories: categories,
                         brands: brands,
                         valErrors: valErrors.array()
                    });
               } else {
                    // Check if product with this name already exists in DB
                    const product = await Product.findOne({title: title});
                    if(product) {
                         // Catch all categories that could be assigned to newly added product
                         const categories = await Category.find().sort({sorting: 1});
                         // Catch all brands that could be assigned to newly added product	
                         const brands = await Brand.find().sort({title: 1});
                         await req.flash('message-danger', 'Product with this name already exists!');
                         return res.status(422).render('admin/add-productM', {
                              title: 'Add Product',
                              oldInput: {
                                   title: title,
                                   slug: req.body.slug,
                                   price: price,
                                   category: category,
                                   description: description,
                                   features: features,
                                   originalPrice: originalPrice,
                                   brand: brand,
                                   productCode: productCode,
                                   availability: availability,
                                   featured: featured,
                                   popular: popular,
                                   bestSell: bestSell,
                                   special: special,
                                   newProd: newProd
                              },
                              categories: categories,
                              brands: brands,
                              valErrors: [],
                              messageDang: req.flash('message-danger')
                         });
                    } else {
                         // Check if product with this slug already exists in DB
                         const product = await Product.findOne({slug: slug});
                         if(product) {
                              // Catch all categories that could be assigned to newly added product
                              const categories = await Category.find().sort({sorting: 1});
                              // Catch all brands that could be assigned to newly added product	
                              const brands = await Brand.find().sort({title: 1});
                              await req.flash('message-danger', 'Product with this slug already exists!');
                              return res.status(422).render('admin/add-productM', {
                                   title: 'Add Product',
                                   oldInput: {
                                        title: title,
                                        slug: req.body.slug,
                                        price: price,
                                        category: category,
                                        description: description,
                                        features: features,
                                        originalPrice: originalPrice,
                                        brand: brand,
                                        productCode: productCode,
                                        availability: availability,
                                        featured: featured,
                                        popular: popular,
                                        bestSell: bestSell,
                                        special: special,
                                        newProd: newProd
                                   },
                                   categories: categories,
                                   brands: brands,
                                   valErrors: [],
                                   messageDang: req.flash('message-danger')
                              });
                         } else {
                              // Check if product with this firstSlug already exists in DB
                              const product = await Product.findOne({firstSlug: slug});
                              if(product) {
                                   // Catch all categories that could be assigned to newly added product
                                   const categories = await Category.find().sort({sorting: 1});
                                   // Catch all brands that could be assigned to newly added product	
                                   const brands = await Brand.find().sort({title: 1});
                                   await req.flash('message-danger', 'Product with this firstSlug already exists!');
                                   return res.status(422).render('admin/add-productM', {
                                        title: 'Add Product',
                                        oldInput: {
                                             title: title,
                                             slug: req.body.slug,
                                             price: price,
                                             category: category,
                                             description: description,
                                             features: features,
                                             originalPrice: originalPrice,
                                             brand: brand,
                                             productCode: productCode,
                                             availability: availability,
                                             featured: featured,
                                             popular: popular,
                                             bestSell: bestSell,
                                             special: special,
                                             newProd: newProd
                                        },
                                        categories: categories,
                                        brands: brands,
                                        valErrors: [],
                                        messageDang: req.flash('message-danger')
                                   });
                              } else {
                                   // Catch the name of the sent image and set the imageName variable
                                   let imageName;
                                   if(req.files) {
                                        imageName = req.files.image.name;
                                   } else {
                                        imageName = "";
                                   }
                                   // Create new product in DB
                                   const newProduct = new Product({
                                        title: title,
                                        slug: slug,
                                        firstSlug: slug,  // firstSlug - nedded in order to have always the same image path, as slug is the part of path
                                        price: price,
                                        category: category,
                                        image: imageName,
                                        description: description,
                                        features: features,
                                        originalPrice: originalPrice,
                                        brand: brand,
                                        productCode: productCode,
                                        availability: availability,
                                        featured: featured,
                                        popular: popular,
                                        bestSell: bestSell,
                                        special: special,
                                        newProd: newProd,
                                        sorting: 500
                                   });
                                   newProduct.save();
                                   // Create folders on the server to save the image (regardless of whether it is sent or not)
                                   await mkdirp('public/images/products/' + newProduct.firstSlug);
                                   await mkdirp('public/images/products/' + newProduct.firstSlug + '/gallery');
                                   await mkdirp('public/images/products/' + newProduct.firstSlug + '/gallery/thumbs');
                                   // If sent -> save the image on the server
                                   if(imageName != "") {
                                        const image = req.files.image;
                                        const path = 'public/images/products/' + newProduct.firstSlug + '/' + imageName;
                                        // Move file to the specified place on the server using req.files.file.mv() method
                                        await image.mv(path);
                                   }
                                   await req.flash('message-success', 'New product added successfully!');
                                   res.status(201).redirect('/admin/products');
                              }
                         }
                    }
               }
          }
     } catch (err) {
          console.log(err);
     }
}


exports.getEditProductPage = async (req, res, next) => {
     const slug = req.params.slug;
     try {
          // Find the poroduct in DB
          const product = await Product.findOne({slug: slug});
          if(!product) {
               await req.flash('message-danger', 'Product not found!');
               return res.status(404).redirect('/admin/products');
          }
          // Catch gallery images (if any)
          const gallery = 'public/images/products/' + product.firstSlug + '/gallery';
          let galleryImages = null;
          galleryImages = await fsExtra.readdir(gallery);
          // Catch all categories that could be assigned to newly edited product
          const categories = await Category.find().sort({sorting: 1});
          // Catch all brands that could be assigned to newly edited product	
          const brands = await Brand.find().sort({title: 1});
          // Render view file and send data
          res.render('admin/edit-productM', {
               title: 'Edit Product',
               oldInput: {
                    title: product.title,
                    slug: product.slug,
                    firstSlug: product.firstSlug,
                    price: parseFloat(product.price).toFixed(2),
                    category: product.category,
                    description: product.description,
                    features: product.features,
                    image: product.image,
                    originalPrice: parseFloat(product.originalPrice).toFixed(2),
                    brand: product.brand,
                    productCode: product.productCode,
                    availability: product.availability,
                    featured: product.featured,
                    popular: product.popular,
                    bestSell: product.bestSell,
                    special: product.special,
                    newProd: product.newProd,
                    id: product._id
               },
               categories: categories,
               brands: brands,
               galleryImages: galleryImages,
               valErrors: []
          });
     } catch(err) {
          console.log(err);
     }
}

exports.postEditProduct = async (req, res, next) => {
     // Parsing of text input data
     const title = req.body.title;
     let slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
     if(slug == "") {
          slug = title.replace(/\s+/g, '-').toLowerCase();
     }
     const price = req.body.price;
     const category = req.body.category;
     const description = req.body.description;
     const features = req.body.features;
     const firstSlug = req.body.firstSlug;
     let originalPrice = req.body.originalPrice;
     if(originalPrice == "") {
          originalPrice = price;
     }
     const brand = req.body.brand;
     const productCode = req.body.productCode;
     const availability = req.body.availability;
     const featured = req.body.featured;
     const popular = req.body.popular;
     const bestSell = req.body.bestSell;
     const special = req.body.special;
     const newProd = req.body.newProd;
     const prodImage = req.body.prodImage;
     const productId = req.body.productId;
     try {
          // Catch gallery images (fsExtra.readdir() will also catch 'thumbs' folder inside gallery folder)
          const gallery = 'public/images/products/' + firstSlug + '/gallery';
          let galleryImages = null;
          const images = await fsExtra.readdir(gallery);
          galleryImages = images; 
          // Validating the mimetype of the parsed file (if sent)
          if(req.files && (
               req.files.image.mimetype !== 'image/jpg' && 
               req.files.image.mimetype !== 'image/jpeg' && 
               req.files.image.mimetype !== 'image/png'
               )) {
               await req.flash('message-danger', 'The attached file is not an image!');
               // Catch all categories that could be assigned to newly edited product
               const categories = await Category.find().sort({sorting: 1});
               // Catch all brands that could be assigned to newly edited product	
               const brands = await Brand.find().sort({title: 1});
               res.status(422).render('admin/edit-productM', {
                    title: 'Edit Product',
                    oldInput: {
                         title: title,
                         slug: req.body.slug,
                         price: price,
                         category: category,
                         description: description,
                         features: features,
                         firstSlug: firstSlug,
                         image: prodImage,
                         originalPrice: originalPrice,
                         brand: brand,
                         productCode: productCode,
                         availability: availability,
                         featured: featured,
                         popular: popular,
                         bestSell: bestSell,
                         special: special,
                         newProd: newProd,
                         id: productId
                    },
                    categories: categories,
                    brands: brands,
                    valErrors: [],
                    galleryImages: galleryImages,
                    messageDang: req.flash('message-danger')
               });
          } else {
               // Catching and displaying validation errors
               const valErrors = validationResult(req);
               if(!valErrors.isEmpty()) {
                    // Catch all categories that could be assigned to newly edited product
                    const categories = await Category.find().sort({sorting: 1});
                    // Catch all brands that could be assigned to newly edited product	
                    const brands = await Brand.find().sort({title: 1});
                    res.status(422).render('admin/edit-productM', {
                         title: 'Edit Product',
                         oldInput: {
                              title: title,
                              slug: req.body.slug,
                              price: price,
                              category: category,
                              description: description,
                              features: features,
                              firstSlug: firstSlug,
                              image: prodImage,
                              originalPrice: originalPrice,
                              brand: brand,
                              productCode: productCode,
                              availability: availability,
                              featured: featured,
                              popular: popular,
                              bestSell: bestSell,
                              special: special,
                              newProd: newProd,
                              id: productId
                         },
                         categories: categories,
                         brands: brands,
                         galleryImages: galleryImages,
                         valErrors: valErrors.array()
                    });
               } else {
                    // Check if other product with the same name already exists in DB (it must be unique)
                    const product = await Product.findOne({title: title, _id: {$ne: productId}});
                    if(product) {
                         await req.flash('message-danger', 'Product with this name already exists!');
                         // Catch all categories that could be given to newly edited product
                         const categories = await Category.find().sort({sorting: 1});
                         // Catch all brands that could be assigned to newly edited product	
                         const brands = await Brand.find().sort({title: 1});
                         res.status(422).render('admin/edit-productM', {
                              title: 'Edit Product',
                              oldInput: {
                                   title: title,
                                   slug: req.body.slug,
                                   price: price,
                                   category: category,
                                   description: description,
                                   features: features,
                                   firstSlug: firstSlug,
                                   image: prodImage,
                                   originalPrice: originalPrice,
                                   brand: brand,
                                   productCode: productCode,
                                   availability: availability,
                                   featured: featured,
                                   popular: popular,
                                   bestSell: bestSell,
                                   special: special,
                                   newProd: newProd,
                                   id: productId
                              },
                              categories: categories,
                              brands: brands,
                              valErrors: [],
                              galleryImages: galleryImages,
                              messageDang: req.flash('message-danger')
                         });
                    } else {
                         // Check if product with this slug already exists in DB
                         const product = await Product.findOne({slug: slug, _id: {$ne: productId}});
                         if(product) {
                              await req.flash('message-danger', 'Product with this slug already exists!');
                              // Catch all categories that could be given to newly edited product
                              const categories = await Category.find().sort({sorting: 1});
                              // Catch all brands that could be assigned to newly added product	
                              const brands = await Brand.find().sort({title: 1});
                              res.status(422).render('admin/edit-productM', {
                                   title: 'Edit Product',
                                   oldInput: {
                                        title: title,
                                        slug: req.body.slug,
                                        price: price,
                                        category: category,
                                        description: description,
                                        features: features,
                                        firstSlug: firstSlug,
                                        image: prodImage,
                                        originalPrice: originalPrice,
                                        brand: brand,
                                        productCode: productCode,
                                        availability: availability,
                                        featured: featured,
                                        popular: popular,
                                        bestSell: bestSell,
                                        special: special,
                                        newProd: newProd,
                                        id: productId
                                   },
                                   categories: categories,
                                   brands: brands,
                                   valErrors: [],
                                   galleryImages: galleryImages,
                                   messageDang: req.flash('message-danger')
                              });
                         } else {
                              // Find existing product in DB that should be edited
                              const product = await Product.findById(productId);
                              if(!product) {
                                   await req.flash('message-danger', 'Product not found!');
                                   return res.status(404).redirect('/admin/products');
                              }
                              // Catch the name of the sent image and set the imageName variable
                              let imageName;
                              if(!req.files) {
                                   imageName = "";
                              } else {
                                   imageName = req.files.image.name;
                              }
                              // Update product in DB
                              product.title = title;
                              product.slug = slug;
                              product.price = price;
                              product.originalPrice = originalPrice;
                              product.category = category;
                              product.description = description;
                              product.features = features;
                              product.brand = brand;
                              product.productCode = productCode;
                              product.availability = availability;
                              product.featured = featured;
                              product.popular = popular;
                              product.bestSell = bestSell;
                              product.special = special;
                              product.newProd = newProd;
                              if(req.files) {
                                   product.image = imageName;
                              }
                              await product.save();
                              // If new image sent - remove the old one from the server (if any)
                              if(imageName != "") {
                                   if(prodImage != "") {
                                        await fsExtra.remove('public/images/products/' + firstSlug + '/' + prodImage);
                                   }
                                   // Save new image on the server
                                   const newImage = req.files.image;
                                   const path = 'public/images/products/' + firstSlug + '/' + imageName;
                                   await newImage.mv(path);
                              } 
                              await req.flash('message-success', 'Product updated successfully!');
                              res.status(200).redirect('/admin/products');     
                         }
                    }
               }
          }
     } catch (err) {
          console.log(err);
     }
}


exports.postDropImagesToGallery = (req, res, next) => {
     console.log(req.files);
     // Catch images dropped to Dropzone on 'edit-page.ejs' (one image by one)
     const droppedImage = req.files.file;
     // Create paths on the server ehere dropped images will be saved
     const firstSlug = req.params.firstSlug;
     const path = 'public/images/products/' + firstSlug + '/gallery/' + droppedImage.name;
     const thumbsPath = 'public/images/products/' + firstSlug + '/gallery/thumbs/' + droppedImage.name;
     //Move caught images to the gallery folder
     droppedImage.mv(path)
          .then(result => {
               // Resize the moved images
               resizeImg(fsExtra.readFileSync(path), {width: 100, height: 100})
                    .then(buf => {
                         // Move resized image to the thumbs folder in the gallery
                         fsExtra.writeFileSync(thumbsPath, buf);
                    })
                    .catch(err => console.log(err));
          })
          .catch(err => console.log(err));
     // Send response status (we must do that in order that Dropzone Ajax code works)
     res.sendStatus(200);
}


exports.getDeleteImage = (req, res, next) => {
     // Catch the image to be deleted
     const productSlug = req.params.firstSlug;
     const galImage = req.query.name;
     // Find the image locations
     const path = 'public/images/products/' + productSlug + '/gallery/' + galImage;
     const thumbPath = 'public/images/products/' + productSlug + '/gallery/thumbs/' + galImage;
     // Remove the image
     fsExtra.remove(path)
          .then(result => {
               fsExtra.remove(thumbPath)
                    .then(result => {
                         req.flash('message-success', 'Image deleted successfully!');
                         // Find product's current slug needed for adequate page redirection (edit-product)
                         Product.findOne({firstSlug: productSlug})
                              .then(product => {
                                   res.status(200).redirect('/admin/edit-product/' + product.slug);
                              })
                              .catch(err => console.log(err));
                    })
                    .catch(err => console.log(err));
          })
          .catch(err => console.log(err));
}


exports.getDeleteProduct = (req, res, next) => {
     const slug = req.params.slug;
     // Find existing product in DB
     Product.findOne({slug: slug})
          .then(product => {
               if(!product) {
                    req.flash('message-danger', 'Product not found!')
                    return res.status(404).redirect('/admin/products');
               }
               // Remove product from DB
               Product.findByIdAndDelete(product._id)
                    .then(result => {
                         // Remove product's images folder from the server
                         return fsExtra.remove('public/images/products/' + product.firstSlug); 
                    })
                    .then(result => {
                         req.flash('message-success', 'Product deleted successfully!');
                         res.status(200).redirect('/admin/products');
                    })
                    .catch(err => console.log(err));
          })
          .catch(err => console.log(err));
}