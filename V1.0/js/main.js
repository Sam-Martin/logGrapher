function startGraphing() {
	$('.hero-unit').slideUp();
	$('main').slideDown();
}



function toggleUrlFileInput(ev, type){
	
	// Get logSourceRow
	var logSourceRow = $(ev.srcElement).parents('.log-sources');
		
	// Show the configure source button
	logSourceRow.find('.log-sources-source-settings').css('display', 'inline-block');
	
	// Remove any other button primary from this button group
	logSourceRow.find('.btn-inverse').removeClass('btn-inverse');
	
	// Make clicked button primary
	$(ev.srcElement).addClass('btn-inverse');
	
	if(type=="url"){
		
		logSourceRow.data('logSource').currentSource = "url";
		logSourceRow.find('.log-sources-source-url').css('display', 'inline-block');
		logSourceRow.find('.log-sources-source-file').hide();
	}else{
		
		logSourceRow.data('logSource').currentSource = "file";
		logSourceRow.find('.log-sources-source-url').hide();
		logSourceRow.find('.log-sources-source-file').css('display', 'inline-block');
	}
	
}
	





function updateProgress(logSourceRow){
	logSourceRow = $(logSourceRow);
	
	// Hide everything but the progress bar and label
	logSourceRow.find('li:not(.log-sources-progress-bar-wrapper)').hide();
	
	// Show the progres bar and label
	logSourceRow.find('.log-sources-progress-bar-wrapper').show();
	
	
}

$(document).ready(function(){

	// Add the initial log source
	var main = new logGrapher($('#log-sources-header'));
	
});