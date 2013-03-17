var chart;
var hostAverage;
var perVM;
var worker = new Worker('js/webworkers.js');
var csvWorker = new Worker('js/csvParserWorker.js');
var seriesArray;
var displayableStart = 0;
var chartName;
var currentSelectionArray;

function load()
{
	//Get your own Browser API Key from  https://code.google.com/apis/console/
	gapi.client.setApiKey('AIzaSyARN29uPAYghHG7TLcdvHu5Jp1b5ryobtc');
	gapi.client.load('urlshortener', 'v1');

}
window.onload = load;


$(document).ready(function () {

	// Enable history header
	$('#history-header').click(function(ev){
		ev.preventDefault();$('#history-wrapper').slideToggle();
	});

	// Enable the filter chart functionality
	$('#filter-chart').click(function(ev){
		var startTime = $('#datetime-start-wrapper').data('datetimepicker').getDate();
		var endTime = $('#datetime-end-wrapper').data('datetimepicker').getDate();
		
		// Loading...
		$("#container").html('<i class="icon-spinner icon-spin icon-large" id="loading"></i> <span>Loading</span>');
		// Send off to be filtered
		filterByTimestamp(startTime.getTime(), endTime.getTime(), function(tempSeriesArray){
			
			console.log(JSON.parse(JSON.stringify(tempSeriesArray))); //debug
			
			sortByTimeAndDisplay(tempSeriesArray);
		});
	});
	
	// Enable the next/previous buttons for cycling through series
	$('#previous-series').click(function(ev){
	
		var numSeriesDisplayed = parseInt($('#num-series-displayed').val())
		displayableStart = displayableStart-numSeriesDisplayed;
		changeDisplayedSeries(displayableStart);
	});
	$('#next-series').click(function(ev){
		
		var numSeriesDisplayed = parseInt($('#num-series-displayed').val())
		displayableStart = displayableStart+numSeriesDisplayed;
		changeDisplayedSeries(displayableStart);
	});
	
	
	// Enable the short url generator
	$('#short-url').click(function(ev){
		ev.preventDefault();

		$('#short-url').text("Please wait..."); //debug
		// Show the Modal
		$('#short-url-modal').modal({show:true});

		var request = gapi.client.urlshortener.url.insert({
		  'resource': {
			  'longUrl': location.href
			}
		});
		request.execute(function(response) 
		{

			if(response.id != null)
			{
				$('#short-url').text("Short URL");
				$('#short-url-modal p').text(response.id)

			}
			else
			{
				$('#short-url-modal p').text(response.error);
			}

		});
	});

	// Check for pre-filled report
	populateFormFromHash();

	$("#input-form").submit(function (ev) {
		ev.preventDefault();
		  
		// Display Container(s)
		$('#container,.chart-options').show(); 

		// Update the hash
		updateHash();

		if($('#chart-height').val()!=""){
		  
			 $('#container').height($('#chart-height').val());
		}
		$('#input-form').slideUp();
		$("#container").html('<i class="icon-spinner icon-spin icon-large" id="loading"></i> <span>Loading</span>');
		
		// Fetch local CSV example: http://jsfiddle.net/CnJYR/

		if ($('#local-csv').get(0).files.length > 0) {
			 //Retrieve the first (and only!) File from the FileList object
			var file = $('#local-csv').get(0).files[0];

			if (file) {
			var reader = new FileReader();
			reader.onload = function (e) {
			
				
				chartName = file.name;
				var contents = e.target.result;
				
				parseCSV(contents);
				console.log("Got the file" + "name: " + file.name + "\n" + "type: " + file.type + "\n" + "size: " + file.size + " bytes");
			}
			
			// Send off the reader to read the file, we'll have to wait until "onload" fires
			reader.readAsText(file);
			} else {
				alert("Failed to load file");
			}
		}else if($('#csvURL').val().length > 0){
			
			
			
			// Fetch the CSV from HTTP
			$.ajax($('#csvURL').val(), {
				xhr: function(){
				var xhr = new window.XMLHttpRequest();

					//Upload progress
					xhr.upload.addEventListener("progress", function(evt){
						if (evt.lengthComputable) {
							var percentComplete =(evt.loaded / evt.total) * 100;

							// Round to two decimal places
							percentComplete = Math.round(percentComplete*100)/100;

							//Do something with upload progress
							console.log(percentComplete);
						}
					}, false);

					//Download progress
					xhr.addEventListener("progress", function(evt){
						if (evt.lengthComputable) {
							var percentComplete =(evt.loaded / evt.total) * 100;

							// Round to two decimal places
							percentComplete = Math.round(percentComplete*100)/100;

							//Do something with download progress
							$("#container > span").html('Loading - ' +percentComplete+'%');
						}
					}, false);
					return xhr;
				},
				success: function (data) {
					
					// Get filename
					var filename = $('#csvURL').val().match("\/[^\/]*$");
					filename = filename[0];
					
					chartName = filename;
					
					console.log("CSV fetched: " + filename); //debug
					if (data.length > 0) {
						parseCSV(data);
					} else {
						$("#container").html("<h2>Error</h2><p>Invalid Input</p>").addClass("alert").addClass("alert-error");
					}
				},
				error: function (jqXHR, textStatus, errorThrown) {
					$("#container").html("<h2>Error</h2>" + errorThrown).addClass("alert").addClass("alert-error");
				}
			});
		} else if($('#jsonURL').val().length > 0){
			
			
			// Get filename
			var filename = $('#jsonURL').val().match("\/[^\/]*$");
			filename = filename[0];
			
			chartName = filename;
			
			$("#container > span").html('Fetching JSON...');
			
			// Fetch the specified json
			$.getJSON($('#jsonURL').val(),function(tempSeriesArray){
				
				
				
				
				
				// Sort by time
				sortByTimeAndDisplay(tempSeriesArray);
		   }); 
		}else{
			alert("Please enter a datasource"); //debug
			
		}
		return false;
	});
});

 var updateHash = function(){
	
	// Stringify form
	var hashInput = JSON.stringify($('form').serializeArray());
	
	var hash = Iuppiter.Base64.encode(Iuppiter.compress(hashInput),true);
	
	console.log("Uncompressed query length: "+hashInput.length +" chars");// debug
	console.log("Compressed query length: "+hash.length+" chars"); //debug
	window.location.hash =  hash;
 }
 
 var cleanJSON = function(json){
	var amountToTrim = (json.length-1)-json.lastIndexOf(']');
	return json.slice(json, json.length-amountToTrim);
 }

