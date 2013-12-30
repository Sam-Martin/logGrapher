
/***************************************************
	Log Grapher Source class
****************************************************/

logGrapherLogSource = function(){
	
	// Define the current log source for anonymous and asynchronous functions
	var curLogSource = this;

	// Define CSV Web Worker
	this.webWorker = new Worker('js/logGrapher.webWorker.js');
	
	this.config = {
		indices: {
			timestampIndex: null,
			valueIndex: null,
			labelIndex: null
		},
		dateFormat: "DD/MM/YYYY HH:mm:ss",
		currentSource: "file",
		currentSourceType: "csv",
		logPreview: null,
		fileName: null,
		hasValidDateFormat: false,
		logGrapherObj: null, // Reference to parent log grapher object
		status: 'pendingSource' // pendingSource, pendingConfig, pendingProcessing, processed
	};
	
	this.element = $('<li class="log-sources" style="display:none;">'+
		'	<ul>'+
		'		<li class="log-sources-configuration-item">'+
		'			<button class="btn btn-danger" name="logSourceDeleteButton"><i class="icon-trash"></i></button>'+
		'			<button class="btn configureLogSource" name="logSourceConfigureButton"><i class="icon-wrench"></i> Configure</button>'+
		'		</li>'+
		'		<li class="logSourceFileName">'+
		'			No file selected.'+
		'		</li>'+
		'		<li class="log-sources-progress-bar-wrapper">'+
		'			<div class="progress progress-striped active">'+
		'				<div class="bar" style="width:50%"></div>'+
		'			</div>'+
		'		</li>'+
		'		<li class="log-sources-progress-bar-label"></li>'+
		'	</ul>'+
		'</li>');

	/*
		Tie event triggers to buttons
	*/
	

	// Delete log source button
	$('button[name=logSourceDeleteButton]',this.element).click(function(ev){
		curLogSource.logGrapherObj.deleteLogSource(curLogSource);
	});
	
	// Configure log source button
	$('button[name=logSourceConfigureButton]',this.element).click(function(ev){

		curLogSource.chooseLogSource(ev);
	});
	
	
	
	


	
	/***************
		Function to fetch a preview of the log source
	***************/
	
	this.fetchLogSourcePreview = function(formElement, callback){
		
		var curLogSource = this;
		var logSourceRow = this.element;
		

		if(formElement.is(':file')){
			
			// Fetch preview from local file
			this.fetchLocalLogPreview(formElement, function(logPreview, formElement){

				// Validate the preview
				var result = curLogSource.validateLogPreview(logPreview, formElement);
				
				// Return result of validation to callback
				callback(result);
			});
			
			// Update the file name
			this.config.fileName = formElement.get(0).files[0].name;
			
		}else{

			// Send off the partial HTTP request
			fetchURLLogPreview(formElement, this.validateLogPreview(callback));
			
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
			return false;
		}
		
		// Okay, we have some data, but is it valid?
		// Try parsing the data as a CSV
		try{
		
			var logPreviewArray = jQuery.csv.toArrays(logPreview);
		
		}catch(err){
		
		
			return false;
		}

					
		// Add the preview array to the log source row
		curLogSource.config.logPreview = logPreviewArray;

		return true;
		
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
		
	











	/**************************************
	***************************************

			LOG SOURCE CONFIGURATION

	***************************************
	**************************************/







	/*************
		Function present log source selection options
	**************/

	this.chooseLogSource = function(ev){

		var curLogSource = this;
		var logGrapherObj = curLogSource.logGrapherObj;
		var fileInput;


		// Hide the previous 'latest' configuration element, then delete it
		$('.log-soures-configuration-inner-latest', logGrapherObj.logSourcesConfigurationWrapper).slideUp(function(){$(this).remove();});

		// Get previous logfile element (if it exists)
		if(curLogSource.config.currentSource == "File" && curLogSource.config.logFileElement != null){
			fileInput = curLogSource.config.logFileElement;
		}else{
			fileInput =	$('		<input type="file" name="logFile"/>');
		}

		// Show config HTML
		var configurationElement = 
			$('<div class="log-soures-configuration-inner-latest">'+
			'	<h3>Choose Source</h3> <!--'+
			'	<label class="control-label">URL:'+
				'	<input type="text" name="logURL"/>'+
			'	</label>'+
			'	<h4>Or</h4> -->'+
			'	<label class="control-label logsource-file-label">'+
			'	</label>'+
			'	<button class="btn btn-primary logsource-configuration-previous-button">Previous</button>'+
			'	<button class="btn btn-primary logsource-configuration-next-button pull-right">Next</button>'+
			'</div>');
		$('.logsource-file-label', configurationElement).append(fileInput);
		logGrapherObj.logSourcesConfigurationWrapper.append(configurationElement);
		configurationElement.show();

		// Hide the other UI elements in favour of the log source configuration
		logGrapherObj.toggleLogSourceConfiguration('show');

		// Activate 'previous' button
		$('.logsource-configuration-previous-button', logGrapherObj.logSourcesConfigurationWrapper).click(function(ev){
			logGrapherObj.toggleLogSourceConfiguration('hide');
		})

		// Activate 'next' button
		$('.logsource-configuration-next-button',logGrapherObj.logSourcesConfigurationWrapper).click(function(ev){

			var logURL = $('input[name=logURL]', logGrapherObj.logSourcesConfigurationWrapper).val();
			var logFile = $('input[name=logFile]', logGrapherObj.logSourcesConfigurationWrapper).val();

			// Check the user has selected one and only one type of input
			if(!(logFile && logURL) &&  !(!logFile && !logURL)){

				curLogSource.config.currentSource = logFile == '' ? "URL" : "File";

				if(curLogSource.config.currentSource == "File"){

					curLogSource.config.logFileElement = $('input[name=logFile]', logGrapherObj.logSourcesConfigurationWrapper);	

					// Fetch a preview of the log source
					curLogSource.fetchLogSourcePreview(curLogSource.config.logFileElement, function(result){
						
						if(result){

							// Successfully validated, move on to the next configuration page
							curLogSource.chooseLogSchema();
						}else{
							inputError($('.logsource-configuration-next-button',logGrapherObj.logSourcesConfigurationWrapper), "Unable to retrieve file or not of a valid type.", "bottom");			
						}

					});
				}else{

					curLogSource.config.logFileElement = null;
				}
				

			}else if(logFile && logURL){
				inputError($('.logsource-configuration-next-button',logGrapherObj.logSourcesConfigurationWrapper), "Please select a URL or a file, not both.", "bottom");
			}else{
				inputError($('.logsource-configuration-next-button',logGrapherObj.logSourcesConfigurationWrapper), "Please select a log source.", "bottom");	
			}

		});

		
	}

	/*************
		Function present log preview & column selection options
	**************/

	this.chooseLogSchema = function(ev){

		var curLogSource = this;
		var logGrapherObj = curLogSource.logGrapherObj;

		// Hide the previous 'latest' configuration element, then delete it
		$('.log-soures-configuration-inner-latest', logGrapherObj.logSourcesConfigurationWrapper).slideUp(function(){$(this).remove();});

		// Check we have log preview data
		if(!(logPreview = this.config.logPreview)){
			
			// Show error
			log("No log preview, but this shouldn't be possible!", "error");
			
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
		logPreviewTableBody+='<tr>\r\n\t<td colspan="'+(longestRow+1)+'">...</td>\r\n</tr>';
		

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
		

		// Insert the new configuration form into the DOM
		logGrapherObj.logSourcesConfigurationWrapper.append(
			'<div class="log-soures-configuration-inner-latest">'+
			'	<h3>Choose schema</h3>'+
			'	<table class="table table-bordered table-condensed">'+
			'		<thead>'+
						logPreviewTableHeader+
			'		</thead>'+
			'		<tbody>'+
						logPreviewTableBody+
			'		</tbody>'+
			'	</table>'+
			'	<button class="btn btn-primary logsource-configuration-previous-button">Previous</button>'+
			'	<button class="btn btn-primary logsource-configuration-next-button pull-right">Next</button>'+
			'</div>'
		).find('.log-soures-configuration-inner-latest').slideDown();

		// Show/hide index buttons as dictated by any existing configuration
		curLogSource.displayLogSourceConfigButtons(logGrapherObj.logSourcesConfigurationWrapper.find('thead'));
		
		// Bind buttons to allow selection of a log source's properties (e.g. timestamp, value, label)
		$('.selectLogSourcePropertyButtonGroup > button', logGrapherObj.logSourcesConfigurationWrapper).bind("click", function(ev){
			
			curLogSource.selectLogSourceProperty(ev);
		});

		// Hide the other UI elements in favour of the log source configuration
		logGrapherObj.toggleLogSourceConfiguration('show');

		// Activate 'previous' button
		$('.logsource-configuration-previous-button', logGrapherObj.logSourcesConfigurationWrapper).click(function(ev){
			curLogSource.chooseLogSource();
		})

		// Activate 'next' button
		$('.logsource-configuration-next-button',logGrapherObj.logSourcesConfigurationWrapper).click(function(ev){

			// Check to make sure all the indices are selected (by looping through and checking if each has a valid number assigned to it)
			if($.map(curLogSource.config.indices,function(i, index){return !isNaN(parseFloat(i)) && isFinite(i);}).every(function(element){return element})){

				// Move on to the next config item
				curLogSource.chooseLogDateFormat();


			}else{
				inputError($('.logsource-configuration-next-button',logGrapherObj.logSourcesConfigurationWrapper), "Please select a column for each type (timestamp, value, label).", "bottom");	
			}	
		});


	}


	/*************
		Function present log preview & column selection options
	**************/

	this.chooseLogDateFormat = function(ev){

		var curLogSource = this;
		var logGrapherObj = curLogSource.logGrapherObj;


		// Hide the previous 'latest' configuration element, then delete it
		$('.log-soures-configuration-inner-latest', logGrapherObj.logSourcesConfigurationWrapper).slideUp(function(){$(this).remove();});

		// Show config HTML
		logGrapherObj.logSourcesConfigurationWrapper.append(
			'<div class="log-soures-configuration-inner-latest">'+
			'	<h3>Choose date format</h3>'+
			'		<div class="pull-right">'+
			'			<div class="alert alert-success log-sources-date-transform-alert"> <span class="log-sources-date-transform-alert-label">Out:</span> <span class="log-sources-settings-date-format-output"></span></div>'+
			'		</div>'+
			'		<div class="pull-left" style="text-align:center;">'+
			'			<div class="alert log-sources-date-transform-alert">'+
			'				<span class="log-sources-date-transform-alert-label">In:</span> <span class="log-sources-settings-date-format-input"></span>'+
			'			</div> '+
			'		</div>	'+
			'		<div class="log-sources-date-transform-controls">'+
			'			<div class="control-group">'+
			'				<label>'+
			'					<select name="logSourceDateFormatDefaults">'+
			'						<option value="DD/MM/YYYY HH:mm:ss">DD/MM/YYYY HH:mm:ss</option>'+
			'						<option value="MM/DD/YYYY HH:mm:ss">MM/DD/YYYY HH:mm:ss</option>'+
			'					</select>'+
			'				</label>'+
			'			</div>'+
			'			<h4>Custom</h4>'+
			'			<div class="control-group">'+
			'				<label>'+
			'					<input type="text" name="logSourceDateFormatCustom"/> '+
			'					<a href="http://momentjs.com/docs/#/parsing/string-format/" target="_blank" title="How do I format dates?">'+
			'						<i class="icon-question-sign"> </i>'+
			'					</a>'+
			'				</label>'+
			'			</div> '+
			'		</div>'+
			'	<button class="btn btn-primary logsource-configuration-previous-button">Previous</button>'+
			'	<button class="btn btn-primary logsource-configuration-next-button pull-right">Next</button>'+
			'</div>'
		).find('.log-soures-configuration-inner-latest').slideDown();

		// Hide the other UI elements in favour of the log source configuration
		logGrapherObj.toggleLogSourceConfiguration('show');

		// Try and parse the dates with the default format
		curLogSource.config.hasValidDateFormat = curLogSource.testDateParsing($('select[name=logSourceDateFormatDefaults]', logGrapherObj.logSourcesConfigurationWrapper));

		// Bind change date format events
		$('select[name=logSourceDateFormatDefaults]', logGrapherObj.logSourcesConfigurationWrapper).change(function(ev){
			curLogSource.config.dateFormat = $(ev.currentTarget).val();
			
			// Test whether the date parses
			curLogSource.config.hasValidDateFormat = curLogSource.testDateParsing(ev.currentTarget);
		});

		$('input[name=logSourceDateFormatCustom]', logGrapherObj.logSourcesConfigurationWrapper).keyup(function(ev){
			var val = $(ev.currentTarget).val();
			

			// If the custom value is populated use that, otherwise use the currently selected default
			if(val.length > 0){
				curLogSource.config.dateFormat = val;
			}else{
				curLogSource.config.dateFormat = $('input[name=logSourceDateFormatDefaults]', logGrapherObj.logSourcesConfigurationWrapper).val();
			}

			// Test whether the date parses
			curLogSource.config.hasValidDateFormat = curLogSource.testDateParsing(ev.currentTarget);

		});

		// Activate 'previous' button
		$('.logsource-configuration-previous-button', logGrapherObj.logSourcesConfigurationWrapper).click(function(ev){
			cutLogSource.chooseLogSchema();
		})

		// Activate 'next' button
		$('.logsource-configuration-next-button',logGrapherObj.logSourcesConfigurationWrapper).click(function(ev){

			if(curLogSource.config.hasValidDateFormat){

				// Go back to the log-source list
				logGrapherObj.toggleLogSourceConfiguration('hide');

			}else{
				inputError($('.logsource-configuration-next-button',logGrapherObj.logSourcesConfigurationWrapper),"Please choose a valid date format", "bottom");
			}
		});
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


	/********************
		Function to test parsing of dates using date format
	*********************/
	this.testDateParsing = function(formElement){

		var curLogSource = this;
		var timestampIndex = curLogSource.config.indices.timestampIndex;


		// Check to see if the user has selected a date column, and suggest they should if they haven't
		if(timestampIndex == null){
			log("Select a timestamp column to see if it parses!")
			return false;
		}

		// Reset to default error:
		$('.log-sources-settings-date-format-input', curLogSource.logGrapherObj.logSourcesConfigurationWrapper.logSourcesSettingsModal).html("No valid dates found, please try a different date format, or click 'Back' to select a different date index");

		// Loop through all rows in the preview
		for(rowID in curLogSource.config.logPreview){

			var curDate = curLogSource.config.logPreview[rowID][timestampIndex-1];

			if(typeof(curDate) != "undefined"){
				// Now try parsing the date and replacing the cell text with the result
				var parsedDate = moment(curDate, curLogSource.config.dateFormat);
				
				// If the date's valid, use it as the example (this will show the last valid date as an example due to the loop)
				if(parsedDate.isValid()){
					$('.log-sources-settings-date-format-input', curLogSource.logGrapherObj.logSourcesConfigurationWrapper.logSourcesSettingsModal).html(curDate);
					$('.log-sources-settings-date-format-output', curLogSource.logGrapherObj.logSourcesConfigurationWrapper.logSourcesSettingsModal).html(parsedDate.format("YYYY-MM-DD HH:mm:ss.SSS"));
					inputSuccess(formElement);
					return true;
				}else{
					
					inputError(formElement);
				}
			}
		}
		return false; // if we haven't returned true by now, we're not gonna
	}









	/**************************************
	***************************************

			LOG SOURCE PROCESSING

	***************************************
	**************************************/












	/********
		Function to fetch an entire log from a file
	**********/

	this.fetchLogFromFile = function(fileElement, callback){
		var files = fileElement.get(0).files;

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