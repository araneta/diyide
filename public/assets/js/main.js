const extensionToLanguageMap = {
  '.js': 'javascript',
  '.html': 'html',
  '.css': 'css',
  '.json': 'json',
  '.go': 'go',
  '.xml': 'xml',
  '.py': 'python',
  '.java': 'java',
  '.rb': 'ruby',
  '.php': 'php',
  '.cpp': 'c++',
  '.cs': 'c#',
  '.ts': 'typeScript',
  '.jsx': 'javascript',
  '.tsx': 'typeScript',
  '.md': 'Markdown',
  '.sh': 'sh',
  '.bat': 'bat',
  '.sql': 'sql',
  // Add more mappings as needed
};
function getFileExtension(fileName) {
  const lastDotIndex = fileName.lastIndexOf('.');
  return lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
}
function getExtensionsOfLang(lang) {
  return Object.keys(extensionToLanguageMap).filter(key => extensionToLanguageMap[key] === lang);
}
function getFileLang(fpath){		
	const extension = getFileExtension(fpath);
	const lang = extensionToLanguageMap[extension.toLowerCase()] || 'Unknown';
	return lang;
}
require.config({ paths: { 'vs': '/assets/package/min/vs' }});

var editor;
const container = document.getElementById('editor-container');
const tabsContainer = document.getElementById('editor-tabs');
const breadcrumbsDiv = document.getElementById('breadcrumbs');
const functionDropdown = document.getElementById('functionDropdown');

let activeEditor = null;		
var projectDir = '';
var editorModels = new Map();//key:hash fpath, val:{model:monaco model, state: monaco state, fpath:file path}


// Function to update breadcrumbs
function updateBreadcrumbs() {
	console.log('change');
	const model = editor.getModel();
	const code = model.getValue();
	const formData = {
		fpath: model.uri.path,
		buffer: code,
		language: getFileLang(model.uri.path),
	};
	
	$.ajax({
	  url: 'api/parser',
	  method: 'POST',
	  contentType: 'application/json',
	  data: JSON.stringify(formData),
	  success: function(data) {
			//console.log(data);
			if(data.status==1){
				const functions = data.message.functions;
				
				functionDropdown.innerHTML = '<option value="">Select a function...</option>';
				functions.forEach(func => {
				  const option = document.createElement('option');
				  option.value = func.line;
				  option.textContent = func.name;
				  functionDropdown.appendChild(option);
				});
				// Event listener for select dropdown change
				  functionDropdown.addEventListener('change', function() {
					const lineNumber = parseInt(this.value, 10);
					if (!isNaN(lineNumber)) {
					  editor.revealPositionInCenter({ lineNumber, column: 1 });
					  editor.setPosition({ lineNumber, column: 1 });
					  editor.focus();
					}
				  });
				/*
				functions.forEach(func => {
						const breadcrumb = document.createElement('span');
						breadcrumb.className = 'breadcrumb';
						breadcrumb.textContent = func.name;
						breadcrumb.onclick = () => {
							const npos = { lineNumber: func.line, column: 1 };
							console.log(npos);
							editor.revealPositionInCenter(npos);
							editor.setPosition(npos);
							editor.focus();
						};
						breadcrumbsDiv.appendChild(breadcrumb);
				});*/
			}
	  },
	  error: function(jqXHR, textStatus, errorThrown) {
		console.error('Error: ' + textStatus, errorThrown);
	  }
	});
	
	
}
function loadEditor(){
	require(["vs/editor/editor.main"], function () {
		
		console.log('monaco ready');
		editor = monaco.editor.create(container, {
			value: 'loremimdsf sdfsd dsfds',
			language: 'javascript',
			theme: 'vs-dark',
			 breadcrumbs: {
			  enabled: true,
			  useNative: false, // Use custom breadcrumb rendering
			  separator: ' > ', // Customize the separator
			}
		});
		editor.getDomNode().style.display = 'block';
		editor.layout();
		 // Update breadcrumbs on editor content change
		editor.onDidChangeModelContent(updateBreadcrumbs);
	});
}
loadEditor();

