
(function() {
  class FindInFilesPlugin extends Plugin {
    init(manager) {
		console.log("FindInFilesPlugin initialized.");
		// Interact with the manager or host application
		const findInFilesBtn = document.createElement('button');	
		findInFilesBtn.className = 'btn';
		findInFilesBtn.innerText = 'Find Files';
		findInFilesBtn.onclick = function(e){
			e.stopPropagation();			
			alert('test');
		};
		$('#bottomToolbar').append($(findInFilesBtn));
      
    }
  }

  // Register the plugin instance with the PluginManager
  pluginManager.registerPluginInstance(new FindInFilesPlugin());
})();
