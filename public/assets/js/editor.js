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
var suggestionsMap = new Map();//key: word, value:{state: [0:loading, 1:ready], suggestion:monacosuggestion}
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
        <button id="modal-btn-descartar" type="button" class="">No</button>
        <button id="modal-btn-aceptar" type="button" class="">Yes</button>
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
function saveAllTabs(){
	for (const [key, value] of editorModels.entries()) {
		//console.log(key, value);
		
		const formData = {
		  fpath: value.fpath,		
		  buffer: value.model.getValue()	  
		};
		setStatusProcess('Saving: '+value.fpath);
		$.ajax({
		  url: 'api/files/write',
		  method: 'POST',
		  contentType: 'application/json',
		  data: JSON.stringify(formData),
		  success: function(data) {			
				if(data=='ok'){
					setStatusProcess('Done');
					value.isdirty = false;
					generateHash(value.fpath).then(function(hash) {
						const id = 't'+hash;		
						$('#'+id).removeClass('dirty');
					});
				}else{
				  setStatusProcess(data.message);
				  alert(data.message);
				}
				
				
		  },
		  error: function(jqXHR, textStatus, errorThrown) {
				console.error('Error: ' + textStatus, errorThrown);
				alert('Error: ' + textStatus);
		  }
		});
		
	}
}
function saveContent(){
	setStatusProcess('Saving...');
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
			if(data=='ok'){
				setStatusProcess('Done');
				editorModels.get(activeEditor).isdirty = false;
				$('#'+activeEditor).removeClass('dirty');
				updateFileStructurePanel();
			}else{
			  setStatusProcess(data.message);
			  alert(data.message);
			}
			
			
	  },
	  error: function(jqXHR, textStatus, errorThrown) {
			console.error('Error: ' + textStatus, errorThrown);
			alert('Error: ' + textStatus);
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
function logCursorPosition() {
	const position = editor.getPosition();
	$('#statusLine').html(`Line: ${position.lineNumber}, Column: ${position.column}`);
}
function loadEditor(){
	require(["vs/editor/editor.main"], function () {				
		editor = monaco.editor.create(container, {
			value: 'Welcome!',
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
		editor.onDidChangeCursorPosition(() => {
			logCursorPosition();
		});
		logCursorPosition();
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
		
		}
	});
}
function copyToClipboard(text) {
    if (window.clipboardData && window.clipboardData.setData) {
        // Internet Explorer-specific code path to prevent textarea being shown while dialog is visible.
        return window.clipboardData.setData("Text", text);

    }
    else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
        var textarea = document.createElement("textarea");
        textarea.textContent = text;
        textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in Microsoft Edge.
        document.body.appendChild(textarea);
        textarea.select();
        try {
            return document.execCommand("copy");  // Security exception may be thrown by some browsers.
        }
        catch (ex) {
            console.warn("Copy to clipboard failed.", ex);
            return prompt("Copy to clipboard: Ctrl+C, Enter", text);
        }
        finally {
            document.body.removeChild(textarea);
        }
    }
}

function setTabContextMenu(){
	var contextMenu = document.getElementById('context-menu');
	var closeTab = document.getElementById('close-tab');
	var closeOtherTabs = document.getElementById('close-other-tabs');	
	var copyPath = document.getElementById('copy-path');	
	var tabList = document.getElementById('editor-tabs');
	
	tabList.addEventListener('contextmenu', function (event) {
		
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
		
		contextMenu.style.display = 'none';
	});

	closeTab.addEventListener('click', function () {
		
		if (activeTab) {
			
			activeTab.querySelector('.close-tab').click();			
			contextMenu.style.display = 'none';
		}
	});

	closeOtherTabs.addEventListener('click', function () {
		
		var tabs = tabList.querySelectorAll('#editor-tabs .tab');
		tabs.forEach(function (tab) {
			if (tab !== activeTab) {
				
				tab.querySelector('.close-tab').click();
			}
		});
		contextMenu.style.display = 'none';
	});
	
	copyPath.addEventListener('click', function (event) {
		
        if (activeTab) {			
			copyToClipboard(activeTab.title);
		}
	});
}
function openFileThenAddToTab(file){
	setStatusProcess('Opening file: '+file);
	openFile(file).then((data)=>{
		const fileName = file.split('/').pop();											
		addTab(file,data);
		setStatusProcess('Done');
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
			alert('Error: ' + textStatus);
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
	
	generateHash(fpath).then(function(hash) {
		const id = 't'+hash;
		
		if (editorModels.has(id)) {
			
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


function setGotoDefinition(){
	//https://github.com/microsoft/monaco-editor/issues/2407
	function fetchDefinition(model,word){
		const lang = model.getLanguageId();
		
		var exts = getExtensionsOfLang(lang);
		if(exts){
			exts = exts.join(',');
		}
		setStatusProcess('Fetching definition: '+word);
		$.ajax({
		  url: 'api/definitions',
		  method: 'POST',
		  contentType: 'application/json',
		  data: JSON.stringify({fpath:model.uri.path, extensions: exts, word: word, language: lang}),
		  success: function(data) {
				
				if(data.status==1 && data.message){
					setStatusProcess('Found definition: '+word);
					const item = data.message.function;
					
					
					//if this data.message.file not in editormodels then add it
					const fpath = data.message.file;
					if(fpath){
						
						generateHash(fpath).then(function(hash) {
							const id = 't'+hash;
							
							openFile(fpath).then((data)=>{
								if(!editorModels.has(id)){
									editorModels.set(id,{model: createModel(fpath,data), state:null, fpath:fpath, isdirty: false});
								}
								const sugx = {
									uri: monaco.Uri.file(fpath),
									range: new monaco.Range(item.startLine, item.startColumn, item.endLine, item.endColumn)
								};
								suggestionsMap.set(word, {state:1, suggestion:sugx} );
								goToDefinition(sugx);
							});
						});
					}else{
						suggestionsMap.set(word, {state:1, suggestion:null} );
					
					}
					
					
				}else{
					
				}		
		  },
		  error: function(jqXHR, textStatus, errorThrown) {
			console.error('Error: ' + textStatus, errorThrown);
			alert('Error: ' + textStatus);
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
		
		if(suggestionsMap.has(word.word)){
			const sug = suggestionsMap.get(word.word);
			
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
	
	function goToDefinition(definition){
		const fpath = definition.uri.path;
		generateHash(fpath).then(function(hash) {
			const id = 't'+hash;
			
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

	// Add Ctrl+Click behavior for "go to definition"
	editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.F12, function() {
		
		const position = editor.getPosition();
		//getDefinition(editor.getModel(), position).then(definitions => {
		var definition = getDefinition(editor.getModel(), position);
		if (definition) {
			goToDefinition(definition);                      
        }

	});

	// Add hover for Ctrl+Click
	editor.onMouseDown(function(e) {
		if (e.event.ctrlKey) {
			
			const position = e.target.position;
			
			const definition = getDefinition(editor.getModel(), position);
						
			if (definition) {				
				goToDefinition(definition);				
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
	
	var currentState = editor.saveViewState();
	
	if(activeEditor){
		var mod = editorModels.get(activeEditor);
		
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
	updateFileStructurePanel();
	adjustLayout();
}

function closeEditor(id,fpath){
	
	
	monaco.editor.getModels().forEach(function(model){
		
		if(fpath==model.uri.path){			
		 model.dispose();
		}
	});

	editorModels.delete(id);
	editorModels.delete(id);
	$('#'+id).remove();
	$('#syntaxtree').empty().jstree('destroy');
	functionDropdown.innerHTML ='';
	
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

function updateFileStructurePanel(){
	const model = editor.getModel();
	const code = model.getValue();
	const formData = {
		fpath: model.uri.path,
		buffer: code,
		language: getFileLang(model.uri.path),
	};
	$.ajax({
	  url: 'api/tree-structure',
	  method: 'POST',
	  contentType: 'application/json',
	  data: JSON.stringify(formData),
	  success: function(data) {			
			if(data){
				if(data.status==1){					
					const existing = $("#syntaxtree").jstree(true);
					if(existing){
						existing.destroy();
					}
					const jsTreeData = convertToJsTreeFormat(data.message);
					$('#syntaxtree').jstree({
						'core': {
						'data': jsTreeData
						}
					});
					$('#syntaxtree').on("select_node.jstree", function (e, data) {
						const node = data.node;
						const startLine = node.data.startLine;
						if (startLine) {
							//alert(`Start Line: ${startLine}`);
							const lineNumber = parseInt(startLine, 10);
					
							if (!isNaN(lineNumber)) {
							  editor.revealPositionInCenter({ lineNumber, column: 1 });
							  editor.setPosition({ lineNumber, column: 1 });
							  editor.focus();
							}
						}
					});
				}else{
					alert('Error '+data.message);
				}
			}
	  },
	  error: function(jqXHR, textStatus, errorThrown) {
		console.error('Error: ' + textStatus, errorThrown);
		alert('Error: ' + textStatus);
		
	  }
	});
}
function convertObjectProperties(properties) {
	if (!properties || !Array.isArray(properties)) {
		return [];
	}
	return properties.map(prop => {
		if (prop.type === "object") {
			return {
				text: `${prop.name} (Line: ${prop.startLine})`,
				children: convertObjectProperties(prop.properties),
				icon: 'fa fa-cube',
				data: { startLine: prop.startLine },
			};
		} else {
			return {
				text: `${prop.type.charAt(0).toUpperCase() + prop.type.slice(1)}: ${prop.name} (Line: ${prop.startLine})`,
				icon: 'fa fa-cube',
				data: { startLine: prop.startLine }
			};
		}
	});
}

function convertToJsTreeFormat(treeStructure) {
	const jsTreeData = [];

	if (treeStructure.classes) {
		treeStructure.classes.forEach(cls => {
			const classNode = {
				text: `${cls.name}`,
				icon: 'fa fa-sitemap',
				children: [],
				data: { startLine: null },

			};

			cls.methods.forEach(method => {
				classNode.children.push({
					text: `${method.name} (Line: ${method.startLine})`,
					icon: 'fa fa-fire',
					data: { startLine: method.startLine }

				});
			});

			cls.fields.forEach(field => {
				if (field.type === "object") {
					classNode.children.push({
						text: `${field.name} (Line: ${field.startLine})`,
						icon: 'fa fa-cube',
						children: convertObjectProperties(field.properties),
						data: { startLine: field.startLine },

					});
				} else {
					classNode.children.push({
						text: `${field.name} (Line: ${field.startLine})`,
						icon: 'fa fa-snowflake',
						data: { startLine: field.startLine }

					});
				}
			});

			jsTreeData.push(classNode);
		});
	}

	if (treeStructure.functions) {
		treeStructure.functions.forEach(func => {
			jsTreeData.push({
				text: `${func.name} (Line: ${func.startLine})`,
				icon: 'fa fa-bolt',
				data: { startLine: func.startLine }
			});
		});
	}

	if (treeStructure.variables) {
		treeStructure.variables.forEach(variable => {
			jsTreeData.push({
				text: `${variable.name} (Line: ${variable.startLine})`,
				icon: 'fa fa-asterisk',
				data: { startLine: variable.startLine }

			});
		});
	}

	return jsTreeData;
}