jQuery(document).ready(function($){
	console.log('ready');
	
	// Standard
	// script.js
	const splitter = document.getElementById('splitter');
	const pane1 = document.getElementById('pane1');
	const pane2 = document.getElementById('pane2');
	const firstRow = document.getElementById('first-row');
	const divHeight = ($(window).height()-$('#first-row').height()-20);
	$('#pane1').css('height', divHeight+'px');;

	let isDragging = false;

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
	var tid = 0;
	$('#frmFolder').submit(function(e){
		e.preventDefault();
		
		const data = Object.fromEntries(new FormData(e.target).entries());
		const title = data.folderpath;
		console.log(data)
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
	function switchEditor(id) {
		console.log('switch',id);
		var currentState = editor.saveViewState();
		console.log('activeEditor',activeEditor);
		if(activeEditor){
			var mod = editorModels.get(activeEditor);
			console.log('editorModels',editorModels);
			console.log('mod',mod)
			if(mod){
				editorModels.get(activeEditor).state = currentState;
			}
		}
						
		var sel = editorModels.get(id);
		editor.setModel(sel.model);
		editor.restoreViewState(sel.state);
		editor.focus();
		editor.getDomNode().style.display = 'block';
		editor.layout();
		activeEditor = id;	
		
		$('.tabs .tab').removeClass('active');
		$('#'+id).addClass('active'); 
		updateBreadcrumbs();
	}
	function generateHash(input) {
      return new Promise(function(resolve, reject) {
        try {
          const encoder = new TextEncoder();
          const data = encoder.encode(input);
          crypto.subtle.digest('SHA-256', data).then(function(hashBuffer) {
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(function(b) {
              return b.toString(16).padStart(2, '0');
            }).join('');
            resolve(hashHex);
          }).catch(reject);
        } catch (error) {
          reject(error);
        }
      });
    }
	function closeEditor(id,fpath){
		console.log('close',id);
		var m = editorModels.get(id);
		monaco.editor.getModels().forEach(function(model){
			console.log(model.uri.path);
			if(fpath==model.uri.path){
				console.log('found');
			 model.dispose();
			}
		});

		editorModels.delete(id);
		$('#'+id).remove();
		console.log('editorModels',editorModels);
		const entries = Array.from(editorModels.entries());
		if (entries.length > 0) {
			const firstEntry = entries[0];
			const id = firstEntry[0];
			switchEditor(id);
		}
	}
	
	function addTab(fpath,data){
		generateHash(fpath).then(function(hash) {
			const id = 't'+hash;
			console.log('id',id);
			if (editorModels.has(id)) {
				console.log('id',id);
				switchEditor(id);
			}else{
				
				const fileName = fpath.split('/').pop();
				const tab = document.createElement('div');
				
				console.log('hash',hash);
				tab.id = id;
				tab.title = fpath;
				tab.className = 'tab';
				tab.innerText = fileName;
				tab.onclick = () => switchEditor(id);
				//close
				const closetab = document.createElement('div');
				closetab.className = 'close-tab';
				closetab.innerText = 'x';
				closetab.onclick = function(e){
					e.stopPropagation();
					closeEditor(id,fpath);
				};
				tab.appendChild(closetab);
				
				tabsContainer.appendChild(tab);
				editorModels.set(id,{model: createModel(fpath,data), state:null, fpath:fpath});
				switchEditor(id);			
			}
		});
	}
	
	function createModel(fpath,data){					
		return monaco.editor.createModel(data, getFileLang(fpath), monaco.Uri.file(fpath));
	}
	// Fetch available files and directories from the server
	function fetchFiles(extensions) {
		return new Promise(function(resolve, reject) {
			$.ajax({
			  url: 'api/files',
			  method: 'POST',
			  contentType: 'application/json',
			  data: JSON.stringify({dir:projectDir, extensions: extensions}),
			  success: function(data) {
				console.log(data);
					if(data.status==1 && data.message.length>0){
					  var ret = data.message.map(function(file) {
						  return {
							label: file,
							kind: monaco.languages.CompletionItemKind.File,
							insertText: file,
							documentation: 'Import from ' + file
						  };
					  });
					  resolve(ret);
				  }else{
					  resolve([]);
				  }		
			  },
			  error: function(jqXHR, textStatus, errorThrown) {
				console.error('Error: ' + textStatus, errorThrown);
				reject(errorThrown);
			  }
			});
		});
		
		
	}


	var cachedFiles = null;

	function setAutoComplete(lang, allWords){
		
		monaco.languages.registerCompletionItemProvider(lang, {
			provideCompletionItems: function(model, position) {
				const extensions = getExtensionsOfLang(lang);
				if(lang=='javascript'){
					var textUntilPosition = model.getValueInRange({
					startLineNumber: 1,
					startColumn: 1,
					endLineNumber: position.lineNumber,
					endColumn: position.column
				  });

				  var textLine = textUntilPosition.split('\n').pop();
				  var importMatch = textLine.match(/import\s.*\sfrom\s['"]([^'"]*)$/);

				  if (importMatch) {
					if (!cachedFiles) {
					  return fetchFiles(extensions).then(function(files) {
						  console.log('files',files);
						cachedFiles = files;
						var pathPrefix = importMatch[1];
						var suggestions = cachedFiles.filter(function(file) {
						  return file.label.indexOf(pathPrefix) === 0;
						});
						return { suggestions: suggestions };
					  });
					} else {
					  var pathPrefix = importMatch[1];
					  var suggestions = cachedFiles.filter(function(file) {
						return file.label.indexOf(pathPrefix) === 0;
					  });
					  return { suggestions: suggestions };
					}
				  }

				}
				const suggestions2 = allWords.map(word => ({
					label: word,
					kind: monaco.languages.CompletionItemKind.Text,
					insertText: word
				}));
				return { suggestions: suggestions2 };
			}
		});
	}
	
	
	
});
