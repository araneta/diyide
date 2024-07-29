


jQuery(document).ready(function($){
	console.log('ready');
		
	
	const divHeight = ($(window).height()-$('#first-row').height()-20);
	$('#pane1').css('height', divHeight+'px');;

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
	
	var tid = 0;
	loadEditor();
	//forms
	$('#frmFolder').submit(function(e){
		e.preventDefault();
		
		const data = Object.fromEntries(new FormData(e.target).entries());
		const title = data.folderpath;
		console.log(data)
		openDir(data.folderpath);
		document.title = title;
		/*
		$('.dirFiles').fileTree({script: 'api/files/filetree', root: data.folderpath }, function(file) {
			console.log(file);
			
			const formData = {
			  fpath: file,			  
			};

			$.ajax({
			  url: 'api/files/read',
			  method: 'POST',
			  contentType: 'application/json',
			  data: JSON.stringify(formData),
			  success: function(data) {
				const fileName = file.split('/').pop();				
				document.title = title;
				addTab(file,data);
			  },
			  error: function(jqXHR, textStatus, errorThrown) {
				console.error('Error: ' + textStatus, errorThrown);
			  }
			});
			

			$('.dirFiles').fileTree({script: 'api/files/filetree', root: file }, function(file) {
				//alert(file);
			});	
		}).on('filetreeclicked', function(e, data)	{ 
			console.log('tree',data); 
		});	
		*/
		
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
          //const content = editor.getValue();
          //saveFile(content, 'code.js');
          console.log('activeEditor',activeEditor);
          //console.log('content',content);
          const formData = {
			  fpath: editorModels.get(activeEditor).fpath,		
			  buffer: editor.getValue()	  
			};
          $.ajax({
			  url: 'api/files/write',
			  method: 'POST',
			  contentType: 'application/json',
			  data: JSON.stringify(formData),
			  success: function(data) {
				console.log(data);
			  },
			  error: function(jqXHR, textStatus, errorThrown) {
				console.error('Error: ' + textStatus, errorThrown);
			  }
			});
        }
      });

	
	//metod2
	
	
	
	
	
	
});
