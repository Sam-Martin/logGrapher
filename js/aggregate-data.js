

var createSeriesObj = function(settings, csvRows){
	 
	seriesByName = {}
	 
	// Loop through the rows and aggregate the series (defined by 'labels') into objects
	for(key in csvRows){
		element = csvRows[key];

		var val = element[settings.valueIndex];
		var timestamp = element[settings.timestampIndex];
		var seriesName = element[settings.labelIndex];

		if (parseInt(val) >= 0 && seriesName.length > 0) {

			// Check to see if the series has been added to the obj
			if (typeof (seriesByName[seriesName]) == 'undefined') {

				// It hasn't, add it
				seriesByName[seriesName] = [];
			}

			// Format Unix Timestamp
			var timestampUnix

			timestampUnix = Date.UTC(timestamp.substr(6, 4), timestamp.substr(3, 2) - 1, timestamp.substr(0, 2), timestamp.substr(11, 2), timestamp.substr(14, 2), timestamp.substr(17, 2));


			seriesByName[seriesName].push({
				x: timestampUnix, 
				y: parseInt(val)
			});

		}
	};
	return seriesByName;
}

var parseCSV = function (data) {
      // Parse CSV data
      csvRows = $.csv.toArrays(data);
	  // Initialise variables
      hostAverage = [];
      tempSeriesArray = [];
      hostObj = {};
     
	var createSeriesObjSettings = {
		timestampIndex: $('#timestamp-index').val(),
		valueIndex: $('#value-index').val(),
		labelIndex: $('#label-index').val()
	}
	  
	seriesByName = createSeriesObj(createSeriesObjSettings, csvRows);

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
		
	};
	
}

var sortByTimeAndDisplay = function(tempSeriesArray){
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
		
			// Commit our temporary array to the permanent variable
			seriesArray = tempSeriesArray;
			

			
			// Clone the thing (not doing this causes some very odd behaviour where some series don't actually exist! (probably irrelevant now workers clone it for us)
			//tempSeriesArray =  $.parseJSON(JSON.stringify(tempSeriesArray));
			
			// More than twenty series causes major problems
			if(tempSeriesArray.length > 20){
				var newSeriesStart = 0;
				tempSeriesArray = seriesArray.slice(newSeriesStart,newSeriesStart+20);
				
				$('#restricted-series-nav h5').text("Displaying series " + newSeriesStart +" to "+(newSeriesStart+20));
				console.log("Restricting displayable serieses down to 20 from "+seriesArray.length);
				$('#restricted-series-nav').show();
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