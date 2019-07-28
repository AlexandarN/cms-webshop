     // IMPORTING NPM PACKAGEs	
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
const fileUpload = require('express-fileupload');
const passport = require('passport');
const csrf = require('csurf');

     // IMPORTING our custom files (ROUTEs, CONTROLLERs, MODELs, ...)
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
require('./config/passport')(passport);

     // INITIATION of EXPRESS	and setting VIEW ENGINEs
const app = express();
app.set('view engine', 'ejs');
app.set('views', 'views');

     // CONSTANTs
const MONGODB_URI  = 'mongodb+srv://al_nikolic:Peradetlic1@cluster0-eyxah.mongodb.net/shop2?retryWrites=true';

          // MIDDLEWAREs	
     // Mid. for setting a Public folder - as a default one to use in views with src and href
app.use(express.static(path.resolve('public')));  

	// POST request inputs parsing Middlewares
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(fileUpload());

     // General Session and Flash Middlewares
app.use(session({
     secret: 'keyboard cat',
     resave: false,
     saveUninitialized: false
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

     // GLOBAL VARIABLES MIDDLEWARE - for Session, Flash and CSRF - we can then use them in views (responses)
app.use((req, res, next) => {
     res.locals.messageDang = req.flash('message-danger');
     res.locals.messageSucc = req.flash('message-success');
     res.locals.messagePassport = req.flash('error');
     res.locals.cart = req.session.cart;
     res.locals.user = req.user || null;
     // res.locals.csrfToken = req.csrfToken();
     next();
});
          
     // CSRF SETUP and CSRF MIDDLEWAREs                                       
		// If we have ROUTES that we want to be ignored by CSRF Middleware we need to set them above the CSRF Middleware function     
const pagesController = require('./controllers/admin/pagesController');
const categoriesController = require('./controllers/admin/categoriesController');
const productsController = require('./controllers/admin/productsController');
const isAuth = require('./middlewares/isAuth');

app.post('/admin/reorder-pages', isAuth.isAdmin, pagesController.postReorderPages);
app.post('/admin/reorder-categories', isAuth.isAdmin, categoriesController.postReorderCategories);
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

     // ROUTES MIDDLEWAREs -> always at the end of the middlewares section
app.use('/admin', adminRoutes);
app.use(authRoutes);                                                    
app.use(shopRoutes);      

     // DB CONNECTION to APP. SERVER and STARTING the APP.SERVER	
mongoose.connect(MONGODB_URI, {useNewUrlParser: true});   
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
     console.log('Connected to DB');
});

app.listen(3000, () => {
     console.log('Server started.');
});

