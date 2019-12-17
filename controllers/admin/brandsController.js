const mkdirp = require('mkdirp');
const fsExtra = require('fs-extra');

const { validationResult } = require('express-validator/check');

const Brand = require('../../models/Brand');


exports.getBrandsListPage = async (req, res, next) => {
     try {
          const brands = await Brand.find().sort({title: 1});
          // Render view file and send data
          res.render('admin/brandsM', {
               title: 'Brands',
               brands: brands
          });
     } catch(err) {
          console.log(err);
     }
}


exports.getAddBrandPage = async (req, res, next) => {
     try {
          // Render view file and send data
          res.render('admin/add-brandM', {
               title: 'Add Brand',
               oldInput: {},
               valErrors: []
          });
     } catch(err) {
          console.log(err);
     }
}

exports.postAddBrand = async (req, res, next) => {
     // Parsing of form input data	
     const title = req.body.title;
     var slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
     if(slug == "") {
          slug = title.replace(/\s+/g, '-').toLowerCase(); 
     };
     const favourite = req.body.favourite;
     try {
          // Validating the mimetype of the parsed file (if sent)
          if(req.files && (
               req.files.image.mimetype !== 'image/jpeg' && 
               req.files.image.mimetype !== 'image/jpg' && 
               req.files.image.mimetype !== 'image/png'
               )) {
               await req.flash('message-danger', 'The attached file is not an image!');
               return res.status(422).render('admin/add-brandM', {
                    title: 'Add Brand',
                    oldInput: {
                         title: title,
                         slug: req.body.slug,
                         favourite: favourite
                    },
                    valErrors: [],
                    messageDang: req.flash('message-danger')
               });
          } else {
               // Catching and displaying validation errors	
               const valErrors = validationResult(req);                        	
               if(!valErrors.isEmpty()) {	
                    return res.status(422).render('admin/add-brandM', {
                         title: 'Add Brand',
                         oldInput: {
                              title: title,
                              slug: req.body.slug,
                              favourite: favourite
                         },
                         valErrors: valErrors.array()  
                    }); 
               }  	             
               // Check if brand with this title aleady exists in DB
               const brand = await Brand.findOne({title: title});
               if(brand) {
                    await req.flash('message-danger', 'Brand with this name already exists!');
                    return res.status(422).render('admin/add-brandM', {
                         title: 'Add Brand',
                         oldInput: {
                              title: title,
                              slug: req.body.slug,
                              favourite: favourite
                         },
                         valErrors: valErrors.array(),
                         messageDang: req.flash('message-danger')
                    });
               } else {
                    // Check if brand with this slug aleady exists in DB
                    const brand2 = await Brand.findOne({slug: slug});
                    if(brand2) {
                         await req.flash('message-danger', 'Brand with this slug already exists!');
                         return res.status(422).render('admin/add-brandM', {
                              title: 'Add Brand',
                              oldInput: {
                                   title: title,
                                   slug: req.body.slug,
                                   favourite: favourite
                              },
                              valErrors: valErrors.array(),
                              messageDang: req.flash('message-danger')
                         });
                    } else {
                         // Check if brand with this firstSlug already exists in DB
                         const brand3 = await Brand.findOne({firstSlug: slug});
                         if(brand3) {
                              req.flash('message-danger', 'Brand with this firstSlug already exists!');
                              return res.status(422).render('admin/add-brandM', {
                                   title: 'Add Brand',
                                   oldInput: {
                                        title: title,
                                        slug: req.body.slug,
                                        favourite: favourite
                                   },
                                   valErrors: [],
                                   messageDang: req.flash('message-danger')
                              });
                         } else {
                              // Catch the name of the sent image and set the imageName variable
                              let imageName;
                              if(req.files && req.files.image) {
                                   imageName = req.files.image.name;
                              } else {
                                   imageName = "";
                              }
                              // Create new brand in DB	
                              const newBrand = new Brand({
                                   title: title,
                                   slug: slug,
                                   firstSlug: slug,  // firstSlug - nedded in order to have always same image path, as slug is the part of path
                                   image: imageName,
                                   favourite: favourite
                              });
                              await newBrand.save();
                              // Create folder on the server to save brand image (regardless of whether it is sent or not)
                              await mkdirp('public/images/brands/' + newBrand.firstSlug);
                              // If sent save the image on the server
                              if(imageName !== "") {
                                   const image = req.files.image;
                                   const path = 'public/images/brands/' + newBrand.firstSlug + '/' + imageName;
                                   // Move file to the specified place on the server using req.files.file.mv() method
                                   await image.mv(path);
                              }
                              // Catch all brands and put them in request locals, so that they could be caught in shop views in the first next http request - this is done for the purpose of immediately refreshing links (for brands in the footer) -> as now one more brand link should be added
                              const favBrands = await Brand.find({favourite: true}).sort({title: 1});
                              req.app.locals.favBrands = favBrands;
                              // Redirect
                              await req.flash('message-success', 'New brand added successfully!');
                              res.status(201).redirect('/admin/brands');
                         }
                    }
               }
          }
     } catch(err) {
          console.log(err);
     }
}


