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
		
		logSourceRow.data('logSource').currentSource = "url";
		logSourceRow.find('.log-sources-source-url').css('display', 'inline-block');
		logSourceRow.find('.log-sources-source-file').hide();
	}else{
		
		logSourceRow.data('logSource').currentSource = "file";
		logSourceRow.find('.log-sources-source-url').hide();
		logSourceRow.find('.log-sources-source-file').css('display', 'inline-block');
	}
	
}
	
// Add new log source
function addLogSource(){
	
	// Model the log source data we're going to create
	function logSourceDataModel(){
		this.config ={
			indices: {
				timestampIndex: -1,
				valueIndex: -1,
				labelIndex: -1
			}
		}
		this.currentSource = "file";
		this.preview = null;
	};
		 
	// Clone it 
	$('#log-sources-wrapper > .log-sources:first').clone()
		.data('logSource', new logSourceDataModel) // Initialise the data
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
	
	// Stop the undo button being hidden prematurely
	clearInterval(undoButton.data('timer'));
	
	
	// Bind undo action to undo button
	undoButton.click(function(){
		
		// Cancel any currently running animations
		lastDeletedLogSource.stop()
			.data('pendingDeletion', false); // Cancel the pending deletion;
		
		// If there it's not yet detached, just show it
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
	undoButton.data('timer', setTimeout(function(){
			
			if(lastDeletedLogSource.data('pendingDeletion')){
				lastDeletedLogSource.remove();
				// Remove the undo button
				undoButton.fadeOut();
			}
		}, undoTimer)
	);
	
}

function configureLogSource(ev){
	
	var modal = $('#log-sources-settings-modal');
	var logPreviewTable = modal.find('table');
	
	// Get logSourceRow
	var logSourceRow = $(ev.srcElement).parents('.log-sources');
	
	// Check we have log preview data
	if(!(logPreview = logSourceRow.data('logSource').preview)){
		
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
	logPreviewTable.find('tbody').html(logPreviewTableBody);
	
	// Table Header
	// Loop through the longest row and generate the header
	logPreviewTableHeader = '<tr>\r\n\t<th>&nbsp;</th>\r\n';
	for(var i=0; i<=longestRow-1;i++){
		
		logPreviewTableHeader += "\t<th>"+String.fromCharCode(i+65)+"<br/>\r\n";
		// Add the selection buttons
		logPreviewTableHeader += '<div class="btn-group btn-group-vertical" style="min-width:100px;width:100%">\r\n\t'+
			'<button class="btn btn-block" value="timestampIndex" onClick="selectLogSourceProperty(event)">Timestamp</button>\r\n\t'+
			'<button class="btn btn-block" value="valueIndex" onClick="selectLogSourceProperty(event)">Value</button>\r\n\t'+
			'<button class="btn btn-block" value="labelIndex" onClick="selectLogSourceProperty(event)">Label</button>\r\n</div>\r\n'+
			'</th>\r\n';
	}
	
	logPreviewTableHeader+='</tr>';
	
	// Input the table Header
	logPreviewTable.find('thead').html(logPreviewTableHeader);	
	
	// Show Modal
	modal.modal('show');
	
	// Tie the modal to the current log source
	modal.data('logSourceRow', logSourceRow);

	// Show/hide buttons as appropriate
	displayLogSourceConfigButtons(logSourceRow, logPreviewTable.find('thead'));
}

// Handle assignment of log source property (e.g. the user has selected a column as timestamp)
function selectLogSourceProperty(ev){
	
	var formElement = $(ev.srcElement);
	var property = formElement.val();
	var logSourceRow = $('#log-sources-settings-modal').data('logSourceRow');
	var headerRow = formElement.parents('tr');
	var logSourceAttribute = formElement.val();
	
	// Figure out which column this is
	var columnIndex = formElement.parents('tr').find('th').index(formElement.parents('th'));
	
	// If this column is the currently selected column for this attribute, unselect it
	if(logSourceRow.data('logSource').config.indices[logSourceAttribute] == columnIndex){
		
		// Remove the selected index as the selected attribute (e.g. column 0 = timestamp)
		logSourceRow.data('logSource').config.indices[logSourceAttribute] = -1;
		
	}else{
		
		// Otherwise, select it as the column for this attribute
		
		// Save the selected index as the selected attribute (e.g. column 0 = timestamp)
		logSourceRow.data('logSource').config.indices[logSourceAttribute] = columnIndex;
		
	}
	
	// Show/hide buttons as appropriate
	displayLogSourceConfigButtons(logSourceRow, headerRow);
}

function displayLogSourceConfigButtons(logSourceRow, headerRow){
	
	// Reset button-primary
	headerRow.find('button.btn-primary').removeClass('btn-primary');
	// Reset button visibility
	headerRow.find('button').show();
	
	// Show/hide attribute selection buttons as appropriate
	$.each(logSourceRow.data('logSource').config.indices, function(logSourceAttributeName, logSourceAttributeIndex){
		
		if(logSourceAttributeIndex != -1){
			
			// Increment the index by 1 so that it compensates for the blank <th> that is a spacer for the row ID
			logSourceAttributeIndex++;
			
			// logSourceAttributeIndex is set, show the attribute in this column...
			headerRow.find('th:nth-child('+logSourceAttributeIndex+') button[value='+logSourceAttributeName+']').addClass('btn-primary').show();
			
			// but not in others
			headerRow.find('th:not(:nth-child('+logSourceAttributeIndex+')) button[value='+logSourceAttributeName+']').removeClass('btn-primary').hide();
			
			// hide all other attributes in this column
			headerRow.find('th:nth-child('+logSourceAttributeIndex+') button:not([value='+logSourceAttributeName+'])').removeClass('btn-primary').hide();
		}else{
			
			// logSourceAttributeIndex show all buttons (except in cells with btn-primary (i.e. an attribute already assigned to this column))
			headerRow.find('th:not(:nth-child('+logSourceAttributeIndex+')):not(:has(button.btn-primary)) button[value='+logSourceAttributeName+']').show();
		}
	});
}


function fetchLogSourcePreview(ev){

	var formElement = $(ev.srcElement);
	var parent;
	
	// Add a spinner
	formElement.parents('label').prepend('<i class="icon-spinner icon-spin pull-right"></i> ');

	if(formElement.is(':file')){
		
		// Fetch preview from local file
		fetchLocalLogPreview(formElement, validateLogPreview);
		
	}else{

		// Send off the partial HTTP request
		fetchURLLogPreview(formElement, validateLogPreview);
	}
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
	elementAttachedPopover(formElement.parents('.log-sources').find('.config.indicesureLogSource').addClass('btn-primary'), "Success", "Please configure log source");
	
	// Add the preview array to the log source row
	$(formElement).parents('.log-sources').data('logSource').preview =logPreviewArray;
	
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