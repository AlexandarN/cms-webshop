const mkdirp = require('mkdirp');
const fsExtra = require('fs-extra');

const { validationResult } = require('express-validator/check');

const InfoPage = require('../../models/InfoPage');


exports.getInfoPagesListPage = async (req, res, next) => {
     try {
          const infoPages = await InfoPage.find().sort({sorting: 1});
          // Render view file and send data
          res.render('admin/info-pagesM', {
               title: 'Info Pages',
               infoPages: infoPages
          });
     } catch(err) {
          console.log(err);
     }
}


exports.postReorderInfoPages = async (req, res, next) => {
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
               const infoPage = await InfoPage.findById(id);
               infoPage.sorting = count;
               await infoPage.save();
               // When all pages are asigned with new sorting property values, catch all pages and put them in request locals, so that they could be caught in the header view - for the purpose of reordering navigation links in accordance to new pages' sorting values 
               if(count >= ids.length) {
                    const infoPages = await InfoPage.find().sort({sorting: 1});
                    req.app.locals.infoPages = infoPages;
               }
          };
     } catch(err) {
          console.log(err);
     }
}


exports.getAddInfoPagePage = async (req, res, next) => {
     try {
          // Render view file and send data
          res.render('admin/add-info-pageM', {
               title: 'Add Info Page',
               oldInput: {},
               valErrors: []
          });
     } catch (err) {
          console.log(err);
     }
}


exports.postAddInfoPage = async (req, res, next) => {
     // Parsing of form input data	
     const title = req.body.title.charAt(0).toUpperCase() + req.body.title.slice(1);
     var slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
     if(slug == "") {
          slug = title.replace(/\s+/g, '-').toLowerCase(); 
     };
     const content = req.body.content;	
     try {
          // Catching and displaying validation errors	
          const valErrors = validationResult(req);
          if(!valErrors.isEmpty()) {	
               return res.status(422).render('admin/add-info-pageM', {
                    title: 'Add Info Page',
                    oldInput: {
                         title: title,
                         slug: req.body.slug,
                         content: content
                    },
                    valErrors: valErrors.array()  
               }); 
          }  	             
          // Check if info page with this title aleady exists in DB
          const page1 = await InfoPage.findOne({title: title})
          if(page1) {
               req.flash('message-danger', 'Info Page with this title already exists!');
               return res.status(422).render('admin/add-info-pageM', {
                    title: 'Add Info Page',
                    oldInput: {
                         title: title,
                         slug: req.body.slug,
                         content: content
                    },
                    valErrors: valErrors.array(),
                    messageDang: req.flash('message-danger')
               });
          } else {
               // Check if info page with this slug aleady exists in DB
               const page2 = await InfoPage.findOne({slug: slug})
               if(page2) {
                    req.flash('message-danger', 'Info Page with this slug already exists!');
                    return res.status(422).render('admin/add-info-pageM', {
                         title: 'Add Info Page',
                         oldInput: {
                              title:title,
                              slug: req.body.slug,
                              content: content
                         },
                         valErrors: [],
                         messageDang: req.flash('message-danger')
                    });
               } else {
                    // Create new info page in DB	
                    const newInfoPage = new InfoPage({
                         title: title,
                         slug: slug,
                         content: content,
                         sorting: 100
                    });
                    await newInfoPage.save();
                    // Catch all info pages and put them in request locals, so that they could be caught in header view in the first next http request - this is done for the purpose of immediately refreshing links (info pages) in Footer -> as now one more link should be added to the nav bar
                    const infoPages = await InfoPage.find().sort({sorting: 1});
                    req.app.locals.infoPages = infoPages;
                    // Redirect
                    req.flash('message-success', 'New info page successfully added!');
                    res.status(201).redirect('/admin/info-pages');
               } 
          } 
     } catch(err) {
          console.log(err);
     }  
}      


