//Simple app, much like the datastores app

Vue.component('hypervisors', {
	template : '#hypervisors-template',
	props : {
		model : Object
	},
	computed : function() {

	}
});

apps.hypervisors = {
	el : '#current-app',
	data : {
		treeData : {
			displayName : 'Hyperviseurs',
			root : true,
			children : []
		}
	},
	methods : {
		recompute : function() {
			if (app.currentAppId !== 'hypervisors')
				return;

			var self = this;
			ajax.call('GET', '/hosts', function(data) {
				self.treeData.children = data.map(function(host) {
					host.displayName = host.host + ' (' + host.name + ')';
					host.displayConnection = misc.humanize.humanCoState[host.connection_state];
					host.displayPower = host.power_state ? misc.humanize.humanPowerState[host.power_state] : 'N/A';
					return host;
				});
				setTimeout(self.recompute, 10000);
			});
		}
	},
	created : function() {
		var self = this;

		self.recompute();

		$('#left-panel').append('<div id="tree"><ul><item class="item" :model="treeData"></item></ul></div>');
		$('#middle-panel').append('<hypervisors :model="treeData.children"></hypervisors>');
	}
};
