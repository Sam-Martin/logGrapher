function fetchLocalLogPreview(formElement, callback){
	// Fetch preview from local file
		
	var startBytes = 0;
	var endBytes = 500;
	var files = formElement.get(0).files;
	var reader = new FileReader();
	
	// Check there are files selected
	if(files.length == 0){
		return;
	}
	
	// Get the first (hopefully only!) file
	var file = files[0];
	
	
	// Check our preview isn't longer than the actual file and just read to the end if it is
	endBytes = (endBytes < file.size) ? endBytes : file.size;

	// Once the slice has finished pass it on to the validation function
	reader.onloadend = function(evt) {
	  if (evt.target.readyState == FileReader.DONE) { // DONE == 2
		
		// Send the data to the callback
		callback(evt.target.result, formElement);
	  }
	};
	
	// Fire off the slice
	var blob = file.slice(startBytes, endBytes + 1);
	reader.readAsBinaryString(blob);
}

function fetchURLLogPreview(formElement, callback){
	
	// Fetch a preview from a remote URL
	var fileURL = formElement.val();
	$.ajax(fileURL, {
		
		// Listen in on progress
		xhr: function(){
			var xhr = new window.XMLHttpRequest();

			
			// Check to see how many lines we have
			xhr.addEventListener("progress", function(evt){
				
				try{
					var numLines = (evt.srcElement.response).match(/[\r\n]/g).length;
				}catch(e){return;}
				
				if(numLines > 1){
				
					// Okay, we've got a couple of lines of data, send it back to the callback for processing
					callback(evt.srcElement.response, formElement);
				}
				
				// Cancel the download, we don't need the whole thing, just the first few lines to show the user.
				xhr.abort();
				
			}, false);
			return xhr;
		}, 
		error: function(){
			callback(false);
			
		}
	})

	
}