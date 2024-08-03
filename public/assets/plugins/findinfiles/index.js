
(function() {
  class FindInFilesPlugin extends Plugin {
    init(manager) {
		console.log("FindInFilesPlugin initialized.");
		// Interact with the manager or host application
		createBottomToolbarButton('Find in files', function(e){
			e.stopPropagation();			
			createOverlayBox('findInFilesOverlay','Find in files', '/assets/plugins/findinfiles/dialog.html');			
		});
		
    }
  }

  // Register the plugin instance with the PluginManager
  pluginManager.registerPluginInstance(new FindInFilesPlugin());
})();
