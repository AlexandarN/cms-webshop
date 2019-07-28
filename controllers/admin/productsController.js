const mkdirp = require('mkdirp');
const fsExtra = require('fs-extra');
const resizeImg = require('resize-img');

const { validationResult } = require('express-validator/check');

const Product = require('../../models/Product');
const Category = require('../../models/Category');

exports.getProductsListPage = (req, res, next) => {
     Product.find()
          .then(products => {
               // Render view file and send data
               res.render('admin/products', {
                    products: products
               });
          })
          .catch(err => console.log(err));
}


exports.getAddProductPage = (req, res, next) => {
     // Catch all categories that could be asigned to newly added product	
     Category.find().sort({sorting: 1})
          .then(categories => {
               // Render view file and send data
               res.render('admin/add-product', {
                    oldInput: {},
                    categories: categories,
                    valErrors: []
               });
          })
          .catch(err => console.log(err));
}

exports.postAddProduct = (req, res, next) => {
     // Parsing of text input data
     const title = req.body.title;
     let slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
     if(slug == "") {
          slug = title.replace(/\s+/g, '-').toLowerCase();
     }
     const price = req.body.price;
     const category = req.body.category;
     const description = req.body.description;
     // Validating the mimetype of the parsed file (if sent)
     if(req.files && (req.files.image.mimetype !== 'image/jpeg' && req.files.image.mimetype !== 'image/jpg' && req.files.image.mimetype !== 'image/png')) {
          req.flash('message-danger', 'The attached file is not an image!');
          // Catch all categories that could be asigned to newly added product
          Category.find().sort({sorting: 1})
               .then(categories => {
                    return res.status(422).render('admin/add-product', {
                         oldInput: {
                              title: title,
                              slug: req.body.slug,
                              price: price,
                              category: category,
                              description: description
                         },
                         categories: categories,
                         valErrors: [],
                         messageDang: req.flash('message-danger')
                    });
               })
               .catch(err => console.log(err)); 
     } else {
          //Catching and displaying validation errors
          const valErrors = validationResult(req);
          if(!valErrors.isEmpty()) {
               // Catch all categories that could be asigned to newly added product
               Category.find().sort({sorting: 1})
                    .then(categories => {
                         return res.status(422).render('admin/add-product', {
                              oldInput: {
                                   title: title,
                                   slug: req.body.slug,
                                   price: price,
                                   category: category,
                                   description: description
                              },
                              categories: categories,
                              valErrors: valErrors.array()
                         });
                    })
                    .catch(err => console.log(err)); 
          }
          // Check if product with this name already exists in DB
          Product.findOne({title: title})
               .then(product => {
                    if(product) {
                         req.flash('message-danger', 'Product with this name already exists!');
                         // Catch all categories that could be asigned to newly added product
                         Category.find().sort({sorting: 1})
                              .then(categories => {
                                   return res.status(422).render('admin/add-product', {
                                        oldInput: {
                                             title: title,
                                             slug: req.body.slug,
                                             price: price,
                                             category: category,
                                             description: description
                                        },
                                        categories: categories,
                                        valErrors: [],
                                        messageDang: req.flash('message-danger')
                                   });
                              })
                              .catch(err => console.log(err)); 
                    } else {
                         // Check if product with this slug already exists in DB
                         Product.findOne({slug: slug})
                              .then(product => {
                                   if(product) {
                                        req.flash('message-danger', 'Product with this slug already exists!');
                                        // Catch all categories that could be asigned to newly added product
                                        Category.find().sort({sorting: 1})
                                             .then(categories => {
                                                  return res.status(422).render('admin/add-product', {
                                                       oldInput: {
                                                            title: title,
                                                            slug: req.body.slug,
                                                            price: price,
                                                            category: category,
                                                            description: description
                                                       },
                                                       categories: categories,
                                                       valErrors: [],
                                                       messageDang: req.flash('message-danger')
                                                  });
                                             })
                                             .catch(err => console.log(err)); 
                                   } else {
                                        // Check if product with this firstSlug already exists in DB
                                        Product.findOne({firstSlug: slug})
                                             .then(product => {
                                                  if(product) {
                                                       req.flash('message-danger', 'Product with this firstSlug already exists!');
                                                       // Catch all categories that could be asigned to newly added product
                                                       Category.find().sort({sorting: 1})
                                                            .then(categories => {
                                                                 return res.status(422).render('admin/add-product', {
                                                                      oldInput: {
                                                                           title: title,
                                                                           slug: req.body.slug,
                                                                           price: price,
                                                                           category: category,
                                                                           description: description
                                                                      },
                                                                      categories: categories,
                                                                      valErrors: [],
                                                                      messageDang: req.flash('message-danger')
                                                                 });
                                                            })
                                                            .catch(err => console.log(err)); 
                                                  } else {
                                                       // Set the imageName variable
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
                                                            description: description
                                                       });
                                                       newProduct.save()
                                                            .then(result => {
                                                                 // Create folders on the server to save the image (regardless of if it' been sent)
                                                                 mkdirp('public/images/products/' + newProduct.firstSlug);
                                                                 mkdirp('public/images/products/' + newProduct.firstSlug + '/gallery');
                                                                 mkdirp('public/images/products/' + newProduct.firstSlug + '/gallery/thumbs');
                                                                 // If sent save the image on the server
                                                                 if(imageName != "") {
                                                                      const image = req.files.image;
                                                                      const path = 'public/images/products/' + newProduct.firstSlug + '/' + imageName;
                                                                      image.mv(path)
                                                                           .then(result = console.log(result))
                                                                           .catch(err => console.log(err));
                                                                 }
                                                                 req.flash('message-success', 'New product added succesfully!');
                                                                 res.status(201).redirect('/admin/products');
                                                            })
                                                            .catch(err => console.log(err));
                                                  }
                                             })
                                             .catch(err => console.log(err)); 
                                   }
                              })
                              .catch(err => console.log(err));
                    }
               })
               .catch(err => console.log(err)); 
     }
}


