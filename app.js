
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var data = require('./data.js');

var data_portals = data.data_portals;
var data_categories = data.data_categories;
var crypto = require('crypto');
var fs = require("fs");

var privateKey = fs.readFileSync('./server.key').toString();
var certificate = fs.readFileSync('./server.crt').toString();

var app = module.exports = express.createServer({key: privateKey, cert: certificate});

var io = require('socket.io').listen(app);

// Configuration-----------------------------------------

var store = new express.session.MemoryStore;

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'whatever', store: store }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: false, showStack: false }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});
// Data base-------------------------------------------------------
var mysql = require('mysql');
var TEST_DATABASE = 'sales_rotor';
var TEST_TABLE = 'test';

//DB connection-----------------------------------------------------
var client = mysql.createClient({
  user: 'root',
  password: '',
});
client.query('USE '+TEST_DATABASE);

// Routes---------------------------------------------
app.get('/', function(req, res) {
		if(req.session.auth == 'true')
		{
			res.redirect('/roster');
		}
		else {
			res.render('login', { title: 'Login to Sales_Rotor'})
		}
	}
);
app.get('/dologin',
	function(req, res) {
		var username = req.param('username');
		var userpassword = req.param('userpassword');
		
		client.query('select * from mst_user where name=? and password=?', [username,userpassword], function(err, results, fields) {
			if(err) {
				console.log("----------login query error---------------------");
				res.redirect('/');
			} else {
				if(results.length > 0) {
					console.log("----------login success---------------------");
					req.session.auth = 'true';
					req.session.perm = results[0].groupname;
					res.redirect('/roster');
				} else {
					console.log("----------password not match---------------------");
					res.redirect('/');
				}
			}
		});
	}
);

app.get('/dologout',
	function(req, res) {
		req.session.auth = 'false';
		req.session.perm = '';
		res.redirect('/');
	}
);
app.get('/manager', routes.roster);
app.get('/roster', routes.roster);
app.get('/rotor', routes.rotor);
app.get('/user', routes.user);
app.get('/reports', routes.reports);
app.post('/doreportsearch', function(req, res) {
	var personname = req.param('name');
	var startdate = req.param('startdate');
	var enddate = req.param('enddate');
	if(enddate == '') {
		enddate = '9999-12-31';
	}
	if(startdate == '') {
		startdate = '0000-00-00';
	}
	client.query('select DATE_FORMAT(createdate, \'%m/%d/%Y\') as createdate, tourtype, name, IF(tour_start=\'0000-00-00 00:00:00\',\'\',DATE_FORMAT(tour_start,\'%r\')) as tour_start, IFNULL(TIMEDIFF(manager_start, tour_start),\'\') as turn_total, manager as manager, manager_name as manager_name, IF(manager_start=\'0000-00-00 00:00:00\',\'\',DATE_FORMAT(manager_start,\'%r\')) as manager_start, IF(manager_end=\'0000-00-00 00:00:00\',\'\',DATE_FORMAT(manager_end,\'%r\')) as manager_end, IFNULL(TIMEDIFF(manager_end, manager_start),\'\') as manager_total, IF(tour_end=\'0000-00-00 00:00:00\',\'\',DATE_FORMAT(tour_end,\'%r\')) as tour_end, IFNULL(TIMEDIFF(tour_end, tour_start),\'\') as tour_total from tbl_reports where name like \'%'
			+personname+'%\' and DATE(tour_start)>=? and DATE(tour_end)<=?', [startdate,enddate], function(err, results, fields) {
			var responsehtml = '<table border=1><thead><tr><td>Date</td><td>Tour Type</td><td>Name</td><td>Tour Start</td><td>Turn Total</td><td>Manager</td><td>Manager Start</td><td>Manager End</td><td>Manager Total</td><td>Tour End</td><td>Tour Total</td></tr></thead><tbody>';
			if(err) {
				responsehtml += '<tr><td colspan=11>query error : '+err+'</td></tr>';
			} else {
				if(results.length == 0) {
					responsehtml += '<tr><td colspan=11>Could not found data</td></tr>';
				} else {
					for(i = 0; i < results.length; i++) {
						responsehtml += '<tr>';
						responsehtml += '<td>'+results[i].createdate+'</td>';
						responsehtml += '<td>'+results[i].tourtype+'</td>';
						responsehtml += '<td>'+results[i].name+'</td>';
						responsehtml += '<td>'+results[i].tour_start+'</td>';
						responsehtml += '<td>'+results[i].turn_total+'</td>';
						responsehtml += '<td>'+results[i].manager_name+'</td>';
						responsehtml += '<td>'+results[i].manager_start+'</td>';
						responsehtml += '<td>'+results[i].manager_end+'</td>';
						responsehtml += '<td>'+results[i].manager_total+'</td>';
						responsehtml += '<td>'+results[i].tour_end+'</td>';
						responsehtml += '<td>'+results[i].tour_total+'</td>';
						responsehtml += '</tr>';
					}
				}
			}
			responsehtml += '</tbody></table>';
			
			res.send(responsehtml);
		});
});

