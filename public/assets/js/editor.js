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
var activeTab;//for contex menu
var timeout; //for breadcrumb functions

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
		$('#'+id).addClass('dirty');
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
		editorModels.get(activeEditor).isdirty = false;
		$('#'+activeEditor).removeClass('dirty');
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
			automaticLayout: true,
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
		setGotoDefinition();
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
	var scrollLeftButton = document.getElementById('scroll-left');
	var scrollRightButton = document.getElementById('scroll-right');
	var scrollAmount = 50; // Adjust the scroll amount as needed

	scrollLeftButton.addEventListener('click', function () {
		tabList.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
	});

	scrollRightButton.addEventListener('click', function () {
		tabList.scrollBy({ left: scrollAmount, behavior: 'smooth' });
	});

	Sortable.create(tabList, {
		animation: 150,
		ghostClass: 'sortable-ghost',
		handle: '.tab',
		onEnd: function (evt) {
		console.log('Reordered:', evt.oldIndex, '->', evt.newIndex);
		}
	});
}

function setTabContextMenu(){
	var contextMenu = document.getElementById('context-menu');
	var closeTab = document.getElementById('close-tab');
	var closeOtherTabs = document.getElementById('close-other-tabs');	
	var tabList = document.getElementById('editor-tabs');
	
	tabList.addEventListener('contextmenu', function (event) {
		console.log('tel1');
        event.preventDefault();
        var target = event.target.closest('.tab');
        if (target) {
          activeTab = target;
          contextMenu.style.top = event.clientY + 'px';
          contextMenu.style.left = event.clientX + 'px';
          contextMenu.style.display = 'block';
        }
      });
	document.addEventListener('click', function () {
		console.log('tel2');
		contextMenu.style.display = 'none';
	});

	closeTab.addEventListener('click', function () {
		console.log('tel3');
		if (activeTab) {
			console.log('close tab');
			activeTab.querySelector('.close-tab').click();			
			contextMenu.style.display = 'none';
		}
	});

	closeOtherTabs.addEventListener('click', function () {
		console.log('tel5');
		var tabs = tabList.querySelectorAll('#editor-tabs .tab');
		tabs.forEach(function (tab) {
			if (tab !== activeTab) {
				console.log('close tab');
				tab.querySelector('.close-tab').click();
			}
		});
		contextMenu.style.display = 'none';
	});
}
function openFile(file){
	return new Promise(function(resolve, reject) {
		const formData = {
			fpath: file,			  
		};
		$.ajax({
		  url: 'api/files/read',
		  method: 'POST',
		  contentType: 'application/json',
		  data: JSON.stringify(formData),
		  success: function(data) {			
			resolve(data);
		  },
		  error: function(jqXHR, textStatus, errorThrown) {
			console.error('Error: ' + textStatus, errorThrown);
			reject(errorThrown);
		  }
		});
	});
	
}
function addTabElement(id, fpath){
	const fileName = fpath.split('/').pop();
	const tab = document.createElement('div');
		
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
			showConfirmationDlg('Confirmation','Do you want to save the changes you made to : '+m.fpath+' ?').then(result=>{
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
}
function addTab(fpath,data){
	console.log('fpath',fpath);
	generateHash(fpath).then(function(hash) {
		const id = 't'+hash;
		console.log('id',id);
		if (editorModels.has(id)) {
			console.log('id',id);
			const prevtab = document.getElementById(id);
			if(!prevtab){
				addTabElement(id, fpath);
			}
			switchEditor(id);
		}else{
			addTabElement(id,fpath);			
			editorModels.set(id,{model: createModel(fpath,data), state:null, fpath:fpath, isdirty: false});
			switchEditor(id);			
		}
		bindDragTab();
		
	});
}

var suggestionsMap = new Map();//key: word, value:{state: [0:loading, 1:ready], suggestion:monacosuggestion}
function setGotoDefinition(){
	//https://github.com/microsoft/monaco-editor/issues/2407
	function fetchDefinition(model,word){
		const lang = model.getLanguageId();
		console.log('lang',lang);
		var exts = getExtensionsOfLang(lang);
		if(exts){
			exts = exts.join(',');
		}
		
		$.ajax({
		  url: 'api/definitions',
		  method: 'POST',
		  contentType: 'application/json',
		  data: JSON.stringify({fpath:model.uri.path, extensions: exts, word: word, language: lang}),
		  success: function(data) {
				console.log(data);
				if(data.status==1 && data.message){
					console.log('uxux');
					const item = data.message.function;
					console.log('item',item);
					
					//if this data.message.file not in editormodels then add it
					const fpath = data.message.file;
					generateHash(fpath).then(function(hash) {
						const id = 't'+hash;
						console.log('id',id);
						openFile(fpath).then((data)=>{
							if(!editorModels.has(id)){
								editorModels.set(id,{model: createModel(fpath,data), state:null, fpath:fpath, isdirty: false});
							}
							const sugx = {
								uri: monaco.Uri.file(fpath),
								range: new monaco.Range(item.startLine, item.startColumn, item.endLine, item.endColumn)
							};
							suggestionsMap.set(word, {state:1, suggestion:sugx} );
							console.log('suggestionsMap',suggestionsMap);
						});
					});
						
					
					
				}else{
					
				}		
		  },
		  error: function(jqXHR, textStatus, errorThrown) {
			console.error('Error: ' + textStatus, errorThrown);
			reject(errorThrown);
		  }
		});
	}
	// Function to resolve definitions (placeholder example)
	function getDefinition(model, position) {
		if(!position || !model){
			return null;
		}
		const word = model.getWordAtPosition(position);
		if (!word) return [];
		console.log('word',word.word);
		if(suggestionsMap.has(word.word)){
			const sug = suggestionsMap.get(word.word);
			console.log('found',sug)
			if(sug.state==0){//loading
				return null;
			}
			return sug.suggestion;
		}else{//new
			suggestionsMap.set(word.word, {state:0, suggestion:null});
			fetchDefinition(model,word.word);
		}
		
		return null;
		
	}

	// Register a definition provider for JavaScript
	monaco.languages.registerDefinitionProvider('javascript', {
		provideDefinition: function(model, position, token) {

			return getDefinition(model, position);
		}
	});
	


	// Add Ctrl+Click behavior for "go to definition"
	editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.F12, function() {
		console.log('ctrl');
		const position = editor.getPosition();
		//getDefinition(editor.getModel(), position).then(definitions => {
		var definition = getDefinition(editor.getModel(), position);
		if (definition) {
			console.log('def definition',definition);
            const fpath = definition.uri.path;
			generateHash(fpath).then(function(hash) {
				const id = 't'+hash;
				console.log('id',id);
				const prevtab = document.getElementById(id);
				if(!prevtab){
					addTabElement(id, fpath);
				}
				switchEditor(id);
				editor.setPosition({ lineNumber: definition.range.startLineNumber, column: definition.range.startColumn });
				editor.revealPositionInCenter({ lineNumber: definition.range.startLineNumber, column: definition.range.startColumn });
				editor.getDomNode().style.cursor = 'pointer';
			});
          
        }

	});

	// Add hover for Ctrl+Click
	editor.onMouseDown(function(e) {
		if (e.event.ctrlKey) {
			console.log('def ctrl xx');
			const position = e.target.position;
			console.log('position',position);
			const definition = getDefinition(editor.getModel(), position);
						
			if (definition) {
				console.log('def definition',definition);
				const fpath = definition.uri.path;
				generateHash(fpath).then(function(hash) {
					const id = 't'+hash;
					console.log('id',id);
					const prevtab = document.getElementById(id);
					if(!prevtab){
						addTabElement(id, fpath);
					}
					switchEditor(id);
					editor.setPosition({ lineNumber: definition.range.startLineNumber, column: definition.range.startColumn });
					editor.revealPositionInCenter({ lineNumber: definition.range.startLineNumber, column: definition.range.startColumn });
					editor.getDomNode().style.cursor = 'pointer';
				});
				
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
//TODO: refactor this
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
