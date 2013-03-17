var tempCSVArray = [];
var earliestTimestamp;
var latestTimestamp;

var createSeriesObj = function(settings, csvRows){
	var count =0; //debug
	seriesByName = {}
	var earliestTimestamp;
	var latestTimestamp;
	
	
	// Loop through the rows and aggregate the series (defined by 'labels') into objects
	for(key in csvRows){
	
		
		element = csvRows[key];
		
		var val = element[settings.valueIndex];
		var timestamp = element[settings.timestampIndex];
		var seriesName = "";
		
		// Check to see if we're using multiple fields for labels
		if(settings.labelIndex.indexOf(",") >=0){
			
			// If we are, loop through and build a label from each column specified
			var seriesNamePartsIndexes = settings.labelIndex.split(",");
			var seriesNameArray = [];
			for(i in seriesNamePartsIndexes){
				seriesNameArray.push(element[seriesNamePartsIndexes[i]])
			}
			seriesName = seriesNameArray.join(' - ');
		
		}else{
			
			seriesName = element[settings.labelIndex];
		}

		if (parseInt(val) >= 0 && seriesName.length > 0) {

			// Check to see if the series has been added to the obj
			if (typeof (seriesByName[seriesName]) == 'undefined') {
				count++; //debug
				// It hasn't, add it
				seriesByName[seriesName] = [];
			}

			// Format Unix Timestamp
			var timestampUnix
			
			timestampUnix = Date.UTC(timestamp.substr(6, 4), timestamp.substr(3, 2) - 1, timestamp.substr(0, 2), timestamp.substr(11, 2), timestamp.substr(14, 2), timestamp.substr(17, 2));

			// Update latest/earliest timestamps as appropriate
			earliestTimestamp = timestampUnix < earliestTimestamp | typeof(earliestTimestamp) == "undefined" ? timestampUnix : earliestTimestamp;
			latestTimestamp  =  timestampUnix > latestTimestamp | typeof(latestTimestamp) == "undefined" ? timestampUnix : latestTimestamp;
			

			seriesByName[seriesName].push({
				x: timestampUnix, 
				y: parseInt(val)
			});

		}
	};
	console.log("Found "+count+" series"); //debug
	return {seriesByName:seriesByName, earliestTimestamp: earliestTimestamp, latestTimestamp: latestTimestamp};
}

var parseCSV = function (data) {
	
	// Split the CSV into lines
	var splitCSV = data.split('\n');
	
	console.log(splitCSV.length); //debug

    
	
	// Set off the loop to process a maximum of 100,000 rows at a time
	parseCSVLoop(splitCSV, 0);
	//csvRows = $.csv.toArrays(data);
	
	
	
	
}

var parseCSVLoop = function(splitCSV, curIndex, result){

	// Calculate the percentage
	var percentComplete =(curIndex / splitCSV.length) * 100;

	// Round to two decimal places
	percentComplete = Math.round(percentComplete*100)/100;
	
	// Update the user on our progress
	$("#container > span").html('Parsing CSV ' + percentComplete + "%");
	
	console.log("parseCSVLoop, current index:"+curIndex); //debug
	
	// If this is returning from a worker, add the result to the tempCSVArray
	if(typeof(result) != "undefined"){
		
		tempCSVArray = tempCSVArray.concat(result);
		
	}
	
	if(curIndex != splitCSV.length){
		// Process the CSV 10000 rows at a time
		var maxNumRows = 10000;
		
		// Calculate the number of rows to deal with now
		var numRowsToProcess = (curIndex+maxNumRows > splitCSV.length) ? splitCSV.length - curIndex : maxNumRows;
		var nextIndex = curIndex + numRowsToProcess;
		
		var rowsToProcess = splitCSV.slice(curIndex, curIndex+numRowsToProcess);
		
		rowsToProcess= rowsToProcess.join("\n");
		
		//console.log("\n\n"+rowsToProcess);//debug
		
		console.log("numRowsToProcess:"+numRowsToProcess);
		console.log("nextIndex:"+nextIndex);
		
		// Parse CSV data using a worker
		csvWorker.postMessage(rowsToProcess);
		
		
		// Wait for the worker to return
		csvWorker.onmessage = function (event) {
			
			console.log("Worker return"); //debug
			parseCSVLoop(splitCSV, nextIndex, event.data);
		}
	}else{
		//console.log(tempCSVArray); //debug
		convertCSVArrayToChartObj(tempCSVArray)
	}
}

