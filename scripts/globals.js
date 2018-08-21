/* jshint unused : false */

//ajax global to handle all ajax calls with authentication (X-Token header)
var ajax = {
	base : 'https://192.168.4.242/api',
	call : function(method, URI, data, callback, onerror) {
		var o = {
			method : method,
			url : this.base + URI
		};

		var token = cookies.get('X-Token');

		if (token) {
			o.headers = {
				'X-Token' : token
			};
		}

		if ( typeof data === 'function') {
			onerror = callback;
			callback = data;
		} else if ( typeof data === 'object') {
			o.data = data;
		}

		function cbwrap(data) {
			data = data.value ? data.value : data;
			if (callback)
				callback(data);
		}

		function failwrap(data) {
			if (data.status === 401 && app.logout)
				app.logout();

			if (onerror)
				onerror(data);
		}

		setTimeout(function() {
			$.ajax(o).done(cbwrap).fail(failwrap);
		}, 500);

	}
};

var misc = {
	groupListToTree : function(liste) {
		//Mutate flat list of objects with id_parent_group attribute into a nested structure
		/* By Clément L. */
		var id_to_remove = [];
		var children = null;
		var parent = null;
		for (var i = 0; i < liste.length; i++) {
			if(liste[i].id_parent_group){
                children = liste[i];
                parent = liste[i].id_parent_group;
                for (var j = 0; j < liste.length; j++) {
                    if (liste[j].id === parent) {
                        if (!liste[j].hasOwnProperty('children')) {
                            liste[j].children = [];
                        }
                        liste[j].children.push(children);
                        id_to_remove.push(i);
                        break;
                    }
                }
			}
		}

		id_to_remove.reverse();

		for ( i = 0; i < id_to_remove.length; i++) {
			liste.splice(id_to_remove[i],1);
		}

		return liste;
	},
	redirect : function(url) {
		//redirect the user to a given URL
		window.location.href = url;
	},
	copyToClipboard : function(text) {
		//https://stackoverflow.com/a/33928558/8610763
		if (window.clipboardData && window.clipboardData.setData) {
			// IE specific code path to prevent textarea being shown while dialog is visible.
			return window.clipboardData.setData('Text', text);

		} else if (document.queryCommandSupported && document.queryCommandSupported('copy')) {
			var textarea = document.createElement('textarea');
			textarea.textContent = text;
			textarea.style.position = 'fixed';
			// Prevent scrolling to bottom of page in MS Edge.
			document.body.appendChild(textarea);
			textarea.select();
			try {
				return document.execCommand('copy');
				// Security exception may be thrown by some browsers.
			} catch (ex) {
				console.warn('Copy to clipboard failed.', ex);
				return false;
			} finally {
				document.body.removeChild(textarea);
			}
		}
	},
	obj : {
		copy : function(o) {
			//create a detached copy of an object with a quick hack
			return JSON.parse(JSON.stringify(o));
		}
	},
	//datapipes are reusable ways to transform data returned by an API call
	datapipe : {
		vms : function(data) {
			//transform VM list in a displayable format (humanize status code and merge vsphere and vsquare name)
			return data.map(function(vm) {
				vm.displayName = vm.name + ' (' + vm.vm + ')';
				vm.displayPower = vm.power_state ? misc.humanize.humanPowerState[vm.power_state] : 'N/A';
				console.log(vm.user);
				return vm;
			});
		},
		vmDetails : function(vmdetails) {

			vmdetails.disks = vmdetails.disks.map(function(disk) {
				var diskID = disk.key;
				disk = disk.value;
				disk.key = diskID;
				disk.displayCapacity = misc.humanize.filesize(disk.capacity);
				disk.displayBacking = '';

				Object.keys(disk.backing).filter(function(a) {
					return a !== 'type';
				}).forEach(function(key) {
					if (key === 'vmdk_file' && disk.backing[key].length > 48) {
						disk.displayBacking += disk.backing[key].substr(0,16) + ' ... ' + disk.backing[key].substr(-32) + ' ';
					} else {
						disk.displayBacking += disk.backing[key] + ' ';
					}

				});

				return disk;
			});

			vmdetails.nics = vmdetails.nics.map(function(nic) {
				var nicID = nic.key;
				nic = nic.value;
				nic.key = nicID;
				nic.displayState = nic.state ? misc.humanize.humanCoState[nic.state] : 'N/A';
				return nic;
			});

			vmdetails.displayOS = vmdetails.guest_OS.replace(/_/g, ' ');
			vmdetails.displayOS = vmdetails.displayOS.toLowerCase();
			vmdetails.displayOS = vmdetails.displayOS.replace(vmdetails.displayOS[0], vmdetails.displayOS[0].toUpperCase());

			vmdetails.displayPower = vmdetails.power_state ? misc.humanize.humanPowerState[vmdetails.power_state] : 'N/A';

			vmdetails.displayMemory = misc.humanize.filesize(vmdetails.memory.size_MiB * 1024 * 1024);
			return vmdetails;
		},
		eventLogs : function(data) {
			return data.map(function(log) {
				log.displayUserName = log.user.common_name;
				log.objectType = log.object.object;
				log.displayObjectName = log.object.name;
				return log;
			});
		},
		errorLogs : function(data) {
			return data.map(function(log) {
				if (log.user)
					log.displayUserName = log.user.common_name;
				else
					log.displayUserName = '';
				return log;
			});
		}
	},
	//humanizing functions, to transform ids and status codes to human-readable information
	humanize : {
		appsName : {
			'vms' : 'VMs',
			'dashboard' : 'Accueil',
			'hypervisors' : 'Hyperviseurs',
			'datastores' : 'Datastores',
			'logs' : 'Journaux',
			'groups' : 'Groupes',
			'networks' : 'Réseaux'
		},
		filesize : function(bytes, si) {
			var thresh = si ? 1000 : 1024;
			if (Math.abs(bytes) < thresh) {
				return bytes + ' B';
			}
			var units = si ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
			var u = -1;
			do {
				bytes /= thresh; ++u;
			} while(Math.abs(bytes) >= thresh && u < units.length - 1);
			return bytes.toFixed(1) + ' ' + units[u];
		},
		humanCoState : {
			CONNECTED : {
				text : 'Connecté',
				state : 'OK'
			},
			NOT_CONNECTED : {
				text : 'Déconnecté',
				state : 'WARNING'
			},
			NOT_RESPONDING : {
				text : 'Injoignable',
				state : 'ERROR'
			}
		},

		humanPowerState : {
			POWERED_ON : {
				text : 'Allumé',
				state : 'OK'
			},
			POWERED_OFF : {
				text : 'Éteint',
				state : 'ERROR'
			},
			STANDBY : {
				text : 'En veille',
				state : 'WARNING'
			},
			CHANGING : {
				text : 'Incertain',
				state : 'WARNING'
			}
		},

		userType : {
			ADMIN : 'Administrateur',
			REFERENT : 'Référent',
			STUDENT : 'Étudiant'
		},

		userColumns : {
			type : 'Type',
			common_name : 'Nom',
			login : 'Login'
		},

		eventType : {
			CREATE : 'Création',
			EDIT : 'Édition',
			DELETE : 'Suppression',
			POWER_ON : 'Allumage',
			POWER_OFF : 'Extinction',
			RESET : 'Ré-allumage',
			SUPSEND : 'Suspension',
			CLONE : 'Clonage',
			EXPORT : 'Exportation',
			IMPORT : 'Importation'
		},

		eventColumns : {
			creation_date : 'Date',
			displayUserName : 'Utilisateur',
			displayObjectName : 'Objet'
		},

		eventObject : {
			USER : 'Utilisateur',
			GROUP : 'Groupe',
			VM : 'Machine virtuelle',
			NETWORK : 'Réseau'
		}
	},
	html : {
		fa : {
			loader : '<i class="fa fa-2x fa-circle-o-notch fa-spin"/>',
			error : '<i class="fa fa-2x fa-times"/>'
		},
		color : {
			OK : '#24902d',
			WARNING : '#f6a800',
			ERROR : '#a51d0c'
		},
		userTypeIcon : {
			ADMIN : 'fa fa-fw fa-user-secret',
			STUDENT : 'fa fa-fw fa-graduation-cap',
			REFERENT : 'fa fa-fw fa-user-md'
		},
		eventTypeIcon : {
			CREATE : 'fa fa-fw fa-plus',
			EDIT : 'fa fa-fw fa-cog',
			DELETE : 'fa fa-fw fa-trash',
			POWER_ON : 'fa fa-fw fa-power-off',
			POWER_OFF : 'fa fa-fw fa-power-off',
			RESET : 'fa fa-fw fa-power-off',
			SUPSEND : 'fa fa-fw fa-power-off',
			CLONE : 'fa fa-fw fa-clone',
			EXPORT : 'fa fa-fw fa-download',
			IMPORT : 'fa fa-fw fa-plus'
		},
		eventObjectIcon : {
			USER : 'fa fa-fw fa-user',
			GROUP : 'fa fa-fw fa-users',
			VM : 'fa fa-fw fa-desktop',
			NETWORK : 'fa fa-fw fa-sitemap'
		}
	},
	config : {
		logsByPage : 50
	}
};