exports.getEditInfoPagePage = async (req, res, next) => {
     const slug = req.params.slug;
     try {
          // Find the page in DB
          const infoPage = await InfoPage.findOne({slug: slug});
          if(!infoPage) {
               req.flash('message-danger', 'Info Page not found!')
               return res.status(404).redirect('/admin/info-pages');
          }
          // Render view file and send data
          return res.render('admin/edit-info-pageM', {
               title: 'Edit Info Page',
               oldInput: {
                    title: infoPage.title,
                    slug: infoPage.slug,
                    content: infoPage.content,
                    id: infoPage._id
               },
               valErrors: []
          });
     } catch (err) {
          console.log(err);
     }
}


exports.postEditInfoPage = async (req, res, next) => {
     // Parsing of form input data	
     const title = req.body.title.charAt(0).toUpperCase() + req.body.title.slice(1);
     let slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
     if(slug == "") {
          slug = title.replace(/\s+/g, '-').toLowerCase(); 
     };
     const content = req.body.content;
     const pageId = req.body.pageId;	
     try {
          // Catching and displaying validation errors	
          const valErrors = validationResult(req);                        	
          if(!valErrors.isEmpty()) {	
               return res.status(422).render('admin/edit-info-pageM', {
                    title: 'Edit Info Page',
                    oldInput: {
                         title: title,
                         slug: slug,
                         content: content,
                         id: pageId
                    },
                    valErrors: valErrors.array()
               }); 
          }  	             
          // Check if different info page with this title already exists in DB
          const page1 = await InfoPage.findOne({title: title, _id: {$ne: pageId}});
          if(page1) {
               req.flash('message-danger', 'Info Page with this title already exists!');
               return res.status(422).render('admin/edit-info-pageM', {
                    title: 'Edit Info Page',
                    oldInput: {
                         title: title,
                         slug: slug,
                         content: content,
                         id: pageId
                    },
                    valErrors: [],
                    messageDang: req.flash('message-danger')
               });
          } else {
               // Check if different info page with this slug already exists in DB
               const page2 = await InfoPage.findOne({slug: slug, _id: {$ne: pageId}});
               if(page2) {
                    req.flash('message-danger', 'Info Page with this slug already exists!');
                    return res.status(422).render('admin/edit-info-pageM', {
                         title: 'Edit Info Page',
                         oldInput: {
                              title: title,
                              slug: slug,
                              content: content,
                              id: pageId
                         },
                         valErrors: [],
                         messageDang: req.flash('message-danger')
                    });
               } else {
                    // Find existing info page in DB that should be edited
                    const infoPage = await InfoPage.findById(pageId);
                    if(!infoPage) {
                         req.flash('message-danger', 'Info Page not found!');
                         res.status(404).redirect('/admin/info-pages');
                    }
                    // Update info page in DB	
                    infoPage.title = title;
                    infoPage.slug = slug;
                    infoPage.content = content;
                    await infoPage.save();
                    // Catch all info pages and put them in request locals, so that they could be caught in header view in the first next http request - for the purpose of refreshing links (i.e. info pages) in the Footer -> as now one link is updated (might be its name)
                    const infoPages = await InfoPage.find().sort({sorting: 1});
                    req.app.locals.infoPages = infoPages;
                    // Redirect
                    req.flash('message-success', 'Info Page successfully updated!');
                    res.status(200).redirect('/admin/info-pages');
               }
          }
     } catch(err) {
          console.log(err);
     }
}


exports.getDeleteInfoPage = async (req, res, next) => {
     const slug = req.params.slug;
     try {
          // Find existing info page in DB
          const infoPage = await InfoPage.findOne({slug: slug});
          if(!infoPage) {
               req.flash('message-danger', 'Info Page not found!')
               return res.status(404).redirect('/admin/info-pages');
          } 
          // Remove info page from DB
          await InfoPage.findByIdAndDelete(infoPage._id);
          // Catch all pages and put them in request locals, so that they could be caught in header view in the first next http request - for the purpose of refreshing navigation links (i.e. pages) -> as now one nav link should be removed
          const infoPages = await InfoPage.find().sort({sorting: 1});
          req.app.locals.infoPages = infoPages;
          // Redirect
          req.flash('message-success', 'Info Page succesfully deleted!');
          res.status(200).redirect('/admin/info-pages');
     } catch(err) {
          console.log(err);
     }
}