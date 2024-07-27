require.config({ paths: { 'vs': 'https://unpkg.com/monaco-editor@latest/min/vs' }});
window.MonacoEnvironment = { getWorkerUrl: () => proxy };
var editor;
const container = document.getElementById('editor-container');
const tabsContainer = document.getElementById('editor-tabs');
const editors = {};
let activeEditor = null;		
var editorModels = new Map();//key:hash fpath, val:{model:monaco model, state: monaco state, fpath:file path}



let proxy = URL.createObjectURL(new Blob([`
	self.MonacoEnvironment = {
		baseUrl: 'https://unpkg.com/monaco-editor@latest/min/'
	};
	importScripts('https://unpkg.com/monaco-editor@latest/min/vs/base/worker/workerMain.js');
`], { type: 'text/javascript' }));
function loadEditor(){
	require(["vs/editor/editor.main"], function () {
		/*let editor = monaco.editor.create(document.getElementById('container'), {
			value: [
				'function x() {',
				'\tconsole.log("Hello world!");',
				'}'
			].join('\n'),
			language: 'javascript',
			theme: 'vs-dark'
		});*/
		console.log('monaco ready');
		editor = monaco.editor.create(container, {
			value: 'loremimdsf sdfsd dsfds',
			language: 'javascript',theme: 'vs-dark'
		});
		editor.getDomNode().style.display = 'block';
		editor.layout();
	});
}
loadEditor();
//todo:
//1. add button open folder and language
jQuery(document).ready(function($){
	console.log('ready');
	
	// Standard
	// script.js
	const splitter = document.getElementById('splitter');
	const pane1 = document.getElementById('pane1');
	const pane2 = document.getElementById('pane2');

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
		
		var formData = Object.fromEntries(new FormData(e.target).entries());
		formData.root = $('#folderpath').val();
		console.log(formData);

		$.ajax({
		  url: 'api/files/words',
		  method: 'POST',
		  contentType: 'application/json',
		  data: JSON.stringify(formData),
		  success: function(data) {
				
				if(data.status ==1){
					if(data.message){
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
	function getFileExtension(fileName) {
	  const lastDotIndex = fileName.lastIndexOf('.');
	  return lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
	}

	function createModel(fpath,data){
		
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
		const extension = getFileExtension(fpath);
		const lang = extensionToLanguageMap[extension.toLowerCase()] || 'Unknown';
		return monaco.editor.createModel(data, lang, monaco.Uri.file(fpath));
	}
	
	function setAutoComplete(lang, allWords){
		
		monaco.languages.registerCompletionItemProvider(lang, {
			provideCompletionItems: function(model, position) {
			  const suggestions = allWords.map(word => ({
				label: word,
				kind: monaco.languages.CompletionItemKind.Text,
				insertText: word
			  }));
			  return { suggestions: suggestions };
			}
		});
	}
	
});
