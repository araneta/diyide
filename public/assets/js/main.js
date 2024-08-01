jQuery(document).ready(function($){
	setStatusProcess('ready');
		
	function adjustLayout(){
		const divHeight = ($(window).height()-$('.first-row').height()-$('.status-row').height()-3);
		$('#pane1').css('height', divHeight+'px');;
		var we = $('#editor-container').width();
		$('#editor-tabs').css('maxWidth',we+"px");
		  editor.layout();
	}
	
	$( window ).bind( "resize", adjustLayout ); 
	setTimeout(function(){
		adjustLayout();
	},2000);
	
	$(window).on("error", function(evt) {		
		var e = evt.originalEvent; // get the javascript event		
		if (e.message) { 
			alert("Error:\n\t" + e.message + "\nLine:\n\t" + e.lineno + "\nFile:\n\t" + e.filename);
		} else {
			alert("Error:\n\t" + e.type + "\nElement:\n\t" + (e.srcElement || e.target));
		}
	});
	
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
	let lastFolder = localStorage.getItem('lastFolder');
	if(lastFolder){
		$('#folderpath').val(lastFolder);
	}

	$('#frmFolder').submit(function(e){
		e.preventDefault();
		
		const data = Object.fromEntries(new FormData(e.target).entries());
		const title = data.folderpath;
		
		openDir(data.folderpath);
		//save to local storage
		localStorage.setItem("lastFolder", data.folderpath);

		document.title = title;		
		$('.second-row').removeClass('d-none');
		$('.status-row').removeClass('d-none');
		adjustLayout();
	});
	
	$('#frmAutocomplete').submit(function(e){
		e.preventDefault();
		const dir = $('#folderpath').val();
		var formData = Object.fromEntries(new FormData(e.target).entries());
		formData.root = dir;
		
		//get words for auto complete
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
					
				}
				
		  },
		  error: function(jqXHR, textStatus, errorThrown) {
			console.error('Error: ' + textStatus, errorThrown);
			alert('Error: ' + textStatus);
		  }
		});
			
		
			
	}).on('filetreeclicked', function(e, data)	{ 
			
	});
	
	
	//monaco
	//save to file
	window.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.key === 's') {
          event.preventDefault();          
          saveContent();
        }
	});
	
	function handleBeforeUnload(e) {
		// Iterating over values
		var isDirty = false;
		for (const value of editorModels.values()) {
			
			if(value.isdirty){
				isDirty = true;
				break;
			}
		}		
		if (isDirty) {
			e.preventDefault();
			e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
		}
	}

	window.addEventListener('beforeunload', handleBeforeUnload);

	setTabContextMenu();
	
	$('#syntaxtree').jstree({
		'core': {
		'data': null
		}
	});
});
