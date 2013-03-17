self.addEventListener("message", function(ev){
	
		
	// Get the data
	var data = JSON.parse(ev.data);
	
	// Find out which function they want
	switch(data.function){
		case "aggregateSeriesPointsByTime":
			
			// Send back the results
			postMessage(JSON.stringify(aggregateSeriesPointsByTime(data.settings,data.value)));
			break;
		case "aggregateSeries":
			
			// Send back the results
			postMessage(JSON.stringify(aggregateSeries(data.settings,data.value)));
			break;
		case "sortSeriesPointsByTime":
			postMessage(JSON.stringify(sortSeriesPointsByTime(data.value)));
			break;
		case "filterByTime":
			postMessage(JSON.stringify(filterByTime(data.value, data.startTime, data.endTime)));
			break;	
		case "filterByLabelName":
			postMessage(JSON.stringify(filterByLabelName(data.value, data.searchQuery)));
			break;
		default:
			postMessage(JSON.stringify(data.value));
			break;
	}
	
	
});

function roundTo(x,y){
    return (x % y) >= (y/2) ? parseInt(x / y) * y + y : parseInt(x / y) * y;
}

function roundUpTo(x,y){
    return (x % y) >= y ? parseInt(x / y) * y + y : parseInt(x / y) * y;
}

function sortByTimestamp(a, b) {
	if (a.x < b.x) return -1;
	if (a.x > b.x) return 1;
	return 0;
}

var filterByLabelName = function(inputSeriesArray, searchQuery){
	var outputSeriesArray = [];
	
	if(searchQuery.length > 0){
		// Loop through series
		for(index in inputSeriesArray){
			
			var tempSeries = JSON.parse(JSON.stringify(inputSeriesArray[index])); // clone the seriesObj
			if(tempSeries.name.toLowerCase().indexOf(searchQuery.toLowerCase()) >= 0){
				// We found it! Add the series to the array
				outputSeriesArray.push(tempSeries);
			}
		}
		return outputSeriesArray;
	}else{
		return inputSeriesArray;
	}
}

var filterByTime = function(inputSeries, startTime, endTime){
	var outputSeriesArray = [];
	
	// Loop through series
	for(index in inputSeries){
		
		var tempSeries = JSON.parse(JSON.stringify(inputSeries[index])); // clone the seriesObj
		tempSeries.data = []
		// Loop through datapoints
		for(i in inputSeries[index].data){
			
			// Check to see if it's timestamp is within the bounds
			if(inputSeries[index].data[i].x > startTime & inputSeries[index].data[i].x < endTime){
				 // All clear! Add to the array!
				 tempSeries.data.push(inputSeries[index].data[i]);
			}
		}
		// Push to the ouputSeriesArray
		outputSeriesArray.push(tempSeries);
	}
	return outputSeriesArray
}

var sortSeriesPointsByTime = function(series){
	
	// Loop through each series
	for(index in series){
		
		element = series[index];
		
		// Sort this series' datapoints
		element.data.sort(sortByTimestamp);
	}
	
	
	return series;
}

var aggregateSeriesPointsByTime = function(settings,seriesArray){
	var newseriesArray = [];
	
	// Loop through series
	for(index in seriesArray){
		
		series = seriesArray[index];
		
		// Initialise vars
		var timeSortedObj = {};
		var aggregatedData = [];
		
		// Loop through each datapoint and assign them to a less-granular timestamp
		for(i in series.data){
			element = series.data[i];
		
			// De-granularise the timestamp
			var timestamp = element.x;
			var timestampUnix = new Date(timestamp);
			switch (settings.granularity) {
				case "minute":
					
					timestampUnix.setSeconds(0);
					break;
				case "hour":
				
					timestampUnix.setMinutes(0);
					timestampUnix.setSeconds(0);
					break;
				case "day":
				
					timestampUnix.setHours(0);
					timestampUnix.setMinutes(0);
					timestampUnix.setSeconds(0);
					break;
				case "round-to-minutes-5":
					timestampUnix.setSeconds(0);
					timestampUnix.setMinutes(roundUpTo(timestampUnix.getMinutes(), 5));
					break;
				case "round-to-minutes-10":
					timestampUnix.setSeconds(0);
					timestampUnix.setMinutes(roundUpTo(timestampUnix.getMinutes(), 10));
					break;
				case "round-to-minutes-20":
					timestampUnix.setSeconds(0);
					timestampUnix.setMinutes(roundUpTo(timestampUnix.getMinutes(), 20));
					break;
				case "round-to-minutes-30":
					timestampUnix.setSeconds(0);
					timestampUnix.setMinutes(roundUpTo(timestampUnix.getMinutes(), 30));
					break;
			}

			timestampUnix = timestampUnix.getTime();
			var value = element.y;
			if(typeof(timeSortedObj[timestampUnix]) == 'undefined'){
				timeSortedObj[timestampUnix] = [];
			}
						timeSortedObj[timestampUnix].push(element);
		};
		
		
		
		// Loop through timestamps
		for(timestamp in timeSortedObj){
			valArray = timeSortedObj[timestamp];
			
			// Calculate the various stats
			aggr = aggregateDatapointArray(valArray,settings.timeAggregationMethod);
			
			// Push the aggregated value into the array
			aggregatedData.push({
				x: parseInt(timestamp),
				y: aggr
			});
		};
		
		// Sort data by timestamp
		//aggregatedData.sort(sortByTimestamp);
		 
		 // Update the series and push to the new array
		series.data = aggregatedData;
		newseriesArray.push(series);
		
	};

	return newseriesArray;
}              

var aggregateDatapointArray = function(datapointArray, aggregationType){
	
	var sum = 0;
	var aggr;
	var top = 0;
	
	// Loop through and figure out the highest value and the total of all values
	for (var x = 0; x < datapointArray.length; x++) {
		
	  sum += parseInt(datapointArray[x].y); // .y because its properties are x and y!
	  top = (datapointArray[x].y > top) ? parseInt(datapointArray[x].y) : top;
	}
	
	switch (aggregationType) {

		case "average":

			aggr = Math.round(sum / datapointArray.length);
			break;
		case "add":

			aggr = sum;
			break;
		case "top":
			
			aggr = top;
	}
	return aggr;
}    

var aggregateSeries = function(settings,seriesArray){
	var newSeriesDataByTime = {}; // we'll add values in by time, then average them
	var data = [];
	var newSeriesDataAveraged = {
		name: "Averaged",
		type: settings.chartType,
		data:[]
	};

	// Loop through all the labels
	for(index in seriesArray){
		element = seriesArray[index];

		for(index in element.data){
			datapoint = element.data[index];
			if(typeof(newSeriesDataByTime[datapoint.x]) == "undefined"){
				newSeriesDataByTime[datapoint.x] = [];
			}
			newSeriesDataByTime[datapoint.x].push(datapoint);

		};
	};


	// Loop through the newly added times and average them
	for(timestamp in newSeriesDataByTime){
		valArray = newSeriesDataByTime[timestamp];
	
		aggr = aggregateDatapointArray(valArray,settings.labelAggregationMethod);

		// Add it to the series
		data.push({
			x: parseInt(timestamp),
			y: Math.round(aggr)
		});
	};

	// Add the completed data object to the highcharts formatted object
	newSeriesDataAveraged.data = data;
	  
	// Now that we're done, replace the old series
	return [newSeriesDataAveraged];
}