const { validationResult } = require('express-validator/check');

const Category = require('../../models/Category');

exports.getCategoriesListPage = (req, res, next) => {
     Category.find().sort({sorting: 1})
     .then(categories => {
          // Render view file and send data
          res.render('admin/categories', {
               categories: categories
          });
     })
     .catch(err => console.log(err));
}

exports.postReorderCategories = async (req, res, next) => {
     // Catch the array of category ids sent through POST request after manual reordering of categories
     console.log(req.body);
     const ids = req.body['id[]'];
     // For each reordered category -> catch it's id and increase var count for 1
     var count = 0;
     for(var i = 0; i < ids.length; i++) {
          var id = ids[i].toString();
          console.log(id);
          count++;
          // For each reordered category -> find that category in DB (based on it's previously caught id) and change it's sorting property
          try {
               const category = await Category.findById(id);
               category.sorting = count;
               await category.save();
			// When all categories are asigned with new sorting property values, catch all of them and put them in req.locals, so that they could be caught in the shop views - for the purpose of reordering sidebar links in accordance to their sorting values 
			if(count >= ids.length) {
				const categories = await Category.find().sort({sorting: 1});
                    req.app.locals.categories = categories; 
               }   
          } catch(err) {
               console.log(err);
          }
     };
}


exports.getAddCategoryPage = (req, res, next) => {
     // Render view file and send data
     res.render('admin/add-category', {
          oldInput: {},
          valErrors: []
     });
}

exports.postAddCategory = (req, res, next) => {
     // Parsing of form input data	
     const title = req.body.title.charAt(0,1).toUpperCase() + req.body.title.slice(1);
     var slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
     if(slug == "") {
          slug = title.replace(/\s+/g, '-').toLowerCase(); 
     };
     // Catching and displaying validation errors	
     const valErrors = validationResult(req);                        	
     if(!valErrors.isEmpty()) {	
          console.log(valErrors.array());			      		  
          return res.status(422).render('admin/add-category', {
               oldInput: {
                    title: title,
                    slug: req.body.slug
               },
               valErrors: valErrors.array()  
          }); 
     }  	             
     // Check if category with this title aleady exists in DB
     Category.findOne({title: title})
          .then(category => {
               if(category) {
                    req.flash('message-danger', 'Category with this title already exists!');
                    return res.status(422).render('admin/add-category', {
                         oldInput: {
                              title: title,
                              slug: req.body.slug
                         },
                         valErrors: valErrors.array(),
                         messageDang: req.flash('message-danger')
                    });
               }
               // Check if category with this slug aleady exists in DB
               Category.findOne({slug: slug})
                    .then(category => {
                         if(category) {
                              req.flash('message-danger', 'Category with this slug already exists!');
                              return res.status(422).render('admin/add-category', {
                                   oldInput: {
                                        title: title,
                                        slug: req.body.slug
                                   },
                                   valErrors: valErrors.array(),
                                   messageDang: req.flash('message-danger')
                              });
                         }
                         // Create new category in DB	
                         const newCategory = new Category({
                              title: title,
                              slug: slug,
                              sorting: 100
                         });
                         newCategory.save()
                              .then(result => {
                                   // Catch all categories and put them in request locals, so that they could be caught in shop views in the first next http request - for the purpose of refreshing sidebar links (categories) -> one more link should be added
                                   Category.find().sort({sorting: 1})
                                        .then(categories => {
                                             req.app.locals.categories = categories;
                                        })
                                        .catch(err => console.log(err));
                                   // Redirect
                                   req.flash('message-success', 'New category successfully added!');
                                   res.status(201).redirect('/admin/categories');
                              }) 
                              .catch(err => console.log(err));
                    })
                    .catch(err => console.log(err)); 
          })
          .catch(err => console.log(err)); 
}


