//different app from the other, not integrated in the whole framework but as another application on its own
//- it handle the credentials of the user
//- tries to get a valid auth token from the server
//- store it in a cookie or display that it failed
//- redirect the user to the actual vSquare application
  
new Vue({
	el : '#app-login',
	data : {
		username : '',
		password : '',
		submitButtonContent : 'Connexion',
		showNotif : false,
		notification : ''
	},
	methods : {
		login : function(event) {
			if (this.username === '' || this.password === '') {
				return;
			}

			var self = this;
			self.submitButtonContent = misc.html.fa.loader;

			var auth = {
				username : self.username,
				password : self.password
			};

			ajax.call('POST', '/auth/login', auth, function(data) {
				if (data.token) {
					//store token, name and user type to be reused by the main application
					cookies.set('X-Token', data.token);
					cookies.set('cn', data.common_name);
					cookies.set('user_type', data.user_type);
					misc.redirect('./');
				}
			}, function(xhr) {
				self.submitButtonContent = misc.html.fa.error;
				setTimeout(function() {
					self.submitButtonContent = 'Connexion';
				}, 1500);

				self.notification = 'Erreur lors de la connexion.';

				if (xhr.status === 401) {//wrong creds
					self.notification = 'Couple identifiant/mot de passe invalide';
				}

				self.showNotif = true;
			});

			if (event) {
				console.log(event.target.tagName);
			}
		}
	}
});
