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

// Starting function once all logs have been assigned configuration values and are ready for processing
function processLogSources(){
	
	// Loop through the log sources and process them one by one (not the first one though, that's a template)
	$.each($('#log-sources-wrapper li.log-sources:not(:first)'), function(index, logSourceRow){
		
		logSourceRow = $(logSourceRow);
		logSourceData = logSourceRow.data('logSource');
		
		// Determine whether it's a local file or a url
		if(logSourceData.currentSource == "file"){
			
			console.log("Fetching file"); //debug
			
			fetchLogFromFile(logSourceRow, function(data){
			
				console.log(data); //debug
			});
			
		}else if(logSourceData.currentSource == "url"){
			
		}
		console.log(logSourceRow.data()); //debug
	});
}


function fetchLogFromFile(logSourceRow, callback){

	var files = logSourceRow.find('input[name=logFile]').get(0).files;
		
	// Check there are files selected
	if(files.length == 0){
		return;
	}
	
	
	// Build the string from the file in pieces, to prevent hanging
	readLocalFileSlice(files[0], function(data){
			console.log(data);
		// Append 
		$(logSourceRow).data('logSource').raw += data;
		
	});
		
	
	
}

function readLocalFileSlice(file,  callback, startBytes, data){
	
	var chunkSliceSize = 2000;
	var startBytes = typeof(startBytes) == "undefined" ? 0 : startBytes;
	var endBytes = startBytes+chunkSliceSize;
	var reader = new FileReader();
	
	// Check our slice doesn't go past the end of the file, just read to the end if it is
	endBytes = (endBytes < file.size) ? endBytes : file.size+1;
	
	// Once the slice has finished pass it on to the validation function
	reader.onloadend = function(evt) {
	  if (evt.target.readyState == FileReader.DONE) { // DONE == 2
		
		// Have we finished?
		if(endBytes >= file.size){
		
			// Send the data to the callback
			callback(data+evt.target.result);
		}else{
		
			// Read the next section
			readLocalFileSlice(file, callback, endBytes,  data+evt.target.result);
		}
	  }
	};
	
	// Fire off the slice
	var blob = file.slice(startBytes, endBytes);
	reader.readAsBinaryString(blob);
}
