
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
		' 	<div class="log-sources-header">'+
		'		<h2>Log Sources</h2>'+
		'		<p>Here you can specify one or more URLs or files to use as log sources. Valid formats are .CSV and <abbr title="As downloaded from LogGrapher.com">.LOGG </abbr>.</p>'+
		'	</div>'+
		'	<div class="log-sources-configuration-wrapper"></div>'+
		'	<ol class="log-sources-wrapper"></ol>'+
		'	<div class="log-graph-buttons">'+
		'		<button class="log-sources-add-button btn" name="logSourceAdd"><i class="icon-plus"></i> Add Source</button>'+
		'		<button class="btn btn-warning" class="log-sources-delete-source-button" style="display:none;">Undo</button>'+
		'		<button class="btn-primary btn-large pull-right" name="renderGraphButton"><i class="icon-ok"></i> Graph</button>'+
		'		<div class="clearfix"></div>'+
		'	</div>'+
		'</div>'+
		'<div class="log-chart" style="display:none;background-color:white;width:'+this.options.chartWidth+';height:'+this.options.chartHeight+'"></div>');
	
	// Assign the various important elements to variables
	this.logSourcesWrapper = this.parentWrapper.find('.log-sources-wrapper');
	this.logSourcesConfigurationWrapper = this.parentWrapper.find('.log-sources-configuration-wrapper');
	
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

	if(logSourcesConfigured && this.logSources.length > 0){

		console.log(this.logSources); //debug
		// Hide log source config items
		$('ul li', this.element).hide();

		// Show progress elements
		$('.log-sources-progress-bar-wrapper, .log-sources-progress-bar-label', this.element).css('display', 'inline-block');
		
		// Loop through the log sources and process them one by one (not the first one though, that's a template)
		$.each(this.logSources, function(index, logSourceObj){
			
			// Determine whether it's a local file or a url
			if(logSourceObj.config.currentSource == "File"){

				// Get the contents of the file, piece by piece, and then pass the data to processLogContent()
				logSourceObj.fetchLogFromFile(logSourceObj.config.logFileElement, logSourceObj.processLogContent);
				
			}else if(logSourceObj.config.currentSource == "URL"){

			}
		});

		// Okay, we've sent off all the logs to process, let's just set a timer loop going to wait until they've all returned
		this.waitForLogSources();
	}

}


/**************
	Function to show log-source configuration wrapper
**************/

logGrapher.prototype.toggleLogSourceConfiguration = function(endState){

	var logGrapherObj = this;
	var oppositeofCurrent = $('.log-sources-configuration-wrapper', logGrapherObj.parentWrapper).is(':visible') ? "hide" : "show";

	// If endState isn't passed as a param then simply toggle to the opposite visibility state of current
	var endState = typeof(endState) == "undefined" ? oppositeofCurrent : endState;

	if(endState == "hide" ){

		// Show the overall graph buttons, the log sources, the header
		$('.log-graph-buttons, .log-sources-header, .log-sources-wrapper',logGrapherObj.parentWrapper).slideDown();

		// Hide the log sources configuration wrapper
		$('.log-sources-configuration-wrapper', logGrapherObj.parentWrapper).slideUp();
	}else{

		// Hide the overall graph buttons, the log sources, the header
		$('.log-graph-buttons, .log-sources-header, .log-sources-wrapper',logGrapherObj.parentWrapper).slideUp();

		// Show the log sources configuration wrapper
		$('.log-sources-configuration-wrapper', logGrapherObj.parentWrapper).slideDown();
	}
}


/*************
	Function to loop repeatedly to wait until logs have been processed
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
function inputError(formElement, errMessage, placement){
	
	var placement = typeof(placement) == "undefined" ? "top": placement;

	// Add error class to form element's control group
	$(formElement).parents('.control-group').removeClass('success').addClass("error");
	
	// Set popover options
	if(errMessage){
		$(formElement).popover({
			placement: placement,
			animation: "fade",
			title: "Error",
			content: errMessage
		}).popover("show"); // Show tooltip
		
		// Hide after 5 seconds
		setTimeout(function(){
			$(formElement).popover("destroy");
		}, 5000);
	}
		
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