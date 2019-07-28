exports.isUser  = (req, res, next) => {  
	if(req.isAuthenticated()) {					                        	              
		return next(); 					  
	} else {
		req.flash('message-danger-shop', 'Please log in in order to proceed!'); 
		return res.redirect('/login'); 
     } 
}

exports.isAdmin  = (req, res, next) => {  
	if(req.isAuthenticated() && res.locals.user.admin == 1) {					                
		return next(); 					  
	} else {
		req.flash('message-danger-shop', 'Please log in as administrator in order to proceed!'); 
		return res.redirect('/login'); 
     } 
}
