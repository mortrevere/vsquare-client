Vue.component('select2', {
	props : ['options', 'value'],
	template : '#select2-template',
	mounted : function() {
		var selectionReferent = this;
		$(this.$el)
		// init selection
		.select2({
			data : this.options,
			multiple : true
		}).val(this.value).trigger('change')
		// emit event on change.
		.on('change', function() {
			selectionReferent.$emit('input', this.value);
		});
	},
	watch : {
		value : function(value) {
			// update value
			$(this.$el).val(value);
		},
		options : function(options) {
			// update options
			$(this.$el).empty().select2({
				data : options
			});
		}
	},
	destroyed : function() {
		$(this.$el).off().select2('destroy');
	}
});

Vue.component('group-grid', {
	template : '#groups-grid-template',
	props : {
		data : Array,
		columns : Array,
		filterKey : String
	},
	data : function() {
		var sortOrders = {};
		this.columns.forEach(function(key) {
			sortOrders[key] = -1;
		});
		return {
			sortKey : 'type',
			sortOrders : sortOrders
		};
	},
	computed : {
		filteredData : function() {
			var sortKey = this.sortKey;
			var filterKey = this.filterKey && this.filterKey.toLowerCase();
			var order = this.sortOrders[sortKey] || 1;
			var data = this.data;
			if (filterKey) {
				data = data.filter(function(row) {
					return Object.keys(row).some(function(key) {
						return String(row[key]).toLowerCase().indexOf(filterKey) > -1;
					});
				});
			}
			if (sortKey) {
				data = data.slice().sort(function(a, b) {
					a = a[sortKey];
					b = b[sortKey];
					return (a === b ? 0 : a > b ? 1 : -1) * order;
				});
			}
			return data;
		}
	},
	filters : {
		capitalize : function(str) {
			return str.charAt(0).toUpperCase() + str.slice(1);
		}
	},
	methods : {
		sortBy : function(key) {
			this.sortKey = key;
			this.sortOrders[key] = this.sortOrders[key] * -1;
		},
		userClicked : function(user) {
			apps.groups.data.userSelected = user;
		}
	}
});

