const mkdirp = require('mkdirp');
const fsExtra = require('fs-extra');

const { validationResult } = require('express-validator/check');

const Page = require('../../models/Page');

exports.getPagesListPage = async (req, res, next) => {
     try {
          const pages = await Page.find().sort({sorting: 1});
          // Render view file and send data
          res.render('admin/pagesM', {
               title: 'Pages',
               pages: pages
          });
     } catch(err) {
          console.log(err);
     }
}

exports.postReorderPages = async (req, res, next) => {
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
               const page = await Page.findById(id);
               page.sorting = count;
               await page.save();
               // When all pages are asigned with new sorting property values, catch all pages and put them in request locals, so that they could be caught in the header view - for the purpose of reordering navigation links in accordance to new pages' sorting values 
               if(count >= ids.length) {
                    const pages = await Page.find().sort({sorting: 1});
                    req.app.locals.pages = pages;
               }
          };
     } catch(err) {
          console.log(err);
     }
}


exports.getAddPagePage = async (req, res, next) => {
     try {
          // Render view file and send data
          res.render('admin/add-pageM', {
               title: 'Add Page',
               oldInput: {},
               valErrors: []
          });
     } catch (err) {
          console.log(err);
     }
}

exports.postAddPage = (req, res, next) => {
     // Parsing of form input data	
     const title = req.body.title.charAt(0).toUpperCase() + req.body.title.slice(1);
     var slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
     if(slug == "") {
          slug = title.replace(/\s+/g, '-').toLowerCase(); 
     };
     const subtitle1 = req.body.subtitle1;	
     const content = req.body.content;	
     const subtitle2 = req.body.subtitle2;	
     const subcontent = req.body.subcontent;
     // Validating the mimetype of the parsed file (if sent)
     if(req.files && (
          req.files.banner.mimetype !== 'image/jpeg' && 
          req.files.banner.mimetype !== 'image/jpg' && 
          req.files.banner.mimetype !== 'image/png' &&
          req.files.image1.mimetype !== 'image/jpeg' && 
          req.files.image1.mimetype !== 'image/jpg' && 
          req.files.image1.mimetype !== 'image/png' &&
          req.files.image2.mimetype !== 'image/jpeg' && 
          req.files.image2.mimetype !== 'image/jpg' && 
          req.files.image2.mimetype !== 'image/png'
          )) {
          req.flash('message-danger', 'One or more of the attached files are not images!');
          return res.status(422).render('admin/add-pageM', {
               title: 'Add Page',
               oldInput: {
                    title: title,
                    slug: req.body.slug,
                    subtitle1: subtitle1,
                    content: content,
                    subtitle2: subtitle2,
                    subcontent: subcontent
               },
               valErrors: [],
               messageDang: req.flash('message-danger')
          });
     } else {
          // Catching and displaying validation errors	
          const valErrors = validationResult(req);
          if(!valErrors.isEmpty()) {	
               return res.status(422).render('admin/add-pageM', {
                    title: 'Add Page',
                    oldInput: {
                         title: title,
                         slug: req.body.slug,
                         subtitle1: subtitle1,
                         content: content,
                         subtitle2: subtitle2,
                         subcontent: subcontent
                    },
                    valErrors: valErrors.array()  
               }); 
          }  	             
          // Check if page with this title aleady exists in DB
          Page.findOne({title: title})
               .then(page => {
                    if(page) {
                         req.flash('message-danger', 'Page with this title already exists!');
                         return res.status(422).render('admin/add-pageM', {
                              title: 'Add Page',
                              oldInput: {
                                   title: title,
                                   slug: req.body.slug,
                                   subtitle1: subtitle1,
                                   content: content,
                                   subtitle2: subtitle2,
                                   subcontent: subcontent
                              },
                              valErrors: valErrors.array(),
                              messageDang: req.flash('message-danger')
                         });
                    } else {
                         // Check if page with this slug aleady exists in DB
                         Page.findOne({slug: slug})
                              .then(page => {
                                   if(page) {
                                        req.flash('message-danger', 'Page with this slug already exists!');
                                        return res.status(422).render('admin/add-pageM', {
                                             title: 'Add Page',
                                             oldInput: {
                                                  title:title,
                                                  slug: req.body.slug,
                                                  subtitle1: subtitle1,
                                                  content: content,
                                                  subtitle2: subtitle2,
                                                  subcontent: subcontent
                                             },
                                             valErrors: [],
                                             messageDang: req.flash('message-danger')
                                        });
                                   } else {
                                        // Check if page with this firstSlug already exists in DB
                                        Page.findOne({firstSlug: slug})
                                             .then(page => {
                                                  if(page) {
                                                       req.flash('message-danger', 'Page with this firstSlug already exists!');
                                                       return res.status(422).render('admin/add-pageM', {
                                                            title: 'Add Page',
                                                            oldInput: {
                                                                 title: title,
                                                                 slug: req.body.slug,
                                                                 subtitle1: subtitle1,
                                                                 content: content,
                                                                 subtitle2: subtitle2,
                                                                 subcontent: subcontent
                                                            },
                                                            valErrors: [],
                                                            messageDang: req.flash('message-danger')
                                                       });
                                                  } else {
                                                       // Catch names of the sent images and set imageName variables
                                                       let bannerName;
                                                       if(req.files && req.files.banner) {
                                                            bannerName = req.files.banner.name;
                                                       } else {
                                                            bannerName = "";
                                                       }
                                                       // Set the image1Name variable
                                                       let image1Name;
                                                       if(req.files && req.files.image1) {
                                                            image1Name = req.files.image1.name;
                                                       } else {
                                                            image1Name = "";
                                                       }
                                                       // Set the image2Name variable
                                                       let image2Name;
                                                       if(req.files && req.files.image2) {
                                                            image2Name = req.files.image2.name;
                                                       } else {
                                                            image2Name = "";
                                                       }
                                                       // Create new page in DB	
                                                       const newPage = new Page({
                                                            title: title,
                                                            slug: slug,
                                                            firstSlug: slug,  // firstSlug - nedded in order to have always the same image path, as slug is the part of path
                                                            banner: bannerName,
                                                            image1: image1Name,
                                                            image2: image2Name,
                                                            subtitle1: subtitle1,
                                                            content: content,
                                                            subtitle2: subtitle2,
                                                            subcontent: subcontent,
                                                            sorting: 100
                                                       });
                                                       newPage.save()
                                                            .then(result => {
                                                                 // Create folders on the server to save page images (regardless of whether they are sent or not)
                                                                 mkdirp('public/images/pages/' + newPage.firstSlug);
                                                                 // mkdirp('public/images/pages/' + newPage.firstSlug + '/image1');
                                                                 // mkdirp('public/images/pages/' + newPage.firstSlug + '/image2');
                                                                 // If sent save the images on the server
                                                                 if(bannerName != "") {
                                                                      const banner = req.files.banner;
                                                                      const path = 'public/images/pages/' + newPage.firstSlug + '/' + bannerName;
                                                                      // Move file to the specified place on the server using req.files.file.mv() method
                                                                      banner.mv(path)
                                                                           .then(result => {})
                                                                           .catch(err => console.log(err));
                                                                 }
                                                                 if(image1Name != "") {
                                                                      const image1 = req.files.image1;
                                                                      const path1 = 'public/images/pages/' + newPage.firstSlug + '/' + image1Name;
                                                                      console.log('image1 path:' + path1);
                                                                      image1.mv(path1)
                                                                           .then(result => {})
                                                                           .catch(err => console.log(err));
                                                                 }
                                                                 if(image2Name != "") {
                                                                      const image2 = req.files.image2;
                                                                      const path2 = 'public/images/pages/' + newPage.firstSlug + '/' + image2Name;
                                                                      console.log('image2 path:' + path2);
                                                                      image2.mv(path2)
                                                                           .then(result => {})
                                                                           .catch(err => console.log(err));
                                                                 }
                                                                 // Catch all pages and put them in request locals, so that they could be caught in header view in the first next http request - this is done for the purpose of immediately refreshing navigation links (pages) -> as now one more nav link should be added to the nav bar
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


exports.getEditPagePage = (req, res, next) => {
     const slug = req.params.slug;
     // Find the page in DB
     Page.findOne({slug: slug})
          .then(page => {
               if(!page) {
                    req.flash('message-danger', 'Page not found!')
                    return res.status(404).redirect('/admin/pages');
               }
               // Render view file and send data
               return res.render('admin/edit-pageM', {
                    title: 'Edit Page',
                    oldInput: {
                         title: page.title,
                         slug: page.slug,
                         firstSlug: page.firstSlug,
                         subtitle1: page.subtitle1,
                         content: page.content,
                         subtitle2: page.subtitle2,
                         subcontent: page.subcontent,
                         banner: page.banner,
                         image1: page.image1,
                         image2: page.image2,
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
     let slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
     if(slug == "") {
          slug = title.replace(/\s+/g, '-').toLowerCase(); 
     };
     const subtitle1 = req.body.subtitle1;
     const content = req.body.content;
     const subtitle2 = req.body.subtitle2;
     const subcontent = req.body.subcontent;
     const firstSlug = req.body.firstSlug;
     const oldBanner = req.body.oldBanner;
     const oldImage1 = req.body.oldImage1;
     const oldImage2 = req.body.oldImage2;
     const pageId = req.body.pageId;	
     // Validating the mimetype of the parsed file (if sent)
     if((req.files && (req.files.banner &&
               req.files.banner.mimetype !== 'image/jpeg' && 
               req.files.banner.mimetype !== 'image/jpg' && 
               req.files.banner.mimetype !== 'image/png')) ||
          (req.files && (req.files.image1 &&
               req.files.image1.mimetype !== 'image/jpeg' && 
               req.files.image1.mimetype !== 'image/jpg' && 
               req.files.image1.mimetype !== 'image/png')) ||
          (req.files && (req.files.image2 &&
               req.files.image2.mimetype !== 'image/jpeg' && 
               req.files.image2.mimetype !== 'image/jpg' && 
               req.files.image2.mimetype !== 'image/png'))
          ) {
          req.flash('message-danger', 'One or more of the attached files is not an image!');
          return res.status(422).render('admin/edit-pageM', {
               title: 'Edit Page',
               oldInput: {
                    title: title,
                    slug: req.body.slug,
                    subtitle1: subtitle1,
                    content: content,
                    subtitle2: subtitle2,
                    subcontent: subcontent,
                    firstSlug: firstSlug,
                    banner: oldBanner,
                    image1: oldImage1,
                    image2: oldImage2,
                    id: pageId
               },
               valErrors: [],
               messageDang: req.flash('message-danger')
          });
     } else {
          // Catching and displaying validation errors	
          const valErrors = validationResult(req);                        	
          if(!valErrors.isEmpty()) {	
               console.log(valErrors.array());			      		  
               return res.status(422).render('admin/edit-pageM', {
                    title: 'Edit Page',
                    oldInput: {
                         title: title,
                         slug: slug,
                         subtitle1: subtitle1,
                         content: content,
                         subtitle2: subtitle2,
                         subcontent: subcontent,
                         firstSlug: firstSlug,
                         banner: oldBanner,
                         image1: oldImage1,
                         image2: oldImage2,
                         id: pageId
                    },
                    valErrors: valErrors.array()
               }); 
          }  	             
          // Check if different page with this title already exists in DB
          Page.findOne({title: title, _id: {$ne: pageId}})
               .then(page => {
                    if(page) {
                         req.flash('message-danger', 'Page with this title already exists!');
                         return res.status(422).render('admin/edit-pageM', {
                              title: 'Edit Page',
                              oldInput: {
                                   title: title,
                                   slug: slug,
                                   subtitle1: subtitle1,
                                   content: content,
                                   subtitle2: subtitle2,
                                   subcontent: subcontent,
                                   firstSlug: firstSlug,
                                   banner: oldBanner,
                                   image1: oldImage1,
                                   image2: oldImage2,
                                   id: pageId
                              },
                              valErrors: [],
                              messageDang: req.flash('message-danger')
                         });
                    } else {
                         // Check if different page with this slug already exists in DB
                         Page.findOne({slug: slug, _id: {$ne: pageId}})
                              .then(page => {
                                   if(page) {
                                        req.flash('message-danger', 'Page with this slug already exists!');
                                        return res.status(422).render('admin/edit-pageM', {
                                             title: 'Edit Page',
                                             oldInput: {
                                                  title: title,
                                                  slug: slug,
                                                  subtitle1: subtitle1,
                                                  content: content,
                                                  subtitle2: subtitle2,
                                                  subcontent: subcontent,
                                                  firstSlug: firstSlug,
                                                  banner: oldBanner,
                                                  image1: oldImage1,
                                                  image2: oldImage2,
                                                  id: pageId
                                             },
                                             valErrors: [],
                                             messageDang: req.flash('message-danger')
                                        });
                                   } else {
                                        // Find existing page in DB that should be edited
                                        Page.findById(pageId)
                                             .then(page => {
                                                  if(!page) {
                                                       req.flash('message-danger', 'Page not found!');
                                                       res.status(404).redirect('/admin/pages');
                                                  }
                                                  // Catch names of the sent images and set imageName variables
                                                  let bannerName;
                                                  if(req.files && req.files.banner) {
                                                       bannerName = req.files.banner.name;
                                                  } else {
                                                       bannerName = "";
                                                  }
                                                  // Set the image1Name variable
                                                  let image1Name;
                                                  if(req.files && req.files.image1) {
                                                       image1Name = req.files.image1.name;
                                                  } else {
                                                       image1Name = "";
                                                  }
                                                  // Set the image2Name variable
                                                  let image2Name;
                                                  if(req.files && req.files.image2) {
                                                       image2Name = req.files.image2.name;
                                                  } else {
                                                       image2Name = "";
                                                  }
                                                  // Update page in DB	
                                                  page.title = title;
                                                  page.slug = slug;
                                                  page.subtitle1 = subtitle1;
                                                  page.content = content;
                                                  page.subtitle2 = subtitle2;
                                                  page.subcontent = subcontent;
                                                  if(req.files && req.files.banner) {
                                                       page.banner = bannerName;
                                                  }
                                                  if(req.files && req.files.image1) {
                                                       page.image1 = image1Name;
                                                  }
                                                  if(req.files && req.files.image2) {
                                                       page.image2 = image2Name;
                                                  }
                                                  page.save()
                                                       .then(result => {
                                                            // If new images sent - remove the old ones from the server (if any)
                                                            if(bannerName != "") {
                                                                 if(oldBanner != "") {
                                                                      fsExtra.remove('public/images/pages/' + firstSlug + '/' + oldBanner)
                                                                           .then(result => {})
                                                                           .catch(err => console.log(err));
                                                                 }
                                                                 // Save new banner on the server
                                                                 const newBanner = req.files.banner;
                                                                 const path = 'public/images/pages/' + firstSlug + '/' + bannerName;
                                                                 newBanner.mv(path)
                                                                      .then(result => {})
                                                                      .catch(err => console.log(err));
                                                            } 
                                                            if(image1Name != "") {
                                                                 if(oldImage1 != "") {
                                                                      fsExtra.remove('public/images/pages/' + firstSlug + '/' + oldImage1)
                                                                           .then(result => {})
                                                                           .catch(err => console.log(err));
                                                                 }
                                                                 // Save new image1 on the server
                                                                 const newImage1 = req.files.image1;
                                                                 const path = 'public/images/pages/' + firstSlug + '/' + image1Name;
                                                                 newImage1.mv(path)
                                                                      .then(result => {})
                                                                      .catch(err => console.log(err));
                                                                 } 
                                                            if(image2Name != "") {
                                                                 if(oldImage2 != "") {
                                                                      fsExtra.remove('public/images/pages/' + firstSlug + '/' + oldImage2)
                                                                           .then(result => {})
                                                                           .catch(err => console.log(err));
                                                                 }
                                                                 // Save new image2 on the server
                                                                 const newImage2 = req.files.image2;
                                                                 const path = 'public/images/pages/' + firstSlug + '/' + image2Name;
                                                                 newImage2.mv(path)
                                                                      .then(result => {})
                                                                      .catch(err => console.log(err));
                                                            } 
                                                       })
                                                       .then(result => {
                                                            // Catch all pages and put them in request locals, so that they could be caught in header view in the first next http request - for the purpose of refreshing navigation links (i.e. pages) -> as now one nav link is updated (maybe its name)
                                                            Page.find().sort({sorting: 1})
                                                                 .then(pages => {
                                                                      req.app.locals.pages = pages;
                                                                 })
                                                                 .then(result => {
                                                                      // Redirect
                                                                      req.flash('message-success', 'Page successfully updated!');
                                                                      res.status(200).redirect('/admin/pages');
                                                                 })
                                                                 .catch(err => console.log(err));
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

exports.getDeleteImage = (req, res, next) => {
     // Catch the image to be deleted
     const pageSlug = req.params.firstSlug;
     const image = req.query.name;
     const type = req.query.type;
     // Find the image locations
     const path = 'public/images/pages/' + pageSlug + '/' + image;
     console.log('path: ' + path);
     // Remove the image
     fsExtra.remove(path)
          .then(result => {
               req.flash('message-success', 'Image deleted successfully!');
               // Find page's current slug needed for adequate page redirection (edit-page)
               Page.findOne({firstSlug: pageSlug})
                    .then(page => {
                         if(type === 'banner') {
                              page.banner = "";
                         } else if(type === 'image1') {
                              page.image1 = "";
                         } else if(type === 'image2') {
                              page.image2 = "";
                         }
                         page.save()
                              .then(result => {
                                   res.status(200).redirect('/admin/edit-page/' + page.slug);
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
               } else if(page && page.firstSlug == 'home') {
                    req.flash('message-danger', `You cannot delete ${page.title} page!`)
                    return res.status(404).redirect('/admin/pages');
               } else if(page && page.firstSlug == 'shop') {
                    req.flash('message-danger', `You cannot delete ${page.title} page!`)
                    return res.status(404).redirect('/admin/pages')
               }
               // Remove page from DB
               Page.findByIdAndDelete(page._id)
                    .then(result => {
                         // Remove page's images folder from the server
                         return fsExtra.remove('public/images/pages/' + page.firstSlug); 
                    })
                    .then(result => {
                         // Catch all pages and put them in request locals, so that they could be caught in header view in the first next http request - for the purpose of refreshing navigation links (i.e. pages) -> as now one nav link should be removed
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
          })
          .catch(err => console.log(err));
}