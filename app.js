     // IMPORTING NPM PACKAGEs	
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoDBSessionStore = require('connect-mongodb-session')(session);
const flash = require('connect-flash');
const fileUpload = require('express-fileupload');
const passport = require('passport');
const csrf = require('csurf');

          // DEPLOYMENT packages
const helmet = require('helmet');
const compression = require('compression');
const fs = require('fs');
const morgan = require('morgan');

     // IMPORTING our custom files (ROUTEs, CONTROLLERs, MODELs, ...)
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
require('./config/passport')(passport);
const env = require('./config/env/env');

     // INITIATION of EXPRESS	and VIEW ENGINE setting
const app = express();
app.set('view engine', 'ejs');
app.set('views', 'views');

     // CONSTANTs
// const MONGODB_URI  = 'mongodb+srv://al_nikolic:Peradetlic1@cluster0-eyxah.mongodb.net/shop2?retryWrites=true'; // for development phase
const MONGODB_URI  = 'mongodb+srv://' + env.mongodbUser + ':' + env.mongodbPassword + '@cluster0-eyxah.mongodb.net/' + env.mongodbDefaultDB; // for deployment phase

          // MIDDLEWAREs	
     // Mid. for setting a Public folder - as a default one to use in views with src and href
app.use(express.static(path.resolve('public')));  

	// POST request inputs parsing Middlewares
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(fileUpload());

     // SESSION and FLASH Middlewares
const store = new MongoDBSessionStore({uri: MONGODB_URI, collection: 'sessions'});  
app.use(session({
     secret: env.sessionSecret,
     resave: false,
     saveUninitialized: false,
     store: store
     // cookie: { secure: true }
   }));
app.use(flash());

     // USER AUTHENTICATION Middlewares
          // 'PASSPORT' Authentication Middlewares (this must go above res.locals.user) 
app.use(passport.initialize());
app.use(passport.session());
          // Mid. for catching a logged in user from session and putting it into every http request - we can then use it in Controllers


     // GLOBAL variables MIDDLEWARE - catching all pages and all categories (to be displayed in the navigation bars of the shop) + this goes together with req.app.locals in controllers
const Page = require('./models/Page');
Page.find().sort({sorting: 1})
     .then(pages => {
          app.locals.pages = pages;
     })   
     .catch(err => console.log(err));

const Category = require('./models/Category');
Category.find().sort({sorting: 1})
     .then(categories => {
          app.locals.categories = categories;
     })   
     .catch(err => console.log(err));

const Info = require('./models/Info');
Info.findOne()
     .then(info => {
          app.locals.info = info;
     })
     .catch(err => console.log(err));

const InfoPage = require('./models/InfoPage');
InfoPage.find().sort({sorting: 1})
     .then(infoPages => {
          app.locals.infoPages = infoPages;
     })   
     .catch(err => console.log(err));

const Brand = require('./models/Brand');
Brand.find({favourite: true}).sort({title: 1})
     .then(brands => {
          app.locals.favBrands = brands;
     })   
     .catch(err => console.log(err));

     // GLOBAL VARIABLES MIDDLEWARE - using SESSION and FLASH - we can then use these variables in all views (responses)
app.use((req, res, next) => {
     res.locals.messageDang = req.flash('message-danger');
     res.locals.messageSucc = req.flash('message-success');
     res.locals.messagePassport = req.flash('error');
     res.locals.cart = req.session.cart;
     res.locals.wishlist = req.session.wishlist;
     res.locals.shipping = req.session.shipping || null;
     res.locals.user = req.user || null;
     next();
});
          
     // CSRF SETUP and CSRF MIDDLEWAREs                                       
		// If we have ROUTES that we want to be ignored by CSRF Middleware we need to set them above the CSRF Middleware function     
const pagesController = require('./controllers/admin/pagesController');
const categoriesController = require('./controllers/admin/categoriesController');
const productsController = require('./controllers/admin/productsController');
const infoPagesController = require('./controllers/admin/infoPagesController');
const isAuth = require('./middlewares/isAuth');

app.post('/admin/reorder-pages', isAuth.isAdmin, pagesController.postReorderPages);
app.post('/admin/reorder-info-pages', isAuth.isAdmin, infoPagesController.postReorderInfoPages);
app.post('/admin/reorder-categories', isAuth.isAdmin, categoriesController.postReorderCategories);
app.post('/admin/reorder-products', isAuth.isAdmin, productsController.postReorderProducts);
app.post('/admin/product-gallery/:firstSlug', isAuth.isAdmin, productsController.postDropImagesToGallery);
		// CSRF MIDDLEWARE - all ROUTES below will be affected by CSRF Middleware
app.use(csrf());
		// GLOBAL variables MIDDLEWARE for CSRF Token
app.use((req, res, next) => {
     res.locals.csrfToken = req.csrfToken();
     next();
});

// const csrfExclusion = ['/reorder-pages', '/reorder-categories'];
// app.use(csrf());
// var csrfMw = csrf();
// app.use(function(req, res, next){
//      // if (csrfExclusion.indexOf(req.path) !== -1) {
//      if(req.path == '/reorder-categories') {
//           next();
//      } else {
//           csrfMw(req, res, next);
//      }
// });

     // MIDDLEWAREs for DEPLOYMENT
app.use(helmet());  
app.use(compression());   
          // Morgan middl.
const accessLogStream = fs.createWriteStream(path.resolve('access.log'), {flags: 'a'});
app.use(morgan('combined', {stream: accessLogStream}));
     
     // ROUTES MIDDLEWAREs -> always at the end of the middlewares section
app.use('/admin', adminRoutes);
app.use(authRoutes);                                                    
app.use(shopRoutes);      

     // DB CONNECTION to APP. SERVER and STARTING the APP.SERVER	
mongoose.connect(MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true});   
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
     console.log('Connected to DB');
});

app.listen(process.env.PORT || 4000, () => {
     console.log('Server started.');
});

