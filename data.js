var MANAGERASSIGNED = 1;
var MANAGERLEFT = 2;
g_portals = {
	'overage':{
		label : 'Overage',
		btname : 'O',
		cansetmanager : 0,      // Could this setup manager
		istour : 0,             // Is this tour or not
		isonlist : 1,           // Is this be shown on list page
		isonrotor : 0,			// Is this be shown on rotor page
		isbtavailonrotor : 0,   // Is this button should be shown in categorylist on rotor page.
	},
	'sick':{
		label : 'Sick',
		btname : 'S',
		cansetmanager : 0,
		istour : 0,
		isonlist : 1,
		isonrotor : 1,
		isbtavailonrotor : 0,
	},
	'ginfo':{
		label : 'Genernal Information',
		btname : 'G',
		cansetmanager : 1,
		istour : 0,
		isonlist : 0,
		isonrotor : 1,
		isbtavailonrotor : 1,
	},
	'beback':{
		label : 'Be Back / Owner Referral',
		btname : 'B',
		cansetmanager : 1,
		istour : 0,
		isonlist : 0,
		isonrotor : 1,
		isbtavailonrotor : 1,
	},
	'qolife':{
		label : 'Quality of Life',
		btname : 'Q',
		cansetmanager : 1,
		istour : 0,
		isonlist : 0,
		isonrotor : 1,
		isbtavailonrotor : 1,
	},
	'directtour':{
		label : 'Direct Tour',
		btname : 'DT',
		cansetmanager : 1,
		istour : 1,
		isonlist : 0,
		isonrotor : 1,
		isbtavailonrotor : 1,
	},
	'inhousetour':{
		label : 'In House Tour',
		btname : 'IHT',
		cansetmanager : 1,
		istour : 1,
		isonlist : 0,
		isonrotor : 1,
		isbtavailonrotor : 1,
	},
	'managertour':{
		label : 'Manager - Tour',
		btname : 'T',
		cansetmanager : 1,
		istour : 1,
		isonlist : 0,
		isonrotor : 1,
		isbtavailonrotor : 1,
	},
	'explorertour':{
		label : 'Explorer - Tour',
		btname : 'T',
		cansetmanager : 1,
		istour : 1,
		isonlist : 0,
		isonrotor : 1,
		isbtavailonrotor : 1,
	},
};
g_categories = {
	'direct':{
		id:'',
		label:'Direct',
		linkbtname:'Direct',
		catlinks:['inhouse','manager','explorer'],
		portallinks:['directtour','inhousetour','ginfo','beback','qolife','overage','sick'],
		assignedby:'manager',
		tourportal:'directtour', // if this is manager, need to be registered to the tour.
	},
	'inhouse':{
		id:'',
		label:'In House',
		linkbtname:'In House',
		catlinks:['direct','manager','explorer'],
		portallinks:['directtour','inhousetour','ginfo','beback','qolife','overage','sick'],
		assignedby:'manager',
		tourportal:'directtour',
	},
	'manager':{
		id:'',
		label:'Manager',
		linkbtname:'Manager',
		catlinks:['direct','inhouse','explorer'],
		portallinks:['managertour','beback','qolife','overage','sick'],
		assignedby: '',
		tourportal:'managertour',
	},
	'explorer':{
		id:'',
		label:'Explorer',
		linkbtname:'Explorer',
		catlinks:['direct','inhouse','manager'],
		portallinks:['explorertour','beback','qolife','overage','sick'],
		assignedby:'manager',
		tourportal:'explorertour',
	}
};

g_permisions = ["admin","reception","manager","sales"];

exports.data_portals = g_portals;
exports.data_categories = g_categories;
