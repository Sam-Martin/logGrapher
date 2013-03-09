  var chart;
  var hostAverage
  var perVM

      function sortByTimestamp(a, b) {
          if (a.x < b.x) return -1;
          if (a.x > b.x) return 1;
          return 0;
      }

      //objs.sort(compare);
      $(document).ready(function () {

          // Check for pre-filled report
          if (window.location.hash) {
              var hash = window.location.hash.substring(1); //Puts hash in variable, and removes the # character
              // loop through each value and set it in the form
              $.each($.parseJSON(decodeURIComponent(hash)), function (index, element) {
                  if(element.value == "on"){
                      $('[name=' + element.name + ']').attr('checked', true);
                  }else{
                      $('[name=' + element.name + ']').val(element.value);
                  }
              });;

          }

          $("form").submit(function (ev) {
              ev.preventDefault();
                
       
              // Update the hash
              window.location.hash = encodeURIComponent(JSON.stringify($('form').serializeArray()));
              
              if($('#chart-height').val()!=""){
                  
                      $('#container').height($('#chart-height').val());
              }
              $('form').slideUp();
              $("#container").html('<i class="icon-spinner icon-spin icon-large" id="loading"></i> Loading');

              if ($('#csvRaw').val().length > 0) {
                  parseCSV($('#csvRaw').val());
              } else {
                  $.ajax(
                  $('#csvURL').val(), {
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
              //shared: true,
              //crosshairs: true,
			  enabled:true,
              formatter: function () {

                  return "<strong>" + this.series.name + ":</strong>" + this.y + "<br/>" + Highcharts.dateFormat("%d/%m/%Y %H:%M:%S", parseInt(this.x));
              }
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
              opposite: true
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
	  console.log(chart);//debug
  }