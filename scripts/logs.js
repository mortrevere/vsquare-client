Vue.component('logs', {
	template : '#logs-template',
	props : {
		model : Object
	},
	data : function() {
		return {
			currentSearchQuery : undefined,
			searchQuery : '',
			gridColumns : [],
			gridData : [],
			totalCount : 0,
			page : 0
		};
	},
	methods : {
		goFirstPage : function() {
			var self = this;
			self.$parent.loadLogs(0, self.currentSearchQuery);
		},
		goFastPreviousPage : function() {
			var self = this;
			self.$parent.loadLogs(Math.max(0, this.page - 10), self.currentSearchQuery);
		},
		goPreviousPage : function() {
			var self = this;
			self.$parent.loadLogs(this.page - 1, self.currentSearchQuery);
		},
		goNextPage : function() {
			var self = this;
			self.$parent.loadLogs(this.page + 1, self.currentSearchQuery);
		},
		goFastNextPage : function() {
			var self = this;
			self.$parent.loadLogs(Math.min(this.totalPage - 1, this.page + 10), self.currentSearchQuery);
		},
		goLastPage : function() {
			var self = this;
			self.$parent.loadLogs(this.totalPage - 1, self.currentSearchQuery);
		},
		search : function() {
			var self = this;
			self.currentSearchQuery = self.searchQuery.trim();
			self.goFirstPage();
		}
	},
	created : function() {

	},
	computed : {
		notSelected : function() {
			return this.gridData === null;
		},
		empty : function() {
			return this.gridData.length === 0;
		},
		totalPage : function() {
			return Math.ceil(this.totalCount / misc.config.logsByPage);
		},
		lastPage : function() {
			return this.page + 1 >= this.totalPage;
		},
		firstPage : function() {
			return this.page <= 0;
		}
	}
});

Vue.component('logs-grid', {
	template : '#logs-grid-template',
	props : {
		data : Array,
		columns : Array
	},
	data : {
	},
	computed : {

	},
	filters : {

	},
	methods : {
		copyText : function(text) {
			if (misc.copyToClipboard(text)) {
				app.notify('Copié dans le presse-papier', 'success');
			} else {
				app.notify('Impossible de copier le texte', 'error');
			}
		}
	}
});

var data = {
	displayName : 'Journaux',
	root : true,
	children : [{
		displayName : 'Événements',
		root : false,
		children : []
	}, {
		displayName : 'Erreurs',
		root : false,
		children : []
	}]
};

apps.logs = {
	el : '#current-app',
	data : {
		treeData : data,
		eventViewing : true
	},
	methods : {
		loadEventLogs : function(page, query) {
			var self = this;
			var url = '/log/events?page=' + page + '&page_size=' + misc.config.logsByPage;
			if (query && query.length > 0)
				url += '&query=' + query;
			ajax.call('GET', url, function(data) {
				self.$refs.logs.totalCount = data.total_count;
				self.$refs.logs.page = page;
				//self.$refs.logs.searchQuery = undefined;
				//self.$refs.logs.currentSearchQuery = undefined;
				self.$refs.logs.gridData = misc.datapipe.eventLogs(data.list);
				self.$refs.logs.gridColumns = ['creation_date', 'displayUserName', 'action', 'objectType', 'displayObjectName'];
				self.eventViewing = true;
			});
		},
		loadErrorLogs : function(page, query) {
			var self = this;
			var url = '/log/errors?page=' + page + '&page_size=' + misc.config.logsByPage;
			if (query && query.length > 0)
				url += '&query=' + query;
			ajax.call('GET', url, function(data) {
				self.$refs.logs.totalCount = data.total_count;
				self.$refs.logs.page = page;
				self.$refs.logs.gridData = misc.datapipe.errorLogs(data.list);
				self.$refs.logs.gridColumns = ['creation_date', 'displayUserName', 'error'];
				self.eventViewing = false;
			});
		},
		clickTree : function(item) {
			if (item.model.displayName === 'Événements') {
				this.loadEventLogs(0);
			} else if (item.model.displayName === 'Erreurs') {
				this.loadErrorLogs(0);
			}
		},
		loadLogs : function(page, query) {
			if (this.eventViewing)
				this.loadEventLogs(page, query);
			else
				this.loadErrorLogs(page, query);
		}
	},
	created : function() {
		this.loadLogs(0);
		$('#left-panel').append('<div id="tree"><ul><item class="item" :model="treeData"></item></ul></div>');
		$('#middle-panel').append('<logs ref="logs"></logs>');
	}
};
