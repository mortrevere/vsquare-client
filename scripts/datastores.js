//Datastore app : list datastores and display their name, usage and state

//Main component for datastores
//No interaction is needed so we just render the template
Vue.component('datastores', {
	template : '#datastores-template',
	props : {
		model : Object
	},
	computed : function() {

	}
});

apps.datastores = {
	el : '#current-app',
	data : {
		treeData : {
			displayName : 'Datastores',
			root : true,
			children : []
		}
	},
	methods : {
		recompute : function() {
			if (app.currentAppId !== 'datastores')
				return;

			var self = this;
			ajax.call('GET', '/datastores', function(data) {
				console.log(self.treeData);
				self.treeData.children = data.map(function(datastore) {
					datastore.displayName = datastore.name;

					datastore.usage = Math.round(10000 * (datastore.capacity - datastore.free_space) / datastore.capacity) / 100;
					//percentage used to 2 decimal places

					//define colors in terms of thresholds (70 : WARNING, 90 : ERROR)
					datastore.stateColor = misc.html.color.OK;
					datastore.stateColor = datastore.usage > 70 ? misc.html.color.WARNING : datastore.stateColor;
					datastore.stateColor = datastore.usage > 90 ? misc.html.color.ERROR : datastore.stateColor;

					//css class to display usage as a progress bar (via linear-gradient)
					datastore.progressBar = {
						background : 'linear-gradient(90deg,' + datastore.stateColor + ' ' + datastore.usage + '%, #FFF ' + datastore.usage + '%)'
					};

					//metrics in a human readable manner (MiB, GiB, PiB ...)
					datastore.used = misc.humanize.filesize(datastore.capacity - datastore.free_space);
					datastore.capacity = misc.humanize.filesize(datastore.capacity);
					datastore.free_space = misc.humanize.filesize(datastore.free_space);

					return datastore;
				});

				setTimeout(self.recompute, 10000);
			});

		}
	},
	created : function() {
		var self = this;

		self.recompute();

		//navigation menu on the left, app content in the middle and no action on the right
		$('#left-panel').append('<div id="tree"><ul><item class="item" :model="treeData"></item></ul></div>');
		$('#middle-panel').append('<datastores :model="treeData.children"></datastores>');
	}
};