exports.getEditBrandPage = async (req, res, next) => {
     const slug = req.params.slug;
     try {
          // Find brand in DB
          const brand = await Brand.findOne({slug: slug})
          if(!brand) {
               await req.flash('message-danger', 'Brand not found!')
               return res.status(404).redirect('/admin/brands');
          }
          // Render view file and send data
          return res.render('admin/edit-brandM', {
               title: 'Edit Brand',
               oldInput: {
                    title: brand.title,
                    slug: brand.slug,
                    firstSlug: brand.firstSlug,
                    favourite: brand.favourite,
                    image: brand.image,
                    id: brand._id
               },
               valErrors: []
          });
     } catch(err) {
          console.log(err);
     }
}


exports.postEditBrand = async (req, res, next) => {
     // Parsing of form input data	
     const title = req.body.title;
     var slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
     if(slug == "") {
          slug = title.replace(/\s+/g, '-').toLowerCase(); 
     };
     const firstSlug = req.body.firstSlug;
     const favourite = req.body.favourite;
     const oldImage = req.body.oldImage;
     const brandId = req.body.brandId;	
     try {
          // Validating the mimetype of the parsed file (if sent)
          if(req.files && (
               req.files.image.mimetype !== 'image/jpg' && 
               req.files.image.mimetype !== 'image/jpeg' && 
               req.files.image.mimetype !== 'image/png'
               )) {
               await req.flash('message-danger', 'The attached file is not an image!');
               return res.status(422).render('admin/edit-brandM', {
                    title: 'Edit Brand',
                    oldInput: {
                         title: title,
                         slug: req.body.slug,
                         firstSlug: firstSlug,
                         favourite: favourite,
                         image: oldImage,
                         id: brandId
                    },
                    valErrors: [],
                    messageDang: req.flash('message-danger')
               });
          } else {
               // Catching and displaying validation errors	
               const valErrors = validationResult(req);                        	
               if(!valErrors.isEmpty()) {	
                    console.log(valErrors.array());			      		  
                    return res.status(422).render('admin/edit-BrandM', {
                         title: 'Edit Brand',
                         oldInput: {
                              title: title,
                              slug: slug,
                              firstSlug: firstSlug,
                              favourite: favourite,
                              image: oldImage,
                              id: brandId
                         },
                         valErrors: valErrors.array()
                    }); 
               }  	             
               // Check if different brand with this title already exists in DB
               const brand = await Brand.findOne({title: title, _id: {$ne: brandId}});
               if(brand) {
                    await req.flash('message-danger', 'Brand with this name already exists!');
                    return res.status(422).render('admin/edit-brandM', {
                         title: 'Edit Brand',
                         oldInput: {
                              title: title,
                              slug: slug,
                              firstSlug: firstSlug,
                              favourite: favourite,
                              image: oldImage,
                              id: brandId
                         },
                         valErrors: [],
                         messageDang: req.flash('message-danger')
                    });
               } else {
                    // Check if different brand with this slug already exists in DB
                    const brand2 = await Brand.findOne({slug: slug, _id: {$ne: brandId}});
                    if(brand2) {
                         req.flash('message-danger', 'Brand with this slug already exists!');
                         return res.status(422).render('admin/edit-brandM', {
                              title: 'Edit Brand',
                              oldInput: {
                                   title: title,
                                   slug: slug,
                                   firstSlug: firstSlug,
                                   favourite: favourite,
                                   image: oldImage,
                                   id: brandId
                              },
                              valErrors: [],
                              messageDang: req.flash('message-danger')
                         });
                    } else {
                         // Find existing brand in DB that should be edited
                         const brand3 = await Brand.findById(brandId);
                         if(!brand3) {
                              await req.flash('message-danger', 'Brand not found!');
                              res.status(404).redirect('/admin/brands');
                         }
                         // Catch name of the sent image and set the imageName variable
                         let imageName;
                         if(!req.files) {
                              imageName = "";
                         } else {
                              imageName = req.files.image.name;
                         }
                         // Update brand in DB
                         brand3.title = title;
                         brand3.slug = slug;
                         brand3.favourite = favourite;
                         if(req.files) {
                              brand3.image = imageName;
                         }
                         await brand3.save();
                         // If new image sent - remove the old one from the server (if any)
                         if(imageName != "") {
                              if(oldImage != "") {
                                   await fsExtra.remove('public/images/brands/' + firstSlug + '/' + oldImage);
                              }
                              // Save new image on the server
                              const newImage = req.files.image;
                              const path = 'public/images/brands/' + firstSlug + '/' + imageName;
                              await newImage.mv(path);
                         }
                         // Catch all brands and put them in request locals, so that they could be caught in shop views in the first next http request - this is done for the purpose of immediately refreshing brand links in the footer -> as one link might be edited (e.g it's title or image)
                         const favBrands = await Brand.find({favourite: true}).sort({title: 1});
                         req.app.locals.favBrands = favBrands;
                         // Redirect
                         await req.flash('message-success', 'Brand updated successfully!');
                         res.status(200).redirect('/admin/brands');
                    }
               }
          }
     } catch(err) {
          console.log(err);
     }
}


