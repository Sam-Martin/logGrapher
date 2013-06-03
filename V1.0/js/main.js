function startGraphing() {
	$('.hero-unit').slideUp();
	$('main').slideDown();
}

function elementAttachedPopover(element, title, message){
	
	// Set popover options
	$(element).popover({
		placement: "top",
		animation: "fade",
		title: title,
		content: message
	}).popover("show"); // Show popover
	
	// Hide after 5 seconds
	setTimeout(function(){
		$(element).popover("destroy");
	}, 5000);
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

function configureLogSource(ev){
	
	
	// Get logSourceRow
	var logSourceRow = $(ev.srcElement).parents('.log-sources');
	
	if(!(logPreview = logSourceRow.data('logPreview'))){
		
		// Show error
		elementAttachedPopover(ev.srcElement, "Error", "Please select a valid log source");
		
		// Cancel the wedding!
		return;
	}
	
	// Populate the table from the log source
	var logPreviewTableBody = '';
	
	// Figure out how many columns in the longest row for formatting purposes
	var longestRow = 0;
	for(var i = 0; i < logPreview.length;i++){
		longestRow =  (logPreview[i].length > longestRow) ?  logPreview[i].length : longestRow;
	}
	
	// Table Body
	// Loop through each row up to a max of 10 (unless we get to the last in the preview, as it's probably incomplete)
	for(var i = 0; i < logPreview.length-1 && i<=10;i++){
		
		logPreviewTableBody += "<tr>\r\n\t<td><strong>"+i+"</strong></td>\r\n\t";
		
		// Loop through each column
		for(var x=0; x < logPreview[i].length; x++){
			
			logPreviewTableBody+= "\t<td";
			
			// If this row is has fewer columns than the longest, span the last column to make up the difference
			logPreviewTableBody+= (logPreview[i].length < longestRow && x == logPreview[i].length-1) ? ' colspan="'+(longestRow-logPreview[i].length +1 )+'">' : '>';
			
			logPreviewTableBody +=logPreview[i][x]+"</td>\r\n";
		}
		
		logPreviewTableBody+='</tr>\r\n';
		
	}
	
	// Add a row indicating that this is a preview
	logPreviewTableBody+='<tr class="warning">\r\n\t<td colspan="'+(longestRow+1)+'">Preview Only...</td>\r\n</tr>';
	
	// Input the table body
	$('#log-sources-settings-modal tbody').html(logPreviewTableBody);
	
	// Table Header
	// Loop through the longest row and generate the header
	logPreviewTableHeader = '<tr>\r\n\t<td>&nbsp;</td>\r\n';
	for(var i=0; i<=longestRow-1;i++){
		
		logPreviewTableHeader += "\t<th>"+String.fromCharCode(i+65)+"<br/>\r\n";
		// Add the selection buttons
		logPreviewTableHeader += '<div class="btn-group btn-group-vertical" style="min-width:100px;width:100%">\r\n\t'+
			'<button class="btn btn-block" value="Timestamp" onClick="selectLogSourceProperty(event)">Timestamp</button>\r\n\t'+
			'<button class="btn btn-block" value="Value" onClick="selectLogSourceProperty(event)">Value</button>\r\n\t'+
			'<button class="btn btn-block" value="Label" onClick="selectLogSourceProperty(event)">Label</button>\r\n</div>\r\n'+
			'</th>\r\n';
	}
	
	logPreviewTableHeader+='</tr>';
	
	// Input the table Header
	$('#log-sources-settings-modal thead').html(logPreviewTableHeader);	
	
	
	
	$('#log-sources-settings-modal').modal('show');
}

// Handle assignment of log source property (e.g. the user has selected a column as timestamp)
function selectLogSourceProperty(ev){
	
	var formElement = $(ev.srcElement);
	var property = formElement.val();
	
	if(formElement.data('logSourceAttribute')){
		
		// Deselect this attribute
		formElement.removeClass('btn-primary');
		
		// Show the others!
		formElement.parents('tr').find('button[value='+property+']').not(formElement).show();
		
		// Set its data property to deselected
		formElement.data('logSourceAttribute', false);
	}else{

		// Make it primary
		formElement.addClass('btn-primary');
		
		// Hide the others!
		formElement.parents('tr').find('button[value='+property+']').not(formElement).hide();
		
		// Set its data property to selected
		formElement.data('logSourceAttribute', true);
	}
}

function fetchLogSourcePreview(ev){

	var formElement = $(ev.srcElement);
	var parent;
	
	// Add a spinner
	formElement.parents('label').prepend('<i class="icon-spinner icon-spin pull-right"></i> '); //debug

	if(formElement.is(':file')){
		
		// Fetch preview from local file
		fetchLocalLogPreview(formElement, validateLogPreview);
		
	}else{

		// Send off the partial HTTP request
		fetchURLLogPreview(formElement, validateLogPreview);
	}
}

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

// Function that checks to see if the file the user has given us is a valid CSV
function validateLogPreview(logPreview, formElement){
	

	// Handle a failure to return valid data
	if(!logPreview){
		inputError(formElement, "Could not access file");
		return;
	}
	
	// Okay, we have some data, but is it valid?
	// Try parsing the data as a CSV
	try{
	
		var logPreviewArray = jQuery.csv.toArrays(logPreview);
	
	}catch(err){
	
		// Show the error
		inputError(formElement, "Failed to parse file");
		
		// Remove the spinner
		formElement.parents('label').find('i.icon-spinner').remove();
		return false;
	}

	// Show the success
	inputSuccess(formElement);
	
	// Prompt to configure the CSV
	elementAttachedPopover(formElement.parents('.log-sources').find('.configureLogSource').addClass('btn-primary'), "Success", "Please configure log source");
	
	// Add the preview array to the log source row
	$(formElement).parents('.log-sources').data('logPreview', logPreviewArray);
	
	// Remove the spinner
	formElement.parents('label').find('i.icon-spinner').remove();
	
	return logPreviewArray;
	
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