app.listen(443, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
//app.listen(process.env.port);
//-----------------------------------------------------------------------------------------------

// open the socket connection
// io.sockets.socket(socket.id)
function getCurrentTime() {
	var now = new Date();
	var hours = now.getHours();
	var minuts = now.getMinutes();
	var currenttime = '';
	currenttime += hours + (minuts < 10 ? ':0' : ':') + minuts + (hours > 11 ? ' PM' : ' AM');
	return currenttime;
}
function switchsortnum( personid, category, f, t, callback) {
	if( f < t) {
		client.query('UPDATE tbl_person SET sortnum = sortnum-1 WHERE sortnum > ? and sortnum <= ? and category_status=?', [f, t, category], function( err, results, fields ){});
		client.query('UPDATE tbl_person SET sortnum = ? WHERE id_person = ?', [t, personid], function( err, results, fields ){});
	} else { // f > t
		client.query('UPDATE tbl_person SET sortnum = sortnum+1 where sortnum < ? and sortnum > ? and category_status=?', [f, t, category], function( err, results, fields ){});
		client.query('UPDATE tbl_person SET sortnum = ? WHERE id_person = ?', [t+1, personid], function( err, results, fields ){});
	}
	callback(personid, f, t);
}
io.sockets.on('connection', function (socket) {
		
	socket.on('list_require_data', function (data) {
		socket.set('nickname', data, function () {
			var data_users = {};
			client.query('select * from tbl_person where available=0 ORDER BY id_person', function(err, results, fields) {
				data_ua_persons = results;
				client.query('select * from tbl_person where available=1 ORDER BY sortnum', function(err, results, fields) {
					console.log(err);
					data_persons = results;
					socket.emit('response_data', {person : data_persons , unavailpersons: data_ua_persons});
				});
				//console.log(data_persons);
				//socket.emit('response_data', { person : data_persons , user: data_users});
			});
		});
	});
	socket.on('roster_require_data', function (data) {
		/*socket.set('nickname', data, function () {
			var data_users = {};
			client.query('select * from tbl_person where available=1 ORDER BY sortnum', function(err, results, fields) {
				console.log(err);
				data_persons = results;
				socket.emit('response_data', {person : data_persons , user: data_users});
			});
		});*/
		client.query('select * from tbl_person where available=0 ORDER BY id_person', function(err, results, fields) {
			data_ua_persons = results;
			client.query('select * from tbl_person where available=1 ORDER BY sortnum', function(err, results, fields) {
				if(err) {
					console.log(" -------- error on roster_require_data ------------------ ");
					console.log(err);
				}
				data_persons = results;
				socket.emit('response_data', {person : data_persons , unavailpersons: data_ua_persons});
			});
			//console.log(data_persons);
			//socket.emit('response_data', { person : data_persons , user: data_users});
		});
	});
	socket.on('rotor_require_data', function (data) {
		socket.set('nickname', data, function () {
			var data_users = {};
			client.query('select * from tbl_person where available=1 ORDER BY sortnum', function(err, results, fields) {
				var data_persons = results;
				client.query('SELECT content FROM tbl_config WHERE id=\'boardcontent\'', function(err, results, fields) {
					var content='';
					if(!err) {
						content = results[0].content;
					}
					socket.emit('response_data', {person : data_persons , user: data_users, boardcontent: content});
				});
			});
		});
   });
	socket.on('person_avail', function(info){
		client.query('SELECT count(*) as cnt FROM tbl_person WHERE available=1 and category_status=?',[info.detail.category_status], function(err, results, fields){
			if(err){
				console.log("------------- person_avail error 1 ------------------------");
				console.log(err);
				return;
			}
			var personsortnum = results[0].cnt;
			client.query('UPDATE tbl_person SET available=1, sortnum=? WHERE id_person = ?',[personsortnum, info.id_person], function(err, results, fields) {
				if(err) {
					console.log("------------- person_avail error 2 ------------------------");
					console.log(err);
					return;
				}
				info.detail.sortnum = personsortnum;
				io.sockets.emit('person_avail', info);
			});
		})
   	});
	socket.on('person_unavail', function(info){
		// Resetting sort number
		client.query('SELECT sortnum FROM tbl_person WHERE id_person=?',[info.id_person], function(err, results, fields) {
			if(err) {
				console.log("------------- person_unavail error 1 ------------------------");
				console.log(err);
				return;
			}
			var personsortnum = results[0].sortnum;
				client.query('UPDATE tbl_person SET sortnum = sortnum - 1 WHERE category_status = ? and sortnum > ? and available = 1',[info.detail.category_status, personsortnum],function(err, results, fields){
			});
		});
		// Set report
		client.query('UPDATE tbl_reports SET tour_end=now() where id_reports=(select id_reports from tbl_person where id_person=?)',[info.id_person], function(err, results, fields){});
		client.query('UPDATE tbl_reports SET manager_end=now() where manager_start!=\'0000-00-00 00:00:00\' and manager_end=\'0000-00-00 00:00:00\' and id_reports=(select id_reports from tbl_person where id_person=?)',[info.id_person], function(err, results, fields){});
		client.query('UPDATE tbl_reports SET manager_end=now() where manager=?', [info.id_person], function(err, results, fields){});
		
		// Set Person info
		client.query('UPDATE tbl_person SET available=0, portal_status=\'\', managername=\'\', assignedtime=\'\', managestatus=\'0\' WHERE id_person = ?',[info.id_person]
			, function(err, results, fields) {
				if(err) {
					return;
				}
				io.sockets.emit('person_unavail', info);
			});
   	});
	socket.on('unavail_allperson', function (info) {
		// Set report
		client.query('UPDATE tbl_reports SET manager_end=now() where manager_start!=\'0000-00-00 00:00:00\' and manager_end=\'0000-00-00 00:00:00\'', [], function(err, results, fields){});
		client.query('UPDATE tbl_reports SET tour_end=now() where tour_end=\'0000-00-00 00:00:00\'',[], function(err, results, fields){});
		
		
		client.query('UPDATE tbl_person SET available=0, portal_status=\'\', managerid=\'\', managername=\'\', assignedtime=\'\', managestatus=\'0\', id_reports=\'0\', sortnum=\'0\', scheduledtime=\'\'',[]
			, function(err, results, fields) {
				if(err) {
					console.log(" ---------------------- error on unavail_allperson ---------------------- ");
					console.log(err);
					return;
				}
				client.query('select * from tbl_person where available=0 ORDER BY id_person', function(err, results, fields) {
					data_persons = results;
					io.sockets.emit('unavail_allperson', { unavailpersons : data_persons});
				});
			});
	});
	socket.on('create_person', function (info) {
		client.query('INSERT INTO tbl_person SET firstname = ?, category_status = ?',[info.firstname,info.category_status]
			, function(err, results, fields) {
				if(err) {
					return;
				}
				info.id_person = results.insertId;
				info.available = 0;
				info.portal_status = '';
				info.description = '';
				io.sockets.emit('create_person', info);
			});
	});
	socket.on('delete_person', function (info) {
		client.query('DELETE FROM tbl_person WHERE id_person=?',[info.id_person]
			, function(err, results, fields) {
				if(err) {
					return;
				}
				io.sockets.emit('delete_person', info);
			});
	});
	socket.on('person_categorymove', function (info) {
		client.query('UPDATE tbl_person SET category_status=? WHERE id_person = ?',[info.to, info.id_person]
			, function(err, results, fields) {
				if(err) {
					return;
				}
				io.sockets.emit('person_categorymove', info);
			});
	});
	socket.on('person_categorymove_a', function (info) {
		client.query('UPDATE tbl_person SET category_status=? WHERE id_person = ?',[info.to, info.id_person]
			, function(err, results, fields) {
				if(err) {
					return;
				}
				socket.broadcast.emit('person_categorymove_a', info);
			});
	});
	socket.on('person_removeportal', function (info) {
		var personsortnum = 0;
		if(info.fromtour == 1)
		{
			client.query('SELECT sortnum FROM tbl_person WHERE id_person=?',[info.id_person], function(err, results, fields) {
				if(err) {
					console.log("------------- person_removeportal error 1 ------------------------");
					console.log(err);
					return;
				}
				personsortnum = results[0].sortnum;
				client.query('SELECT count(*) as cnt FROM tbl_person WHERE available=1 and category_status=?',[info.detail.category_status], function(err, results, fields){
					if(err){
						console.log("------------- person_removeportal error 2 ------------------------");
						console.log(err);
						return;
					}
					var newsortnum = results[0].cnt - 1;
					switchsortnum(info.id_person, info.detail.category_status, personsortnum, newsortnum, function(personid, from, to){
						socket.broadcast.emit('movetolast', {id_person: personid});
					});
				});
			});
		}
			
		client.query('UPDATE tbl_person SET portal_status=\'\', available=1, managestatus=0, managerid=\'\', managername=\'\', assignedtime=\'\' WHERE id_person = ?', [info.id_person]
			,function(err, results, fields) {
				if(err) {
					return;
				}
				var assignedtime = getCurrentTime();
				
				// if manager is leaving from tour, on the report table manager leave is set.
				client.query('UPDATE tbl_reports SET tour_end=now() where id_reports=?',[info.detail.id_reports], function(err, results, fields){});
				client.query('UPDATE tbl_reports SET manager_end=now() where manager=?', [info.id_person], function(err, results, fields){});

				client.query('UPDATE tbl_person SET managestatus=\'2\', assignedtime=?, available=1 WHERE managerid = ? and available=1', [assignedtime, info.id_person]
					,function(err, results, fields){
						if(err) {
							return;
						}
						info.assignedtime = assignedtime;
						info.detail.portal_status = '';
						info.detail.sortnum = personsortnum;
						io.sockets.emit('person_removeportal', info);
				});
			});		
	});
	
	socket.on('person_portalmove', function (info) {
		var newsortnum = null;
		if(info.istour == 1)
		{
			client.query('SELECT sortnum FROM tbl_person WHERE id_person=?',[info.id_person], function(err, results, fields) {
				if(err) {
					console.log("------------- person_removeportal error 1 ------------------------");
					console.log(err);
					return;
				}
				var personsortnum = results[0].sortnum;
				client.query('SELECT count(*) as cnt FROM tbl_person WHERE available=1 and category_status=?',[info.detail.category_status], function(err, results, fields){
					if(err){
						return;
					}
					newsortnum = results[0].cnt;
					if(info.detail.available == 1){ newsortnum--; }
					switchsortnum(info.id_person, info.detail.category_status, personsortnum, newsortnum, function(personid, from, to){
						socket.broadcast.emit('movetolast', {id_person: personid});
					});
				});
			});
			
			if(typeof info.detail.id_reports !='undefined' && info.detail.id_reports > 0) {
				client.query('UPDATE tbl_reports SET tour_end=now() where id_reports=?',[info.detail.id_reports], function(err, results, fields){});
			}
		}
		var scheduledtime = '';
		if(typeof info.scheduledtime != 'undefined'){
			scheduledtime = info.scheduledtime;
		} else {
			info.scheduledtime = '';
		}
		//Create new report record
		client.query('INSERT INTO tbl_reports SET createdate=now(), tourtype=?, name=?, tour_start=now()',[info.to, info.detail.firstname]
			, function(err, results, fields) {
				var reportid = 0;
				if(err) {
					reportid = 0;
				} else {
					reportid = results.insertId;
				}
				if(typeof info.managerleave != 'undefined' && info.managerleave == 1) {
					// if manager is leaving from tour, on the report table manager leave is set.
					client.query('UPDATE tbl_reports SET manager_end=now() where manager=?', [info.id_person], function(err, results, fields){});
				}
				client.query('UPDATE tbl_person SET portal_status=?, available=1, id_reports=?, scheduledtime=? WHERE id_person = ?', [info.to, reportid, scheduledtime, info.id_person]
					,function(err, results, fields) {
						if(err){
							console.log('-------------------scheduledtime error 2---------------------');
							console.log(err);
							return;
						}
						info.detail.id_reports = reportid;
						info.detail.portal_status = info.to;
						if(newsortnum != null) {
							info.detail.sortnum = newsortnum;
						}
						if(typeof info.managerleave != 'undefined'
							&& info.managerleave == 1)
						{
							var assignedtime = getCurrentTime();
							client.query('UPDATE tbl_person SET managestatus=\'2\', assignedtime=?, available=1, managestatus=0, managerid=\'\', managername=\'\', assignedtime=\'\' WHERE managerid = ? and available=1', [assignedtime, info.id_person]
								,function(err, results, fields){
									if(err) {
										return;
									}
									info.assignedtime = assignedtime;
									io.sockets.emit('person_portalmove', info)
							});
						} else {
							io.sockets.emit('person_portalmove', info);
						}
					});
			});
		
	});
	//---------------------------------------------------------------------------------------------------------------
	socket.on('person_assignmanager', function (info) {
		console.log('=--------------------------------person_assignmanager_param---------------------');
		console.log(info);
		client.query('UPDATE tbl_reports SET manager=?, manager_name=?, manager_start=now() where id_reports=?', [info.managerid, info.managername, info.id_reports], function(err, results, fields){console.log(err);});

		var assignedtime = getCurrentTime();
		client.query('UPDATE tbl_person SET managerid=?, managername=?, assignedtime=?, managestatus=1 WHERE id_person = ?', 
		[info.managerid, info.managername, assignedtime,info.id_person]
			,function(err, results, fields) {
				if(err){
					return;
				}
				info.assignedtime = assignedtime;
				io.sockets.emit('person_assignmanager', info);
			});
	});
	//-------------------------------------------------------------------------------------------------------------
	
	socket.on('user_require_data', function(data){
		socket.set('nickname', data, function () {
			var data_users = {};
			client.query('select * from mst_user;', function(err, results, fields) {
				data_users = results;
				socket.emit('response_data', { users: data_users});
			});
		});
	});
	socket.on('user_create', function(info){
		client.query('INSERT INTO mst_user SET name=?, password=?, groupname=?, status=?',[info.name, info.password, info.groupname, info.status]
			, function(err, results, fields) {
				
				if(err) {
					client.query('select * from mst_user;', function(err, results, fields) {
						data_users = results;
						socket.emit('response_data', { users: data_users});
					});
				} else {
					io.sockets.emit('user_create', info);
				}
			});
	});
	socket.on('user_delete', function(info){
		client.query('DELETE FROM mst_user WHERE name=?',[info.name]
			, function(err, results, fields) {
				if(err) {
					console.log(err);
					client.query('select * from mst_user;', function(err, results, fields) {
						data_users = results;
						socket.emit('response_data', { users: data_users});
					});
				} else {
					io.sockets.emit('user_delete', info);
				}
			});
	});
	socket.on('user_modify', function(info){
		client.query('UPDATE mst_user SET name=?, password=?, groupname=?, status=? WHERE name = ?',[info.name, info.password, info.groupname, info.status, info.srcname]
			, function(err, results, fields) {
				if(err) {
					console.log(err);
					client.query('select * from mst_user;', function(err, results, fields) {
						data_users = results;
						socket.emit('response_data', { users: data_users});
					});
				} else {
					console.log("--------modifysuccess--------------");
					io.sockets.emit('user_modify', info);
				}
			});
	});

	socket.on('switchsortnum', function(info) {
		client.query('SELECT sortnum FROM tbl_person WHERE id_person=?',[info.id_person], function(err, results, fields) {
			if(err) {
				console.log('------------------- switchsortnum error 1 get target id -----------------------');
				console.log(err);
			}
			var targetsortnum = results[0].sortnum;
			if(info.id_dstperson != ''){
				client.query('SELECT sortnum FROM tbl_person WHERE id_person=?',[info.id_dstperson], function(err, results, fields) {
					if(err) {
						console.log('------------------- switchsortnum error 2 get dest id -----------------------');
						console.log(err);
					}
					var dstsortnum = results[0].sortnum;
					switchsortnum(info.id_person, info.detail.category_status, targetsortnum, dstsortnum, function(personid, from, to){
						socket.broadcast.emit('switchsortnum', {id_person: personid, id_dstperson: info.id_dstperson});

						if( info.detail.portal_status == '' || data_portals[info.detail.portal_status].istour == 0 ||
							data_categories[info.detail.category_status].assignedby == '') {
							if(dstsortnum < targetsortnum){
								dstsortnum++;
							}
							client.query('SELECT id_person, portal_status FROM tbl_person WHERE sortnum<? and category_status=? ORDER BY sortnum DESC',[dstsortnum,info.detail.category_status],function( err, results, fields){
								console.log(results);
								console.log('------------------------------------------');
								id_dstperson = null;
								for(i = 0; i < results.length; i++) {
									if( results[i].portal_status == '' || data_portals[results[i].portal_status].istour == 0 ||
										data_categories[info.detail.category_status].assignedby == ''){
										id_dstperson = results[i].id_person;
										break;
									}
								}
								if(id_dstperson != null) {
									socket.broadcast.emit('switchsortnum_rotor', {id_person: personid, id_dstperson: id_dstperson});
								}
							});
						} else {
							console.log(info);
							console.log('------------------ NOT MOVE IN ROTOR ------------------------');
						}
					});					
				});
			} else {
				var dstsortnum = -1;
				//var dstsortnum = results[0].sortnum;
				switchsortnum(info.id_person, info.detail.category_status, targetsortnum, dstsortnum, function(personid, from, to){
					socket.broadcast.emit('switchsortnum', {id_person: personid, id_dstperson: info.id_dstperson});
					if( info.detail.portal_status == '' || data_portals[info.detail.portal_status].istour == 0||
							data_categories[info.detail.category_status].assignedby == '') {
						socket.broadcast.emit('switchsortnum_rotor', {id_person: personid, id_dstperson: ''});
					}
				});
			}
		});
	});
	socket.on('changboardcontent', function (info) {
		client.query('UPDATE tbl_config SET content=? WHERE id=\'boardcontent\'',[info.content], function(err, results, fields) {
			socket.broadcast.emit('changboardcontent', info);
		});
	});
   /*socket.on('require_data', function (data) {
		socket.set('nickname', data, function () {
			io.sockets.socket(socket.id).emit('response_data', {category : data_categories, person : data_persons });
		});
   });
	socket.on('person_move', function (info) {
		var i = 0;
		for( i = 0; i < data_persons.length; i++){
			if(data_persons[i].firstname == info.target){
				data_persons[i].category = info.to;
				break;
			}
		}
		socket.broadcast.emit('modify_data', info);
	});*/
});

/*protocols--------------------
person_avail
person_unavail
move_person
create_person
delete_person
*/