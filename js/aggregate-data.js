var parseCSV = function (data) {
      // Parse CSV data
      csvRows = $.csv.toArrays(data);
	  // Initialise variables
      hostAverage = [];
      seriesArray = [];
      hostObj = {};
      seriesByName = {}
      var timestampIndex = $('#timestamp-index').val();
      var valueIndex = $('#value-index').val();
      var labelIndex = $('#label-index').val();
	  
      // Loop through the rows and aggregate the series (defined by 'labels') into objects
      $.each(csvRows, function (index, element) {

          var val = element[valueIndex];
          var timestamp = element[timestampIndex];
          var seriesName = element[labelIndex];

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
      });

    // Reformat for HighCharts
    $.each(seriesByName, function (seriesName, data) {
       
		seriesArray.push({
			name: seriesName,
			data: data
		});
    });
	
	
	
      // If we've been asked to, aggregate all the plotlines into one
      if ($('#aggregate-labels').is(':checked')) {
         seriesArray = aggregateSeries(seriesArray);
      }
      
	if($('#jsonURL').val().length > 0){
	   $.getJSON($('#jsonURL').val(),function(data){
		   // Add a new data to a separate axis
		   $.each(data, function(index, element){
			   
		   });
						
		   // Add each series to the list
		   $.each(data, function(index, element){
			   element.yAxis = 1;
			   
			   seriesArray.push(element);
		   });
		   console.log("Per VM:"); //debug
			
			seriesArray = aggregateSeriesPointsByTime(seriesArray);
			console.log(seriesArray); //debug 
			renderChart(seriesArray);
	   } 
	   );
	}else{
		seriesArray = aggregateSeriesPointsByTime(seriesArray);
	   renderChart(seriesArray);
	}


      
      // Output to textarea as JSON
    //  $('#jsonOutput').val(JSON.stringify(seriesArray));
  }
  
  var aggregateSeriesPointsByTime = function(seriesArray){
	var newseriesArray = [];
	
	// Loop through series
	$.each(seriesArray, function(index, series){
	
		// Initialise vars
		var timeSortedObj = {};
		var aggregatedData = [];
		
		// Loop through each datapoint and assign them to a less-granular timestamp
		$.each(series.data, function(index, element){
		
			// De-granularise the timestamp
			var timestamp = element.x;
			
			switch ($('#granularity').val()) {
			  case "unchanged":
				  timestampUnix = new Date(timestamp);
				  break;
			  case "minute":
				  timestampUnix = new Date(timestamp);
				  timestampUnix.setSeconds(0);
				  break;
			  case "hour":
				  timestampUnix = new Date(timestamp);
				  timestampUnix.setMinutes(0);
				  timestampUnix.setSeconds(0);
				  break;
			  case "day":
				  timestampUnix = new Date(timestamp);
				  timestampUnix.setHours(0);
				  timestampUnix.setMinutes(0);
				  timestampUnix.setSeconds(0);
			}

			timestampUnix = timestampUnix.getTime();
			var value = element.y;
			if(typeof(timeSortedObj[timestampUnix]) == 'undefined'){
				timeSortedObj[timestampUnix] = [];
			}
						timeSortedObj[timestampUnix].push(element);
		});
		
		// Loop through timestamps
		$.each(timeSortedObj, function(timestamp, valArray){
			// Calculate the total
			var sum = 0;
			var aggr;
			
			for (var x = 0; x < valArray.length; x++) {
			  sum += parseInt(valArray[x].y); // .x because its properties are x and y!
			}
			
			switch ($('#combination-method').val()) {

			  case "average":
				
				  aggr = Math.round(sum / valArray.length);
				  break;
			  case "add":
				
				  aggr = sum;
				  break;
			}
			
			// Push the aggregated value into the array
			aggregatedData.push({
				x: parseInt(timestamp),
				y: aggr
			});
		});
		
		
		// Sort data by timestamp
		aggregatedData.sort(sortByTimestamp);
		 
		 // Update the series and push to the new array
		series.data = aggregatedData;
		newseriesArray.push(series);
	});

	return newseriesArray;
}                  

var aggregateSeries = function(seriesArray){
	var newSeriesDataByTime = {}; // we'll add values in by time, then average them
	var data = [];
	var newSeriesDataAveraged = {
		name: "Averaged",
		data:[]
	};

	// Loop through all the labels
	$.each(seriesArray,function(index, element){

		$.each(element.data, function(index, datapoint){
		if(typeof(newSeriesDataByTime[datapoint.x]) == "undefined"){
			newSeriesDataByTime[datapoint.x] = [];
		}
		newSeriesDataByTime[datapoint.x].push(datapoint.y);

		});
	});


	// Loop through the newly added times and average them
	$.each(newSeriesDataByTime, function(timestamp, valArray){
	
	  // Calculate the total
	  var sum = 0;
	  var aggr;
	  for (var x = 0; x < valArray.length; x++) {
		  sum += parseInt(valArray[x]);
	  }
	  
	  // Calculate the average
	  aggr = sum/valArray.length;
	  
	  // Add it to the series
	  data.push({
		  x: parseInt(timestamp),
		  y: Math.round(aggr)
	  });
	});

	// Add the completed data object to the highcharts formatted object
	newSeriesDataAveraged.data = data;
	  
	// Now that we're done, replace the old series
	return [newSeriesDataAveraged];
}