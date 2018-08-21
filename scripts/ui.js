var apps = {};

var app = {
	start : function() {
		app = new Vue(this.conf);
	},
	conf : {
		el : '#app-vsquare',
		data : {
			user : {
				cn : cookies.get('cn'), //common_name, displayed in the nav bar
				admin : cookies.get('user_type') === 'ADMIN' //is admin ? (will change displaying of elements)
			},
			//help window available in all apps but the dashboard
			help : {
				show : false,
				content : '',
				ignoredApps : {
					dashboard : true
				}
			},
			currentApp : null, //pointer to the currentApp, used to access it dynamically from the global scope
			currentAppId : '', //current app id as a string : 'dashboard' | 'vms' | 'groups' | 'hypervisors' | 'datacenters' | 'logs'
			rightPanel : true,
			lastClicked : {//handler to the lastClicked button bearing a v-sq-loader attribute
				el : null,
				oldIco : ''
			}
		},
		methods : {
			loadApp : function(event) {

				//Called by navigation through the dashboard or the nav bar
				//can be called with a DOM event object bearing a x-app attribute or directly the id of the app to load

				if ( typeof event !== 'string') {
					var el = event.target;
					while (el.attributes['x-app'] === undefined) {
						el = el.parentNode;
					}
					this.currentAppId = el.attributes['x-app'].value;
				} else {
					this.currentAppId = event;
				}
				//Non-admin users get access to the vms app only
				if (!this.user.admin && this.currentAppId !== 'vms') {
					return;
				}

				console.log('APP : ' + this.currentAppId);

				//get rid of the previous app
				if (this.currentApp !== null && this.currentApp.$el) {
					this.currentApp.$destroy();
					this.currentApp.$el.childNodes.forEach(function(panel) {
						$(panel).empty();
					});
					this.currentApp = null;
				}

				this.rightPanel = true;
				//reset the rightPanel
				this.help.show = false;
				//hide help modal
				this.currentApp = new Vue(apps[this.currentAppId]);
				//create the Vue instance of the app (all stored in the global apps object)

				document.title = 'vSquare | ' + misc.humanize.appsName[this.currentAppId];
				//update tab title via humanizing functions (in globals.js)

				if (this.currentAppId === 'vms')
					this.currentApp.currentVM = null;

			},

			displayHelp : function() {
				var self = this;

				if (!self.help.show)
					$.get('./help/' + self.currentAppId + '.html', function(data) {
						data += '<div class="scroll-spacer"></div>';
						self.help.content = data;
						self.help.show = !self.help.show;
					});
				else
					self.help.show = !self.help.show;

			},

			logout : function() {
				console.log('Logging out ...');

				ajax.call('DELETE', '/auth/logout');
				cookies.delete('X-Token');
				cookies.delete('cn');
				cookies.delete('user_type');
				misc.redirect('./');

			},
			notify : function(msg, type, object, position) {
				if (object === undefined && type === undefined && position === undefined) {
					$.notify(msg);
				} else if (object === undefined && position === undefined) {
					$.notify(msg, type);
				} else if (position === undefined) {
					$(object).notify(msg, type);
				} else {
					$(object).notify(msg, {
						className : type,
						position : position
					});
				}
				if (this.lastClicked.el) {
					this.lastClicked.el.children[0].className = this.lastClicked.oldIco;
					this.lastClicked.el = null;
				}
			},
			getNotifyAnchor : function(event) {
				var el = event.target;
				while (el.parentNode && el.nodeName !== 'BUTTON') {
					el = el.parentNode;
				}
				return el;
			}
		},
		beforeCreate : function() {
			var self = this;
			var len = $('.tmpl').length;

			$('.tmpl').each(function(i) {
				var el = this;
				var templateId = this.attributes.id.value;
				templateId = templateId.substr(0, templateId.length - 9);
				$.get('./templates/' + templateId + '.html', function(data) {
					$(el).html(data);

					if (i === len - 1) {
						if (self.user.admin) {
							self.loadApp('dashboard');
						} else {
							self.loadApp('vms');
						}
					}

				});
			});
		}
	}
};

Vue.directive('sq-loader', {
	bind : function(el) {
		el.addEventListener('click', function() {
			app.lastClicked.el = el;
			app.lastClicked.oldIco = el.children[0].className;
			el.children[0].className = 'fa fa-fw fa-circle-o-notch fa-spin';
		});
	}
});

Vue.component('loader', {
	template : '#vsquare-loader-template'
});

Vue.component('vsqprogress', {
	template : '#progress-template'
});

$.notify.defaults({
	className : 'success',
	position : 'right bottom'
});

function charge() {
	var t1 = new Date().getTime();
	var i = 0;
	var tries = 300;
	for (var k = 0; k < tries; k++) {
		ajax.call('GET', '/vm', function(data) {
			i++;
			if (i === tries - 1) {
				var t2 = new Date().getTime();
				console.log('done in : ', (t2 - t1) / 1000, 'seconds' );
				console.log('that is ', tries / ((t2 - t1) / 1000), 'req/seconds');
			}
		});
	}

}

