Vue.component('networkactions', {
	template : '#network-actions-template',
	props : {
		network : null
	},
	data : function() {
		return {
			mapShow : {
				createNetwork : false,
				deleteNetwork : false,
				editNetwork : false
			},
			newNetwork : {
				name : '',
				port_num : 16
			}
		};
	},
	computed : {
		networkSelected : function() {
			return this.network !== null;
		}
	},
	methods : {
		createNetwork : function(event) {
			var self = this;
			ajax.call('PUT', '/networks', self.newNetwork, function(data) {
				console.log(data);
				app.currentApp.recompute(function() {
					app.notify('Réseau créé avec succès', 'success');
				});
			}, function(error) {
				app.notify('Impossible de créer le réseau : ' + error.responseJSON.value.error, 'error', app.getNotifyAnchor(event), 'left');
			});
		},
		deleteNetwork : function(event) {
			var self = this;
			ajax.call('DELETE', '/network/' + self.network.id, function(data) {
				console.log(data);
				app.currentApp.recompute(function() {
					app.notify('Réseau supprimé', 'success');
				});
			}, function(error) {
				app.notify('Impossible de supprimer le réseau : ' + error.responseJSON.value.error, 'error', app.getNotifyAnchor(event), 'left');
			});
		},
		editNetwork : function(event) {
			var self = this;
			ajax.call('POST', '/network/' + self.network.id, self.network, function(data) {
				console.log(data);
				app.currentApp.recompute(function() {
					app.notify('Réseau modifié avec succès', 'success');
				});

			}, function(error) {
				app.notify('Impossible de modifier le réseau : ' + error.responseJSON.value.error, 'error', app.getNotifyAnchor(event), 'left');
			});
		},
		incrementField : function(event) {
			//generic function that magically powers the whole incrementable objects in templates
			//it allows the developer to easily create incrementable numeric fields
			var target = event.target.attributes.target.value.split('.');
			var step = parseFloat(event.target.attributes.step.value);

			var lastKey = target.pop();
			var ptr = target.reduce(function(prev, next) {
				return prev[next];
			}, this);

			if (ptr[lastKey] + step >= 0)
				ptr[lastKey] += step;
		},
		shown : function(name) {
			//computed property to use in the template along with v-if/v-else
			return this.mapShow[name];
		},
		resetActions : function() {
			//reset all mapShow flags to reset the right panel UI
			var self = this;
			Object.keys(self.mapShow).forEach(function(key) {
				if (key !== 'more')
					self.mapShow[key] = false;
			});
			//clean selected values so they don't stay selected afterwards

		},
		showAction : function(name) {
			var self = this;

			var subActions = {

			};

			Object.keys(subActions).forEach(function(key) {
				if (key !== name)
					self.mapShow[key] = false;
			});

			if (!subActions[name] && !self.mapShow[name])
				self.resetActions();

			self.mapShow[name] = !self.mapShow[name];

			if (name === 'createNetwork') {
				self.network = null;
			}
			//breakpoint : if we clicked to hide the section we don't fetch data
			if (!self.mapShow[name])
				return;

		}
	}
});

Vue.component('networks', {
	template : '#networks-template',
	props : {
		model : Object
	},
	data : function() {
		return {
			loading : true
		};
	},
	computed : {
		empty : function() {
			return this.model ? this.model.length === 0 : true;
		}
	},
	methods : {
		close : function() {

			console.log('closed');
		},
		loadNetwork : function(id, resetActions) {
			if (resetActions === undefined)
				resetActions = true;

			app.currentApp.currentNetwork = misc.obj.copy(this.model.filter(function(network) {
			return network.id === id;
			})[0]);

			if (resetActions)
				app.currentApp.$refs.networkactions.resetActions();

		}
	}
});

apps.networks = {
	el : '#current-app',
	data : {
		treeData : {
			displayName : 'Réseaux',
			root : true,
			children : []
		},
		networkInfos : null,
		currentItem : null,
		currentNetwork : null
	},
	methods : {
		recompute : function(cb) {
			var self = this;

			ajax.call('GET', '/networks?details=true', function(data) {

				self.treeData.children = data.map(function(network) {
					network.displayName = network.name;
					network.displayCreationDate = date.prettyDate(network.creation_date);
					return network;
				});

				self.networkInfos = misc.obj.copy(self.treeData.children);

				self.currentNetwork = null;

				if (self.$refs.networkactions)
					self.$refs.networkactions.resetActions();

				if (self.$refs.networklist)
					self.$refs.networklist.loading = false;

				self.$forceUpdate();

				if (cb)
					cb();

			});

		},
		setSelected : function(item) {
			var self = this;

			if (self.currentItem)
				self.currentItem.selected = false;

			if (item.selectable) {
				self.currentItem = item;
				item.selected = true;

				self.$refs.networklist.close();
			}
		},
		clickTree : function(item) {
			console.log(item);
			/*var self = this;
			 self.setSelected(item);
			 self.$refs.networklist.loading = true;

			 if (item.model.isGroup) {
			 ajax.call('GET', '/group/' + item.model.id + '/vm', function(data) {
			 self.vmInfos = misc.datapipe.vms(data);
			 self.$refs.networklist.loading = false;
			 });
			 } else {
			 ajax.call('GET', '/vm', function(data) {
			 self.vmInfos = misc.datapipe.vms(data);
			 self.$refs.networklist.loading = false;
			 });
			 }*/

		}
	},
	created : function() {
		var self = this;

		self.recompute();

		$('#left-panel').append('<div id="tree"><ul><item class="item" :model="treeData"></item></ul></div>');
		$('#middle-panel').append('<networks ref="networklist" :model="networkInfos"></vms>');
		$('#right-panel').append('<networkactions ref="networkactions" :network="currentNetwork"></networkactions>');
	}
};
