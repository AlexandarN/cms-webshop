exports.isUser = async (req, res, next) => {  
	if(req.isAuthenticated()) {					                        	              
		return next(); 					  
	} else {
		await req.flash('message-danger', 'You are not logged in. Please log in in order to proceed!'); 
		return res.redirect('/login'); 
     } 
}

exports.isAdmin = async (req, res, next) => {  
	if(req.isAuthenticated() && res.locals.user.admin == 1) {
		return next(); 					  
	} else {
		await req.flash('message-danger', 'Please log in as administrator in order to proceed!');
		return res.redirect('/login'); 
     } 
}
