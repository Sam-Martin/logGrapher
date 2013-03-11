var chart;
var hostAverage;
var perVM;
var worker = new Worker('js/webworkers.js');

function sortByTimestamp(a, b) {
	if (a.x < b.x) return -1;
	if (a.x > b.x) return 1;
	return 0;
}
function load()
{
	//Get your own Browser API Key from  https://code.google.com/apis/console/
	gapi.client.setApiKey('AIzaSyARN29uPAYghHG7TLcdvHu5Jp1b5ryobtc');
	gapi.client.load('urlshortener', 'v1');

}
window.onload = load;


$(document).ready(function () {


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

	$("form").submit(function (ev) {
		ev.preventDefault();
		  
		// Display Container(s)
		$('#container,#chart-options').show(); 

		// Update the hash
		updateHash();

		if($('#chart-height').val()!=""){
		  
			 $('#container').height($('#chart-height').val());
		}
		$('form').slideUp();
		$("#container").html('<i class="icon-spinner icon-spin icon-large" id="loading"></i> <span>Loading</span>');
		
		// Fetch local CSV example: http://jsfiddle.net/CnJYR/

		if ($('#local-csv').get(0).files.length > 0) {
			 //Retrieve the first (and only!) File from the FileList object
			var file = $('#local-csv').get(0).files[0];

			if (file) {
			var reader = new FileReader();
			reader.onload = function (e) {
			
				
				var contents = e.target.result;
				
				parseCSV(contents);
				console.log("Got the file.n" + "name: " + file.name + "\n" + "type: " + file.type + "\n" + "size: " + file.size + " bytes");
			}
			
			// Send off the reader to read the file, we'll have to wait until "onload" fires
			reader.readAsText(file);
			} else {
				alert("Failed to load file");
			}
		} else {

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
  
	
     
	// Create link to download chart data
	$('#download-element').attr("download", "graph.json").attr('href','data:textcharset=utf-8,'+encodeURI(JSON.stringify(series1)));
	
	
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
              text: 'Custom Graph'
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