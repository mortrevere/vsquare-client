Vue.component('vmactions', {
	template : '#vm-actions-template',
	props : {
		vm : null
	},
	data : function() {
		return {
			mapShow : {
				settings : false,
				createVM : false,
				snapshots : false,
				disks : false,
				newSnapshot : false,
				newDisk : false,
				deleteVM : false,
				clone : false,
				networks : false,
				newVMFromSnapshot : false,
				createVMPreconfig : false,
				template : false,
				more : false
			},

			newVM : {
				name : '',
				uploadHandler : null,
				type : ''
			},

			newVmInfo : {
				name : '',
				cpu_count : 55,
				memory_size : 0,
				desc : ''
			},

			snapshots : {
				selected : null,
				new : {
					name : '',
					description : ''
				},
				list : []
			},
			VMsPreconfigs : {
				selected : null,
				lists : []
			},
			disks : {
				selected : null,
				capacity : 0,
				new : {
					name : '',
					capacity : 4096
				}
			},
			newVMFromTemplate : {
				name : '',
				desc : '',
			},
			newVMFromSnapshot : {
				name : '',
				desc : '',
			},
			newVmPreconfig : {
				name : '',
				desc : ''
			},

			clone : {
				name : '',
				desc : ''
			},

			networks : {
				available : [],
				newNetworkKey : null
			},
			template : {
				groupId : null,
				name : '',
				desc : '',

			}
		};
	},
	computed : {
		vmSelected : function() {
			return this.vm !== null;
		},
		enableNetworkPlugActionClass : function() {
			return this.networks.newNetworkKey === null ? 'disabled-action' : '';
		},
	},
	methods : {//all methods called by buttons in the right panel
		//they all follow the same pattern :
		//ajax call to the right URL
		//callback in case of success
		//notify of the success via app.notify. This method reset the state of the last ajax loader button clicked.
		//handle success with a reload of the right part of the UI (via app.currentApp.$refs)
		//callback in case of error
		//notify of error, it also ends the ajax loader animation

		// /!\ Don't forget to use confirm() before critical actions like permanent deletion /!\

		createVmFromTemplate : function(event) {
			var self = this;
			ajax.call('PUT', '/vm/template/' + self.VMsPreconfigs.selected, self.newVMFromTemplate, function(data) {
				console.log(data);
				app.notify('VM préconfigurée créée avec succès', 'success');
				app.currentApp.recompute(data.id);
			}, function(error) {
				console.log(error);
				app.notify('Impossible de créer la VM préconfigurée : ' + error.responseJSON.value.error, 'error', app.getNotifyAnchor(event), 'left');
			});
		},

		createTemplate : function(event) {
			var self = this;
			console.log(self.template);
			ajax.call('PUT', '/vm/' + self.vm.id + '/template/', self.template, function(data) {
				console.log(data);
				app.notify('VM préconfigurée créée avec succès', 'success');
				app.currentApp.recompute(data.id);
			}, function(error) {
				console.log(error);
				app.notify('Impossible de créer la VM préconfigurée : ' + error.responseJSON.value.error, 'error', app.getNotifyAnchor(event), 'left');
			});
		},
		createNetworkInterface : function(event) {
			var self = this;
			console.log(self.networks.newNetworkKey);
			ajax.call('PUT', '/vm/' + self.vm.id + '/ethernet', {
				network : self.networks.newNetworkKey
			}, function(data) {
				app.notify('Interface réseau créée avec succès', 'success');
				app.currentApp.$refs.vmlist.loadVm(self.vm.id, false);
				console.log(data);
			}, function(error) {
				app.notify('Impossible de créer une interface réseau : ' + error.responseJSON.value.error, 'error', app.getNotifyAnchor(event), 'left');
			});
		},

		connectNetwork : function(nicKey) {
			var self = this;
			console.log('called edit with', nicKey);
			ajax.call('POST', '/vm/' + self.vm.id + '/ethernet/' + nicKey, {
				network : self.networks.newNetworkKey,
				connected : true
			}, function(data) {
				console.log(data);
				app.currentApp.$refs.vmlist.loadVm(self.vm.id, false, function() {
					app.notify('Réseau connecté avec succès', 'success');
				});

			}, function(error) {
				app.notify('Impossible de connecter l\'interface au réseau : ' + error.responseJSON.value.error, 'error');
			});
		},

		disconnectNetwork : function(nicKey) {
			var self = this;
			console.log('called disconnect with', nicKey);
			ajax.call('POST', '/vm/' + self.vm.id + '/ethernet/' + nicKey, {
				connected : false
			}, function(data) {
				console.log(data);
				app.currentApp.$refs.vmlist.loadVm(self.vm.id, false, function() {
					app.notify('Réseau déconnecté', 'success');
				});
			}, function(error) {
				app.notify('Impossible de déconnecter l\'interface : ' + error.responseJSON.value.error, 'error');
			});
		},

		deleteNetworkInterface : function(nicKey) {
			var self = this;
			console.log('called delete with', nicKey);
			ajax.call('DELETE', '/vm/' + self.vm.id + '/ethernet/' + nicKey, function(data) {
				console.log(data);
				app.currentApp.$refs.vmlist.loadVm(self.vm.id, false, function() {
					app.notify('Interface réseau supprimée', 'success');
				});

			}, function(error) {
				app.notify('Impossible de supprimer l\'interface : ' + error.responseJSON.value.error, 'error');
			});
		},

		createVMSnapshot : function(event) {
			var self = this;

			ajax.call('POST', '/vm/' + self.vm.id + '/snapshot/' + self.snapshots.selected + '/clone', self.newVMFromSnapshot, function(data) {
				console.log(data);
				app.notify('VM du snapshot créée avec succès', 'success');
				app.currentApp.recompute(data.id);
			}, function(error) {
				console.log(error);
				app.notify('Impossible de créer la VM à partir du snapshot : ' + error.responseJSON.value.error, 'error', app.getNotifyAnchor(event), 'left');
			});
		},
		createVMPreconfig : function(event) {
			var self = this;
			//TODO
			ajax.call('POST', '/vm/template' + self.VMsPreconfigs.selected, self.newVMPreconfig, function(data) {
				console.log(data);
				app.notify('VM créée avec succès', 'success');
				app.currentApp.recompute(data.id);
			}, function(error) {
				console.log(error);
				app.notify('Impossible de créer la VM : ' + error.responseJSON.value.error, 'error', app.getNotifyAnchor(event), 'left');
			});
		},
		cloneVM : function(event) {
			var self = this;

			ajax.call('POST', '/vm/' + self.vm.id + '/clone', self.clone, function(data) {
				console.log(data);
				app.notify('VM clonée avec succès', 'success');
				self.resetActions();
				app.currentApp.recompute(data.id);
			}, function(error) {
				console.log(error);
				app.notify('Impossible de cloner la VM : ' + error.responseJSON.value.error, 'error', app.getNotifyAnchor(event), 'left');
			});
		},

		createDisk : function(event) {
			var self = this;
			var params = misc.obj.copy(self.disks.new);
			params.capacity *= 1024 * 1024;

			ajax.call('POST', '/vm/' + self.vm.id + '/disk', params, function(data) {
				console.log(data);
				app.currentApp.$refs.vmlist.loadVm(self.vm.id);
				app.notify('Disque de ' + misc.humanize.filesize(params.capacity) + ' créé', 'success');
			}, function(error) {
				console.log(error);
				app.notify('Impossible de créer le disque : ' + error.responseJSON.value.error, 'error', app.getNotifyAnchor(event), 'left');
			});
		},

		enlargeDisk : function(event) {
			var self = this;
			ajax.call('POST', '/vm/' + self.vm.id + '/disk/' + self.disks.selected, {
				capacity : self.disks.capacity * (1024 * 1024)
			}, function(data) {
				console.log(data);
				app.currentApp.$refs.vmlist.loadVm(self.vm.id);
				app.notify('Disque agrandi à ' + misc.humanize.filesize(self.disks.capacity * (1024 * 1024)), 'success');
			}, function(error) {
				console.log(error);
				app.notify('Impossible d\'agrandir le disque : ' + error.responseJSON.value.error, 'error', app.getNotifyAnchor(event), 'left');
			});
		},

		deleteDisk : function(event) {
			var self = this;
			if (!confirm('Êtes vous sûr de vouloir supprimer ce disque ? Cette action est irréversible.'))
				return;

			ajax.call('DELETE', '/vm/' + self.vm.id + '/disk/' + self.disks.selected, function(data) {
				console.log(data);
				app.currentApp.$refs.vmlist.loadVm(self.vm.id);
				app.notify('Disque supprimé avec succès', 'success');
			}, function(error) {
				console.log(error);
				app.notify('Impossible de supprimer le disque : ' + error.responseJSON.value.error, 'error', app.getNotifyAnchor(event), 'left');
			});
		},

		updateDisplayDisks : function() {
			var self = this;
			self.disks.capacity = self.vm.disks.filter(function(disk) {
			return disk.key === self.disks.selected;
			})[0].capacity / (1024 * 1024);
		},

		takeSnapshot : function(event) {
			var self = this;

			ajax.call('POST', '/vm/' + self.vm.id + '/snapshot', self.snapshots.new, function(data) {
				app.notify('Snapshot créé avec succès', 'success');
				console.log(data);
				app.currentApp.$refs.vmlist.loadVm(self.vm.id);
			}, function(error) {
				console.log(error);
				app.notify('Impossible de créer un snapshot', 'error', app.getNotifyAnchor(event), 'left');
			});

		},

		revertSnapshot : function(event) {
			var self = this;

			ajax.call('POST', '/vm/' + self.vm.id + '/snapshot/' + self.snapshots.selected + '/revert', function(data) {
				app.notify('Snapshot appliqué', 'success');
				console.log(data);
			}, function(error) {
				console.log(error);
				app.notify('Impossible de revenir au snapshot', 'error', app.getNotifyAnchor(event), 'left');
			});

		},

		deleteSnapshot : function(event) {
			var self = this;

			ajax.call('DELETE', '/vm/' + self.vm.id + '/snapshot/' + self.snapshots.selected, function(data) {
				app.notify('Snapshot supprimé', 'success');
				console.log(data);
			}, function(error) {
				console.log(error);
				app.notify('Impossible de supprimer le snapshot', 'error', app.getNotifyAnchor(event), 'left');
			});

		},

		download : function(event) {
			var self = this;
			event.target.disabled = true;
			ajax.call('GET', '/vm/' + self.vm.id + '/export/ova', function(data) {
				console.log(data);
				window.open(data.url, '_blank');
				app.notify('VM exportée avec succès.', 'success');
				event.target.disabled = false;
			}, function(error) {
				console.log(error);
				app.notify('Impossible d\'exporter la VM.', 'error', app.getNotifyAnchor(event), 'left');
				event.target.disabled = false;
			});
		},

		FileSelect : function(event) {
			var files = event.target.files || event.dataTransfer.files;
			if (!files.length)
				return;

			var file = files[0];
			this.newVM.uploadHandler = new Upload(file, '#vm-upload-progress');
			this.newVM.type = file.name.substring(file.name.length - 3);

		},
		createVM : function() {
			var self = this;

			if (this.newVM.type === 'ova') {
				self.newVM.uploadHandler.doUpload('/import/ova', 'ovaFile', {
					vmName : self.newVM.name
				}, function(data) {
					this.newVM = {};
					app.notify('VM créée avec succès', 'success');
					app.currentApp.recompute(data.id);
					console.log(data);
				}, function(error) {
					console.log(error);
					app.notify('Impossible de créer la VM.' + error.responseJSON.value.error, 'error', app.getNotifyAnchor(event), 'left');
				});
			} else if (this.newVM.type === 'iso') {
				self.newVM.uploadHandler.doUpload('/import/iso', 'isoFile', {
					vmName : self.newVM.name
				}, function(data) {
					app.notify('VM créée avec succès', 'success');
					app.currentApp.recompute(data.id);
					console.log(data);
				}, function(error) {
					console.log(error);
					app.notify('Impossible de créer la VM.' + error.responseJSON.value.error, 'error', app.getNotifyAnchor(event), 'left');
				});
			}
		},
		changeSetting : function(event) {
			var self = this;
			ajax.call('POST', '/vm/' + self.vm.id, self.newVmInfo, function(data) {
				console.log(data);
				app.notify('Changement des paramètres appliqués', 'success');
				app.currentApp.recompute(self.vm.id);
			}, function(error) {
				console.log(error);
				app.notify('Impossible de modifier les paramètres : ' + error.responseJSON.value.error, 'error', app.getNotifyAnchor(event), 'left');
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
		deleteVM : function(event) {
			var self = this;

			ajax.call('DELETE', '/vm/' + self.vm.id, function() {
				app.notify('VM supprimée', 'success');
				self.vm = null;
				app.currentApp.$refs.vmlist.close();
				app.currentApp.recompute();

			}, function() {
				app.notify('Impossible de supprimer la VM.', 'error', app.getNotifyAnchor(event), 'left');
			});
		},
		webconsole : function() {
			ajax.call('GET', '/vm/' + this.vm.id + '/console', function(ticketID) {
				//note that this is a custom (reformatted) ticketID to fit with how the webconsole expects it
				//and not the exact ticket id given by vSphere
				window.open('./webconsole.html#' + encodeURIComponent(ticketID), '_blank');
			});
		},
		shutdown : function(event) {
			//basically the same structure as the others except for the powerStateWatcher
			//as booting or shuting down a VM can take some time, we check every second if it is done until its state changes
			//meanwhile, the template switches to a loading animation
			var self = this;
			var currentState = this.vm.power_state;

			if (this.vm.power_state === 'POWERED_OFF') {
				ajax.call('POST', '/vm/' + this.vm.id + '/power/start', function(data) {
					console.log(data);
					self.vm.power_state = 'CHANGING';
				}, function() {
					app.notify('Impossible d\'allumer la VM', 'error', app.getNotifyAnchor(event), 'left');
				});
			} else if (this.vm.power_state === 'POWERED_ON') {
				ajax.call('POST', '/vm/' + this.vm.id + '/power/stop', function(data) {
					console.log(data);
					self.vm.power_state = 'CHANGING';
				});
			}

			function powerStateWatcher() {
				app.currentApp.$refs.vmlist.loadVm(self.vm.id);
				if (currentState === self.vm.power_state && self.vm.power_state !== 'CHANGING') {
					setTimeout(powerStateWatcher, 1000);
				}
			}

			powerStateWatcher();

		},
		resetSetting : function() {
			var self = this;
			self.newVmInfo.cpu_count = self.vm.cpu.count;
			self.newVmInfo.memory_size = self.vm.memory.size_MiB;
			self.newVmInfo.name = self.vm.name;
			self.newVmInfo.desc = self.vm.desc;
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
			this.disks.selected = null;
			this.networks.newNetworkKey = null;
		},
		showAction : function(name) {
			//util that is called in the template alongside shown('xxx') by clicking on buttons
			//making the building of the UI possible in the template only
			//without having to create custom show/hide functions everytime
			var self = this;

			var subActions = {
				newSnapshot : true,
				newDisk : true,
				newVMFromSnapshot : true
			};

			Object.keys(subActions).forEach(function(key) {
				if (key !== name)
					self.mapShow[key] = false;
			});

			if (!subActions[name] && !self.mapShow[name])
				self.resetActions();

			self.mapShow[name] = !self.mapShow[name];

			if (name === 'settings') {
				self.resetSetting();
			}

			//breakpoint : if we clicked to hide the section we don't fetch data
			if (!self.mapShow[name])
				return;

			if (name === 'snapshots') {
				ajax.call('GET', '/vm/' + self.vm.id + '/snapshots', function(data) {
					self.snapshots.list = data;
					self.$forceUpdate();
				});
			}
			if (name === 'createVMPreconfig') {
				ajax.call('GET', '/vm/templates', function(data) {
					console.log(data);
					self.VMsPreconfigs.lists = data;
					self.$forceUpdate();
				});
			}
			if (name === 'networks') {
				ajax.call('GET', '/networks', function(data) {
					console.log('available networks', data);
					data.push({
						id : null,
						name : '(aucun)',
						network : null
					});
					data.push({
						id : 'local',
						name : 'Réseau privé',
						network : 'local'
					});
					self.networks.available = data;
					self.$forceUpdate();
				});
			}

		}
	}
});

Vue.component('vms', {
	template : '#vms-template',
	props : {
		model : Object
	},
	data : function() {
		return {
			loading : true,
			refreshHandler : null,
			showvmdetails : false,
			vmdetails : {
				name : '...',
				guest_OS : 'OS',
				memory : {
					size_MiB : 0
				}
			}
		};
	},
	computed : {
		empty : function() {
			return this.model ? this.model.length === 0 : true;
		},
		isLoading : function() {
			return this.loading;
		}
	},
	methods : {
		close : function() {
			this.showvmdetails = false;
			this.vmdetails = null;
			app.currentApp.currentVM = null;
			console.log('closed');
		},
		loadVm : function(id, resetActions, cb) {
			var self = this;

			if (resetActions === undefined)
				resetActions = true;

			var vm = {
				id : id
			};
			console.log(vm);

			ajax.call('GET', '/vm/' + vm.id + '?fresh', function(data) {

				self.vmdetails = misc.datapipe.vmDetails(data);

				self.model = self.model.map(function(vmItem) {
					if (vmItem.vm === vm.id) {
						vmItem.displayName = self.vmdetails.name + ' (' + self.vmdetails.vm + ')';
						vmItem.displayPower = self.vmdetails.power_state ? misc.humanize.humanPowerState[self.vmdetails.power_state] : 'N/A';
						vmItem.desc = self.vmdetails.desc;
						vmItem.name = self.vmdetails.name;
					}
					return vmItem;
				});

				self.vmdetails.id = vm.id;
				app.currentApp.currentVM = self.vmdetails;
				self.showvmdetails = true;

				if (resetActions)
					app.currentApp.$refs.vmactions.resetActions();

				if (cb)
					cb();

			});

		}
	}
});

apps.vms = {
	el : '#current-app',
	data : {
		treeData : {
			displayName : 'Machines Virtuelles',
			root : true,
			children : []
		},
        user : {
            student : cookies.get('user_type') === 'STUDENT' //is admin ? (will change displaying of elements)
        },
		vmInfos : null,
		currentItem : null,
		currentVM : null
	},
	methods : {
		recompute : function(openedVMid) {
			var self = this;
			ajax.call('GET', '/vm', function(data) {

				self.vmInfos = misc.datapipe.vms(data);
				console.log('RECOMPUTE', self.treeData.children);

				var groups = self.treeData.children[self.treeData.children.length - 1];

				self.treeData.children = misc.obj.copy(data.map(function(vm) {
					vm.displayName = vm.name + ' (' + vm.vm + ')';
					vm.displayPower = vm.power_state ? misc.humanize.humanPowerState[vm.power_state] : 'N/A';
					return vm;
				}));

				self.treeData.children.push(groups);

				if (openedVMid)
					self.$refs.vmlist.loadVm(openedVMid);

				self.$forceUpdate();
			});
		},
		setSelected : function(item) {
			var self = this;

			if (self.currentItem)
				self.currentItem.selected = false;

			if (item.selectable) {
				self.currentItem = item;
				item.selected = true;

				self.$refs.vmlist.close();
			}
		},
		clickTree : function(item) {
			var self = this;
			self.$refs.vmlist.close();
			self.setSelected(item);
			self.$refs.vmlist.loading = true;
			if (item.model.isGroup) {

				ajax.call('GET', '/group/' + item.model.id + '/vm', function(data) {
					self.vmInfos = misc.datapipe.vms(data);
					self.$refs.vmlist.loading = false;
				});

			} else if (item.model.vm) {
				self.$refs.vmlist.loadVm(item.model.vm, false, function() {
					self.$refs.vmlist.loading = false;
				});
			} else {
				ajax.call('GET', '/vm', function(data) {
					self.vmInfos = misc.datapipe.vms(data);
					self.$refs.vmlist.loading = false;
				});
			}
		}
	},
	created : function() {
		var self = this;

		ajax.call('GET', '/vm', function(data) {

			self.treeData.children = data.map(function(vm) {
				vm.displayName = vm.name + ' (' + vm.vm + ')';
				vm.displayPower = vm.power_state ? misc.humanize.humanPowerState[vm.power_state] : 'N/A';
				return vm;
			});

			self.vmInfos = misc.obj.copy(self.treeData.children);

            if(!self.user.student) {

                var groupsMenuItem = {
                    displayName: 'Groupes',
                    id: 'groups',
                    root: true,
                    children: []
                };
                if (self.$refs.vmlist)
                    self.$refs.vmlist.loading = false;

                ajax.call('GET', '/groups', function (data) {

                    groupsMenuItem.children = data.map(function (group) {
                        group.displayName = group.name;
                        group.isGroup = true;
                        return group;
                    });
                    groupsMenuItem.children = misc.groupListToTree(groupsMenuItem.children);
                    self.treeData.children.push(groupsMenuItem);
                });

            }else if (self.$refs.vmlist) {
                    self.$refs.vmlist.loading = false;
			}

		});

		//app.rightPanel = true;

		$('#left-panel').append('<div id="tree"><ul><item class="item" :model="treeData"></item></ul></div>');
		$('#middle-panel').append('<vms ref="vmlist" :model="vmInfos"></vms>');
		$('#right-panel').append('<vmactions ref="vmactions" :vm="currentVM"></vmactions>');
	}
};