var convertCSVArrayToChartObj = function(csvRows){

	// Initialise variables
	hostAverage = [];
	tempSeriesArray = [];
	hostObj = {};
	 
	var createSeriesObjSettings = {
		timestampIndex: $('#timestamp-index').val(),
		valueIndex: $('#value-index').val(),
		labelIndex: $('#label-index').val()
	}
	
	
	// Aggregate into an object by name
	seriesObjReturn  = createSeriesObj(createSeriesObjSettings, csvRows);
	seriesByName = seriesObjReturn.seriesByName
	
	// Set start/end times
	earliestTimestamp = seriesObjReturn.earliestTimestamp;
	latestTimestamp = seriesObjReturn.latestTimestamp;
	console.log("Earliest timestamp: "+ seriesObjReturn.earliestTimestamp + "\nLatestTimestamp: "+seriesObjReturn.latestTimestamp);
	
	// Reformat for HighCharts
	$.each(seriesByName, function (seriesName, data) {
	   
		tempSeriesArray.push({
			name: seriesName,
			type: $('#chart-type').val(),
			data: data
		});
	});
	
	var workerFunction = null;
	var aggregateSeriesSettings=null;
	
	// If we've been asked to, aggregate all the plotlines into one
	if ($('#aggregate-labels').is(':checked')) {
	
		aggregateSeriesSettings = {
			labelAggregationMethod: $('#label-aggregation-method').val(),
			chartType: $('#chart-type').val()
		}
		
		workerFunction = "aggregateSeries";
		
	}
	
	// Send off a web worker
	$("#container > span").html('Aggregating Series...');
	
	worker.postMessage(JSON.stringify({
		function: workerFunction,
		settings: aggregateSeriesSettings,
		value: tempSeriesArray
	}));
	
	
	// Wait for the worker to return
	worker.onmessage = function (event) {
		
		console.log("Worker return"); //debug
		
		tempSeriesArray = JSON.parse(event.data);
		
		
		
	
	
		if($('#jsonURL').val().length > 0){
			
			$("#container > span").html('Fetching JSON...');
			
			// Fetch the specified json
			$.getJSON($('#jsonURL').val(),function(jsonData){
				
				
				
				// Add each series to the list
				$.each(jsonData, function(index, jsonSeries){
					// Customise the series
					jsonSeries.type = $('#chart-type').val();
					jsonSeries.yAxis = 1;
					
					
					
					tempSeriesArray.push(jsonSeries);
				});
				
				
				
				// Sort by time
				sortByTimeAndDisplay(tempSeriesArray);
		   });
		}else{
			
			
			// Sort by time
			sortByTimeAndDisplay(tempSeriesArray);
		}
		
	}
}


var sortByTimeAndDisplay = function(tempSeriesArray){

	// Setup date/time picker
	$('#datetime-start-wrapper').datetimepicker({
		format: 'dd/MM/yyyy hh:mm:ss',
		startDate: new Date(earliestTimestamp),
		endDate: new Date(latestTimestamp)
	});
	$('#datetime-end-wrapper').datetimepicker({
		format: 'dd/MM/yyyy hh:mm:ss',
		startDate: new Date(earliestTimestamp),
		endDate: new Date(latestTimestamp)
	});
	$('#datetime-start-wrapper').data('datetimepicker').setDate(new Date(earliestTimestamp));
	$('#datetime-end-wrapper').data('datetimepicker').setDate(new Date(latestTimestamp));
	
	
	// Aggregate by time
	var workerFunction = null;
	var aggregateSeriesPointsByTimeSettings;
	if($('#granularity').val() != "unchanged"){
		
		$("#container > span").html('Aggregating By Time...');
		
		// Define the settings
		aggregateSeriesPointsByTimeSettings ={
			granularity: $('#granularity').val(),
			timeAggregationMethod: $('#time-aggregation-method').val()
		}
		workerFunction = "aggregateSeriesPointsByTime";
		//tempSeriesArray = aggregateSeriesPointsByTime(aggregateSeriesPointsByTimeSettings,tempSeriesArray);
	}
	
	// Send off a web worker
	console.log("sending off worker") ;//debug
	worker.postMessage(JSON.stringify({
		function: workerFunction,
		settings: aggregateSeriesPointsByTimeSettings,
		value: tempSeriesArray
	}));
	
	
	// Wait for the worker to return
	worker.onmessage = function (event) {
		console.log("Worker return"); //debug
		
		tempSeriesArray = JSON.parse(event.data);
		// Sort by time
		sortByTime(tempSeriesArray,function(tempSeriesArray){
				
			// Clone our temporary array to the permanent variable (if not already set)
			if(typeof(seriesArray) == "undefined"){
				seriesArray =  JSON.parse(JSON.stringify(tempSeriesArray));
			}
			
			// Clone our temporary array to be the current selection
			currentSelectionArray = JSON.parse(JSON.stringify(tempSeriesArray));
			
			// Create link to download chart data
			$('#download-element').attr("download", "graph.json").attr('href','data:textcharset=utf-8,'+encodeURI(JSON.stringify(seriesArray)));
				
			// Clone the thing (not doing this causes some very odd behaviour where some series don't actually exist! (probably irrelevant now workers clone it for us)
			//tempSeriesArray =  $.parseJSON(JSON.stringify(tempSeriesArray));
			
			// More than twenty series causes major problems
			if(tempSeriesArray.length > 20){
				var newSeriesStart = 0;
				tempSeriesArray = currentSelectionArray.slice(newSeriesStart,newSeriesStart+20);
				
				$('.restricted-series-nav h5').text("Displaying series " + newSeriesStart +" to "+(newSeriesStart+20));
				console.log("Restricting displayable serieses down to 20 from "+currentSelectionArray.length);
			}
			
			
			renderChart(tempSeriesArray);
		});
	}
 }
 
 var sortByTime = function(tempSeriesArray,callback){
		
	
		// Send off a web worker
		console.log("sending off worker to sort by time") ;//debug
		$("#container > span").html('Sorting By Time...');
		worker.postMessage(JSON.stringify({
			function: "sortSeriesPointsByTime",
			settings: {},
			value: tempSeriesArray
		}));
	
		
		
		// Wait for the worker to return
		worker.onmessage = function (event) {
				
			console.log("Worker return"); //debug
			$("#container > span").html('Rendering Chart...');
			
			
			
			tempSeriesArray = JSON.parse(event.data);
			callback(tempSeriesArray);
		}
}