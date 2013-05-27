
var jQuery= {}; //initialise dummy $ for jquery-csv
importScripts('http://jquery-csv.googlecode.com/files/jquery.csv-0.71.min.js');
self.addEventListener("message", function(ev){
	
		
	// Get the data
	var data =ev.data;
	
	// Parse the data
	data1 = jQuery.csv.toArrays(data);
	//delete data;
	postMessage(data1);

	
	
});