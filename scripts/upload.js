var Upload = function(file, progressComponentId) {
	this.file = file;
	this.progressComponentId = progressComponentId;
	this.lastPercent = 0;
	console.log(this.progressComponentId);
};

Upload.prototype.getType = function() {
	return this.file.type;
};
Upload.prototype.getSize = function() {
	return this.file.size;
};
Upload.prototype.getName = function() {
	return this.file.name;
};

Upload.prototype.progressHandling = function(event, self) {
	var percent = 0;
	var position = event.loaded || event.position;
	var total = event.total;

	if (event.lengthComputable) {
		percent = Math.ceil(position / total * 100);
	}
	// update progressbars classes so it fits your code
	//console.log(self.progressComponentId + ' .progress-bar', percent);
	if (percent !== self.lastPercent) {
		$(self.progressComponentId + ' .vsq-progress-bar').css('background', 'linear-gradient(90deg,' + misc.html.color.OK + ' ' + percent + '%, #FFF ' + percent + '%)');
		$(self.progressComponentId + ' .vsq-progress-bar .status').text(percent + '%');
		if(percent > 24) {
			$(self.progressComponentId + ' .vsq-progress-bar').addClass('white');
		}
	}
	self.lastPercent = percent;
};

Upload.prototype.doUpload = function(URL, fileField, data, cb, errorcb) {
	var formData = new FormData();
	var self = this;
	console.log( typeof this.file, this.file);

	formData.append(fileField, this.file, this.getName());
	Object.keys(data).forEach(function(param) {
		if ( typeof data[param] === 'string')
			formData.append(param, data[param]);
	});

	$.ajax({
		type : 'POST',
		url : ajax.base + URL,
		xhr : function() {
			var myXhr = $.ajaxSettings.xhr();
			if (myXhr.upload && self.progressComponentId) {
				console.log('validated progress bar');
				myXhr.upload.addEventListener('progress', function(event) {
					self.progressHandling(event, self);
				}, false);
			}
			return myXhr;
		},
		success : function(data) {
			//data = JSON.parse(data);
			cb(data.value);
		},
		error : function(error) {
			if (errorcb)
				errorcb(error);
			console.log(error);
		},
		headers : {
			'X-Token' : cookies.get('X-Token')
		},
		async : true,
		data : formData,
		cache : false,
		contentType : false,
		processData : false,
		timeout : 60000
	});
};
/* Unused but kept for later when we add progress bars to file upload */