var filterByTimestamp = function(startTime, endTime, callback){

	worker.postMessage(JSON.stringify({
		function: "filterByTime",
		startTime: startTime,
		endTime: endTime,
		value: seriesArray
	}));
	
	
	// Wait for the worker to return
	worker.onmessage = function (event) {
		console.log("Worker return: filterByTimestamp"); //debug
		
		currentSelectionArray = JSON.parse(event.data);
		callback(currentSelectionArray);
	}
	
}
 
 var changeDisplayedSeries = function(newSeriesStart){
	var numSeriesDisplayed = parseInt($('#num-series-displayed').val());
	var tempSeriesArray = currentSelectionArray.slice(newSeriesStart,newSeriesStart+numSeriesDisplayed);
	console.log("Displaying series " + newSeriesStart +" to "+(newSeriesStart+numSeriesDisplayed));
	$('.restricted-series-nav h5').text("Displaying series " + newSeriesStart +" to "+(newSeriesStart+numSeriesDisplayed) +" of " +seriesArray.length);
	
	renderChart(tempSeriesArray);
	
}
 
 var populateFormFromHash = function(){
	if (window.location.hash) {

		// Fetch Hash
		var hash = window.location.hash.substring(1);
		
		// Decompress
		var decompressedHash = Iuppiter.decompress(Iuppiter.Base64.decode(Iuppiter.toByteArray(hash), true));
		
		// Clear invalid characters that occasionally result from compression
		decompressedHash = cleanJSON(decompressedHash); 
		
		// Decode JSON
		decompressedHash = $.parseJSON(decompressedHash); //debug
		
		// Loop through each value and set it in the form
		$.each(decompressedHash, function (index, element) {
			if(element.value == "on"){
				$('[name=' + element.name + ']').attr('checked', true);
			}else{
				$('[name=' + element.name + ']').val(element.value);
			}
		});;

	}
 
 }
  
  var renderChart = function (series1) {
	
	
    // Initialise chart
    chart = new Highcharts.Chart({
        plotOptions: {
			
             series: {
                //enableMouseTracking: false,
                marker: {
                      enabled: true
                },
				turboThreshold: 1000000,
				connectNulls: true,
              },
              marker: {
                  lineWidth: 1
              },
             
          },
          chart: {
              zoomType: 'x',
              renderTo: 'container'
          },
          legend: {
              enabled: true
          },
          tooltip: {
              shared: true,
              crosshairs: true,
			  enabled:true,
            
          },
          title: {
              text: chartName
          },
          subtitle: {
              //text: 'Delayed write fail instances multiplied by ten'
          },
          xAxis: {
              type: 'datetime',
          },
          yAxis: [{
              title: {
                  text: ""
              },
			
              labels: {
                  formatter: function () {
                      return this.value;
                  },
                  style: {
                      color: '#4572A7'
                  }
              },
              min: 0,
              opposite: false
          },{
              title: {
                  text: ""
              },
			labels: {
                  formatter: function () {
                      return this.value;
                  },
                  style: {
                      color: '#4572A7'
                  }
              },
              min: 0,
              opposite: true
          }],


          series: series1

      });
  }