jQuery(document).ready(function($){
	console.log('ready');
		
	function adjustLayout(){
		const divHeight = ($(window).height()-$('#first-row').height()-20);
		$('#pane1').css('height', divHeight+'px');;
		var we = $('#editor-container').width();
		$('#editor-tabs').css('maxWidth',we+"px");
	}
	$( window ).bind( "resize", adjustLayout ); 
	adjustLayout();
	
	
	let isDragging = false;	
	//splitter
	splitter.addEventListener('mousedown', (e) => {
		isDragging = true;
		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('mouseup', onMouseUp);
	});

	function onMouseMove(e) {
		if (!isDragging) return;

		let containerOffsetLeft = document.querySelector('.containerx').offsetLeft;
		let newLeftWidth = e.clientX - containerOffsetLeft;

		let containerWidth = document.querySelector('.containerx').clientWidth;
		let splitterWidth = splitter.clientWidth;

		pane1.style.width = newLeftWidth + 'px';
		pane2.style.width = (containerWidth - newLeftWidth - splitterWidth) + 'px';
	}

	function onMouseUp() {
		isDragging = false;
		document.removeEventListener('mousemove', onMouseMove);
		document.removeEventListener('mouseup', onMouseUp);
	}
	//end splitter
	
	
	loadEditor();
	//forms
	$('#frmFolder').submit(function(e){
		e.preventDefault();
		
		const data = Object.fromEntries(new FormData(e.target).entries());
		const title = data.folderpath;
		console.log(data)
		openDir(data.folderpath);
		document.title = title;		
		$('.second-row').removeClass('d-none');
	});
	
	$('#frmAutocomplete').submit(function(e){
		e.preventDefault();
		const dir = $('#folderpath').val();
		var formData = Object.fromEntries(new FormData(e.target).entries());
		formData.root = dir;
		console.log(formData);

		$.ajax({
		  url: 'api/files/words',
		  method: 'POST',
		  contentType: 'application/json',
		  data: JSON.stringify(formData),
		  success: function(data) {
				
				if(data.status ==1){
					if(data.message){
						projectDir = dir;
						setAutoComplete(formData.language,data.message);
					}
				}else{
					alert('Error')
					console.log(data);
				}
				
		  },
		  error: function(jqXHR, textStatus, errorThrown) {
			console.error('Error: ' + textStatus, errorThrown);
		  }
		});
			

			
	}).on('filetreeclicked', function(e, data)	{ 
			console.log('tree',data); 		
	});
	
	
	//monaco
	//save to file
	window.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.key === 's') {
          event.preventDefault();          
          saveContent();
        }
	});
	
	
	
	
});
