
class Plugin {
  init() {
    throw "Plugin init() method must be implemented.";
  }
}
// app.js
class PluginManager {
  constructor() {
    this.plugins = [];
  }

  loadPlugin(plugin) {
    if (plugin && typeof plugin.init === 'function') {
      this.plugins.push(plugin);
      plugin.init(this);
      console.log(`Plugin ${plugin.constructor.name} loaded.`);
    } else {
      console.error("Invalid plugin.");
    }
  }

  loadPluginScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => {
        // Plugin class should be registered during script load
        const pluginInstance = this.pendingPluginInstance;
        if (pluginInstance) {
          this.loadPlugin(pluginInstance);
          resolve(pluginInstance);
          this.pendingPluginInstance = null; // Clear the pending plugin instance
        } else {
          reject(new Error(`Plugin instance not found for script ${url}`));
        }
      };
      script.onerror = () => reject(new Error(`Failed to load script ${url}`));
      document.head.appendChild(script);
    });
  }

  registerPluginInstance(pluginInstance) {
    this.pendingPluginInstance = pluginInstance;
  }
}
var overlayBoxMap = new Map();
function createOverlayBox(boxId,title, iframeurl, onloadEvent){
	var modalElem;
	if(overlayBoxMap.has(boxId)){
		modalElem = overlayBoxMap.get(boxId);
	}else{
		modalElem = document.createElement('div');
		modalElem.id = boxId;		
		modalElem.className = "overlay-container hidden";
		modalElem.innerHTML = `
		<div class="resize-handle" ></div>
		<div class="header row py-1 mt-2">
			<div class="flex-fill align-items-start col-auto">
				<h5 class="mb-0">${title}</h5>
			</div>	
			<div class="col-auto align-items-end">
				<button type="button" class="close" >x</button>
			</div>	
		</div>		
		`;
		var ifrm = document.createElement("iframe");
        ifrm.setAttribute("src", iframeurl);
        ifrm.style.width = "100%";
        ifrm.style.height = "100%";
        ifrm.style.overflow = 'hidden';
        ifrm.width = "100%";
        ifrm.height = "100%";
        ifrm.frameborder=0;
        ifrm.onload = onloadEvent;
        modalElem.append(ifrm);
		$('body').append(modalElem);				
		overlayBoxMap.set(boxId,modalElem);
		
		let isResizing = false;
		let lastMouseY;
		const handle = $(modalElem).find('.resize-handle');
		handle.on('mousedown', function(e) {
			isResizing = true;
			lastMouseY = e.clientY;
			$('body').on('mousemove', onMouseMove);
			$('body').on('mouseup', onMouseUp);
			e.preventDefault(); // Prevent text selection
		});

		function onMouseMove(e) {
			if (!isResizing) return;
			const overlay = $(modalElem);
			const newHeight = overlay.height() - (e.clientY - lastMouseY);
			overlay.css('height', newHeight);
			lastMouseY = e.clientY;
		}

		function onMouseUp() {
			isResizing = false;
			$('body').off('mousemove', onMouseMove);
			$('body').off('mouseup', onMouseUp);
		}
	}
	$(modalElem).removeClass('hidden').addClass('visible');
	$(modalElem).find('.close').on('click', function() {
		$(modalElem).removeClass('visible').addClass('hidden');
		setTimeout(function(){
			$('#'+boxId).remove();
			overlayBoxMap.delete(boxId);
		}, 1000);
		
	});
	return modalElem;
}
function createBottomToolbarButton(title, callback){
	const findInFilesBtn = document.createElement('button');	
	findInFilesBtn.className = 'btn';
	findInFilesBtn.innerText = title;
	findInFilesBtn.onclick = callback;
	$('#bottomToolbar').append($(findInFilesBtn));
}
const pluginManager = new PluginManager();

