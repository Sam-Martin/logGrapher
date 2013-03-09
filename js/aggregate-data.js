function roundTo(x,y)
{
    return (x % y) >= (y/2) ? parseInt(x / y) * y + y : parseInt(x / y) * y;
}

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
			type: $('#chart-type').val(),
			data: data
		});
    });
	
	
	
      // If we've been asked to, aggregate all the plotlines into one
      if ($('#aggregate-labels').is(':checked')) {
         seriesArray = aggregateSeries(seriesArray);
      }
      
	if($('#jsonURL').val().length > 0){
		
		// Fetch the specified json
		$.getJSON($('#jsonURL').val(),function(jsonData){
		
			// Add each series to the list
			$.each(jsonData, function(index, jsonSeries){
				// Customise the series
				jsonSeries.type = $('#chart-type').val();
				jsonSeries.yAxis = 1;
				seriesArray.push(jsonSeries);
			});
			
			seriesArray = aggregateSeriesPointsByTime(seriesArray);
			
			// Clone the thing (not doing this causes some very odd behaviour where some series don't actually exist!
			seriesArray =  $.parseJSON(JSON.stringify(seriesArray));
			
			renderChart(seriesArray);
			//renderChart([{"name":"Averaged","type":"line","data":[{"x":1362265200000,"y":15},{"x":1362268800000,"y":15},{"x":1362272400000,"y":18},{"x":1362276000000,"y":20},{"x":1362279600000,"y":18},{"x":1362283200000,"y":121},{"x":1362286800000,"y":11},{"x":1362290400000,"y":11},{"x":1362294000000,"y":14},{"x":1362297600000,"y":14},{"x":1362301200000,"y":13},{"x":1362304800000,"y":11},{"x":1362308400000,"y":10},{"x":1362312000000,"y":10},{"x":1362315600000,"y":11},{"x":1362319200000,"y":11},{"x":1362322800000,"y":6},{"x":1362326400000,"y":6},{"x":1362330000000,"y":6},{"x":1362333600000,"y":8},{"x":1362337200000,"y":10},{"x":1362340800000,"y":6},{"x":1362344400000,"y":5},{"x":1362348000000,"y":7},{"x":1362351600000,"y":11},{"x":1362355200000,"y":89},{"x":1362358800000,"y":11},{"x":1362362400000,"y":14},{"x":1362366000000,"y":16},{"x":1362369600000,"y":10},{"x":1362373200000,"y":7},{"x":1362376800000,"y":8},{"x":1362380400000,"y":8},{"x":1362384000000,"y":8},{"x":1362387600000,"y":11},{"x":1362391200000,"y":7},{"x":1362394800000,"y":10},{"x":1362398400000,"y":8},{"x":1362402000000,"y":8},{"x":1362405600000,"y":8},{"x":1362409200000,"y":8},{"x":1362412800000,"y":88},{"x":1362416400000,"y":12},{"x":1362420000000,"y":8},{"x":1362423600000,"y":8},{"x":1362427200000,"y":8},{"x":1362430800000,"y":7},{"x":1362434400000,"y":7},{"x":1362438000000,"y":11},{"x":1362441600000,"y":15},{"x":1362445200000,"y":11},{"x":1362448800000,"y":9},{"x":1362452400000,"y":9},{"x":1362456000000,"y":61},{"x":1362459600000,"y":17},{"x":1362463200000,"y":9},{"x":1362466800000,"y":8},{"x":1362470400000,"y":15},{"x":1362474000000,"y":85},{"x":1362477600000,"y":7},{"x":1362481200000,"y":8},{"x":1362484800000,"y":7},{"x":1362488400000,"y":5},{"x":1362492000000,"y":5},{"x":1362495600000,"y":7},{"x":1362499200000,"y":8},{"x":1362502800000,"y":81},{"x":1362506400000,"y":7},{"x":1362510000000,"y":8},{"x":1362513600000,"y":11},{"x":1362517200000,"y":10},{"x":1362520800000,"y":7},{"x":1362524400000,"y":6},{"x":1362528000000,"y":6},{"x":1362531600000,"y":7},{"x":1362535200000,"y":10},{"x":1362538800000,"y":12},{"x":1362542400000,"y":9},{"x":1362546000000,"y":89},{"x":1362549600000,"y":7},{"x":1362553200000,"y":7},{"x":1362556800000,"y":7},{"x":1362560400000,"y":90},{"x":1362564000000,"y":7},{"x":1362567600000,"y":7},{"x":1362571200000,"y":7},{"x":1362574800000,"y":7},{"x":1362578400000,"y":7},{"x":1362582000000,"y":7},{"x":1362585600000,"y":7},{"x":1362589200000,"y":64},{"x":1362592800000,"y":8},{"x":1362596400000,"y":10},{"x":1362600000000,"y":10},{"x":1362603600000,"y":10},{"x":1362607200000,"y":7},{"x":1362610800000,"y":11},{"x":1362614400000,"y":9},{"x":1362618000000,"y":10},{"x":1362621600000,"y":9},{"x":1362625200000,"y":12},{"x":1362628800000,"y":12},{"x":1362632400000,"y":83},{"x":1362636000000,"y":9},{"x":1362639600000,"y":9},{"x":1362643200000,"y":10},{"x":1362646800000,"y":80},{"x":1362650400000,"y":13},{"x":1362654000000,"y":9},{"x":1362657600000,"y":7},{"x":1362661200000,"y":8},{"x":1362664800000,"y":7},{"x":1362668400000,"y":7},{"x":1362672000000,"y":11},{"x":1362675600000,"y":66},{"x":1362679200000,"y":8},{"x":1362682800000,"y":5},{"x":1362686400000,"y":8},{"x":1362690000000,"y":8},{"x":1362693600000,"y":8},{"x":1362697200000,"y":10}]},{"name":"Average response time","data":[{"x":1362142800000,"y":92},{"x":1362146400000,"y":89},{"x":1362150000000,"y":77},{"x":1362153600000,"y":84},{"x":1362157200000,"y":77},{"x":1362160800000,"y":82},{"x":1362164400000,"y":97},{"x":1362168000000,"y":326},{"x":1362171600000,"y":106},{"x":1362175200000,"y":106},{"x":1362178800000,"y":99},{"x":1362182400000,"y":355},{"x":1362186000000,"y":183},{"x":1362189600000,"y":159},{"x":1362193200000,"y":147},{"x":1362196800000,"y":158},{"x":1362200400000,"y":130},{"x":1362204000000,"y":131},{"x":1362207600000,"y":121},{"x":1362211200000,"y":353},{"x":1362214800000,"y":130},{"x":1362218400000,"y":110},{"x":1362222000000,"y":146},{"x":1362225600000,"y":156},{"x":1362229200000,"y":133},{"x":1362232800000,"y":106},{"x":1362236400000,"y":83},{"x":1362240000000,"y":96},{"x":1362243600000,"y":78},{"x":1362247200000,"y":74},{"x":1362250800000,"y":85},{"x":1362254400000,"y":96},{"x":1362258000000,"y":90},{"x":1362261600000,"y":88},{"x":1362265200000,"y":109},{"x":1362268800000,"y":128},{"x":1362272400000,"y":163},{"x":1362276000000,"y":159},{"x":1362279600000,"y":113},{"x":1362283200000,"y":364},{"x":1362286800000,"y":102},{"x":1362290400000,"y":99},{"x":1362294000000,"y":92},{"x":1362297600000,"y":78},{"x":1362301200000,"y":77},{"x":1362304800000,"y":77},{"x":1362308400000,"y":81},{"x":1362312000000,"y":72},{"x":1362315600000,"y":69},{"x":1362319200000,"y":74},{"x":1362322800000,"y":92},{"x":1362326400000,"y":77},{"x":1362330000000,"y":71},{"x":1362333600000,"y":82},{"x":1362337200000,"y":75},{"x":1362340800000,"y":84},{"x":1362344400000,"y":73},{"x":1362348000000,"y":69},{"x":1362351600000,"y":84},{"x":1362355200000,"y":null},{"x":1362358800000,"y":125},{"x":1362362400000,"y":148},{"x":1362366000000,"y":104},{"x":1362369600000,"y":98},{"x":1362373200000,"y":70},{"x":1362376800000,"y":75},{"x":1362380400000,"y":81},{"x":1362384000000,"y":107},{"x":1362387600000,"y":120},{"x":1362391200000,"y":104},{"x":1362394800000,"y":108},{"x":1362398400000,"y":109},{"x":1362402000000,"y":106},{"x":1362405600000,"y":106},{"x":1362409200000,"y":89},{"x":1362412800000,"y":185},{"x":1362416400000,"y":151},{"x":1362420000000,"y":97},{"x":1362423600000,"y":80},{"x":1362427200000,"y":74},{"x":1362430800000,"y":87},{"x":1362434400000,"y":61},{"x":1362438000000,"y":93},{"x":1362441600000,"y":71},{"x":1362445200000,"y":118},{"x":1362448800000,"y":92},{"x":1362452400000,"y":83},{"x":1362456000000,"y":149},{"x":1362459600000,"y":133},{"x":1362463200000,"y":82},{"x":1362466800000,"y":92},{"x":1362470400000,"y":112},{"x":1362474000000,"y":311},{"x":1362477600000,"y":106},{"x":1362481200000,"y":128},{"x":1362484800000,"y":88},{"x":1362488400000,"y":80},{"x":1362492000000,"y":87},{"x":1362495600000,"y":99},{"x":1362499200000,"y":96},{"x":1362502800000,"y":240},{"x":1362506400000,"y":109},{"x":1362510000000,"y":82},{"x":1362513600000,"y":92},{"x":1362517200000,"y":99},{"x":1362520800000,"y":90},{"x":1362524400000,"y":106},{"x":1362528000000,"y":83},{"x":1362531600000,"y":104},{"x":1362535200000,"y":102},{"x":1362538800000,"y":84},{"x":1362542400000,"y":73},{"x":1362546000000,"y":221},{"x":1362549600000,"y":81},{"x":1362553200000,"y":85},{"x":1362556800000,"y":77},{"x":1362560400000,"y":237},{"x":1362564000000,"y":89},{"x":1362567600000,"y":109},{"x":1362571200000,"y":104},{"x":1362574800000,"y":87},{"x":1362578400000,"y":126},{"x":1362582000000,"y":89},{"x":1362585600000,"y":77},{"x":1362589200000,"y":193},{"x":1362592800000,"y":95},{"x":1362596400000,"y":89},{"x":1362600000000,"y":69},{"x":1362603600000,"y":86},{"x":1362607200000,"y":72},{"x":1362610800000,"y":94},{"x":1362614400000,"y":69},{"x":1362618000000,"y":84},{"x":1362621600000,"y":82},{"x":1362625200000,"y":107},{"x":1362628800000,"y":113},{"x":1362632400000,"y":276},{"x":1362636000000,"y":88},{"x":1362639600000,"y":104},{"x":1362643200000,"y":166},{"x":1362646800000,"y":309},{"x":1362650400000,"y":188},{"x":1362654000000,"y":105},{"x":1362657600000,"y":106},{"x":1362661200000,"y":100},{"x":1362664800000,"y":91},{"x":1362668400000,"y":106},{"x":1362672000000,"y":115},{"x":1362675600000,"y":188},{"x":1362679200000,"y":124},{"x":1362682800000,"y":62},{"x":1362686400000,"y":78},{"x":1362690000000,"y":81},{"x":1362693600000,"y":90},{"x":1362697200000,"y":95},{"x":1362700800000,"y":89},{"x":1362704400000,"y":133},{"x":1362708000000,"y":165},{"x":1362711600000,"y":91},{"x":1362715200000,"y":77},{"x":1362718800000,"y":112},{"x":1362722400000,"y":95},{"x":1362726000000,"y":85},{"x":1362729600000,"y":116},{"x":1362733200000,"y":128},{"x":1362736800000,"y":263},{"x":1362740400000,"y":89},{"x":1362744000000,"y":78},{"x":1362747600000,"y":78}],"type":"line"}] ); 
	   });
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
			var timestampUnix = new Date(timestamp);
			switch ($('#granularity').val()) {
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
				case "round-to-minutes":
					timestampUnix.setSeconds(0);
					timestampUnix.setMinutes(roundTo(timestampUnix.getMinutes(), 5));
					break;
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
			  sum += parseInt(valArray[x].y); // .y because its properties are x and y!
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
		//aggregatedData.sort(sortByTimestamp);
		 
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
		type: $('#chart-type').val(),
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