var date = {
	prettyDate : function(strdate) {
		var diff = (new Date() - new Date(strdate)) / 1000;

		if (diff < 60)
			return 'Maintenant';

		diff /= 60;

		if (diff < 2)
			return 'Il y a une minute';
		if (diff < 60)
			return 'Il y a ' + Math.floor(diff) + ' minutes';

		diff /= 60;

		if (diff < 2)
			return 'Il y a une heure';
		if (diff < 24)
			return 'Il y a ' + Math.floor(diff) + ' heures';

		diff /= 24;

		if (diff < 2)
			return 'Il y a un jour';
		if (diff < 7)
			return 'Il y a ' + Math.floor(diff) + ' jours';
		if (diff < 14)
			return 'Il y a une semaine';
		if (diff < 30.5)
			return 'Il y a ' + Math.floor(diff / 7) + ' semaines';
		if (diff < 61)
			return 'Il y a un mois';
		if (diff < 365.25)
			return 'Il y a ' + Math.floor(diff / 30.5) + ' mois';

		diff /= 365.25;

		if (diff < 2)
			return 'Il y a un ans';

		return 'Il y a ' + Math.floor(diff) + ' ans';
	},
	reformatDate : function(strdate) {
		var date = new Date(strdate);
		return 'à ' + date.toLocaleTimeString() + ' le ' + date.toLocaleDateString();
	}
};

Vue.component('selectlist', {
	template : '#select-list-template',
	props : {
		list : Object,
		value : ''
	},
	data : function() {
		return {

		};
	},
	computed : {

	},
	methods : {
		updateValue : function(value) {
			this.$emit('input', value);
		}
	}
});
