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
		default:
			postMessage(data.value);
			break;
	}
	
	
});




var parseCSV = function(data, nextIndex){
	
	
	// Parse the data
	return 	{
		value: jQuery.csv.toArrays(data),
		nextIndex: nextIndex
	};

}