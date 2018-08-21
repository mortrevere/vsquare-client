/* jshint unused : false */

// Useful class to manage cookies without importing anything too heavy
// Defines set, get and delete and is accessible everywhere via the 'cookies' global

function Cookies() {
	this.set = function(name, value, days, path) {
		if (days === undefined)
			days = 7;
		if (path === undefined)
			path = '/';

		var expires = new Date(Date.now() + days * 864e5).toUTCString();
		document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=' + path;
	};

	this.get = function(name) {
		return document.cookie.split('; ').reduce(function(r, v) {
			var parts = v.split('=');
			return parts[0] === name ? decodeURIComponent(parts[1]) : r;
		}, '');
	};

	this.delete = function(name, path) {
		if (path === undefined)
			path = '/';
		this.set(name, '', -1, path);
	};

}

var cookies = new Cookies();