// Import CSV parser
var jQuery= {}; //initialise dummy $ for jquery-csv
importScripts('http://jquery-csv.googlecode.com/files/jquery.csv-0.71.min.js');


// Listen for input from the main script
self.addEventListener("message", function(ev){
	
		
	// Get the data
	var data = JSON.parse(ev.data);
	
	// Find out which function they want, call it, then return data
	// WARNING: Some functions stringify before returning, some do not.
	switch(data.function){


		case "parseCSV":
			postMessage(JSON.stringify(parseCSV(data.value, data.nextIndex)));
			break;
		case "sortSeriesPointsByTime":
			postMessage(JSON.stringify(sortSeriesPointsByTime(data.value)));
			break;
		default:
			postMessage(data.value);
			break;
	}
	
	
});


function sortByTimestamp(a, b) {
	// The unary + operator forces the javascript engine to call the objects valueOf method - and so it is two primitives that are being compared.
	// http://stackoverflow.com/questions/2888841/javascript-date-comparison

	if (+a[0] < +b[0]) return -1;
	if (+a[0] > +b[0]) return 1;
	return 0;
}

var sortSeriesPointsByTime = function(series){
	
	// Loop through each series
	for(index in series){
		
		element = series[index];
		
		// Sort this series' datapoints
		//element.data.sort(sortByTimestamp);
	}
	
	
	return series;
}


var parseCSV = function(data, nextIndex){
	
	
	// Parse the data
	return 	{
		value: jQuery.csv.toArrays(data),
		nextIndex: nextIndex
	};

}