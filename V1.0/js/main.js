function startGraphing() {
	$('.hero-unit').slideUp();
	$('main').slideDown();
}

function toggleUrlFileInput(ev, type){
	
	// Get logSourceRow
	var logSourceRow = $(ev.srcElement).parents('.log-sources');
		
	// Show the configure source button
	logSourceRow.find('.log-sources-source-settings').css('display', 'inline-block');
	
	// Remove any other button primary from this button group
	logSourceRow.find('.btn-inverse').removeClass('btn-inverse');
	
	// Make clicked button primary
	$(ev.srcElement).addClass('btn-inverse');
	
	if(type=="url"){
		logSourceRow.find('.log-sources-source-url').css('display', 'inline-block');
		logSourceRow.find('.log-sources-source-file').hide();
	}else{
		logSourceRow.find('.log-sources-source-url').hide();
		logSourceRow.find('.log-sources-source-file').css('display', 'inline-block');
	}
	
}
	
// Add new log source
function addLogSource(){
	
	// Clone it 
	$('#log-sources-wrapper > .log-sources:first').clone()
		.appendTo('#log-sources-wrapper') // Add it into the form
		.slideDown(); // Show it
}

// Delete log source
function deleteLogSource(ev){
	
	var undoTimer = 5000; // Five seconds to undo the deletion!
	var undoButton;
	
	// Find any other log sources with pending deletions and finish them off 
	$('#log-sources-wrapper [data-pending-deletion=true]').remove();
	
	
	// Slide up and detach the log source in question
	var lastDeletedLogSource = $(ev.srcElement).parents('.log-sources');
	lastDeletedLogSource.data('pendingDeletion', true).slideUp(function(){$(this).detach();});
	
	// Unbind any previous clicks
	undoButton = $('#log-sources-delete-source-button').fadeIn().unbind("click");
	
	// Bind undo action to undo button
	undoButton.click(function(){
		
		// Cancel any currently running animations
		lastDeletedLogSource.stop()
			.data('pendingDeletion', false); // Cancel the pending deletion;
		
		// If there it's not yet detatched, just show it
		if(lastDeletedLogSource.parents('html').length > 0 ){
			
			// Unhide that log source
			lastDeleted.slideDown(); 
		}else{
			
			// Otherwise, add it back in
			lastDeletedLogSource.appendTo('#log-sources-wrapper');
			lastDeletedLogSource.hide().slideDown();
		}
		
		// Hide the undo button
		undoButton.fadeOut();
		
	});
	
	// After the specified amount of time, if the deletion hasn't been cancelled, remove it permanently
	setTimeout(function(){
		
		if(lastDeletedLogSource.data('pendingDeletion')){
			lastDeletedLogSource.remove();
			// Remove the undo button
			undoButton.fadeOut();
		}
	}, undoTimer);
	
}

function configureLogSource(){
	$('#log-sources-settings-modal').modal('show');
}

function fetchLogSourcePreview(ev){

	var formElement = $(ev.srcElement);
	var parent;
	var startBytes = 0;
	var endBytes = 500;
	
	if(formElement.is(':file')){
		
		// Fetch preview from local file
		
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
		
			validateFilePreview(evt.target.result, formElement);
			
		  }
		};
		
		// Fire off the slice
		var blob = file.slice(startBytes, endBytes + 1);
		reader.readAsBinaryString(blob);
		
		
	}else{
		
		// Fetch a preview from a remote URL
		var fileURL = formElement.val();
		
		// Send off the partial HTTP request
	
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
					
						// Okay, we've got a couple of lines of data, stop the download and let's see if we can parse it
						validateFilePreview(evt.srcElement.response, formElement);
						xhr.abort();
					}
				}, false);
				return xhr;
			}, 
			error: function(){
				inputError(formElement, "Could not access file");
			}
		})
	}
	
}

// Function that checks to see if the file the user has given us is a valid CSV
function validateFilePreview(filePreview, formElement){
	
	try{
		var filePreviewArray = jQuery.csv.toArrays(filePreview);
	}catch(err){
		// Show the error
		inputError(formElement, "Failed to parse file");
		return;
	}
	
	if(filePreviewArray.length > 1){
		
		// Show the success
		inputSuccess(formElement)
		
		// Add the preview array to the row
		$(formElement).parents('.log-sources').data('filePreview', filePreview);
		
	}else{
		
		// Show the error
		inputError(formElement, "Failed to parse file");
	}
	
}

function inputSuccess(formElement, successMessage){

	// Add success class to form element's control group
	$(formElement).parents('.control-group').removeClass('error').addClass('success');
	
	// If there is one, show the succes message
	if(successMessage){
		// Set popover options
		$(formElement).popover({
			placement: "top",
			animation: "fade",
			title: "Success",
			content: successMessage
		}).popover("show"); // Show popover
		
		// Hide after 5 seconds
		setTimeout(function(){
			$(formElement).popover("destroy");
		}, 5000);
	}
}

// Display an error on a form element
function inputError(formElement, errMessage){
	
	// Add error class to form element's control group
	$(formElement).parents('.control-group').removeClass('success').addClass("error");
	
	// Set popover options
	$(formElement).popover({
		placement: "top",
		animation: "fade",
		title: "Error",
		content: errMessage
	}).popover("show"); // Show tooltip
	
	// Hide after 5 seconds
	setTimeout(function(){
		$(formElement).popover("destroy");
	}, 5000);
		
}

$(document).ready(function(){

	// Add the initial log source
	addLogSource();
	
});