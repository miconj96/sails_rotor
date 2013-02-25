
(function($){
	var data_persons = null;
	var categorylistview = null;
	
    var socket = io.connect(SERVER_URL);
    
	Backbone.sync = function(method, model, success, error){ 
		success();
	}
	var Category = Backbone.Model.extend({
		defaults: {
			name: '',
			label: '',
		}
	});
	var Person = Backbone.Model.extend({
		defaults: {
			id: '',
			firstname: '',
			category: '',
		}
	});
	
	var PersonList = Backbone.Collection.extend({
		model: Person
	});	
	
	var CategoryList = Backbone.Collection.extend({
		model: Category,
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
			
			htmlContents = '<span style="color:black;">'+this.model.get('firstname')+'</span>';
			linkedCategories = g_categories[this.model.get('category')].catlinks;
			if(linkedCategories) {
				for( j = 0; j < linkedCategories.length; j++) {
					if(g_categories[linkedCategories[j]]) {
						htmlContents += '<button id="btn_'+linkedCategories[j]+'" class=\'movebutton\' >'+g_categories[linkedCategories[j]].linkbtname+'</button>';
					}
				}
			}
			htmlContents += '<button class=\'deletebutton\'>Delete</button>';
			htmlContents += '<button class=\'availbutton\'>Avail</button>';
			
			linkedPortals = g_categories[this.model.get('category')].portallinks;
			if(linkedCategories) {
				for( j = 0; j < linkedPortals.length; j++) {
					if(g_portals[linkedPortals[j]]) {
						if (g_portals[linkedPortals[j]].isonlist == 1)
						{
							htmlContents += '<button id="btn_'+linkedPortals[j]+'" class=\'portalmovebutton\' >'+g_portals[linkedPortals[j]].btname+'</button>';
						}
					}
				}
			}
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
			//var personinfo = getPerson(this.model.get('id'));
			//if( typeof personinfo != 'undefined') {
			//	personinfo.category_status = eventbuttonid;
			//}
			//var person = new Person();
			//person.set({
			//	id: this.model.get('id'),
			//	firstname: this.model.get('firstname'),
			//	category: eventbuttonid
			//});
			//this.parentView.p_collection.add(person);
			//this.remove();
		},
		deleteperson : function ()
		{
			idx = getPersonIndex(this.model.get('id'));
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
			idx = getPersonIndex(this.model.get('id'));
			if(idx >= 0){
				//************************************************************
				socket.emit('person_avail', {id_person:this.model.get('id'), detail:data_persons[idx]});
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
			
			idx = getPersonIndex(this.model.get('id'));
			if(idx >= 0){
				//************************************************************
				socket.emit('person_portalmove',{ id_person: this.model.get('id'), detail: data_persons[idx], to: eventbuttonid, istour: 1});
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
	
	var CategoryView = Backbone.View.extend({
		tagName: 'li',
		events: { 
		      'click button.createbutton':  'createnew',
		},
		initialize: function(){
			_.bindAll(this, 'render', 'unrender', 'remove', 'createnew');
			this.model.bind('remove', this.unrender);
		},
		render: function(){
			$(this.el).html('<h2>'+this.model.get('label')+'</h2><ol id=\'ol_'+this.model.get('name')+'\'></ol>' + 
				'<input type=\'text\' id=\'txt_create_'+this.model.get('name')+'\' /><button class=\'createbutton\'>Add New</button>');
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
			if(getPersonIndex(createName) >= 0) {
				alert('You inputed name is duplicated.');
				return;
			}
			$('#txt_create_'+this.model.get('name')).val('');

			//******************************
			socket.emit('create_person',{ firstname: createName, category_status: this.model.get('name')});
			//*******************************
		}
	});
	var CategoryListView = Backbone.View.extend({
		el: $('#list'),
		initialize: function(){
			_.bindAll(this, 'render', 'appendCategory', 'appendPerson');
			
			this.c_collection = new CategoryList();
			this.c_collection.bind('add', this.appendCategory);
			
			this.p_collection = new PersonList();
			this.p_collection.bind('add', this.appendPerson);
			this.render();
		},
		render: function(){
			$(this.el).append("<ul></ul>");
			for(var id in g_categories) {
				var cat = new Category();
				cat.set({
					name: id,
					label: g_categories[id].label
				});
				this.c_collection.add(cat);
			}
			for(i = 0; i < data_persons.length; i++) {
				var person = new Person();
				person.set({
					id:data_persons[i].id_person,
					firstname: data_persons[i].firstname,
					category: data_persons[i].category_status
				});
				this.p_collection.add(person);
			}
		},
		appendCategory: function( item ) {
			var catetory = new CategoryView({
				model: item
			});
			catetory.parentView = this;
			$('ul', this.el).append(catetory.render().el);
			
		},
		appendPerson: function(item) {
			var person = new PersonView({
				model: item,
			});
			person.parentView = this;
			$('#ol_'+item.get('category')).append(person.render().el);
		},removeview: function(){
			$('ul', this.el).remove();
		},
	});

	$(document).ready(function(){
		socket.emit('list_require_data', '');
		$('unavailall').click(function(){
			socket.emit('unavail_allperson',{ });
		});
	});
	socket.on('response_data', function (data) {
		data_persons = data.person;
		if(categorylistview) {
			categorylistview.removeview();
		} else {
			$('#loaddiv').remove();
			$('#actiondiv').show();
		}
		categorylistview = new CategoryListView();
	});

	socket.on('create_person', function (info){
		if(categorylistview) {
			data_persons.push(info);
			var person = new Person();
			person.set({
					id:info.id_person,
					firstname: info.firstname,
					category: info.category_status
				});
			categorylistview.p_collection.add(person);
		}
	});
	socket.on('delete_person', function (info){
		if(categorylistview) {
			var rmpersons = categorylistview.p_collection.select(function(person) {
				return person.get("id") == info.id_person;
			});
			// delete person from list view
			if(rmpersons.length > 0)
			{
				rmpersons[0].destroy();
			}
			// delete person from data list
			var idx = getPersonIndex(info.id_person);
			data_persons.splice(idx, 1);
		}
	});
	socket.on('person_avail', function (info) {
		if(categorylistview) {
			var rmpersons = categorylistview.p_collection.select(function(person) {
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
	});
	socket.on('person_unavail', function (info) {
		if(categorylistview) {
			data_persons.push(info.detail);
			var person = new Person();
			person.set({
					id:info.id_person,
					firstname: info.detail.firstname,
					category: info.detail.category_status,
				});
			categorylistview.p_collection.add(person);
		}
	});
	socket.on('person_categorymove', function (info) {
		if(categorylistview) {
			//var person = categorylistview.p_collection.where({firstname: info.target});
			var rmpersons = categorylistview.p_collection.select(function(person) {
				return person.get("id") == info.id_person;
			});
			if(rmpersons.length > 0)
			{
				rmpersons[0].destroy();
			}
			// modify data_persons value
			var personinfo = getPerson(info.id_person);
			if( typeof personinfo != 'undefined') {
				personinfo.category_status = info.to;
			}
			// create person view
			var person = new Person();
			person.set({
				id: info.id_person,
				firstname: info.firstname,
				category: info.to
			});
			categorylistview.p_collection.add(person);
		}
	});
	socket.on('person_portalmove', function (info) {
		if(categorylistview) {
			var rmpersons = categorylistview.p_collection.select(function(person) {
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
	});
})(jQuery);

