const { check, body } = require('express-validator/check');

exports.checkPageValues = [
     body('title')
          .isString()
          .trim()
          .not().matches('[/#%?]')
          .withMessage('Title must not contain "/ # % ?" characters!')
		.isLength({min: 2})
		.withMessage('Title must be at least 2 characters long!')
		.isLength({max: 15})
          .withMessage('Title must be maximum 15 characters long!'),
     body('slug')
          .isString()
          .trim()
          .not().matches('[/#%?]')
          .withMessage('Slug must not contain "/ # % ?" characters!')
		.isLength({max: 15})
          .withMessage('Slug must be maximum 15 characters long!'),
     body('subtitle1')
		.isLength({max: 200})
          .withMessage('Subtitle 1 must be maximum 200 characters long!'),
     body('subtitle2')
		.isLength({max: 200})
          .withMessage('Subtitle 2 must be maximum 200 characters long!'),
     body('content')
		.isLength({max: 30007})
          .withMessage('Content must be maximum 30000 characters long!'),
     body('subcontent')
		.isLength({max: 30007})
          .withMessage('Subcontent must be maximum 30000 characters long!'),
     (req, res, next) => {
          next();
     }
];

exports.checkCategoryValues = [
     body('title')
          .isString()
          .trim()
          .not().matches('[/#%?]')
          .withMessage('Title must not contain "/ # % ?" characters!')
		.isLength({min: 2})
		.withMessage('Title must be at least 2 characters long!')
		.isLength({max: 15})
          .withMessage('Title must be maximum 15 characters long!'),
     body('slug')
          .optional({checkFalsy: true})
          .isString()
          .trim()
          .not().matches('[/#%?]')
          .withMessage('Slug must not contain "/ # % ?" characters!')
		.isLength({max: 15})
          .withMessage('Slug must be maximum 15 characters long!'),
     body('text')
          .optional({checkFalsy: true}) 
          .isString()
          .trim()
          .isLength({max: 25})
          .withMessage('Text must be maximum 25 characters long!'),
     (req, res, next) => {
          next();
     }
];

exports.checkProductValues = [
     body('title')
          .isString()
          .trim()
          .not().matches('[/#%?]')
          .withMessage('Name must not contain "/ # % ?" characters!')
		.isLength({min: 2})
		.withMessage('Name must be at least 2 characters long!')
		.isLength({max: 40})
          .withMessage('Name must be maximum 40 characters long!'),
     body('slug')
          .isString()
          .trim()
          .not().matches('[/#%?]')
          .withMessage('Slug must not contain "/ # % ?" characters!')
		.isLength({max: 40})
          .withMessage('Slug must be maximum 40 characters long!'),
     body('price')
          .isDecimal()
          .withMessage('Price must be a valid number!'),
     body('originalPrice')
          .optional({checkFalsy: true})
          .isDecimal()
          .withMessage('Original price must be a valid number!'),
     body('category')
          .not().isEmpty()
          .withMessage('Category must be selected!'),
     body('description')
		.isLength({min: 12})
		.withMessage('Description must be at least 5 characters long!')
		.isLength({max: 30007})
          .withMessage('Description must be maximum 3000 characters long!'),
     body('features')
		.isLength({max: 1007})
          .withMessage('Product features field must be maximum 1000 characters long!'),
     body('brand')
          .isString()
          .trim()
          .not().matches('[/#%?]')
          .withMessage('Brand name must not contain "/ # % ?" characters!')
          .isLength({min: 1})
		.withMessage('Brand name must be at least 1 character long!')
		.isLength({max: 30})
          .withMessage('Brand name must be maximum 30 characters long!'),
     body('productCode')
          .optional({checkFalsy: true})
          .trim()
          .not().matches('[/#%?]')
          .withMessage('Product code must not contain "/ # % ?" characters!')
          .isLength({min: 1})
		.withMessage('Product code must be at least 1 character long!')
		.isLength({max: 20})
          .withMessage('Product code must be maximum 20 characters long!'),
     body('availability')
          .isIn(['inStock', '', 'outOfStock'])
          .withMessage('Invalid value entered for availability, please choose one of the options from the drop-down list!'),
     (req, res, next) => {
          next();
     }
];


exports.checkBrandValues = [
     body('title')
          .isString()
          .trim()
          .not().matches('[/#%?]')
          .withMessage('Title must not contain "/ # % ?" characters!')
		.isLength({min: 2})
		.withMessage('Title must be at least 2 characters long!')
		.isLength({max: 25})
          .withMessage('Title must be maximum 25 characters long!'),
     body('slug')
          .optional({checkFalsy: true})
          .isString()
          .trim()
          .not().matches('[/#%?]')
          .withMessage('Slug must not contain "/ # % ?" characters!')
		.isLength({max: 25})
          .withMessage('Slug must be maximum 25 characters long!'),
     (req, res, next) => {
          next();
     }
];


exports.checkInfoPageValues = [
     body('title')
          .isString()
          .trim()
          .not().matches('[/#%?]')
          .withMessage('Title must not contain "/ # % ?" characters!')
		.isLength({min: 2})
		.withMessage('Title must be at least 2 characters long!')
		.isLength({max: 25})
          .withMessage('Title must be maximum 25 characters long!'),
     body('slug')
          .isString()
          .trim()
          .not().matches('[/#%?]')
          .withMessage('Slug must not contain "/ # % ?" characters!')
		.isLength({max: 25})
          .withMessage('Slug must be maximum 25 characters long!'),
     body('content')
		.isLength({max: 50007})
          .withMessage('Content must be maximum 50000 characters long!'),
     (req, res, next) => {
          next();
     }
];

