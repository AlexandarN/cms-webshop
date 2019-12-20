const fsExtra = require('fs-extra');

const Info = require('../../models/Info');  


exports.getEditInfoPage = async (req, res, next) => {
     try {
          // Find Info in DB
          const info = await Info.findOne();
          if(!info) {
               req.flash('message-danger', 'Info not found!')
               return res.status(404).redirect('/dashboard');
          }
          // Render view file and send data
          return res.render('admin/edit-infoM', {
               title: 'Edit Website Data',
               oldInput: {
                    shopName: info.shopName,
                    logo: info.logo,
                    favicon: info.favicon,
                    footerBanner: info.footerBanner,
                    street: info.contact.address.street,
                    city: info.contact.address.city,
                    country: info.contact.address.country,
                    email1: info.contact.email1,
                    email2: info.contact.email2,
                    email3: info.contact.email3,
                    phone1: info.contact.phone1,
                    phone2: info.contact.phone2,
                    phone3: info.contact.phone3,
                    facebook: info.facebook,
                    linkedin: info.linkedin,
                    twitter: info.twitter,
                    googleplus: info.googleplus,
                    youtube: info.youtube
               }
          });
     } catch (err) {
          console.log(err);
     }
}

exports.postEditInfo = async (req, res, next) => {
     // Parsing of form input data	
     const shopName = req.body.shopName;
     const street = req.body.street;
     const city = req.body.city;
     const country = req.body.country;
     const email1 = req.body.email1;
     const email2 = req.body.email2;
     const email3 = req.body.email3;
     const phone1 = req.body.phone1;
     const phone2 = req.body.phone2;
     const phone3 = req.body.phone3;	
     const facebook = req.body.facebook;
     const linkedin = req.body.linkedin;
     const twitter = req.body.twitter;
     const googleplus = req.body.googleplus;
     const youtube = req.body.youtube;
     const oldLogo = req.body.oldLogo;
     const oldFavicon = req.body.oldFavicon;	
     const oldFooterBanner = req.body.oldFooterBanner;	
     try {
          // Validating the mimetype of the parsed files (if sent)
          if((req.files && (req.files.logo &&
                    req.files.logo.mimetype !== 'image/jpeg' && 
                    req.files.logo.mimetype !== 'image/jpg' && 
                    req.files.logo.mimetype !== 'image/png')) ||
               (req.files && (req.files.favicon &&
                    req.files.favicon.mimetype !== 'image/jpeg' && 
                    req.files.favicon.mimetype !== 'image/jpg' && 
                    req.files.favicon.mimetype !== 'image/png')) ||
               (req.files && (req.files.footerBanner &&
                    req.files.footerBanner.mimetype !== 'image/jpeg' && 
                    req.files.footerBanner.mimetype !== 'image/jpg' && 
                    req.files.footerBanner.mimetype !== 'image/png'))
               ) {
               await req.flash('message-danger', 'One or more of the attached files is not an image!');
               return res.status(422).render('admin/edit-infoM', {
                    title: 'Edit Website Data',
                    oldInput: {
                         shopName: shopName,
                         logo: oldLogo,
                         favicon: oldFavicon,
                         footerBanner: oldFooterBanner,
                         street: street,
                         city: city,
                         country: country,
                         email1: email1,
                         email2: email2,
                         email3: email3,
                         phone1: phone1,
                         phone2: phone2,
                         phone3: phone3,
                         facebook: facebook,
                         linkedin: linkedin,
                         twitter: twitter,
                         googleplus: googleplus,
                         youtube: youtube
                    },
                    messageDang: req.flash('message-danger')
               });
          }
          // Find Info in DB that should be edited
          const info = await Info.findOne();
          if(!info) {
               req.flash('message-danger', 'There was an error, we could not find the Info object!');
               res.status(404).redirect('/dashboard');
          }
          // Catch names of the sent images and set logoName variable
          let logoName;
          if(req.files && req.files.logo) {
               logoName = req.files.logo.name;
          } else {
               logoName = "";
          }
          // Set the faviconName variable
          let faviconName;
          if(req.files && req.files.favicon) {
               faviconName = req.files.favicon.name;
          } else {
               faviconName = "";
          }
          // Set the footerBannerName variable
          let footerBannerName;
          if(req.files && req.files.footerBanner) {
               footerBannerName = req.files.footerBanner.name;
          } else {
               footerBannerName = "";
          }
          // Update Info in DB	
          info.shopName = shopName;
          if(req.files && req.files.logo) {
               info.logo = logoName;
          }
          if(req.files && req.files.favicon) {
               info.favicon = faviconName;
          }
          if(req.files && req.files.footerBanner) {
               info.footerBanner = footerBannerName;
          }
          info.contact.address.street = street;
          info.contact.address.city = city;
          info.contact.address.country = country;
          info.contact.email1 = email1;
          info.contact.email2 = email2;
          info.contact.email3 = email3;
          info.contact.phone1 = phone1;
          info.contact.phone2 = phone2;
          info.contact.phone3 = phone3;
          info.facebook = facebook;
          info.linkedin = linkedin;
          info.twitter = twitter;
          info.googleplus = googleplus;
          info.youtube = youtube;
          await info.save()
          // If new images sent - remove the old ones from the server (if any)
          if(logoName != "") {
               if(oldLogo != "") {
                    await fsExtra.remove('public/images/info/' + oldLogo);
               }
               // Save new Logo on the server
               const newLogo = req.files.logo;
               const path = 'public/images/info/' + logoName;
               await newLogo.mv(path);
          } 
          if(faviconName != "") {
               if(oldFavicon != "") {
                    await fsExtra.remove('public/images/info/' + oldFavicon);
               }
               // Save new Favicon on the server
               const newFavicon = req.files.favicon;
               const path = 'public/images/info/' + faviconName;
               await newFavicon.mv(path);
          }
          if(footerBannerName != "") {
               if(oldFooterBanner != "") {
                    await fsExtra.remove('public/images/info/' + oldFooterBanner);
               }
               // Save new Favicon on the server
               const newFooterBanner = req.files.footerBanner;
               const path = 'public/images/info/' + footerBannerName;
               await newFooterBanner.mv(path);
          }
          await req.flash('message-success', 'Company info successfully updated!');
          // Catch Info object and put it in request locals, so that it could be caught in the header view in the first next http request - for the purpose of refreshing header -> as now new logo, favicon and footer banner should appear
          const infoNew = await Info.findOne();
          req.app.locals.info = infoNew;
          // Redirect
          res.status(200).redirect('/dashboard');
     } catch(err) {
          console.log(err);
     }
}


exports.getDeleteImage = async (req, res, next) => {
     // Catch the image to be deleted
     const name = req.query.name;
     const type = req.query.type;
     // Find the image location
     const path = 'public/images/info/' + name;
     try {
          // Remove the image
          await fsExtra.remove(path);
          await req.flash('message-success', 'Image deleted successfully!');
          // Find Info object in DB
          const info = await Info.findOne();
          if(type === 'logo') {
               info.logo = "";
          } else if(type === 'favicon') {
               info.favicon = "";
          } else if(type === 'footerBanner') {
               info.footerBanner = "";
          }
          await info.save();
          res.status(200).redirect('/admin/edit-info');
     } catch (err) {
          console.log(err);
     }
}