Vue.component('groupsactions', {
	template : '#groups-actions-template',
	props : {
		editedType : undefined
	},
	data : function() {
		return {
			mapShow : {
				createGroup : false,
				deleteGroup : false,
				addUser : false,
				deleteUser : false,
				changeUser : false,
				editLimits : false,
				networks : false,
				vmTemplates : false,
				nukeGroup : false,
				editGroup : false,
				show : false
			},
			newGroup : {
				name : '',
				description : '',
				id_parent_group : null
			},
			newGroupInfo : {
				name : '',
				desc : ''
			},
			userSearch : {
				query : '',
				selected : '',
				results : []
			},
			groupLimits : {
				vm_count : 3,
				cpu_count : 4,
				memory_size : 2048,
				disk_storage : 65536
			},
			groupNetworks : {
				linked : [],
				available : [],
				newNetworkKey : null
			},
			vmTemplates : {
				linked : [],
				available : [],
				newTemplateKey : null
			},
			allGroups : [],
			allTypes : ['ADMIN', 'REFERENT', 'STUDENT'],
			currentGroup : null
		};
	},
	computed : {
		groupSelected : function() {
			return this.$parent.$refs.groups.actualGroup.id !== undefined;
		},
		userSelected : function() {
			return this.$parent.userSelected;
		},
		groupId : function() {
			return this.$parent.$refs.groups.actualGroup.id;
		}
	},
	created : function() {
		var self = this;

		ajax.call('GET', '/groups', function(data) {
			self.allGroups = data.map(function(group) {
				return {
					value : group.id,
					display : group.name
				};
			});
		});

	},
	methods : {
		unlinkVMTemplate : function(templateId) {
			var self = this;
			ajax.call('DELETE', '/group/' + self.groupId + '/template/' + templateId, function(data) {
				console.log(data);
				app.notify('Machine retirée du groupe', 'success');
				self.mapShow.vmTemplates = false;
				self.showAction('vmTemplates');
			}, function(error) {
				console.log(error);
				app.notify('Impossible de retirer la machine au groupe', 'error');
			});
		},
		linkVMTemplate : function(event) {
			var self = this;
			ajax.call('PUT', '/group/' + self.groupId + '/template/' + self.vmTemplates.newTemplateKey, function(data) {
				console.log(data);
				app.notify('Machine mise à disposition du groupe', 'success', app.getNotifyAnchor(event), 'left');
				self.mapShow.vmTemplates = false;
				self.showAction('vmTemplates');
			}, function(error) {
				console.log(error);
				app.notify('Impossible de lier la machine au groupe', 'error', app.getNotifyAnchor(event), 'left');
			});
		},
		shutdownGroup : function(event) {
			var self = this;
			ajax.call('POST', '/group/' + self.groupId + '/power/stop', function(data) {
				console.log(data);
				app.notify('VMs du groupe éteintes', 'success');
			}, function(error) {
				console.log(error);
				app.notify('Impossible d\'éteindre les VMs du groupe', 'error', app.getNotifyAnchor(event), 'left');
			});
		},
		addNetwork : function(event) {
			var self = this;
			ajax.call('PUT', '/group/' + self.groupId + '/network/' + self.groupNetworks.newNetworkKey, function(data) {
				console.log(data);
				app.notify('Réseau mis à disposition du groupe', 'success', app.getNotifyAnchor(event), 'left');
				self.mapShow.networks = false;
				self.showAction('networks');
			}, function(error) {
				console.log(error);
				app.notify('Impossible de lier le réseau au groupe', 'error', app.getNotifyAnchor(event), 'left');
			});
		},
		unlinkNetwork : function(id) {
			var self = this;

			ajax.call('DELETE', '/group/' + self.groupId + '/network/' + id, function(data) {
				console.log(data);
				app.notify('Réseau retiré du groupe', 'success');
				self.groupNetworks.linked = self.groupNetworks.linked.filter(function(group) {
					console.log(group);
					return group.id !== id;
				});

				self.mapShow.networks = false;
				self.showAction('networks');

			}, function(error) {
				console.log(error);
				app.notify('Impossible de retirer le réseau du groupe', 'error');
			});
		},
		incrementField : function(event) {
			var target = event.target.attributes.target.value.split('.');
			var step = parseFloat(event.target.attributes.step.value);

			var lastKey = target.pop();
			var ptr = target.reduce(function(prev, next) {
				return prev[next];
			}, this);

			ptr[lastKey] += step;
		},
		resetLimits : function(event) {
			var self = this;

			ajax.call('DELETE', '/group/' + self.groupId + '/permission', function(data) {
				self.groupLimits = data;
				app.notify('Limitations par défaut appliquées', 'success', app.getNotifyAnchor(event), 'left');
			}, function(error) {
				console.log(error);
				app.notify('Impossible de modifier les limites', 'error', app.getNotifyAnchor(event), 'left');
			});
		},
		changeLimits : function(event) {
			var self = this;

			ajax.call('POST', '/group/' + self.groupId + '/permission', self.groupLimits, function(data) {
				console.log(data);
				app.notify('Limitations appliquées', 'success', app.getNotifyAnchor(event), 'left');
			}, function(error) {
				console.log(error);
				app.notify('Impossible de modifier les limites', 'error', app.getNotifyAnchor(event), 'left');
			});
		},
		addUserToGroup : function(event) {
			var self = this;
			var groupId = self.groupId;
			ajax.call('PUT', '/group/' + groupId + '/user/' + this.userSearch.selected, function(data) {
				console.log(data);
				self.$parent.refreshTree();
				self.$parent.loadGroup(groupId);
				self.userSearch.query = '';
				self.userSearch.results = [];
				app.notify('Utilisateur ajouté', 'success');
			}, function(error) {
				console.log(error);
				app.notify('Impossible d\'ajouter l\'utilisateur', 'error', app.getNotifyAnchor(event), 'left');
			});
		},
		searchUser : function() {
			var self = this;
			ajax.call('GET', '/user?query=' + this.userSearch.query, function(data) {
				console.log(data);
				self.userSearch.results = data;
			});
		},
		createGroup : function(event) {
			var self = this;
			ajax.call('POST', '/group', this.newGroup, function(data) {
				console.log(data);
				self.$parent.refreshTree();
				self.$parent.loadGroup(data.id);
				self.mapShow.createGroup = false;
				app.notify('Groupe créé', 'success');
			}, function(error) {
				console.log(error);
				app.notify('Impossible de créer le groupe', 'error', app.getNotifyAnchor(event), 'left');
			});
		},
		deleteGroup : function(event) {
			var self = this;
			var groupId = self.groupId;
			if (groupId) {
				ajax.call('DELETE', '/group/' + groupId, function(data) {
					console.log(data);
					self.$parent.refreshTree();
					self.$parent.loadGroup(self.$parent.$refs.groups.actualGroup.id_parent_group);
					self.mapShow.deleteGroup = false;
					app.notify('Groupe supprimé', 'success');
				}, function(error) {
					console.log(error);
					app.notify('Impossible de supprimer le groupe', 'error', app.getNotifyAnchor(event), 'left');
				});
			}
		},
		deleteUser : function(event) {
			var self = this;
			var groupId = self.groupId;
			var userId = self.userSelected.id;
			if (groupId && userId) {
				ajax.call('DELETE', '/group/' + groupId + '/user/' + userId, function(data) {
					console.log(data);
					self.$parent.loadGroup(groupId);
					self.mapShow.deleteUser = false;
					self.$parent.data.userSelected = undefined;
					app.notify('Utilisateur supprimé', 'success');
				}, function(error) {
					console.log(error);
					app.notify('Impossible de supprimer l\'utilisateur', 'error', app.getNotifyAnchor(event), 'left');
				});
			}
		},
		changeUser : function(event) {
			var self = this;
			var groupId = self.groupId;
			var userId = self.userSelected.id;
			var userType = this.editedType;
			ajax.call('POST', '/user/' + userId, {
				type : userType
			}, function(data) {
				console.log(data);
				self.$parent.loadGroup(groupId);
				self.mapShow.changeUser = false;
				app.notify('Utilisateur modifié', 'success');
			}, function(error) {
				console.log(error);
				app.notify('Impossible de modifier l\'utilisateur', 'error', app.getNotifyAnchor(event), 'left');
			});
		},
        editGroup : function(event) {
            var self = this;
            ajax.call('POST', '/group/'+ self.groupId, self.newGroupInfo, function(data){
                console.log(data);
                app.notify('Changement des paramètres appliqués', 'success');
                self.$parent.refreshTree();
                app.currentApp.loadGroup(self.groupId);
            }, function(error) {
                console.log(error);
                app.notify('Impossible de modifier les paramètres : ' + error.responseJSON.value.error, 'error', app.getNotifyAnchor(event), 'left');
            });
        },
        nukeGroup : function(event) {
            var self = this;
            ajax.call('DELETE', '/group/' + self.groupId + '/reset/vms', function(data){
                console.log(data);
                app.notify('VMs supprimées', 'success');
                app.currentApp.loadGroup(self.groupId);
            }, function(error) {
                console.log(error);
                app.notify('Impossible de supprimer les VMs : ' + error.responseJSON.value.error, 'error', app.getNotifyAnchor(event), 'left');
            });
            ajax.call('DELETE', '/group/'+ self.groupId + '/reset/users', function(data){
                console.log(data);
                app.notify('Utilisateurs supprimés du groupe', 'success');
                app.currentApp.loadGroup(self.groupId);
            }, function(error) {
                console.log(error);
                app.notify('Impossible de supprimer les utilisateurs du groupe : ' + error.responseJSON.value.error, 'error', app.getNotifyAnchor(event), 'left');
            });
        },
        shown : function(name) {
			//console.log(name);
			return this.mapShow[name];
		},
		resetActions : function() {
			var self = this;
			Object.keys(self.mapShow).forEach(function(key) {
				if (key !== 'more')
					self.mapShow[key] = false;
			});

			this.userSelected = undefined;
		},
		showAction : function(name) {

			var self = this;
			var groupId = self.groupId;

			var subActions = {};

			Object.keys(subActions).forEach(function(key) {
				if (key !== name)
					self.mapShow[key] = false;
			});

			if (!subActions[name] && !self.mapShow[name])
				self.resetActions();

			self.mapShow[name] = !self.mapShow[name];

			//breakpoint : if we clicked to hide the section we don't fetch data

			if (!self.mapShow[name])
				return;
				
			if (name === 'editGroup') {
				console.log(self.currentGroup);
				self.newGroupInfo.name = self.currentGroup.name;
				self.newGroupInfo.desc = self.currentGroup.description;
			} else if (name === 'editLimits') {
				ajax.call('GET', '/group/' + groupId + '/permission', function(data) {
					self.groupLimits = data;
					self.$forceUpdate();
				});
			} else if (name === 'networks') {
				var alreadyConnected = {};

				ajax.call('GET', '/group/' + groupId + '/networks', function(data) {
					self.groupNetworks.linked = data;
					console.log(data);

					data.forEach(function(connectedNetwork) {
						alreadyConnected[connectedNetwork.id] = true;
					});

					ajax.call('GET', '/networks', function(data) {
						self.groupNetworks.available = data.filter(function(network) {
							return !alreadyConnected[network.id];
						}).concat([{
							name : '(aucun)',
							id : null,
							network : null
						}]);
						self.$forceUpdate();
					});

				});
			} else if (name === 'vmTemplates') {
				var alreadyAvailable = {};

				ajax.call('GET', '/group/' + groupId + '/templates', function(data) {
					self.vmTemplates.linked = data;
					console.log(data);

					data.forEach(function(availableTemplate) {
						alreadyAvailable[availableTemplate.vm] = true;
					});

					ajax.call('GET', '/vm/templates', function(data) {
						self.vmTemplates.available = data.filter(function(vmTemplate) {
							return !alreadyAvailable[vmTemplate.vm];
						}).concat([{
							name : '(aucun)',
							id : null,
							vm : null
						}]);
						self.$forceUpdate();
					});

				});
			} else {
				if (self.userSelected !== undefined) {
					self.editedType = self.userSelected.type;
				}
				self.$forceUpdate();
			}
		}
	}
});

