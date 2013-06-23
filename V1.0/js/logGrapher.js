
/*********************************
	LogGrapher Constructor
*********************************/

function logGrapher(parentWrapper){
	
	// For the purposes of anonmyous and child functions, tie the parent obj to the var logGrapherObj
	var logGrapherObj = this;

	this.options = {
		chartWidth:"auto",
		chartHeight:"100%"
	}
	
	this.parentWrapper = $(parentWrapper);
	
	// Define the log sources array
	this.logSources = [];

	// Define the chart series array
	this.chartSeriesArray = [];

	// Define a blank callback onRenderChart to allow the user to add customisatins at the point of rendering a chart
	this.onRenderChart = function(){};

	// Initialise the parentElement
	this.parentWrapper.append(
		'<div class="log-setup-wrapper">'+
		'	<div class="log-sources-settings-modal modal hide fade" tabindex="-1" role="dialog" aria-labelledby="log-sources-settings-modal-label" aria-hidden="true">'+
		'		<div class="modal-header">'+
		'			<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>'+
		'			<h3 class="log-sources-settings-modal-label">Log Source Settings</h3>'+
		'		</div>'+
		'		<div class="modal-body">'+
		'			<h3>Select Columns</h3>'+
		'			<p>Pick which column corresponds with the label of the line(s) to be graphed, the value to graph on the vertical axis and the timestamp to graph on the horizontal axis</p>'+
		'			<div class="well">'+
		'					<table class="table table-bordered table-condensed">'+
		'					<thead>'+
		'						<tr>'+
		'							<th>#1</th>'+
		'							<th>#2</th>'+
		'						</tr>'+
		'					</thead>'+
		'					<tbody>'+
		'						<tr>'+
		'							<td>01/02/2013</td>'+
		'							<td>Potato</td>'+
		'						</tr>'+
		'					</tbody>'+
		'				</table>'+
		'			</div>'+
		'		</div>'+
		'		<div class="modal-footer">'+
		'			<button class="btn btn-primary" data-dismiss="modal" aria-hidden="true">Done</button>'+
		'		</div>'+
		'	</div>'+

		'	<ol class="log-sources-wrapper"></ol>'+
		'	<button class="log-sources-add-button btn" name="logSourceAdd"><i class="icon-plus"></i> Add Source</button>'+
		'	<button class="btn btn-warning" class="log-sources-delete-source-button" style="display:none;">Undo</button>'+
		'	<button class="btn-primary btn-large pull-right" name="renderGraphButton"><i class="icon-ok"></i> Graph</button>'+
		'	<div class="clearfix"></div>'+
		'</div>'+
		'<div class="log-chart" style="display:none;background-color:white;width:'+this.options.chartWidth+';height:'+this.options.chartHeight+'"></div>');
	
	// Assign the various important elements to variables
	this.logSourcesWrapper = this.parentWrapper.find('.log-sources-wrapper');
	this.logSourcesSettingsModal = this.parentWrapper.find('.log-sources-settings-modal');
	
	/*
		Tie event triggers to GUI elements
	*/
	$('button[name=logSourceAdd]', this.parentWrapper).click(function(ev){
		logGrapherObj.addLogSource();
	});
	
	$('button[name=renderGraphButton]',this.parentWrapper).click(function(ev){
		logGrapherObj.processLogSources();
	});
	
	// Append a new Log Source element to the parent wrapper
	this.addLogSource();
}

/*********************************
	LogGrapher GUI Functions
*********************************/

