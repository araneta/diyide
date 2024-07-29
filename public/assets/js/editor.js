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
let activeEditor = null;		
var projectDir = '';
var editorModels = new Map();//key:hash fpath, val:{model:monaco model, state: monaco state, fpath:file path, isdirty:true/false}
var editor;
require.config({ paths: { 'vs': '/assets/package/min/vs' }});

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

function createModel(fpath,data){		
	console.log('fpath',fpath);			
	return monaco.editor.createModel(data, getFileLang(fpath), monaco.Uri.file(fpath));
}
function showConfirmationDlg(title, msg) {
  const modalElem = document.createElement('div')
  modalElem.id = "modal-confirm"
  modalElem.className = "modal"
  modalElem.innerHTML = `
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">    
		<div class="modal-header">
			<h5 class="modal-title">${title}</h5>
			<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
		  </div>         
        <div class="modal-body fs-6">
          <p>${msg}</p>          
      </div>    <!-- modal-body -->
      <div class="modal-footer" style="border-top:0px">             
        <button id="modal-btn-descartar" type="button" class="btn btn-secondary">No</button>
        <button id="modal-btn-aceptar" type="button" class="btn btn-primary">Yes</button>
      </div>
    </div>
  </div>
  `
  const myModal = new bootstrap.Modal(modalElem, {
    keyboard: false,
    backdrop: 'static'
  })
  myModal.show()

  return new Promise((resolve, reject) => {
    document.body.addEventListener('click', response)

    function response(e) {
      let bool = false
      if (e.target.id == 'modal-btn-descartar') bool = false
      else if (e.target.id == 'modal-btn-aceptar') bool = true
      else return

      document.body.removeEventListener('click', response)
      document.body.querySelector('.modal-backdrop').remove()
      modalElem.remove()
      resolve(bool)
    }
  })
}

var timeout;
function onChangeModelContent(){
	console.log('change');
	clearTimeout(timeout);
	timeout = setTimeout(function() {
	   updateBreadcrumbs();
	}, 3000); // <-- choose some sensible value here                                      
	
	setDirtyStatus();
}
function setDirtyStatus(){
	const model = editor.getModel();
	const fpath = model.uri.path;
	generateHash(fpath).then(function(hash) {
		const id = 't'+hash;
		editorModels.get(id).isdirty = true;
	});
}
function saveContent(){
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
// Function to update breadcrumbs
function updateBreadcrumbs() {
		
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
				  option.value = func.startLine;
				  option.textContent = func.name;
				  functionDropdown.appendChild(option);
				});
				// Event listener for select dropdown change
				  functionDropdown.addEventListener('change', function() {
					const lineNumber = parseInt(this.value, 10);
					console.log('onchange',this.value, lineNumber);
					if (!isNaN(lineNumber)) {
					  editor.revealPositionInCenter({ lineNumber, column: 1 });
					  editor.setPosition({ lineNumber, column: 1 });
					  editor.focus();
					}
				  });				
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
		editor.onDidChangeModelContent(onChangeModelContent);
		//setGotoDefinition();
	});
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
function bindDragTab(){
	var tabList = document.getElementById('editor-tabs');
	console.log('onx;');

	Sortable.create(tabList, {
		animation: 150,
		ghostClass: 'sortable-ghost',
		handle: '.tab',
		onEnd: function (evt) {
		console.log('Reordered:', evt.oldIndex, '->', evt.newIndex);
		}
	});
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
				var m = editorModels.get(id);
				if(m.isdirty){
					showConfirmationDlg('Confirmation','Do you want to save the changes?').then(result=>{
						console.log('res',result);
						if(result){
							saveContent();
						}
						closeEditor(id,fpath);
					});	
					
				}else{
					closeEditor(id,fpath);
				}
				
			};
			tab.appendChild(closetab);
			
			tabsContainer.appendChild(tab);
			editorModels.set(id,{model: createModel(fpath,data), state:null, fpath:fpath, isdirty: false});
			switchEditor(id);			
		}
		bindDragTab();
	});
}
function setGotoDefinition(){
	// Function to resolve definitions (placeholder example)
	function getDefinition(model, position) {
		const word = model.getWordAtPosition(position);
		if (!word) return [];
		console.log('word',word);
		const lang = model.getLanguageId();
		console.log('lang',lang);
		return new Promise(function(resolve, reject) {
			$.ajax({
			  url: 'api/definitions',
			  method: 'POST',
			  contentType: 'application/json',
			  data: JSON.stringify({dir:projectDir, extensions: getExtensionsOfLang(lang), word: word.word, language: lang}),
			  success: function(data) {
				console.log(data);
					if(data.status==1 && data.message.length>0){
					  var ret = data.message.map(function(item) {
						  return {
							uri: monaco.Uri.file(item.file),
							range: new monaco.Range(item.startLine, item.startColumn, item.endLine, item.endColumn)
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

	// Register a definition provider for JavaScript
	monaco.languages.registerDefinitionProvider('javascript', {
		provideDefinition(model, position) {
			return getDefinition(model, position);
		}
	});

	// Add Ctrl+Click behavior for "go to definition"
	editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.F12, function() {
		const position = editor.getPosition();
		getDefinition(editor.getModel(), position).then(definitions => {
          if (definitions.length > 0) {
            const definition = definitions[0];
            switchModel(definition.uri.path.split('/').pop()); // Switch to the model containing the definition
            editor.setPosition({ lineNumber: definition.range.startLineNumber, column: definition.range.startColumn });
            editor.revealPositionInCenter({ lineNumber: definition.range.startLineNumber, column: definition.range.startColumn });
          }
        });

	});

	// Add hover for Ctrl+Click
	editor.onMouseDown(function(e) {
		if (e.event.ctrlKey) {
			const position = e.target.position;
			const definitions = getDefinition(editor.getModel(), position);
			if (definitions.length > 0) {
				editor.getDomNode().style.cursor = 'pointer';
			} else {
				editor.getDomNode().style.cursor = 'default';
			}
		}
	});

	editor.onMouseUp(function(e) {
		editor.getDomNode().style.cursor = 'default';
	});
}

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

function closeEditor(id,fpath){
	console.log('close',id);
	
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

function getImportMatch(lang,textLine){
	var importMatch = null;
	if(lang=='javascript'){
		importMatch = textLine.match(/import\s.*\sfrom\s['"]([^'"]*)$/);
	}
	return importMatch;
}

function setAutoComplete(lang, allWords){
	
	monaco.languages.registerCompletionItemProvider(lang, {
		provideCompletionItems: function(model, position) {
			const extensions = getExtensionsOfLang(lang);
			
				var textUntilPosition = model.getValueInRange({
				startLineNumber: 1,
				startColumn: 1,
				endLineNumber: position.lineNumber,
				endColumn: position.column
			  });

			  var textLine = textUntilPosition.split('\n').pop();
			  var importMatch = getImportMatch(lang, textLine);

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

			
			const suggestions2 = allWords.map(word => ({
				label: word,
				kind: monaco.languages.CompletionItemKind.Text,
				insertText: word
			}));
			return { suggestions: suggestions2 };
		}
	});
}