exports.getEditProductPage = (req, res, next) => {
     const slug = req.params.slug;
     Product.findOne({slug: slug})
          .then(product => {
               if(!product) {
                    req.flash('message-danger', 'Product not found!');
                    return res.status(404).redirect('/admin/products');
               }
               // Catch gallery images (if any)
               const gallery = 'public/images/products/' + product.firstSlug + '/gallery';
               let galleryImages = null;
               fsExtra.readdir(gallery)
                    .then(images => {
                         galleryImages = images;
                         //Catch all categories that could be asigned to newly edited product
                         Category.find().sort({sorting: 1})
                              .then(categories => {
                                   // Render view file and send data
                                   res.render('admin/edit-product', {
                                        oldInput: {
                                             title: product.title,
                                             slug: product.slug,
                                             price: parseFloat(product.price).toFixed(2),
                                             category: product.category,
                                             description: product.description,
                                             firstSlug: product.firstSlug,
                                             image: product.image,
                                             id: product._id
                                        },
                                        categories: categories,
                                        galleryImages: galleryImages,
                                        valErrors: []
                                   });
                              })
                              .catch(err => console.log(err));
                    })
                    .catch(err => console.log(err));
          })
          .catch(err => console.log(err));
}

exports.postEditProduct = (req, res, next) => {
     // Parsing of text input data
     const title = req.body.title;
     let slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
     if(slug == "") {
          slug = title.replace(/\s+/g, '-').toLowerCase();
     }
     const price = req.body.price;
     const category = req.body.category;
     const description = req.body.description;
     const firstSlug = req.body.firstSlug;
     const prodImage = req.body.prodImage;
     const productId = req.body.productId;
     // Catch gallery images (fsExtra.readdir() will also catch 'thumbs' folder inside gallery folder)
     const gallery = 'public/images/products/' + firstSlug + '/gallery';
     let galleryImages = null;
     fsExtra.readdir(gallery)
          .then(images => {
               galleryImages = images; 
          })
          .catch(err => console.log(err));
     // Validating the mimetype of the parsed file (if sent)
     if(req.files && (req.files.image.mimetype !== 'image/jpg' && req.files.image.mimetype !== 'image/jpeg' && req.files.image.mimetype !== 'image/png')) {
          req.flash('message-danger', 'The attached file is not an image!');
          // Catch all categories that could be given to newly edited product
          Category.find().sort({sorting: 1})
               .then(categories => {
                    return res.status(422).render('admin/edit-product', {
                         oldInput: {
                              title: title,
                              slug: req.body.slug,
                              price: price,
                              category: category,
                              description: description,
                              firstSlug: firstSlug,
                              image: prodImage,
                              id: productId
                         },
                         categories: categories,
                         valErrors: [],
                         galleryImages: galleryImages,
                         messageDang: req.flash('message-danger')
                    });
               })
               .catch(err => console.log(err));

     } else {
          // Catching and displaying validation errors
          const valErrors = validationResult(req);
          if(!valErrors.isEmpty()) {
               // Catch all categories that could be given to newly edited product
               Category.find().sort({sorting: 1})
                    .then(categories => {
                         return res.status(422).render('admin/edit-product', {
                              oldInput: {
                                   title: title,
                                   slug: req.body.slug,
                                   price: price,
                                   category: category,
                                   description: description,
                                   firstSlug: firstSlug,
                                   image: prodImage,
                                   id: productId
                              },
                              categories: categories,
                              galleryImages: galleryImages,
                              valErrors: valErrors.array()
                         });
                    })
                    .catch(err => console.log(err));
   
          }
          // Check if other product with the same name already exists in DB (it must be unique)
          Product.findOne({title: title, _id: {$ne: productId}})
               .then(product => {
                    if(product) {
                         req.flash('message-danger', 'Product with this name already exists!');
                         // Catch all categories that could be given to newly edited product
                         Category.find().sort({sorting: 1})
                              .then(categories => {
                                   return res.status(422).render('admin/edit-product', {
                                        oldInput: {
                                             title: title,
                                             slug: req.body.slug,
                                             price: price,
                                             category: category,
                                             description: description,
                                             firstSlug: firstSlug,
                                             image: prodImage,
                                             id: productId
                                        },
                                        categories: categories,
                                        valErrors: [],
                                        galleryImages: galleryImages,
                                        messageDang: req.flash('message-danger')
                                   });
                              })
                              .catch(err => console.log(err));

                    } else {
                         // Check if product with this slug already exists in DB
                         Product.findOne({slug: slug, _id: {$ne: productId}})
                              .then(product => {
                                   if(product) {
                                        req.flash('message-danger', 'Product with this slug already exists!');
                                        // Catch all categories that could be given to newly edited product
                                        Category.find().sort({sorting: 1})
                                             .then(categories => {
                                                  return res.status(422).render('admin/edit-product', {
                                                       oldInput: {
                                                            title: title,
                                                            slug: req.body.slug,
                                                            price: price,
                                                            category: category,
                                                            description: description,
                                                            firstSlug: firstSlug,
                                                            image: prodImage,
                                                            id: productId
                                                       },
                                                       categories: categories,
                                                       valErrors: [],
                                                       galleryImages: galleryImages,
                                                       messageDang: req.flash('message-danger')
                                                  });
                                             })
                                             .catch(err => console.log(err));

                                   } else {
                                        // Find existing product in DB that should be edited
                                        Product.findById(productId)
                                             .then(product => {
                                                  if(!product) {
                                                       req.flash('message-danger', 'Product not found!');
                                                       return res.status(404).redirect('/admin/products');
                                                  }
                                                  // Set the imageName variable
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
                                                  product.category = category;
                                                  if(req.files) {
                                                       product.image = imageName;
                                                  }
                                                  product.description = description;
                                                  product.save()
                                                       .then(result => {
                                                            // If new image sent - remove the old one from the server (if any)
                                                            if(imageName != "") {
                                                                  if(prodImage != "") {
                                                                       fsExtra.remove('public/images/products/' + firstSlug + '/' + prodImage)
                                                                           .then(result => {})
                                                                           .catch(err => console.log(err));
                                                                  }
                                                                  // Save new image on the server
                                                                  const newImage = req.files.image;
                                                                  const path = 'public/images/products/' + firstSlug + '/' + imageName;
                                                                  newImage.mv(path)
                                                                      .then(result => {})
                                                                      .catch(err => console.log(err));
                                                            } 
                                                            req.flash('message-success', 'Product updated successfully!');
                                                            res.status(200).redirect('/admin/products');     
                                                       })
                                                       .catch(err => console.log(err));
                                             })
                                             .catch(err => console.log(err));
                                   }
                              })
                              .catch(err => console.log(err));
                    }
               })
               .catch(err => console.log(err));
     }
}

exports.postDropImagesToGallery =(req, res, next) => {
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
                         req.flash('message-success', 'Image deleted sucessfully!');
                         // Find product's current slug needed for appropriate page redirection (edit-product)
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
                         return fsExtra.remove('public/images/products/' + product.firstSlug); })
                    .then(result => {
                         req.flash('message-success', 'Product deleted succesfully!');
                         res.status(200).redirect('/admin/products');
                    })
                    .catch(err => console.log(err));
          })
          .catch(err => console.log(err));
}