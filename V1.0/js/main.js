function startGraphing() {
	$('.hero-unit').slideUp();
	$('main').slideDown();
}




$(document).ready(function(){

	// Add the initial log source
	var main = new logGrapher($('#log-grapher-well'));


	// When the chart's being rendered, we'll need to change the layout and text a little
	main.onRenderChart = function(){

		// Reuse the header and text about configuring log sources
		$('h2:first',this.parentWrapper).text('View Graph');
		$('p:first',this.parentWrapper).text('You can zoom and pan through the graph using your mouse and the on-hover toolbar in the graph.');

		// Maximize the area available to the graph
		$('#log-sources-well').css({
			width:"auto"
		});
	}
	
});