
(function($){
	var data_categories = new Array();
	var data_persons = null;
	var data_unavailpersons = null;
	var categorylistview = null;
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
		,
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
	getUnavailPersonIndex = function(arg) {
		result = -1;
		for(i = 0; i < data_unavailpersons.length; i++) {
			if (data_unavailpersons[i].id_person == arg)
			{
				result = i;
				break;
			}
		}
		return result;
	}
	getUnavailPerson = function(arg) {
		return data_unavailpersons[getUnavailPersonIndex(arg)];
	}
	//----------------------------------------------------------------------
	
	var UnavailPersonView = Backbone.View.extend({
		tagName: 'li', // name of tag to be created   
		events: { 
			'click button.movebutton':  'move',
			'click button.deletebutton':  'deleteperson',
			'click button.availbutton':	'availperson',
			'click button.portalmovebutton':  'portalmove',
		},
		initialize: function() {
			_.bindAll(this, 'render', 'unrender', 'move', 'remove', 'deleteperson', 'availperson', 'portalmove');

      		this.model.bind('change', this.render);
      		this.model.bind('remove', this.unrender);
		},
		render: function() {
			var htmlContents = '';
			var linkedCategories;
			var linkedPortals;
			var i, j;
			
			htmlContents = '<span><a href="#">'+this.model.get('firstname')+'</a></span><div class="btn-group pull-right">';
			linkedCategories = g_categories[this.model.get('category')].catlinks;
			if(linkedCategories) {
				for( j = 0; j < linkedCategories.length; j++) {
					if(g_categories[linkedCategories[j]]) {
						htmlContents += '<button id="btn_'+linkedCategories[j]+'" class=\'movebutton btn-mini '+g_categories[linkedCategories[j]].linkbtclass+'\' >'+g_categories[linkedCategories[j]].linkbtname+'</button>';
					}
				}
			}
			linkedPortals = g_categories[this.model.get('category')].portallinks;
			if(linkedCategories) {
				for( j = 0; j < linkedPortals.length; j++) {
					if(g_portals[linkedPortals[j]]) {
						if (g_portals[linkedPortals[j]].isonlist == 1)
						{
							htmlContents += '<button id="btn_'+linkedPortals[j]+'" class=\'portalmovebutton btn-mini '+g_portals[linkedPortals[j]].btclass+'\' >'+g_portals[linkedPortals[j]].btname+'</button>';
						}
					}
				}
			}
			htmlContents += '<button class=\'availbutton btn-mini available\'>Available</button>';
			htmlContents += '<button class=\'deletebutton btn-mini remove\'>Del</button>';
			htmlContents += '</div>'
			$(this.el).html(htmlContents);
			return this;
		},
		move: function(evt){
			var e = window.event || evt;
    		var who= e.target || e.srcElement;
			var eventbuttonid = who.id;
			if(eventbuttonid.length <= 0){
				return;
			}
			eventbuttonid = eventbuttonid.substring(4);
			
			//******************************
			socket.emit('person_categorymove',{ id_person: this.model.get('id'), firstname: this.model.get('firstname'), to: eventbuttonid});
			//*******************************

		},
		deleteperson : function ()
		{
			idx = getUnavailPersonIndex(this.model.get('id'));
			if(idx >= 0){
				//************************************************************
				socket.emit('delete_person', {id_person:this.model.get('id')});
				//************************************************************
			} else {
				socket.emit('require_data', '');
			}
		},
		availperson: function()
		{
			idx = getUnavailPersonIndex(this.model.get('id'));
			if(idx >= 0){
				//************************************************************
				socket.emit('person_avail', {id_person:this.model.get('id'), detail:data_unavailpersons[idx]});
				//************************************************************
			} else {
				socket.emit('list_require_data', '');
			}
		},
		portalmove: function()
		{
			var e = window.event || evt;
    		var who= e.target || e.srcElement;
			var eventbuttonid = who.id;
			if(eventbuttonid.length <= 0){
				return;
			}
			eventbuttonid = eventbuttonid.substring(4);
			
			idx = getUnavailPersonIndex(this.model.get('id'));
			if(idx >= 0){
				//************************************************************
				socket.emit('person_portalmove',{ id_person: this.model.get('id'), detail: data_unavailpersons[idx], to: eventbuttonid, istour: 1});
				//************************************************************
			} else {
				socket.emit('require_data', '');
			}
		},
		unrender: function(){
			$(this.el).remove();
		},
		remove: function(){
			this.model.destroy();
		}
	});
	
	var UnavailCategoryView = Backbone.View.extend({
		tagName: 'li',
		events: { 
		      'click button.createbutton':  'createnew',
		},
		initialize: function(){
			_.bindAll(this, 'render', 'unrender', 'remove', 'createnew');
			this.model.bind('remove', this.unrender);
		},
		render: function(){
			$(this.el).html('<h2 class="nav-header">'+this.model.get('label')+'</h2><ol id=\'uaol_'+this.model.get('name')+'\'></ol>' + 
				'<input type=\'text\' id=\'txt_create_'+this.model.get('name')+'\' /><button class=\'createbutton create\'>Add New</button>');
			return this;
		},
		unrender: function(){
			$(this.el).remove();
		},
		remove: function(){
			this.model.destroy();
		},
		createnew: function() {
			var createName = $('#txt_create_'+this.model.get('name')).val();
			$('#txt_create_'+this.model.get('name')).focus();
			/*if(getUnavailPersonIndex(createName) >= 0) {
				alert('You inputed name is duplicated.');
				return;
			}
			if(getPersonIndex(createName) >= 0) {
				alert('You inputed name is duplicated.');
				return;
			}*/
			$('#txt_create_'+this.model.get('name')).val('');

			//******************************
			socket.emit('create_person',{ firstname: createName, category_status: this.model.get('name')});
			//*******************************
		}
	});
	var UnavailCategoryListView = Backbone.View.extend({
		el: $('#unavaillist'),
		initialize: function(){
			_.bindAll(this, 'render', 'appendCategory', 'appendPerson');
			
			this.c_collection = new CategoryList();
			//this.c_collection.bind('add', this.appendCategory);
			this.p_collection = new PersonList();
			this.p_collection.bind('add', this.appendPerson);
			this.render();
		},
		render: function(){
			$(this.el).append('<ul class="portal4 rosterlist nav nav-list well sidebar-nav left"></ul>');
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

			for(i = 0; i < data_unavailpersons.length; i++) {
				var person = new ModelPerson();
				person.set({
					id:data_unavailpersons[i].id_person,
					firstname: data_unavailpersons[i].firstname,
					category: data_unavailpersons[i].category_status
				});
				this.p_collection.add(person);
			}
		},
		appendCategory: function( item ) {
			var catetory = new UnavailCategoryView({
				model: item
			});
			catetory.parentView = this;
			$('ul', this.el).append(catetory.render().el);
			
		},
		appendPerson: function(item) {
			var person = new UnavailPersonView({
				model: item,
			});
			person.parentView = this;
			$('#uaol_'+item.get('category')).append(person.render().el);
		},
		removeview: function(){
			$('ul', this.el).remove();
		},
	});
	//----------------------------------------------------------------------
	var PersonView = Backbone.View.extend({
		tagName: 'li', // name of tag to be created   
		events: { 
		      'click button.movebutton':  'move',
		      'click button.unavailbutton':  'unavailperson',
		},
		initialize: function(){
			_.bindAll(this, 'render', 'unrender', 'move', 'remove','unavailperson');

      		this.model.bind('change', this.render);
      		this.model.bind('remove', this.unrender);
		},
		render: function(){
			var htmlContents = '';
			var linkedCategories;
			var i, j;
			
			htmlContents = '<span style="color:black;">'+this.model.get('firstname')+'</span><div class="btn-group pull-right">';
			/*linkedCategories = g_categories[this.model.get('category')].catlinks;
			if(linkedCategories) {
				for( j = 0; j < linkedCategories.length; j++) {
					if(g_categories[linkedCategories[j]]) {
						htmlContents += '<button id="btn_'+linkedCategories[j]+'" class=\'movebutton\' >'+g_categories[linkedCategories[j]].linkbtname+'</button>';
					}
				}
			}*/
			htmlContents += '<button class=\'unavailbutton btn-mini unavailable\'>Unavailable</button></div>';
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
			} else {
				socket.emit('roster_require_data', '');
			}
		},
		move: function(evt){
			var e = window.event || evt;
    		var who= e.target || e.srcElement;
			var eventbuttonid = who.id;
			if(eventbuttonid.length <= 0){
				return;
			}
			eventbuttonid = eventbuttonid.substring(4);
			
			//******************************
			socket.emit('person_categorymove_a',{ id_person: this.model.get('id'), firstname: this.model.get('firstname'), to: eventbuttonid});
			//*******************************
			var personinfo = getPerson(this.model.get('id'));
			if( typeof personinfo != 'undefined') {
				personinfo.category_status = eventbuttonid;
			}
			
			var person = new ModelPerson();
			person.set({
				id: this.model.get('id'),
				firstname: this.model.get('firstname'),
				category: eventbuttonid
			});
			this.parentView.p_collection.add(person);
			this.remove();
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
			$(this.el).attr('class', g_categories[this.model.get('name')].rosterpageclass);
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
	var CategoryListView = Backbone.View.extend({
		el: $('#list'),
		initialize: function(){
			var self = this;

			_.bindAll(this, 'render', 'appendCategory', 'appendPerson');
			
			this.c_collection = new CategoryList();
			//this.c_collection.bind('add', this.appendCategory);
			
			this.p_collection = new PersonList();
			this.p_collection.bind('add', this.appendPerson);
			this.render();
		},
		render: function(){
			$(this.el).append("<ul></ul>");
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
			this.c_collection.each(function(model){
				$('#ol_'+model.get("name")).sortable({
					start: function(event, ui) {
						startPosition = ui.item.index();
					},
					stop: function(event, ui) {
						endPosition = ui.item.index();
						targetID = ui.item.attr('id').substring(4);
						prevpersonid = $(ui.item).prev().attr('id');
						if (typeof prevpersonid == 'undefined') {
							prevpersonid = '';
						} else {
							prevpersonid = prevpersonid.substring(4);
						}
						if(startPosition != endPosition) {
							socket.emit('switchsortnum',{id_person: targetID, id_dstperson: prevpersonid, detail: getPerson(targetID)});
						}
					},
					change: function(event, ui) {
					},
					connectWith: ".sortable"
				});
				$('#ol_'+model.get("name")).disableSelection();
			});
			for(i = 0; i < data_persons.length; i++) {
				if(typeof g_portals[data_persons[i].portal_status] == 'undefined' ||
					g_portals[data_persons[i].portal_status].isonlist != 1)
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
	//-----------------------------------------------------------------------	
	var PortalPersonView = Backbone.View.extend({
		tagName: 'li', // name of tag to be created   
		events: { 
		      'click button.unavail':  'unavail',
		},
		initialize: function(){
			_.bindAll(this, 'render', 'unrender', 'unavail');

      		this.model.bind('change', this.render);
      		this.model.bind('remove', this.unrender);
		},
		render: function(){
			var htmlContents = '';
			var linkedCategories;
			var i, j;
			
			htmlContents = '<span style="color:black;">'+this.model.get('firstname')+'</span><div class="btn-group pull-right">';
			htmlContents += '<button class=\'unavail btn-mini unavailable\'>Unavailable</button></div>';
			$(this.el).html(htmlContents);
			return this;
		},
		unavail:function()
		{
			idx = getPersonIndex(this.model.get('id'));
			if(idx >= 0){
				//************************************************************
				socket.emit('person_unavail', {id_person:this.model.get('id'), detail: data_persons[idx]});
				//************************************************************
			} else {
				socket.emit('roster_require_data', '');
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
			$(this.el).attr('class', g_portals[this.model.get('name')].rosterpageclass);
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
		el: $('#portal'),
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
				if(g_portals[id].isonlist == 1)
				{
					var pot = new ModelPortal();
					pot.set({
						name: id,
						label: g_portals[id].label,
						order: g_portals[id].order,
					});
					this.c_collection.add(pot);
				}
			}
			this.c_collection.each(this.appendPortal);
			
			
			for(i = 0; i < data_persons.length; i++) {
				if(typeof g_portals[data_persons[i].portal_status] != 'undefined' &&
					g_portals[data_persons[i].portal_status].isonlist == 1)
				{
					var person = new ModelPerson();
					person.set({
						id: data_persons[i].id_person,
						firstname: data_persons[i].firstname,
						category: data_persons[i].category_status,
						portal: data_persons[i].portal_status
					});
					this.p_collection.add(person);
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
		socket.emit('roster_require_data', '');
		$('#btn_unavailall').click(function(){
			socket.emit('unavail_allperson',{ });
			
		});
	});
	socket.on('response_data', function (data) {
		data_persons = data.person;
		data_unavailpersons = data.unavailpersons;
		if(categorylistview) {
			categorylistview.removeview();
			unavailcategorylistview.removeview();
		} else {
			$('#loaddiv').remove();
			$('#actiondiv').show();
		}
		unavailcategorylistview = new UnavailCategoryListView();
		categorylistview = new CategoryListView();
		portallistview = new PortalListView();
	});
	socket.on('create_person', function (info){
		if(unavailcategorylistview) {
			data_unavailpersons.push(info);
			var person = new ModelPerson();
			person.set({
					id:info.id_person,
					firstname: info.firstname,
					category: info.category_status
				});
			unavailcategorylistview.p_collection.add(person);
		}
	});
	socket.on('delete_person', function (info){
		if(unavailcategorylistview) {
			var rmpersons = unavailcategorylistview.p_collection.select(function(person) {
				return person.get("id") == info.id_person;
			});
			// delete person from list view
			if(rmpersons.length > 0)
			{
				rmpersons[0].destroy();
			}
			// delete person from data list
			var idx = getUnavailPersonIndex(info.id_person);
			data_persons.splice(idx, 1);
		}
	});
	socket.on('person_avail', function (info) {
		if(unavailcategorylistview) {
			var rmpersons = unavailcategorylistview.p_collection.select(function(person) {
				return person.get("id") == info.id_person;
			});
			// delete person from list view
			if(rmpersons.length > 0)
			{
				rmpersons[0].destroy();
			}
			// delete person from data list
			var idx = getUnavailPersonIndex(info.id_person);
			delete data_unavailpersons.splice(idx, 1);
		}
		if(categorylistview) {
			data_persons.push(info.detail);
			var person = new ModelPerson();
			person.set({
					id:info.id_person,
					firstname: info.detail.firstname,
					category: info.detail.category_status
				});
			categorylistview.p_collection.add(person);
		}
	});
	socket.on('person_unavail', function (info) {
		if(categorylistview) {
			var rmpersons = categorylistview.p_collection.select(function(person) {
				return person.get("id") == info.id_person;
			});
			// delete person from list view
			if(rmpersons.length > 0)
			{
				rmpersons[0].destroy();
			}
			rmpersons = portallistview.p_collection.select(function(person) {
				return person.get("id") == info.id_person;
			});
			// delete person from list view
			if(rmpersons.length > 0)
			{
				rmpersons[0].destroy();
			}
			// delete person from data list
			var idx = getPersonIndex(info.id_person);
			delete data_persons.splice(idx, 1);
		}
		if(unavailcategorylistview) {
			data_unavailpersons.push(info.detail);
			var person = new ModelPerson();
			person.set({
					id:info.id_person,
					firstname: info.detail.firstname,
					category: info.detail.category_status,
				});
			unavailcategorylistview.p_collection.add(person);
		}
	});
	socket.on('unavail_allperson', function (info) {
		data_unavailpersons = info.unavailpersons;
		data_persons = new Array();
		unavailcategorylistview.p_collection.removeAllModels();
		categorylistview.p_collection.removeAllModels();
		portallistview.p_collection.removeAllModels();

		for(i = 0; i < data_unavailpersons.length; i++) {
			var person = new ModelPerson();
			person.set({
				id: data_unavailpersons[i].id_person,
				firstname: data_unavailpersons[i].firstname,
				category: data_unavailpersons[i].category_status,
				portal: data_unavailpersons[i].portal_status
			});
			unavailcategorylistview.p_collection.add(person);
		}
	});
	socket.on('person_categorymove', function (info) {
		if(unavailcategorylistview) {
			//var person = categorylistview.p_collection.where({firstname: info.target});
			var rmpersons = unavailcategorylistview.p_collection.select(function(person) {
				return person.get("id") == info.id_person;
			});
			if(rmpersons.length > 0)
			{
				rmpersons[0].destroy();
			}
			// modify data_persons value
			var personinfo = getUnavailPerson(info.id_person);
			if( typeof personinfo != 'undefined') {
				personinfo.category_status = info.to;
			}
			// create person view
			var person = new ModelPerson();
			person.set({
				id: info.id_person,
				firstname: info.firstname,
				category: info.to
			});
			unavailcategorylistview.p_collection.add(person);
		}
	});
	socket.on('person_categorymove_a', function (info) {
		if(categorylistview) {
			//var person = categorylistview.p_collection.where({firstname: info.target});
			// remove person view need to move
			var rmpersons = categorylistview.p_collection.select(function(person) {
				return person.get("id") == info.id_person;
			});
			if(rmpersons.length > 0)
			{
				rmpersons[0].destroy();
			}
			// modify data_persons value
			var personindex = getPersonIndex(info.id_person);
			if( personindex > 0 ) {
				data_persons[personindex].category_status = info.to;
			}
			// create person view
			var person = new ModelPerson();
			person.set({
				id: info.id_person,
				firstname: info.firstname,
				category: info.to
			});
			categorylistview.p_collection.add(person);
		}
	});
	socket.on('person_portalmove', function (info) {
		if(unavailcategorylistview) {
			var rmpersons = unavailcategorylistview.p_collection.select(function(person) {
				return person.get("id") == info.id_person;
			});
			// delete person from list view
			if(rmpersons.length > 0)
			{
				rmpersons[0].destroy();
			}
			// delete person from data list
			var idx = getUnavailPersonIndex(info.id_person);
			if(idx >= 0) {
				delete data_unavailpersons.splice(idx, 1);
			}
		}
		if(typeof g_portals[info.to].isonlist != 'undefined' &&
			g_portals[info.to].isonlist == 1
		){
			var idx = getPersonIndex(info.id_person);
			if (idx < 0) {
				data_persons.push(info.detail);
			}
			var person = new ModelPerson();
			person.set({
					id:info.detail.id_person,
					firstname: info.detail.firstname,
					category: info.detail.category_status,
					portal:info.detail.portal_status,
				});
			portallistview.p_collection.add(person);
		}
	});
	socket.on('person_removeportal', function (info) {
		if(categorylistview){
			var rmpersons = portallistview.p_collection.select(function(person) {
				return person.get("id") == info.id_person;
			});
			// delete person from list view
			if(rmpersons.length > 0)
			{
				rmpersons[0].destroy();
				
				var personindex = getPersonIndex(info.id_person);
				if(personindex < 0) {
					data_persons.push(info.detail);
				} else {
					data_persons[personindex].portal_status = '';
				}
				var person = new ModelPerson();
				person.set({
						id:info.detail.id_person,
						firstname: info.detail.firstname,
						category: info.detail.category_status,
						portal:info.detail.portal_status,
						sortnum: info.detail.sortnum,
					});
				categorylistview.p_collection.add(person);
			}
		}
	});
	socket.on('switchsortnum', function(info){
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
	// If the person is removed from portal then person goes to the last
	socket.on( 'movetolast', function(info){
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
		var person = new ModelPerson();
		person.set({
			id: personinfo.id_person,
			firstname: personinfo.firstname,
			category: personinfo.category_status
		});
		categorylistview.p_collection.add(person);
	});
})(jQuery);

