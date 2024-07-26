jQuery(document).ready(function($){
	$('#lnkLogout').click(function(e){
		e.preventDefault();
		localStorage.clear();
		window.location = '/login';
	});
	
});

function showPDF(url){
	$('#pdfviewer').pdfViewer(url,{
		width:$( document ).width()*0.99,
		height:$( document ).height()*0.76,
	});
	$('#btnDownloadPDF').attr('href',url);
	$('#btnPrintPDF').click(function(e){
		e.preventDefault();
		printJS(url);
	});
	var myModalEl = document.getElementById('pdfModal');
	var myModal = new bootstrap.Modal(myModalEl, {
	  focus: true
	});
	myModal.show();
	myModalEl.addEventListener('hidden.bs.modal', function (event) {
		$('#pdfviewer').html('');
	})
}
function viewPDF(e){
	e.preventDefault();
	var elm = $(e.target);
	var url = elm.attr('href');
	console.log('href',url);
	showPDF(url);	
}
function bindOpenPDF(){
	$('.open-pdf').unbind('click',viewPDF);
	$('.open-pdf').click(viewPDF);
}
function printPDF(e){
	e.preventDefault();
	var elm = $(e.target);
	var url = elm.attr('href');
	console.log('href',url);
	printJS(url);	
}
function bindPrintPDF(){
	$('.print-pdf').unbind('click',viewPDF);
	$('.print-pdf').click(printPDF);
}
