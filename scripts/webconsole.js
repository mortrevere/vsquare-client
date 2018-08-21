$(function() {
	//adapted from the original vSphere code
	
	var container = $('#container');

	var wmks = WMKS.createWMKS('container', {}).register(WMKS.CONST.Events.CONNECTION_STATE_CHANGE, function(event, data) {
		if (data.state === WMKS.CONST.ConnectionState.CONNECTED) {
			console.log('connection state change : connected');
		}
	});

	function layout() {
		var w = $(window).width();
		var h = $(window).height();

		container.width(w).height(h - 64 - 16);
		wmks.updateScreen();

	}

	//listen for window events
	$(window).on('resize', layout);

	console.log(window.location.hash);

	var str = decodeURIComponent(window.location.hash.substr(1));
	var s = {};

	s.host = str.split(':')[0];
	s.ticket = str.split(':')[1];
	console.log(s);
	window.location.hash = '';

	//set to french
	wmks.setOption('keyboardLayoutId', 'fr-FR');
	wmks.connect('wss://' + s.host + ':443/ticket/' + s.ticket);
	//wmks.connect('wss://192.168.4.242:8443/proxy/webmks?host=' + s.host + '&ticket=' + s.ticket);

	var app = new Vue({
		el : '#app-vsquare',
		data : {
			user : {
				cn : cookies.get('cn'),
				admin : cookies.get('user_type') === 'ADMIN'
			},
			functionKeyCode : 111,
			controlKeyCode : ''
		},
		methods : {
			//some combinations of keys are reserved and not catchable in a browser context
			//so we make them sendable by hand with buttons and select fields (see template)
			sendFunctionKey : function() {
				wmks.sendKeyCodes([17,18,parseInt(this.functionKeyCode)]);
			},
			sendControlKey : function() {
				wmks.sendKeyCodes([17,this.controlKeyCode.charCodeAt(0)]);
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
			},
			quit : function() {
				if (confirm('Êtes vous sûr de vouloir quitter la console ?'))
					window.close();
			},
			home : function() {
				if (confirm('Êtes vous sûr de vouloir quitter la console ?'))
					misc.redirect('./');
			},
			CAD : function() {
				wmks.sendCAD();
			}
		}
	});
	//useful events to improve and debug
	wmks.register(WMKS.CONST.Events.CONNECTION_STATE_CHANGE, function(evt, data) {
		switch (data.state) {
		case WMKS.CONST.ConnectionState.CONNECTING:
			app.notify('Connexion en cours ...', 'info');
			break;
		case WMKS.CONST.ConnectionState.CONNECTED:
			app.notify('Connecté !', 'success');
			break;
		case WMKS.CONST.ConnectionState.DISCONNECTED:
			app.notify('La console a été déconnectée. Pour vous reconnecter, fermez la fenêtre et relancez la console.', 'error');
			break;
		}
	});

	wmks.register(WMKS.CONST.Events.ERROR, function(evt, data) {
		console.log('Error: ' + data.errorType);
	});

	wmks.register(WMKS.CONST.Events.REMOTE_SCREEN_SIZE_CHANGE, function(evt, data) {
		console.log(evt, data);
		layout();
	});

});

$.notify.defaults({
	className : 'info',
	position : 'right bottom'
});
