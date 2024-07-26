require.config({ paths: { 'vs': 'https://unpkg.com/monaco-editor@latest/min/vs' }});
window.MonacoEnvironment = { getWorkerUrl: () => proxy };

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
	});
}
//todo:
//1. add button open folder and language
jQuery(document).ready(function($){
	console.log('ready');
	loadEditor();
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

				addTab(tid, fileName);
				createEditor(tid, data);
				switchEditor(tid);
			  },
			  error: function(jqXHR, textStatus, errorThrown) {
				console.error('Error: ' + textStatus, errorThrown);
			  }
			});
			

			$('.dirFiles').fileTree({script: 'api/files/filetree', root: file }, function(file) {
				//alert(file);
			});	
		});	
	});
	
	
	//monaco
	const editors = {};
	let activeEditor = null;
	const container = document.getElementById('editor-container');
	const tabsContainer = document.getElementById('editor-tabs');
	
	function createEditor(id, content) {
		const editor = monaco.editor.create(container, {
			value: content || '',
			language: 'javascript'
		});
		editors[id] = editor;
		return editor;
	}

	function switchEditor(id) {
		if (activeEditor) {
		  activeEditor.getDomNode().style.display = 'none';
		}
		activeEditor = editors[id];
		activeEditor.getDomNode().style.display = 'block';
		activeEditor.layout();
	}

	function addTab(id, title) {
		console.log('add',id,title);
		const tab = document.createElement('div');
		tab.className = 'tab';
		tab.innerText = title;
		tab.onclick = () => switchEditor(id);
		tabsContainer.appendChild(tab);
	}
});
