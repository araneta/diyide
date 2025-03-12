const wh = $(window).height();
var folderPath;
function getFolderPath(){
	return folderPath;
}
function adjustLayout(){	
	const fh = $('.first-row').outerHeight();
	const sh = $('.status-row').outerHeight();
	const mh = $('#myTab').outerHeight();
	const divHeight = (wh-fh-sh-mh-1);
	
	$('#pane1').css('height', divHeight+'px');;
	var we = $('#editor-container').width();
	$('#editor-tabs').css('maxWidth',we+"px");
	editor.layout();
	
	$('#right-pane-content').css('height', divHeight+'px');
}
function makeModalWindow(selector) {
        $(selector).draggable({
            handle: ".modal-header",
            scroll: false, // Prevent jumping issues by disabling scroll while dragging
            containment: "window" // Keep the modal within the window boundaries
        }).resizable({
            handles: 'n, e, s, w, ne, nw, se, sw',
            //alsoResize: $(selector).find('iframe'),
            alsoResize: ".modal-content",
            minHeight: 150, // Minimum height for smoother shrinking
            minWidth: 200,  // Minimum width for smoother shrinking
            /*resize: function(event, ui) {
                // Adjust the modal-body height on resize for smoother resizing
                ui.element.find('.modal-body').height(ui.size.height - ui.element.find('.modal-header').outerHeight());
            }*/
        });

        $(selector).find('.close-btn').on('click', function() {
            $(selector).hide();
        });
    }

jQuery(document).ready(function($){
	setStatusProcess('ready');
		
	$(window).on('shown.bs.modal', function(event) { 		
		var shownModal = $(event.target);
		//makeModalWindow(shownModal);
	});
	
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
	
	
	let isDragging2 = false;	
	
	//splitter
	splitter2.addEventListener('mousedown', (e) => {
		isDragging2 = true;
		document.addEventListener('mousemove', onMouseMove2);
		document.addEventListener('mouseup', onMouseUp2);
	});

	function onMouseMove2(e) {
		if (!isDragging2) return;

		let containerOffsetLeft = pane2.offsetLeft;
		let newLeftWidth = e.clientX - containerOffsetLeft;

		let containerWidth = pane2.clientWidth;
		let splitterWidth = splitter2.clientWidth;

		mainpane.style.width = newLeftWidth + 'px';
		rightpane.style.width = (containerWidth - newLeftWidth - splitterWidth) + 'px';
	}

	function onMouseUp2() {
		isDragging2 = false;
		document.removeEventListener('mousemove', onMouseMove2);
		document.removeEventListener('mouseup', onMouseUp2);
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
		folderPath = data.folderpath;
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
	
    $('#saveCurrentTabBtn').click(function(){
		saveContent();
	});
	$('#saveAllTabsBtn').click(function(){
		saveAllTabs();
	});
	$('#closeFolderBtn').click(function(){
		location.reload();
	});
	
	
	 // Load and initialize the plugin
	 console.log('loading plugins',pluginFiles);
	 for(var pi=0;pi<pluginFiles.length;pi++){
		 const pfile = '/assets/plugins/'+pluginFiles[pi]+'/index.js';
		 console.log('loading..',pfile);
		pluginManager.loadPluginScript(pfile)
		.then(plugin => {
			console.log(`${plugin.constructor.name} has been successfully loaded and initialized.`);
		})
		.catch(error => {
			console.error(error.message);
		});
	}

	
});
