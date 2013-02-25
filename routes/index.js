
/*
 * GET home page.
 */
g_permisions = ["admin","reception","manager","sales"];

exports.manager = function(req, res){
	if(req.session.auth == 'true') {
		if (req.session.perm == g_permisions[0] ){
			res.render('manager', { title: 'Manager Dev_Sales_Rotor'});
		} else if(req.session.perm == g_permisions[1]) {
			res.render('manager_reception', { title: 'Roster Dev_Sales_Rotor'});
		} else {
			res.redirect('/rotor');
		}

	} else {
		res.redirect('/');
	}

};
exports.roster = function(req, res){
	if(req.session.auth == 'true') {
		if (req.session.perm == g_permisions[0] ){
			res.render('roster', { title: 'Roster Dev_Sales_Rotor'});
		} else if(req.session.perm == g_permisions[1]) {
			res.render('roster_reception', { title: 'Roster Dev_Sales_Rotor'});
		} else {
			res.redirect('/rotor');
		}
	} else {
		res.redirect('/');
	}
};
exports.rotor = function(req, res){
	if(req.session.auth == 'true') {
		if(req.session.perm == g_permisions[0]){
			res.render('rotor', { title: 'Rotor Dev_Sales_Rotor'});
		} else if(req.session.perm == g_permisions[1]) {
			res.render('rotor_reception', { title: 'Rotor Dev_Sales_Rotor'});
		} else if(req.session.perm == g_permisions[2]){
			res.render('rotor_manager', { title: 'Rotor Dev_Sales_Rotor'});
		} else {
			res.render('rotor_sales', { title: 'Rotor Dev_Sales_Rotor'});
		}
	} else {
		res.redirect('/');
	}
};
exports.reports = function (req, res) {
	if(req.session.auth == 'true') {
		if(req.session.perm == g_permisions[0]){
			res.render('reports', { title: 'Rotor Dev_Sales_Rotor'});
		} else if(req.session.perm == g_permisions[1]) {
			res.render('reports_reception', { title: 'Rotor Dev_Sales_Rotor'});
		} else if(req.session.perm == g_permisions[2]) {
			res.render('reports_manager', { title: 'Rotor Dev_Sales_Rotor'});
		} else {
			res.redirect('/rotor');
		}
	} else {
		res.redirect('/');
	}
};
exports.user = function(req, res){
	if(req.session.auth == 'true') {
		if(req.session.perm == g_permisions[0]){
			res.render('user', { title: 'User Dev_Sales_Rotor'});
		} else {
			res.redirect('/rotor');
		}
	} else {
		res.redirect('/');
	}
};
exports.login = function(req, res){
	if(req.session.auth == 'true') {
		res.render('login', { title: 'Login to Sales_Rotor'});
	} else {
		res.redirect('/');
	}
};