Vue.component('groups', {
	template : '#groups-template',
	props : {
		model : Object
	},
	data : function() {
		return {
			actualGroup : Object,
			searchQuery : '',
			gridColumns : ['type', 'common_name', 'login'],
			gridData : null
		};
	},
	methods : {

	},
	created : function() {

	},
	computed : {
		notSelected : function() {
			return this.gridData === null;
		},
		empty : function() {
			return this.gridData.length === 0;
		}
	}
});

var data = {
	displayName : 'Groupes',
	root : true,
	children : []
};

apps.groups = {
	el : '#current-app',
	data : {
		treeData : data,
		userSelected : undefined
	},
	methods : {
		loadGroup : function(id, resetActions) {
			var self = this;
			self.userSelected = undefined;

			if (resetActions === undefined) {
				resetActions = true;
			}

			ajax.call('GET', '/group/' + id, function(data) {
				self.$refs.groups.actualGroup = data;
				self.$refs.groupsactions.currentGroup = data;
				//self.$refs.groups.gridData = misc.datapipe.users(data.users);
				self.$refs.groups.gridData = data.users;
				if (resetActions)
					self.$refs.groupsactions.resetActions();

			});

		},
		clickTree : function(item) {
			this.loadGroup(item.model.id);
		},
		refreshTree : function() {
			var self = this;

			ajax.call('GET', '/groups', function(data) {
				console.log(data);
				self.treeData.children = data.map(function(group) {
					group.displayName = group.name;
					return group;
				});

				self.treeData.children = misc.groupListToTree(self.treeData.children);
			});
		}
	},
	created : function() {
		this.refreshTree();
		$('#left-panel').append('<div id="tree"><ul><item class="item" :model="treeData"></item></ul></div>');
		$('#middle-panel').append('<groups ref="groups"></groups>');
		$('#right-panel').append('<groupsactions ref="groupsactions"></groupsactions>');
	}
};