// Add log source function
logGrapher.prototype.addLogSource = function(){
	
	
	// Clone us a new log source object
	var newLogSource = new logGrapherLogSource();
	
	// Populate it with a reference the current logGrapher object
	newLogSource.logGrapherObj = this;
	
	// Add it to the array in the parent object
	this.logSources.push(newLogSource);
	
	// Add element into DOM
	newLogSource.element.appendTo(this.logSourcesWrapper) 
		.slideDown(); // Show it
		
	/*
		Tie event triggers to buttons
	*/
	
	// Change  in logURL or logFile
	$('input[name=logURL], input[name=logFile]',newLogSource.element).bind("change",function(ev){
		newLogSource.fetchLogSourcePreview(ev);
	});
	
	// Click to toggle URL or file selection
	$('button[name=logURLButton], button[name=logFileButton]', newLogSource.element).click(function(ev){
		newLogSource.toggleUrlFileInput(ev);
	});
	
	// Delete log source button
	$('button[name=logSourceDeleteButton]',newLogSource.element).click(function(ev){
		newLogSource.deleteLogSource(ev);
	});
	
	// Configure log source button
	$('button[name=logSourceConfigureButton]',newLogSource.element).click(function(ev){
		newLogSource.configureLogSource(ev);
	});
}

// Delete log source
logGrapher.prototype.deleteLogSource = function(ev){
	
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



/***********
	 Function to kick off log processing (downloading, csv parsing, etc) once all logs have been assigned configuration values and are ready for processing
*************/

logGrapher.prototype.processLogSources = function(){
	

	var logSourcesConfigured = true;

	// Check whether all our property indices are defined
	$.each(this.logSources, function(index, logSourceObj){
		
		for(index in logSourceObj.config.indices){
			
			if(!logSourceObj.config.indices[index]){
				
				// Oops, this index isn't configured, throw an error
				logSourcesConfigured = false;
				inputError($('.configureLogSource',logSourceObj.element), "Please configure this log source");
			}
		}
		
		
	});

	if(logSourcesConfigured){

		// Hide log source config items
		$('ul li', this.element).hide();

		// Show progress elements
		$('.log-sources-progress-bar-wrapper, .log-sources-progress-bar-label', this.element).css('display', 'inline-block');
		
		// Loop through the log sources and process them one by one (not the first one though, that's a template)
		$.each(this.logSources, function(index, logSourceObj){
			
			// Determine whether it's a local file or a url
			if(logSourceObj.config.currentSource == "file"){
				
				// Get the contents of the file, piece by piece, and then pass the data to processLogContent()
				logSourceObj.fetchLogFromFile(logSourceObj.element, logSourceObj.processLogContent);
				
			}else if(logSourceObj.config.currentSource == "url"){
				
			}
		});

		// Okay, we've sent off all the logs to process, let's just set a timer loop going to wait until they've all returned
		this.waitForLogSources();
	}

}

/*************
	Function to loop over itself and wait until logs have been processed
**************/
logGrapher.prototype.waitForLogSources = function(){

	var result = true;
	var logGrapherObj = this;
	// Loop through each log source and if we find one that's not processed, kick off the timer again
	$.each(logGrapherObj.logSources, function(index, logSourceObj){

		if(logSourceObj.status != "processed"){	
			
			// If even one has not got the status of processed, wait another 500ms
			result = false;
			
		}
	});

	if(result){
		// Woohoo! all done! render chart!

		// Call user's onRenderChart function
		logGrapherObj.onRenderChart();

		// Display a massive loading text and slideDown
		$('.log-chart', logGrapherObj.parentWrapper).html('<h1>Rendering Chart...</h1>').slideDown();

		// Slide up the settings 
		$('.log-setup-wrapper',logGrapherObj.parentWrapper).slideUp(function(){

			

			// Now render the chart
			$('.log-chart', logGrapherObj.parentWrapper).jqChart({
				title: {
					text: ' Test.',
					font: '18px sans-serif'
				},
				background: '#ffffff',
				axes: [{
					type: 'dateTime',
					location: 'bottom',
					zoomEnabled: true
				}],
				mouseInteractionMode: 'zooming',
				legend: {
					visible:false
				},
				tooltips: {
					//type: 'shared'
				},
				crosshairs: {
					enabled: true,
					hLine: false,
					vLine: {
						strokeStyle: '#cc0a0c'
					}
				},
				series: logGrapherObj.chartSeriesArray
			});  
		});

		// Make the chart resizable (very slow)
		//$('#jqChart').resizable();

	}else{

		// Wait 500ms because at least one has not finished.
		setTimeout(function(){logGrapherObj.waitForLogSources();}, 500);

		log("Log sources haven't finished processing, waiting 500ms", "verbose");
	}
}

/***************************************************
	Log Grapher Source class
****************************************************/

logGrapherLogSource = function(){
	
	// Define the current log source for anonymous and asynchronous functions
	var curLogSource = this;

	// Define CSV Web Worker
	this.webWorker = new Worker('js/logGrapherWebWorker.js');
	
	this.config = {
		indices: {
			timestampIndex: null,
			valueIndex: null,
			labelIndex: null
		},
		currentSource: "file",
		currentSourceType: "csv",
		logPreview: null,
		fileName: null,
		logGrapherObj: null, // Reference to parent log grapher object
		status: 'pendingSource' // pendingSource, pendingConfig, pendingProcessing, processed
	};
	
	this.element = $('<li class="log-sources" style="display:none;">'+
		'	<ul>'+
		'		<li>'+
		'			<button class="btn btn-danger" name="logSourceDeleteButton"><i class="icon-trash"></i></button>'+
		'			<button class="btn configureLogSource" name="logSourceConfigureButton"><i class="icon-wrench"></i></button>'+
		'		</li>'+
		'		<li>'+
		'			<div class="btn-group">'+
		'				<button class="btn" name="logURLButton">URL</button>'+
		'				<button class="btn btn-inverse" name="logFileButton">File</button>'+
		'			</div>'+
		'		</li>'+
		'		<li class="log-sources-source-url control-group">'+
		'			<label class="control-label">URL:'+
		'				<input type="text" name="logURL"/>'+
		'			</label>'+
		'		</li>'+
		'		<li class="log-sources-source-file control-group">'+
		'			<label class="control-label">'+
		'				<input type="file" name="logFile"/>'+
		'			</label>'+
		'		</li>'+
		'		<li class="log-sources-progress-bar-wrapper">'+
		'			<div class="progress progress-striped active">'+
		'				<div class="bar" style="width:50%"></div>'+
		'			</div>'+
		'		</li>'+
		'		<li class="log-sources-progress-bar-label"></li>'+
		'	</ul>'+
		'</li>');
	
	
	/*******
		Function to present modal box that allows user to configure the log source options
	*********/
	
	this.configureLogSource = function(ev){
		
		// Get log preview table
		var logPreviewTable = $('table', this.logGrapherObj.logSourcesSettingsModal);
		
		// Get logSourceRow
		var logSourceRow = this.element;
		
		// Check we have log preview data
		if(!(logPreview = this.config.logPreview)){
			
			// Show error
			elementAttachedPopover(ev.currentTarget, "Error", "Please select a valid log source");
			
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
			logPreviewTableHeader += '<div class="btn-group btn-group-vertical selectLogSourcePropertyButtonGroup" style="min-width:100px;width:100%">\r\n\t'+
				'<button class="btn btn-block" value="timestampIndex">Timestamp</button>\r\n\t'+
				'<button class="btn btn-block" value="valueIndex" >Value</button>\r\n\t'+
				'<button class="btn btn-block" value="labelIndex">Label</button>\r\n</div>\r\n'+
				'</th>\r\n';
		}
		
		logPreviewTableHeader+='</tr>';
		
		// Input the table Header
		$('thead',logPreviewTable).html(logPreviewTableHeader);	
		
		// Show Modal
		this.logGrapherObj.logSourcesSettingsModal.modal('show');
		
		// Show/hide buttons as appropriate
		this.displayLogSourceConfigButtons(logSourceRow, logPreviewTable.find('thead'));
		
		// Bind buttons to allow selection of a log source's properties (e.g. timestamp, value, label)
		$('.selectLogSourcePropertyButtonGroup > button', logPreviewTable).bind("click", function(ev){
			
			curLogSource.selectLogSourceProperty(ev);
		});
	}
	
	/***************
		Function to fetch a preview of the log source
	***************/
	
	this.fetchLogSourcePreview = function(ev){
	
		var formElement = $(ev.currentTarget);
		var logSourceRow = this.element;
		
		// Add a spinner
		formElement.parents('label').prepend('<i class="icon-spinner icon-spin pull-right"></i> ');

		if(formElement.is(':file')){
			
			// Fetch preview from local file
			this.fetchLocalLogPreview(formElement, this.validateLogPreview);
			
			// Update the file name
			this.config.fileName = formElement.get(0).files[0].name;
			
		}else{

			// Send off the partial HTTP request
			fetchURLLogPreview(formElement, this.validateLogPreview);
			
			// Update the file name
			this.config.fileName = formElement.val().match("\/[^\/]*$");
		}
	}
	
	
	/**************
		Function that checks to see if the file the user has given us is a valid CSV
	***************/
	
	this.validateLogPreview = function(logPreview, formElement){

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
		console.log(curLogSource.element); //debug
		elementAttachedPopover($('.configureLogSource', curLogSource.element).addClass('btn-primary'), "Success", "Please configure log source");
		
		
		
		// Add the preview array to the log source row
		curLogSource.config.logPreview = logPreviewArray;
		
		// Remove the spinner
		formElement.parents('label').find('i.icon-spinner').remove();
		
	}
	
	
	/*********
		Function to fetch a preview from a local file
	***********/
	
	this.fetchLocalLogPreview = function(formElement, callback){
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
	
	/********
		Function to fetch a preview of a log file from a URL
	**********/

	this.fetchURLLogPreview = function(formElement, callback){
		
		// Fetch a preview from a remote URL
		var fileURL = formElement.val();
		$.ajax(fileURL, {
			
			// Listen in on progress
			xhr: function(){
				var xhr = new window.XMLHttpRequest();

				
				// Check to see how many lines we have
				xhr.addEventListener("progress", function(evt){
					
					try{
						var numLines = (evt.currentTarget.response).match(/[\r\n]/g).length;
					}catch(e){return;}
					
					if(numLines > 1){
					
						// Okay, we've got a couple of lines of data, send it back to the callback for processing
						callback(evt.currentTarget.response, formElement);
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
	

	/*******************
		Function to handle assignment of log source property (e.g. the user has selected a column as timestamp)
	********************/
	this.selectLogSourceProperty = function(ev){
		
		
		var formElement = $(ev.currentTarget);
		var logSourceRow = this.element;
		var headerRow = formElement.parents('tr');
		var logSourceAttribute = formElement.val();
				
		// Figure out which column this is
		var columnIndex = formElement.parents('tr').find('th').index(formElement.parents('th'));
		
		// If this column is the currently selected column for this attribute, unselect it
		if(this.config.indices[logSourceAttribute] == columnIndex){
			
			// Remove the selected index as the selected attribute (e.g. column 0 = timestamp)
			this.config.indices[logSourceAttribute] = null;
			
		}else{
			
			// Otherwise, select it as the column for this attribute
			
			// Save the selected index as the selected attribute (e.g. column 0 = timestamp)
			this.config.indices[logSourceAttribute] = columnIndex;
			
		}
		
		// Show/hide buttons as appropriate
		this.displayLogSourceConfigButtons(headerRow);
	}
	
	/***************
		Function to display buttons to facilitate the configuration of log source
	***************/
	
	this.displayLogSourceConfigButtons = function(headerRow){
		
		// Reset button-primary
		headerRow.find('button.btn-primary').removeClass('btn-primary');
		
		// Reset button visibility
		headerRow.find('button').show();
		
		// Show/hide attribute selection buttons as appropriate
		$.each(this.config.indices, function(logSourceAttributeName, logSourceAttributeIndex){
			
			if(logSourceAttributeIndex != null){
				
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
				headerRow.find('th:not(:has(button.btn-primary)) button[value='+logSourceAttributeName+']').show();
			}
		});
	}

	
	/********
		Function to display progress of log processing
	**********/
	
	this.showProgress = function(percentage, message){

		// Display message
		$('.log-sources-progress-bar-label',this.element).text(message);
		
		if(percentage>=0){

			// Display percent
			$('.log-sources-progress-bar-wrapper').show();
			$('.log-sources-progress-bar-wrapper > .progress > .bar', this.element).css('width', percentage);
		}else{

			$('.log-sources-progress-bar-wrapper').hide();
		}
	}
		
	
	/********
		Function to fetch an entire log from a file
	**********/
	
	this.fetchLogFromFile = function(logSourceRow, callback){
		var files = $('input[name=logFile]',logSourceRow).get(0).files;
			
		// Check there are files selected
		if(files.length == 0){
			console.log("No file selected"); //debug todo
			return;
		}
		
		// Build the string from the file in pieces, to prevent hanging
		this.readLocalFileSlice(files[0], callback);
		
	}
	
	/*******
		Function to fetch part of a local file
	*******/
	
	this.readLocalFileSlice = function(file,  callback, startBytes, data){
		
				
		var chunkSliceSize = 200000;
		var startBytes = typeof(startBytes) == "undefined" ? 0 : startBytes;
		var endBytes = startBytes+chunkSliceSize;
		var reader = new FileReader();
		
		// Check our slice doesn't go past the end of the file, just read to the end if it is
		endBytes = (endBytes < file.size) ? endBytes : file.size+1;
		
		// Show progress
		var percentage = Math.round((endBytes/file.size)*10000)/100 // The odd division and multiplication allows us to get two decimal places
		this.showProgress(
			percentage, 
			percentage + "% imported file"
		);
		
		
		// Once the slice has finished pass it on to the validation function
		reader.onloadend = function(evt) {
		  if (evt.target.readyState == FileReader.DONE) { // DONE == 2
			
			// Have we finished?
			if(endBytes >= file.size){
			
				// Send the data to the callback
				callback(data+evt.target.result);
			}else{
			
				// Read the next section
				curLogSource.readLocalFileSlice(file, callback, endBytes,  data+evt.target.result);
			}
		  }
		};
		
		// Fire off the slice
		var blob = file.slice(startBytes, endBytes);
		reader.readAsBinaryString(blob);
	}

	/*********
		Function to process a log file's raw data
	*************/
	this.processLogContent = function(data){
		
		if(curLogSource.config.currentSourceType == "csv"){


			// Split the CSV into lines
			var splitCSV = data.split('\n');

			log(splitCSV.length); //debug

			// Initialise a temporary array to dump the parsed CSV rows and column into
			curLogSource.tempCSVArray = [];
			
			// Set off the loop to process a maximum of 100,000 rows at a time
			curLogSource.parseCSVLoop(splitCSV, 0);
		}
	}

	



	/************
		Function to loop through the CSV line by line and pass it to the webworker
	**************/
	this.parseCSVLoop = function(splitCSVString, curIndex, result){

		// Calculate the percentage we've completed so far
		var percentComplete = (curIndex / splitCSVString.length) * 100;

		// Round to two decimal places
		percentComplete = Math.round(percentComplete*100)/100;
		
		// Update the user on our progress
		this.showProgress(
			percentComplete, 
			percentComplete + "% parsed CSV data"
		);
		
		// If this is returning from a worker, add the result to the tempCSVArray
		if(typeof(result) != "undefined"){
			
			curLogSource.tempCSVArray = curLogSource.tempCSVArray.concat(result);

		}else{
			log("parse CSV called with undefined result, expected only in first call", "verbose");
		}
		
		// If we have yet to finish, keep processing!
		if(curIndex != splitCSVString.length){
			
			// Process the CSV 10000 rows at a time
			var maxNumRows = 10000;
			
			// Calculate the number of rows to deal with now (make sure we don't try to process lines that don't exist!)
			var numRowsToProcess = (curIndex+maxNumRows > splitCSVString.length) ? splitCSVString.length - curIndex : maxNumRows;
			var nextIndex = curIndex + numRowsToProcess;
			
			var rowsToProcess = splitCSVString.slice(curIndex, curIndex+numRowsToProcess);
			
			rowsToProcess= rowsToProcess.join("\n");
			
			log("next CSV row index:"+nextIndex, "verbose");
			
			// Parse CSV data using a worker
			curLogSource.webWorker.postMessage(JSON.stringify({
				function: "parseCSV",
				value: rowsToProcess,
				nextIndex: nextIndex
			}));
			
			
			// Wait for the worker to return
		
			curLogSource.webWorker.onmessage = function (event) {
				
				var webWorkerResult = JSON.parse(event.data);
				log("CSV parse web worker returned", "verbose");
				curLogSource.parseCSVLoop(splitCSVString, webWorkerResult.nextIndex,webWorkerResult.value);
			}
		
		}else{

			// We've completed the CSV Parsing

			// Update the user on our progress
			this.showProgress(
				-1,  // No progress bar
				"Converting data into chart object"
			);
			
			// 2) Then add it to the parent object's chart Series
			curLogSource.logGrapherObj.chartSeriesArray = curLogSource.logGrapherObj.chartSeriesArray.concat(

				// 1) Let's turn that CSV array into an object that contains the various different 'labels' as indices
				curLogSource.createSeriesArrayFromCSVArray(curLogSource.tempCSVArray)
			);
			

			// Set the status to processed
			curLogSource.status = "processed";

			// Clean up the old CSV array
			delete curLogSource.tempCSVArray;

		}
		// Clean up
		delete splitCSVString;
		delete rowsToProcess;
	}



	/***************
		 Function to convert rows of individual source entries from a CSV into index (i.e. label) oriented array of objects
	**************/

	this.createSeriesArrayFromCSVArray = function(csvRows){
		

		var seriesByNameObj = {};
		var seriesByNameArray =[];
		var numSeries = 0;

		log("ValueIndex: "+curLogSource.config.indices.valueIndex+"\r\n"+
			"TimestampIndex: "+curLogSource.config.indices.timestampIndex+"\r\n"+
			"seriesNameIndex: "+curLogSource.config.indices.labelIndex,"verbose");
		
		// Loop through the rows and aggregate the series (defined by 'labels') into objects
		for(key in csvRows){
		
						
			var row = csvRows[key];
			var val = row[curLogSource.config.indices.valueIndex-1];
			var timestamp = row[curLogSource.config.indices.timestampIndex-1];
			var seriesName = row[curLogSource.config.indices.labelIndex-1];


			if (parseInt(val) >= 0 && seriesName.length > 0) {

				// Check to see if the series has been added to the obj
				if (typeof (seriesByNameObj[seriesName]) == 'undefined') {
					
					// It hasn't, add it
					seriesByNameObj[seriesName] = [];
					numSeries++;
				}

				// Format Unix Timestamp
				var timestampUnix
				
				timestampUnix = Date.UTC(timestamp.substr(6, 4), timestamp.substr(3, 2) - 1, timestamp.substr(0, 2), timestamp.substr(11, 2), timestamp.substr(14, 2), timestamp.substr(17, 2));

				

				seriesByNameObj[seriesName].push([
					new Date(timestampUnix), 
					parseInt(val)
				]);

			}
		}

		// Now loop through each series and add it into an array so it's jqCharts compatible
		$.each(seriesByNameObj, function(seriesName, dataPoints){

			// Sort dataPoints by time while we're here
			// Loop through each series
			dataPoints.sort(sortByTimestamp);
	

			seriesByNameArray.push({
				title: seriesName,
				type: "line",
				data: dataPoints,
				markers: null
			});

		});

		delete csvRows;
		delete seriesByNameObj;
		
		log("Found "+numSeries+" series in csv array"); 
		return seriesByNameArray;
	}


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

// Indicate success in filling out a form element

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

var log = function(string){
	console.log(string);
}

function sortByTimestamp(a, b) {
	// The unary + operator forces the javascript engine to call the objects valueOf method - and so it is two primitives that are being compared.
	// http://stackoverflow.com/questions/2888841/javascript-date-comparison

	if (+a[0] < +b[0]) return -1;
	if (+a[0] > +b[0]) return 1;
	return 0;
}