exports.getDeleteImage = async (req, res, next) => {
     // Catch the image to be deleted
     const firstSlug = req.params.firstSlug;
     const image = req.query.name;
     const type = req.query.type;
     // Find the image locations
     const path = 'public/images/brands/' + firstSlug + '/' + image;
     try {
          // Remove the image
          await fsExtra.remove(path);
          await req.flash('message-success', 'Image deleted successfully!');
          // Find brand's current slug needed for adequate page redirection (edit-brand)
          const brand = await Brand.findOne({firstSlug: firstSlug});
          if(type === 'image') {
               brand.image = "";
          }
          await brand.save();
          res.status(200).redirect('/admin/edit-brand/' + brand.slug);
     } catch(err) {
          console.log(err);
     }
}


exports.getDeleteBrand = async (req, res, next) => {
     const slug = req.params.slug;
     try {
          // Find existing brand in DB
          const brand = await Brand.findOne({slug: slug});
          if(!brand) {
               await req.flash('message-danger', 'Brand not found!')
               return res.status(404).redirect('/admin/brands');
          }
          // Remove brand from DB
          await Brand.findByIdAndDelete(brand._id);
          // Remove brand's images folder from the server
          await fsExtra.remove('public/images/brands/' + brand.firstSlug); 
          // Catch all brands and put them in request locals, so that they could be caught in shop views in the first next http request - for the purpose of refreshing favourite brands links links in the footer -> one link should be removed
          const brands = await Brand.find({favourite: true}).sort({title: 1});
          req.app.locals.brands = brands;
          // Redirect
          req.flash('message-success', 'Brand deleted succesfully!');
          res.status(200).redirect('/admin/brands');
     } catch(err) {
          console.log(err);
     }
}