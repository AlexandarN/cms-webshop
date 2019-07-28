const { check, body } = require('express-validator/check');

exports.checkPageValues = [
     body('title')
          .isString()
          .trim()
		.isLength({min: 2})
		.withMessage('Title must be at least 2 characters long!')
		.isLength({max: 15})
          .withMessage('Title must be maximum 15 characters long!'),
     body('content')
		.isLength({min: 12})
		.withMessage('Content must be at least 5 characters long!')
		.isLength({max: 3007})
          .withMessage('Content must be maximum 3000 characters long!'),
     (req, res, next) => {
          next();
     }
];

exports.checkCategoryValues = [
     body('title')
          .isString()
          .trim()
		.isLength({min: 2})
		.withMessage('Title must be at least 2 characters long!')
		.isLength({max: 15})
          .withMessage('Title must be maximum 15 characters long!'),
     (req, res, next) => {
          next();
     }
];

exports.checkProductValues = [
     body('title')
          .isString()
          .trim()
		.isLength({min: 2})
		.withMessage('Name must be at least 2 characters long!')
		.isLength({max: 15})
          .withMessage('Name must be maximum 15 characters long!'),
     body('price')
          .isDecimal()
          .withMessage('Price must be a valid number!'),
     body('category')
          .not().isEmpty()
          .withMessage('Category must be selected!'),
     body('description')
		.isLength({min: 12})
		.withMessage('Description must be at least 5 characters long!')
		.isLength({max: 3007})
          .withMessage('Description must be maximum 3000 characters long!'),
     (req, res, next) => {
          next();
     }
];


exports.checkRegisterUser  = [	       
	body('name')
		.isString()
		.trim()
		.isLength({min: 2})
		.withMessage('Name must be at least 2 characters long!')
		.isLength({max: 15})
          .withMessage('Name must be maximum 15 characters long!'),
          // .isAlphanumeric()
		// .withMessage('Name must be alphanumeric!'),               
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
     body('username')
          .isString()
          .trim()
          .isLength({min: 2})
          .withMessage('Username must be at least 2 characters long!')
          .isLength({max: 15})
          .withMessage('Username must be maximum 15 characters long!'),               
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
               