exports.checkRegisterUser = [	 
     body('username')
          .isString()
          .trim()
          .isLength({min: 2})
          .withMessage('Username must be at least 2 characters long!')
          .isLength({max: 15})
          .withMessage('Username must be maximum 15 characters long!'),      
	
	check('email')			        
		.isEmail()
		.withMessage('Please enter a valid email!')
		.custom((value, { req }) => {
			if(value === 'test@test.com') {	                                   
				throw new Error('This email is not allowed!');               
               }
               return true; 
          })                                     
          .normalizeEmail({ gmail_remove_dots: false }),                
     body('password')
          .trim()					        
          .isLength({min: 5})
          .withMessage('Password must be at least 5 characters long!')
		.isLength({max: 20})
		.withMessage('Password must be maximum 20 characters long!')
		.matches('[0-9]')         
		.withMessage('Password must contain at least 1 number!')
		.matches('[a-z]')         
		.withMessage('Password must contain at least 1 lowercase letter!')
		.matches('[A-Z]')         
		.withMessage('Password must contain at least 1 uppercase letter!')
		// .matches('[!@#$%&*?{}"`~+=()/\,.-_;:<>^|]')         
		.matches('[!@#$%&*?{}"`~+=()_;:<>^|/,.-]')         
		.withMessage('Password must contain at least 1 special character!'),
     body('confirmPassword')           
          .trim()
          .custom((value, {req}) => {	
               if(value !== req.body.password) {         
                    throw new Error('Passwords do not match!'); 
               }
               return true; 
          }),
     body('firstName')
          .optional({checkFalsy: true})
		.isString()
		.trim()
		.isLength({min: 2})
		.withMessage('First name must be at least 2 characters long!')
		.isLength({max: 20})
          .withMessage('First name must be maximum 20 characters long!'),
     body('lastName')
          .optional({checkFalsy: true})
		.isString()
          .trim()
          .isLength({min: 2})
		.withMessage('Name must be at least 2 characters long!')
		.isLength({max: 25})
          .withMessage('Last name must be maximum 25 characters long!'),
     body('telephone')
          .isString()
          .trim()
          .isLength({max: 15})
          .withMessage('Telephone number is too long!'), 
     body('company')
          .isString()
          .trim()
          .isLength({max: 30})
          .withMessage('Company name is too long!'), 
     body('street')
          .isString()
          .isLength({max: 40})
          .withMessage('Street address name is too long!'), 
     body('city')
          .isString()
          .trim()
          .isLength({max: 20})
          .withMessage('City name is too long!'), 
     body('postCode')
          .optional({checkFalsy: true})
          .isDecimal()
          .withMessage('Please enter valid post code!'),
     body('newsletter')
          .isIn(['yes', 'no'])
          .withMessage('Please select if you wish to receive our newsletter!'),
     (req, res, next) => {  
          next(); 
     }  
]		

exports.checkSubscriber = [	    
	body('email')			        
		.isEmail()
		.withMessage('Please enter a valid email!')
		.custom((value, { req }) => {
			if(value === 'test@test.com') {	                                   
				throw new Error('This email is not allowed!');               
               }
               return true; 
          })                                     
          .normalizeEmail({ gmail_remove_dots: false }), 
     (req, res, next) => {  
          next(); 
     }  
]		

exports.checkAddress = [	 
     body('firstName')
          .optional({checkFalsy: true})
		.isString()
		.trim()
		.isLength({min: 2})
		.withMessage('First name must be at least 2 characters long!')
		.isLength({max: 20})
          .withMessage('First name must be maximum 20 characters long!'),
     body('lastName')
          .optional({checkFalsy: true})
		.isString()
          .trim()
          .isLength({min: 2})
		.withMessage('Last name must be at least 2 characters long!')
		.isLength({max: 25})
          .withMessage('Last name must be maximum 25 characters long!'),
     body('company')
          .isString()
          .trim()
          .isLength({max: 30})
          .withMessage('Company name is too long!'), 
     body('street')
          .isString()
          .isLength({max: 40})
          .withMessage('Street address name is too long!'), 
     body('city')
          .isString()
          .trim()
          .isLength({max: 20})
          .withMessage('City name is too long!'), 
     body('postCode')
          .optional({checkFalsy: true})
          .isDecimal()
          .withMessage('Please enter valid post code!'),
     (req, res, next) => {  
          next(); 
     }  
]		


exports.checkNewPassword = [	                    
     body('password')
          .trim()					        
          .isLength({min: 5})
          .withMessage('Password must be at least 5 characters long!')
		.isLength({max: 20})
		.withMessage('Password must be maximum 20 characters long!')
		.matches('[0-9]')         
		.withMessage('Password must contain at least 1 number!')
		.matches('[a-z]')         
		.withMessage('Password must contain at least 1 lowercase letter!')
		.matches('[A-Z]')         
		.withMessage('Password must contain at least 1 uppercase letter!')
		// .matches('[!@#$%&*?{}"`~+=()/\,.-_;:<>^|]')         
		.matches('[!@#$%&*?{}"`~+=()_;:<>^|/,.-]')         
		.withMessage('Password must contain at least 1 special character!'),
     body('confirmPassword')           
          .trim()
          .custom((value, {req}) => {	
               if(value !== req.body.password) {         
                    throw new Error('Passwords do not match!'); 
               }
               return true; 
          }),
     (req, res, next) => {  
          next(); 
     }  
]		                        
               