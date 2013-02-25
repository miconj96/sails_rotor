
(function($){
	var data_users = null;
	var userlistview = null;
	var usercreateview = null;
	var usermodifyview = null;
	
	getUserIndex = function(arg) {
		result = -1;
		if(typeof data_users !== 'undefined')
		{
			for(i = 0; i < data_users.length; i++) {
				if (data_users[i].name == arg)
				{
					result = i;
					break;
				}
			}
		}
		return result;
	}
	getUser = function(arg) {
		return data_users[getUserIndex(arg)];
	}
	
    var socket = io.connect(SERVER_URL);
    
	Backbone.sync = function(method, model, success, error){ 
		success();
	}
	var User = Backbone.Model.extend({
		defaults: {
			name: '',
			password: '',
			groupname: '',
			status: 0,
		}
	});
	
	var UserList = Backbone.Collection.extend({
		model: User
	});	
/*	
	getPersonIndex = function(arg) {
		result = -1;
		for(i = 0; i < data_persons.length; i++) {
			if (data_persons[i].id_person == arg)
			{
				result = i;
				break;
			}
		}
		return result;
	}
	getPerson = function(arg) {
		return data_persons[getPersonIndex(arg)];
	}*/
	
	var UserModifyView = Backbone.View.extend({
		el: $("#edituser"),
		events : {
			'click input.btn_modify_do':  'modifyuser',
			'click input.btn_modify_reset':  'reset',
			'click input.btn_modify_close':  'closeview',
		},
		initialize: function() {
			if(usercreateview) {
				usercreateview.closeview();
				delete usercreateview;
				usercreateview = null;
			}
			_.bindAll(this, 'render', 'unrender', 'modifyuser', 'reset', 'closeview', 'show');
			
			this.model.bind('change', this.render);
			this.render();
		},
		render: function() {
			var htmlContents = '<div><table class="usertable">';
			htmlContents += '<tr><td>Username</td><td><input type=\'text\' class=\'txt_create_name\' value=\''+this.model.get('name')+'\' /></td></tr>';
			htmlContents += '<tr><td>Password</td><td><input type=\'text\' class=\'txt_create_password\' value=\''+this.model.get('password')+'\' /></td></tr>';
			htmlContents += '<tr><td>groupname</td><td><select class=\'sel_create_groupname\'>';
			for(var perm in g_permisions){
				if(this.model.get('groupname') == g_permisions[perm]) {
					htmlContents += '<option value=\''+g_permisions[perm]+'\' selected >'+g_permisions[perm]+'</option>';
				} else {
					htmlContents += '<option value=\''+g_permisions[perm]+'\'>'+g_permisions[perm]+'</option>';
				}
			}
			htmlContents += '</select></td></tr>';
			if (this.model.get('status') == 'Enabled') {
				htmlContents += '<tr><td>Status</td><td><input type=\'radio\' name=\'rad_create_status\' value=\'Enabled\' checked />Enabled<input type=\'radio\' name=\'rad_create_status\'  value=\'Disabled\'/>Disabled</td></tr>';
			} else {
				htmlContents += '<tr><td>Status</td><td><input type=\'radio\' name=\'rad_create_status\' value=\'Enabled\'  />Enabled<input type=\'radio\' name=\'rad_create_status\'  value=\'Disabled\' checked />Disabled</td></tr>';
			}
			
			htmlContents += '<tr><td></td><td><input type=\'button\' class=\'btn_modify_do\' value=\'Save\' />';
			htmlContents += '<input type=\'button\' class=\'btn_modify_reset\' value=\'Reset\' />';
			htmlContents += '<input type=\'button\' class=\'btn_modify_close\' value=\'Close\' /></td></tr></table></div>';
			$(this.el).html(htmlContents);
		},
		modifyuser: function() {
			var username = $(".txt_create_name", this.el).val();
			if(username != this.model.get('name'))
			{
				if(getUserIndex(username) >= 0) {
					alert("User Name is duplicated.");
					return;
				}
			}
			if(confirm("Are you sure to modify a user?")){	
				var password = $(".txt_create_password", this.el).val();
				var groupname = $('.sel_create_groupname', this.el).val();
				var status = $("input:radio[name='rad_create_status']:checked", this.el).val();
				
				socket.emit('user_modify', {srcname: this.model.get('name'),name: username, password: password, groupname:groupname, status:status});
				$('div', this.el).hide();
			}
		},
		show: function () {
			$('div', this.el).show();
		},
		reset: function() {
			$("input:text", this.el).val('');
			$("input:radio[name='rad_create_status']", this.el).filter('[value=1]').attr('checked', true);
			$('select', this.el).val(1);
			$('.txt_create_name', this.el).focus();
		},
		closeview: function() {			
			$('div', this.el).hide();
		},
		unrender: function(){
			$('div', this.el).remove();
		},
	});
	var UserCreateView = Backbone.View.extend({
		el: $("#createuser"),
		events : {
			'click input.btn_create_new':  'createnewuser',
			'click input.btn_create_reset':  'reset',
			'click input.btn_create_close':  'closeview',
		},
		initialize: function() {
			if(usermodifyview) {
				usermodifyview.model.destroy();
				usermodifyview.closeview();
				delete usermodifyview;
				usermodifyview = null;
			}
			_.bindAll(this, 'render', 'unrender', 'createnewuser', 'reset', 'closeview', 'show');
			
			this.render();
		},
		render: function() {
			var htmlContents = '<div><table class="usertable">';
			htmlContents += '<tr><td>Username</td><td><input type=\'text\' class=\'txt_create_name\' /></td></tr>';
			htmlContents += '<tr><td>Password</td><td><input type=\'text\' class=\'txt_create_password\' /></td></tr>';
			htmlContents += '<tr><td>groupname</td><td><select class=\'sel_create_groupname\'>';
			for(var perm in g_permisions){
				htmlContents += '<option value=\''+g_permisions[perm]+'\'>'+g_permisions[perm]+'</option>';
			}
			htmlContents += '</select></td></tr>';
			htmlContents += '<tr><td>Status</td><td><input type=\'radio\' name=\'rad_create_status\' value=\'Enabled\' checked />Enabled<input type=\'radio\' name=\'rad_create_status\'  value=\'Disabled\'/>Disabled</td></tr>';
			htmlContents += '<tr><td></td><td><input type=\'button\' class=\'btn_create_new\' value=\'Save\' />';
			htmlContents += '<input type=\'button\' class=\'btn_create_reset\' value=\'Reset\' />';
			htmlContents += '<input type=\'button\' class=\'btn_create_close\' value=\'Close\' /></td></tr></table></div>';
			$(this.el).html(htmlContents);
		},
		createnewuser: function() {
			var username = $(".txt_create_name", this.el).val();
			if(getUserIndex(username) >= 0) {
				alert("User Name is duplicated.");
				return;
			}
			if(confirm("Are you sure to create a user?")){
				
				var password = $(".txt_create_password", this.el).val();
				var groupname = $('.sel_create_groupname', this.el).val();
				var status = $("input:radio[name='rad_create_status']:checked", this.el).val();
				
				socket.emit('user_create', {name: username, password: password, groupname:groupname, status:status});
				$('div', this.el).hide();
			}
		},
		show: function() {
			$('div', this.el).show();
		},
		reset: function() {
			$("input:text", this.el).val('');
			$("input:radio[name='rad_create_status']", this.el).filter('[value=1]').attr('checked', true);
			$('select', this.el).val(1);
			$('.txt_create_name', this.el).focus();
		},
		closeview: function() {
			//this.unrender();
			//usercreateview = null;
			$('div', this.el).hide();
		},
		unrender: function(){
			$('div', this.el).remove();
		},
	});
	var UserView = Backbone.View.extend({
		tagName: 'li', // name of tag to be created   
		events: { 
			'click button.editbutton':  'useredit',
			'click button.deletebutton':  'userdelete',
		},
		initialize: function() {
			_.bindAll(this, 'render', 'unrender', 'remove', 'useredit', 'userdelete');

      		this.model.bind('change', this.render);
      		this.model.bind('remove', this.unrender);
      		this.render();
		},
		render: function() {
			var htmlContents = '';
			htmlContents += '<div class=\'user_col_name\'>'+this.model.get('name')+'</div>';
			htmlContents += '<div class=\'user_col_password\'>'+this.model.get('password')+'</div>';
			htmlContents += '<div class=\'user_col_groupname\'>'+this.model.get('groupname')+'</div>';
			htmlContents += '<div class=\'user_col_status\'>'+this.model.get('status')+'</div>';
			htmlContents += '<div style=\'user_col_buttons\'><button class=\'editbutton\'>Edit</button>';
			htmlContents += '<button class=\'deletebutton\'>Delete</button></div><div class=\'clear_div\'></div>';
			$(this.el).html(htmlContents);
			return this;
		},
		useredit: function()
		{
			if(!usermodifyview){
				var user = new User();
				user.set({
					name: this.model.get('name'),
					password: this.model.get('password'),
					groupname: this.model.get('groupname'),
					status: this.model.get('status'),
				});
				usermodifyview = new UserModifyView({model: user});
			} else {
				usermodifyview.model.set({
					name: this.model.get('name'),
					password: this.model.get('password'),
					groupname: this.model.get('groupname'),
					status: this.model.get('status'),
				});
				usermodifyview.show();
			}
		},
		userdelete: function()
		{
			if(confirm("Are you sure to delete a user?")){				
				socket.emit('user_delete', {name: this.model.get('name')});
			}
		},
		unrender: function(){
			$(this.el).remove();
		},
		remove: function(){
			this.model.destroy();
		}
	});
	
	var UserListView = Backbone.View.extend({
		el: $('#userlist'),
		events: {
			'click a.opencreatuser' : 'opencreatenewuser',
		},
		initialize: function(){
			_.bindAll(this, 'render', 'appendUser', 'opencreatenewuser');
			
			this.collection = new UserList();
			this.collection.bind('add', this.appendUser);
			this.render();
		},
		render: function(){
			var htmlContent = "<ul><li><div class='user_col_name'>User Name</div>";
			htmlContent += "<div class='user_col_password'>Password</div>";
			htmlContent += "<div class='user_col_groupname'>groupname</div>";
			htmlContent += "<div class='user_col_status'>Status</div>";
			htmlContent += "<div class='user_col_buttons'><a class='opencreatuser'>New User</a></div><div class=\'clear_div\'></div></li></ul>";
			$(this.el).append(htmlContent);
			for(i = 0; i < data_users.length; i++) {
				var user = new User();
				user.set({
					name: data_users[i].name,
					password: data_users[i].password,
					groupname: data_users[i].groupname,
					status: data_users[i].status,
				});
				this.collection.add(user);
			}
		},
		appendUser: function( item ) {
			var user = new UserView({
				model: item
			});
			user.parentView = this;
			$('ul', this.el).append(user.render().el);
			
		},
		opencreatenewuser: function() {
			if(!usercreateview){
				usercreateview = new UserCreateView();
			} else {
				usercreateview.show();
			}
		},
		removeview: function(){
			$('ul', this.el).remove();
		},
	});

	$(document).ready(function(){
		socket.emit('user_require_data', '');
	});
	socket.on('response_data', function (data) {
		data_users = data.users;
		if(userlistview) {
			userlistview.removeview();
		} else {
			$('#loaddiv').remove();
		}
		userlistview = new UserListView();
	});

	socket.on('user_create', function (info){
		if(userlistview) {
			data_users.push(info);
			var user = new User();
			user.set({
					name: info.name,
					password: info.password,
					groupname: info.groupname,
					status: info.status,
				});
			userlistview.collection.add(user);
		}
	});
	socket.on('user_delete', function (info){
		if(userlistview) {
			var rmpersons = userlistview.collection.select(function(user) {
				return user.get("name") == info.name;
			});
			// delete person from list view
			if(rmpersons.length > 0)
			{
				rmpersons[0].destroy();
			}
			// delete person from data list
			var idx = getUserIndex(info.name);
			data_users.splice(idx, 1);
		}
	});
	socket.on('user_modify', function (info) {
		if(userlistview) {
			var mdusers = userlistview.collection.select(function(user) {
				return user.get("name") == info.srcname;
			});
			if(mdusers.length > 0) {
				mdusers[0].set({
					name: info.name,
					password: info.password,
					groupname: info.groupname,
					status: info.status,
				});
			}
		}
	});
})(jQuery);

