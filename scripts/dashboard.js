//Nearly empty Vue.js app just to present the main dashboard to the user
//Acts exactly like the main nav menu defined in ui.js and index.html

Vue.component('dashboard', {
	template : '#dashboard-template',
	props : {
		
	},
	data : function() {
		return {
			
		};
	},
	computed : {
		
	},
	methods : {
		loadApp : function(event) {
			app.loadApp(event);
		}
	}
});

apps.dashboard = {
	el : '#current-app',
	data : {
		
	},
	methods : {
		
	},
	created : function() {
		$('#middle-panel').append('<dashboard></dashboard>');
		
	}
};
