const { validationResult } = require('express-validator/check');

const Page = require('../../models/Page');

exports.getPagesListPage = (req, res, next) => {
     Page.find().sort({sorting: 1})
          .then(pages => {
               // Render view file and send data
               res.render('admin/pages', {
                    pages: pages
               });
          })
          .catch(err => console.log(err));
}

exports.postReorderPages = async (req, res, next) => {
     // Catch the array of page ids sent through POST request after manual reordering of pages
     console.log(req.body);
     const ids = req.body['id[]'];
     // For each reordered page -> catch it's id and increase var count for 1
     var count = 0;
     for(var i = 0; i < ids.length; i++) {
          var id = ids[i].toString();
          console.log(id);
          count++;
          // For each reordered page -> find that page in DB (based on it's previously caught id) and change it's sorting property
          try {
               const page = await Page.findById(id);
               page.sorting = count;
               await page.save();
               // When all pages are asigned with new sorting property values, catch all pages and put them in request locals, so that they could be caught in the header view - for the purpose of reordering navigation links in accordance to new pages' sorting values 
               if(count >= ids.length) {
                    const pages = await Page.find().sort({sorting: 1});
                    req.app.locals.pages = pages;
               }
          } catch(err) {
               console.log(err);
          }
     };
}


exports.getAddPagePage = (req, res, next) => {
     // Render view file and send data
     res.render('admin/add-page', {
          oldInput: {},
          valErrors: []
     });
}

exports.postAddPage = (req, res, next) => {
     // Parsing of form input data	
     const title = req.body.title.charAt(0).toUpperCase() + req.body.title.slice(1);
     var slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
     if(slug == "") {
          slug = title.replace(/\s+/g, '-').toLowerCase(); 
     };
     const content = req.body.content;	
     // Catching and displaying validation errors	
     const valErrors = validationResult(req);                        	
     if(!valErrors.isEmpty()) {	
          console.log(valErrors.array());			      		  
          return res.status(422).render('admin/add-page', {
               oldInput: {
                    title: title,
                    slug: req.body.slug,
                    content: content
               },
               valErrors: valErrors.array()  
          }); 
     }  	             
     // Check if page with this title aleady exists in DB
     Page.findOne({title: title})
          .then(page => {
               if(page) {
                    req.flash('message-danger', 'Page with this title already exists!');
                    return res.status(422).render('admin/add-page', {
                         oldInput: {
                              title: title,
                              slug: req.body.slug,
                              content: content
                         },
                         valErrors: valErrors.array(),
                         messageDang: req.flash('message-danger')
                    });
               }
               // Check if page with this slug aleady exists in DB
               Page.findOne({slug: slug})
                    .then(page => {
                         if(page) {
                              req.flash('message-danger', 'Page with this slug already exists!');
                              return res.status(422).render('admin/add-page', {
                                   oldInput: {
                                        title: title,
                                        slug: req.body.slug,
                                        content: content
                                   },
                                   valErrors: valErrors.array(),
                                   messageDang: req.flash('message-danger')
                              });
                         }
                         // Create new page in DB	
                         const newPage = new Page({
                              title: title,
                              slug: slug,
                              content: content,
                              sorting: 100
                         });
                         newPage.save()
                              .then(result => {
                                   // Catch all pages and put them in request locals, so that they could be caught in header view in the first next http request - for the purpose of refreshing navigation links (pages) -> one more link should be added
                                   Page.find().sort({sorting: 1})
                                        .then(pages => {
                                             req.app.locals.pages = pages;
                                        })
                                        .catch(err => console.log(err));
                                   // Redirect
                                   req.flash('message-success', 'New page successfully added!');
                                   res.status(201).redirect('/admin/pages');
                              }) 
                              .catch(err => console.log(err));
                    })
                    .catch(err => console.log(err));  
          })
          .catch(err => console.log(err)); 
}         


