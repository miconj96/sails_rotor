
(function($){
	var data_categories = new Array();
	var data_persons = null;
	var categorylistview = null;
	
	var tourcategorylistview = null;
	var portallistview = null;
	
    var socket = io.connect(SERVER_URL);
   
	Backbone.sync = function(method, model, options) {
	}
	var ModelCategory = Backbone.Model.extend({
		defaults: {
			name: '',
			label: '',
			order: 0,
		}
	});
	var ModelPortal = Backbone.Model.extend({
		defaults: {
			name: '',
			label: '',
			order: 0,
		}
	});
	var ModelPerson = Backbone.Model.extend({
		defaults: {
			id: '',
			firstname: '',
			category: '',
			portal: '',
			assignedtime: '',
			managerid: '',
			managestatus: '',
			scheduledtime: '',
			sortnum: 0,
		}
	});
	
	var PersonList = Backbone.Collection.extend({
		model: ModelPerson,
		removeAllModels: function () {
			for(i = this.models.length - 1; i >= 0; i--) {
				this.models[i].destroy();
			}
		}
	});	
	
	var CategoryList = Backbone.Collection.extend({
		model: ModelCategory,
		comparator: function(cat) {
		  return cat.get('order');
		}
	});
	
	var PortalList = Backbone.Collection.extend({
		model: ModelPortal,
		comparator: function(ptl) {
		  return ptl.get('order');
		}
	});
	
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
	}
	var PersonView = Backbone.View.extend({
		tagName: 'li', // name of tag to be created   
		events: { 
			'click button.unavailbutton':  'unavailperson',
			'click button.portalmovebutton':  'portalmove',
			'click button.scheduledtimebutton': 'scheduledtimeadd',
			'click button.closescheduletimediv': 'closescheduletimediv',
			'click button.portalmovewithschedule': 'portalmovewithschedule',
		},
		initialize: function(){
			_.bindAll(this, 'render', 'unrender', 'unavailperson', 'scheduledtimeadd', 'closescheduletimediv', 'portalmovewithschedule');

      		this.model.bind('change', this.render);
      		this.model.bind('remove', this.unrender);
		},
		render: function(){
			var htmlContents = '';
			var linkedPortals;
			var i, j;
			
			htmlContents = '<span style="color:black;">'+this.model.get('firstname')+'</span><div class="btn-group pull-right">';
			htmlContents += '</div><div style="display:none;" id="scheduletimediv"><input type="hidden" id="targetportal" value="123" />Scheduled Start Time : <input type="text" id="scheduledtime" value="" /><button class="portalmovewithschedule btn-mini">Save</button><button class="closescheduletimediv btn-mini">Cancel</button></div>';
			$(this.el).html(htmlContents);
			$(this.el).attr( 'id', 'clp_' + this.model.get('id') );
			return this;
		},
		unavailperson:function()
		{
			idx = getPersonIndex(this.model.get('id'));
			if(idx >= 0){
				//************************************************************
				socket.emit('person_unavail', {id_person:this.model.get('id'), detail: data_persons[idx]});
				//************************************************************
				//delete data_persons.splice(idx, 1);
				//this.remove();
			} else {
				socket.emit('rotor_require_data', '');
			}
		},
		portalmove: function(evt)
		{
			var e = window.event || evt;
    		var who= e.target || e.srcElement;
			var eventbuttonid = who.id;
			if(eventbuttonid.length <= 0){
				return;
			}
			eventbuttonid = eventbuttonid.substring(4);
			
			idx = getPersonIndex(this.model.get('id'));
			if(idx >= 0){
				//************************************************************
				if (g_portals[eventbuttonid].istour != 1
				  && g_categories[data_persons[idx].category_status].assignedby == '') 
				{//If manager moves to the other portal(none tour portal)
				  	socket.emit('person_portalmove',{ id_person: this.model.get('id'), detail: data_persons[idx], to: eventbuttonid, managerleave: 1, istour: g_portals[eventbuttonid].istour});
				} else {
					socket.emit('person_portalmove',{ id_person: this.model.get('id'), detail: data_persons[idx], to: eventbuttonid, istour: g_portals[eventbuttonid].istour});
				}
				//************************************************************
			} else {
				socket.emit('require_data', '');
			}
		},
		portalmovewithschedule: function() {
			eventbuttonid = $(this.el).children('#scheduletimediv').children("#targetportal").val();
			idx = getPersonIndex(this.model.get('id'));
			scheduledtime = $(this.el).children('#scheduletimediv').children("#scheduledtime").val();
			if(idx >= 0){
				//************************************************************
				if (g_portals[eventbuttonid].istour != 1
				  && g_categories[data_persons[idx].category_status].assignedby == '') 
				{//If manager moves to the other portal(none tour portal)
				  	socket.emit('person_portalmove',{ id_person: this.model.get('id'), detail: data_persons[idx], to: eventbuttonid, managerleave: 1, istour: g_portals[eventbuttonid].istour, scheduledtime: scheduledtime});
				} else {
					socket.emit('person_portalmove',{ id_person: this.model.get('id'), detail: data_persons[idx], to: eventbuttonid, istour: g_portals[eventbuttonid].istour, scheduledtime: scheduledtime});
				}
				//************************************************************
			} else {
				socket.emit('require_data', '');
			}
			$(this.el).children('#scheduletimediv').hide();
		},
		scheduledtimeadd: function(evt)
		{
			var e = window.event || evt;
    		var who= e.target || e.srcElement;
			var eventbuttonid = who.id;
			if(eventbuttonid.length <= 0){
				return;
			}
			eventbuttonid = eventbuttonid.substring(4);
			$(this.el).children('#scheduletimediv').children("#scheduledtime").val('');
			$(this.el).children('#scheduletimediv').show();
			$(this.el).children('#scheduletimediv').children("#targetportal").val(eventbuttonid);
		},
		closescheduletimediv: function()
		{
			$(this.el).children('#scheduletimediv').hide();
		},
		unrender: function(){
			$(this.el).remove();
		},
		remove: function(){
			this.model.destroy();
		}
	});
	
	var CategoryView = Backbone.View.extend({
		tagName: 'li',
		initialize: function(){
			_.bindAll(this, 'render', 'unrender', 'remove');
			this.model.bind('remove', this.unrender);
		},
		render: function(){
			$(this.el).attr('class', g_categories[this.model.get('name')].rotorpageclass);
			$(this.el).html('<h2>'+this.model.get('label')+' - In</h2><ol id=\'ol_'+this.model.get('name')+'\'></ol>');
			return this;
		},
		unrender: function(){
			$(this.el).remove();
		},
		remove: function(){
			this.model.destroy();
		}
	});
	var CategoryListView = Backbone.View.extend({
		el: $('#orglist'),
		initialize: function(){
			_.bindAll(this, 'render', 'appendCategory', 'appendPerson');
			
			this.c_collection = new CategoryList();
			//this.c_collection.bind('add', this.appendCategory);
			
			this.p_collection = new PersonList();
			this.p_collection.bind('add', this.appendPerson);
			this.render();
		},
		render: function(){
			$(this.el).append("<ul id='orglist_ul'></ul>");
			for(var id in g_categories) {
				var cat = new ModelCategory();
				cat.set({
					name: id,
					label: g_categories[id].label,
					order: g_categories[id].order,
				});
				this.c_collection.add(cat);
			}
			this.c_collection.each(this.appendCategory);
			for(i = 0; i < data_persons.length; i++) {
				if(typeof g_portals[data_persons[i].portal_status] == 'undefined'
				 || g_categories[data_persons[i].category_status].assignedby == ''
				 || (g_portals[data_persons[i].portal_status].isonlist != 1
					&& g_portals[data_persons[i].portal_status].istour != 1))
				{
					var person = new ModelPerson();
					person.set({
						id: data_persons[i].id_person,
						firstname: data_persons[i].firstname,
						category: data_persons[i].category_status,
						portal: data_persons[i].portal_status,
						sortnum: data_persons[i].sortnum,
					});
					this.p_collection.add(person);
				}
			}
		},
		appendCategory: function( item ) {
			var catetory = new CategoryView({
				model: item
			});
			$('ul', this.el).append(catetory.render().el);
			
		},
		appendPerson: function(item) {
			if(item.get('appendmode') != 1) {
				var person = new PersonView({
					model: item,
				});
				person.parentView = this;
				$('#ol_'+item.get('category')).append(person.render().el);
			}
		},
		insertAfter: function(dstPersonID, srcPersonInfo) {
			var person = new ModelPerson();
			person.set({
				id: srcPersonInfo.id_person,
				firstname: srcPersonInfo.firstname,
				category: srcPersonInfo.category_status,
				portal: srcPersonInfo.portal_status,
				sortnum: srcPersonInfo.sortnum,
				appendmode: 1, 
			});
			this.p_collection.add(person);
			var personview = new PersonView({
				model: person,
			});
			if(dstPersonID != ''){
				$(personview.render().el).insertAfter($('#clp_'+dstPersonID));
			} else {
				$('#ol_'+srcPersonInfo.category_status).prepend(personview.render().el);
			}
			
		},
		removeview: function(){
			$('ul', this.el).remove();
		},
	});

	var TourPersonView = Backbone.View.extend({
		tagName: 'li', // name of tag to be created   
		events: { 
		      'click button.removeportalbutton':  'removeportal',
		      'click button.managerbutton':  'manager',
		      'click button.managercancelbutton':  'managercancel',
		      'click button.managerassignbutton':  'managerassign',
		},
		initialize: function(){
			_.bindAll(this, 'render', 'unrender', 'remove', 'removeportal', 'manager', 'managercancel', 'managerassign');

      		this.model.bind('change', this.render);
      		this.model.bind('remove', this.unrender);
		},
		render: function(){
			var htmlContents = '';
			var linkedCategories;
			var i, j;
			
			htmlContents = '<span style="color:black;">'+this.model.get('firstname')+'</span><div class="btn-group pull-right">';
			var personinfo = getPerson(this.model.get('id'));
			htmlContents += "</div>";
			if(this.model.get('managestatus') == MANAGERASSIGNED) {
				htmlContents += '<div class=\'assignedcontentdiv\'>'+personinfo.managername+'&nbsp;'+personinfo.assignedtime+'</div>';
			} else if (this.model.get('managestatus') == MANAGERLEFT) {
				htmlContents += '<div class=\'assignedcontentdiv \'>'+personinfo.managername+' left at '+personinfo.assignedtime+'</div>';
			} else {
				htmlContents += '<div class=\'assignedcontentdiv\'></div>';
			}
			htmlContents += '<div class=\'assigndiv\'></div>';
			$(this.el).html(htmlContents);
			return this;
		},
		removeportal: function(evt){		
			var idx = getPersonIndex(this.model.get('id'));
			if(idx >= 0){
				//******************************
				if(data_persons[idx].managestatus == MANAGERASSIGNED) {
					var manager_idx = getPersonIndex(data_persons[idx].managerid);
					socket.emit('person_removeportal',{ id_person: data_persons[idx].managerid, detail: data_persons[manager_idx], fromtour: 1});
				}
				socket.emit('person_removeportal',{ id_person: this.model.get('id'), detail: data_persons[idx], fromtour: 1});
				//*******************************
			} else {
				socket.emit('rotor_require_data', '');
			}
		},
		manager: function(evt){
			var htmlContents = '';
			var parentcategory = g_categories[this.model.get('category')].assignedby;
			for(var i = 0; i < data_persons.length; i++) {
				if(data_persons[i].category_status == parentcategory 
					&& data_persons[i].portal_status == ''){
					htmlContents += '<li id=\''+data_persons[i].id_person+'\' class="managerassignbutton"><a>'+data_persons[i].firstname+'</a></li>';
				}
			}
			$('.dropdown-menu', this.el).html(htmlContents);
		},
		managercancel: function(){
			$(this.el).children('.assigndiv').html('');
		},
		managerassign: function(e){
			var evt = window.event || e;
    		var who= evt.target || evt.srcElement;
			var managerid = $(who).parent().attr("id");
			var idx = getPersonIndex(this.model.get('id'));
			var idxm = getPersonIndex(managerid);
			if(idx >= 0){
				//******************************
				socket.emit('person_assignmanager',{ id_person: this.model.get('id'), managerid: managerid, managername: data_persons[idxm].firstname, status: 1, id_reports : data_persons[idx].id_reports});
				socket.emit('person_portalmove',{ id_person: managerid, detail: data_persons[idxm], to: g_categories[data_persons[idxm].category_status].tourportal, istour: 1});
				//*******************************
			} else {
				socket.emit('rotor_require_data', '');
			}
		},
		unrender: function(){
			$(this.el).remove();
		},
		remove: function(){
			this.model.destroy();
		}
	});
	
	var TourCategoryView = Backbone.View.extend({
		tagName: 'li',
		initialize: function(){
			_.bindAll(this, 'render', 'unrender', 'remove');
			this.model.bind('remove', this.unrender);
		},
		render: function(){
			$(this.el).attr('class', g_portals[this.model.get('name')].rotorpageclass);
			$(this.el).html('<h2>'+this.model.get('label')+' - Tour</h2><ol id=\'ol_'+this.model.get('name')+'\'></ol>');
			return this;
		},
		unrender: function(){
			$(this.el).remove();
		},
		remove: function(){
			this.model.destroy();
		}
	});
	var TourCategoryListView = Backbone.View.extend({
		el: $('#tourlist'),
		initialize: function(){
			_.bindAll(this, 'render', 'appendCategory', 'appendPerson');
			
			this.c_collection = new CategoryList();
			//this.c_collection.bind('add', this.appendCategory);
			
			this.p_collection = new PersonList();
			this.p_collection.bind('add', this.appendPerson);
			this.render();
		},
		render: function(){
			$(this.el).append("<ul></ul>");
			for(var id in g_portals) {
				if(g_portals[id].istour == 1){
					var cat = new ModelCategory();
					cat.set({
						name: id,
						label: g_portals[id].label,
						order: g_portals[id].order,
					});
					this.c_collection.add(cat);
				}
			}
			this.c_collection.each(this.appendCategory);
			for(i = 0; i < data_persons.length; i++) {
				if(typeof g_portals[data_persons[i].portal_status] != 'undefined')
				{
					if(g_portals[data_persons[i].portal_status].istour == 1) {
						var person = new ModelPerson();
						person.set({
							id: data_persons[i].id_person,
							firstname: data_persons[i].firstname,
							category: data_persons[i].category_status,
							portal: data_persons[i].portal_status,
							assignedtime: data_persons[i].assignedtime,
							managerid: data_persons[i].managerid,
							managestatus: data_persons[i].managestatus,
						});
						this.p_collection.add(person);
					}
				}
			}
		},
		appendCategory: function( item ) {
			var catetory = new TourCategoryView({
				model: item
			});
			$('ul', this.el).append(catetory.render().el);
			
		},
		appendPerson: function(item) {
			var person = new TourPersonView({
				model: item,
			});
			person.parentView = this;
			$('#ol_'+item.get('portal')).append(person.render().el);
		},removeview: function(){
			$('ul', this.el).remove();
		},
	});
	var PortalPersonView = Backbone.View.extend({
		tagName: 'li', // name of tag to be created   
		events: { 
		      'click button.removeportalbutton':  'removeportal',
		      'mousedown button.managerbutton':  'manager',
			  'click button.managercancelbutton':  'managercancel',
		      'click li.managerassignbutton':  'managerassign',
		},
		initialize: function(){
			_.bindAll(this, 'render', 'unrender', 'remove', 'removeportal', 'manager', 'managercancel', 'managerassign');

      		this.model.bind('change', this.render);
      		this.model.bind('remove', this.unrender);
		},
		render: function(){
			var htmlContents = '';
			var linkedCategories;
			var i, j;
			var x = this.model;
			htmlContents = '<span style="color:black;">'+this.model.get('firstname')+'</span>';
			htmlContents += '<span style="color:black;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'+this.model.get('scheduledtime')+'</span><div class="btn-group pull-right">';
			var personinfo = getPerson(this.model.get('id'));
			htmlContents += "</div>";
			if(this.model.get('managestatus') == MANAGERASSIGNED) {
				htmlContents += '<div class=\'assignedcontentdiv\'>'+personinfo.managername+'&nbsp;'+personinfo.assignedtime+'</div>';
			} else if (this.model.get('managestatus') == MANAGERLEFT) {
				htmlContents += '<div class=\'assignedcontentdiv\'>'+personinfo.managername+' left at '+personinfo.assignedtime+'</div>';
			} else {
				htmlContents += '<div class=\'assignedcontentdiv\'></div>';
			}
			htmlContents += '<div class=\'assigndiv\'></div>';
			$(this.el).html(htmlContents);
			return this;
		},
		removeportal: function(evt){		
			var idx = getPersonIndex(this.model.get('id'));
			if(idx >= 0){
				//******************************
				if(data_persons[idx].managestatus == MANAGERASSIGNED) {
					var manager_idx = getPersonIndex(data_persons[idx].managerid);
					socket.emit('person_removeportal',{ id_person: data_persons[idx].managerid, detail: data_persons[manager_idx], fromtour: 1});
				}
				socket.emit('person_removeportal',{ id_person: this.model.get('id'), detail: data_persons[idx], fromtour: 0});
				//*******************************
			} else {
				socket.emit('rotor_require_data', '');
			}
		},
		manager: function() {
			var htmlContents = '';
			var parentcategory = g_categories[this.model.get('category')].assignedby;
			for(var i = 0; i < data_persons.length; i++) {
				if(data_persons[i].category_status == parentcategory 
					&& data_persons[i].portal_status == ''){
					htmlContents += '<li id=\''+data_persons[i].id_person+'\' class="managerassignbutton"><a>'+data_persons[i].firstname+'</a></li>';
				}
			}
			$('.dropdown-menu', this.el).html(htmlContents);
		},
		managercancel: function(){
			$(this.el).children('.assigndiv').html('');
		},
		managerassign: function(){
			var evt = window.event || e;
    		var who= evt.target || evt.srcElement;
			var managerid = $(who).parent().attr("id");
			var idx = getPersonIndex(this.model.get('id'));
			var idxm = getPersonIndex(managerid);
			if(idx >= 0){
				//******************************
				socket.emit('person_assignmanager',{ id_person: this.model.get('id'), managerid: managerid, managername: data_persons[idxm].firstname, status: 1, id_reports : data_persons[idx].id_reports});
				socket.emit('person_portalmove',{ id_person: managerid, detail: data_persons[idxm], to: g_categories[data_persons[idxm].category_status].tourportal, istour: 1});
				//*******************************
			} else {
				socket.emit('rotor_require_data', '');
			}
		},
		unrender: function(){
			$(this.el).remove();
		},
		remove: function(){
			this.model.destroy();
		}
	});
	var PortalView = Backbone.View.extend({
		
		tagName: 'li',
		initialize: function(){
			_.bindAll(this, 'render', 'unrender', 'remove');
			this.model.bind('remove', this.unrender);
		},
		render: function(){
			$(this.el).attr('class', g_portals[this.model.get('name')].rotorpageclass);
			$(this.el).html('<h2>'+this.model.get('label')+'</h2><ol id=\'ol_'+this.model.get('name')+'\'></ol>');
			return this;
		},
		unrender: function(){
			$(this.el).remove();
		},
		remove: function(){
			this.model.destroy();
		}
	});
	var PortalListView = Backbone.View.extend({
		el: $('#portallist'),
		initialize: function(){
			_.bindAll(this, 'render', 'appendPortal', 'appendPerson');
			
			this.c_collection = new PortalList();
			//this.c_collection.bind('add', this.appendPortal);
			
			this.p_collection = new PersonList();
			this.p_collection.bind('add', this.appendPerson);
			this.render();
		},
		render: function(){
			$(this.el).append("<ul></ul>");
			for(var id in g_portals) {
				if(g_portals[id].isonrotor == 1 && g_portals[id].istour == 0){
					var cat = new ModelCategory();
					cat.set({
						name: id,
						label: g_portals[id].label,
						order: g_portals[id].order,
					});
					this.c_collection.add(cat);
				}
			}
			this.c_collection.each(this.appendPortal);
			for(i = 0; i < data_persons.length; i++) {
				if(typeof g_portals[data_persons[i].portal_status] != 'undefined')
				{
					if(g_portals[data_persons[i].portal_status].isonrotor == 1
					 && g_portals[data_persons[i].portal_status].istour == 0) {
					var person = new ModelPerson();
						person.set({
							id: data_persons[i].id_person,
							firstname: data_persons[i].firstname,
							category: data_persons[i].category_status,
							portal: data_persons[i].portal_status,
							assignedtime: data_persons[i].assignedtime,
							managerid: data_persons[i].managerid,
							managestatus: data_persons[i].managestatus,
							scheduledtime: data_persons[i].scheduledtime,
						});
						this.p_collection.add(person);
					}
				}
			}
		},
		appendPortal: function( item ) {
			var catetory = new PortalView({
				model: item
			});
			$('ul', this.el).append(catetory.render().el);
			
		},
		appendPerson: function(item) {
			var person = new PortalPersonView({
				model: item,
			});
			person.parentView = this;
			$('#ol_'+item.get('portal')).append(person.render().el);
		},removeview: function(){
			$('ul', this.el).remove();
		},
	});
	$(document).ready(function(){
		socket.emit('rotor_require_data', '');
		$("#btn_openeditboard").click(function() {
			$("#boardcontent").val($("#span_board").text());
			$("#div_boardeditor").show();
		});
		$("#btn_closeboard").click(function() {
			$("#div_boardeditor").hide();
		});
		$("#btn_saveboardcontent").click(function() {
			socket.emit("changboardcontent",{content: $("#boardcontent").val()});
			$("#desc").html($("#boardcontent").val());
			$("#span_board").html($("#boardcontent").val());
			$("#div_boardeditor").hide();
		});
	});
	socket.on('changboardcontent', function (data) {
		$("#span_board").html(data.content);
		$("#desc").html(data.content);
	});
	socket.on('response_data', function (data) {
		data_persons = data.person;
		if(categorylistview) {
			categorylistview.removeview();
		} else {
			$('#loaddiv').remove();
		}
		categorylistview = new CategoryListView();
		tourcategorylistview = new TourCategoryListView();
		portallistview = new PortalListView();

		$("#span_board").html(data.boardcontent);
		$("#desc").html(data.boardcontent);

	});

	socket.on('move_person', function (info) {
		if(categorylistview) {
			//var person = categorylistview.p_collection.where({firstname: info.target});
			// remove person view need to move
			var rmpersons = categorylistview.p_collection.select(function(person) {
				return person.get("id") == info.id;
			});
			if(rmpersons.length > 0)
			{
				rmpersons[0].destroy();
			}
			// modify data_persons value
			data_persons[getPersonIndex(info.id)].category = info.to;
			// create person view
			var person = new Person();
			person.set({
				id: info.id,
				firstname: info.firstname,
				category: info.to
			});
			categorylistview.p_collection.add(person);
		}
	});
	socket.on('person_avail', function (info) {
		if(categorylistview) {
			data_persons.push(info.detail);
			var person = new ModelPerson();
			person.set({
				id:info.id_person,
				firstname: info.detail.firstname,
				category: info.detail.category_status,
				portal: info.detail.portal_status,
				sortnum: info.detail.sortnum,
			});
			categorylistview.p_collection.add(person);
		}
	});
	socket.on('person_unavail', function (info) {
		if(categorylistview) {
			var rmpersons = categorylistview.p_collection.select(function(person) {
				return person.get("id") == info.id_person;
			});
			if(rmpersons.length > 0)
			{
				rmpersons[0].destroy();
			}
			rmpersons = tourcategorylistview.p_collection.select(function(person) {
				return person.get("id") == info.id_person;
			});
			if(rmpersons.length > 0)
			{
				rmpersons[0].destroy();
			}
			rmpersons = portallistview.p_collection.select(function(person) {
				return person.get("id") == info.id_person;
			});
			if(rmpersons.length > 0)
			{
				rmpersons[0].destroy();
			}
	
			// delete person from data list
			var idx = getPersonIndex(info.id_person);
			delete data_persons.splice(idx, 1);
		}
	});
	socket.on('unavail_allperson', function (info) {
		data_persons = new Array();
		categorylistview.p_collection.removeAllModels();
		tourcategorylistview.p_collection.removeAllModels();
		portallistview.p_collection.removeAllModels();
	});
	socket.on('person_removeportal', function (info) {
		if(categorylistview) {
			var personindex = getPersonIndex(info.id_person);
			if( personindex < 0) {
				return;
			}
			if(typeof g_portals[data_persons[personindex].portal_status] != 'undefined'){
				if(g_portals[data_persons[personindex].portal_status].istour == 1) {
					var rmpersons = tourcategorylistview.p_collection.select(function(person) {
						return person.get("id") == info.id_person;
					});
					// delete person from list view
					if(rmpersons.length > 0)
					{
						rmpersons[0].destroy();
					}
				} else {
					var rmpersons = portallistview.p_collection.select(function(person) {
						return person.get("id") == info.id_person;
					});
					// delete person from list view
					if(rmpersons.length > 0) {
						rmpersons[0].destroy();
					}
				}	
			}
			
			if((g_categories[data_persons[personindex].category_status].assignedby != ''
				&& g_portals[data_persons[personindex].portal_status].istour == 1)
				|| g_portals[data_persons[personindex].portal_status].isonlist == 1)
			{
				// If the person is not manager and the person's portal is removed from tour, person is added to CategoryListView.
				// Otherwise like the sick( registered on list page) person is also need to be add to CategoryListView.
				var person = new ModelPerson();
				person.set({
						id:info.detail.id_person,
						firstname: info.detail.firstname,
						category: info.detail.category_status,
						portal: '',
						sortnum: info.detail.sortnum,
					});
				categorylistview.p_collection.add(person);
			}
			data_persons[personindex].portal_status = '';
			data_persons[personindex].managestatus = MANAGERNONE;
			data_persons[personindex].assignedtime = '';
			data_persons[personindex].managerid = '';
			if(g_categories[data_persons[personindex].category_status].assignedby == '') {
				// If removed person is manager, notify to all portals manager was left.
				var personslist = tourcategorylistview.p_collection.select(function(person) {
					return person.get("managerid") == info.id_person;
				});
				// delete person from list view
				for (var i = 0; i < personslist.length; i++) {
					var pinfo = getPerson(personslist[i].get("id"))
					if( typeof pinfo != 'undefined')
					{
						pinfo.managestatus = MANAGERLEFT;
						pinfo.assignedtime = info.assignedtime;
						personslist[i].set({
							id: pinfo.id_person,
							firstname: pinfo.firstname,
							category: pinfo.category_status,
							portal: pinfo.portal_status,
							assignedtime: Date.now(),
							managerid: pinfo.managerid,
							managestatus: MANAGERLEFT,
						});
					}
				}
				// If removed person is manager, notify to all portals manager was left.
				personslist = portallistview.p_collection.select(function(person) {
					return person.get("managerid") == info.id_person;
				});
				// delete person from list view
				for (var i = 0; i < personslist.length; i++) {
					var pinfo = getPerson(personslist[i].get("id"))
					if( typeof pinfo != 'undefined')
					{
						pinfo.managestatus = MANAGERLEFT;
						pinfo.assignedtime = info.assignedtime;
						personslist[i].set({
							id: pinfo.id_person,
							firstname: pinfo.firstname,
							category: pinfo.category_status,
							portal: pinfo.portal_status,
							assignedtime: Date.now(),
							managerid: pinfo.managerid,
							managestatus: MANAGERLEFT,
						});
					}
				}
			}
		}
	});
	socket.on('person_portalmove', function (info) {
		if(typeof g_portals[info.to].isonrotor != 'undefined' &&
			g_portals[info.to].isonrotor == 1)
		{
			var personindex = getPersonIndex(info.id_person);
			// If person already is in Tour and Portal List, delete from the list
			if(personindex >= 0)
			{
				// Delete Persons from previouse portallist(tour and portal).
				if(typeof g_portals[data_persons[personindex].portal_status] != 'undefined'){
					if(g_portals[data_persons[personindex].portal_status].istour == 1) {
						var rmpersons = tourcategorylistview.p_collection.select(function(person) {
							return person.get("id") == info.id_person;
						});
						// delete person from list view
						if(rmpersons.length > 0)
						{
							rmpersons[0].destroy();
						}
					} else {
						var rmpersons = portallistview.p_collection.select(function(person) {
							return person.get("id") == info.id_person;
						});
						// delete person from list view
						if(rmpersons.length > 0)
						{
							rmpersons[0].destroy();
						}
					}
				}
				// Delete Persons from categoryviewlist
				if(typeof g_categories[data_persons[personindex].category_status] != undefined
					&& g_categories[data_persons[personindex].category_status].assignedby != '' 
					&& g_portals[info.to].istour == 1) {
					var rmpersons = categorylistview.p_collection.select(function(person) {
						return person.get("id") == info.id_person;
					});
					// delete person from list view
					if(rmpersons.length > 0)
					{
						rmpersons[0].destroy();
					}
				}
				data_persons[personindex].portal_status = info.to;
				data_persons[personindex].id_reports = info.detail.id_reports;
				data_persons[personindex].sortnum = info.detail.sortnum;
				if(typeof info.scheduledtime != 'undefined') {
					data_persons[personindex].scheduledtime = info.scheduledtime;
				}
				personinfo = data_persons[personindex];
			} else {
				data_persons.push(info.detail);
				personinfo = info.detail;
			}
			// Add person to the new Tour or Portal List
			if(g_portals[personinfo.portal_status].istour == 1) {
				var person = new ModelPerson();
				person.set({
						id:info.detail.id_person,
						firstname: info.detail.firstname,
						category: info.detail.category_status,
						portal:info.detail.portal_status,
						assignedtime: Date.now(),
						managerid: info.detail.managerid,
						managestatus: info.detail.managestatus,
					});
				tourcategorylistview.p_collection.add(person);
			} else {
				var person = new ModelPerson();
				person.set({
						id:info.detail.id_person,
						firstname: info.detail.firstname,
						category: info.detail.category_status,
						portal:info.detail.portal_status,
						assignedtime: Date.now(),
						managerid: info.detail.managerid,
						managestatus: info.detail.managestatus,
						scheduledtime: info.scheduledtime,
					});
				portallistview.p_collection.add(person);
			}
			//
			if(g_categories[personinfo.category_status].assignedby == '' && g_portals[info.to].istour == 0) {
				// If removed person is manager, notify to all portals manager was left.
				var personslist = tourcategorylistview.p_collection.select(function(person) {
					return person.get("managerid") == personinfo.id_person;
				});
				// delete person from list view
				for (var i = 0; i < personslist.length; i++) {
					var pinfo = getPerson(personslist[i].get("id"))
					if( typeof pinfo != 'undefined')
					{
						pinfo.managestatus = MANAGERLEFT;
						pinfo.assignedtime = info.assignedtime;
						personslist[i].set({
							id: pinfo.id_person,
							firstname: pinfo.firstname,
							category: pinfo.category_status,
							portal: pinfo.portal_status,
							assignedtime: Date.now(),
							managerid: pinfo.managerid,
							managestatus: MANAGERLEFT,
						});
					}
				}
				// If removed person is manager, notify to all portals manager was left.
				personslist = portallistview.p_collection.select(function(person) {
					return person.get("managerid") == personinfo.id_person;
				});
				// delete person from list view
				for (var i = 0; i < personslist.length; i++) {
					var pinfo = getPerson(personslist[i].get("id"))
					if( typeof pinfo != 'undefined')
					{
						pinfo.managestatus = MANAGERLEFT;
						pinfo.assignedtime = info.assignedtime;
						personslist[i].set({
							id: pinfo.id_person,
							firstname: pinfo.firstname,
							category: pinfo.category_status,
							portal: pinfo.portal_status,
							assignedtime: Date.now(),
							managerid: pinfo.managerid,
							managestatus: MANAGERLEFT,
							scheduledtime: pinfo.scheduledtime,
						});
					}
				}
			}
		}
	});
	socket.on('person_assignmanager', function (info) {
		var personindex = getPersonIndex(info.id_person);
		if( personindex < 0) {
			return;
		}
		
		data_persons[personindex].managerid = info.managerid;
		data_persons[personindex].managername = info.managername;
		data_persons[personindex].assignedtime = info.assignedtime;
		data_persons[personindex].managestatus = MANAGERASSIGNED;
		
		var rmpersons = null;
		if(g_portals[data_persons[personindex].portal_status].istour == 1) {
			rmpersons = tourcategorylistview.p_collection.select(function(person) {
				return person.get("id") == info.id_person;
			});
		} else {
			rmpersons = portallistview.p_collection.select(function(person) {
				return person.get("id") == info.id_person;
			});
		}
		if ( rmpersons != null ) {
			rmpersons[0].set({
				id: data_persons[personindex].id_person,
				firstname: data_persons[personindex].firstname,
				category: data_persons[personindex].category_status,
				portal: data_persons[personindex].portal_status,
				assignedtime: Date.now(),
				managerid: data_persons[personindex].managerid,
				managestatus: MANAGERASSIGNED,
			});
		}
	});
	socket.on('switchsortnum_rotor', function(info){
		var personinfo = getPerson(info.id_person);
		var rmpersons = categorylistview.p_collection.select(function(person) {
			return person.get("id") == info.id_person;
		});
		// delete person from list view
		if(rmpersons.length > 0)
		{
			rmpersons[0].destroy();
			categorylistview.p_collection.remove(rmpersons[0]);
			
		} else {
			return;
		}
		categorylistview.insertAfter(info.id_dstperson, personinfo);
	});
})(jQuery);

