//recursive item component defining tree navigation structure used everywhere
Vue.component('item', {
	template : '#item-template',
	props : {
		model : Object
	},
	data : function() {
		return {
			open : this.model.root === true,
			selected : false
		};
	},
	computed : {
		//values used in the item template to modify its DOM
		isFolder : function() {
			//if the children attribute is an array, treat as folder (enable +/- feature)
			return this.model.children && this.model.children.length;
		},
		selectable : function() {
			//make some elements unselectable
			return !this.model.root;
		}
	},
	methods : {
		toggle : function() {
			//callback in the current app so it can handle clicks on the tree structure
			if (app.currentApp.clickTree)
				app.currentApp.clickTree(this);

			//toggle opening of a folder
			if (this.isFolder) {
				this.open = !this.open;
			}
		},
		//unused but kept for later if we want to add modification to the structure
		changeType : function() {

			if (!this.isFolder) {
				Vue.set(this.model, 'children', []);
				this.addChild();
				this.open = true;
			}
		},
		addChild : function() {
			this.model.children.push({
				name : 'new stuff'
			});
		}
	}
});