exports.getEditPagePage = (req, res, next) => {
     const slug = req.params.slug;
     // Find page in DB
     Page.findOne({slug: slug})
          .then(page => {
               if(!page) {
                    req.flash('message-danger', 'Page not found!')
                    return res.status(404).redirect('/admin/pages');
               }
               // Render view file and send data
               return res.render('admin/edit-page', {
                    oldInput: {
                         title: page.title,
                         slug: page.slug,
                         content: page.content,
                         id: page._id
                    },
                    valErrors: []
               });
          })
          .catch(err => console.log(err));
}

exports.postEditPage = (req, res, next) => {
     // Parsing of form input data	
     const title = req.body.title.charAt(0).toUpperCase() + req.body.title.slice(1);
     var slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
     if(slug == "") {
          slug = title.replace(/\s+/g, '-').toLowerCase(); 
     };
     const content = req.body.content;
     const pageId = req.body.pageId;	
     // Catching and displaying validation errors	
     const valErrors = validationResult(req);                        	
     if(!valErrors.isEmpty()) {	
          console.log(valErrors.array());			      		  
          return res.status(422).render('admin/edit-page', {
               oldInput: {
                    title: title,
                    slug: slug,
                    content: content,
                    id: pageId
               },
               valErrors: valErrors.array()
          }); 
     }  	             
     // Check if different page with this title aleady exists in DB
     Page.findOne({title: title, _id: {$ne: pageId}})
          .then(page => {
               if(page) {
                    req.flash('message-danger', 'Page with this title already exists!');
                    console.log(req.session);
                    return res.status(422).render('admin/edit-page', {
                         oldInput: {
                              title: title,
                              slug: slug,
                              content: content,
                              id: pageId
                         },
                         valErrors: [],
                         messageDang: req.flash('message-danger')
                    });
               }
               // Check if different page with this slug aleady exists in DB
               Page.findOne({slug: slug, _id: {$ne: pageId}})
                    .then(page => {
                         if(page) {
                              req.flash('message-danger', 'Page with this slug already exists!');
                              console.log(req.session);
                              return res.status(422).render('admin/edit-page', {
                                   oldInput: {
                                        title: title,
                                        slug: slug,
                                        content: content,
                                        id: pageId
                                   },
                                   valErrors: [],
                                   messageDang: req.flash('message-danger')
                              });
                         }
                         // Find existing page in DB that should be edited
                         Page.findById(pageId)
                              .then(page => {
                                   if(!page) {
                                        req.flash('message-danger', 'Page not found!');
                                        res.status(404).redirect('admin/pages');
                                   }
                                   // Update page in DB	
                                   page.title = title;
                                   page.slug = slug;
                                   page.content = content;
                                   return page.save();
                              })
                              .then(result => {
                                   // Catch all pages and put them in request locals, so that they could be caught in header view in the first next http request - for the purpose of refreshing navigation links (pages) -> one link is updated (maybe its name)
                                   Page.find().sort({sorting: 1})
                                        .then(pages => {
                                             req.app.locals.pages = pages;
                                        })
                                        .catch(err => console.log(err));
                                   // Redirect
                                   req.flash('message-success', 'Page succesfully updated!');
                                   res.status(200).redirect('/admin/pages');
                              }) 
                              .catch(err => console.log(err));
                    })
                    .catch(err => console.log(err));
          })
          .catch(err => console.log(err));
}


exports.getDeletePage = (req, res, next) => {
     const slug = req.params.slug;
     // Find existing page in DB
     Page.findOne({slug: slug})
          .then(page => {
               if(!page) {
                    req.flash('message-danger', 'Page not found!')
                    return res.status(404).redirect('/admin/pages');
               }
               console.log('Page found!');
               // Remove page from DB
               return Page.findByIdAndDelete(page._id); 
          })
          .then(result => {
               // Catch all pages and put them in request locals, so that they could be caught in header view in the first next http request - for the purpose of refreshing navigation links (pages) -> one link should be removed
               Page.find().sort({sorting: 1})
                    .then(pages => {
                         req.app.locals.pages = pages;
                    })
                    .catch(err => console.log(err));
               // Redirect
               req.flash('message-success', 'Page succesfully deleted!');
               res.status(200).redirect('/admin/pages');
          }) 
          .catch(err => console.log(err));
}

