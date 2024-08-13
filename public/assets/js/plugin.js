
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
      script.src = url+'?rnd'+Math.random();
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
		modalElem.className = " hidden modal-window";
		
		var iframeurlx = iframeurl+'?rnd'+Math.random();
		modalElem.innerHTML = `
		<div class="modal-header">
			<div class="flex-fill align-items-start col-auto">
				<h5 class="mb-0">${title}</h5>
			</div>	
			<div class="col-auto align-items-end">
				<button type="button" class="close" >x</button>
			</div>
		</div>
    <div class="modal-body">
        <iframe src="${iframeurlx}"></iframe>
    </div>`;
		
		$('body').append(modalElem);	
		makeModalWindow(modalElem);			
		overlayBoxMap.set(boxId,modalElem);
		
	}
	$(modalElem).removeClass('hidden').addClass('visible');
	$(modalElem).find('.close').on('click', function() {
		$(modalElem).removeClass('visible').addClass('hidden');
		setTimeout(function(){
			//$('#'+boxId).remove();
			//overlayBoxMap.delete(boxId);
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