exports.getEditCategoryPage = (req, res, next) => {
     const slug = req.params.slug;
     // Find category in DB
     Category.findOne({slug: slug})
          .then(category => {
               if(!category) {
                    req.flash('message-danger', 'Category not found!')
                    return res.status(404).redirect('/admin/categories');
               }
               // Render view file and send data
               return res.render('admin/edit-category', {
                    oldInput: {
                         title: category.title,
                         slug: category.slug,
                         id: category._id
                    },
                    valErrors: []
               });
          })
          .catch(err => console.log(err));
}

exports.postEditCategory = (req, res, next) => {
     // Parsing of form input data	
     const title = req.body.title.charAt(0).toUpperCase() + req.body.title.slice(1);
     var slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
     if(slug == "") {
          slug = title.replace(/\s+/g, '-').toLowerCase(); 
     };
     const categoryId = req.body.categoryId;	
     // Catching and displaying validation errors	
     const valErrors = validationResult(req);                        	
     if(!valErrors.isEmpty()) {	
          console.log(valErrors.array());			      		  
          return res.status(422).render('admin/edit-page', {
               oldInput: {
                    title: title,
                    slug: slug,
                    id: categoryId
               },
               valErrors: valErrors.array()
          }); 
     }  	             
     // Check if different category with this title aleady exists in DB
     Category.findOne({title: title, _id: {$ne: categoryId}})
          .then(category => {
               if(category) {
                    req.flash('message-danger', 'Category with this title already exists!');
                    console.log(req.session);
                    return res.status(422).render('admin/edit-category', {
                         oldInput: {
                              title: title,
                              slug: slug,
                              id: categoryId
                         },
                         valErrors: [],
                         messageDang: req.flash('message-danger')
                    });
               }
               // Check if different category with this slug aleady exists in DB
               Category.findOne({slug: slug, _id: {$ne: categoryId}})
                    .then(category => {
                         if(category) {
                              req.flash('message-danger', 'Category with this slug already exists!');
                              console.log(req.session);
                              return res.status(422).render('admin/edit-category', {
                                   oldInput: {
                                        title: title,
                                        slug: slug,
                                        id: categoryId
                                   },
                                   valErrors: [],
                                   messageDang: req.flash('message-danger')
                              });
                         }
                         // Find existing category in DB that should be edited
                         Category.findById(categoryId)
                              .then(category => {
                                   if(!category) {
                                        req.flash('message-danger', 'Category not found!');
                                        res.status(404).redirect('admin/categories');
                                   }
                                   // Update category in DB
                                   category.title = title;
                                   category.slug = slug;
                                   return category.save();
                              })
                              .then(result => {
                                   // Catch all categories and put them in request locals, so that they could be caught in shop views in the first next http request - for the purpose of refreshing sidebar links (categories) -> one link might be edited (e.g it's title)
                                   Category.find().sort({sorting: 1})
                                        .then(categories => {
                                             req.app.locals.categories = categories;
                                        })
                                        .catch(err => console.log(err));
                                   // Redirect
                                   req.flash('message-success', 'Category succesfully updated!');
                                   res.status(200).redirect('/admin/categories');
                              }) 
                              .catch(err => console.log(err));
                    })
                    .catch(err => console.log(err));
          })
          .catch(err => console.log(err)); 
}


exports.getDeleteCategory = (req, res, next) => {
     const slug = req.params.slug;
     // Find existing category in DB
     Category.findOne({slug: slug})
          .then(category => {
               if(!category) {
                    req.flash('message-danger', 'Category not found!')
                    return res.status(404).redirect('/admin/categories');
               }
               // Remove category from DB
               return Category.findByIdAndDelete(category._id); 
          })
          .then(result => {
               // Catch all categories and put them in request locals, so that they could be caught in shop views in the first next http request - for the purpose of refreshing sidebar links (categories) -> one link should be removed
               Category.find().sort({sorting: 1})
                    .then(categories => {
                         req.app.locals.categories = categories;
                    })
                    .catch(err => console.log(err));
               // Redirect
               req.flash('message-success', 'Category succesfully deleted!');
               res.status(200).redirect('/admin/categories');
          }) 
          .catch(err => console.log(err));
}